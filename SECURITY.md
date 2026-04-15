# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public issue.
Instead, email the maintainer directly or open a private security advisory on GitHub.

## Known Issues Fixed

The following secrets were previously committed to this repository and have been
removed from all branches and history using `git-filter-repo`:

- **Gemini API key** — was hardcoded in `backend/.env` and committed to git
- **OpenFDA API key** — was hardcoded directly in `backend/app/main.py`
- **Resend API key** — was hardcoded as a fallback value in `backend/app/main.py`

**Action required:** All three API keys above must be considered compromised and
rotated immediately if you have a copy of the original repository.

## Secrets Management

All secrets are now loaded exclusively from environment variables. Never commit
a `.env` file that contains real credentials.

### Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your own API keys
3. The `.gitignore` prevents `.env` from being committed

## Security Improvements Made

| Issue | Fix |
|---|---|
| API keys hardcoded in source | Moved to environment variables |
| `.env` committed to git | Added to `.gitignore`; scrubbed from history |
| `allow_origins=["*"]` (CORS wildcard) | Restricted to configurable list via `ALLOWED_ORIGINS` env var |
| Bare `except` clauses | Replaced with typed `except Exception` |
| `node_modules` committed | Added to `.gitignore` |
| `__pycache__` committed | Added to `.gitignore` |
| No input length cap on `limit` params | Capped at 50 to prevent abuse |
| Email service exposed without API key check | Returns 503 if `RESEND_API_KEY` is not set |
