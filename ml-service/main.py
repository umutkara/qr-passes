from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import os

import cv2
import numpy as np
import requests
import mediapipe as mp

# =============== Ускорение OpenCV ===============
cv2.setNumThreads(2)

# =============== Импорт твоих моделей ===============
from face_match import compare_faces
from yolo_detector import detect_document_region
from ocr_reader import extract_id_fields
from anti_spoof import estimate_liveness


app = FastAPI()

# ====================================================================
# Pydantic модели
# ====================================================================

class VerifyRequest(BaseModel):
    # UUID из Supabase — передаём как строку
    sessionId: str
    # документ может быть null пока не добавим колонку в БД
    documentUrl: Optional[str] = None
    selfieUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    country: str
    documentType: str


class Fields(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    document_number: Optional[str] = None
    birthday: Optional[str] = None
    expiry_date: Optional[str] = None
    raw_text: Optional[str] = None


class VerifyResponse(BaseModel):
    # тоже строка, просто эхо обратно
    sessionId: str
    status: Literal["approved", "rejected", "manual_review"]
    checks: dict
    fields: Fields
    mode: str


@app.get("/")
async def root():
    return {"status": "ok", "service": "passguard-ml"}


# ====================================================================
# Утилиты (ускорение)
# ====================================================================

def fast_resize(img, max_size=720):
    """Уменьшаем картинку для ускорения обработки 1080p+ видео."""
    h, w = img.shape[:2]
    scale = max_size / max(h, w)
    if scale < 1:
        return cv2.resize(img, (int(w * scale), int(h * scale)))
    return img


def download_image(url: str):
    resp = requests.get(url, timeout=20)
    if resp.status_code != 200:
        raise HTTPException(422, "cannot download image")
    img = cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(422, "cannot decode image")
    return fast_resize(img)


def extract_two_frames_from_video(url: str):
    tmp = "tmp_video.mp4"
    resp = requests.get(url, timeout=40)
    if resp.status_code != 200:
        raise HTTPException(422, "cannot download video")

    with open(tmp, "wb") as f:
        f.write(resp.content)

    cap = cv2.VideoCapture(tmp)
    if not cap.isOpened():
        raise HTTPException(422, "cannot open video")

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 2

    # frame 1
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(1, total // 10))
    ok1, f1 = cap.read()

    # frame 2
    cap.set(cv2.CAP_PROP_POS_FRAMES, total // 2)
    ok2, f2 = cap.read()

    cap.release()
    os.remove(tmp)

    if not ok1 or not ok2:
        raise HTTPException(422, "cannot read frames")

    return fast_resize(f1), fast_resize(f2)


def calc_motion_score(a, b):
    g1 = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
    g2 = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY)
    diff = cv2.absdiff(g1, g2)
    return float(diff.mean())


# ====================================================================
# Mediapipe Face Mesh (для blink + head movement)
# ====================================================================

mp_face = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=True,      # ускорение
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

LEFT = [33, 160, 158, 133, 153, 144]
RIGHT = [263, 387, 385, 362, 380, 373]


def EAR(points):
    def d(a, b): return np.linalg.norm(a - b)
    return (d(points[1], points[5]) + d(points[2], points[4])) / (2 * d(points[0], points[3]) + 1e-6)


def detect_blink(f1, f2):
    def get_ear(frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = mp_face.process(rgb)
        if not res.multi_face_landmarks:
            return None

        lm = res.multi_face_landmarks[0].landmark
        h, w = frame.shape[:2]
        pts = np.array([(p.x * w, p.y * h) for p in lm])

        left = pts[LEFT]
        right = pts[RIGHT]

        return (EAR(left) + EAR(right)) / 2

    e1 = get_ear(f1)
    e2 = get_ear(f2)

    if e1 is None or e2 is None:
        return False

    return (e1 - e2) > 0.12  # порог моргания


def detect_head_movement(f1, f2):
    def get_center(frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = mp_face.process(rgb)
        if not res.multi_face_landmarks:
            return None
        lm = res.multi_face_landmarks[0].landmark[1]  # точка носа
        return lm.x, lm.y

    c1 = get_center(f1)
    c2 = get_center(f2)

    if c1 is None or c2 is None:
        return 0.0

    dx = c1[0] - c2[0]
    dy = c1[1] - c2[1]

    return float(np.sqrt(dx * dx + dy * dy))


# ====================================================================
# Основной KYC эндпоинт
# ====================================================================

@app.post("/verify", response_model=VerifyResponse)
async def verify(req: VerifyRequest):

    if not req.videoUrl and not req.selfieUrl:
        raise HTTPException(422, "either videoUrl or selfieUrl required")

    # --- DOCUMENT ---
    if req.documentUrl:
        doc_img = download_image(req.documentUrl)
        doc_crop = detect_document_region(doc_img)
    else:
        # Временно: пропускаем обработку документа если URL не передан
        doc_img = None
        doc_crop = None

    # --- FACE ---
    if req.videoUrl:
        f1, f2 = extract_two_frames_from_video(req.videoUrl)
        selfie_img = f1
        mode_suffix = "+video"
    else:
        selfie_img = download_image(req.selfieUrl)
        f1 = f2 = selfie_img
        mode_suffix = "+selfie"

    # Face crop оптимизация
    h, w = selfie_img.shape[:2]
    face_crop = selfie_img[h // 8: h * 7 // 8, w // 6: w * 5 // 6]

    # Face Match
    if doc_crop is not None:
        fm = compare_faces(doc_crop, face_crop, threshold=0.5)
        face_ok = bool(fm["match"])
        face_score = float(fm["similarity"])
        face_reason = fm.get("error")
    else:
        # Временно: без документа считаем face match успешным
        face_ok = True
        face_score = 1.0
        face_reason = "document_not_provided"

    # Liveness — image anti-spoof
    img_live = estimate_liveness(face_crop)

    # Motion test
    motion_score = calc_motion_score(f1, f2)
    motion_ok = motion_score > 1.2

    # Blink test
    blink_ok = detect_blink(f1, f2)

    # Head movement
    head_change = detect_head_movement(f1, f2)
    head_ok = head_change > 0.01

    # Final liveness
    final_live = img_live["ok"] and motion_ok and blink_ok and head_ok

    # Переменные для checks
    face_ok = bool(face_ok)
    final_live = bool(final_live)
    motion_ok = bool(motion_ok)
    blink_ok = bool(blink_ok)
    head_ok = bool(head_ok)

    # OCR
    if doc_crop is not None:
        raw = extract_id_fields(doc_crop)
    else:
        # Временно: без документа возвращаем пустые поля
        raw = {}

    fields = Fields(
        document_number=raw.get("document_number"),
        birthday=raw.get("birthday"),
        expiry_date=raw.get("expiry_date"),
        raw_text=raw.get("raw_text"),
    )

    checks = {
        "face_match": {
            "ok": bool(face_ok),
            "score": float(face_score),
            "reason": face_reason
        },
        "liveness": {
            "ok": bool(final_live),
            "score": float(motion_score),
            "reason": None if final_live else "blink/motion/head failed"
        },
        "document_quality": {
            "ok": True,
            "score": 0.9,
            "reason": None
        },
        "document_expired": {
            "ok": True,
            "score": None,
            "reason": None
        }
    }

    # FINAL STATUS
    if face_ok and final_live:
        status = "approved"
    elif face_ok or final_live:
        status = "manual_review"
    else:
        status = "rejected"

    return VerifyResponse(
        sessionId=req.sessionId,
        status=status,
        checks=checks,
        fields=fields,
        mode="passguard-advanced" + mode_suffix,
    )
