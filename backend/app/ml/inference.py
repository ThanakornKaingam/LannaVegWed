"""
app/ml/inference.py

✅ ของเดิม: predict() — return Top 1 (ไม่แตะ ใช้ได้ปกติ)
🆕 เพิ่มใหม่: predict_top3() — return Top 3 เรียงตามค่าความมั่นใจ

วิธีใช้: แทนที่ไฟล์ inference.py เดิม
"""
import torch
from torchvision import transforms
import json
import os

BASE_DIR = os.path.dirname(__file__)

with open(os.path.join(BASE_DIR, "classes.json"), "r", encoding="utf-8") as f:
    CLASS_NAMES = json.load(f)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


# =============================================================
# ✅ ฟังก์ชันเดิม — ไม่แก้ไข (ใช้กับ predict_router เดิมได้ปกติ)
# =============================================================
def predict(model, image):
    image = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
    return {
        "class_name": CLASS_NAMES[predicted.item()],
        "confidence": round(confidence.item(), 4)
    }


# =============================================================
# 🆕 ฟังก์ชันใหม่ — return Top 3 เรียงจากมากไปน้อย
# ใช้ Temperature Scaling ให้ค่า confidence กระจายตัวสมจริง
# =============================================================

# Temperature สำหรับ softmax
# ค่ายิ่งสูง → confidence กระจายตัวมากขึ้น (อันดับ 2-3 ไม่ต่ำเวอร์)
# 1.0 = ปกติ(เวอร์), 2.0 = กระจายปานกลาง, 3.0 = กระจายมาก
# แนะนำ 2.0 - 3.0 สำหรับแสดง Top 3
TEMPERATURE = 2.5

def predict_top3(model, image, top_k=3):
    """
    จำแนกภาพแล้วคืนผล Top K (default = 3)

    ใช้ Temperature Scaling เพื่อให้ค่า confidence สมจริง:
    - อันดับ 1 ยังสูงสุดเสมอ (อันดับไม่เปลี่ยน)
    - อันดับ 2-3 มีค่าพอสมควร ไม่ต่ำจนเวอร์

    ตัวอย่างผลลัพธ์:
      ก่อน (T=1.0): 96.1% / 2.3% / 0.8%
      หลัง (T=2.5): 68.5% / 18.2% / 13.3%
    """
    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)

        # =============================================
        # 1) Softmax เดิม (ไม่ temperature) → ใช้เช็ค threshold
        #    ถ้าอันดับ 1 ต่ำ = ภาพไม่ใช่ผัก
        # =============================================
        raw_probs = torch.softmax(outputs, dim=1)
        raw_max_conf = torch.max(raw_probs).item()

        # =============================================
        # 2) Temperature Scaling → ใช้แสดงค่า confidence
        #    ทำให้อันดับ 2-3 ไม่ต่ำเวอร์
        # =============================================
        scaled_outputs = outputs / TEMPERATURE
        probabilities = torch.softmax(scaled_outputs, dim=1)

        # ดึง Top K
        top_confidences, top_indices = torch.topk(
            probabilities, k=min(top_k, len(CLASS_NAMES)), dim=1
        )

    results = []
    for rank, (conf, idx) in enumerate(
        zip(top_confidences[0], top_indices[0]), start=1
    ):
        results.append({
            "class_name": CLASS_NAMES[idx.item()],
            "confidence": round(conf.item(), 4),
            "rank": rank,
        })

    return {
        "candidates": results,
        "raw_top1_confidence": round(raw_max_conf, 4),  # ค่าจริงก่อน temperature
    }
