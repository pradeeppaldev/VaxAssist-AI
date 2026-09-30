import logging
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("vaxassist.database")


class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False

    async def connect(self) -> None:
        """Initialize MongoDB connection pool with short timeout for health checking."""
        try:
            logger.info(f"Connecting to MongoDB at: {settings.MONGODB_URI} (db: {settings.MONGODB_DB_NAME})")
            client_kwargs = {
                "serverSelectionTimeoutMS": settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            }
            try:
                import certifi
                ca_file = certifi.where()
                uri_lower = settings.MONGODB_URI.lower()
                if "mongodb+srv://" in uri_lower or "ssl=true" in uri_lower or "tls=true" in uri_lower:
                    client_kwargs["tlsCAFile"] = ca_file
            except Exception as cert_err:
                logger.debug(f"Could not load certifi CA bundle: {cert_err}")

            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                **client_kwargs,
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            # Quick non-blocking ping check
            await self.client.admin.command("ping")
            self.is_connected = True
            logger.info("Successfully established connection to MongoDB.")
        except Exception as e:
            self.is_connected = False
            logger.warning(
                f"Could not connect to MongoDB ({settings.MONGODB_URI}): {e}. "
                "Backend will continue in decoupled mode until MongoDB is available."
            )

    async def disconnect(self) -> None:
        """Close MongoDB connection gracefully."""
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")

    async def ping(self) -> Dict[str, Any]:
        """Perform active health ping and return connection status."""
        if not self.client:
            return {
                "status": "disconnected",
                "database": settings.MONGODB_DB_NAME,
                "message": "Client not initialized",
            }
        try:
            await self.client.admin.command("ping")
            self.is_connected = True
            return {
                "status": "connected",
                "database": settings.MONGODB_DB_NAME,
                "message": "MongoDB is reachable and responding to ping",
            }
        except Exception as exc:
            self.is_connected = False
            return {
                "status": "disconnected",
                "database": settings.MONGODB_DB_NAME,
                "error": str(exc),
                "message": f"Unable to reach MongoDB at '{settings.MONGODB_URI}'. Please ensure MongoDB is running or configure MONGODB_URI.",
            }

    def get_collection(self, collection_name: str):
        """Get collection handle if database is initialized."""
        if self.db is None:
            raise RuntimeError("Database not initialized. Please check MongoDB connection.")
        return self.db[collection_name]


db_manager = MongoDBManager()


def get_database() -> AsyncIOMotorDatabase:
    """Dependency for injecting database in endpoints."""
    if db_manager.db is None:
        raise RuntimeError("Database connection is not active.")
    return db_manager.db
