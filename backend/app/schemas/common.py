from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[DataT] = None


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: datetime
    database: Dict[str, Any]
