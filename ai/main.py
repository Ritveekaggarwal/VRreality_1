"""HTTP layer for the AI service. Routes only translate between HTTP and Tutor."""
import hmac
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException

from app.llm import LlmClient
from app.rag.embedder import OnnxEmbedder
from app.rag.store import Retriever, VectorStore
from app.schemas import DoubtRequest, NotesRequest, RoadmapRequest, ScriptRequest
from app.settings import settings
from app.tutor import Tutor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai")

if not settings.groq_api_key:
    raise RuntimeError("GROQ_API_KEY is not set")

embedder = OnnxEmbedder(settings.embedding_model, settings.model_cache_dir)
store = VectorStore.load(settings)
tutor = Tutor(
    Retriever(embedder, store),
    LlmClient(settings.groq_api_key, settings.llm_model),
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load in the background so the port opens at once and health checks pass.
    threading.Thread(target=embedder.load, daemon=True).start()
    yield


app = FastAPI(
    title="VReality AI Service",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def require_service_token(x_service_token: str = Header(default="")) -> None:
    expected = settings.service_token
    if expected and not hmac.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=401, detail="Invalid service token")


def run(action, label: str):
    try:
        return action()
    except Exception:
        logger.exception("%s failed", label)
        raise HTTPException(status_code=502, detail=f"{label} failed. Please try again.")


@app.get("/health")
def health():
    return {"status": "healthy", "embedder_ready": embedder.ready, "chunks": len(store.chunks)}


@app.post("/roadmap", dependencies=[Depends(require_service_token)])
def create_roadmap(request: RoadmapRequest):
    return {"roadmap": run(lambda: tutor.roadmap(request), "Roadmap generation")}


@app.post("/script", dependencies=[Depends(require_service_token)])
def create_script(request: ScriptRequest):
    return {"script": run(lambda: tutor.script(request.module), "Script generation")}


@app.post("/notes", dependencies=[Depends(require_service_token)])
def create_notes(request: NotesRequest):
    return {"notes": run(lambda: tutor.notes(request), "Notes generation")}


@app.post("/doubt", dependencies=[Depends(require_service_token)])
def answer_doubt(request: DoubtRequest):
    return {"answer": run(lambda: tutor.doubt(request), "Doubt answering")}
