import librosa
import numpy as np

def extract_features(file_path=None, y=None, sr=None):
    if file_path:
        y, sr = librosa.load(file_path, sr=22050)

    mfcc     = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    delta    = librosa.feature.delta(mfcc)           # rate of change
    delta2   = librosa.feature.delta(mfcc, order=2)  # acceleration
    chroma   = librosa.feature.chroma_stft(y=y, sr=sr)
    mel      = librosa.feature.melspectrogram(y=y, sr=sr)
    zcr      = librosa.feature.zero_crossing_rate(y)
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    rolloff  = librosa.feature.spectral_rolloff(y=y, sr=sr)

    return np.concatenate([
        np.mean(mfcc,     axis=1), np.std(mfcc,     axis=1),
        np.mean(delta,    axis=1), np.std(delta,    axis=1),
        np.mean(delta2,   axis=1), np.std(delta2,   axis=1),
        np.mean(chroma,   axis=1), np.std(chroma,   axis=1),
        np.mean(mel,      axis=1), np.std(mel,      axis=1),
        np.mean(zcr,      axis=1), np.std(zcr,      axis=1),
        np.mean(contrast, axis=1), np.std(contrast, axis=1),
        np.mean(rolloff,  axis=1), np.std(rolloff,  axis=1),
    ])
