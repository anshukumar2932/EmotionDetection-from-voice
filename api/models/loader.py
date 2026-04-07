"""
Lazy model loader with in-memory cache.
Supports .keras, .h5, and .pkl (standalone or bundle) formats.
"""
import pickle
import joblib
from functools import lru_cache
from typing import Any, Dict, Tuple

_cache: Dict[str, Any] = {}


def load_model(model_key: str, cfg: dict) -> Any:
    """
    Load and cache a model by key.
    Returns the raw model object (Keras model or sklearn estimator).
    For pkl_bundle types, returns the full bundle dict.
    """
    if model_key in _cache:
        return _cache[model_key]

    model_type = cfg["type"]
    path = cfg["model_path"]

    if model_type in ("keras", "h5"):
        # .keras files use the new Keras 3 format
        # .h5 files are legacy Keras 2 — must use tf.keras with compile=False
        if model_type == "h5":
            import tensorflow as tf
            model = tf.keras.models.load_model(path, compile=False)
        else:
            from tensorflow.keras.models import load_model as keras_load
            model = keras_load(path)

    elif model_type == "pkl_bundle":
        with open(path, "rb") as f:
            model = pickle.load(f)  # dict with keys: model, scaler, le

    elif model_type == "pkl":
        model = joblib.load(path)

    else:
        raise ValueError(f"Unknown model type: {model_type}")

    _cache[model_key] = model
    return model


def load_scaler(model_key: str, cfg: dict) -> Any:
    """Load and cache a standalone scaler (.pkl)."""
    cache_key = f"{model_key}_scaler"
    if cache_key in _cache:
        return _cache[cache_key]

    path = cfg.get("scaler_path")
    if not path:
        return None

    scaler = joblib.load(path)
    _cache[cache_key] = scaler
    return scaler


def load_encoder(model_key: str, cfg: dict) -> Any:
    """Load and cache a standalone label encoder (.pkl)."""
    cache_key = f"{model_key}_encoder"
    if cache_key in _cache:
        return _cache[cache_key]

    path = cfg.get("encoder_path")
    if not path:
        return None

    encoder = joblib.load(path)
    _cache[cache_key] = encoder
    return encoder


def clear_cache():
    _cache.clear()
