'use client';

import { useState } from 'react';
import SymptomForm from '@/components/SymptomForm';
import TriageResult from '@/components/TriageResult';
import VoiceSession from '@/components/VoiceSession';
import { getTriage, TriageRequest, TriageResponse } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Shield, Activity, Globe, Mic, FileText, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type TriageMode = 'voice' | 'text' | null;

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
  const [mode, setMode] = useState<TriageMode>(null);
  const { language } = useLanguage();
  const [durationDays, setDurationDays] = useState<number | null>(null);

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
    setMode(null);
  };

  const handleBack = () => {
    setMode(null);
    setError(null);
  };

  const t = {
    English: {
      heroTitle: "Your first screen for",
      heroHighlight: "better healthcare.",
      heroDesc: "Mayari uses advanced AI to assess your symptoms and guide you to the right level of care—instantly and anonymously.",
      chooseLabel: "How would you like to start?",
      voiceTitle: "Speak Your Symptoms",
      voiceDesc: "Talk to Mayari's AI voice agent. Ideal when typing is slow or difficult — just speak naturally.",
      voiceTag: "Hands-free",
      textTitle: "Type Your Symptoms",
      textDesc: "Fill in a quick symptom form and get an instant AI-powered triage assessment.",
      textTag: "Quick form",
      back: "Choose another method",
    },
    Filipino: {
      heroTitle: "Ang iyong unang hakbang para sa",
      heroHighlight: "mas mabuting kalusugan.",
      heroDesc: "Ginagamit ng Mayari ang advanced AI para suriin ang iyong mga sintomas at gabayan ka sa tamang antas ng pangangalaga—agad-agad at anonimo.",
      chooseLabel: "Paano mo gustong magsimula?",
      voiceTitle: "Magsalita ng Sintomas",
      voiceDesc: "Makipag-usap sa AI voice agent ni Mayari. Perpekto kapag mahirap mag-type — magsalita lang nang natural.",
      voiceTag: "Hands-free",
      textTitle: "I-type ang Sintomas",
      textDesc: "Punan ang mabilis na symptom form at makakuha ng instant AI triage assessment.",
      textTag: "Mabilis na form",
      back: "Pumili ng ibang paraan",
    }
  }[language];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />

      <AnimatePresence>
        {!result && (
          <motion.section
            key="hero"
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

      <section className="px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal-200/20 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 font-medium">
              <Shield className="shrink-0" size={18} />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {result ? (
              <TriageResult
                key="result"
                result={result}
                onReset={handleReset}
                durationDays={durationDays}
              />
            ) : mode === null ? (
              /* ── Mode Selector ── */
              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <p className="text-center text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
                  {t.chooseLabel}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Voice card */}
                  <button
                    type="button"
                    onClick={() => setMode('voice')}
                    className="group relative text-left rounded-[2rem] overflow-hidden border border-emerald-200/40 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-900 p-8 text-white shadow-2xl shadow-teal-950/20 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-emerald-400/15 p-3.5 text-emerald-300 group-hover:bg-emerald-400/25 transition-colors">
                          <Mic size={26} />
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-100">
                          {t.voiceTag}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">{t.voiceTitle}</h2>
                        <p className="text-sm leading-6 text-emerald-50/75">{t.voiceDesc}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-300 group-hover:gap-3 transition-all">
                        Start talking →
                      </span>
                    </div>
                  </button>

                  {/* Text card */}
                  <button
                    type="button"
                    onClick={() => setMode('text')}
                    className="group relative text-left rounded-[2rem] overflow-hidden border border-slate-200 bg-white p-8 text-slate-900 shadow-xl shadow-slate-100/60 transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-teal-50 p-3.5 text-teal-600 group-hover:bg-teal-100 transition-colors">
                          <FileText size={26} />
                        </div>
                        <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">
                          {t.textTag}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">{t.textTitle}</h2>
                        <p className="text-sm leading-6 text-slate-500">{t.textDesc}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-black text-teal-600 group-hover:gap-3 transition-all">
                        Open form →
                      </span>
                    </div>
                    <span className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-teal-50 group-hover:bg-teal-100 transition-colors" />
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Active mode ── */
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft size={16} />
                  {t.back}
                </button>

                {mode === 'voice' ? (
                  <VoiceSession />
                ) : (
                  <SymptomForm isLoading={isLoading} onSubmit={handleTriageSubmit} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

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
