"""
GET /models — returns available models and their metadata.
"""
import os
from fastapi import APIRouter
from api.config import MODEL_REGISTRY, DEFAULT_MODEL

router = APIRouter()


@router.get(
    "/models",
    summary="List available models",
    tags=["Models"],
    response_description="List of all registered models with metadata",
)
def list_models():
    result = []
    for key, cfg in MODEL_REGISTRY.items():
        result.append({
            "model_key": key,
            "display_name": cfg["display_name"],
            "dataset": cfg["dataset"],
            "emotions": cfg["emotions"],
            "reported_accuracy": cfg["accuracy"],
            "is_default": key == DEFAULT_MODEL,
            "available": os.path.exists(cfg["model_path"]),
        })
    return {"models": result, "default": DEFAULT_MODEL}
