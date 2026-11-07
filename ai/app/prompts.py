"""Prompt templates. Pure functions with no I/O, so they are easy to test."""

PACE_GUIDE = {
    "slow": "Move gently. Explain each idea twice in different words.",
    "moderate": "Keep a steady pace with one clear example per concept.",
    "fast": "Be brisk. Focus on the key points and skip repetition.",
}
TONE_GUIDE = {
    "beginner": "Assume no background knowledge and define every term.",
    "technical": "Use precise scientific terminology and mechanisms.",
    "practical": "Tie each concept to lab work or real-world applications.",
}


def style_guide(pace, tone) -> str:
    guides = (PACE_GUIDE.get(pace or ""), TONE_GUIDE.get(tone or ""))
    return " ".join(guide for guide in guides if guide)


def _content(chunks, limit=None) -> str:
    return "\n\n".join(chunk["content"][:limit] for chunk in chunks)


def roadmap_prompt(topics, minutes, pace, tone, chunks) -> str:
    knowledge = "\n\n".join(
        f"Topic: {c['topic']}\nSubtopic: {c['sub_topic']}\n"
        f"Difficulty: {c['difficulty']}\nCognitive load: {c['cognitive_load']}\n"
        f"Content: {c['content'][:400]}"
        for c in chunks
    )
    return f"""You are an expert curriculum planner.

Build a learning roadmap covering these topics: {", ".join(topics)}.
The student has {minutes} minutes in total.
{style_guide(pace, tone)}

Knowledge base:
{knowledge}

Rules:
1. Order modules so each one builds on the previous one.
2. Put easier concepts before advanced ones.
3. Create between 2 and 10 modules, and cover every requested topic.
4. estimated_minutes across all modules must add up to about {minutes}.
5. Give every module 2 to 4 learning objectives.
6. difficulty is an integer from 1 to 5.

Return only a JSON object in exactly this shape:
{{"roadmap":[{{"id":1,"title":"","description":"","learning_objectives":["",""],"difficulty":1,"estimated_minutes":20}}]}}"""


def script_prompt(module, chunks) -> str:
    objectives = "\n".join(f"- {o}" for o in module.learning_objectives)
    return f"""You are an expert educator writing a lecture that will be spoken aloud.

Module: {module.title}
Description: {module.description}
Target length: about {module.estimated_minutes} minutes of speech.
Learning objectives:
{objectives}

Reference material:
{_content(chunks)}

Instructions:
1. Begin with a short introduction.
2. Explain each concept clearly, connecting ideas logically.
3. Give real-life examples wherever the material supports them.
4. End with a concise summary and one or two revision points.
5. Do not invent facts that are outside the reference material.
6. Write plain spoken sentences with no markdown, headings or bullet points.
{style_guide(module.pace, module.tone)}

Return only the lecture script."""


def notes_prompt(title, script, doubts, chunks) -> str:
    doubt_text = "\n\n".join(f"Q: {d.question}\nA: {d.answer}" for d in doubts)
    doubt_block = f"\nDoubts the student asked in class:\n{doubt_text}\n" if doubt_text else ""
    return f"""You are an expert educator. Write concise study notes for this lesson.

Lesson: {title}

Lecture script:
{script}
{doubt_block}
Supporting reference material:
{_content(chunks, 600)}

Instructions:
1. Base the notes on the lecture script.
2. Organize them with short headings and bullet points.
3. Include key definitions, processes and relationships between concepts.
4. If doubts are listed, add a final "Your doubts" section answering them briefly.
5. Do not invent facts, and skip any introduction or conclusion.
6. Use plain text: headings on their own line, bullets starting with "- ".
   Do not use #, * or other markdown symbols.

Return only the notes."""


def doubt_prompt(topic, question, lesson_context, chunks) -> str:
    context_block = (
        f"\nWhat the lecture covers:\n{lesson_context[:3000]}\n" if lesson_context else ""
    )
    return f"""You are a friendly teacher answering a student's doubt during a live class.

Current topic: {topic}
Student's doubt: {question}
{context_block}
Reference material:
{_content(chunks)}

Instructions:
1. Answer clearly and directly in simple language.
2. Explain step by step when it helps, and stay on the question.
3. Use only the material above. If it is not enough to answer, say so honestly.
4. Keep it short enough to be spoken aloud, in plain sentences with no markdown.

Return only the answer."""
