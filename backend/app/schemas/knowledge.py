from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.knowledge import DocumentType, SourceAuthority, DocumentStatus


class KnowledgeDocumentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    original_filename: str
    file_size_bytes: int = 0
    mime_type: str = "application/pdf"
    document_type: str
    source_authority: str
    source_url: Optional[str] = None
    publication_date: Optional[date] = None
    uploaded_by: str
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    index_version: int = 1
    chroma_collection_name: str = "vaxassist_knowledge"
    indexed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class KnowledgeDocumentUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    document_type: Optional[DocumentType] = None
    source_authority: Optional[SourceAuthority] = None
    source_url: Optional[str] = Field(default=None, max_length=500)
    publication_date: Optional[date] = None


class KnowledgeDocumentStatusResponse(BaseModel):
    id: str
    title: str
    status: str
    chunk_count: int
    index_version: int
    error_message: Optional[str] = None
    indexed_at: Optional[datetime] = None


class KnowledgeDocumentListResponse(BaseModel):
    documents: List[KnowledgeDocumentResponse]
    total: int


class RAGSourceItem(BaseModel):
    document_id: str
    document_title: str
    source_authority: str
    source_url: Optional[str] = None
    page_number: Optional[int] = None
    chunk_index: Optional[int] = None


class RAGRetrievedChunk(BaseModel):
    content: str
    document_id: str
    document_title: str
    source_authority: str
    page_number: Optional[int] = None
    chunk_index: int = 0
    distance: float = 0.0
    similarity_score: float = 0.0


class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000, description="User's query regarding vaccination guidance")
    top_k: Optional[int] = Field(default=None, ge=1, le=10, description="Override maximum number of relevant chunks to retrieve")
    document_type_filter: Optional[str] = Field(default=None, description="Filter retrieval by DocumentType")
    authority_filter: Optional[str] = Field(default=None, description="Filter retrieval by SourceAuthority")


class RAGQueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[RAGSourceItem] = Field(default_factory=list)
    retrieved_chunks: List[RAGRetrievedChunk] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeBaseMetricsResponse(BaseModel):
    total_documents: int = 0
    indexed_documents: int = 0
    processing_documents: int = 0
    failed_documents: int = 0
    total_chunks: int = 0
    storage_bytes: int = 0
