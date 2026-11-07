"""The knowledge base: every JSON file in data/corpus/, read in a fixed order.

Each file holds a list of chunks. Only "content" is required:

    [{"content": "...", "topic": "genetics", "sub_topic": "mutations",
      "difficulty": 2, "cognitive_load": 3, "estimated_minutes": 10}]

The fingerprint changes whenever any chunk or the embedding model changes. It is
how the service knows the saved vectors still match the text.
"""
import hashlib
import json
from pathlib import Path

DEFAULTS = {
    "topic": "general",
    "sub_topic": "general",
    "difficulty": 2,
    "cognitive_load": 2,
    "estimated_minutes": 10,
}


def load_corpus(corpus_dir: Path) -> list[dict]:
    files = sorted(Path(corpus_dir).glob("*.json"))
    if not files:
        raise RuntimeError(f"No .json files found in {corpus_dir}")

    chunks, seen = [], set()
    for file in files:
        with open(file, encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, list):
            raise ValueError(f"{file.name} must contain a JSON list of chunks")

        for position, item in enumerate(data):
            content = str(item.get("content") or "").strip() if isinstance(item, dict) else ""
            if not content:
                raise ValueError(f'{file.name}, item {position}: "content" is missing or empty')
            if content in seen:
                continue  # The same passage twice would only crowd the search results.
            seen.add(content)
            chunks.append({**DEFAULTS, **item, "content": content, "source": file.stem})
    return chunks


def fingerprint(chunks: list[dict], model_name: str) -> str:
    digest = hashlib.sha256(model_name.encode())
    for chunk in chunks:
        digest.update(b"\0")
        digest.update(chunk["content"].encode("utf-8"))
    return digest.hexdigest()
