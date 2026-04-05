# Speech Emotion Recognition — API

A FastAPI backend that runs inference across **8 pre-trained models** from 5 contributors, trained on the RAVDESS, CREMA-D, and SAVEE datasets. Accepts uploaded audio or picks a random dataset sample, runs the selected model's full preprocessing pipeline, and returns a structured JSON prediction.

**Swagger UI:** `http://localhost:8000/docs`  
**Base URL:** `http://localhost:8000`

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Structure](#2-project-structure)
3. [Endpoints](#3-endpoints)
   - [POST /predict-emotion](#post-predict-emotion)
   - [GET /models](#get-models)
   - [GET /health](#get-health)
4. [Model Registry](#4-model-registry)
5. [Feature Extraction Pipelines](#5-feature-extraction-pipelines)
6. [Architecture](#6-architecture)
7. [Configuration](#7-configuration)
8. [Error Reference](#8-error-reference)
9. [Dataset Setup](#9-dataset-setup)
10. [Development Notes](#10-development-notes)

---

## 1. Quick Start

**Install dependencies**

```bash
pip install -r api/requirements.txt
```

**Run the server** (from the repo root)

```bash
uvicorn api.main:app --reload
```

The server starts at `http://localhost:8000`.  
Open `http://localhost:8000/docs` for the interactive Swagger UI.

**Make your first prediction**

```bash
# Upload a file
curl -X POST http://localhost:8000/predict-emotion \
  -F "file=@your_audio.wav" \
  -F "model=anshu_cnn_lstm_attention"

# Use a random dataset sample (no file needed)
curl -X POST http://localhost:8000/predict-emotion \
  -F "model=keshav_rnn"
```

---

## 2. Project Structure

```
api/
├── main.py                  # FastAPI app, CORS, router registration
├── config.py                # Model registry, dataset paths, upload limits
├── requirements.txt
│
├── routes/
│   ├── predict.py           # POST /predict-emotion
│   └── models.py            # GET /models
│
├── services/
│   ├── features.py          # Per-contributor feature extraction functions
│   └── predictor.py         # Inference orchestration (scaling → model → label)
│
├── models/
│   └── loader.py            # Lazy loader + in-memory cache for all model types
│
└── utils/
    └── dataset.py           # Random audio sample picker from dataset folders
```

---

## 3. Endpoints

### POST /predict-emotion

Predict the emotion in an audio clip. Accepts either an uploaded file or triggers random dataset sampling if no file is provided.

**Content-Type:** `multipart/form-data`

#### Form Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `file` | file | No | — | Audio file to analyse. Omit to use a random dataset sample. |
| `model` | string | No | `anshu_cnn_lstm_attention` | Model key to use for inference. See [Model Registry](#4-model-registry). |

#### Accepted Audio Formats

`.wav` `.mp3` `.flac` `.ogg` `.m4a`

Maximum file size: **10 MB**

#### Success Response `200`

```json
{
  "success": true,
  "model_used": "anshu_cnn_lstm_attention",
  "input_type": "uploaded",
  "predicted_emotion": "happy",
  "confidence": 0.9134,
  "latency_ms": 312.5
}
```

| Field | Type | Description |
|---|---|---|
| `success` | bool | Always `true` on a successful prediction |
| `model_used` | string | The model key that ran inference |
| `input_type` | string | `"uploaded"` or `"random"` |
| `predicted_emotion` | string | Lowercase emotion label |
| `confidence` | float | Softmax probability of the top class (0.0 – 1.0) |
| `latency_ms` | float | Total request time in milliseconds |

#### Example — upload a file

```bash
curl -X POST http://localhost:8000/predict-emotion \
  -F "file=@speech.wav" \
  -F "model=arpit_cnn_lstm"
```

#### Example — random sample, default model

```bash
curl -X POST http://localhost:8000/predict-emotion
```

#### Example — Python (requests)

```python
import requests

# Upload a file
with open("speech.wav", "rb") as f:
    resp = requests.post(
        "http://localhost:8000/predict-emotion",
        files={"file": ("speech.wav", f, "audio/wav")},
        data={"model": "shantam_ensemble"},
    )
print(resp.json())

# Random sample
resp = requests.post(
    "http://localhost:8000/predict-emotion",
    data={"model": "durgesh_svm"},
)
print(resp.json())
```

---

### GET /models

Returns metadata for all registered models.

```bash
curl http://localhost:8000/models
```

#### Response `200`

```json
{
  "models": [
    {
      "model_key": "anshu_cnn_lstm_attention",
      "display_name": "Anshu CNN-LSTM+Attention (RAVDESS)",
      "dataset": "ravdess",
      "emotions": ["angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"],
      "reported_accuracy": 0.93,
      "is_default": true,
      "available": true
    },
    ...
  ],
  "default": "anshu_cnn_lstm_attention"
}
```

| Field | Description |
|---|---|
| `model_key` | The string to pass as the `model` field in `/predict-emotion` |
| `available` | `true` if the model file exists on disk, `false` if not yet trained/placed |
| `is_default` | `true` for the model used when no `model` field is provided |

---

### GET /health

Simple liveness check.

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

---

## 4. Model Registry

All 8 models, their datasets, emotion sets, and reported test accuracies:

| Model Key | Contributor | Architecture | Dataset | Emotions | Accuracy |
|---|---|---|---|---|---|
| `anshu_cnn_lstm_attention` ⭐ | Anshu | CNN-LSTM + Attention | RAVDESS | 8 | 93% |
| `anshu_cnn_lstm` | Anshu | CNN-LSTM | RAVDESS | 8 | 88% |
| `anshu_cnn` | Anshu | CNN | RAVDESS | 8 | 82% |
| `anshu_random_forest` | Anshu | Random Forest | RAVDESS | 8 | 75% |
| `arpit_cnn_lstm` | Arpit | CNN-LSTM | CREMA-D | 6 | 80% |
| `durgesh_svm` | Durgesh | SVM (RBF+Poly) | SAVEE | 7 | 78% |
| `keshav_rnn` | Keshav | Bidirectional LSTM | CREMA-D | 6 | 72% |
| `shantam_ensemble` | Shantam | MLP + SVM + RF (soft vote) | RAVDESS | 5 | 85% |

⭐ = default model

### Emotion labels per model

**RAVDESS models** (`anshu_*`, `shantam_ensemble`)

| Model | Emotions |
|---|---|
| `anshu_*` | angry, calm, disgust, fearful, happy, neutral, sad, surprised |
| `shantam_ensemble` | calm, happy, sad, angry, surprised |

**CREMA-D models** (`arpit_cnn_lstm`, `keshav_rnn`)

angry, disgust, fear, happy, sad, neutral

**SAVEE model** (`durgesh_svm`)

angry, disgust, fear, happy, neutral, sad, surprise

### Model file locations

| Model Key | File Path |
|---|---|
| `anshu_cnn_lstm_attention` | `Anshu-RAVDESS/cnn_lstm_attention_output/best_model.keras` |
| `anshu_cnn_lstm` | `Anshu-RAVDESS/cnn_lstm_output/best_model.keras` |
| `anshu_cnn` | `Anshu-RAVDESS/cnn_output/best_model.keras` |
| `anshu_random_forest` | `Anshu-RAVDESS/RandomForest_output/model.pkl` |
| `arpit_cnn_lstm` | `Arpit-CREMA/emotion_model.h5` |
| `durgesh_svm` | `Durgesh-SAVEE/model.pkl` |
| `keshav_rnn` | `Keshav-CREMA/emotion_rnn_model.h5` |
| `shantam_ensemble` | `Shantam-RAVDESS/model.pkl` |

If a model file is missing, the API returns `503` with the expected path in the error message. Use `GET /models` to check `"available": true/false` for each model before calling predict.

---

## 5. Feature Extraction Pipelines

Each model was trained with a different preprocessing pipeline. The API replicates each one exactly at inference time. All extraction is handled in `api/services/features.py`.

### Anshu — flat aggregated vector

Used by: `anshu_cnn_lstm_attention`, `anshu_cnn_lstm`, `anshu_cnn`, `anshu_random_forest`

```
librosa.load(sr=22050) → normalize
→ MFCC(40)          mean+std  →  80 dims
→ Delta MFCC        mean+std  →  80 dims
→ Delta² MFCC       mean+std  →  80 dims
→ Chroma(12)        mean+std  →  24 dims
→ Mel(128)          mean+std  → 256 dims
→ Spectral Contrast mean+std  →  14 dims
→ Tonnetz(6)        mean+std  →  12 dims
→ ZCR               mean+std  →   2 dims
→ RMS               mean+std  →   2 dims
                              ──────────
                         Total: 550-dim flat vector
```

Scaler: `normalization.pkl` (StandardScaler, fitted per model output folder)

### Arpit — sequential 2D matrix

Used by: `arpit_cnn_lstm`

```
librosa.load(sr=None, original rate)
→ MFCC(40) + Delta(40) + Delta²(40) + Chroma(12)  →  stacked (frames, 92)
→ pad/truncate to 160 frames
→ per-sample z-score: (x - mean) / (std + 1e-8)
→ expand dims                                      →  shape (1, 160, 92)
```

No saved scaler — normalisation is per-sample at inference time.

### Durgesh — 471-dim flat vector

Used by: `durgesh_svm`

```
librosa.load(sr=22050) → normalize
→ MFCC(40)           mean+std  →  80 dims
→ Delta MFCC         mean+std  →  80 dims
→ Delta² MFCC        mean+std  →  80 dims
→ Chroma(12)         mean      →  12 dims
→ Mel(128)           mean      → 128 dims
→ Tonnetz(6)         mean      →   6 dims
→ ZCR                mean      →   1 dim
→ RMS                mean      →   1 dim
→ Spectral Centroid  mean      →   1 dim
→ Spectral Bandwidth mean      →   1 dim
→ Spectral Rolloff   mean      →   1 dim
                               ──────────
                          Total: 471-dim flat vector
```

Scaler + label encoder are bundled inside `model.pkl` as `{"model": ..., "scaler": ..., "le": ...}`.

### Keshav — sequential MFCC matrix

Used by: `keshav_rnn`

```
librosa.load(sr=None, duration=4.0s)
→ MFCC(40, hop_length=512)  →  (n_frames, 40)
→ pad/truncate to 128 frames
→ StandardScaler (fitted on training data, saved as scaler.pkl)
   applied frame-by-frame: reshape(-1, 40) → scale → reshape(128, 40)
→ expand dims                              →  shape (1, 128, 40)
```

Scaler: `Keshav-CREMA/scaler.pkl`  
Label encoder: `Keshav-CREMA/label_encoder.pkl`

### Shantam — flat aggregated vector

Used by: `shantam_ensemble`

```
librosa.load(sr=22050)
→ MFCC(40)           mean+std  →  80 dims
→ Delta MFCC         mean+std  →  80 dims
→ Delta² MFCC        mean+std  →  80 dims
→ Chroma(12)         mean+std  →  24 dims
→ Mel(128)           mean+std  → 256 dims
→ ZCR                mean+std  →   2 dims
→ Spectral Contrast  mean+std  →  14 dims
→ Spectral Rolloff   mean+std  →   2 dims
                               ──────────
                          Total: 538-dim flat vector
```

Scaler + label encoder bundled inside `model.pkl`.

---

## 6. Architecture

### Request flow

```
POST /predict-emotion
        │
        ▼
  routes/predict.py
  ├── validate model key         (config.MODEL_REGISTRY)
  ├── check model file exists
  ├── if file uploaded:
  │     validate extension + size
  │     write to temp file
  └── if no file:
        pick random sample       (utils/dataset.py)
        │
        ▼
  services/predictor.py
  ├── extract_features()         (services/features.py)
  │     └── contributor-specific pipeline
  ├── load_model() / load_scaler() / load_encoder()
  │     └── models/loader.py     (lazy load + in-memory cache)
  ├── scale features
  ├── model.predict()
  └── resolve label from encoder or emotion list
        │
        ▼
  JSON response
  {success, model_used, input_type, predicted_emotion, confidence, latency_ms}
```

### Model loading strategy

Models are loaded **lazily** — only when first requested — and kept in a **module-level dict cache** (`_cache` in `loader.py`). Subsequent requests for the same model skip disk I/O entirely.

| Model type | Loader | Cache key |
|---|---|---|
| `.keras` | `tensorflow.keras.models.load_model` | `model_key` |
| `.h5` | `tensorflow.keras.models.load_model` | `model_key` |
| `.pkl` (standalone) | `joblib.load` | `model_key` |
| `.pkl` (bundle) | `pickle.load` → dict | `model_key` |
| scaler `.pkl` | `joblib.load` | `{model_key}_scaler` |
| encoder `.pkl` | `joblib.load` | `{model_key}_encoder` |

TensorFlow is imported inside the loader function, not at module level, so the server starts instantly even if TF takes a few seconds to initialise.

### Confidence scoring

| Model type | Method |
|---|---|
| Keras / H5 | `softmax[-1]` → `max(probs)` |
| sklearn with `predict_proba` | `max(predict_proba(...)[0])` |
| SVM with `decision_function` | softmax approximation over decision scores |
| sklearn without either | `1.0` (no probability available) |

---

## 7. Configuration

All configuration lives in `api/config.py`. No environment variables are required for basic usage.

### Upload limits

```python
MAX_UPLOAD_MB = 10
ALLOWED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
```

### Dataset paths

The random sample picker searches these paths in order, stopping when it finds `.wav` files:

```python
DATASET_PATHS = {
    "ravdess": ["dataset/RAVDESS", "dataset/Actor_*", "RAVDESS"],
    "crema":   ["dataset/Crema", "dataset/AudioWAV", "AudioWAV"],
    "savee":   ["dataset/ALL", "SAVEE"],
}
```

All paths are relative to the repo root. Update these if your datasets are stored elsewhere.

### Adding a new model

1. Add an entry to `MODEL_REGISTRY` in `config.py`:

```python
"your_model_key": {
    "display_name": "Your Name — Model Type (Dataset)",
    "type": "h5",                          # keras | h5 | pkl | pkl_bundle
    "model_path": os.path.join(BASE_DIR, "YourFolder", "model.h5"),
    "scaler_path": os.path.join(BASE_DIR, "YourFolder", "scaler.pkl"),  # or None
    "encoder_path": os.path.join(BASE_DIR, "YourFolder", "encoder.pkl"), # or None
    "feature_fn": "your_name",             # key into _EXTRACTORS dict
    "dataset": "ravdess",                  # ravdess | crema | savee
    "accuracy": 0.87,
    "emotions": ["angry", "happy", ...],
},
```

2. Add a feature extraction function to `api/services/features.py` and register it in `_EXTRACTORS`:

```python
def extract_your_name(file_path: str) -> np.ndarray:
    audio, sr = librosa.load(file_path, sr=22050)
    # ... your preprocessing ...
    return features

_EXTRACTORS["your_name"] = extract_your_name
```

3. If your model uses a `pkl_bundle` (dict with `model`, `scaler`, `le` keys), no changes to `predictor.py` are needed — it's handled automatically.

---

## 8. Error Reference

| Status | When | Example detail |
|---|---|---|
| `400` | Unknown model key | `"Unknown model 'xyz'. Available: [...]"` |
| `400` | Unsupported file format | `"Unsupported file format '.mp4'. Allowed: [...]"` |
| `400` | File too large | `"File too large. Maximum allowed size is 10 MB."` |
| `404` | Random mode, no dataset files found | `"No audio files found for dataset 'savee'."` |
| `503` | Model file missing from disk | `"Model file not found for 'anshu_cnn'. Expected at: ..."` |
| `500` | Inference exception | `"Inference error: <exception message>"` |

All errors follow FastAPI's standard format:

```json
{
  "detail": "Unsupported file format '.mp4'. Allowed: ['.flac', '.m4a', '.mp3', '.ogg', '.wav']"
}
```

---

## 9. Dataset Setup

The random sample feature requires the datasets to be present locally. Place them at the paths listed in `config.py`:

**RAVDESS**
```
dataset/
└── RAVDESS/
    ├── Actor_01/
    │   └── 03-01-01-01-01-01-01.wav
    └── Actor_02/
        └── ...
```

**CREMA-D**
```
dataset/
└── Crema/
    ├── 1001_DFA_ANG_XX.wav
    └── ...
```

**SAVEE**
```
dataset/
└── ALL/
    ├── DC_a01.wav
    └── ...
```

If datasets are not present, the API still works fine for uploaded files. The `GET /models` endpoint will show `"available": true/false` per model regardless of dataset presence.

---

## 10. Development Notes

### Running with auto-reload

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Running in production

```bash
uvicorn api.main:app --workers 2 --host 0.0.0.0 --port 8000
```

Note: multiple workers each maintain their own model cache. The first request per worker per model will trigger a load. With TensorFlow models this can take 5–15 seconds; subsequent requests are fast.

### Logging

The API logs every prediction at INFO level:

```
2024-01-15 10:23:41  INFO  api.routes.predict — model=anshu_cnn_lstm_attention emotion=happy confidence=0.913 latency_ms=312.1
```

Inference errors are logged at ERROR level with a full traceback.

### CORS

CORS is configured to allow all origins (`*`) for development convenience. Restrict this in production:

```python
# api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],
    ...
)
```

### Dependencies

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9      # required for multipart/form-data file uploads
librosa>=0.10.0
numpy>=1.24.0
scikit-learn>=1.3.0
tensorflow>=2.13.0
joblib>=1.3.0
soundfile>=0.12.0
```
