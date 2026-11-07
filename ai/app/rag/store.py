"""In-memory vector store.

The corpus is about 1,300 chunks, so an exact NumPy dot product is fast enough
and removes the need for FAISS.
"""
import json
from pathlib import Path

import numpy as np


class VectorStore:
    def __init__(self, dataset_path: Path, embeddings_path: Path):
        with open(dataset_path, encoding="utf-8") as file:
            self.chunks: list[dict] = json.load(file)
        self.matrix: np.ndarray = np.load(embeddings_path)
        if len(self.chunks) != self.matrix.shape[0]:
            raise RuntimeError(
                "Embeddings are out of date. Run: python scripts/build_index.py"
            )

    def search(self, query_vector: np.ndarray, top_k: int) -> list[dict]:
        scores = self.matrix @ query_vector
        top_k = min(top_k, scores.shape[0])
        best = np.argpartition(-scores, top_k - 1)[:top_k]
        best = best[np.argsort(-scores[best])]
        return [self.chunks[int(index)] for index in best]


class Retriever:
    """Combines an embedder with a store through their small interfaces."""

    def __init__(self, embedder, store: VectorStore):
        self._embedder = embedder
        self._store = store

    def retrieve(self, query: str, top_k: int = 8) -> list[dict]:
        return self._store.search(self._embedder.embed([query])[0], top_k)

    def retrieve_many(self, queries: list[str], per_query: int) -> list[dict]:
        """Retrieve for each query, so one topic cannot crowd out the others."""
        seen, merged = set(), []
        for vector in self._embedder.embed(queries):
            for chunk in self._store.search(vector, per_query):
                key = chunk["content"][:120]
                if key not in seen:
                    seen.add(key)
                    merged.append(chunk)
        return merged
