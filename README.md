# Speech Emotion Recognition — Multi-Model Project

A collaborative project exploring multiple ML/DL approaches for speech emotion recognition, trained on different datasets by different contributors. Each folder contains one contributor's independent implementation.

---

## Project Structure

```
├── Anshu-RAVDESS/       ← CNN, CNN-LSTM, CNN-LSTM+Attention, Random Forest on RAVDESS
├── Arpit-CREMA/         ← CNN-LSTM on CREMA-D
├── Durgesh-SAVEE/       ← SVM on SAVEE
├── Shantam-RAVDESS/     ← Ensemble (MLP + SVM + RF) on RAVDESS
├── Keshav-CREMA/        ← RNN on CREMA-D
```

---

## Contributors & Models

### Anshu — `Anshu-RAVDESS/`
- Dataset: RAVDESS (8 emotions, 24 actors)
- Models tried: CNN → CNN-LSTM → CNN-LSTM + Attention, Random Forest
- Best accuracy: ~93% (CNN-LSTM + Attention)
- Outputs: saved `.keras` models, normalization/scaler pickles, per-model output folders
- How: Iteratively improved architecture from a basic CNN up to a CNN-LSTM with an attention layer. Features: MFCC + Delta + Chroma.

### Arpit — `Arpit-CREMA/`
- Dataset: CREMA-D (6 emotions, 7442 clips)
- Model: CNN + LSTM (Keras/TensorFlow)
- Output: `emotion_model.h5`
- How: Extracts MFCC + Delta + Delta² + Chroma, pads to 160 frames, applies noise/shift augmentation, trains with class weights and LR reduction.

### Durgesh — `Durgesh-SAVEE/`
- Dataset: SAVEE (7 emotions, 480 clips)
- Model: SVM with GridSearchCV (RBF + Poly kernels, C/gamma tuning)
- Accuracy: ~80.21%
- Output: `model.pkl` (model + scaler + label encoder)
- How: Extracts 471-feature vector (MFCC, Delta, Chroma, Mel, Tonnetz, ZCR, RMS, Spectral), scales with StandardScaler, finds best SVM params via 5-fold CV.

### Shantam — `Shantam-RAVDESS/`
- Dataset: RAVDESS (5 emotions)
- Model: Soft-voting Ensemble — MLP + SVM + Random Forest
- Accuracy: ~86%
- Output: `model.pkl`
- How: Extracts rich feature vector (MFCC + Delta + Delta² + Chroma + Mel + ZCR + Spectral Contrast + Rolloff, mean + std), trains three classifiers and combines via soft voting. Supports live mic prediction.

### Keshav — `Keshav-CREMA/`
- Dataset: CREMA-D (6 emotions)
- Model: RNN (Recurrent Neural Network)
- Output: `emotion_rnn_model.h5`, `confusion_matrix.png`, `training_curves.png`, `training_report.html`
- Note: developed on a separate branch (`keshav`), never merged to main
- How: RNN-based sequential model with saved label encoder and scaler for inference.

---

## Datasets

| Dataset | Clips | Emotions | Link |
|---|---|---|---|
| RAVDESS | 7,356 | 8 | https://zenodo.org/record/1188976 |
| CREMA-D | 7,442 | 6 | https://github.com/CheyneyComputerScience/CREMA-D |
| SAVEE | 480 | 7 | http://kahlan.eps.surrey.ac.uk/savee/ |

Place dataset files under a `dataset/` folder inside the relevant contributor folder before running training scripts.

---

## Accuracy Summary

| Contributor | Model | Dataset | Accuracy |
|---|---|---|---|
| Anshu | CNN-LSTM + Attention | RAVDESS | ~93% |
| Shantam | Ensemble (MLP+SVM+RF) | RAVDESS | ~86% |
| Durgesh | SVM | SAVEE | ~80% |
| Arpit | CNN-LSTM | CREMA-D | — |
| Keshav | RNN | CREMA-D | — |

---

## Requirements

Each folder has its own `requirements.txt`. Common dependencies:

```bash
pip install librosa scikit-learn numpy tensorflow sounddevice
```
