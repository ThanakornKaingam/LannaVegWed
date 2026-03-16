import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from app.database import Base, engine
from app.config import settings
# Routers
from app.routers.predict_router import router as predict_router
from app.routers.auth_router import router as auth_router
from app.routers.review_router import router as review_router
# Models
from app.models.review import Review
from app.models.user import User

# =========================
# 1. Create App
# =========================
app = FastAPI(
    title="Flower Veg Enterprise API",
    docs_url="/docs",
    redoc_url=None
)

# =========================
# 2. Session Middleware
# ✅ แก้ไข: ย้ายขึ้นมาอยู่ก่อน CORS — Session ต้องลงทะเบียนก่อนเสมอ
#           ไม่งั้น Google OAuth จะ error mismatching_state (500)
# ✅ แก้ไข: เพิ่ม max_age=3600 ให้ session ไม่หายระหว่าง redirect
# =========================
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    same_site="none",
    https_only=True,
    session_cookie="session",
    max_age=3600,  # ✅ เพิ่มบรรทัดนี้
)

# =========================
# 3. CORS Setup
# =========================
# ดึงค่าจาก ENV ถ้าไม่มีให้ใช้ localhost (แต่อย่าลืมตั้งใน Render นะอ้าย)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://lanna-frontend.onrender.com",
    "https://lannavegwed-frontend.onrender.com", # ใส่เผื่อไว้เลยกันพลาด
    FRONTEND_URL,
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://lannavegwed-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 4. OAuth Setup
# =========================
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
app.state.oauth = oauth

# =========================
# 5. Database Initial
# =========================
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables checked/created")
    except Exception as e:
        print(f"❌ Database init failed: {e}")

# =========================
# 6. Routes & Endpoints
# =========================
@app.get("/")
def root():
    return {
        "status": "API Running",
        "environment": "Production" if os.getenv("RENDER") else "Local"
    }

@app.get("/ping")
def ping():
    return {"pong": True}

@app.get("/debug-cookie")
def debug_cookie(request: Request):
    return {
        "cookies": request.cookies,
        "session": request.session if "session" in request.scope else "no session"
    }

# =========================
# 7. Routers (ปรับให้ตรงกับ Frontend)
# =========================
app.include_router(predict_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/auth")
# แก้ตรงนี้: ให้ Review รองรับทั้งแบบมี /api/v1 และไม่มี (กัน Frontend งง)
app.include_router(review_router, prefix="/api/v1")
app.include_router(review_router, prefix="")
