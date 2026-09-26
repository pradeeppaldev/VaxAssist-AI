"""
Knowledge Base & RAG API Endpoints.
Provides Admin-only endpoints for document upload, indexing, re-indexing, metadata management,
and deletion; plus authenticated RAG querying with strict evidence-grounded clinical responses.
"""
from typing import Optional, List, Dict, Any
from datetime import date
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
    Path,
)

from app.api.deps import get_current_user, require_admin
from app.models.knowledge import DocumentType, SourceAuthority, DocumentStatus
from app.schemas.common import APIResponse
from app.schemas.knowledge import (
    KnowledgeDocumentResponse,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentUpdateRequest,
    KnowledgeDocumentStatusResponse,
    KnowledgeBaseMetricsResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from app.services.knowledge_service import knowledge_service
from app.services.rag_service import rag_service
from app.services.embedding_service import GeminiAPIError, GeminiAPIKeyMissingError
from app.services.vector_store import VectorStoreError

router = APIRouter()


# =========================================================================
# ADMIN-ONLY KNOWLEDGE DOCUMENT MANAGEMENT ENDPOINTS
# =========================================================================

@router.post(
    "/documents",
    response_model=APIResponse[KnowledgeDocumentResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index a knowledge document (Admin only)",
)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, TXT, MD)"),
    title: str = Form(..., min_length=2, max_length=200, description="Document title"),
    description: Optional[str] = Form(None, max_length=1000, description="Brief description"),
    document_type: Optional[DocumentType] = Form(DocumentType.GUIDELINE, description="Document classification"),
    source_authority: Optional[SourceAuthority] = Form(SourceAuthority.MOHFW, description="Authoritative organization"),
    source_url: Optional[str] = Form(None, description="Official public source URL"),
    publication_date: Optional[str] = Form(None, description="ISO publication date (YYYY-MM-DD)"),
    current_user: dict = Depends(require_admin),
):
    """
    Uploads a trusted immunization guideline or policy document.
    Validates file format, extracts structured text, generates semantic chunks,
    calculates Gemini Embedding 2 vectors, and indexes into persistent ChromaDB.
    """
    pub_date: Optional[date] = None
    if publication_date:
        try:
            pub_date = date.fromisoformat(publication_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid publication_date format. Please use YYYY-MM-DD.",
            )

    try:
        content = await file.read()
        doc = await knowledge_service.upload_and_index_document(
            filename=file.filename or "document.pdf",
            content=content,
            title=title,
            uploaded_by=current_user["id"],
            description=description,
            document_type=document_type,
            source_authority=source_authority,
            source_url=source_url,
            publication_date=pub_date,
        )
        return APIResponse[KnowledgeDocumentResponse](
            success=True,
            message="Knowledge document uploaded and indexed successfully into ChromaDB.",
            data=KnowledgeDocumentResponse(**doc),
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except GeminiAPIKeyMissingError as key_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(key_err),
        )
    except GeminiAPIError as api_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API error during embedding generation: {str(api_err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(exc)}",
        )


@router.get(
    "/documents",
    response_model=APIResponse[KnowledgeDocumentListResponse],
    summary="List knowledge documents with filtering and search (Admin only)",
)
async def list_documents(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (INDEXED, FAILED, etc.)"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    source_authority: Optional[str] = Query(None, description="Filter by source authority"),
    search: Optional[str] = Query(None, description="Search query across title and description"),
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(require_admin),
):
    """Retrieves paginated list of knowledge documents matching criteria."""
    result = await knowledge_service.list_documents(
        status=status_filter,
        document_type=document_type,
        source_authority=source_authority,
        search_query=search,
        limit=limit,
        skip=skip,
    )
    docs = [KnowledgeDocumentResponse(**d) for d in result["documents"]]
    return APIResponse[KnowledgeDocumentListResponse](
        success=True,
        message=f"Retrieved {len(docs)} knowledge documents.",
        data=KnowledgeDocumentListResponse(documents=docs, total=result["total"]),
    )


@router.get(
    "/documents/metrics",
    response_model=APIResponse[KnowledgeBaseMetricsResponse],
    summary="Get Knowledge Base and ChromaDB storage metrics (Admin only)",
)
async def get_metrics(
    current_user: dict = Depends(require_admin),
):
    """Returns aggregate metrics on documents, chunks, and storage."""
    metrics = await knowledge_service.get_metrics()
    return APIResponse[KnowledgeBaseMetricsResponse](
        success=True,
        message="Knowledge Base metrics retrieved successfully.",
        data=KnowledgeBaseMetricsResponse(**metrics),
    )


