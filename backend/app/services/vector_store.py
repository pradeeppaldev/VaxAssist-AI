"""
Persistent ChromaDB Vector Store Engine.
Stores text chunk embeddings and rich metadata for semantic retrieval.
Supports idempotent upserts, document-level cascade deletions, similarity search,
and persistence verification across server restarts.
"""
import os
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb

from app.config import settings

logger = logging.getLogger("vaxassist.knowledge.vector_store")


class VectorStoreError(Exception):
    """Base exception for vector store operations."""
    pass


class ChromaVectorStore:
    """
    Manages local persistent vector storage using ChromaDB.
    Designed with a decoupled interface allowing future migration to server-backed ChromaDB/Qdrant/Pinecone.
    """

    def __init__(
        self,
        persist_directory: Optional[str] = None,
        collection_name: Optional[str] = None,
    ):
        self.persist_dir = Path(persist_directory or settings.CHROMA_PERSIST_DIRECTORY)
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self._client: Optional[chromadb.ClientAPI] = None
        self._collection = None

    def _ensure_initialized(self):
        """Initializes ChromaDB persistent client and collection safely."""
        if self._collection is None:
            self.persist_dir.mkdir(parents=True, exist_ok=True)
            try:
                self._client = chromadb.PersistentClient(path=str(self.persist_dir.resolve()))
                self._collection = self._client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
                logger.info(
                    f"ChromaDB initialized at '{self.persist_dir.resolve()}', collection '{self.collection_name}' "
                    f"({self._collection.count()} chunks currently stored)."
                )
            except Exception as e:
                logger.error(f"Failed to initialize ChromaDB: {e}")
                raise VectorStoreError(f"ChromaDB initialization failure: {str(e)}")

    @property
    def collection(self):
        self._ensure_initialized()
        return self._collection

    def upsert_chunks(
        self,
        chunk_ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[Dict[str, Any]],
    ) -> int:
        """
        Upserts chunk vectors and metadata into the collection.
        If chunk IDs already exist, they are updated; otherwise new entries are created.
        """
        if not chunk_ids:
            return 0

        if len(chunk_ids) != len(embeddings) or len(chunk_ids) != len(documents) or len(chunk_ids) != len(metadatas):
            raise ValueError("Mismatched lengths among chunk_ids, embeddings, documents, and metadatas.")

        try:
            # ChromaDB requires metadata values to be str, int, float, or bool
            sanitized_metadatas = []
            for meta in metadatas:
                sanitized = {}
                for k, v in meta.items():
                    if v is None:
                        sanitized[k] = ""
                    elif isinstance(v, (str, int, float, bool)):
                        sanitized[k] = v
                    else:
                        sanitized[k] = str(v)
                sanitized_metadatas.append(sanitized)

            self.collection.upsert(
                ids=chunk_ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=sanitized_metadatas,
            )
            logger.info(f"Successfully upserted {len(chunk_ids)} chunks into collection '{self.collection_name}'.")
            return len(chunk_ids)
        except Exception as e:
            logger.error(f"Error upserting chunks into ChromaDB: {e}")
            raise VectorStoreError(f"Failed to upsert chunks into vector store: {str(e)}")

    def delete_document_chunks(self, document_id: str) -> int:
        """
        Deletes all chunks belonging to a specific knowledge document.
        Guarantees that re-indexing and document deletion remove old vectors cleanly.
        """
        try:
            coll = self.collection
            matching = coll.get(where={"knowledge_document_id": str(document_id)})
            ids_to_delete = matching.get("ids", [])

            if ids_to_delete:
                coll.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} chunks for document {document_id} from ChromaDB.")
                return len(ids_to_delete)
            return 0
        except Exception as e:
            logger.error(f"Error deleting chunks for document {document_id}: {e}")
            raise VectorStoreError(f"Failed to delete document vectors from ChromaDB: {str(e)}")

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        where_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine similarity search against indexed chunks.
        Returns ordered chunks with normalized similarity scores and metadata.
        """
        try:
            coll = self.collection
            total_items = coll.count()
            if total_items == 0:
                return []

            actual_k = min(top_k, total_items)
            kwargs: Dict[str, Any] = {
                "query_embeddings": [query_embedding],
                "n_results": actual_k,
            }
            if where_filter:
                kwargs["where"] = where_filter

            results = coll.query(**kwargs)

            formatted: List[Dict[str, Any]] = []
            ids = results.get("ids", [[]])[0]
            docs = results.get("documents", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]

            for chunk_id, doc_text, meta, dist in zip(ids, docs, metadatas, distances):
                # For cosine distance in ChromaDB: dist = 1 - cosine_similarity
                # True cosine similarity score in [0.0, 1.0] where 1.0 is identical
                sim_score = max(0.0, min(1.0, 1.0 - float(dist)))
                formatted.append({
                    "id": chunk_id,
                    "content": doc_text,
                    "metadata": meta,
                    "distance": float(dist),
                    "similarity_score": round(sim_score, 4),
                })

            return formatted
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            raise VectorStoreError(f"Vector search query failed: {str(e)}")

    def get_document_chunk_count(self, document_id: str) -> int:
        """Returns the number of vectors stored for a given document."""
        try:
            coll = self.collection
            res = coll.get(where={"knowledge_document_id": str(document_id)})
            return len(res.get("ids", []))
        except Exception:
            return 0

    def get_total_chunks(self) -> int:
        """Returns the total number of vectors in the collection."""
        try:
            return self.collection.count()
        except Exception:
            return 0

    def verify_persistence(self) -> Dict[str, Any]:
        """Verifies collection health and local disk persistence."""
        self._ensure_initialized()
        return {
            "status": "connected",
            "persist_directory": str(self.persist_dir.resolve()),
            "collection_name": self.collection_name,
            "total_chunks": self.get_total_chunks(),
            "exists_on_disk": self.persist_dir.exists(),
        }


vector_store = ChromaVectorStore()
