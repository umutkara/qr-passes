import numpy as np
import cv2
from insightface.app import FaceAnalysis

# Инициализируем InsightFace один раз, при старте сервиса
app = FaceAnalysis(
    name="buffalo_l",  # стандартный пак моделей: детектор + рекогнайзер
    root="./models",   # сюда он сам скачает модели при первом запуске
)
# ctx_id=0 — CPU, det_size — разрешение для детекции
app.prepare(ctx_id=0, det_size=(640, 640))


def _get_face_embedding(img: np.ndarray) -> np.ndarray | None:
    """Достаём embedding первого найденного лица."""
    faces = app.get(img)
    if not faces:
        return None
    # Берём первый face
    face = faces[0]
    emb = face["embedding"]
    # Нормализуем вектор
    emb = emb / np.linalg.norm(emb)
    return emb


def compare_faces(img_doc: np.ndarray, img_selfie: np.ndarray, threshold: float = 0.5) -> dict:
    """
    Сравнивает лицо на документе и селфи.
    Возвращает match: bool и similarity: float
    """
    emb1 = _get_face_embedding(img_doc)
    emb2 = _get_face_embedding(img_selfie)

    if emb1 is None or emb2 is None:
        return {
            "match": False,
            "similarity": 0.0,
            "error": "face_not_found"
        }

    similarity = float(np.dot(emb1, emb2))

    return {
        "match": similarity >= threshold,
        "similarity": similarity,
        "error": None
    }
