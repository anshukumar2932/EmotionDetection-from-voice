import os, glob, pickle
import numpy as np
from extract_features import extract_features
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

EMOTIONS = {
    '02': 'calm',
    '03': 'happy',
    '04': 'sad',
    '05': 'angry',
    '08': 'surprised'
}

X, y = [], []

for file in glob.glob("dataset/**/*.wav", recursive=True):
    if "CREMA-D" in file:
        continue
    code = os.path.basename(file).split("-")[2]
    if code not in EMOTIONS:
        continue
    try:
        X.append(extract_features(file_path=file))
        y.append(EMOTIONS[code])
    except Exception as e:
        print(f"Skipping {file}: {e}")

X, y = np.array(X), np.array(y)
mask = np.any(X != 0, axis=1)
X, y = X[mask], y[mask]
print(f"Clean samples: {len(X)}")

le     = LabelEncoder()
y_enc  = le.fit_transform(y)
scaler = StandardScaler()
X_sc   = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_sc, y_enc, test_size=0.15, random_state=42)

mlp = MLPClassifier(
    hidden_layer_sizes=(256, 128, 64),
    activation='relu',
    max_iter=500,
    early_stopping=True,
    random_state=42
)

svm = SVC(
    kernel='rbf',
    C=10,
    gamma='scale',
    class_weight='balanced',
    probability=True,
    random_state=42
)

rf = RandomForestClassifier(
    n_estimators=300,
    class_weight='balanced',
    random_state=42
)

ensemble = VotingClassifier(
    estimators=[('mlp', mlp), ('svm', svm), ('rf', rf)],
    voting='soft'
)

print("Training ensemble (takes 5-10 mins)...")
ensemble.fit(X_train, y_train)

preds = ensemble.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, preds)*100:.2f}%")
print(classification_report(y_test, preds, target_names=le.classes_))

pickle.dump({'model': ensemble, 'scaler': scaler, 'le': le}, open('model.pkl', 'wb'))
print("Model saved → model.pkl")
