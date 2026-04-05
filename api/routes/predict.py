"""
POST /predict-emotion
Accepts an optional audio file upload or picks a random dataset sample.
"""
import os
import time
import tempfile
import logging
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from api.config import MODEL_REGISTRY, DEFAULT_MODEL, MAX_UPLOAD_MB, ALLOWED_EXTENSIONS
from api.services.predictor import predict
from api.utils.dataset import get_random_sample_for_model

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/predict-emotion",
    summary="Predict emotion from audio",
    response_description="Predicted emotion with confidence score",
    tags=["Prediction"],
    responses={
        200: {
            "description": "Successful prediction",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "model_used": "anshu_cnn_lstm_attention",
                        "input_type": "uploaded",
                        "predicted_emotion": "happy",
                        "confidence": 0.91,
                        "latency_ms": 312.5,
                    }
                }
            },
        },
        400: {"description": "Invalid input (bad file format, unknown model, etc.)"},
        404: {"description": "No dataset audio found for random selection"},
        500: {"description": "Internal inference error"},
    },
)
async def predict_emotion(
    file: Optional[UploadFile] = File(
        default=None,
        description="Audio file to analyse (.wav, .mp3, .flac, .ogg, .m4a). "
                    "If omitted, a random sample is picked from the dataset.",
    ),
    model: str = Form(
        default=DEFAULT_MODEL,
        description=(
            "Model to use for inference. "
            "Allowed values: " + ", ".join(MODEL_REGISTRY.keys())
        ),
    ),
):
    start = time.perf_counter()

    # ── Validate model name ───────────────────────────────────────────────────
    if model not in MODEL_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown model '{model}'. Available: {list(MODEL_REGISTRY.keys())}",
        )

    cfg = MODEL_REGISTRY[model]
    model_path = cfg["model_path"]

    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=503,
            detail=f"Model file not found for '{model}'. "
                   f"Expected at: {model_path}",
        )

    # ── Resolve audio source ──────────────────────────────────────────────────
    tmp_path = None
    input_type = "uploaded"

    if file is not None:
        # Validate extension
        ext = os.path.splitext(file.filename or "")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. "
                       f"Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            )

        # Validate size
        contents = await file.read()
        if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum allowed size is {MAX_UPLOAD_MB} MB.",
            )

        # Write to temp file
        suffix = ext if ext else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        audio_path = tmp_path

    else:
        # Random dataset sample
        input_type = "random"
        audio_path = get_random_sample_for_model(model)

        if audio_path is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No audio files found for dataset '{cfg['dataset']}'. "
                    "Please upload a file or ensure the dataset is available."
                ),
            )

    # ── Run inference ─────────────────────────────────────────────────────────
    try:
        emotion, confidence = predict(model, audio_path)
    except Exception as exc:
        logger.exception("Inference failed for model '%s'", model)
        raise HTTPException(status_code=500, detail=f"Inference error: {str(exc)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info("model=%s emotion=%s confidence=%.3f latency_ms=%.1f", model, emotion, confidence, latency_ms)

    return {
        "success": True,
        "model_used": model,
        "input_type": input_type,
        "predicted_emotion": emotion,
        "confidence": round(confidence, 4),
        "latency_ms": latency_ms,
    }
