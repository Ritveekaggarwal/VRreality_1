"""Download the ONNX model during the build so the first request is not slow."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.embedder import OnnxEmbedder
from app.settings import settings

OnnxEmbedder(settings.embedding_model, settings.model_cache_dir).load()
print("Embedding model ready")
