from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client["arbor"]
    print("✅ MongoDB connected")

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    return db
