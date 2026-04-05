import os, glob, pickle, re
import numpy as np
from extract_features import extract_features
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report

print("🚀 Starting training on SAVEE dataset...")

EMOTIONS = {
    'a':  'angry',
    'd':  'disgust',
    'f':  'fear',
    'h':  'happy',
    'n':  'neutral',
    'sa': 'sad',
    'su': 'surprise'
}

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "ALL")
print(f"📂 Loading from: {DATA_PATH}")

files = glob.glob(os.path.join(DATA_PATH, "*.wav"))
print(f"🎵 Files found: {len(files)}")

X, y = [], []

for file in files:
    basename = os.path.basename(file)
    match = re.search(r"_([a-z]{1,2})\d+\.wav", basename)
    if not match:
        continue
    code = match.group(1)
    if code not in EMOTIONS:
        continue
    features = extract_features(file_path=file)
    if features is None:
        continue
    X.append(features)
    y.append(EMOTIONS[code])

print(f"✅ Samples loaded: {len(X)}")

if len(X) == 0:
    print("❌ No data loaded. Check dataset path.")
    exit()

X = np.array(X)
y = np.array(y)

le     = LabelEncoder()
y_enc  = le.fit_transform(y)
scaler = StandardScaler()
X_sc   = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_sc, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

print("🔍 Finding best SVM parameters (this takes 5-10 mins)...")

param_grid = {
    'C':      [0.1, 1, 10, 100],
    'gamma':  ['scale', 'auto', 0.001, 0.01],
    'kernel': ['rbf', 'poly']
}

svm = SVC(class_weight='balanced', random_state=42, probability=True)

grid = GridSearchCV(
    svm,
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=2
)

grid.fit(X_train, y_train)

print(f"\n🏆 Best parameters: {grid.best_params_}")
print(f"🎯 Best CV accuracy: {grid.best_score_*100:.2f}%")

model = grid.best_estimator_
preds = model.predict(X_test)

print(f"\n📊 Test Accuracy: {accuracy_score(y_test, preds)*100:.2f}%")
print(classification_report(y_test, preds, target_names=le.classes_))

pickle.dump(
    {'model': model, 'scaler': scaler, 'le': le},
    open('model.pkl', 'wb')
)
print("✅ Model saved → model.pkl")