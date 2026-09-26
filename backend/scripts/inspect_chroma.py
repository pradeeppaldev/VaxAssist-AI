import chromadb
import os

client = chromadb.PersistentClient(path="backend/data/chroma")
collections = client.list_collections()
print("ChromaDB Collections in backend/data/chroma:")
for col in collections:
    print(f"  Collection: {col.name}, count={col.count()}")
    if col.count() > 0:
        peek = col.peek(limit=3)
        print(f"    Sample IDs: {peek['ids']}")
        print(f"    Sample Metadatas: {peek['metadatas']}")

if os.path.exists("backend/data/chroma_test"):
    client_test = chromadb.PersistentClient(path="backend/data/chroma_test")
    test_cols = client_test.list_collections()
    print("ChromaDB Collections in backend/data/chroma_test:")
    for col in test_cols:
        print(f"  Collection: {col.name}, count={col.count()}")
