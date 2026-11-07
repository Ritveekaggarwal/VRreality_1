from typing import List, Literal, Optional

from pydantic import BaseModel, Field

Pace = Literal["slow", "moderate", "fast"]
Tone = Literal["beginner", "technical", "practical"]


class RoadmapRequest(BaseModel):
    topics: List[str] = Field(..., min_length=1, max_length=6)
    duration: int = Field(..., gt=0, le=6000, description="Total minutes")
    pace: Optional[Pace] = None
    tone: Optional[Tone] = None


class Module(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str = ""
    learning_objectives: List[str] = Field(default_factory=list)
    estimated_minutes: int = 10
    pace: Optional[Pace] = None
    tone: Optional[Tone] = None


class ScriptRequest(BaseModel):
    module: Module


class Doubt(BaseModel):
    question: str
    answer: str


class NotesRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    script: str = Field(..., min_length=1)
    doubts: List[Doubt] = Field(default_factory=list)


class DoubtRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    question: str = Field(..., min_length=1, max_length=2000)
    lesson_context: str = ""
