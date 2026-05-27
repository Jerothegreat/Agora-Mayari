# 🎨 Haliya Frontend

Modern, responsive Next.js application for the Haliya health triage platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── triage/            # AI symptom checker
│   ├── dashboard/         # Patient & facility dashboards
│   ├── auth/              # Authentication pages
│   ├── public-health/     # Community health dashboard
│   ├── history/           # Patient history
│   └── layout.tsx         # Root layout with providers
│
├── components/            # Reusable React components
│   ├── AppHeader.tsx      # Main navigation header
│   ├── SymptomForm.tsx    # Triage input form
│   ├── TriageResult.tsx   # AI assessment display
│   ├── LanguageToggle.tsx # EN/FIL switcher
│   └── dashboard/         # Dashboard-specific components
│
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # User authentication state
│   └── LanguageContext.tsx # i18n language state
│
├── lib/                   # Utilities and helpers
│   ├── api.ts            # API client functions
│   ├── navigation.ts     # Navigation configuration
│   └── utils.ts          # Helper functions
│
└── styles/
    └── globals.css       # Global styles and Tailwind imports
```

## 🎯 Key Features

### Bilingual Support
- Full English and Filipino translations
- Persistent language preference (localStorage)
- Seamless switching without page reload

### Authentication
- JWT-based auth with refresh tokens
- Protected routes with middleware
- Persistent sessions

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions

### Performance
- Code splitting with Next.js App Router
- Lazy loading for images and components
- Optimized bundle size
- Server-side rendering for SEO

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11.x
- **Icons**: Lucide React
- **HTTP**: Native Fetch API
- **State**: React Context API

## 🎨 Design System

### Colors
```css
Primary: Teal (#14b8a6)
Success: Emerald (#10b981)
Warning: Amber (#f59e0b)
Error: Red (#ef4444)
Info: Blue (#3b82f6)
```

### Typography
- **Font**: Geist Sans (Variable)
- **Headings**: font-black (900 weight)
- **Body**: font-medium (500 weight)
- **Small**: font-bold (700 weight)

### Spacing
- Base unit: 4px (0.25rem)
- Common: 4, 8, 12, 16, 20, 24, 32, 48, 64px

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Tailwind Config
Custom configuration in `tailwind.config.js`:
- Extended color palette
- Custom border radius
- Animation utilities

## 📱 Pages Overview

### Public Pages
- `/` - Landing page with hero and features
- `/triage` - Anonymous symptom checker
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

## 🎭 Components

### AppHeader
Main navigation with logo, links, language toggle, and auth buttons.

### SymptomForm
Multi-step form for symptom input with validation and bilingual support.

### TriageResult
Displays AI assessment with urgency level, recommendations, and booking CTA.

### LanguageToggle
Button to switch between English and Filipino with globe icon.

## 🌐 API Integration

All API calls are centralized in `src/lib/api.ts`:

```typescript
// Example usage
import { getTriage, getPatientProfile } from '@/lib/api';

const result = await getTriage({
  symptoms: 'fever, cough',
  duration: '3 days',
  severity: 'moderate',
  language: 'English'
});
```

## 🔐 Authentication Flow

1. User logs in → receives access + refresh tokens
2. Tokens stored in localStorage
3. Access token sent in Authorization header
4. On 401 error → attempt refresh
5. On refresh failure → redirect to login

## 🎨 Styling Guidelines

### Component Classes
```tsx
// Card
className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"

// Button Primary
className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700"

// Button Secondary
className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold"

// Input
className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
```

## 🚀 Deployment

### Vercel
- Set the project Root Directory to `frontend`
- Add `NEXT_PUBLIC_API_URL=https://your-backend-project.vercel.app/api`

### Manual Build
```bash
npm run build
npm start
```

## 📊 Performance Tips

1. Prefer optimized image delivery where practical
2. Lazy load heavy components with `dynamic()`
3. Minimize client-side JavaScript
4. Use server components where possible
5. Optimize fonts with `next/font`

## 🐛 Debugging

```bash
# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint

# Build to catch production issues
npm run build
```

## 📝 Code Style

- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting

## 🎯 Best Practices

1. **Component Organization**: One component per file
2. **Type Safety**: Define interfaces for all props
3. **Error Handling**: Use try-catch with user-friendly messages
4. **Loading States**: Show spinners during async operations
5. **Accessibility**: Use semantic HTML and ARIA labels

---

Built with ❤️ for CODEKADA Hackathon 2026
