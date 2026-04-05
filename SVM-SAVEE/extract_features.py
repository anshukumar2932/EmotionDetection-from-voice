import librosa
import numpy as np

def extract_features(file_path):
    try:
        audio, sample_rate = librosa.load(file_path, sr=22050)
        audio = librosa.util.normalize(audio)

        # 1. MFCCs (mean + std) = 80 features
        mfcc = librosa.feature.mfcc(y=audio, sr=sample_rate, n_mfcc=40)
        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_std  = np.std(mfcc, axis=1)

        # 2. Delta MFCCs (mean + std) = 80 features
        delta_mfcc = librosa.feature.delta(mfcc)
        delta_mean = np.mean(delta_mfcc, axis=1)
        delta_std  = np.std(delta_mfcc, axis=1)

        # 3. Delta-Delta MFCCs = 80 features
        delta2_mfcc = librosa.feature.delta(mfcc, order=2)
        delta2_mean = np.mean(delta2_mfcc, axis=1)
        delta2_std  = np.std(delta2_mfcc, axis=1)

        # 4. Chroma = 12 features
        stft   = np.abs(librosa.stft(audio))
        chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sample_rate), axis=1)

        # 5. Mel spectrogram = 128 features
        mel = np.mean(librosa.feature.melspectrogram(y=audio, sr=sample_rate, n_mels=128), axis=1)

        # 6. Tonnetz = 6 features
        harmonic = librosa.effects.harmonic(audio)
        tonnetz  = np.mean(librosa.feature.tonnetz(y=harmonic, sr=sample_rate), axis=1)

        # 7. ZCR = 1 feature
        zcr = np.mean(librosa.feature.zero_crossing_rate(audio))

        # 8. RMS = 1 feature
        rms = np.mean(librosa.feature.rms(y=audio))

        # 9. Spectral features = 3 features
        spec_centroid  = np.mean(librosa.feature.spectral_centroid(y=audio, sr=sample_rate))
        spec_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sample_rate))
        spec_rolloff   = np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sample_rate))

        return np.hstack([
            mfcc_mean, mfcc_std,
            delta_mean, delta_std,
            delta2_mean, delta2_std,
            chroma, mel, tonnetz,
            zcr, rms,
            spec_centroid, spec_bandwidth, spec_rolloff
        ])

    except Exception as e:
        print("Error:", e)
        return None