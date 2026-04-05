# Shantam — RAVDESS Ensemble

Author: Shantam Sharma (writetoshantam@gmail.com)  
Dataset: RAVDESS  
Model: Soft-voting Ensemble (MLP + SVM + Random Forest)  
Accuracy: ~86%  
Emotions: calm, happy, sad, angry, surprised (5 classes)

## Files
- `train.py` — trains ensemble and saves model.pkl
- `predict.py` — live mic recording (5s) and emotion prediction
- `extract_features.py` — feature extraction (file or raw audio)
- `requirements.txt` — dependencies
