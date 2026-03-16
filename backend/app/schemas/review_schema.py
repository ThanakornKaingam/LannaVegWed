from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# =========================
# 📥 Schema สำหรับรับข้อมูลจาก Frontend (Create)
# =========================
class ReviewCreate(BaseModel):
    class_name: str
    review_text: str
    rating: int = Field(..., ge=1, le=5) # บังคับให้ rating อยู่ระหว่าง 1-5 ตั้งแต่ระดับ Schema


# =========================
# 📤 Schema สำหรับส่งข้อมูลกลับไปให้ Frontend (Response)
# =========================
class ReviewResponse(BaseModel):
    id: int
    class_name: str
    review_text: str
    rating: int
    username: str
    created_at: datetime

    # พิกัดแผนที่ (เผื่อยังไม่ได้ปักหมุดเลยให้เป็น Optional)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_name: Optional[str] = None

    class Config:
        # ✅ สำหรับ Pydantic V1 (ใช้ orm_mode)
        orm_mode = True
        # ✅ สำหรับ Pydantic V2 (ใช้ from_attributes)
        # แนะนำให้ใส่ไว้ทั้งคู่หรือเลือกใช้ตามเวอร์ชันที่อ้ายลงไว้ครับ
        from_attributes = True


# =========================
# 📍 Schema สำหรับอัปเดตพิกัด (Location Update)
# =========================
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    place_name: Optional[str] = None
