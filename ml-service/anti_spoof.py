import numpy as np

def estimate_liveness(img: np.ndarray) -> dict:
    """
    Заглушка для антиспуфинга.
    Потом сюда можно будет прикрутить MiniFASNetV2_80x80 (ONNX).
    Сейчас просто возвращаем высокий score и ok = True.
    """
    score = 0.9  # как будто всё ок
    return {
        "ok": score > 0.5,
        "score": score,
        "reason": None,
        "model": "stub_liveness"
    }
