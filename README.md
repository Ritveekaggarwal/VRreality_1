# VReality

**Live site:** https://v-rreality-1.vercel.app
**API reference (Swagger):** https://v-rreality-1.vercel.app/api/docs

VReality is an AI learning platform with a live video teacher. A student picks up to
6 topics and a study time. A RAG pipeline builds an ordered roadmap from textbook
material, and an AI teacher (Tavus) delivers each chapter on video. Students can
interrupt with a doubt at any moment, download notes, and move the class to their
phone with a QR code.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [How the RAG pipeline fits in 512 MB](#how-the-rag-pipeline-fits-in-512-mb)
- [Adding knowledge](#adding-knowledge)
- [API documentation](#api-documentation)
- [Moving a class to your phone](#moving-a-class-to-your-phone)
- [Project structure](#project-structure)
- [Run it locally](#run-it-locally)
- [Tests](#tests)
- [Deploy](#deploy)

## Features

| Feature | How it works |
| --- | --- |
| Sign in | Email and password with a 6-digit email code, or Google. Sessions survive a refresh. |
| Roadmap | Up to 6 topics, a study time, pace and teaching style. The AI orders the chapters. |
| Sequential lock | A chapter opens only after the previous one is finished. The server enforces this. |
| Live class | A Tavus video teacher teaches from a script grounded in the textbooks. |
| Live doubts | Ask out loud, or type. Typed doubts are answered from the textbooks, then spoken by the teacher. |
| Notes | Generated in the background from the script and your doubts. Downloadable as a PDF. |
| Phone handoff | One QR code opens the class and the notes on a phone, with no sign-in. |
| Dashboard | Progress, the next chapter, a notes library and profile editing. |

## Architecture

```
Browser ──> Vercel (React site)
              │  /api/* is forwarded, so the browser only ever sees one origin
              ▼
            Render: vreality-api (Node + Express) ──> MongoDB Atlas
              │                                   ──> Tavus  (video teacher)
              │                                   ──> Brevo  (email codes)
              ▼
            Render: vreality-ai (FastAPI) ──> Groq (LLM)
```

Because Vercel forwards `/api`, the site and the API share one address. Sign-in cookies
are therefore first-party and work in every browser, there is no CORS setup, and nothing
depends on an IP address.

## How the RAG pipeline fits in 512 MB

Render's free plan gives each service 512 MB of RAM. The original AI service ran out
before it finished starting, for two reasons:

1. It loaded **PyTorch and sentence-transformers** (well over 1 GB on their own) just to
   turn text into vectors.
2. On **every start** it converted all 1,326 textbook passages into vectors again.

The fix splits the work into two phases.

**Once, ahead of time** (`scripts/build_index.py`):

```
data/corpus/*.json ──> embedding model ──> data/embeddings.npy   (1,326 × 384 numbers, 1.9 MB)
                                       └─> data/index_meta.json (fingerprint of the text)
```

**On every request** (`main.py`):

```
question ──> embed just the question ──> compare with all 1,326 saved vectors ──> best passages ──> Groq
```

So yes: the vectors are already made and stored in the repository. The server only
loads that 1.9 MB file. The one thing it still embeds is the student's short question.
For that it uses the same `all-MiniLM-L6-v2` model running on ONNX Runtime (through
`fastembed`) instead of PyTorch, and that model uses about 100 MB.

| | Before | After |
| --- | --- | --- |
| Embedding library | PyTorch + sentence-transformers | ONNX Runtime (fastembed) |
| Corpus vectors | Rebuilt on every start | Loaded from disk |
| Search | FAISS | NumPy dot product (under 10 ms) |
| Peak memory | Over 512 MB, crashed | About 260 MB |

Search quality is unchanged. It is the same model producing the same vectors (checked:
maximum difference 0.0).

## Adding knowledge

The knowledge base is every `.json` file in `ai/data/corpus/`. Each file is a list of
passages. Only `content` is required, and the other fields fall back to defaults:

```json
[
  {
    "content": "CRISPR-Cas9 is a genome editing tool in which a guide RNA directs ...",
    "topic": "genetic_engineering",
    "sub_topic": "crispr",
    "difficulty": 3,
    "cognitive_load": 3,
    "estimated_minutes": 10
  }
]
```

Keep each passage to one idea of about 100 to 300 words. Retrieval works on whole
passages, so short focused ones give better answers than long mixed ones.

**To add a new book or topic:**

1. Save its passages as a new file, for example `ai/data/corpus/microbiology.json`.
2. Rebuild the vectors:

   ```bash
   cd ai
   python scripts/build_index.py
   ```

3. Commit the new file, `data/embeddings.npy` and `data/index_meta.json`, then push.

If you forget step 2, nothing breaks. Every Render deploy runs
`build_index.py --if-stale`, which compares the fingerprint of the text with
`index_meta.json` and rebuilds only when something changed. When nothing changed it
skips straight past. Duplicate passages are dropped automatically, and a passage
without `content` stops the build with a message naming the file and position.

**How far it scales:** each passage costs about 1.5 KB of RAM for its vector, plus its
text. 10,000 passages add roughly 30 MB, which fits easily. Above about 50,000
passages, consider a hosted vector database instead of loading everything into memory.

## API documentation

The API is described in OpenAPI 3 at [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml)
and served as interactive Swagger UI:

- Live: https://v-rreality-1.vercel.app/api/docs
- Local: http://localhost:5173/api/docs
- Raw spec: `/api/docs/openapi.json`, which you can import into Postman or Insomnia

**To try protected endpoints:** run `POST /auth/login`, copy `accessToken` from the
response, click **Authorize**, and paste it. Access tokens last 15 minutes, and
`POST /auth/refresh` issues a new one.

| Group | Endpoints |
| --- | --- |
| Auth | `register`, `verify-email`, `login`, `google`, `resend-otp`, `forgot-password`, `verify-reset-otp`, `reset-password`, `refresh`, `logout`, `logout-all`, `me` |
| Roadmap | `POST /roadmap/generate`, `GET /roadmap/current` |
| Lesson | `POST /lesson/start`, `POST /lesson/{id}/complete`, `POST /lesson/{id}/doubt`, `POST /lesson/{id}/notes`, `GET /lesson/{id}/notes.pdf`, `POST /lesson/{id}/share` |
| Phone (no sign-in) | `GET /lesson/shared/{token}`, `GET /lesson/shared/{token}/notes.pdf` |
| Dashboard | `GET /dashboard`, `PUT /dashboard/profile` |
| System | `GET /health` |

Errors always have the shape `{ "message": "...", "code": "OPTIONAL_CODE" }`.

The AI service (`ai/main.py`) is internal. Only the backend calls it, and it rejects any
request without the shared `AI_SERVICE_TOKEN`. Its endpoints are `POST /roadmap`,
`/script`, `/notes` and `/doubt`, plus `GET /health`.

## Moving a class to your phone

- Opening a chapter creates **one** Tavus conversation. Reopening the chapter reuses it
  while it is still active, and two clicks at once share one request.
- The QR code holds a signed token for that lesson. The phone joins the **same**
  conversation, so no new video is generated and no extra conversation is created.
  Tavus bills by conversation minutes, and the class is still one conversation.
- When the phone joins, the laptop mutes its microphone to prevent echo and shows a
  notice. The laptop's video keeps playing until you close that tab.
- Finishing the lesson ends the conversation so it stops using credits. A conversation
  also ends on its own 2 minutes after everyone leaves, or after 1 hour.

## Project structure

```
ai/                         RAG service (FastAPI)
  app/rag/corpus.py           reads data/corpus, fingerprints it
  app/rag/embedder.py         ONNX query embedding
  app/rag/store.py            loads saved vectors, searches them
  app/prompts.py              prompt templates
  app/tutor.py                roadmap, script, notes and doubt logic
  data/corpus/                the knowledge base (JSON)
  data/embeddings.npy         pre-built vectors
  scripts/build_index.py      builds the vectors
backend/                    API (Node + Express)
  docs/openapi.yaml           API specification
  src/modules/<feature>/      routes, service and schemas for each feature
  src/integrations/           AI service, Tavus, Google, email
  src/container.js            wires everything, and lets tests swap in fakes
frontend/capstone/          Website (React + Vite + Tailwind + Framer Motion)
  src/pages/                  one file per screen
  src/components/             UI pieces, grouped by area
  src/lib/api.js              every network call
  tools/render_hero_video.py  renders the background video
```

## Run it locally

You need Node 22, Python 3.11 and three terminals.

**AI service**

```bash
cd ai
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

**Backend**

```bash
cd backend
npm install
npm run dev
```

**Frontend**

```bash
cd frontend/capstone
npm install
npm run dev
```

Open http://localhost:5173. Use `localhost`, not an IP address, because Google sign-in
refuses IP addresses. In development, email codes print in the backend terminal, so
sign-up works without a mail provider.

To test the phone QR locally, a tunnel gives your phone an https address:

```bash
npx cloudflared tunnel --url http://localhost:5173
```

Put the address it prints in `VITE_PUBLIC_APP_URL` in `frontend/capstone/.env` and
restart the frontend.

## Tests

```bash
cd backend && npm test
```

```bash
cd ai && python -m unittest discover -s tests
```

The backend tests run the real API against an in-memory MongoDB, with fake AI, Tavus,
email and Google services. They cover sign-up, login, the sequential lock, the QR token,
notes PDFs and access between accounts.

## Deploy

See [DEPLOY.md](DEPLOY.md).
