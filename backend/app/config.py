import os
from dotenv import load_dotenv
from typing import List
from pathlib import Path

# ========================
# Load Environment File
# ========================
BASE_DIR = Path(__file__).resolve().parent.parent
# ลองหาทั้ง .env และ .env.dev
ENV_PATH = BASE_DIR / ".env" 
ENV_DEV_PATH = BASE_DIR / ".env.dev"

# ถ้าเจอไฟล์ไหนให้โหลดไฟล์นั้น แต่ถ้าไม่เจอ "ไม่ต้อง raise Error"
if ENV_DEV_PATH.exists():
    load_dotenv(dotenv_path=ENV_DEV_PATH)
    print(f"Loaded ENV from: {ENV_DEV_PATH}")
elif ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"Loaded ENV from: {ENV_PATH}")
else:
    print("⚠️ No .env file found. Using system environment variables.")

class Settings:
    # 🌍 Environment
    ENV: str = os.getenv("ENV", "dev")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # 🗄 Database (สำคัญ: Render มักจะให้ URL มาทาง Environment Variable)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")

    # 🔐 JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "devsecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # 🔑 Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "")

    # 🌐 Frontend & CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # ดึงค่า ORIGINS มาทำเป็น List
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")

    # 🤖 Model Path (เช็คให้ชัวร์ว่าไฟล์ .pt อยู่ในโฟลเดอร์นี้จริงๆ)
    MODEL_PATH: str = os.getenv("MODEL_PATH", "app/ml/MobileNetV3-Large.pt")

    # 🗺 Google Maps
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")

    def validate(self):
        # ใน Production (Render) เราต้องมีค่าพวกนี้
        if self.ENV == "prod" or os.getenv("RENDER"):
            if not self.GOOGLE_CLIENT_ID or not self.GOOGLE_CLIENT_SECRET:
                print("⚠️ Warning: Google OAuth credentials are missing in production!")
            if self.SECRET_KEY == "devsecretkey":
                print("⚠️ Warning: Using default SECRET_KEY in production!")

settings = Settings()
# เรียก validate แต่ไม่ให้มันสั่งหยุดแอปฯ ทันที (ยกเว้นน้องต้องการแบบนั้น)
settings.validate()
