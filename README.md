# MedSafe — Healthcare Drug Interaction Analyzer

A web application that cross-references the FDA drug database with Google Gemini AI
to detect drug interactions, surface contraindications, and generate differential
diagnoses from symptoms.

---

## Features

| Feature | Description |
|---|---|
| **Drug Interaction Analysis** | Checks medication lists against FDA label data; Gemini AI surfaces non-obvious interaction patterns, severity ratings, and diagnosis contradictions |
| **Symptom / Differential Diagnosis** | Enter symptoms + a working diagnosis; Gemini returns ranked alternative diagnoses with symptom-match scores |
| **Drug Search & Detail** | Search FDA drug labels; get AI-generated plain-language summaries, key warning explanations, and special patient considerations |
| **Email Reports** | Send analysis results via email (requires Resend API key) |

---

## Project Structure

```
uncommonhacks25/
├── backend/
│   ├── app/
│   │   └── main.py          # FastAPI application (all API endpoints)
│   ├── .env.example         # Environment variable template
│   └── .env                 # Your local secrets — never commit this
├── web/
│   ├── index.html           # Modern single-page frontend (no build step)
│   ├── style.css            # Responsive CSS design system
│   └── app.js               # Vanilla JS — routing, API calls, rendering
├── frontend/                # Original React/TypeScript frontend (preserved)
├── frontend-mobile/         # Original React Native mobile app (preserved)
├── requirements.txt         # Python dependencies
├── SECURITY.md              # Security policy and disclosure history
└── README.md
```

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Fhazara/UncommonHacks25.git
cd UncommonHacks25
```

### 2. Backend

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install google-generativeai  # Gemini SDK

# Configure secrets
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your API keys (see below)

# Run the API server
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

Open `web/index.html` directly in a browser **or** serve it with any static server:

```bash
# Option A — Python built-in server
cd web
python -m http.server 3000
# Then open http://localhost:3000

# Option B — Node live-server
npx live-server web
```

The frontend talks to the backend at `http://localhost:8000` by default.
Change `API_BASE` at the top of `web/app.js` if your backend runs elsewhere.

---

## API Keys

| Key | Where to get it | Required |
|---|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | **Yes** |
| `FDA_API_KEY` | [FDA Open API](https://open.fda.gov/apis/authentication/) | No (rate-limited without it) |
| `RESEND_API_KEY` | [Resend](https://resend.com/) | No (email feature only) |

Set in `backend/.env`:

```dotenv
GEMINI_API_KEY=your_key_here
FDA_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
```

To restrict CORS to specific origins in production:

```dotenv
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze-drugs` | Full drug interaction + AI analysis |
| `POST` | `/api/analyze-symptoms` | Differential diagnosis from symptoms |
| `GET`  | `/api/drug-info/{name}` | Detailed FDA + AI drug info |
| `GET`  | `/api/search-drugs?term=&limit=` | Search FDA drug labels |
| `GET`  | `/api/drug-adverse-events?drug_name=` | FDA adverse event reports |
| `POST` | `/api/send-email` | Email report via Resend |

### Example: Analyze Drugs

```bash
curl -X POST http://localhost:8000/api/analyze-drugs \
  -H 'Content-Type: application/json' \
  -d '{
    "medications": ["Warfarin", "Aspirin"],
    "diagnosis": "Atrial Fibrillation",
    "symptoms": ["palpitations", "shortness of breath"]
  }'
```

---

## What Changed (Security Audit)

The original repository had several security issues that have been fixed:

- **Hardcoded API keys** — Gemini, FDA, and Resend API keys were embedded in source
  files and committed to git. All three are now loaded from environment variables
  and have been scrubbed from the full git history using `git-filter-repo`.
- **`.env` committed** — the `.env` file containing live credentials was tracked by
  git. It is now in `.gitignore` and replaced with `.env.example`.
- **CORS wildcard** — `allow_origins=["*"]` replaced with a configurable allowlist.
- **Bare `except` clauses** — replaced throughout with typed `except Exception`.
- **`node_modules` in git** — 13 000+ dependency files were tracked; now excluded.
- **No input caps** — `limit` parameters on FDA queries are now capped at 50.
- **Email without key guard** — endpoint now returns HTTP 503 if `RESEND_API_KEY`
  is not configured rather than silently failing.

See [SECURITY.md](SECURITY.md) for full details.

---

## Technologies

- **Backend:** FastAPI · Pydantic · httpx · python-dotenv
- **AI:** Google Gemini 1.5 Pro
- **Drug Data:** FDA OpenAPI (openFDA)
- **Frontend:** Vanilla HTML / CSS / JavaScript (no build step required)
- **Email:** Resend API
