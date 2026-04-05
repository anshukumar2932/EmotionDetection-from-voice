"""
Feature extraction functions — one per contributor's pipeline.
Each function accepts a file path and returns a numpy array.
"""
import numpy as np
import librosa


# ── Anshu (RAVDESS) ───────────────────────────────────────────────────────────
# MFCC(40) + Delta + Delta² + Chroma + Mel + Spectral Contrast + Tonnetz + ZCR + RMS
# Returns mean+std aggregated flat vector.

def extract_anshu(file_path: str) -> np.ndarray:
    audio, sr = librosa.load(file_path, sr=22050)
    audio = librosa.util.normalize(audio)

    mfcc     = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    delta    = librosa.feature.delta(mfcc)
    delta2   = librosa.feature.delta(mfcc, order=2)
    chroma   = librosa.feature.chroma_stft(y=audio, sr=sr)
    mel      = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=128)
    contrast = librosa.feature.spectral_contrast(y=audio, sr=sr)
    tonnetz  = librosa.feature.tonnetz(y=librosa.effects.harmonic(audio), sr=sr)
    zcr      = librosa.feature.zero_crossing_rate(audio)
    rms      = librosa.feature.rms(y=audio)

    return np.concatenate([
        np.mean(mfcc,     axis=1), np.std(mfcc,     axis=1),
        np.mean(delta,    axis=1), np.std(delta,    axis=1),
        np.mean(delta2,   axis=1), np.std(delta2,   axis=1),
        np.mean(chroma,   axis=1), np.std(chroma,   axis=1),
        np.mean(mel,      axis=1), np.std(mel,      axis=1),
        np.mean(contrast, axis=1), np.std(contrast, axis=1),
        np.mean(tonnetz,  axis=1), np.std(tonnetz,  axis=1),
        [np.mean(zcr)],            [np.std(zcr)],
        [np.mean(rms)],            [np.std(rms)],
    ])


# ── Arpit (CREMA-D) ───────────────────────────────────────────────────────────
# MFCC(40) + Delta + Delta² + Chroma → padded/truncated to 160 frames
# Per-sample z-score normalisation. Returns shape (1, 160, 92).

def extract_arpit(file_path: str) -> np.ndarray:
    MAX_LEN = 160
    signal, sr = librosa.load(file_path, sr=None)

    mfcc   = librosa.feature.mfcc(y=signal, sr=sr, n_mfcc=40)
    delta  = librosa.feature.delta(mfcc)
    delta2 = librosa.feature.delta(mfcc, order=2)
    chroma = librosa.feature.chroma_stft(y=signal, sr=sr)

    features = np.vstack((mfcc, delta, delta2, chroma)).T  # (frames, 92)

    if len(features) < MAX_LEN:
        features = np.pad(features, ((0, MAX_LEN - len(features)), (0, 0)))
    else:
        features = features[:MAX_LEN]

    features = (features - np.mean(features)) / (np.std(features) + 1e-8)
    return np.expand_dims(features, axis=0)  # (1, 160, 92)


# ── Durgesh (SAVEE) ───────────────────────────────────────────────────────────
# 471-dim flat vector: MFCC+Delta+Delta²(mean+std) + Chroma + Mel + Tonnetz + ZCR + RMS + Spectral

def extract_durgesh(file_path: str) -> np.ndarray:
    audio, sr = librosa.load(file_path, sr=22050)
    audio = librosa.util.normalize(audio)

    mfcc    = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)
    delta   = librosa.feature.delta(mfcc)
    delta2  = librosa.feature.delta(mfcc, order=2)
    stft    = np.abs(librosa.stft(audio))
    chroma  = np.mean(librosa.feature.chroma_stft(S=stft, sr=sr), axis=1)
    mel     = np.mean(librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=128), axis=1)
    tonnetz = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(audio), sr=sr), axis=1)
    zcr     = np.mean(librosa.feature.zero_crossing_rate(audio))
    rms     = np.mean(librosa.feature.rms(y=audio))
    spec_c  = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr))
    spec_b  = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr))
    spec_r  = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr))

    return np.hstack([
        np.mean(mfcc,   axis=1), np.std(mfcc,   axis=1),
        np.mean(delta,  axis=1), np.std(delta,  axis=1),
        np.mean(delta2, axis=1), np.std(delta2, axis=1),
        chroma, mel, tonnetz,
        [zcr], [rms], [spec_c], [spec_b], [spec_r],
    ])


# ── Keshav (CREMA-D) ─────────────────────────────────────────────────────────
# Sequential MFCC: shape (1, 128, 40) — scaler applied externally.

def extract_keshav(file_path: str) -> np.ndarray:
    MAX_TIMESTEPS = 128
    N_MFCC = 40

    audio, sr = librosa.load(file_path, sr=None, duration=4.0)
    mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC, hop_length=512).T

    if mfccs.shape[0] < MAX_TIMESTEPS:
        mfccs = np.pad(mfccs, ((0, MAX_TIMESTEPS - mfccs.shape[0]), (0, 0)))
    else:
        mfccs = mfccs[:MAX_TIMESTEPS]

    return mfccs  # (128, 40) — caller adds batch dim after scaling


# ── Shantam (RAVDESS) ─────────────────────────────────────────────────────────
# MFCC+Delta+Delta²+Chroma+Mel+ZCR+Contrast+Rolloff (mean+std) flat vector.

def extract_shantam(file_path: str) -> np.ndarray:
    y, sr = librosa.load(file_path, sr=22050)

    mfcc     = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    delta    = librosa.feature.delta(mfcc)
    delta2   = librosa.feature.delta(mfcc, order=2)
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


# ── Dispatcher ────────────────────────────────────────────────────────────────

_EXTRACTORS = {
    "anshu":   extract_anshu,
    "arpit":   extract_arpit,
    "durgesh": extract_durgesh,
    "keshav":  extract_keshav,
    "shantam": extract_shantam,
}


def extract_features(feature_fn: str, file_path: str) -> np.ndarray:
    fn = _EXTRACTORS.get(feature_fn)
    if fn is None:
        raise ValueError(f"Unknown feature extractor: {feature_fn}")
    return fn(file_path)
