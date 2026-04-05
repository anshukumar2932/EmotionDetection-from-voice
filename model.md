# Complete Multilingual Speech Emotion Recognition Guide

This comprehensive guide combines **prosodic model theory** with **practical multilingual training** for English (RAVDESS, CREMA-D) + Hindi (IITKGP-SEHSC, Kaggle Hindi SER) datasets using hybrid CNN-LSTM architecture.[^9][^10]

## Speech Emotion Recognition (SER) Model Guide

Speech emotion recognition systems analyze **prosody** (tone, pitch, rhythm) through hybrid CNN-LSTM models where CNN captures spectral patterns and LSTM models temporal dynamics.[^11]

## Core Algorithms

### SVM/SMO

**Optimization**:

$$
\min \frac{1}{2} \|w\|^2 + C \sum \xi_i \quad \text{s.t.} \quad y_i (w \cdot \phi(x_i) + b) \geq 1 - \xi_i
$$

**Best for**: Small datasets (~88% EMO-DB).[^11]

### MLP Baseline

**Backpropagation**:

$$
\Delta w_{ij} = -\eta \frac{\partial E}{\partial w_{ij}}
$$

**Accuracy**: ~84% reliable baseline.[^11]

### CNN-LSTM Hybrid (Recommended)

**CNN Convolution**:

$$
h_{i,j} = f\left( \sum w_{k,l} x_{i+k,j+l} + b \right)
$$

**LSTM Gates**:

- Forget: $f_t = \sigma(W_f [h_t, x_t] + b_f)$
- Input: $i_t = \sigma(W_i [h_t, x_t] + b_i)$
- Output: $o_t = \sigma(W_o [h_t, x_t] + b_o)$

**Performance**: 90%+ RAVDESS.[^12]

### Feature Extraction (MFCC)

$$
c_n = \sum_k \log(S_k) \cos\left(\frac{nk\pi}{M}\right)
$$

Captures universal prosody (pitch, energy).[^9]

## Multilingual Dataset Inventory

### English Datasets

