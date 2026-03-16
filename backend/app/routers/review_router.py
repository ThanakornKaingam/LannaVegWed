from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review_schema import ReviewCreate, ReviewResponse
from app.routers.auth_router import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

# =========================
# ⭐ 1. CREATE REVIEW (สร้างรีวิวเริ่มต้น)
# =========================
@router.post("/", response_model=dict)
def create_review(
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ตรวจสอบคะแนน
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="คะแนนต้องอยู่ระหว่าง 1-5 ดาว")

    new_review = Review(
        class_name=review.class_name,
        review_text=review.review_text,
        rating=review.rating,
        user_id=current_user.id,
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # ส่ง ID กลับไปเพื่อให้ Frontend เอาไปใช้ปักหมุดต่อในหน้า Map
    return {"review_id": new_review.id, "message": "บันทึกรีวิวเบื้องต้นสำเร็จ"}


# =========================
# ✏ 2. UPDATE REVIEW (แก้ไขข้อความ/คะแนน)
# =========================
@router.put("/{review_id}", response_model=dict)
def update_review(
    review_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="ไม่พบรีวิวที่ต้องการแก้ไข")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์แก้ไขรีวิวนี้")

    rating = data.get("rating")
    review_text = data.get("review_text")

    if rating is not None:
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="คะแนนต้องอยู่ระหว่าง 1-5")
        review.rating = rating

    if review_text is not None:
        review.review_text = review_text

    db.commit()
    return {"message": "แก้ไขข้อมูลรีวิวเรียบร้อยแล้ว"}


# =========================
# 📍 3. UPDATE LOCATION (ปักหมุดแผนที่)
# =========================
@router.put("/{review_id}/location", response_model=dict)
def update_location(
    review_id: int,
    data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="ไม่พบรีวิวที่ต้องการปักหมุด")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์แก้ไขพิกัดนี้")

    review.latitude = data.get("latitude")
    review.longitude = data.get("longitude")
    review.place_name = data.get("place_name")

    db.commit()
    return {"message": "บันทึกพิกัดแผนที่สำเร็จ"}


# =========================
# 📋 4. GET ALL REVIEWS (ดูรีวิวทั้งหมด)
# =========================
@router.get("/all/list", response_model=List[ReviewResponse])
def get_all_reviews(
    skip: int = Query(0),
    limit: int = Query(20),
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.is_deleted == False)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        ReviewResponse(
            id=r.id,
            class_name=r.class_name,
            review_text=r.review_text,
            rating=r.rating,
            username=r.user.full_name if r.user else "ผู้ใช้ทั่วไป",
            created_at=r.created_at,
            latitude=r.latitude,
            longitude=r.longitude,
            place_name=r.place_name,
        )
        for r in reviews
    ]


# =========================
# 👤 5. MY REVIEWS (ดูรีวิวของฉัน)
# =========================
@router.get("/my/list", response_model=List[ReviewResponse])
def my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.is_deleted == False
        )
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        ReviewResponse(
            id=r.id,
            class_name=r.class_name,
            review_text=r.review_text,
            rating=r.rating,
            username=current_user.full_name,
            created_at=r.created_at,
            latitude=r.latitude,
            longitude=r.longitude,
            place_name=r.place_name,
        )
        for r in reviews
    ]


# =========================
# 🗑 6. DELETE REVIEW (ลบรีวิวแบบ Soft Delete)
# =========================
@router.delete("/{review_id}", response_model=dict)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="ไม่พบรีวิว")

    # เช็คว่าเป็นเจ้าของ หรือว่าเป็น admin
    is_admin = getattr(current_user, "role", "") == "admin"
    if review.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ลบรีวิวนี้")

    review.is_deleted = True
    db.commit()

    return {"message": "ลบรีวิวเรียบร้อยแล้ว"}


# =========================
# 📄 7. GET REVIEWS BY CLASS (กรองตามชนิดผัก)
# =========================
@router.get("/class/{class_name}", response_model=List[ReviewResponse])
def get_reviews_by_class(
    class_name: str,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(
            Review.class_name == class_name,
            Review.is_deleted == False
        )
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        ReviewResponse(
            id=r.id,
            class_name=r.class_name,
            review_text=r.review_text,
            rating=r.rating,
            username=r.user.full_name if r.user else "ผู้ใช้ทั่วไป",
            created_at=r.created_at,
            latitude=r.latitude,
            longitude=r.longitude,
            place_name=r.place_name,
        )
        for r in reviews
    ]
