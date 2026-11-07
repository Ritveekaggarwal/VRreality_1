"""In-memory vector store.

The vectors are computed once, ahead of time, by scripts/build_index.py. At startup
the server only loads them from disk. An exact NumPy dot product over a few
thousand chunks takes well under a millisecond, so FAISS is not needed.
"""
import json

import numpy as np

from app.rag.corpus import fingerprint, load_corpus


class StaleIndexError(RuntimeError):
    pass


class VectorStore:
    def __init__(self, chunks: list[dict], matrix: np.ndarray):
        if len(chunks) != matrix.shape[0]:
            raise StaleIndexError("Chunk count and vector count differ")
        self.chunks = chunks
        self.matrix = matrix

    @classmethod
    def load(cls, settings) -> "VectorStore":
        chunks = load_corpus(settings.corpus_dir)
        try:
            meta = json.loads(settings.index_meta_path.read_text(encoding="utf-8"))
            matrix = np.load(settings.embeddings_path)
        except FileNotFoundError as error:
            raise StaleIndexError(
                "No vector index found. Run: python scripts/build_index.py"
            ) from error

        if meta.get("fingerprint") != fingerprint(chunks, settings.embedding_model):
            raise StaleIndexError(
                "The knowledge base changed since the vectors were built. "
                "Run: python scripts/build_index.py"
            )
        return cls(chunks, matrix)

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
