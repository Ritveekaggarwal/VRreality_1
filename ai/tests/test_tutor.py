import unittest

from app.tutor import normalize_modules, parse_roadmap


class ParseRoadmap(unittest.TestCase):
    def test_accepts_object_list_and_fences(self):
        self.assertEqual(parse_roadmap('{"roadmap":[{"title":"A"}]}'), [{"title": "A"}])
        self.assertEqual(parse_roadmap('[{"title":"A"}]'), [{"title": "A"}])
        self.assertEqual(parse_roadmap('```json\n[{"title":"A"}]\n```'), [{"title": "A"}])

    def test_rejects_empty(self):
        with self.assertRaises(ValueError):
            parse_roadmap('{"roadmap":[]}')


class NormalizeModules(unittest.TestCase):
    def test_only_first_module_is_unlocked(self):
        modules = normalize_modules(
            [{"title": "A", "status": "READY"}, {"title": "B", "status": "READY"}]
        )
        self.assertEqual([m["status"] for m in modules], ["READY", "LOCKED"])
        self.assertEqual([m["id"] for m in modules], [1, 2])


if __name__ == "__main__":
    unittest.main()
