# VReality

An AI learning platform. A student picks up to 6 topics and a study time, a RAG
pipeline builds an ordered roadmap, and an AI video teacher (Tavus) delivers each
chapter live. Students can interrupt with doubts, download notes, and move the class
to their phone with a QR code.

## How it fits together

```
Browser ──> Vercel (React site)
              │  /api/* is forwarded, so the browser only ever sees one origin
              ▼
            Render: vreality-api (Node/Express) ──> MongoDB Atlas
              │                                 ──> Tavus (video teacher)
              │                                 ──> Brevo (email codes)
              ▼
            Render: vreality-ai (FastAPI) ──> Groq (LLM)
```

| Folder | What it holds |
| --- | --- |
| `ai/` | RAG service. `app/rag` retrieval, `app/tutor.py` logic, `app/prompts.py` prompts |
| `backend/src/modules` | One folder per feature: routes, controller, service |
| `backend/src/integrations` | External systems: AI, Tavus, Google, email |
| `backend/src/container.js` | Wires everything together, and lets tests swap in fakes |
| `frontend/capstone/src` | `pages`, `components`, `lib/api.js` (all network calls) |

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

Open http://localhost:5173. Use `localhost`, not an IP address: Google sign-in refuses
IP addresses. In development, email codes print in the backend terminal, so sign-up
works with no mail provider.

### Testing the phone QR locally

Phones can't open `localhost`, and browsers only allow the microphone on https. A tunnel
solves both:

```bash
npx cloudflared tunnel --url http://localhost:5173
```

Put the https address it prints in `VITE_PUBLIC_APP_URL` in `frontend/capstone/.env`,
then restart the frontend. After deployment none of this is needed.

## Tests

```bash
cd backend && npm test
```

```bash
cd ai && python -m unittest tests.test_tutor
```

## Deploy

See [DEPLOY.md](DEPLOY.md).

## Changing the knowledge base

Edit `ai/data/merged_dataset.json`, run `python scripts/build_index.py`, and commit
`ai/data/embeddings.npy`. The server never embeds the corpus itself, which is what keeps
it inside 512 MB of RAM.
