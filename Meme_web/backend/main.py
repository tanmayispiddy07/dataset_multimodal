from fastapi import FastAPI, HTTPException, Query
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import os
from database import responses_collection
from models import MemeResponse, MemeData
from pydantic import BaseModel

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.abspath(os.path.join(BASE_DIR, "../../"))
CSV_PATH = os.path.join(DATASET_DIR, "Multilingual_meme_dataset.csv")
IMAGES_DIR = os.path.join(DATASET_DIR, "downloaded_memes_images")

# Load Dataset
try:
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} memes from {CSV_PATH}")
except Exception as e:
    print(f"Error loading CSV: {e}")
    df = pd.DataFrame()

BATCH_SIZE = len(df) // 8

@app.get("/")
def read_root():
    return {"message": "Meme Ground Truth Backend"}

@app.get("/api/meme", response_model=MemeData)
def get_meme(batch_id: int = Query(..., ge=1, le=8), index: int = Query(..., ge=0)):
    start_idx = (batch_id - 1) * BATCH_SIZE
    end_idx = start_idx + BATCH_SIZE if batch_id < 8 else len(df)
    
    current_idx = start_idx + index
    
    if current_idx >= end_idx:
        raise HTTPException(status_code=404, detail="End of batch")
    
    row = df.iloc[current_idx]
    
    # Handle missing OCR text
    ocr_text = row.get("combined_text", "")
    if pd.isna(ocr_text):
        ocr_text = "No Text Found"
        
    # Extract metadata
    metadata = {
        "category": row.get("meme_lang_category", "Unknown")
    }

    return MemeData(
        image_name=row["image_name"],
        ocr_text=str(ocr_text),
        batch_id=batch_id,
        index_in_batch=index,
        total_in_batch=end_idx - start_idx,
        metadata=metadata
    )

@app.get("/api/image/{image_name}")
def get_image(image_name: str):
    image_path = os.path.join(IMAGES_DIR, image_name)
    if os.path.exists(image_path):
        return FileResponse(image_path)
    return HTTPException(status_code=404, detail="Image not found")

from database import responses_collection, check_connection
import csv

# ... (rest of imports)

# Global flag for Mongo status
USE_MONGO = False

@app.on_event("startup")
async def startup_event():
    global USE_MONGO
    if await check_connection():
        print("Connected to MongoDB")
        USE_MONGO = True
    else:
        print("MongoDB not available. Using CSV storage.")
        USE_MONGO = False

# ... (rest of app)

@app.post("/api/submit")
async def submit_response(response: MemeResponse):
    if USE_MONGO:
        # Upsert: replace existing answer for this user+meme, or insert if new.
        # This prevents duplicate records when the user goes back and clicks Next.
        await responses_collection.replace_one(
            {"user_id": response.user_id, "image_name": response.image_name},
            response.dict(),
            upsert=True
        )
    else:
        # CSV fallback: overwrite the matching row if it exists, else append.
        data = response.dict()
        fieldnames = list(data.keys())
        rows = []
        updated = False
        if os.path.exists("responses.csv"):
            with open("responses.csv", "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == data["user_id"] and row.get("image_name") == data["image_name"]:
                        rows.append(data)  # replace with updated data
                        updated = True
                    else:
                        rows.append(row)
        if not updated:
            rows.append(data)
        with open("responses.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

@app.get("/api/progress")
async def get_progress(user_id: str = Query(...), batch_id: int = Query(..., ge=1, le=8)):
    """Returns how many distinct memes a user has already answered for a given batch."""
    if USE_MONGO:
        # Count distinct image_names to avoid counting any legacy duplicates.
        pipeline = [
            {"$match": {"user_id": user_id, "batch_id": batch_id}},
            {"$group": {"_id": "$image_name"}},
            {"$count": "distinct_count"}
        ]
        result = await responses_collection.aggregate(pipeline).to_list(length=1)
        count = result[0]["distinct_count"] if result else 0
    else:
        seen = set()
        if os.path.exists("responses.csv"):
            with open("responses.csv", "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == user_id and str(row.get("batch_id")) == str(batch_id):
                        seen.add(row.get("image_name"))
        count = len(seen)
    return {"user_id": user_id, "batch_id": batch_id, "answered_count": count}

@app.get("/api/response")
async def get_response(user_id: str = Query(...), image_name: str = Query(...)):
    """Fetches a user's LATEST saved answer for a specific meme."""
    if USE_MONGO:
        # Sort by _id descending so we get the most recently inserted document
        doc = await responses_collection.find_one(
            {"user_id": user_id, "image_name": image_name},
            {"_id": 0},
            sort=[("_id", -1)]
        )
        if doc:
            return doc
    else:
        if os.path.exists("responses.csv"):
            latest_row = None
            with open("responses.csv", "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get("user_id") == user_id and row.get("image_name") == image_name:
                        latest_row = row  # keep overwriting — last match wins
            if latest_row is not None:
                # Cast numeric fields back to correct types
                latest_row["confidence"] = float(latest_row.get("confidence", 0.5))
                latest_row["batch_id"] = int(latest_row.get("batch_id", 1))
                return latest_row
    raise HTTPException(status_code=404, detail="No previous response found")
            
from typing import List

# ... (existing imports)

@app.post("/api/submit_batch")
async def submit_batch_responses(responses: List[MemeResponse]):
    if not responses:
        return {"message": "No responses to save"}
        
    data_to_insert = [r.dict() for r in responses]
    
    if USE_MONGO:
        await responses_collection.insert_many(data_to_insert)
    else:
        # Fallback to CSV
        file_exists = os.path.exists("responses.csv")
        with open("responses.csv", "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=data_to_insert[0].keys())
            if not file_exists:
                writer.writeheader()
            writer.writerows(data_to_insert)
            
    return {"message": f"Saved {len(responses)} responses"}

class UserFinalization(BaseModel):
    session_id: str
    username: str

@app.post("/api/finalize_batch")
async def finalize_batch(data: UserFinalization):
    if USE_MONGO:
        result = await responses_collection.update_many(
            {"session_id": data.session_id},
            {"$set": {"user_id": data.username}}
        )
        return {"message": f"Updated {result.modified_count} records"}
    else:
        # CSV Fallback update
        if not os.path.exists("responses.csv"):
            return {"message": "No records found"}
            
        rows = []
        updated_count = 0
        with open("responses.csv", "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        for row in rows:
            if row.get("session_id") == data.session_id:
                row["user_id"] = data.username
                updated_count += 1
                
        if rows:
            with open("responses.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
                
        return {"message": f"Updated {updated_count} records in CSV"}
