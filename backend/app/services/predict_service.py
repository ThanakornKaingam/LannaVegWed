"""
app/services/predict_service.py

✅ ของเดิม: predict_image() — ไม่แตะ
🆕 เพิ่มใหม่: predict_image_top3() — เรียก predict_top3 จาก inference.py

วิธีใช้: แทนที่ไฟล์ predict_service.py เดิม
"""
from app.ml.model_loader import load_model
from app.ml.inference import predict, predict_top3
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
# 🆕 ฟังก์ชันใหม่ — return Top 3
# =============================================================
def predict_image_top3(image, top_k=3):
    """
    จำแนกภาพแล้วคืนผล Top 3

    Returns:
        dict:
        {
            "candidates": [
                {"class_name": "Para cress", "confidence": 0.68, "rank": 1},
                {"class_name": "Neem tree", "confidence": 0.18, "rank": 2},
                ...
            ],
            "raw_top1_confidence": 0.9812  # ค่าจริงก่อน temperature (ใช้เช็ค threshold)
        }
    """
    model = _get_model()
    return predict_top3(model, image, top_k=top_k)
