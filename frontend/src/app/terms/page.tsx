'use client';

import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { motion, type Variants } from 'framer-motion';
import { AlertTriangle, ClipboardCheck, HeartPulse, Scale, ShieldCheck, Trash2 } from 'lucide-react';

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const terms = [
  {
    title: 'Decision Support, Not Diagnosis',
    tag: 'Clinical Boundary',
    icon: HeartPulse,
    accent: {
      border: 'border-teal-100/80',
      card: 'from-teal-50/90 via-white to-white hover:shadow-teal-100/80',
      icon: 'bg-teal-50 text-teal-700 ring-teal-100',
      tag: 'bg-teal-100 text-teal-700',
    },
    body: 'Mayari provides AI-assisted triage and care-navigation support. It is not a physician, hospital, emergency service, diagnosis, prescription, or substitute for professional medical judgment.',
  },
  {
    title: 'Emergency Use',
    tag: 'Urgent Notice',
    icon: AlertTriangle,
    accent: {
      border: 'border-amber-100/90',
      card: 'from-amber-50/90 via-white to-white hover:shadow-amber-100/90',
      icon: 'bg-amber-50 text-amber-700 ring-amber-100',
      tag: 'bg-amber-100 text-amber-700',
    },
    body: 'If you may be experiencing a medical emergency, call local emergency services or proceed to the nearest emergency room. Do not wait for Mayari, a facility response, or an appointment confirmation.',
  },
  {
    title: 'User Responsibilities',
    tag: 'Conduct',
    icon: ClipboardCheck,
    accent: {
      border: 'border-emerald-100/80',
      card: 'from-emerald-50/90 via-white to-white hover:shadow-emerald-100/80',
      icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      tag: 'bg-emerald-100 text-emerald-700',
    },
    body: 'You agree to provide accurate information, update material health or facility details, use the platform lawfully, protect account credentials, and avoid submitting misleading, abusive, or unauthorized information.',
  },
  {
    title: 'Institutional and Facility Use',
    tag: 'Facility Use',
    icon: ShieldCheck,
    accent: {
      border: 'border-indigo-100/80',
      card: 'from-indigo-50/90 via-white to-white hover:shadow-indigo-100/80',
      icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      tag: 'bg-indigo-100 text-indigo-700',
    },
    body: 'Facility and institutional users must access only records they are authorized to handle, use queue and triage data for legitimate care coordination, and comply with applicable privacy, medical, and professional obligations.',
  },
  {
    title: 'Data, Anonymization, and Account Deletion',
    tag: 'Data Terms',
    icon: Trash2,
    accent: {
      border: 'border-cyan-100/80',
      card: 'from-cyan-50/90 via-white to-white hover:shadow-cyan-100/80',
      icon: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
      tag: 'bg-cyan-100 text-cyan-700',
    },
    body: 'By using Mayari, you consent to processing needed to operate the service. Account-linked data may be deleted from profile settings. Aggregated or anonymized public-health indicators may remain because they no longer identify a person.',
  },
  {
    title: 'Service Changes and Limits',
    tag: 'Platform',
    icon: Scale,
    accent: {
      border: 'border-blue-100/80',
      card: 'from-blue-50/90 via-white to-white hover:shadow-blue-100/80',
      icon: 'bg-blue-50 text-blue-700 ring-blue-100',
      tag: 'bg-blue-100 text-blue-700',
    },
    body: 'Mayari may update models, workflows, policies, or features to improve safety and reliability. We aim for high availability, but the service may be unavailable during maintenance, connectivity issues, or third-party outages.',
  },
];

const conditions = [
  {
    tag: 'Clinical Caution',
    tagClass: 'bg-amber-100 text-amber-700',
    cardClass: 'border-amber-100 bg-amber-50/80',
    body: 'AI outputs may be incomplete or incorrect when information is missing, symptoms are ambiguous, systems are unavailable, or clinical circumstances change. Mayari includes safety rules and audit signals, but final clinical decisions belong to qualified professionals.',
  },
  {
    tag: 'Access Integrity',
    tagClass: 'bg-blue-100 text-blue-700',
    cardClass: 'border-blue-100 bg-blue-50/70',
    body: 'We may suspend access for misuse, unauthorized access attempts, privacy violations, abuse of facility queues, or behavior that could harm patients, facilities, or the integrity of public-health monitoring.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-blue-100/50">
          <div className="policy-pattern relative p-8 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-amber-400" />
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-display text-[11px] font-black uppercase tracking-normal text-blue-700">
                  <Scale size={14} />
                  Institutional Terms of Use
                </div>
                <h1 className="mt-5 font-display text-5xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">Terms and Conditions</h1>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-slate-700">
                  Official operating agreement for responsible AI triage, facility workflows, and public-health intelligence use.
                </p>
                <p className="mt-5 max-w-3xl text-base font-medium leading-relaxed text-slate-600">
                  These terms govern access to Mayari by patients, facility users, administrators, and public-health stakeholders. By registering, logging in, or using the platform, you agree to these terms and the Data Privacy Policy.
                </p>
              </div>
              <div className="space-y-4 lg:pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 shadow-sm">
                  <Scale size={14} />
                  v1.0 | Last updated May 7, 2026
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <p className="font-display text-[11px] font-black uppercase tracking-normal text-slate-500">Effective Date</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">May 7, 2026</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm dark:border-amber-500/30 dark:bg-slate-900/80">
                  <p className="font-display text-[11px] font-black uppercase tracking-normal text-amber-700">Important Notice</p>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                    Mayari supports care navigation and institutional monitoring, but it does not replace licensed clinical judgment or emergency services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="policy-pattern -mx-4 mt-10 rounded-[2rem] px-4 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {terms.map(({ title, tag, body, icon: Icon, accent }, index) => (
              <motion.article
                key={title}
                animate="visible"
                className={cn(
                  'group rounded-[1.75rem] border bg-gradient-to-br p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl',
                  'dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:shadow-black/20 dark:hover:shadow-black/30',
                  accent.border,
                  accent.card,
                )}
                custom={index}
                initial="hidden"
                variants={cardReveal}
                whileHover={{ y: -5 }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105', accent.icon)}>
                    <Icon size={22} />
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 font-display text-[11px] font-black uppercase tracking-normal', accent.tag)}>
                    {tag}
                  </span>
                </div>
                <h2 className="font-display text-xl font-black leading-snug tracking-normal text-slate-950">{title}</h2>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50 px-6 py-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:px-8">
            <p className="font-display text-[11px] font-black uppercase tracking-normal text-amber-700">Operational Notes</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-slate-950">Additional Conditions</h2>
          </div>
          <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-2">
            {conditions.map(({ tag, tagClass, cardClass, body }, index) => (
              <motion.div
                key={tag}
                animate="visible"
                className={cn('rounded-2xl border p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80', cardClass)}
                custom={index + terms.length}
                initial="hidden"
                variants={cardReveal}
                whileHover={{ y: -3 }}
              >
                <span className={cn('inline-flex rounded-full px-2.5 py-1 font-display text-[11px] font-black uppercase tracking-normal', tagClass)}>{tag}</span>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{body}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
