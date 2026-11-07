"""Embed the dataset once and save the vectors.

Run this after changing data/merged_dataset.json, then commit data/embeddings.npy.
The server only loads this file, so it never embeds the corpus at startup.
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.embedder import OnnxEmbedder
from app.settings import settings

with open(settings.dataset_path, encoding="utf-8") as file:
    chunks = json.load(file)

embedder = OnnxEmbedder(settings.embedding_model, settings.model_cache_dir)
vectors = embedder.embed([chunk["content"] for chunk in chunks], batch_size=32)
np.save(settings.embeddings_path, vectors)
print(f"Saved {vectors.shape} to {settings.embeddings_path}")
