import numpy as np
import easyocr
import re

# Инициализация OCR-движка (EN + RU; можно добавить AZ, если понадобится)
_reader = easyocr.Reader(["en", "ru"], gpu=False)


def extract_raw_text(img: np.ndarray) -> str:
    """
    Возвращает сырой текст, склеенный из всех OCR-боксов.
    """
    results = _reader.readtext(img)
    texts = [t[1] for t in results]
    return "\n".join(texts)


def extract_id_fields(img: np.ndarray) -> dict:
    """
    Очень простой парсер: достаём основные поля из текста.
    Потом это можно будет улучшить под конкретный формат AZ ID / паспорт.
    """
    text = extract_raw_text(img).upper()

    # Примитивные регулярки для дат и номера
    date_pattern = r"\b(\d{2}[./-]\d{2}[./-]\d{4})\b"
    doc_num_pattern = r"\b[A-Z0-9]{5,12}\b"

    dates = re.findall(date_pattern, text)
    doc_nums = re.findall(doc_num_pattern, text)

    # На будущее: можно будет искать слова типа "NAME", "SURNAME", "SOYAD", и т.д.

    fields = {
        "raw_text": text,
        "document_number": doc_nums[0] if doc_nums else None,
        "birthday": dates[0] if len(dates) > 0 else None,
        "expiry_date": dates[1] if len(dates) > 1 else None,
    }

    return fields
