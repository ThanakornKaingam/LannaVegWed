from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

# ตรวจสอบว่าเป็น SQLite หรือไม่
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# Dependency สำหรับ FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
