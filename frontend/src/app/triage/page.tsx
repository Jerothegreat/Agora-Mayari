'use client';

import { useState } from 'react';
import SymptomForm from '@/components/SymptomForm';
import TriageResult from '@/components/TriageResult';
import VoiceSession from '@/components/VoiceSession';
import { getTriage, TriageRequest, TriageResponse } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Shield, Activity, Globe } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import VoiceTriagePanel from '@/components/VoiceTriagePanel';

const parseDurationToDays = (input?: string): number | null => {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value < 0) return null;

  let days = value;
  if (normalized.includes('week')) {
    days = value * 7;
  } else if (normalized.includes('month')) {
    days = value * 30;
  } else if (normalized.includes('year')) {
    days = value * 365;
  } else if (normalized.includes('hour') || normalized.includes('hr')) {
    days = value / 24;
  }

  return Math.max(0, Math.round(days));
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const [durationDays, setDurationDays] = useState<number | null>(null);

  // Get or create session token
  const getSessionToken = () => {
    if (typeof window === 'undefined') return '';
    let token = localStorage.getItem('mayari_session_token');
    if (!token) {
      token = uuidv4();
      localStorage.setItem('mayari_session_token', token);
    }
    return token;
  };

  const handleTriageSubmit = async (data: TriageRequest) => {
    setIsLoading(true);
    setError(null);
    setDurationDays(parseDurationToDays(data.duration));
    try {
      const token = getSessionToken();
      const triageResult = await getTriage({ 
        ...data, 
        session_token: token,
        language: language
      });
      setResult(triageResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setDurationDays(null);
  };

  const t = {
    English: {
      title: "MAYARI",
      checker: "Checker",
      dashboard: "Health Dashboard",
      history: "History",
      signIn: "Sign In",
      heroTitle: "Your first screen for",
      heroHighlight: "better healthcare.",
      heroDesc: "Mayari uses advanced AI to assess your symptoms and guide you to the right level of care—instantly and anonymously.",
      privacyTitle: "Privacy First",
      realtime: "Real-time Analysis",
      community: "Community Health"
    },
    Filipino: {
      title: "MAYARI",
      checker: "Suriin",
      dashboard: "Dashboard ng Kalusugan",
      history: "Kasaysayan",
      signIn: "Mag-login",
      heroTitle: "Ang iyong unang hakbang para sa",
      heroHighlight: "mas mabuting kalusugan.",
      heroDesc: "Ginagamit ng Mayari ang advanced AI para suriin ang iyong mga sintomas at gabayan ka sa tamang antas ng pangangalaga—agad-agad at anonimo.",
      privacyTitle: "Protektado ang Datos",
      realtime: "Mabilis na Pagsusuri",
      community: "Kalusugan ng Bayan"
    }
  }[language];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />

      {/* Hero Section (Only show when no result) */}
      <AnimatePresence>
        {!result && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-16 pb-12 px-6"
          >
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
                <Shield size={14} />
                Intelligent Pre-Hospital Triage
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]">
                {t.heroTitle} <br />
                <span className="text-teal-600">{t.heroHighlight}</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                {t.heroDesc}
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <section className="px-6 py-12 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-200/20 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 font-medium">
              <Shield className="shrink-0" />
              {error}
            </div>
          )}

          {!result && <VoiceTriagePanel />}

          <AnimatePresence mode="wait">
            {!result ? (
              <div key="form" className="space-y-8">
                <VoiceSession />
                <SymptomForm 
                  isLoading={isLoading} 
                  onSubmit={handleTriageSubmit} 
                />
              </div>
            ) : (
              <TriageResult 
                key="result"
                result={result} 
                onReset={handleReset} 
                durationDays={durationDays}
              />
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Row */}
      {!result && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-2xl">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold">Real-time Analysis</h3>
                <p className="text-slate-500 leading-relaxed">
                  Get instant feedback on symptom severity using Groq&apos;s high-speed AI processing.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 text-purple-600 w-fit rounded-2xl">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold">Privacy First</h3>
                <p className="text-slate-500 leading-relaxed">
                  Your assessments are anonymous. We only track regional trends to protect communities.
                </p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 text-teal-600 w-fit rounded-2xl">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-bold">Community Health</h3>
                <p className="text-slate-500 leading-relaxed">
                  By using Mayari, you contribute to early outbreak detection in your region.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <HeartPulse size={20} />
            <span className="font-bold tracking-tighter">MAYARI</span>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            © 2026 Mayari Health.
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <Link href="/privacy" className="hover:text-teal-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-teal-600 transition-colors">Terms</Link>
            <a href="#" className="hover:text-teal-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
