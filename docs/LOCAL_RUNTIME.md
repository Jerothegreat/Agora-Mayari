# Local Runtime Guide

This repository is configured for local development and review only. It is not wired to Vercel, Netlify, Railway, Render, Fly.io, or any other platform host.

## Local Services

- Frontend: Next.js from `frontend/`, served at `http://localhost:5173`
- Backend: Express from `backend/`, served at `http://localhost:3000`
- API base path: `http://localhost:3000/api`

## Environment

Create a root `.env` file from `.env.example`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full
WEB_ORIGINS=http://localhost:5173,http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
PORT=3000
```

## Run Locally

```bash
npm install
npm run db:migrate
npm run dev
```

## Local Smoke Tests

1. Open `http://localhost:5173`.
2. Confirm `http://localhost:3000/api/health` returns JSON.
3. Confirm the frontend can call `http://localhost:3000/api/dashboard/anomalies`.
4. Submit a triage request from the local frontend.
5. Open the public-health dashboard and confirm it can fetch local backend data.

## Notes

- Keep `.env` local and out of source control.
- Use `NEXT_PUBLIC_API_URL=http://localhost:3000/api` only if the frontend needs an explicit API override.
- Do not add platform config files unless hosting is intentionally re-enabled later.
