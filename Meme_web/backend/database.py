from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Check for MONGO_URI or MONGO_URL from environment
MONGO_URL = os.getenv("MONGO_URI") or os.getenv("MONGO_URL", "mongodb+srv://n210103_db_user:tanmayikona@meme-response.fhmccew.mongodb.net/?retryWrites=true&w=majority")
DB_NAME = "meme_ground_truth"

client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]
responses_collection = db["responses"]

async def check_connection():
    try:
        await client.server_info()
        return True
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return False

async def get_database():
    return db
