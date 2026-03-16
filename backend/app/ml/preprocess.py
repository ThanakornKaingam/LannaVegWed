from torchvision import transforms
from PIL import Image
import io

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def preprocess_image(file_bytes: bytes):
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    image = transform(image)
    image = image.unsqueeze(0)
    return image
