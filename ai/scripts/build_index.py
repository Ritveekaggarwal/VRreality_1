"""Turns every chunk in data/corpus/ into a vector and saves them to disk.

    python scripts/build_index.py            always rebuild
    python scripts/build_index.py --if-stale rebuild only if the corpus changed

Render runs the --if-stale form during every deploy, so a corpus change pushed
without fresh vectors is still picked up. Commit data/embeddings.npy and
data/index_meta.json anyway, so deploys normally skip the work.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.corpus import fingerprint, load_corpus
from app.rag.embedder import OnnxEmbedder
from app.settings import settings


def main(if_stale: bool) -> None:
    chunks = load_corpus(settings.corpus_dir)
    current = fingerprint(chunks, settings.embedding_model)

    if if_stale and settings.index_meta_path.exists() and settings.embeddings_path.exists():
        meta = json.loads(settings.index_meta_path.read_text(encoding="utf-8"))
        if meta.get("fingerprint") == current:
            print(f"Vectors are up to date ({len(chunks)} chunks). Nothing to do.")
            return

    print(f"Embedding {len(chunks)} chunks...")
    started = time.time()
    embedder = OnnxEmbedder(settings.embedding_model, settings.model_cache_dir)
    vectors = embedder.embed([chunk["content"] for chunk in chunks], batch_size=32)

    np.save(settings.embeddings_path, vectors)
    settings.index_meta_path.write_text(
        json.dumps(
            {
                "fingerprint": current,
                "chunks": len(chunks),
                "dimensions": int(vectors.shape[1]),
                "model": settings.embedding_model,
                "sources": sorted({chunk["source"] for chunk in chunks}),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    megabytes = vectors.nbytes / 2**20
    print(f"Saved {vectors.shape} ({megabytes:.1f} MB) in {time.time() - started:.0f}s")


if __name__ == "__main__":
    main(if_stale="--if-stale" in sys.argv)
