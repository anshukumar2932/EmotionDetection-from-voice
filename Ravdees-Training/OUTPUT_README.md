# Output Directories

This directory contains separate output folders for each notebook in the project.

---

## Directory Overview

| Directory | Source Notebook | Purpose |
|-----------|-----------------|---------|
| `cnn_lstm +attention_layer_output/` | `cnn_lstm +attention_layer.ipynb` | CNN+LSTM with Attention model outputs |
| `cnn_lstm_output/` | `cnn_lstm.ipynb` | CNN+LSTM model outputs |
| `cnn_output/` | `cnn.ipynb` | CNN model outputs |
| `RandomForest_output/` | `RandomForest.ipynb` | Random Forest model outputs |

---

## Files to Save in Each Directory

### For CNN+LSTM with Attention (`cnn_lstm +attention_layer_output/`)
```
├── best_model.keras          # Best model checkpoint
├── final_model.keras         # Final trained model
├── normalization.pkl        # Mean/std for normalization
├── emotion_map.pkl          # Emotion label mapping
└── metrics/                  # (optional) evaluation metrics
```

### For CNN+LSTM (`cnn_lstm_output/`)
```
├── best_model.keras          # Best model checkpoint
├── final_model_cnn_lstm.keras # Final trained model
├── normalization.pkl        # Mean/std for normalization
├── emotion_map.pkl          # Emotion label mapping
└── training_history.json    # Training history
```

### For CNN (`cnn_output/`)
```
├── best_model.keras          # Best model checkpoint
├── final_model.keras         # Final trained model
├── normalization.pkl        # Mean/std for normalization
├── emotion_map.pkl          # Emotion label mapping
└── scaler.pkl               # StandardScaler (if used)
```

### For RandomForest (`RandomForest_output/`)
```
├── model.pkl                # Trained RandomForest model
├── scaler.pkl               # Feature scaler
├── encoder.pkl              # Label encoder
└── features.pkl             # Feature names
```

---

## Emotion Mapping (common to all)

```python
emotion_map = {
    'angry': 0,
    'calm': 1,
    'disgust': 2,
    'fearful': 3,
    'happy': 4,
    'neutral': 5,
    'sad': 6,
    'surprised': 7
}
```

---

## Model Input Shape

All neural network models expect:
- **Input shape**: `(200, 195)` - features padded/truncated to 200 time steps, 195 features
- **Features**: MFCC (40) + Chroma (12) + Mel (128) + Contrast (7) + Tonnetz (6) + ZCR (1) + RMS (1) = 195

---

## Normalization

Each model stores its own `normalization.pkl` with:
```python
{
    "mean": np.array,  # Computed on training data only
    "std": np.array
}
```

**Important**: Use the normalization values from the training notebook for prediction to avoid data leakage.

---

## Usage

1. **Training**: Save outputs to respective directories after training
2. **Prediction**: Load from the same directory as the trained model
3. **Evaluation**: Store metrics and confusion matrices in the respective folder