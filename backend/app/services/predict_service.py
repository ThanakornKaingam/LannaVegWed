"""
app/services/predict_service.py

✅ ของเดิม: predict_image() — ไม่แตะ
🆕 เพิ่มใหม่: predict_image_top3() — เรียก predict_top3 จาก inference.py
🆕 เพิ่มใหม่: เช็ค OOD (ไม่ใช่ผัก) ก่อนรันโมเดลผักจริง ด้วย MobileNetV2 (torchvision, เบา ประหยัด RAM)

วิธีใช้: แทนที่ไฟล์ predict_service.py เดิม
"""
from app.ml.model_loader import load_model
from app.ml.inference import predict, predict_top3
from app.ml.ood_filter import is_vegetable_image  # 🆕 เพิ่ม import
import threading

_model = None
_model_lock = threading.Lock()


def _get_model():
    """โหลด model แบบ lazy loading + thread-safe (ใช้ร่วมกัน)"""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                print("🔥 Loading model...")
                _model = load_model()
    return _model


# =============================================================
# ✅ ฟังก์ชันเดิม — ไม่แก้ไข
# =============================================================
def predict_image(image):
    model = _get_model()
    return predict(model, image)


# =============================================================
# 🆕 ฟังก์ชันใหม่ — return Top 3 (เพิ่ม OOD check)
# =============================================================
def predict_image_top3(image, top_k=3):
    """
    จำแนกภาพแล้วคืนผล Top 3

    🆕 เพิ่ม: เช็คก่อนว่าภาพนี้ "ดูเหมือนไม่ใช่ผัก/พืชชัดเจน" หรือไม่
    (เช่น เสื้อผ้า, screenshot, คน) ถ้าใช่ → return is_vegetable=False ทันที
    ไม่ต้องรันโมเดลผักเลย ประหยัดเวลา + กันโมเดลผักมั่นใจผิดๆ

    Returns:
        dict:
        {
            "is_vegetable": bool,             # 🆕
            "ood_matched_label": str | None,  # 🆕 debug: label ที่ตรวจพบว่าไม่ใช่ผัก
            "candidates": [
                {"class_name": "Para cress", "confidence": 0.68, "rank": 1},
                {"class_name": "Neem tree", "confidence": 0.18, "rank": 2},
                ...
            ],
            "raw_top1_confidence": 0.9812  # ค่าจริงก่อน temperature (ใช้เช็ค threshold)
        }
    """
    # 🆕 เช็ค OOD ก่อน (เบา ไม่กิน RAM มาก)
    is_veg, matched_label, matched_score = is_vegetable_image(image)

    if not is_veg:
        return {
            "is_vegetable": False,
            "ood_matched_label": matched_label,
            "ood_matched_score": matched_score,
            "candidates": [],
            "raw_top1_confidence": 0,
        }

    model = _get_model()
    result = predict_top3(model, image, top_k=top_k)
    result["is_vegetable"] = True
    result["ood_matched_label"] = None
    return result
