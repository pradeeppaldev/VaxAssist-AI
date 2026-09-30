import sys
import asyncio
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import db_manager, get_database

async def check():
    await db_manager.connect()
    db = get_database()
    cursor = db["knowledge_documents"].find({})
    async for d in cursor:
        fp = d.get("file_path", "")
        exists = Path(fp).exists() if fp else False
        print(f"ID: {d.get('_id')} | Status: {d.get('status')} | Title: {d.get('title')} | File Exists: {exists}")
    await db_manager.disconnect()

if __name__ == "__main__":
    asyncio.run(check())
