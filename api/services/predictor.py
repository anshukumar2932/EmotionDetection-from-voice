"""
Prediction service — orchestrates feature extraction, scaling, and inference
for each model type. Returns (emotion_label, confidence).
"""
import os
import numpy as np
from typing import Tuple

from api.config import MODEL_REGISTRY
from api.models.loader import load_model, load_scaler, load_encoder
from api.services.features import extract_features


def predict(model_key: str, audio_path: str) -> Tuple[str, float]:
    """
    Run inference for the given model on the given audio file.
    Returns (predicted_emotion, confidence_score).
    """
    cfg = MODEL_REGISTRY[model_key]
    model_type = cfg["type"]
    feature_fn = cfg["feature_fn"]

    # ── Extract features ──────────────────────────────────────────────────────
    features = extract_features(feature_fn, audio_path)

    # ── Route to the correct inference path ───────────────────────────────────
    if model_type == "pkl_bundle":
        return _predict_bundle(model_key, cfg, features)

    elif model_type in ("keras", "h5"):
        return _predict_keras(model_key, cfg, features, feature_fn)

    elif model_type == "pkl":
        return _predict_sklearn(model_key, cfg, features)

    else:
        raise ValueError(f"Unsupported model type: {model_type}")


# ── Keras / H5 models ─────────────────────────────────────────────────────────

def _predict_keras(model_key, cfg, features, feature_fn):
    model = load_model(model_key, cfg)

    if feature_fn == "keshav":
        # features shape: (128, 40) — needs scaling then batch dim
        scaler = load_scaler(model_key, cfg)
        if scaler is not None:
            n_steps, n_feat = features.shape
            features = scaler.transform(features.reshape(-1, n_feat)).reshape(n_steps, n_feat)
        features = features.astype(np.float32)[np.newaxis, ...]  # (1, 128, 40)

    elif feature_fn == "arpit":
        # already (1, 160, 92) from extractor
        features = features.astype(np.float32)

    else:
        # anshu: flat vector — scale then reshape for CNN input
        scaler = load_scaler(model_key, cfg)
        if scaler is not None:
            features = scaler.transform([features])
        else:
            features = features.reshape(1, -1)
        # Keras CNN/LSTM expects (batch, timesteps, features) or (batch, features, 1)
        features = features.astype(np.float32)

    probs = model.predict(features, verbose=0)[0]
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])

    # Resolve label
    encoder = load_encoder(model_key, cfg)
    if encoder is not None:
        # Could be a LabelEncoder or a dict (emotion_map)
        if hasattr(encoder, "inverse_transform"):
            label = encoder.inverse_transform([idx])[0]
        elif isinstance(encoder, dict):
            # emotion_map: {int: str} or {str: int}
            inv = {v: k for k, v in encoder.items()} if isinstance(list(encoder.keys())[0], str) else encoder
            label = inv.get(idx, cfg["emotions"][idx] if idx < len(cfg["emotions"]) else str(idx))
        else:
            label = cfg["emotions"][idx]
    else:
        label = cfg["emotions"][idx] if idx < len(cfg["emotions"]) else str(idx)

    return label.lower(), confidence


# ── Sklearn bundle (model + scaler + le packed in one pkl) ────────────────────

def _predict_bundle(model_key, cfg, features):
    bundle = load_model(model_key, cfg)
    model  = bundle["model"]
    scaler = bundle["scaler"]
    le     = bundle["le"]

    scaled = scaler.transform([features])
    pred   = model.predict(scaled)
    label  = le.inverse_transform(pred)[0]

    # Confidence: use predict_proba if available
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(scaled)[0]
        confidence = float(np.max(probs))
    elif hasattr(model, "decision_function"):
        scores = model.decision_function(scaled)[0]
        # Softmax approximation
        e = np.exp(scores - np.max(scores))
        probs = e / e.sum()
        confidence = float(np.max(probs))
    else:
        confidence = 1.0

    return label.lower(), confidence


# ── Standalone sklearn pkl ────────────────────────────────────────────────────

def _predict_sklearn(model_key, cfg, features):
    model  = load_model(model_key, cfg)
    scaler = load_scaler(model_key, cfg)
    encoder = load_encoder(model_key, cfg)

    if scaler is not None:
        features = scaler.transform([features])
    else:
        features = features.reshape(1, -1)

    pred = model.predict(features)

    if encoder is not None:
        label = encoder.inverse_transform(pred)[0]
    else:
        label = str(pred[0])

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features)[0]
        confidence = float(np.max(probs))
    else:
        confidence = 1.0

    return label.lower(), confidence
