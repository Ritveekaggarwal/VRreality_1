"""Query embedding through ONNX Runtime.

Uses the same all-MiniLM-L6-v2 model as before, but without PyTorch.
"""
import threading

import numpy as np
from fastembed import TextEmbedding


class OnnxEmbedder:
    def __init__(self, model_name: str, cache_dir: str):
        self._model_name = model_name
        self._cache_dir = cache_dir
        self._model = None
        self._lock = threading.Lock()

    def load(self) -> None:
        with self._lock:
            if self._model is None:
                self._model = TextEmbedding(
                    model_name=self._model_name,
                    cache_dir=self._cache_dir,
                    threads=1,
                )

    @property
    def ready(self) -> bool:
        return self._model is not None

    def embed(self, texts: list[str], batch_size: int = 8) -> np.ndarray:
        self.load()
        vectors = np.asarray(
            list(self._model.embed(texts, batch_size=batch_size)), dtype=np.float32
        )
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        return vectors / np.clip(norms, 1e-12, None)
