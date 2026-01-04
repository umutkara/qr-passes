import numpy as np
import cv2
from ultralytics import YOLO

# При первом вызове модель скачает веса (yolov8n или yolov10n, если доступно)
# Можно будет поменять на "yolov10n.pt"
_yolo_model = YOLO("yolov8n.pt")


def detect_document_region(img: np.ndarray) -> np.ndarray:
    """
    Пока простая заглушка:
    - прогоняем через YOLO (чтобы веса скачались и всё было готово)
    - возвращаем исходную картинку как "документ"
    Дальше можно будет доработать: найти самый большой прямоугольный bbox и кропнуть.
    """
    # Это вызов нужен, чтобы модель и веса реально использовались
    try:
        _ = _yolo_model.predict(img, verbose=False)
    except Exception:
        # На всякий случай, чтобы не упасть, если что-то не так
        pass

    # TODO: реальная логика кропа документа
    return img
