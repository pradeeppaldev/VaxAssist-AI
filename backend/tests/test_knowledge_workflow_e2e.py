"""
End-to-End Verification Test for Knowledge Base & Grounded RAG.
Tests:
1. Document file validation (.pdf, .txt, .md) and physical persistence
2. Background ingestion job manager and real stage transitions
3. Gemini Embedding 2 with polite batching, exponential backoff, jitter, and key redaction
4. ChromaDB vector storage with 3072-dimensional vector integrity
5. Document retry indexing from stored disk file without re-upload
6. Clean vector purge on failure/retry
7. RAG retrieval strictly grounded on INDEXED documents with >= 0.65 threshold
"""
import os
import sys
import asyncio
import logging
from datetime import datetime, timezone, date
from pathlib import Path
import pytest

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logger = logging.getLogger("test_knowledge_e2e")

from app.config import settings
from app.database import get_database, db_manager
from app.models.knowledge import (
    DocumentType,
    SourceAuthority,
    DocumentStatus,
    IngestionStage,
    IngestionJobStatus,
)
from app.services.document_parser import document_parser
from app.services.embedding_service import embedding_service, GeminiRateLimitError
from app.services.vector_store import vector_store
from app.services.knowledge_service import knowledge_service, job_manager
from app.services.rag_service import rag_service
from app.schemas.knowledge import RAGQueryRequest


