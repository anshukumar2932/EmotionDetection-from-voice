"""
Randomly selects an audio sample from available datasets.
Searches configured paths and falls back gracefully.
"""
import os
import re
import glob
import random
from typing import Optional

from api.config import DATASET_PATHS

# ── RAVDESS emotion codes (3rd segment of filename) ───────────────────────────
_RAVDESS_CODES = {
    '01': 'neutral', '02': 'calm', '03': 'happy', '04': 'sad',
    '05': 'angry',   '06': 'fearful', '07': 'disgust', '08': 'surprised',
}

# ── CREMA-D emotion codes (3rd segment, e.g. 1001_DFA_ANG_XX.wav) ─────────────
_CREMA_CODES = {
    'ANG': 'angry', 'DIS': 'disgust', 'FEA': 'fearful',
    'HAP': 'happy', 'NEU': 'neutral', 'SAD': 'sad',
}

# ── SAVEE emotion codes (letter prefix of filename, e.g. a01.wav = anger) ─────
_SAVEE_CODES = {
    'a': 'angry', 'd': 'disgust', 'f': 'fearful', 'h': 'happy',
    'n': 'neutral', 'sa': 'sad', 'su': 'surprised',
}


def decode_label(file_path: str, dataset: str) -> Optional[str]:
    """
    Extract the ground-truth emotion label from a dataset filename.
    Returns lowercase emotion string, or None if not parseable.
    """
    name = os.path.splitext(os.path.basename(file_path))[0]

    if dataset == 'ravdess':
        # Format: 03-01-03-01-01-01-01  (modality-vocal-emotion-intensity-statement-repetition-actor)
        parts = name.split('-')
        if len(parts) >= 3:
            return _RAVDESS_CODES.get(parts[2])

    elif dataset == 'crema':
        # Format: 1001_DFA_ANG_XX
        parts = name.split('_')
        if len(parts) >= 3:
            return _CREMA_CODES.get(parts[2].upper())

    elif dataset == 'savee':
        # Format: a01, sa02, su03, etc.
        match = re.match(r'^([a-z]+)\d+$', name.lower())
        if match:
            code = match.group(1)
            return _SAVEE_CODES.get(code)

    return None


def get_random_sample(dataset: str) -> Optional[str]:
    """
    Return a random .wav file path from the given dataset name.
    Returns None if no files are found in any configured path.
    """
    paths = DATASET_PATHS.get(dataset, [])
    candidates = []

    for base in paths:
        # Support glob patterns (e.g. Actor_*)
        if "*" in base:
            pattern = os.path.join(base, "**", "*.wav")
        else:
            pattern = os.path.join(base, "**", "*.wav")

        found = glob.glob(pattern, recursive=True)
        candidates.extend(found)

        # Also check direct .wav files in the folder
        direct = glob.glob(os.path.join(base, "*.wav"))
        candidates.extend(direct)

    if not candidates:
        return None

    return random.choice(candidates)


def get_random_sample_for_model(model_key: str) -> Optional[str]:
    """Pick a random sample from the dataset associated with a model."""
    from api.config import MODEL_REGISTRY
    dataset = MODEL_REGISTRY[model_key]["dataset"]
    return get_random_sample(dataset)
