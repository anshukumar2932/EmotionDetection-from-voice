# CNN-LSTM — CREMA-D

Model: CNN + LSTM hybrid (Keras/TensorFlow)  
Dataset: CREMA-D (6 emotions: angry, disgust, fear, happy, sad, neutral)  
Features: MFCC + Delta + Delta² + Chroma (padded to 160 frames)  
Output: `emotion_model.h5`

## Files
- `train.py` — feature extraction, augmentation, model training
- `predict.py` — loads `emotion_model.h5` and predicts from a `.wav` file
- `emotion_model.h5` — saved trained model

## Run
```bash
python train.py       # trains and saves emotion_model.h5
python predict.py     # prompts for a .wav file and predicts emotion
```
