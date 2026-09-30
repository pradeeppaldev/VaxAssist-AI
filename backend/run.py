import os
import uvicorn
from app.config import settings

if __name__ == "__main__":
    port = int(os.environ.get("PORT", settings.PORT))
    host = os.environ.get("HOST", settings.HOST)
    is_prod = settings.ENVIRONMENT == "production"
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False if is_prod else settings.DEBUG,
        proxy_headers=True,
    )
