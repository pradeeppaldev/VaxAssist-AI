from enum import Enum
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from pydantic import Field
from app.models.base import MongoBaseModel


class DocumentType(str, Enum):
    GUIDELINE = "GUIDELINE"
    POLICY = "POLICY"
    VACCINE_INFO = "VACCINE_INFO"
    CIRCULAR = "CIRCULAR"
    RESEARCH = "RESEARCH"
    OTHER = "OTHER"


class SourceAuthority(str, Enum):
    WHO = "WHO"
    MOHFW = "MOHFW"
    CDC = "CDC"
    IAP = "IAP"
    OTHER = "OTHER"


class DocumentStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"


class KnowledgeDocument(MongoBaseModel):
    title: str = Field(..., description="Official title of the knowledge document")
    description: Optional[str] = Field(default=None, description="Brief summary or description")
    original_filename: str = Field(..., description="Original name of the uploaded file")
    stored_filename: str = Field(..., description="Sanitized unique filename on disk")
    file_path: str = Field(..., description="Absolute or relative path to the stored file")
    file_size_bytes: int = Field(default=0, description="File size in bytes")
    file_hash: Optional[str] = Field(default=None, description="SHA-256 hash of file content for integrity")
    mime_type: str = Field(default="application/pdf", description="MIME type of document")
    document_type: DocumentType = Field(default=DocumentType.GUIDELINE, description="Classification of document")
    source_authority: SourceAuthority = Field(default=SourceAuthority.MOHFW, description="Authoritative issuing body")
    source_url: Optional[str] = Field(default=None, description="Public URL of the source document")
    publication_date: Optional[date] = Field(default=None, description="Official publication date")
    uploaded_by: str = Field(..., description="User ID of the administrator who uploaded the document")
    status: DocumentStatus = Field(default=DocumentStatus.PENDING, description="Current ingestion & indexing state")
    error_message: Optional[str] = Field(default=None, description="Error details if processing or indexing failed")
    chunk_count: int = Field(default=0, description="Number of text chunks indexed into ChromaDB")
    index_version: int = Field(default=1, description="Version of the chunk index, incremented on re-indexing")
    chroma_collection_name: str = Field(default="vaxassist_knowledge", description="ChromaDB collection storing vectors")
    indexed_at: Optional[datetime] = Field(default=None, description="Timestamp when indexing successfully completed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional custom metadata")
