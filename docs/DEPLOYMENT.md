# Deployment Guide

This repository is set up for one Vercel project:

- Next.js frontend builds from `frontend/`
- Express API is served from root `/api/*` serverless functions
- Frontend calls the API through same-origin `/api`, so `NEXT_PUBLIC_API_URL` is not needed in production

## 1. Vercel Project

Import the GitHub repository once with:

- Root Directory: leave blank / repository root
- Framework Preset: `Next.js`
- Build Command: handled by `vercel.json` as `npm run build:web`
- Output Directory: handled by `vercel.json` as `frontend/.next`

Set these environment variables in the same Vercel project:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full
WEB_ORIGIN=https://your-app-domain.vercel.app
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
PORT=3000
```

Vercel's generated deployment URL is allowed automatically. If you use a custom or aliased domain, include it in `WEB_ORIGIN`:

```env
WEB_ORIGIN=https://your-app-domain.vercel.app,https://www.your-domain.com
```

## 2. Database

Use Neon or any PostgreSQL provider.

Before production deploys, run:

```bash
npm install
npm run db:migrate
```

## 3. Smoke Tests

After deployment, verify:

1. Frontend loads at your Vercel domain.
2. `https://your-app-domain.vercel.app/health` returns `{"status":"ok"}`.
3. `https://your-app-domain.vercel.app/api/dashboard/anomalies` returns JSON.
4. A triage request succeeds from the frontend.
5. The public-health intelligence dashboard can fetch anomaly signals.

## 4. Local Build Checks

Run these before shipping:

```bash
npm run build:api
npm run build:web
npm run lint
```

## 5. Notes

- Frontend defaults to `http://localhost:3000/api` in development.
- Frontend uses `/api` in production if `NEXT_PUBLIC_API_URL` is not set.
- Use one Vercel project and one environment variable page for the hackathon deployment.
