"""Environment-driven settings. Nothing else in the service reads os.environ."""
import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    groq_api_key: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    service_token: str = field(default_factory=lambda: os.getenv("AI_SERVICE_TOKEN", ""))
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", "openai/gpt-oss-120b"))
    model_cache_dir: str = field(
        default_factory=lambda: os.getenv("MODEL_CACHE_DIR", str(BASE_DIR / ".model_cache"))
    )
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    dataset_path: Path = BASE_DIR / "data" / "merged_dataset.json"
    embeddings_path: Path = BASE_DIR / "data" / "embeddings.npy"


settings = Settings()
