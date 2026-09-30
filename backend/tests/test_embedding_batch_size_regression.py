"""
Focused regression test suite for:
1. GeminiEmbeddingService batch_size attribute access & configuration
2. End-to-end ingestion workflow with real batch_size usage
3. DocumentType.SCHEDULE enum validation
4. Verified chunk indexing in ChromaDB
5. Retry indexing and cleanup
"""
import sys
import asyncio
import logging
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import db_manager, get_database
from app.models.knowledge import DocumentType, DocumentStatus
from app.services.embedding_service import GeminiEmbeddingService, embedding_service
from app.services.knowledge_service import knowledge_service
from app.services.vector_store import vector_store

logger = logging.getLogger("test_regression")


def test_gemini_embedding_service_batch_size_attributes():
    """Verify batch_size exists at both class and instance level on GeminiEmbeddingService."""
    # 1. Class-level attributes
    assert hasattr(GeminiEmbeddingService, "DEFAULT_BATCH_SIZE"), "GeminiEmbeddingService must have DEFAULT_BATCH_SIZE"
    assert hasattr(GeminiEmbeddingService, "batch_size"), "GeminiEmbeddingService must have class-level batch_size"
    assert GeminiEmbeddingService.DEFAULT_BATCH_SIZE == 5
    assert GeminiEmbeddingService.batch_size == 5

    # 2. Default instance
    svc_default = GeminiEmbeddingService()
    assert hasattr(svc_default, "batch_size"), "Instance must have batch_size attribute"
    assert svc_default.batch_size == 5

    # 3. Custom batch_size instance
    svc_custom = GeminiEmbeddingService(batch_size=10)
    assert svc_custom.batch_size == 10

    # 4. Global singleton instance
    assert hasattr(embedding_service, "batch_size"), "Global embedding_service singleton must have batch_size"
    assert embedding_service.batch_size == 5


def test_document_type_schedule_enum():
    """Verify DocumentType includes SCHEDULE to prevent HTTP 422 on frontend upload."""
    assert hasattr(DocumentType, "SCHEDULE"), "DocumentType must include SCHEDULE"
    assert DocumentType.SCHEDULE.value == "SCHEDULE"
    assert DocumentType("SCHEDULE") == DocumentType.SCHEDULE


@pytest.mark.asyncio
async def test_full_workflow_and_batch_size_regression():
    """Verify upload, chunking, embedding with batch size, ChromaDB verification, retry, and deletion."""
    await db_manager.connect()

    content = b"""# Universal Immunization Protocol Guidelines 2026
## Measles-Rubella (MR) Schedule
MR-1 is administered between 9-12 months of age as 0.5 mL subcutaneous injection.
MR-2 is administered between 16-24 months of age.

## Japanese Encephalitis (JE) Schedule
JE-1 is administered at 9-12 months in endemic districts.
JE-2 is administered at 16-24 months.
"""
    # 1. Upload & Create Document
    doc = await knowledge_service.upload_and_create_document(
        filename="regression_uip_schedule.md",
        content=content,
        title="UIP Schedule Regression Test",
        uploaded_by="admin_test",
        document_type=DocumentType.SCHEDULE,
        run_synchronously=True,
    )
    doc_id = doc["id"]

    try:
        # 2. Check DB status & chunk count
        db_doc = await knowledge_service.get_document(doc_id)
        assert db_doc is not None, "Document must exist in MongoDB"
        assert db_doc["status"] == DocumentStatus.INDEXED.value, f"Status must be INDEXED, got {db_doc['status']}"
        assert db_doc["chunk_count"] > 0, "Chunk count must be greater than 0"
        total_chunks = db_doc["chunk_count"]

        # 3. Verify chunks in ChromaDB
        chroma_count = vector_store.get_document_chunk_count(doc_id)
        assert chroma_count == total_chunks, f"ChromaDB chunks ({chroma_count}) must match doc chunk_count ({total_chunks})"

        # 4. Test Idempotent Retry Indexing directly from disk
        retry_res = await knowledge_service.retry_document_indexing(doc_id, run_synchronously=True)
        assert retry_res is not None
        db_doc_after_retry = await knowledge_service.get_document(doc_id)
        assert db_doc_after_retry["status"] == DocumentStatus.INDEXED.value
        assert vector_store.get_document_chunk_count(doc_id) == total_chunks

    finally:
        # 5. Clean deletion: vectors, disk file, and MongoDB record
        del_ok = await knowledge_service.delete_document(doc_id)
        assert del_ok is True, "Document must be deleted successfully"
        assert vector_store.get_document_chunk_count(doc_id) == 0, "ChromaDB vectors must be purged"
        assert await knowledge_service.get_document(doc_id) is None, "Document must be removed from DB"

    await db_manager.disconnect()


if __name__ == "__main__":
    print("Running batch_size unit tests...")
    test_gemini_embedding_service_batch_size_attributes()
    test_document_type_schedule_enum()
    print("Unit tests passed.")

    print("Running full async workflow regression...")
    asyncio.run(test_full_workflow_and_batch_size_regression())
    print("All regression tests passed successfully!")
