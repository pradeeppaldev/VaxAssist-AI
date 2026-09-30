"""
Knowledge Base Management Service.
Manages knowledge document metadata in MongoDB, coordinates file ingestion,
drives idempotent vector indexing in ChromaDB, tracks real ingestion job stages,
and provides admin lifecycle operations.
"""
import os
import time
import uuid
import logging
import asyncio
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
    IngestionStage,
    IngestionJobStatus,
)
from app.schemas.knowledge import (
    KnowledgeDocumentUpdateRequest,
    KnowledgeBaseMetricsResponse,
)
from app.services.document_parser import document_parser, EmptyDocumentError
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store, VectorStoreError

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


class IngestionJobManager:
    """In-memory tracker for asynchronous knowledge ingestion jobs."""

    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}

    def create_job(self, document_id: str) -> str:
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        self._jobs[job_id] = {
            "job_id": job_id,
            "document_id": document_id,
            "stage": IngestionStage.UPLOADING.value,
            "stage_description": "Validating and storing document file...",
            "progress_percent": 10,
            "total_chunks": 0,
            "total_batches": 0,
            "completed_batches": 0,
            "current_batch": 0,
            "elapsed_seconds": 0.0,
            "status": IngestionJobStatus.RUNNING.value,
            "error_message": None,
            "created_at": now,
            "updated_at": now,
            "_start_time": time.time(),
        }
        return job_id

    def update_job(
        self,
        job_id: str,
        stage: Optional[str] = None,
        stage_description: Optional[str] = None,
        progress_percent: Optional[int] = None,
        total_chunks: Optional[int] = None,
        total_batches: Optional[int] = None,
        completed_batches: Optional[int] = None,
        current_batch: Optional[int] = None,
        status: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        if job_id not in self._jobs:
            return
        job = self._jobs[job_id]
        now = datetime.now(timezone.utc)
        start_time = job.get("_start_time", time.time())
        job["elapsed_seconds"] = round(time.time() - start_time, 2)
        job["updated_at"] = now

        if stage is not None:
            job["stage"] = stage
        if stage_description is not None:
            job["stage_description"] = stage_description
        if progress_percent is not None:
            job["progress_percent"] = max(0, min(100, progress_percent))
        if total_chunks is not None:
            job["total_chunks"] = total_chunks
        if total_batches is not None:
            job["total_batches"] = total_batches
        if completed_batches is not None:
            job["completed_batches"] = completed_batches
        if current_batch is not None:
            job["current_batch"] = current_batch
        if status is not None:
            job["status"] = status
        if error_message is not None:
            job["error_message"] = error_message

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        job = self._jobs.get(job_id)
        if not job:
            return None
        res = dict(job)
        start_time = res.pop("_start_time", None)
        if start_time and res.get("status") == IngestionJobStatus.RUNNING.value:
            res["elapsed_seconds"] = round(time.time() - start_time, 2)
        return res


job_manager = IngestionJobManager()


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

            # ChromaDB hygiene: Purge orphaned/unindexed chunks
            cursor = coll.find({"status": DocumentStatus.INDEXED.value}, {"_id": 1})
            indexed_ids = {str(doc["_id"]) async for doc in cursor}
            purged = vector_store.purge_orphaned_chunks(indexed_ids)
            if purged > 0:
                logger.info(f"Startup ChromaDB hygiene: purged {purged} orphaned/unindexed chunks.")
        except Exception as e:
            logger.warning(f"Could not initialize knowledge base indexes or clean vectors: {e}")

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Returns the live status of an ingestion job."""
        return job_manager.get_job(job_id)

    async def upload_and_create_document(
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
        run_synchronously: bool = False,
    ) -> Dict[str, Any]:
        """
        Full ingestion pipeline:
        1. Validates file and persists to backend/data/knowledge/
        2. Creates MongoDB document in UPLOADED state
        3. Spawns asynchronous or synchronous background worker to parse, chunk, embed, and index
        4. Returns document metadata with registered job_id
        """
        coll = self.get_collection()

        # Step 1: Validate & Save file locally
        file_info = document_parser.validate_and_save_file(filename=filename, content=content)

        doc_type = document_type or DocumentType.GUIDELINE
        src_auth = source_authority or SourceAuthority.MOHFW
        now = datetime.now(timezone.utc)

        # Step 2: Insert initial metadata record in UPLOADED state
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
            "status": DocumentStatus.UPLOADED.value,
            "error_message": None,
            "last_indexing_error": None,
            "chunk_count": 0,
            "index_version": 1,
            "chroma_collection_name": settings.CHROMA_COLLECTION_NAME,
            "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
            "embedding_dimensions": 3072,
            "tags": [doc_type.value if hasattr(doc_type, "value") else doc_type, src_auth.value if hasattr(src_auth, "value") else src_auth],
            "indexed_at": None,
            "metadata": {},
            "created_at": now,
            "updated_at": now,
        }

        insert_result = await coll.insert_one(doc_record)
        doc_id = str(insert_result.inserted_id)

        # Step 3: Register background ingestion job
        job_id = job_manager.create_job(doc_id)

        # Step 4: Dispatch execution
        if run_synchronously:
            await self._run_ingestion_job(job_id=job_id, doc_id=doc_id, file_path=file_info["file_path"])
        else:
            asyncio.create_task(self._run_ingestion_job(job_id=job_id, doc_id=doc_id, file_path=file_info["file_path"]))

        created_doc = await coll.find_one({"_id": ObjectId(doc_id)})
        result = format_doc(created_doc)
        result["job_id"] = job_id
        return result

    # Alias for backward compatibility
    async def upload_and_index_document(self, *args, **kwargs) -> Dict[str, Any]:
        return await self.upload_and_create_document(*args, **kwargs)

    async def _run_ingestion_job(self, job_id: str, doc_id: str, file_path: str):
        """
        Background worker executing the real ingestion stages:
        PARSING -> CHUNKING -> EMBEDDING -> INDEXING -> VERIFYING -> COMPLETED.
        On failure, maintains the physical file on disk, purges ChromaDB vectors,
        and transitions state to FAILED with detailed diagnostic error.
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            job_manager.update_job(
                job_id,
                stage=IngestionStage.FAILED.value,
                status=IngestionJobStatus.FAILED.value,
                error_message="Document not found.",
                stage_description="Document record not found in database.",
            )
            return

        now = datetime.now(timezone.utc)
        # Update MongoDB status to PARSING
        await coll.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"status": DocumentStatus.PARSING.value, "updated_at": now}},
        )

        try:
            # 1. PARSING STAGE (15%)
            job_manager.update_job(
                job_id,
                stage=IngestionStage.PARSING.value,
                stage_description="Extracting text and scanning pages...",
                progress_percent=15,
                status=IngestionJobStatus.RUNNING.value,
            )
            pages = document_parser.extract_pages(file_path=file_path)

            # 2. CHUNKING STAGE (25%)
            job_manager.update_job(
                job_id,
                stage=IngestionStage.CHUNKING.value,
                stage_description="Splitting document into semantic chunks with clinical metadata...",
                progress_percent=25,
            )
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

            total_chunks = len(chunks)
            batch_size = getattr(embedding_service, "batch_size", 5) or 5
            total_batches = (total_chunks + batch_size - 1) // batch_size

            # Update MongoDB status to EMBEDDING
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {
                    "$set": {
                        "status": DocumentStatus.EMBEDDING.value,
                        "chunk_count": total_chunks,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )

            # 3. EMBEDDING STAGE (30% -> 85%)
            job_manager.update_job(
                job_id,
                stage=IngestionStage.EMBEDDING.value,
                stage_description=f"Generating Gemini Embedding 2 vectors (0/{total_batches} batches, {total_chunks} chunks)...",
                progress_percent=30,
                total_chunks=total_chunks,
                total_batches=total_batches,
                completed_batches=0,
                current_batch=0,
            )

            def on_batch_progress(completed_batches, tot_batches, batch_len, tot_items):
                pct = 30 + int((completed_batches / max(1, tot_batches)) * 55)
                job_manager.update_job(
                    job_id,
                    stage=IngestionStage.EMBEDDING.value,
                    stage_description=f"Generating Gemini Embedding 2 vectors (Batch {completed_batches}/{tot_batches}, {tot_items} chunks)...",
                    progress_percent=min(85, pct),
                    total_chunks=tot_items,
                    total_batches=tot_batches,
                    completed_batches=completed_batches,
                    current_batch=completed_batches,
                )

            chunk_texts = [c["content"] for c in chunks]
            embeddings = await embedding_service.embed_batch(
                chunk_texts,
                batch_size=batch_size,
                progress_callback=on_batch_progress,
            )

            # 4. INDEXING STAGE (88%)
            job_manager.update_job(
                job_id,
                stage=IngestionStage.INDEXING.value,
                stage_description=f"Purging outdated vectors and indexing {total_chunks} embeddings into ChromaDB...",
                progress_percent=88,
            )
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": {"status": DocumentStatus.INDEXING.value, "updated_at": datetime.now(timezone.utc)}},
            )

            # Clean any old vectors for this document
            vector_store.delete_document_chunks(doc_id)

            # Insert new vectors
            chunk_ids = [c["id"] for c in chunks]
            metadatas = [c["metadata"] for c in chunks]
            vector_store.upsert_chunks(
                chunk_ids=chunk_ids,
                embeddings=embeddings,
                documents=chunk_texts,
                metadatas=metadatas,
            )

            # 5. VERIFYING STAGE (95%)
            job_manager.update_job(
                job_id,
                stage=IngestionStage.VERIFYING.value,
                stage_description="Verifying vector store indexing and chunk integrity...",
                progress_percent=95,
            )
            verified_count = vector_store.get_document_chunk_count(doc_id)
            logger.info(f"Verified {verified_count}/{total_chunks} chunks indexed in ChromaDB for document {doc_id}")
            if verified_count != total_chunks:
                raise VectorStoreError(
                    f"Verification mismatch: expected {total_chunks} chunks in ChromaDB, but found {verified_count}."
                )

            # 6. COMPLETED STAGE (100%)
            completion_time = datetime.now(timezone.utc)
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {
                    "$set": {
                        "status": DocumentStatus.INDEXED.value,
                        "chunk_count": total_chunks,
                        "indexed_at": completion_time,
                        "error_message": None,
                        "last_indexing_error": None,
                        "updated_at": completion_time,
                    }
                },
            )

            job_manager.update_job(
                job_id,
                stage=IngestionStage.COMPLETED.value,
                status=IngestionJobStatus.COMPLETED.value,
                stage_description=f"Successfully indexed {total_chunks} chunks in ChromaDB with Gemini Embedding 2.",
                progress_percent=100,
                completed_batches=total_batches,
                current_batch=total_batches,
            )
            logger.info(f"Ingestion job {job_id} successfully completed for document {doc_id} ({total_chunks} chunks).")

        except Exception as exc:
            # Purge partial vectors to ensure ChromaDB consistency
            vector_store.delete_document_chunks(doc_id)

            raw_err = str(exc)
            clean_err = raw_err
            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY in clean_err:
                clean_err = clean_err.replace(settings.GEMINI_API_KEY, "[REDACTED]")

            logger.error(f"Ingestion job {job_id} failed for document {doc_id}: {clean_err}")
            fail_time = datetime.now(timezone.utc)

            # Update document to FAILED (physical file is preserved on disk)
            await coll.update_one(
                {"_id": ObjectId(doc_id)},
                {
                    "$set": {
                        "status": DocumentStatus.FAILED.value,
                        "error_message": clean_err,
                        "last_indexing_error": clean_err,
                        "updated_at": fail_time,
                    }
                },
            )

            job_manager.update_job(
                job_id,
                stage=IngestionStage.FAILED.value,
                status=IngestionJobStatus.FAILED.value,
                error_message=clean_err,
                stage_description=f"Indexing failed: {clean_err}",
            )

    @staticmethod
    def resolve_existing_file_path(doc: Dict[str, Any]) -> Optional[str]:
        """Resolves the physical file path across relative directory invocations."""
        raw_path = doc.get("file_path")
        if raw_path and Path(raw_path).exists() and Path(raw_path).is_file():
            return raw_path

        stored_name = doc.get("stored_filename") or (Path(raw_path).name if raw_path else None)
        candidates = []
        if raw_path:
            candidates.extend([
                Path(raw_path),
                Path("..") / raw_path,
                Path("backend") / raw_path,
            ])
        if stored_name:
            candidates.extend([
                Path(settings.KNOWLEDGE_STORAGE_DIRECTORY) / stored_name,
                Path("data/knowledge") / stored_name,
                Path("backend/data/knowledge") / stored_name,
                Path("..") / "data/knowledge" / stored_name,
            ])

        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return str(candidate)
        return None

    async def retry_document_indexing(self, document_id: str, run_synchronously: bool = False) -> Dict[str, Any]:
        """
        Retries indexing a document from the already-persisted file on disk.
        Does not require re-uploading the original binary.
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise ValueError(f"Knowledge document with ID '{document_id}' not found.")

        file_path = self.resolve_existing_file_path(doc)
        if not file_path:
            raise FileNotFoundError(f"Underlying document file was removed from disk: {doc.get('file_path')}")

        # Purge partial vectors
        vector_store.delete_document_chunks(document_id)

        # Update status to RETRY_PENDING
        await coll.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"status": DocumentStatus.RETRY_PENDING.value, "updated_at": datetime.now(timezone.utc)}},
        )

        job_id = job_manager.create_job(document_id)
        if run_synchronously:
            await self._run_ingestion_job(job_id=job_id, doc_id=document_id, file_path=file_path)
        else:
            asyncio.create_task(self._run_ingestion_job(job_id=job_id, doc_id=document_id, file_path=file_path))

        updated_doc = await coll.find_one({"_id": ObjectId(document_id)})
        res = format_doc(updated_doc)
        res["job_id"] = job_id
        return res

    async def reindex_document(self, document_id: str, run_synchronously: bool = False) -> Dict[str, Any]:
        """
        Re-indexes an existing knowledge document.
        Idempotent: removes old vectors, increments index version, and re-embeds.
        """
        coll = self.get_collection()
        doc = await coll.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise ValueError(f"Knowledge document with ID '{document_id}' not found.")

        file_path = self.resolve_existing_file_path(doc)
        if not file_path:
            raise FileNotFoundError(f"Underlying document file was removed from disk: {doc.get('file_path')}")

        # Increment index version for tracking
        current_version = doc.get("index_version", 1)
        new_version = current_version + 1
        await coll.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"index_version": new_version, "updated_at": datetime.now(timezone.utc)}},
        )

        return await self.retry_document_indexing(document_id=document_id, run_synchronously=run_synchronously)

    async def reindex_all_documents(self) -> Dict[str, Any]:
        """
        Reindexes all knowledge documents stored in MongoDB using their on-disk files.
        """
        coll = self.get_collection()
        cursor = coll.find({})
        total = await coll.count_documents({})
        reindexed = 0
        failed = 0
        skipped = 0
        details = []
        start_time = time.time()

        async for doc in cursor:
            doc_id = str(doc["_id"])
            file_path = self.resolve_existing_file_path(doc)
            title = doc.get("title", doc_id)

            if not file_path:
                skipped += 1
                details.append({
                    "document_id": doc_id,
                    "title": title,
                    "status": "SKIPPED",
                    "reason": "File not found on disk",
                })
                continue

            try:
                new_version = doc.get("index_version", 1) + 1
                await coll.update_one(
                    {"_id": doc["_id"]},
                    {"$set": {"index_version": new_version, "updated_at": datetime.now(timezone.utc)}},
                )
                job_id = job_manager.create_job(doc_id)
                await self._run_ingestion_job(job_id=job_id, doc_id=doc_id, file_path=file_path)
                reindexed += 1
                details.append({
                    "document_id": doc_id,
                    "title": title,
                    "status": "INDEXED",
                    "job_id": job_id,
                })
            except Exception as e:
                failed += 1
                details.append({
                    "document_id": doc_id,
                    "title": title,
                    "status": "FAILED",
                    "error": str(e),
                })

        return {
            "total_documents": total,
            "reindexed_count": reindexed,
            "failed_count": failed,
            "skipped_count": skipped,
            "elapsed_seconds": round(time.time() - start_time, 2),
            "details": details,
        }

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
        file_path = self.resolve_existing_file_path(doc) or doc.get("file_path")
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
        if req.tags is not None:
            update_fields["tags"] = req.tags

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
        processing_docs = await coll.count_documents({
            "status": {
                "$in": [
                    DocumentStatus.UPLOADED.value,
                    DocumentStatus.PARSING.value,
                    DocumentStatus.EMBEDDING.value,
                    DocumentStatus.INDEXING.value,
                    DocumentStatus.RETRY_PENDING.value,
                    DocumentStatus.PENDING.value,
                    DocumentStatus.PROCESSING.value,
                ]
            }
        })
        failed_docs = await coll.count_documents({"status": DocumentStatus.FAILED.value})

        total_chunks = vector_store.get_total_chunks()

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
