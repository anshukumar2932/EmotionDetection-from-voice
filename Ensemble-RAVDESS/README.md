# Ensemble (MLP + SVM + RF) — RAVDESS

Model: Soft-voting ensemble of MLP, SVM, and Random Forest (scikit-learn)  
Dataset: RAVDESS (5 emotions: calm, happy, sad, angry, surprised)  
Features: MFCC + Delta + Delta² + Chroma + Mel + ZCR + Spectral Contrast + Rolloff  
Output: `model.pkl`

## Files
- `train.py` — trains ensemble and saves model
- `predict.py` — records 5s of live audio and predicts emotion
- `extract_features.py` — feature extraction (supports file path or raw audio)
- `requirements.txt` — dependencies

## Run
```bash
python train.py      # trains and saves model.pkl
python predict.py    # live mic prediction
```
