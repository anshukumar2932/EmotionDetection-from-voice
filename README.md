# Voice Emotion Detector

A machine learning project that listens to your voice through a microphone and predicts your emotion in real time. Trained from scratch using the RAVDESS dataset with an MLP classifier — no pretrained models used.

**Achieved Accuracy:** ~84% on speech emotion classification

---

## Emotions It Can Detect

`neutral` `calm` `happy` `sad` `angry` `fearful` `disgust` `surprised`

---

## Requirements

- Python 3.8 or higher
- Microphone (built-in or external)

---

## Installation

**1. Clone or download this project**

```bash
git clone <your-repo-url>
cd voice_emotion
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

> If you're on Linux and get a sounddevice error, run:
> `sudo apt install portaudio19-dev` first

---

## Dataset Setup (Required before training)

This project uses the **RAVDESS** dataset (Ryerson Audio-Visual Database of Emotional Speech).

**Step 1:** Go to → https://zenodo.org/record/1188976

**Step 2:** Download `Audio_Speech_Actors_01-24.zip` (~750MB)

**Step 3:** Extract the zip — you'll get folders `Actor_01/` through `Actor_24/`

**Step 4:** Move all `Actor_XX/` folders into the `dataset/` folder of this project

Your structure should look like this:
```
voice_emotion/
├── dataset/
│   ├── Actor_01/
│   ├── Actor_02/
│   └── ... (up to Actor_24)
├── extract_features.py
├── train.py
├── predict.py
└── requirements.txt
```

> You can use just Actor_01–13 if storage is a concern. Accuracy will be around 65–70% with half the dataset vs 84%+ with all 24.

---

## Training the Model

```bash
python train.py
```

This will:
- Extract audio features (MFCC, Chroma, Mel Spectrogram) from all files in `dataset/`
- Train an MLP neural network
- Print accuracy and a classification report
- Save the model to `model.pkl`

**Training takes 2–5 minutes** depending on your machine. Wait until you see:

```
Model saved → model.pkl
```

**Do not run predict.py until training is fully complete.**

---

## Running the Detector

```bash
python predict.py
```

- Press **Enter** to start a 5-second recording
- Speak clearly with some emotion
- The model prints the detected emotion
- If your voice is too quiet it will ask you to repeat louder
- Press **Ctrl+C** to quit

---

## Adding More Training Data

The model retrains from scratch each time — it does **not** retain previous training. So always keep your existing dataset files when adding new ones.

To add more data:
1. Add new `.wav` files into `dataset/` (keep Actor folders organized)
2. Re-run `python train.py`
3. New `model.pkl` will be generated

**Recommended additional datasets:**
- [TESS](https://tspace.library.utoronto.ca/handle/1807/24487) — Toronto Emotional Speech Set, 7 emotions, clean audio
- [CREMA-D](https://github.com/CheyneyComputerScience/CREMA-D) — 7000+ clips, diverse speakers

---

## Project Structure

```
voice_emotion/
├── dataset/              ← place RAVDESS Actor folders here
├── extract_features.py   ← extracts MFCC, Chroma, Mel features from audio
├── train.py              ← trains MLP model and saves model.pkl
├── predict.py            ← records mic input and predicts emotion
├── model.pkl             ← generated after training (do not manually edit)
└── requirements.txt      ← Python dependencies
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `model.pkl not found` | Run `python train.py` first |
| No files found during training | Check that Actor folders are directly inside `dataset/` |
| Sounddevice error on Linux | Run `sudo apt install portaudio19-dev` |
| Always predicts FEARFUL | Add `sample_weight='balanced'` in train.py and retrain |
| Low accuracy | Use all 24 actors, or add TESS/CREMA-D dataset |

---

## How It Works

1. **Feature Extraction** — For each audio clip, we extract MFCC (captures timbre/tone), Chroma (pitch class), and Mel Spectrogram (energy distribution across frequencies). Mean and standard deviation of each are concatenated into a feature vector.

2. **Model** — A Multi-Layer Perceptron (MLP) with layers `[256 → 128 → 64]` is trained on these features using backpropagation. Early stopping prevents overfitting.

3. **Prediction** — Live mic audio is recorded, features are extracted the same way, scaled, and passed through the trained model to output an emotion label.