@router.get(
    "/documents/{document_id}",
    response_model=APIResponse[KnowledgeDocumentResponse],
    summary="Get knowledge document details by ID (Admin only)",
)
async def get_document(
    document_id: str = Path(..., description="Knowledge document ID"),
    current_user: dict = Depends(require_admin),
):
    """Retrieves comprehensive metadata and indexing status for a document."""
    doc = await knowledge_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge document with ID '{document_id}' not found.",
        )
    return APIResponse[KnowledgeDocumentResponse](
        success=True,
        message="Document details retrieved.",
        data=KnowledgeDocumentResponse(**doc),
    )


@router.patch(
    "/documents/{document_id}",
    response_model=APIResponse[KnowledgeDocumentResponse],
    summary="Update document metadata (Admin only)",
)
async def update_document(
    req: KnowledgeDocumentUpdateRequest,
    document_id: str = Path(..., description="Knowledge document ID"),
    current_user: dict = Depends(require_admin),
):
    """Updates editable metadata properties for a knowledge document."""
    doc = await knowledge_service.update_document_metadata(document_id, req)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge document with ID '{document_id}' not found.",
        )
    return APIResponse[KnowledgeDocumentResponse](
        success=True,
        message="Document metadata updated successfully.",
        data=KnowledgeDocumentResponse(**doc),
    )


@router.delete(
    "/documents/{document_id}",
    response_model=APIResponse[Dict[str, Any]],
    summary="Delete a knowledge document and its vector embeddings (Admin only)",
)
async def delete_document(
    document_id: str = Path(..., description="Knowledge document ID"),
    current_user: dict = Depends(require_admin),
):
    """
    Deletes the document record from MongoDB, completely purges its vectors
    from persistent ChromaDB, and removes the physical file from disk.
    """
    deleted = await knowledge_service.delete_document(document_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge document with ID '{document_id}' not found.",
        )
    return APIResponse[Dict[str, Any]](
        success=True,
        message=f"Document '{document_id}' and all associated vector embeddings successfully deleted.",
        data={"deleted": True, "document_id": document_id},
    )


@router.post(
    "/documents/{document_id}/reindex",
    response_model=APIResponse[KnowledgeDocumentResponse],
    summary="Re-index an existing knowledge document idempotently (Admin only)",
)
async def reindex_document(
    document_id: str = Path(..., description="Knowledge document ID"),
    current_user: dict = Depends(require_admin),
):
    """
    Idempotently re-indexes a document:
    Deletes old vectors from ChromaDB, re-chunks, regenerates embeddings,
    and updates the document status to INDEXED with an incremented index version.
    """
    try:
        doc = await knowledge_service.reindex_document(document_id)
        return APIResponse[KnowledgeDocumentResponse](
            success=True,
            message="Document re-indexed successfully. ChromaDB vectors updated.",
            data=KnowledgeDocumentResponse(**doc),
        )
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(val_err))
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(fnf))
    except GeminiAPIError as g_err:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(g_err))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-indexing failed: {str(exc)}",
        )


@router.get(
    "/documents/{document_id}/status",
    response_model=APIResponse[KnowledgeDocumentStatusResponse],
    summary="Check document indexing status (Admin only)",
)
async def get_document_status(
    document_id: str = Path(..., description="Knowledge document ID"),
    current_user: dict = Depends(require_admin),
):
    """Lightweight endpoint for polling document indexing progress and errors."""
    doc = await knowledge_service.get_document(document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge document '{document_id}' not found.",
        )
    return APIResponse[KnowledgeDocumentStatusResponse](
        success=True,
        message=f"Document status: {doc['status']}",
        data=KnowledgeDocumentStatusResponse(
            id=doc["id"],
            title=doc["title"],
            status=doc["status"],
            chunk_count=doc.get("chunk_count", 0),
            index_version=doc.get("index_version", 1),
            error_message=doc.get("error_message"),
            indexed_at=doc.get("indexed_at"),
        ),
    )


# =========================================================================
# AUTHENTICATED RAG QUERY ENDPOINT (PATIENT, HEALTHCARE_WORKER, ADMIN)
# =========================================================================

@router.post(
    "/query",
    response_model=APIResponse[RAGQueryResponse],
    summary="Query Knowledge Base via Grounded RAG (Authenticated Users)",
)
async def query_knowledge_base(
    req: RAGQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Queries the immunization Knowledge Base using semantic search and Gemini LLM.
    Strictly answers ONLY from retrieved context with explicit source citations.
    Protected by clinical guardrails: never invents guidance or schedules.
    """
    try:
        rag_result = await rag_service.query(req)
        return APIResponse[RAGQueryResponse](
            success=True,
            message="Knowledge query executed successfully.",
            data=rag_result,
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except GeminiAPIKeyMissingError as key_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(key_err),
        )
    except GeminiAPIError as api_err:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI inference error: {str(api_err)}",
        )
    except VectorStoreError as vs_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Vector store error: {str(vs_err)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process knowledge query: {str(exc)}",
        )
