# Arpit — Speech Emotion Recognition (CREMA-D)

**Author:** Arpit Singh (sarpitraj005@gmail.com)  
**Dataset:** CREMA-D (Crowd-sourced Emotional Multimodal Actors Dataset)  
**Model:** CNN + LSTM (Keras / TensorFlow)  
**Task:** 6-class emotion classification from raw audio  
**Saved Model:** `emotion_model.h5`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Dataset](#2-dataset)
3. [File Structure](#3-file-structure)
4. [Dependencies](#4-dependencies)
5. [Feature Extraction Pipeline](#5-feature-extraction-pipeline)
6. [Data Augmentation](#6-data-augmentation)
7. [Model Architecture](#7-model-architecture)
8. [Training Configuration](#8-training-configuration)
9. [How to Train](#9-how-to-train)
10. [How to Predict](#10-how-to-predict)
11. [Design Decisions](#11-design-decisions)
12. [Known Limitations](#12-known-limitations)

---

## 1. Project Overview

This module trains a deep learning model to classify human speech into one of six emotional categories using the CREMA-D dataset. The model combines 1D Convolutional layers (for local pattern detection) with LSTM layers (for temporal sequence modelling), making it well-suited for audio signals where both local spectral features and their evolution over time matter.

The pipeline covers:
- Raw audio loading and augmentation
- Sequential feature extraction (MFCC + Delta + Chroma)
- Padding/truncation to a fixed frame length
- Per-sample z-score normalisation
- CNN-LSTM model training with class balancing
- Saving the trained model for inference

---

## 2. Dataset

**CREMA-D** (Crowd-sourced Emotional Multimodal Actors Dataset)

| Property | Value |
|---|---|
| Total clips | 7,442 |
| Actors | 91 (48 male, 43 female) |
| Age range | 20–74 years |
| Sentences | 12 fixed sentences |
| Emotion classes | 6 |
| Format | `.wav`, 16-bit PCM |
| Source | [Kaggle / GitHub](https://github.com/CheyneyComputerScience/CREMA-D) |

### Emotion Classes

| Code | Label | Description |
|---|---|---|
| `ANG` | angry | Expressed anger or frustration |
| `DIS` | disgust | Expressed disgust |
| `FEA` | fear | Expressed fear or anxiety |
| `HAP` | happy | Expressed happiness or joy |
| `SAD` | sad | Expressed sadness |
| `NEU` | neutral | No emotional expression |

### Filename Convention

CREMA-D filenames encode metadata directly:

```
1001_DFA_ANG_XX.wav
│    │   │   └── Intensity level (LO, MD, HI, XX)
│    │   └────── Emotion code (ANG, DIS, FEA, HAP, SAD, NEU)
│    └────────── Sentence ID
└─────────────── Actor ID (1001–1091)
```

The training script parses `parts[2]` (the third `_`-separated token) to extract the emotion label.

### Dataset Setup

Download the dataset and place it at:

```
dataset/
└── Crema/
    ├── 1001_DFA_ANG_XX.wav
    ├── 1001_DFA_DIS_XX.wav
    └── ...
```

The training script reads from `dataset/Crema/` by default (first 2,500 files).

---

## 3. File Structure

```
Arpit-CREMA/
├── train.py            # Full training pipeline
├── predict.py          # Inference script (CLI)
├── main.ipynb          # Training notebook (interactive)
└── emotion_model.h5    # Saved trained model (generated after training)
```

---

## 4. Dependencies

```
tensorflow >= 2.10
librosa >= 0.10
numpy
scikit-learn
soundfile
```

Install with:

```bash
pip install tensorflow librosa numpy scikit-learn soundfile
```

---

## 5. Feature Extraction Pipeline

Each audio file is transformed into a 2D feature matrix of shape `(160, 92)` — 160 time frames × 92 feature dimensions.

### Step-by-step

**1. Load audio**
```python
signal, sr = librosa.load(file_path, sr=None)  # keep original sample rate
```
`sr=None` preserves the original sample rate (typically 16 kHz for CREMA-D) rather than resampling.

**2. Extract MFCC (40 coefficients)**
```python
mfcc = librosa.feature.mfcc(y=signal, sr=sr, n_mfcc=40)
# shape: (40, n_frames)
```
MFCCs capture the spectral envelope of the voice — essentially a compact representation of the vocal tract shape at each time frame.

**3. Delta MFCC — first-order derivative**
```python
delta = librosa.feature.delta(mfcc)
# shape: (40, n_frames)
```
Captures the *rate of change* of MFCCs over time — how quickly the voice is transitioning between states.

**4. Delta-Delta MFCC — second-order derivative**
```python
delta2 = librosa.feature.delta(mfcc, order=2)
# shape: (40, n_frames)
```
Captures the *acceleration* of change — useful for detecting abrupt emotional shifts.

**5. Chroma features (12 bins)**
```python
chroma = librosa.feature.chroma_stft(y=signal, sr=sr)
# shape: (12, n_frames)
```
Chroma maps energy across the 12 pitch classes (C, C#, D, ..., B). Adds pitch-related information that complements the spectral MFCCs.

**6. Stack and transpose**
```python
features = np.vstack((mfcc, delta, delta2, chroma)).T
# shape: (n_frames, 92)   [40 + 40 + 40 + 12 = 92 features per frame]
```

**7. Pad or truncate to 160 frames**
```python
if len(features) < 160:
    features = np.pad(features, ((0, 160 - len(features)), (0, 0)))
else:
    features = features[:160]
# final shape: (160, 92)
```
160 frames at a typical hop length of 512 samples covers roughly 3–4 seconds of audio — sufficient for most CREMA-D utterances.

**8. Per-sample z-score normalisation**
```python
features = (features - np.mean(features)) / (np.std(features) + 1e-8)
```
Normalises each sample independently (not across the dataset). This makes the model robust to volume differences between recordings. The `1e-8` epsilon prevents division by zero for silent clips.

### Feature Summary

| Feature | Coefficients | Shape contribution |
|---|---|---|
| MFCC | 40 | 40 per frame |
| Delta MFCC | 40 | 40 per frame |
| Delta-Delta MFCC | 40 | 40 per frame |
| Chroma | 12 | 12 per frame |
| **Total** | **92** | **(160, 92) per sample** |

---

## 6. Data Augmentation

To improve generalisation and reduce overfitting, each audio clip is augmented into **3 versions** before feature extraction:

```python
def augment(signal, sr):
    noise = signal + 0.002 * np.random.randn(len(signal))   # Gaussian noise
    shift = np.roll(signal, int(sr * 0.05))                  # 50ms time shift
    return [signal, noise, shift]
```

| Version | Technique | Effect |
|---|---|---|
| Original | None | Baseline |
| Noisy | Add Gaussian noise (σ=0.002) | Simulates microphone/background noise |
| Shifted | Roll signal by 50ms | Simulates slight timing variation |

This triples the effective dataset size. With 2,500 input files and ~3 augmented versions each, the training set grows to ~7,500 samples before the 80/20 split.

> Note: Augmentation is applied only during training (in `train.py`). The `predict.py` inference script uses the original signal without augmentation.

---

## 7. Model Architecture

The model is a sequential CNN-LSTM hybrid built with Keras.

```
Input: (160, 92)
│
├── Conv1D(128 filters, kernel=5, activation=relu)
├── BatchNormalization
├── MaxPooling1D(pool_size=2)                    → (78, 128)
│
├── Conv1D(256 filters, kernel=5, activation=relu)
├── BatchNormalization
├── MaxPooling1D(pool_size=2)                    → (37, 256)
│
├── Dropout(0.4)
│
├── LSTM(128, return_sequences=True)             → (37, 128)
├── LSTM(64)                                     → (64,)
│
├── Dense(128, activation=relu)
├── Dropout(0.4)
├── Dense(128, activation=relu)
│
└── Dense(6, activation=softmax)                 → (6,) probabilities
```

### Layer-by-layer rationale

**Conv1D (128 filters, kernel 5)**  
Scans across 5 consecutive time frames to detect local spectral patterns — e.g. a sharp rise in energy typical of angry speech. 128 filters allow the layer to learn a diverse set of detectors.

**BatchNormalization**  
Normalises activations within each mini-batch. Stabilises training, allows higher learning rates, and acts as a mild regulariser.

**MaxPooling1D (pool 2)**  
Halves the time dimension, reducing computation and making the representation slightly translation-invariant (small timing shifts don't change the output).

**Conv1D (256 filters, kernel 5)**  
A second convolutional layer with more filters learns higher-level combinations of the patterns found by the first layer.

**Dropout (0.4)**  
Randomly zeros 40% of activations during training. Placed before the LSTM to prevent the recurrent layers from memorising specific convolutional patterns.

**LSTM (128, return_sequences=True)**  
Reads the sequence of convolutional feature maps over time. `return_sequences=True` passes the full sequence to the next LSTM layer, enabling stacked recurrence.

**LSTM (64)**  
Second LSTM layer that distils the temporal patterns into a single 64-dimensional context vector.

**Dense (128) → Dropout (0.4) → Dense (128)**  
Two fully connected layers with dropout for final feature combination before classification.

**Dense (6, softmax)**  
Output layer. Softmax converts raw scores to probabilities summing to 1.0. The index of the highest probability is the predicted emotion.

---

## 8. Training Configuration

| Hyperparameter | Value | Reason |
|---|---|---|
| Optimiser | Adam | Adaptive learning rate, robust default |
| Learning rate | 0.0003 | Lower than default (0.001) to avoid overshooting |
| Loss function | `sparse_categorical_crossentropy` | Integer-encoded labels (no one-hot needed) |
| Batch size | 32 | Good balance of speed and gradient stability |
| Epochs | 60 | Enough for convergence; LR reduction handles plateaus |
| Test split | 20% | Stratified to preserve class balance |
| Shuffle | True | Prevents order-dependent learning |

### Class Balancing

CREMA-D has a roughly balanced distribution, but `compute_class_weight('balanced', ...)` is used to compute per-class weights. These are passed to `model.fit()` so that the loss for under-represented classes is scaled up, preventing the model from biasing toward majority classes.

```python
class_weights = compute_class_weight(
    class_weight='balanced',
    classes=np.unique(y_train),
    y=y_train
)
```

### Learning Rate Schedule

`ReduceLROnPlateau` halves the learning rate when `val_loss` stops improving for 4 consecutive epochs:

```python
ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4)
```

This allows the model to make large updates early in training and fine-tune with smaller steps later, without manually tuning a schedule.

---

## 9. How to Train

**1. Set up the dataset**

```bash
# Place CREMA-D .wav files at:
mkdir -p dataset/Crema
# copy your .wav files into dataset/Crema/
```

**2. Install dependencies**

```bash
pip install tensorflow librosa numpy scikit-learn soundfile
```

**3. Run training**

```bash
cd Arpit-CREMA
python train.py
```

Training will print progress every 50 files during feature extraction, then epoch-by-epoch loss and accuracy. On a modern CPU this takes ~10–20 minutes; on a GPU ~2–5 minutes.

**4. Output**

After training completes, `emotion_model.h5` is saved in the `Arpit-CREMA/` directory.

---

## 10. How to Predict

```bash
cd Arpit-CREMA
python predict.py
```

You will be prompted:

```
Enter audio file name: path/to/your/audio.wav
Predicting...
Predicted Emotion: happy
```

### Programmatic usage

```python
from predict import predict_emotion

emotion = predict_emotion("path/to/audio.wav")
print(emotion)  # e.g. "happy"
```

### What predict.py does internally

1. Loads `emotion_model.h5`
2. Calls `extract_features(file_path)` — same pipeline as training (MFCC + Delta + Delta² + Chroma, padded to 160 frames, z-score normalised)
3. Runs `model.predict()` → softmax probabilities over 6 classes
4. Returns `labels[np.argmax(prediction)]`

Label order (matches training encoder output):
```python
labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'neutral']
```

---

## 11. Design Decisions

**Why CNN before LSTM?**  
Raw feature sequences are noisy. The Conv1D layers act as learned filters that extract meaningful local patterns (e.g. a burst of high-frequency energy) before the LSTM tries to model temporal dependencies. This is consistently more effective than feeding raw features directly into an LSTM.

**Why per-sample normalisation instead of a global scaler?**  
A global `StandardScaler` fitted on training data can cause distribution shift at inference time if the test audio has different recording conditions. Per-sample z-score normalisation (`mean=0, std=1` per clip) is recording-condition agnostic and requires no saved scaler artifact.

**Why `sr=None` in librosa.load?**  
CREMA-D files are recorded at 16 kHz. Resampling to 22 kHz (librosa's default) would add unnecessary computation and slightly distort the spectral features. Keeping the original sample rate is more faithful to the training distribution.

**Why 160 frames?**  
At 16 kHz with librosa's default `hop_length=512`, one frame ≈ 32ms. 160 frames ≈ 5.1 seconds, which comfortably covers all CREMA-D utterances (typically 1–3 seconds) with room for padding.

**Why Dropout after Conv but not after each LSTM?**  
LSTM layers have built-in recurrent dropout mechanisms. A single Dropout(0.4) before the LSTM stack is sufficient to prevent the convolutional features from being memorised, without disrupting the recurrent state flow between LSTM layers.

---

## 12. Known Limitations

- **No saved scaler** — normalisation is per-sample at inference time. This is intentional (see Design Decisions) but means the model may be sensitive to very short or silent clips where `std ≈ 0`.
- **Fixed 2,500 file cap** — `train.py` uses `os.listdir(dataset_path)[:2500]`. Remove the slice to train on the full 7,442-file dataset for better accuracy.
- **Label order is hardcoded** — `predict.py` uses a fixed `labels` list. If you retrain with a different `LabelEncoder` fit order, the labels may not align. Save and reload the encoder to be safe.
- **No GPU memory management** — for large batch training on GPU, consider adding `tf.config.experimental.set_memory_growth`.
- **Mono audio only** — `librosa.load` returns mono by default. Stereo files are mixed down automatically, which is correct behaviour for SER.
