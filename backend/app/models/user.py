from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    # UUID (SQLite Compatible)
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=True)
    google_id = Column(String, nullable=True, unique=True)

    full_name = Column(String, nullable=True)

    # 🔥 Role system รองรับ admin
    role = Column(String, default="user")

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 🔗 Relationship กับ Review
    reviews = relationship(
        "Review",
        back_populates="user",
        cascade="all, delete",
        passive_deletes=True
    )

    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f"<User {self.email}>"