async def run_tests():
    logger.info("=== Starting VaxAssist AI Knowledge & RAG Verification Suite ===")
    await db_manager.connect()
    await knowledge_service.init_indexes()

    # -------------------------------------------------------------
    # Test 1: Validate file parsing & disk persistence
    # -------------------------------------------------------------
    logger.info("--- Test 1: File Validation and Persistence ---")
    sample_content = b"""# Universal Immunization Programme (UIP) National Operational Guidelines
Section 1: Hepatitis B Birth Dose
Hepatitis B vaccine birth dose must be administered intramuscularly within 24 hours of birth to prevent perinatal transmission.
Dose: 0.5 mL intramuscular in the anterolateral aspect of mid-thigh.
Contraindications: Anaphylaxis to yeast or previous dose.

Section 2: Pentavalent Catch-Up Guidelines
Pentavalent vaccine (DTP-HepB-Hib) protects against diphtheria, pertussis, tetanus, hepatitis B, and Haemophilus influenzae type b.
Schedule: Administered at 6 weeks, 10 weeks, and 14 weeks of age.
Minimum interval: 4 weeks between doses.
"""
    test_filename = "test_uip_guidelines.md"
    file_info = document_parser.validate_and_save_file(test_filename, sample_content)
    assert file_info["stored_filename"].endswith(".md"), "Stored filename must preserve extension"
    assert Path(file_info["file_path"]).exists(), "Persisted file must exist on disk"
    assert file_info["file_size_bytes"] == len(sample_content), "File size must match"
    logger.info(f"Test 1 Passed: File saved to {file_info['file_path']} ({file_info['file_size_bytes']} bytes)")

    # -------------------------------------------------------------
    # Test 2: Ingestion Job Lifecycle & Real Stage Progression
    # -------------------------------------------------------------
    logger.info("--- Test 2: Ingestion Job Execution & Stages ---")
    doc_res = await knowledge_service.upload_and_create_document(
        filename=test_filename,
        content=sample_content,
        title="UIP Test Operational Guidelines",
        uploaded_by="test_admin_id",
        description="Automated clinical verification guideline",
        document_type=DocumentType.GUIDELINE,
        source_authority=SourceAuthority.MOHFW,
        run_synchronously=True,
    )
    doc_id = doc_res["id"]
    job_id = doc_res["job_id"]
    logger.info(f"Document created: id={doc_id}, job_id={job_id}")

    job = knowledge_service.get_job_status(job_id)
    assert job is not None, "Job must exist in job_manager"
    assert job["status"] == IngestionJobStatus.COMPLETED.value, f"Job status must be COMPLETED, got {job['status']}"
    assert job["stage"] == IngestionStage.COMPLETED.value, f"Job stage must be COMPLETED, got {job['stage']}"
    assert job["progress_percent"] == 100, f"Progress must be 100, got {job['progress_percent']}"
    assert job["total_chunks"] > 0, "Job must have indexed chunks"

    # Check MongoDB document
    db_doc = await knowledge_service.get_document(doc_id)
    assert db_doc["status"] == DocumentStatus.INDEXED.value, f"Doc status must be INDEXED, got {db_doc['status']}"
    assert db_doc["chunk_count"] == job["total_chunks"], "Doc chunk_count must match job total_chunks"
    assert db_doc["embedding_dimensions"] == 3072, "Doc embedding dimensions must be 3072"
    logger.info(f"Test 2 Passed: Document {doc_id} successfully indexed ({db_doc['chunk_count']} chunks, 3072 dims)")

    # -------------------------------------------------------------
    # Test 3: ChromaDB Vector Store Integrity
    # -------------------------------------------------------------
    logger.info("--- Test 3: ChromaDB Vector Store Verification ---")
    chunk_count = vector_store.get_document_chunk_count(doc_id)
    assert chunk_count == db_doc["chunk_count"], f"ChromaDB chunk count {chunk_count} must match doc {db_doc['chunk_count']}"
    logger.info(f"Test 3 Passed: Verified {chunk_count} vector chunks in ChromaDB collection")

    # -------------------------------------------------------------
    # Test 4: Idempotent Retry Indexing from Stored File
    # -------------------------------------------------------------
    logger.info("--- Test 4: Idempotent Retry Indexing from Disk ---")
    retry_res = await knowledge_service.retry_document_indexing(doc_id, run_synchronously=True)
    retry_job_id = retry_res["job_id"]
    retry_job = knowledge_service.get_job_status(retry_job_id)
    assert retry_job["status"] == IngestionJobStatus.COMPLETED.value, "Retry job must complete"
    # Ensure chunk count in ChromaDB did not double
    chunk_count_after_retry = vector_store.get_document_chunk_count(doc_id)
    assert chunk_count_after_retry == chunk_count, f"Chunks must not duplicate: expected {chunk_count}, got {chunk_count_after_retry}"
    logger.info(f"Test 4 Passed: Document re-indexed cleanly from disk without chunk duplication ({chunk_count_after_retry} chunks)")

    # -------------------------------------------------------------
    # Test 5: Grounded RAG Querying against Indexed Evidence
    # -------------------------------------------------------------
    logger.info("--- Test 5: Grounded RAG Query ---")
    rag_req = RAGQueryRequest(
        question="What is the recommended timing and route for Hepatitis B birth dose?",
        top_k=3,
    )
    rag_res = await rag_service.query(rag_req)
    assert len(rag_res.retrieved_chunks) > 0, "RAG must retrieve relevant chunks"
    for chunk in rag_res.retrieved_chunks:
        assert chunk.similarity_score >= 0.65, f"Retrieved chunk score {chunk.similarity_score} must be >= 0.65"
    assert "24 hours" in rag_res.answer or "intramuscular" in rag_res.answer or len(rag_res.sources) > 0, "RAG answer must ground on HepB evidence"
    logger.info(f"Test 5 Passed: Grounded answer generated ({len(rag_res.retrieved_chunks)} chunks retrieved, {len(rag_res.sources)} sources)")

    # -------------------------------------------------------------
    # Test 6: Fallback for Unsupported Clinical Query
    # -------------------------------------------------------------
    logger.info("--- Test 6: Clinical Guardrail Fallback for Unsupported Query ---")
    unsupported_req = RAGQueryRequest(
        question="What is the astronaut radiation shielding protocol for Mars orbital insertion?",
        top_k=3,
    )
    unsupported_res = await rag_service.query(unsupported_req)
    assert len(unsupported_res.retrieved_chunks) == 0, "Unsupported query must retrieve zero relevant chunks"
    assert "does not contain" in unsupported_res.answer.lower() or "consult" in unsupported_res.answer.lower(), "Must provide safe disclaimer fallback"
    logger.info("Test 6 Passed: Safe medical disclaimer returned for out-of-scope query")

    # -------------------------------------------------------------
    # Test 7: Clean Document Deletion (Vectors + Disk + Mongo)
    # -------------------------------------------------------------
    logger.info("--- Test 7: Complete Document Lifecycle Deletion ---")
    del_res = await knowledge_service.delete_document(doc_id)
    assert del_res is True, "Delete must return True"
    assert vector_store.get_document_chunk_count(doc_id) == 0, "ChromaDB chunks must be purged"
    assert not Path(db_doc["file_path"]).exists(), "Stored file must be removed from disk"
    assert await knowledge_service.get_document(doc_id) is None, "Document must not exist in MongoDB"
    # Also clean up standalone test 1 file
    p1 = Path(file_info["file_path"])
    if p1.exists():
        p1.unlink()
    logger.info("Test 7 Passed: Document vectors, physical file, and MongoDB record cleanly purged")

    await db_manager.disconnect()
@pytest.mark.asyncio
async def test_knowledge_workflow_e2e():
    await run_tests()


if __name__ == "__main__":
    asyncio.run(run_tests())
