# SVM — SAVEE

Model: Support Vector Machine with GridSearchCV (scikit-learn)  
Dataset: SAVEE (7 emotions: angry, disgust, fear, happy, neutral, sad, surprise)  
Features: MFCC + Delta + Delta² + Chroma + Mel + Tonnetz + ZCR + RMS + Spectral  
Output: `model.pkl`

## Files
- `train.py` — loads SAVEE dataset, extracts features, runs GridSearchCV, saves model
- `extract_features.py` — feature extraction utility
- `model.pkl` — saved model bundle (model + scaler + label encoder)

## Run
```bash
python train.py    # trains and saves model.pkl
```
