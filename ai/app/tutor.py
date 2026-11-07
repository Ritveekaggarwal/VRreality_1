"""Application logic: retrieval plus generation. Knows nothing about HTTP."""
import json

from app import prompts


def parse_roadmap(raw: str) -> list[dict]:
    """Accept {"roadmap": [...]} or a bare list, with or without code fences."""
    text = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    modules = data.get("roadmap") if isinstance(data, dict) else data
    if not isinstance(modules, list) or not modules:
        raise ValueError("The model did not return any roadmap modules")
    return modules


def normalize_modules(modules: list[dict]) -> list[dict]:
    """Assign ids and lock state here. Progression is never left to the model."""
    return [
        {
            "id": index + 1,
            "title": str(module.get("title") or f"Module {index + 1}"),
            "description": str(module.get("description") or ""),
            "learning_objectives": [str(o) for o in module.get("learning_objectives") or []],
            "difficulty": int(module.get("difficulty") or 1),
            "estimated_minutes": max(int(module.get("estimated_minutes") or 10), 1),
            "status": "READY" if index == 0 else "LOCKED",
            "prerequisites": [index] if index else [],
        }
        for index, module in enumerate(modules)
    ]


class Tutor:
    def __init__(self, retriever, llm):
        self._retriever = retriever
        self._llm = llm

    def roadmap(self, request) -> list[dict]:
        per_topic = max(3, 12 // len(request.topics))
        chunks = self._retriever.retrieve_many(request.topics, per_query=per_topic)
        prompt = prompts.roadmap_prompt(
            request.topics, request.duration, request.pace, request.tone, chunks
        )
        raw = self._llm.complete(prompt, temperature=0.2, json_mode=True)
        return normalize_modules(parse_roadmap(raw))

    def script(self, module) -> str:
        query = f"{module.title}\n{' '.join(module.learning_objectives)}\n{module.description}"
        chunks = self._retriever.retrieve(query, top_k=8)
        return self._llm.complete(prompts.script_prompt(module, chunks), max_tokens=6000)

    def notes(self, request) -> str:
        chunks = self._retriever.retrieve(request.title, top_k=4)
        prompt = prompts.notes_prompt(request.title, request.script, request.doubts, chunks)
        return self._llm.complete(prompt, temperature=0.2)

    def doubt(self, request) -> str:
        chunks = self._retriever.retrieve(f"{request.topic}\n{request.question}", top_k=6)
        prompt = prompts.doubt_prompt(
            request.topic, request.question, request.lesson_context, chunks
        )
        return self._llm.complete(prompt, max_tokens=1500)
