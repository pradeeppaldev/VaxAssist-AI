"""
Knowledge Base Management Service.
Manages knowledge document metadata in MongoDB, coordinates file ingestion,
drives idempotent vector indexing in ChromaDB, and provides admin lifecycle operations.
"""
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, date
from typing import List, Dict, Any, Optional
from bson import ObjectId

from app.database import get_database
from app.config import settings
from app.models.knowledge import (
    KnowledgeDocument,
    DocumentType,
    SourceAuthority,
    DocumentStatus,
)
from app.schemas.knowledge import (
    KnowledgeDocumentUpdateRequest,
    KnowledgeBaseMetricsResponse,
)
from app.services.document_parser import document_parser, EmptyDocumentError
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store

logger = logging.getLogger("vaxassist.knowledge.service")


def format_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Converts MongoDB _id ObjectId to string id."""
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d["_id"])
        del d["_id"]
    return d


class KnowledgeService:
    def __init__(self):
        self.collection_name = "knowledge_documents"

    def get_collection(self):
        db = get_database()
        return db[self.collection_name]

    async def init_indexes(self):
        """Initializes database indexes for the knowledge base collection."""
        coll = self.get_collection()
        try:
            await coll.create_index("status")
            await coll.create_index("source_authority")
            await coll.create_index("document_type")
            await coll.create_index("created_at")
            logger.info("Knowledge Base MongoDB indexes successfully initialized.")
        except Exception as e:
            logger.warning(f"Could not create knowledge base indexes: {e}")

    async def upload_and_index_document(
        self,
        filename: str,
        content: bytes,
        title: str,
        uploaded_by: str,
        description: Optional[str] = None,
        document_type: Optional[DocumentType] = None,
        source_authority: Optional[SourceAuthority] = None,
        source_url: Optional[str] = None,
        publication_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Full ingestion pipeline:
        1. Validates file and persists to backend/data/knowledge/
        2. Creates MongoDB document in PENDING state
        3. Extracts pages, parses text, and checks for scanned/empty documents
        4. Splits into structured text chunks with rich metadata
        5. Embeds chunks via Gemini Embedding 2
        6. Stores vectors in persistent ChromaDB
        7. Transitions document state to INDEXED (or FAILED on error)
        """
        coll = self.get_collection()

        # Step 1: Validate & Save file locally
        file_info = document_parser.validate_and_save_file(filename=filename, content=content)

        doc_type = document_type or DocumentType.GUIDELINE
        src_auth = source_authority or SourceAuthority.MOHFW
        now = datetime.now(timezone.utc)

        # Step 2: Insert initial metadata record in PENDING state
        doc_record = {
            "title": title.strip(),
            "description": description.strip() if description else None,
            "original_filename": file_info["original_filename"],
            "stored_filename": file_info["stored_filename"],
            "file_path": file_info["file_path"],
            "file_size_bytes": file_info["file_size_bytes"],
            "file_hash": file_info["file_hash"],
            "mime_type": file_info["mime_type"],
            "document_type": doc_type.value if hasattr(doc_type, "value") else doc_type,
            "source_authority": src_auth.value if hasattr(src_auth, "value") else src_auth,
            "source_url": source_url.strip() if source_url else None,
            "publication_date": publication_date.isoformat() if publication_date else None,
            "uploaded_by": uploaded_by,
            "status": DocumentStatus.PENDING.value,
            "error_message": None,
            "chunk_count": 0,
            "index_version": 1,
            "chroma_collection_name": settings.CHROMA_COLLECTION_NAME,
            "indexed_at": None,
            "metadata": {},
            "created_at": now,
            "updated_at": now,
        }

        insert_result = await coll.insert_one(doc_record)
        doc_id = str(insert_result.inserted_id)

        # Step 3: Run extraction and indexing
        return await self._process_and_index_document(doc_id=doc_id, file_path=file_info["file_path"])

    async def _process_and_index_document(self, doc_id: str, file_path: str) -> Dict[str, Any]:
        """
        Internal worker that extracts text, embeds, and indexes into ChromaDB.
        Updates MongoDB state to PROCESSING, then INDEXED (or FAILED with message).
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            raise ValueError(f"Knowledge document {doc_id} not found.")

        # Update status to PROCESSING
        now = datetime.now(timezone.utc)
        await coll.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": DocumentStatus.PROCESSING.value, "updated_at": now}},
        )

        try:
            # 1. Text extraction & page scanning
            pages = document_parser.extract_pages(file_path=file_path)

            # 2. Chunking
            chunks = document_parser.chunk_document(
                pages=pages,
                document_id=doc_id,
                document_title=doc["title"],
                source_authority=doc["source_authority"],
                source_url=doc.get("source_url"),
                index_version=doc.get("index_version", 1),
            )

            if not chunks:
                raise ValueError("No meaningful text chunks could be extracted from this document.")

            # 3. Vector Embedding generation via Gemini Embedding 2
            chunk_texts = [c["content"] for c in chunks]
            embeddings = await embedding_service.embed_batch(chunk_texts)

            # 4. Clean any existing vectors for this document in ChromaDB before upserting
            vector_store.delete_document_chunks(doc_id)

            # 5. Persistent ChromaDB upsert
            chunk_ids = [c["id"] for c in chunks]
            metadatas = [c["metadata"] for c in chunks]
            vector_store.upsert_chunks(
                chunk_ids=chunk_ids,
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=metadatas,
            )

            # 6. Update document state to INDEXED
            completion_time = datetime.now(timezone.utc)
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {
                    "$set": {
                        "status": DocumentStatus.INDEXED.value,
                        "chunk_count": len(chunks),
                        "indexed_at": completion_time,
                        "error_message": None,
                        "updated_at": completion_time,
                    }
                },
            )

            updated = await coll.find_one({"_id": ObjectId(doc_id)})
            logger.info(f"Knowledge document '{doc['title']}' ({doc_id}) successfully indexed ({len(chunks)} chunks).")
            return format_doc(updated)

        except Exception as exc:
            # Clean up any partial vectors
            vector_store.delete_document_chunks(doc_id)

            err_msg = str(exc)
            logger.error(f"Indexing failed for document {doc_id}: {err_msg}")
            fail_time = datetime.now(timezone.utc)
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {
                    "$set": {
                        "status": DocumentStatus.FAILED.value,
                        "error_message": err_msg,
                        "updated_at": fail_time,
                    }
                },
            )
            # Re-raise to alert caller
            raise

    async def reindex_document(self, document_id: str) -> Dict[str, Any]:
        """
        Re-indexes an existing knowledge document.
        Idempotent: removes old vectors, increments index version, and re-embeds.
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise ValueError(f"Knowledge document with ID '{document_id}' not found.")

        file_path = doc.get("file_path")
        if not file_path or not Path(file_path).exists():
            raise FileNotFoundError(f"Underlying document file was removed from disk: {file_path}")

        # Increment index version for tracking
        current_version = doc.get("index_version", 1)
        new_version = current_version + 1
        await coll.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"index_version": new_version, "updated_at": datetime.now(timezone.utc)}},
        )

        return await self._process_and_index_document(doc_id=document_id, file_path=file_path)

    async def delete_document(self, document_id: str) -> bool:
        """
        Deletes document metadata from MongoDB, removes vectors from ChromaDB,
        and deletes the physical file from disk.
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(document_id)})
        if not doc:
            return False

        # 1. Remove vectors from ChromaDB
        vector_store.delete_document_chunks(document_id)

        # 2. Remove physical file from disk
        file_path = doc.get("file_path")
        if file_path:
            p = Path(file_path)
            if p.exists():
                try:
                    p.unlink()
                    logger.info(f"Removed document file from disk: {file_path}")
                except Exception as e:
                    logger.warning(f"Could not remove file {file_path}: {e}")

        # 3. Remove document record from MongoDB
        res = await coll.delete_one({"_id": ObjectId(document_id)})
        return res.deleted_count > 0

    async def list_documents(
        self,
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        source_authority: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 50,
        skip: int = 0,
    ) -> Dict[str, Any]:
        """Lists knowledge documents with filtering, search, and pagination."""
        coll = self.get_collection()
        query: Dict[str, Any] = {}

        if status and status != "ALL":
            query["status"] = status
        if document_type and document_type != "ALL":
            query["document_type"] = document_type
        if source_authority and source_authority != "ALL":
            query["source_authority"] = source_authority
        if search_query and search_query.strip():
            # Search in title, description, or original_filename
            rgx = {"$regex": search_query.strip(), "$options": "i"}
            query["$or"] = [{"title": rgx}, {"description": rgx}, {"original_filename": rgx}]

        total = await coll.count_documents(query)
        cursor = coll.find(query).sort("created_at", -1).skip(skip).limit(limit)

        docs = []
        async for item in cursor:
            docs.append(format_doc(item))

        return {"documents": docs, "total": total}

    async def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves single document metadata by ID."""
        coll = self.get_collection()
        try:
            doc = await coll.find_one({"_id": ObjectId(document_id)})
            return format_doc(doc)
        except Exception:
            return None

    async def update_document_metadata(
        self,
        document_id: str,
        req: KnowledgeDocumentUpdateRequest,
    ) -> Optional[Dict[str, Any]]:
        """Updates document metadata fields (title, description, source, etc.)."""
        coll = self.get_collection()
        update_fields: Dict[str, Any] = {}

        if req.title is not None:
            update_fields["title"] = req.title.strip()
        if req.description is not None:
            update_fields["description"] = req.description.strip()
        if req.document_type is not None:
            update_fields["document_type"] = (
                req.document_type.value if hasattr(req.document_type, "value") else req.document_type
            )
        if req.source_authority is not None:
            update_fields["source_authority"] = (
                req.source_authority.value if hasattr(req.source_authority, "value") else req.source_authority
            )
        if req.source_url is not None:
            update_fields["source_url"] = req.source_url.strip() if req.source_url else None
        if req.publication_date is not None:
            update_fields["publication_date"] = req.publication_date.isoformat()

        if not update_fields:
            doc = await coll.find_one({"_id": ObjectId(document_id)})
            return format_doc(doc)

        update_fields["updated_at"] = datetime.now(timezone.utc)
        await coll.update_one({"_id": ObjectId(document_id)}, {"$set": update_fields})
        doc = await coll.find_one({"_id": ObjectId(document_id)})
        return format_doc(doc)

    async def get_metrics(self) -> Dict[str, Any]:
        """Computes aggregate Knowledge Base metrics."""
        coll = self.get_collection()
        total_docs = await coll.count_documents({})
        indexed_docs = await coll.count_documents({"status": DocumentStatus.INDEXED.value})
        processing_docs = await coll.count_documents({"status": DocumentStatus.PROCESSING.value})
        failed_docs = await coll.count_documents({"status": DocumentStatus.FAILED.value})

        total_chunks = vector_store.get_total_chunks()

        # Calculate storage used on disk
        storage_dir = Path(settings.KNOWLEDGE_STORAGE_DIRECTORY)
        total_storage = 0
        if storage_dir.exists():
            for f in storage_dir.glob("*"):
                if f.is_file():
                    total_storage += f.stat().st_size

        return {
            "total_documents": total_docs,
            "indexed_documents": indexed_docs,
            "processing_documents": processing_docs,
            "failed_documents": failed_docs,
            "total_chunks": total_chunks,
            "storage_bytes": total_storage,
        }


knowledge_service = KnowledgeService()
