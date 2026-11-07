"""Thin wrapper over the Groq SDK so the rest of the code never imports it."""
from groq import Groq


class LlmClient:
    def __init__(self, api_key: str, model: str):
        self._client = Groq(api_key=api_key, timeout=60.0, max_retries=2)
        self._model = model

    def complete(
        self,
        prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 5000,
        json_mode: bool = False,
    ) -> str:
        options = {"response_format": {"type": "json_object"}} if json_mode else {}
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_completion_tokens=max_tokens,
            **options,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("The language model returned an empty response")
        return content
