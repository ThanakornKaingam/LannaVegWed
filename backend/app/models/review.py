from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    class_name = Column(String, nullable=False)
    review_text = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)

    # 🔥 Map Fields
    place_name = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # 🔥 Soft delete
    is_deleted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔥 สำคัญมาก: ต้องเป็น String ให้ตรงกับ User.id
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 🔥 Relationship
    user = relationship("User", back_populates="reviews")

    # 🔥 Helper function
    def to_dict(self):
        return {
            "id": self.id,
            "class_name": self.class_name,
            "review_text": self.review_text,
            "rating": self.rating,
            "place_name": self.place_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_deleted": self.is_deleted,
            "created_at": self.created_at,
            "user_id": self.user_id,
        }
