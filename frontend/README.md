# Mayari Frontend

Next.js application for the Mayari AI voice patient intake and booking platform.

Mayari is a real-time AI voice patient intake and booking agent for Philippine medical clinics.
Sumasagot kung hindi kaya ng clinic mo.

## Quick Start

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── triage/            # AI symptom checker + voice intake
│   ├── dashboard/         # Patient & facility dashboards
│   ├── auth/              # Authentication pages
│   ├── public-health/     # Community health dashboard
│   ├── history/           # Patient history
│   └── layout.tsx         # Root layout with providers
│
├── components/            # Reusable React components
│   ├── AppHeader.tsx      # Main navigation header
│   ├── VoiceSession.tsx   # Agora voice intake widget
│   ├── SymptomForm.tsx    # Triage input form
│   ├── TriageResult.tsx   # AI assessment display
│   ├── LanguageToggle.tsx # EN/FIL switcher
│   └── dashboard/         # Dashboard-specific components
│
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # User authentication state
│   ├── LanguageContext.tsx # i18n language state
│   └── ThemeContext.tsx   # Dark/light theme state
│
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client functions
│   ├── navigation.ts     # Navigation configuration
│   └── utils.ts          # Helper functions
│
└── stores/
    └── voiceSessionStore.ts  # Zustand store for voice session state
```

## Key Features

### Voice Intake (Mayari)
- Real-time voice conversation via Agora Conversational AI
- Bilingual ASR: Filipino (`fil-PH`) and English
- Azure TTS with Philippine English voice (`en-PH-RosaNeural`)
- Live transcript display during session
- Post-session triage and automatic appointment booking

### Bilingual Support
- Full English and Filipino translations
- Persistent language preference (localStorage key: `mayari_language`)
- Seamless switching without page reload

### Authentication
- JWT-based auth with refresh tokens
- Protected routes with middleware
- Persistent sessions (localStorage key: `mayari_auth`)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS
- **State**: Zustand (voice session), React Context (auth, language, theme)
- **Voice**: Agora RTC SDK + Agora Conversational AI
- **Icons**: Lucide React
- **HTTP**: Native Fetch API

## Design System

### Colors
```css
Primary: Teal (#14b8a6)
Success: Emerald (#10b981)
Warning: Amber (#f59e0b)
Error: Red (#ef4444)
Info: Blue (#3b82f6)
```

### Typography
- **Font**: System sans-serif stack
- **Headings**: font-black (900 weight)
- **Body**: font-medium (500 weight)

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
```

## Pages Overview

### Public Pages
- `/` - Landing page with hero and features
- `/triage` - Voice intake + symptom checker
- `/public-health` - Community health dashboard
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/facility/register` - Facility registration

### Protected Pages (Patient)
- `/dashboard/patient` - Patient dashboard
- `/dashboard/patient/profile` - Edit patient profile
- `/history` - Symptom history

### Protected Pages (Facility)
- `/dashboard/facility` - Facility queue management
- `/dashboard/facility/profile` - Edit facility profile

## Local Build

The frontend runs locally with the backend at `http://localhost:3000/api`.

```bash
npm run build
npm start
```

## Debugging

```bash
npm run type-check
npm run lint
npm run build
```
