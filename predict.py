import pickle
import numpy as np
import sounddevice as sd
from extract_features import extract_features

DURATION  = 5       # seconds to record
SR        = 22050
SILENCE   = 0.01    # amplitude threshold

bundle = pickle.load(open('model.pkl', 'rb'))
model, scaler, le = bundle['model'], bundle['scaler'], bundle['le']

def predict():
    print("🎙  Listening for 3 seconds...")
    audio = sd.rec(int(DURATION * SR), samplerate=SR, channels=1, dtype='float32')
    sd.wait()
    audio = audio.flatten()

    if np.max(np.abs(audio)) < SILENCE:
        print("⚠  I'd like you to repeat louder.\n")
        return

    features = extract_features(y=audio, sr=SR)
    scaled   = scaler.transform([features])
    emotion  = le.inverse_transform(model.predict(scaled))[0]
    print(f"✅ Detected Emotion → {emotion.upper()}\n")

if __name__ == "__main__":
    print("Voice Emotion Detector  |  Ctrl+C to quit\n")
    try:
        while True:
            input("Press Enter to start recording...")
            predict()
    except KeyboardInterrupt:
        print("\nBye.")
