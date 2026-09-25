from typing import Optional, List, Dict, Any
from pydantic import Field
from app.models.base import MongoBaseModel


class KnowledgeDocument(MongoBaseModel):
    title: str
    source_name: str  # e.g. 'WHO Guidance 2024', 'CDC Immunization Schedule'
    source_url: Optional[str] = None
    content: str
    summary: Optional[str] = None
    category: str = Field(default="general", description="e.g. pediatric, travel, booster, contraindications")
    tags: List[str] = Field(default_factory=list)
    is_indexed_in_chroma: bool = False
    chunk_count: int = 0
    uploaded_by_user_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