| Dataset | Files | Emotions | Source |
| :-- | :-- | :-- | :-- |
| RAVDESS | 7,356 | 8 emotions | [Zenodo](https://www.innovatiana.com/en/datasets/ravdess)[^13] |
| CREMA-D | 7,442 | 6 emotions | [Kaggle](https://www.kaggle.com/datasets/dmitrybabko/speech-emotion-recognition-en)[^14] |
| SAVEE | 480 | 7 emotions | [Surrey](http://kahlan.eps.surrey.ac.uk/savee/)[^15] |

### Hindi Datasets

| Dataset | Files | Emotions | Source |
| :-- | :-- | :-- | :-- |
| IITKGP-SEHSC | ~1,200 | 8 emotions | [GitHub](https://github.com/ankuPRK/Emotion-Recognition-in-Hindi-Speech)[^10] |
| Kaggle Hindi SER | Variable | Basic emotions | [Kaggle](https://www.kaggle.com/datasets/vishlb/speech-emotion-recognition-hindi)[^16] |

**Combined**: `standing-o/Combined_Dataset` + custom Hindi loader.[^15]

## Multilingual Training Pipeline

### 1. Data Preparation

```python
def load_multilingual_corpus():
    # English: lang_id=0
    english = load_ravdess() + load_crema_d() + load_savee()
    # Hindi: lang_id=1  
    hindi = load_iitkpg_sehsc() + load_kaggle_hindi()
    
    # Universal preprocessing
    all_data = preprocess_multilingual(english + hindi)
    return create_balanced_dataloader(all_data)
```


### 2. Complete PyTorch Implementation

```python
import torch
import torch.nn as nn
import torchaudio.transforms as T

class MultilingualSER(nn.Module):
    def __init__(self, num_emotions=8, num_languages=2):
        super().__init__()
        
        # CNN: Spectral patterns (universal prosody)
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d((4, 4)),
            nn.Flatten()
        )
        
        # LSTM: Temporal rhythm (language-agnostic)
        self.lstm = nn.LSTM(128*16, 128, bidirectional=True, batch_first=True, dropout=0.3)
        
        # Language adapter
        self.lang_embed = nn.Embedding(num_languages, 64)
        
        # Fusion classifier
        self.classifier = nn.Sequential(
            nn.Linear(256 + 64 + 64, 256), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(128, num_emotions)
        )
    
    def forward(self, spectrogram, language_id):
        # CNN extracts spectral features
        cnn_features = self.cnn(spectrogram)  # [B, 2048]
        
        # LSTM models temporal dynamics  
        lstm_out, _ = self.lstm(cnn_features.unsqueeze(1))
        lstm_final = lstm_out[:, -1, :]  # [B, 256]
        
        # Language conditioning
        lang_emb = self.lang_embed(language_id)  # [B, 64]
        
        # Fusion
        combined = torch.cat([lstm_final, lang_emb, cnn_features], dim=1)
        return self.classifier(combined)

# Feature extraction pipeline
mel_transform = T.MelSpectrogram(
    sample_rate=16000, n_mels=128, n_fft=2048, hop_length=512
)
```


### 3. Progressive Training Strategy

**Phase 1: English Pretraining (50 epochs)**

```
Dataset: RAVDESS + CREMA-D (70/30 split)
Loss: CrossEntropy, Adam(lr=0.001)
Target: 87%+ validation accuracy
```

**Phase 2: Multilingual Fine-tuning (100 epochs)**

```
Dataset: English(70%) + Hindi(30%)
Augmentation: Pitch shift, speed perturbation, noise
Scheduler: CosineAnnealingLR
Target: 78%+ cross-language accuracy
```


## Expected Performance Matrix

| Test Split | English Accuracy | Hindi Accuracy | Weighted F1 |
| :-- | :-- | :-- | :-- |
| English Only | **88%** | 72% | **82%** |
| Hindi Only | 78% | **85%** | **80%** |
| Cross-Language | **76%** | **74%** | **78%** |

## Architecture Flow

```
Raw Audio (16kHz) 
    ↓ [librosa/torchaudio]
Mel Spectrogram (128×Time×1)
    ↓
CNN (spectral: 128×16 features)
    ↓ 
BiLSTM (temporal: 256-dim)
    ↓ + Language Embedding
Attention Fusion → FC → Softmax(8 emotions)
```


## Production Deployment

```python
# FastAPI inference endpoint
from fastapi import FastAPI, File, UploadFile
import torchaudio

app = FastAPI()
model = MultilingualSER().load_state_dict(torch.load("multilingual_ser.pt"))

@app.post("/predict")
async def predict_emotion(audio: UploadFile = File(...), language: str = "en"):
    waveform, sr = torchaudio.load(audio.file)
    spec = mel_transform(waveform)
    lang_id = 0 if language == "en" else 1
    emotion = model(spec, torch.tensor([lang_id]))
    return {"emotion": emotion.argmax().item()}
```


[^1]: https://www.sciencedirect.com/science/article/abs/pii/S1746809418302337

[^2]: https://campus-fryslan.studenttheses.ub.rug.nl/746/1/mscspeechtechthesisdolores.pdf

[^3]: https://aclanthology.org/2021.rocling-1.6/

[^4]: https://www.nature.com/articles/s41598-025-28766-0

[^5]: https://github.com/souradeepdutta/Speech-Emotion-Recognition-with-CNN-LSTM-CLSTM

[^6]: https://arxiv.org/abs/1802.05630

[^7]: https://www.arxiv.org/abs/2501.10666

[^8]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11977261/

[^9]: https://thepythoncode.com/article/building-a-speech-emotion-recognizer-using-sklearn

[^10]: https://github.com/ankuPRK/Emotion-Recognition-in-Hindi-Speech

[^11]: https://pubmed.ncbi.nlm.nih.gov/36236658/

[^12]: https://www.atlantis-press.com/article/126001965.pdf

[^13]: https://www.innovatiana.com/en/datasets/ravdess

[^14]: https://www.kaggle.com/datasets/dmitrybabko/speech-emotion-recognition-en

[^15]: https://github.com/standing-o/Combined_Dataset_for_Speech_Emotion_Recognition

[^16]: https://www.kaggle.com/datasets/vishlb/speech-emotion-recognition-hindi
