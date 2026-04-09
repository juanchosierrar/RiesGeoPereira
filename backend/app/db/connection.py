from pymongo import MongoClient
from pymongo.database import Database
from typing import Generator
from dotenv import load_dotenv
from core.config import MONGO_URI, COMBINED_DB_NAME

load_dotenv()

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
except Exception as e:
    print(f"WARNING: MongoDB connection failed: {e}")
    client = None

def get_db() -> Generator[Database, None, None]:
    """
    FastAPI dependency function to inject the combined database object into route handlers.
    """
    if client is None:
        # Instead of a hard crash, we yield None or raise a specific error that FastAPI can handle
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database connection is currently unavailable. Social media features are disabled.")
    try:
        yield client[COMBINED_DB_NAME] 
    finally:
        pass