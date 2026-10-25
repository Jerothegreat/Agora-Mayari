'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  Shield, 
  Activity, 
  Globe, 
  ChevronRight, 
  Stethoscope, 
  Building2, 
  Clock
} from 'lucide-react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LandingPage() {
  const { language } = useLanguage();
  const t = {
    English: {
      badge: 'Philippine AI Health Triage',
      heroTitleLine1: 'The future of',
      heroTitleHighlight: 'health triage',
      heroTitleLine3: 'is here.',
      heroDesc: 'Mayari is a real-time AI voice patient intake and booking agent for Philippine medical clinics. Sumasagot kung hindi kaya ng clinic mo.',
      ctaPrimary: 'Check My Symptoms',
      ctaSecondary: 'For Health Facilities',
      accuracyLabel: 'Evidence Ledger',
      statsReports: 'Symptom Reports',
      statsFacilities: 'Verified Facilities',
      statsAvgTime: 'Avg AI Triage Time',
      statsOutbreaks: 'Outbreaks Prevented',
      featuresTitle: 'How Mayari Works',
      featuresDesc: 'Streamlining the journey from first symptom to full recovery.',
      feature1Title: 'AI Triage',
      feature1Desc: 'Describe how you feel in English or Filipino. Our AI classifies urgency in seconds.',
      feature2Title: 'Instant Booking',
      feature2Desc: 'High-risk? Book an appointment immediately at the nearest verified facility.',
      feature3Title: 'Health Intelligence',
      feature3Desc: 'Contribute to regional trend tracking to help prevent outbreaks in your community.',
      footerTagline: 'Empowering Filipino health through artificial intelligence.',
      footerPlatform: 'Platform',
      footerCompany: 'Company',
    },
    Filipino: {
      badge: 'AI Health Triage para sa Pilipinas',
      heroTitleLine1: 'Ang kinabukasan ng',
      heroTitleHighlight: 'health triage',
      heroTitleLine3: 'ay nandito na.',
      heroDesc: 'Si Mayari ay isang real-time AI voice intake at booking agent para sa mga Philippine medical clinic. Sumasagot kung hindi kaya ng clinic mo.',
      ctaPrimary: 'Suriin ang Sintomas Ko',
      ctaSecondary: 'Para sa Mga Pasilidad',
      accuracyLabel: 'Evidence Ledger',
      statsReports: 'Mga Ulat ng Sintomas',
      statsFacilities: 'Na-verify na Pasilidad',
      statsAvgTime: 'Avg AI Triage Time',
      statsOutbreaks: 'Mga Outbreak na Naiwasan',
      featuresTitle: 'Paano Gumagana ang Mayari',
      featuresDesc: 'Mas mabilis ang journey mula unang sintomas hanggang paggaling.',
      feature1Title: 'AI Triage',
      feature1Desc: 'Ilarawan ang pakiramdam mo sa English o Filipino. Inia-assess ng AI ang urgency sa loob ng ilang segundo.',
      feature2Title: 'Mabilis na Booking',
      feature2Desc: 'Mataas ang risk? Mag-book agad sa pinakamalapit na verified facility.',
      feature3Title: 'Health Intelligence',
      feature3Desc: 'Tumulong sa pag-track ng regional trends para maiwasan ang outbreaks sa komunidad.',
      footerTagline: 'Pinapalakas ang kalusugan ng Pilipino gamit ang AI.',
      footerPlatform: 'Platform',
      footerCompany: 'Kumpanya',
    },
  }[language];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-teal-100/30 blur-[150px] rounded-full -z-10" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100/20 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
              <Shield size={14} />
              {t.badge}
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9]">
              {t.heroTitleLine1} <br />
              <span className="text-teal-600 font-black">{t.heroTitleHighlight}</span> <br />
              {t.heroTitleLine3}
            </h1>
            <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/triage" className="px-8 py-5 bg-teal-600 text-white rounded-2xl text-lg font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2 group">
                {t.ctaPrimary}
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/facility/register" className="px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                {t.ctaSecondary}
                <Building2 size={20} />
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="relative z-10 bg-white rounded-[2rem] p-4 shadow-2xl border border-slate-100 rotate-2">
              <picture>
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
                  alt="Health App Interface" 
                  className="rounded-2xl"
                  loading="lazy"
                  width={2070}
                  height={1380}
                />
              </picture>
            </div>
            <div className="absolute -bottom-10 -left-10 z-20 bg-teal-600 text-white p-6 rounded-3xl shadow-xl -rotate-3 space-y-2">
              <div className="flex items-center gap-3">
                <Activity size={24} />
                <span className="text-2xl font-bold">Audit</span>
              </div>
              <p className="text-xs font-medium opacity-80">{t.accuracyLabel}</p>
            </div>
            <div className="absolute -top-10 -right-10 z-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl" />
          </motion.div>
        </div>

        {/* Live Impact Stats */}
        <div className="max-w-7xl mx-auto mt-24">
          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/50 shadow-sm flex flex-wrap justify-center gap-12 md:gap-24">
            <div className="text-center">
              <p className="text-4xl font-black text-slate-900 tracking-tight">1.2k+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.statsReports}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-teal-600 tracking-tight">18</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.statsFacilities}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-slate-900 tracking-tight">4.2s</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.statsAvgTime}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-teal-600 tracking-tight">9</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.statsOutbreaks}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-black tracking-tight text-slate-900">{t.featuresTitle}</h2>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">{t.featuresDesc}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Stethoscope className="text-teal-600" size={32} />}
              title={t.feature1Title}
              description={t.feature1Desc}
            />
            <FeatureCard 
              icon={<Clock className="text-blue-600" size={32} />}
              title={t.feature2Title}
              description={t.feature2Desc}
            />
            <FeatureCard 
              icon={<Globe className="text-purple-600" size={32} />}
              title={t.feature3Title}
              description={t.feature3Desc}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <HeartPulse className="text-teal-600" size={32} />
              <span className="text-xl font-black tracking-tighter">MAYARI</span>
            </div>
            <p className="text-slate-500 max-w-xs font-medium italic">{t.footerTagline}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">{t.footerPlatform}</h4>
              <ul className="text-slate-500 space-y-2 text-sm font-medium">
                <li><Link href="/triage">Triage Checker</Link></li>
                <li><Link href="/public-health">Health Pulse</Link></li>
                <li><Link href="/facility/register">For Facilities</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900">{t.footerCompany}</h4>
              <ul className="text-slate-500 space-y-2 text-sm font-medium">
                <li><Link href="#">About Us</Link></li>
                <li><Link href="#">Contact</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400 font-medium">© 2026 Mayari Health.</p>
        </div>
      </footer>
    </main>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-8 rounded-[2rem] border border-slate-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-50 transition-all space-y-6">
      <div className="p-4 bg-slate-50 rounded-2xl w-fit">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
}
