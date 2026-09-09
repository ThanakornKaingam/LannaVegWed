from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.database import SessionLocal, get_db
from app.utils.security import create_access_token, verify_token
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import logging

router = APIRouter()
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =========================
# Google Login Redirect
# =========================
@router.get("/google/login")
async def login_via_google(request: Request):
    oauth = request.app.state.oauth
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

# =========================
# Google Callback
# =========================
@router.get("/google/callback", name="auth_callback")
async def auth_callback(request: Request):
    db = SessionLocal()
    try:
        oauth = request.app.state.oauth
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        if not user_info:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=google_failed")

        user = db.query(User).filter(User.email == user_info["email"]).first()

        if not user:
            user = User(
                email=user_info["email"],
                full_name=user_info.get("name"),
                google_id=user_info.get("sub"),
                password=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token({"sub": user.email})
        redirect_url = f"{settings.FRONTEND_URL}/auth?token={jwt_token}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"Auth Error: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=exception")
    finally:
        db.close()

# =========================
# ✅ Register (Email + Password)
# =========================
class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    phone: str | None = None

@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานแล้ว")

    hashed = pwd_context.hash(body.password)
    user = User(
        email=body.email,
        full_name=f"{body.first_name} {body.last_name}",
        password=hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# =========================
# ✅ Login (Email + Password)
# =========================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not user.password:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    if not pwd_context.verify(body.password, user.password):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# =========================
# Dependency: ตรวจสอบตัวตน
# =========================
def get_current_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบ (Missing or invalid token)")

    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Session หมดอายุ กรุณาเข้าสู่ระบบใหม่")

    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="ไม่พบข้อมูลผู้ใช้งาน")
    return user

# =========================
# Me
# =========================
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": getattr(current_user, "role", "user")
        }
    }

# =========================
# Logout
# =========================
@router.get("/logout")
def logout():
    return RedirectResponse(url=settings.FRONTEND_URL)
