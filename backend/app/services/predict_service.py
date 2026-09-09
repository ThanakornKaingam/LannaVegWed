"""
app/services/predict_service.py
"""
from app.ml.model_loader import load_model
from app.ml.inference import predict, predict_top3
import threading

_model = None
_model_lock = threading.Lock()

# 🆕 ตั้งค่า threshold ตรงนี้ ปรับได้ตามที่เทสแล้วเหมาะสม
CONFIDENCE_THRESHOLD = 0.75   # ต่ำกว่านี้ = ไม่มั่นใจ
GAP_THRESHOLD = 0.12          # ถ้าอันดับ1-2 ห่างกันน้อยกว่านี้ = สับสน


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
# 🆕 ฟังก์ชันใหม่ — return Top 3 + เช็คความมั่นใจ
# =============================================================
def predict_image_top3(image, top_k=3):
    """
    จำแนกภาพแล้วคืนผล Top 3
    พร้อมเช็คว่าโมเดลมั่นใจพอหรือไม่ (กันเคสภาพที่ไม่ใช่ผัก)
    """
    model = _get_model()
    result = predict_top3(model, image, top_k=top_k)

    candidates = result.get("candidates", [])
    top1_confidence = result.get("raw_top1_confidence", 0)

    # 🆕 เช็คเงื่อนไขความมั่นใจ
    is_uncertain = False
    reason = None

    if top1_confidence < CONFIDENCE_THRESHOLD:
        is_uncertain = True
        reason = "low_confidence"
    elif len(candidates) >= 2:
        gap = candidates[0]["confidence"] - candidates[1]["confidence"]
        if gap < GAP_THRESHOLD:
            is_uncertain = True
            reason = "ambiguous_result"

    result["is_uncertain"] = is_uncertain
    result["uncertain_reason"] = reason

    return result
