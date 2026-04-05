"""
Randomly selects an audio sample from available datasets.
Searches configured paths and falls back gracefully.
"""
import os
import glob
import random
from typing import Optional

from api.config import DATASET_PATHS


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
