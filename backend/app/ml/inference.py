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
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

def predict(model, image):
    image = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    return {
        "class_name": CLASS_NAMES[predicted.item()],
        "confidence": round(confidence.item(), 4),
        "all_probs": probabilities[0].tolist()  # ✅ ส่ง prob ทุก class กลับมา
    }
