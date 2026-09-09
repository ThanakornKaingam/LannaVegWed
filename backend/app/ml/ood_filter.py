"""
app/ml/ood_filter.py
🆕 ใหม่: ตัวกรองภาพที่ "ไม่ใช่ผัก/พืช" ก่อนเข้าโมเดลจำแนกผักจริง

ใช้ MobileNetV2 (pretrained บน ImageNet) จาก torchvision
เพราะโปรเจคใช้ PyTorch อยู่แล้ว (ไม่ต้องลง TensorFlow เพิ่ม ประหยัด RAM)
ขนาดโมเดลแค่ ~14MB เหมาะกับ Render free tier
"""
import threading
import torch
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
from torchvision import transforms

_ood_model = None
_ood_weights = None
_lock = threading.Lock()

INPUT_SIZE = 224

# =============================================================
# กลุ่มคำที่บ่งบอกว่า "ไม่ใช่ผัก/พืช" แน่ๆ
# ถ้า top prediction ของ MobileNetV2 ตรงกับคำเหล่านี้ → block ทันที
# (ปรับ/เพิ่มคำได้ตามเคสที่เจอจริงบ่อยๆ)
# =============================================================
NON_PLANT_KEYWORDS = [
    # หน้าจอ/เว็บ/เอกสาร
    "web site", "website", "screen", "monitor", "laptop", "cellular telephone",
    "iPod", "computer", "menu", "envelope", "book", "notebook",
    # เสื้อผ้า/ผ้า
    "sweatshirt", "jersey", "jean", "trouser", "suit", "kimono", "sock",
    "shirt", "dress", "gown", "cloak", "bikini", "brassiere", "apron",
    "sandal", "shoe", "boot",
    # คน/ร่างกาย
    "person", "human",
    # อุปกรณ์/เฟอร์นิเจอร์
    "table", "chair", "desk", "keyboard", "mouse", "remote control",
    # ยานพาหนะ
    "car", "truck", "bicycle", "motorcycle",
    # สัตว์ (ผักไม่ใช่สัตว์แน่ๆ)
    "dog", "cat", "bird", "fish",
]

_preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(INPUT_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def _load_ood_model():
    global _ood_model, _ood_weights
    if _ood_model is None:
        with _lock:
            if _ood_model is None:
                print("🔥 Loading lightweight OOD filter (MobileNetV2 - torchvision)...")
                _ood_weights = MobileNet_V2_Weights.IMAGENET1K_V2
                _ood_model = mobilenet_v2(weights=_ood_weights)
                _ood_model.eval()
    return _ood_model, _ood_weights


def is_vegetable_image(pil_image, top_n=5):
    """
    เช็คว่าภาพนี้ 'น่าจะไม่ใช่ผัก/พืช' ชัดเจนหรือไม่
    ใช้ MobileNetV2 ทำนายเป็น top_n แล้วเทียบกับ blocklist

    Returns:
        (is_vegetable: bool, matched_label: str | None, matched_score: float)
        - is_vegetable = False เมื่อพบ label ในกลุ่ม NON_PLANT_KEYWORDS
          อยู่ใน top_n อันดับแรก
    """
    model, weights = _load_ood_model()
    categories = weights.meta["categories"]

    img = pil_image.convert("RGB")
    input_tensor = _preprocess(img).unsqueeze(0)  # add batch dim

    with torch.no_grad():
        output = model(input_tensor)
        probs = torch.nn.functional.softmax(output[0], dim=0)
        top_probs, top_idxs = torch.topk(probs, top_n)

    for score, idx in zip(top_probs.tolist(), top_idxs.tolist()):
        label = categories[idx]
        label_lower = label.lower()
        for keyword in NON_PLANT_KEYWORDS:
            if keyword.lower() in label_lower:
                return False, label, float(score)

    return True, None, 0.0
