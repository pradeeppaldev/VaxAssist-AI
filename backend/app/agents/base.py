"""
Base Agent Interface and Foundation Components for VaxAssist AI.
Defines standardized interfaces, execution lifecycle, audit metrics,
and error handling across all specialized agents.
"""
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Generic, TypeVar
from datetime import datetime
import time
import uuid
import logging
from pydantic import BaseModel, Field

logger = logging.getLogger("vaxassist.agents.base")

T = TypeVar("T")


class AgentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
    FAILED = "FAILED"


class AgentMetadata(BaseModel):
    agent_id: str
    name: str
    description: str
    version: str = "1.0.0"


class AgentExecutionResult(BaseModel, Generic[T]):
    """Standardized response container for all agent executions."""
    execution_id: str = Field(default_factory=lambda: f"exec_{uuid.uuid4().hex[:12]}")
    agent_id: str
    agent_name: str
    status: AgentStatus = AgentStatus.SUCCESS
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: float = 0.0
    data: Optional[T] = None
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True


class BaseAgent(ABC):
    """
    Abstract base class for all VaxAssist AI specialized agents.
    Enforces standardized execution, lifecycle timing, and logging.
    """

    def __init__(self, agent_id: str, name: str, description: str, version: str = "1.0.0"):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.version = version

    @property
    def metadata(self) -> AgentMetadata:
        return AgentMetadata(
            agent_id=self.agent_id,
            name=self.name,
            description=self.description,
            version=self.version,
        )

    @abstractmethod
    async def execute(self, **kwargs: Any) -> Any:
        """Core execution logic to be implemented by each specialized agent."""
        pass

    async def run(self, **kwargs: Any) -> AgentExecutionResult[Any]:
        """
        Standardized execution wrapper with timing, exception safeguarding,
        and execution metrics collection.
        """
        execution_id = f"exec_{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()
        logger.info(f"Agent '{self.agent_id}' starting execution [{execution_id}]")

        try:
            result_data = await self.execute(**kwargs)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(f"Agent '{self.agent_id}' completed execution [{execution_id}] in {duration_ms}ms")

            return AgentExecutionResult[Any](
                execution_id=execution_id,
                agent_id=self.agent_id,
                agent_name=self.name,
                status=AgentStatus.SUCCESS,
                duration_ms=duration_ms,
                data=result_data,
            )
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"Agent '{self.agent_id}' failed execution [{execution_id}] after {duration_ms}ms: {exc}")
            return AgentExecutionResult[Any](
                execution_id=execution_id,
                agent_id=self.agent_id,
                agent_name=self.name,
                status=AgentStatus.FAILED,
                duration_ms=duration_ms,
                errors=[str(exc)],
            )
