from pydantic import BaseModel
from typing import Optional

class MemeResponse(BaseModel):
    image_name: str
    target: str
    target_specified: Optional[str] = None
    justification: str
    stance: str
    confidence: float
    batch_id: int
    user_id: Optional[str] = "anonymous"
    session_id: str

class MemeData(BaseModel):
    image_name: str
    ocr_text: str
    batch_id: int
    index_in_batch: int
    total_in_batch: int
    metadata: dict = {}
