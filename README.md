<div align="center">
  <img src="frontend/public/img/logo.jpg" alt="STAR-LINK Logo" width="220" height="220">

# HALIYA

**An AI-driven health intelligence and triage system.**

[Judge Access Flow](#judge-access-flow)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Local Only](https://img.shields.io/badge/Run-Local%20Only-0f766e?style=for-the-badge)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Interactive Intelligence Flow](#interactive-intelligence-flow)
4. [Repository Structure](#repository-structure)
5. [Core Features](#core-features)
6. [Screenshots](#screenshots)
7. [Getting Started](#getting-started)
8. [Judge Access Flow](#judge-access-flow)
9. [Environment Variables](#environment-variables)
10. [Available Scripts](#available-scripts)
11. [UI/UX Design Direction](#uiux-design-direction)
12. [Data Privacy and Medical Disclaimer](#data-privacy-and-medical-disclaimer)
13. [Local Readiness](#local-readiness)
14. [Success Metrics](#success-metrics)
15. [Delivery Phases](#delivery-phases)
16. [Team](#team)

---

## Overview

**Web App Name:** Haliya

Named after Filipino moon goddesses, Haliya represents a guiding light in the dark of health uncertainty.

**Concept:** An AI-driven health intelligence and triage system.

**Problem Statement**

Public healthcare systems in the Philippines are often overloaded. Patients frequently misjudge the severity of their symptoms, leading to:

- Delayed treatment for critical, life-threatening conditions
- Unnecessary ER overcrowding from minor, self-manageable ailments
- Zero population-level visibility into emerging health trends at the barangay or regional level
- No accessible, data-driven triage tool available to ordinary Filipinos before they reach a hospital

There is a significant lack of an accessible, data-driven tool that can:

1. Help users accurately assess symptom urgency
2. Learn from aggregated health data patterns
3. Provide population-level health insights and early warnings

**Solution**

A data-driven AI triage web platform designed to:

- Classify symptom severity in real time, guiding users to self-care, teleconsult, clinic, or ER
- Learn from historical and user-generated data, continuously improving triage accuracy
- Provide comprehensive health trend analytics, surfacing regional outbreak signals and predictive insights for health authorities

**Theme Alignment**

"Build from Anywhere, Build Anything" - Haliya is remotely accessible by any Filipino on any device, anywhere in the country, with no hospital visit required to get an intelligent health assessment.

---

## Tech Stack

### Core Framework

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Version</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Framework</td>
      <td><img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" alt="Next.js"></td>
      <td>16.2</td>
      <td>Server-side rendering, routing, API routes</td>
    </tr>
    <tr>
      <td>UI Library</td>
      <td><img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React"></td>
      <td>19.2</td>
      <td>Component-based user interface</td>
    </tr>
    <tr>
      <td>Language</td>
      <td><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></td>
      <td>5.x</td>
      <td>Static type safety across the codebase</td>
    </tr>
    <tr>
      <td>Styling</td>
      <td><img src="https://img.shields.io/badge/CSS_Modules-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS Modules"></td>
      <td>--</td>
      <td>Scoped component styles with shared design tokens</td>
    </tr>
  </tbody>
</table>

### Data and Authentication

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Version</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Database</td>
      <td><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL"></td>
      <td>--</td>
      <td>PostgreSQL database used by the local backend</td>
    </tr>
    <tr>
      <td>Query Layer</td>
      <td><img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black" alt="Drizzle ORM"></td>
      <td>0.45</td>
      <td>Type-safe SQL queries and schema management</td>
    </tr>
    <tr>
      <td>Database Driver</td>
      <td><img src="https://img.shields.io/badge/PostgreSQL_Driver-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL Driver"></td>
      <td>1.x</td>
      <td>PostgreSQL driver for backend database access</td>
    </tr>
    <tr>
      <td>Schema Tooling</td>
      <td><img src="https://img.shields.io/badge/Drizzle_Kit-C5F74F?style=flat&logo=drizzle&logoColor=black" alt="Drizzle Kit"></td>
      <td>0.31</td>
      <td>Migration generation and schema push</td>
    </tr>
    <tr>
      <td>Authentication</td>
      <td><img src="https://img.shields.io/badge/Custom_Auth-000000?style=flat" alt="Custom Auth"></td>
      <td>--</td>
      <td>Server actions with bcryptjs password hashing</td>
    </tr>
    <tr>
      <td>Auth Integration</td>
      <td><img src="https://img.shields.io/badge/NextAuth.js-000000?style=flat&logo=nextdotjs&logoColor=white" alt="NextAuth"></td>
      <td>5.0-beta</td>
      <td>Available for OAuth/social login expansion</td>
    </tr>
  </tbody>
</table>

### Maps, Visualization, and Reporting

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Version</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Maps</td>
      <td><img src="https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white" alt="Leaflet"></td>
      <td>1.9 / 5.0</td>
      <td>Interactive geospatial map and collaboration overlays</td>
    </tr>
    <tr>
      <td>Charts</td>
      <td><img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat" alt="Recharts"></td>
      <td>3.8</td>
      <td>Admin dashboard analytics visualizations</td>
    </tr>
    <tr>
      <td>PDF Export</td>
      <td><img src="https://img.shields.io/badge/jsPDF-FF0000?style=flat" alt="jsPDF"></td>
      <td>4.2 / 5.0</td>
      <td>Server-side and client-side report generation</td>
    </tr>
    <tr>
      <td>Geospatial Data</td>
      <td><img src="https://img.shields.io/badge/GeoJSON-333333?style=flat" alt="GeoJSON"></td>
      <td>--</td>
      <td>Regional boundary rendering on the collaboration map</td>
    </tr>
  </tbody>
</table>

### File Storage

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Version</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Document Storage</td>
      <td><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL"></td>
      <td>--</td>
      <td>Binary document storage for current uploads</td>
    </tr>
    <tr>
      <td>Blob Storage</td>
      <td><img src="https://img.shields.io/badge/PostgreSQL_Documents-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL Documents"></td>
      <td>2.3</td>
      <td>Current uploads are stored in PostgreSQL for local runtime</td>
    </tr>
  </tbody>
</table>

### Tooling and Quality

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Version</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>CI Pipeline</td>
      <td>NPM</td>
      <td>--</td>
      <td>Lint, typecheck, and build in a single command</td>
    </tr>
  </tbody>
</table>

### Knowledge Intelligence (AI Layer)

<table width="100%" style="width: 100%; table-layout: fixed;">
  <thead>
    <tr>
      <th align="left" width="18%">Layer</th>
      <th align="left" width="28%">Technology</th>
      <th align="left" width="12%">Model</th>
      <th align="left" width="42%">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Inference Engine</td>
      <td><img src="https://img.shields.io/badge/Groq-f55036?style=flat" alt="Groq"></td>
      <td>Llama-3.1 / 3.3</td>
      <td>High-velocity LLM inference for RAG and NLP</td>
    </tr>
    <tr>
      <td>Synthesis Layer</td>
      <td><img src="https://img.shields.io/badge/RAG-000000?style=flat" alt="RAG"></td>
      <td>Custom</td>
      <td>Context-grounded pedagogical answer synthesis</td>
    </tr>
    <tr>
      <td>Analysis Layer</td>
      <td><img src="https://img.shields.io/badge/NLP-000000?style=flat" alt="NLP"></td>
      <td>Custom</td>
      <td>Thematic clustering of regional forum discourse</td>
    </tr>
    <tr>
      <td>Embedding Fallback</td>
      <td><img src="https://img.shields.io/badge/Lexical_Search-000000?style=flat" alt="Lexical Search"></td>
      <td>Heuristic</td>
      <td>Rule-based fallback for high-availability diagnostics</td>
    </tr>
  </tbody>
</table>

---

## Interactive Intelligence Flow

```mermaid
sequenceDiagram
  autonumber
  actor Patient
  participant Frontend as Next.js Frontend
  participant API as Express API
  participant Triage as triageController
  participant Groq as Groq Chat Completions
  participant Trust as trustEngine
  participant DB as PostgreSQL
  actor Facility as Facility Dashboard
  actor PH as Public Health Dashboard

  Patient->>Frontend: Submit symptoms, age, sex, duration, region, language
  Frontend->>API: POST /api/triage
  API->>Triage: Route request
  Triage->>DB: Read latest session history by session_token
  Triage->>Groq: Ask for strict JSON triage assessment
  Groq-->>Triage: Urgency score, differential diagnosis, red flags, next steps
  Triage->>Trust: Apply deterministic safety rules
  Trust-->>Triage: Minimum score override, evidence ledger, trusted sources
  Triage->>DB: Read facilities and appointment queue counts
  Triage->>Trust: Build facility recommendations
  Triage->>DB: Insert triage_sessions row
  Triage-->>Frontend: Final triage result with audit fields
  Frontend-->>Patient: Show urgency, next steps, confidence, evidence, facility options

  Patient->>Frontend: Book appointment after triage
  Frontend->>API: POST /api/appointments with JWT and triage summary
  API->>DB: Store appointment linked to patient and facility
  Facility->>API: GET /api/appointments/my-appointments
  API->>DB: Read facility queue sorted by triage risk
  Facility->>API: PATCH status or submit clinician feedback
  API->>DB: Store clinical disposition and feedback metrics

  PH->>API: GET public-health dashboard data
  API->>DB: Aggregate triage_sessions by time, region, urgency, symptom cluster
  API-->>PH: Regional stats, trends, top symptoms, anomaly signals
  PH->>API: POST /api/intelligence/generate
  API->>DB: Load recent and baseline triage sessions
  API->>API: Detect anomalies using 48h vs 14 day baseline
  API->>Groq: Draft LGU-ready outbreak alert message
  Groq-->>API: Structured alert message
  API->>DB: Insert outbreak_alerts when not duplicate
  API-->>PH: Alerts generated and anomaly details
```

---

## Repository Structure

```
codekada/
├── backend/                     # Express + Drizzle API for local runtime
│   ├── api/
│   ├── configs/
│   ├── controllers/
│   ├── drizzle/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── views/
│   ├── app.ts
│   ├── index.ts
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # Next.js application
│   ├── public/
│   │   └── img/
│   │       ├── logo.jpg
│   │       ├── adriel.jpg
│   │       ├── aris.jpeg
│   │       ├── jero.jpeg
│   │       └── jordan.jpeg
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── lib/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── README.md
├── packages/
│   └── db/
├── docs/
│   ├── LOCAL_RUNTIME.md
│   ├── FEATURES.md
│   ├── PITCH.md
│   └── WINNING_CHECKLIST.md
├── package.json
└── README.md
```

---

## Core Features

### AI Triage Engine

- Anonymous symptom checker for users who need quick pre-hospital guidance
- Symptom input through free-text descriptions or common symptom selections
- Optional patient context including age, sex, symptom duration, conditions, and region
- AI-generated urgency classification: self-care, clinic, ER, or emergency
- Urgency score, confidence level, explanation, and recommended next steps
- Differential diagnosis suggestions with clinical reasoning
- Red-flag warnings for symptoms that require immediate escalation
- Deterministic safety-rule layer that can override the AI score for emergency patterns
- Evidence ledger with audit ID, model reference, triggered safety rules, and trusted health sources
- Facility recommendations based on urgency, location, capability tags, and queue load
- Session-based triage history for recurring symptom and longitudinal pattern detection

### Public Health Intelligence

- Public Health Intelligence Dashboard for monitoring aggregated triage signals
- Regional signal map showing report density and average urgency by location
- Dashboard summary cards for reports, signal velocity, hotspots, and active alerts
- Regional watchlist and signal scoring for prioritizing health response areas
- Trend charts for recent triage report movement over time
- Top symptom signal chart from recent user-submitted assessments
- Statistical anomaly engine comparing recent reports against baseline activity
- AI-generated outbreak or situation alerts for LGU and facility teams
- Active alert feed with severity, symptom cluster, region, and recommended action context
- Synthetic demo fallback when live public-health data is unavailable

### Patient Dashboard

- Patient appointment dashboard connected to authenticated user accounts
- Upcoming and historical appointment list with status filtering
- Facility selection using searchable available healthcare providers
- Appointment booking form with visit type, consultation mode, specialty, date, and notes
- Built-in AI triage assessment before booking when symptoms are provided
- Stored triage score, summary, and explanation attached to appointment requests
- Personalized AI health summary based on the user's session triage history
- Patient profile hydration and update support
- Appointment detail view and cancellation flow

### Provider Dashboard

- Facility dashboard for healthcare providers and partner clinics
- Live queue of patient appointment requests
- Risk-prioritized appointment table using AI triage scores
- Queue status management for pending, confirmed, cancelled, and all appointments
- Patient symptom summary, appointment details, and triage explanation review
- Facility profile hydration and update support
- Clinician feedback submission for AI triage review
- Agreement rate, correction counts, and confusion matrix for AI validation
- Auto-refreshing queue feed for operational monitoring

---

## Screenshots

Add screenshots to `docs/screenshots/` and update each placeholder path when the final images are ready.

### Landing Page

![Landing Page Screenshot](docs/screenshots/landing-page.png)

### AI Triage Engine

#### Describe Symptoms

![AI Triage - Describe Symptoms Screenshot](docs/screenshots/ai-triage-describe-symptoms.png)

#### Select Symptoms

![AI Triage - Select Symptoms Screenshot](docs/screenshots/ai-triage-select-symptoms.png)

### Public Health Intelligence

#### Public Health Dashboard Overview

![Public Health Dashboard Overview Screenshot](docs/screenshots/public-health-overview.png)

#### Regional Signal Map

![Public Health Regional Signal Map Screenshot](docs/screenshots/public-health-regional-map.png)

#### Top Symptom Signals

![Public Health Top Symptom Signals Screenshot](docs/screenshots/public-health-top-symptoms.png)

#### Outbreak Anomaly Alerts

![Public Health Outbreak Anomaly Alerts Screenshot](docs/screenshots/public-health-anomaly-alerts.png)

### Patient Dashboard

![Patient Dashboard Screenshot](docs/screenshots/patient-dashboard.png)

### Provider Dashboard

![Provider Dashboard Screenshot](docs/screenshots/provider-dashboard.png)

### Symptom History

![Symptom History Screenshot](docs/screenshots/symptom-history.png)

---

## Getting Started

Repository link: `https://github.com/adr1el-m/codekada-theboys`

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- A PostgreSQL database (Neon Postgres recommended)
- A Groq API key for the AI triage and public-health intelligence features
- Git, if cloning from the repository URL

### Installation

Download or clone the repository:

```bash
git clone https://github.com/adr1el-m/codekada-theboys.git
cd codekada-theboys
```

If you do not want to use Git, open the GitHub link, select `Code`, then `Download ZIP`. Extract the ZIP and open the extracted `codekada-theboys` folder in your terminal.

Install dependencies from the main repo root:

```bash
npm install
```

Create the main environment file from the root `.env.example`:

```bash
copy .env.example .env
```

For PowerShell, you can also use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your actual values:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full
WEB_ORIGINS=http://localhost:5173,http://localhost:3000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
PORT=3000
```

Run database migrations:

```bash
npm run db:migrate
```

Start the backend and frontend together:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend API will be available at `http://localhost:3000/api`.

---

## Judge Access Flow

This project is configured for local review only. Run `npm run dev` from the main repository and open `http://localhost:5173`.

### Patient Flow

Demo patient access:

- Email: `patient@haliya.ph`
- Password: `patient123`

Suggested review path:

1. Open the landing page at `http://localhost:5173/`.
2. Go to `http://localhost:5173/triage` from the shared header.
3. Test the AI Triage Engine using the `Describe Symptoms` mode by entering a symptom description.
4. Repeat the triage flow using the `Select Symptoms` mode to review the guided symptom picker.
5. Review the triage result, including urgency level, urgency score, explanation, next steps, red flags, evidence ledger, and facility recommendations.
6. Open `http://localhost:5173/history` to view saved symptom assessment history from the current browser session.
7. Go to `http://localhost:5173/auth/login`, click the demo patient access card, and submit the login form.
8. Review `http://localhost:5173/dashboard/patient` for appointments, patient health summary, booking flow, facility selection, appointment details, and cancellation flow.
9. Use `http://localhost:5173/dashboard/patient/profile` to review the patient profile and account management area.

### Provider Flow

Demo provider access:

- Email: `provider@haliya.ph`
- Password: `provider123`

Suggested review path:

1. Open `http://localhost:5173/facility/login`.
2. Click the demo facility access card and submit the login form.
3. Review `http://localhost:5173/dashboard/facility` for the live provider queue, total queue, pending review, confirmed appointments, and average risk score.
4. Use the queue filters to switch between pending, confirmed, cancelled, and all appointments.
5. Open a patient appointment to review symptom summary, AI triage score, appointment details, and triage explanation.
6. Confirm or cancel pending appointments to test facility queue actions.
7. Submit clinician feedback to compare provider judgment against the AI triage result.
8. Review the clinician feedback dashboard, including agreement rate, correction counts, and confusion matrix.
9. Use `http://localhost:5173/dashboard/facility/profile` to review the facility profile and account management area.

### Public Health Flow

Optional judge review path:

1. Open `http://localhost:5173/public-health`.
2. Review dashboard summary cards, regional signal map, trend charts, top symptom signals, anomaly engine, and active alert feed.
3. Use `Generate Situation Brief` to run the public-health intelligence flow when backend data is available.

---

## Environment Variables

Create a root `.env` file based on `.env.example`:

| Variable               | Required | Description                                                |
| :--------------------- | :------- | :--------------------------------------------------------- |
| `GROQ_API_KEY`         | Yes      | Groq API key used by the AI triage and alert generation    |
| `GROQ_MODEL`           | Yes      | Groq model name, defaulted to `llama-3.3-70b-versatile`    |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string, such as a Neon database URL  |
| `WEB_ORIGINS`          | Yes      | Allowed frontend origins for backend CORS                  |
| `ACCESS_TOKEN_SECRET`  | Yes      | Secret used to sign access tokens                          |
| `REFRESH_TOKEN_SECRET` | Yes      | Secret used to sign refresh tokens                         |
| `PORT`                 | Yes      | Backend API port, usually `3000` for local development     |

---

## Available Scripts

| Command             | Description                                   |
| :------------------ | :-------------------------------------------- |
| `npm run dev`        | Start the local backend and frontend together |
| `npm run dev:api`    | Start only the local Express backend          |
| `npm run dev:web`    | Start only the local Next.js frontend         |
| `npm run build`      | Build backend and frontend locally            |
| `npm run build:api`  | Build only the backend                        |
| `npm run build:web`  | Build only the frontend                       |
| `npm run lint`       | Run frontend ESLint static analysis           |

---

## UI/UX Design Direction

Haliya is designed as a calm, trust-centered health interface. The experience prioritizes fast symptom intake, clear urgency guidance, and readable dashboards for patients, providers, and public-health teams.

### Visual Identity

- Medical intelligence visual language using teal, slate, blue, emerald, amber, and red to communicate care level and urgency without overwhelming users
- Clean, high-contrast layouts that make symptom input, triage scores, next steps, and warnings easy to scan
- Rounded panels, subtle shadows, and soft background surfaces to keep the interface approachable during stressful health moments
- Risk colors used consistently across patient results, provider queues, public-health signals, alerts, and dashboard metrics
- Icon-supported controls for triage, safety, activity, public-health signals, appointments, and queue actions
- Bilingual-ready interface with an EN/FIL language control in the shared header

### Navigation Model

- Shared `AppHeader` navigation keeps the landing page, triage checker, symptom history, dashboards, and public-health pages connected
- Public users can move directly from the landing page into anonymous AI triage without creating an account first
- Triage results provide a natural handoff into booking, facility recommendations, and patient dashboard workflows
- Patient and provider dashboards use role-specific surfaces so each user type sees only the actions relevant to their care journey
- Public-health users access a separate intelligence view focused on regional signals, anomaly detection, and situation monitoring
- The experience is structured around one flow: assess symptoms, guide care, support facilities, and surface population-level insights

### Responsive Strategy

- Mobile-first triage flow for ordinary Filipinos using phones before reaching a hospital or clinic
- Compact symptom forms and result cards designed for quick reading on small screens
- Responsive dashboard grids for patient appointments, provider queues, analytics cards, maps, and charts
- Desktop layouts expand into richer operational views for providers and public-health monitoring teams
- Large data surfaces, such as Recharts charts and Leaflet maps, use constrained containers so they remain readable across screen sizes
- Clear spacing, readable labels, and touch-friendly actions support repeated use by patients and healthcare staff

---

## Data Privacy and Medical Disclaimer

Haliya processes sensitive symptom information to provide AI-assisted triage, appointment routing, facility queue support, and public-health intelligence. Because symptoms can reveal private health conditions, the system is designed around privacy, limited use, and clear clinical boundaries.

### Private Symptom Data

- Haliya collects only the information needed to support the care flow, such as symptom descriptions, age, sex, duration, region, appointment details, account records, and session identifiers.
- Symptom assessments may be linked to a session token so users can view history and receive longitudinal health summaries.
- Account-linked records are used for patient dashboards, provider queues, facility coordination, and appointment management.
- Haliya does not sell personal health information.
- Users should avoid submitting information about another person unless they are authorized to do so.

### AI Cross-Checking and Safety

- The AI triage engine cross-checks the user's symptoms with recent session history, reported context, deterministic safety rules, and trusted health references.
- Deterministic safety rules can raise urgency when high-risk patterns appear, such as breathing distress, stroke-like symptoms, severe bleeding, or dangerous chest pain patterns.
- The system records an evidence ledger with an audit ID, model reference, triggered rules, score basis, and confidence factors for transparency.
- Facility recommendations consider urgency, region, capability tags, and queue load to guide users toward an appropriate care option.
- Provider feedback can be recorded so clinicians can compare AI triage output with professional assessment.

### Public Health and Anonymization

- Public-health dashboards use aggregated triage signals to identify symptom clusters, regional trends, anomaly signals, and possible outbreak alerts.
- Before being used for population-level insights, records are minimized, aggregated, anonymized, or de-identified where possible so dashboards do not expose individual patients.
- Aggregated public-health indicators may be retained for community monitoring because they are no longer intended to identify a specific person.
- Public-health outputs are designed for surveillance and planning, not for exposing private patient histories.

### Professional Care Requirement

- Haliya is a decision-support and care-navigation tool, not a doctor, hospital, emergency service, diagnosis, prescription, or replacement for licensed clinical judgment.
- AI outputs may be incomplete or incorrect when symptoms are vague, information is missing, systems are unavailable, or a patient's condition changes.
- Users should seek professional medical care when symptoms persist, worsen, or include red flags.
- In a possible emergency, users should call local emergency services or go to the nearest emergency room immediately instead of waiting for Haliya, an appointment confirmation, or a facility response.
- Final clinical decisions must come from qualified healthcare professionals.

---

## Local Readiness

### Operational Health

- Health probe endpoint: `GET /api/health`
- Local validation pipeline: `npm run build` and `npm run lint`

### Local-Only Checklist

- [ ] Keep `.env` local and out of source control
- [ ] Run the backend and frontend through `npm run dev`
- [ ] Run database backup and restore drills
- [ ] Test critical local flows before demos
- [ ] Configure legal and compliance pages for local review copy

---

## Success Metrics

### Adoption

- Number of registered teachers
- Monthly active contributors to repository and forums

### Collaboration

- Growth in cross-school interactions
- Increase in mentorship requests and fulfilled collaborations

### Insights

- Number and quality of admin-generated reports
- Demonstrated impact of dashboard insights on STAR annual planning

---

## Delivery Phases

| Phase                         | Scope                                                                        | Status   |
| :---------------------------- | :--------------------------------------------------------------------------- | :------- |
| Phase 1 -- Health Triage      | AI symptom intake, urgency scoring, safety rules, evidence ledger, and care guidance | Complete |
| Phase 2 -- Patient and Provider Dashboards | Patient appointment booking, health summaries, provider queue review, and clinician feedback | Complete |
| Phase 3 -- Public Health Intelligence Board | Regional analytics, symptom trends, anomaly detection, and outbreak alert generation | Complete |

---

## Team

<div align="center">
  <table border="0" cellpadding="14" cellspacing="0" style="border-collapse: collapse;">
    <tr>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="frontend/public/img/jero.jpeg" alt="Rolan Jero R. Pinton" width="120" height="120" style="object-fit: cover;"><br>
        <strong>Rolan Jero R. Pinton</strong><br>
      </td>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="frontend/public/img/adriel.jpg" alt="Adriel M. Magalona" width="120" height="120" style="object-fit: cover;"><br>
        <strong>Adriel M. Magalona</strong><br>
      </td>
    </tr>
  </table>

  <table border="0" cellpadding="14" cellspacing="0" style="border-collapse: collapse; margin-top: 12px;">
    <tr>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="frontend/public/img/jordan.jpeg" alt="Jordan G. Faciol" width="120" height="120" style="object-fit: cover;"><br>
        <strong>Jordan G. Faciol</strong><br>
      </td>
      <td align="center" style="border: 1px solid #30363d; width: 220px;">
        <img src="frontend/public/img/aris.jpeg" alt="Aris Angelo Don Florentino" width="120" height="120" style="object-fit: cover;"><br>
        <strong>Aris Angelo Don Florentino</strong><br>
      </td>
    </tr>
  </table>
</div>
