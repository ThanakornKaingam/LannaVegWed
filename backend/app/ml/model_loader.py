import torch
from pathlib import Path

_model = None

def load_model():
    global _model

    if _model is None:
        model_path = Path(__file__).resolve().parent / "MobileNetV3-Large.pt"
        _model = torch.jit.load(str(model_path), map_location="cpu")
        _model.eval()

    return _model
