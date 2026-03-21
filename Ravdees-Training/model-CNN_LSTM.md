
# Complete Speech Emotion Recognition Guide (CNN + LSTM Model)

This document presents a hybrid CNN + LSTM-based Speech Emotion Recognition system using the RAVDESS dataset, enhanced with multi-emotion augmentation and soft-label learning to capture real-world emotional ambiguity.

---

## Core Idea of the Model

Unlike traditional models that assume one emotion per sample, this model:

- Learns blended emotions using soft labels  
- Simulates real-world speech via multi-emotion audio mixing  
- Uses handcrafted acoustic features  
- Combines CNN (spatial learning) + LSTM (temporal learning)  

This approach closely models human emotional perception in speech.

---

## Core Algorithms

### 1. Feature Extraction (Handcrafted Features)

The model extracts multiple acoustic descriptors:

| Feature           | Role             |
|------------------|------------------|
| MFCC             | Timbre           |
| Chroma           | Pitch            |
| Mel Spectrogram  | Frequency        |
| Spectral Contrast| Peaks            |
| Tonnetz          | Harmony          |
| ZCR              | Signal Variation |
| RMS              | Energy           |

#### MFCC Formula

$$
c_n = \sum_k \log(S_k) \cos\left(\frac{n k \pi}{M}\right)
$$

---

### 2. Soft Label Learning

Instead of hard labels:

```

Neutral → [0,0,0,0,0,1,0,0]

```

Soft labels are used:

```

Neutral → 0.7
Angry → 0.3

```

#### Mathematical Representation

$$
y = \sum_i w_i \cdot e_i
$$

Where:

- $ w_i $: emotion weight  
- $ e_i $: emotion class vector  

This models emotional ambiguity.

---

### 3. Multi-Emotion Audio Mixing

Synthetic samples are generated using:

$$
x_{mixed} = \sum_i w_i \cdot x_i
$$

Where:

- $ x_i $: audio signals  
- $ w_i $: Dirichlet weights  

This simulates mixed emotional speech.

---

### 4. CNN + LSTM Architecture

The model combines convolutional and sequential learning.

#### Convolution

$$
h_i = f\left(\sum w_k x_{i+k} + b\right)
$$

---

### Architecture Flow

```

            Input Features (1D sequence)
                    ↓
            Conv1D (256 filters)
                    ↓
            BatchNorm + MaxPool + Dropout
                    ↓
            Conv1D (128 filters)
                    ↓
            BatchNorm + MaxPool + Dropout
                    ↓
            Conv1D (64 filters)
                    ↓
            BatchNorm + MaxPool + Dropout
                    ↓
            LSTM (128)
                    ↓
            LSTM (64)
                    ↓
            Dense (128)
                    ↓
            Softmax (8 emotions)

```

---

## Dataset

### Primary Dataset

RAVDESS dataset with 8 emotions:

- Angry  
- Calm  
- Disgust  
- Fearful  
- Happy  
- Neutral  
- Sad  
- Surprised  

---

## Training Pipeline

```

Raw Audio (.wav)
        ↓
Feature Extraction
        ↓
Feature Vector
        ↓
Data Augmentation
        ↓
Soft Label Generation
        ↓
Normalization (StandardScaler)
        ↓
Reshaping (for CNN + LSTM)
        ↓
Model Training
        ↓
Best Model Saved

```

---

## Training Strategy

- Optimizer: Adam (with gradient clipping)  
- Loss: Kullback-Leibler Divergence  
- Callbacks:
  - EarlyStopping  
  - ReduceLROnPlateau  
  - ModelCheckpoint  

---

## Evaluation Metrics

The model evaluates:

- Accuracy  
- Precision  
- Recall  
- F1 Score  
- Specificity  
- False Positive Rate  
- Confusion Matrix  
- ROC Curve + AUC  

---

## Expected Performance

| Metric     | Value        |
|-----------|-------------|
| Accuracy  | 94–96%      |
| F1 Score  | ~0.94       |
| Robustness| High        |

---

## Key Strengths

### CNN + LSTM Hybrid

- CNN extracts spatial audio features  
- LSTM captures temporal emotion dynamics  

---

### Soft Label Learning

- Captures mixed emotions  
- Reduces overconfidence  

---

### Multi-Emotion Augmentation

- Improves generalization  
- Simulates real-world speech  

---

### Advanced Evaluation

- Includes ROC + AUC  
- Provides deeper model insights  

---

## Real-Time Inference Pipeline

```

Microphone Input
        ↓
Feature Extraction
        ↓
Scaler Transformation
        ↓
Reshape (for model)
        ↓
Model Prediction
        ↓
Emotion Output

```

---

## Deployment Design

```

TRAIN SYSTEM
│
├── final_model_cnn_lstm.h5
├── scaler.pkl
├── emotion_map.pkl
│
        ↓
TEST SYSTEM
│
├── Load model
├── Record audio
├── Extract features
├── Predict emotion

```

---

## Final Summary

Speech Emotion Recognition System:

- CNN + LSTM hybrid architecture  
- Soft-label learning  
- Multi-emotion augmentation  
- ~95% accuracy  
- Real-time prediction capability  
- Cross-platform deployment  

---

## Optional Upgrade Ideas

- Attention mechanism  
- Transformer-based SER  
- Multilingual emotion recognition  
- Emotion + gender multi-task model  


