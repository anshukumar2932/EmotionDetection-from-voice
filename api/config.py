"""
Central configuration: model registry, dataset paths, emotion labels.
"""
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── Server Configuration ─────────────────────────────────────────────────────────
HOST = os.getenv("API_HOST", "0.0.0.0")
PORT = int(os.getenv("API_PORT", "8000"))
DEBUG = os.getenv("API_DEBUG", "false").lower() == "true"

# ── Model registry ────────────────────────────────────────────────────────────
# Each entry describes how to load and run a model.
MODEL_REGISTRY = {
    "anshu_cnn_lstm_attention": {
        "display_name": "Anshu CNN-LSTM+Attention (RAVDESS)",
        "type": "keras",
        "model_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_attention_output", "best_model.keras"),
        "scaler_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_attention_output", "normalization.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_attention_output", "emotion_map.pkl"),
        "feature_fn": "anshu",
        "dataset": "ravdess",
        "accuracy": 0.93,
        "emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
    },
    "anshu_cnn_lstm": {
        "display_name": "Anshu CNN-LSTM (RAVDESS)",
        "type": "keras",
        "model_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_output", "best_model.keras"),
        "scaler_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_output", "normalization.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_lstm_output", "emotion_map.pkl"),
        "feature_fn": "anshu_131",
        "dataset": "ravdess",
        "accuracy": 0.88,
        "emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
    },
    "anshu_cnn": {
        "display_name": "Anshu CNN (RAVDESS)",
        "type": "keras",
        "model_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "cnn_output", "best_model.keras"),
        "scaler_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "scaler.pkl"),
        "encoder_path": None,
        "feature_fn": "anshu",
        "dataset": "ravdess",
        "accuracy": 0.82,
        "emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
    },
    "anshu_random_forest": {
        "display_name": "Anshu Random Forest (RAVDESS)",
        "type": "pkl",
        "model_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "RandomForest_output", "model.pkl"),
        "scaler_path": os.path.join(BASE_DIR, "Anshu-RAVDESS", "scaler.pkl"),
        "encoder_path": None,
        "feature_fn": "anshu",
        "dataset": "ravdess",
        "accuracy": 0.75,
        "emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
    },
    "arpit_cnn_lstm": {
        "display_name": "Arpit CNN-LSTM (CREMA-D)",
        "type": "h5",
        "model_path": os.path.join(BASE_DIR, "Arpit-CREMA", "emotion_model_crema.h5"),
        "scaler_path": None,
        "encoder_path": None,
        "feature_fn": "arpit",
        "dataset": "crema",
        "accuracy": 0.80,
        "emotions": ["angry", "disgust", "fear", "happy", "sad", "neutral"],
    },
    "durgesh_svm": {
        "display_name": "Durgesh SVM (SAVEE)",
        "type": "pkl_bundle",
        "model_path": os.path.join(BASE_DIR, "Durgesh-SAVEE", "model.pkl"),
        "scaler_path": None,   # bundled inside model.pkl
        "encoder_path": None,  # bundled inside model.pkl
        "feature_fn": "durgesh",
        "dataset": "savee",
        "accuracy": 0.78,
        "emotions": ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"],
    },
    "keshav_rnn": {
        "display_name": "Keshav Bidirectional LSTM (CREMA-D)",
        "type": "h5",
        "model_path": os.path.join(BASE_DIR, "Keshav-CREMA", "emotion_rnn_model.h5"),
        "scaler_path": os.path.join(BASE_DIR, "Keshav-CREMA", "scaler.pkl"),
        "encoder_path": os.path.join(BASE_DIR, "Keshav-CREMA", "label_encoder.pkl"),
        "feature_fn": "keshav",
        "dataset": "crema",
        "accuracy": 0.72,
        "emotions": ["angry", "disgust", "fear", "happy", "neutral", "sad"],
    },
    "shantam_ensemble": {
        "display_name": "Shantam Ensemble MLP+SVM+RF (RAVDESS)",
        "type": "pkl_bundle",
        "model_path": os.path.join(BASE_DIR, "Shantam-RAVDESS", "model.pkl"),
        "scaler_path": None,   # bundled inside model.pkl
        "encoder_path": None,  # bundled inside model.pkl
        "feature_fn": "shantam",
        "dataset": "ravdess",
        "accuracy": 0.85,
        "emotions": ["calm", "happy", "sad", "angry", "surprised"],
    },
}

DEFAULT_MODEL = "anshu_cnn_lstm_attention"

# ── Dataset paths ─────────────────────────────────────────────────────────────
DATASET_BASE = os.getenv("DATASET_PATH", "/media/anshu/New Volume/Dataset")

DATASET_PATHS = {
    "ravdess": [
        os.path.join(DATASET_BASE, "Audio_Speech_Actors_01-24"),
        os.path.join(DATASET_BASE, "Audio_Song_Actors_01-24"),
    ],
    "crema": [
        os.path.join(DATASET_BASE, "Crema"),
    ],
    "savee": [
        os.path.join(DATASET_BASE, "SAVEE"),
    ],
}

MAX_UPLOAD_MB = 10
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
