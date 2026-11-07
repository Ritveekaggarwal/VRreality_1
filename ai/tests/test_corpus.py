import json
import tempfile
import unittest
from pathlib import Path

import numpy as np

from app.rag.corpus import fingerprint, load_corpus
from app.rag.store import StaleIndexError, VectorStore


def write(folder: Path, name: str, chunks) -> None:
    (folder / name).write_text(json.dumps(chunks), encoding="utf-8")


class Corpus(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.dir = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_reads_every_file_fills_defaults_and_drops_duplicates(self):
        write(self.dir, "a.json", [{"content": "Enzymes", "topic": "bio"}])
        write(self.dir, "b.json", [{"content": "Genes"}, {"content": "Enzymes"}])
        chunks = load_corpus(self.dir)
        self.assertEqual([c["content"] for c in chunks], ["Enzymes", "Genes"])
        self.assertEqual(chunks[1]["sub_topic"], "general")
        self.assertEqual(chunks[1]["source"], "b")

    def test_rejects_chunks_without_content(self):
        write(self.dir, "a.json", [{"topic": "bio"}])
        with self.assertRaises(ValueError):
            load_corpus(self.dir)

    def test_fingerprint_changes_with_content_or_model(self):
        base = fingerprint([{"content": "A"}], "m1")
        self.assertNotEqual(base, fingerprint([{"content": "B"}], "m1"))
        self.assertNotEqual(base, fingerprint([{"content": "A"}], "m2"))
        self.assertEqual(base, fingerprint([{"content": "A"}], "m1"))

    def test_store_refuses_vectors_built_for_an_older_corpus(self):
        corpus = self.dir / "corpus"
        corpus.mkdir()
        write(corpus, "a.json", [{"content": "A"}])
        np.save(self.dir / "e.npy", np.zeros((1, 3), dtype=np.float32))
        (self.dir / "m.json").write_text(json.dumps({"fingerprint": "old"}))

        class Settings:
            corpus_dir = corpus
            embeddings_path = self.dir / "e.npy"
            index_meta_path = self.dir / "m.json"
            embedding_model = "m"

        with self.assertRaises(StaleIndexError):
            VectorStore.load(Settings)

        (self.dir / "m.json").write_text(
            json.dumps({"fingerprint": fingerprint(load_corpus(corpus), "m")})
        )
        self.assertEqual(len(VectorStore.load(Settings).chunks), 1)


if __name__ == "__main__":
    unittest.main()
