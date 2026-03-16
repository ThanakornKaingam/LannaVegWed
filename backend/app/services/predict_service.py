from app.ml.model_loader import load_model
from app.ml.inference import predict
import threading

_model = None
_model_lock = threading.Lock()

def predict_image(image):
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                print("🔥 Loading model...")
                _model = load_model()

    return predict(_model, image)
