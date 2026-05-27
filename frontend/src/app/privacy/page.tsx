'use client';

import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { motion, type Variants } from 'framer-motion';
import { Database, FileText, LockKeyhole, ShieldCheck, Trash2, Users } from 'lucide-react';

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const policySections = [
  {
    title: 'Information We Collect',
    tag: 'Collection',
    icon: Database,
    accent: {
      border: 'border-teal-100/80',
      card: 'from-teal-50/90 via-white to-white hover:shadow-teal-100/80',
      icon: 'bg-teal-50 text-teal-700 ring-teal-100',
      tag: 'bg-teal-100 text-teal-700',
    },
    body: 'Haliya collects account information, patient or facility profile details, symptom assessments, appointment records, device/session identifiers, and technical security logs needed to operate the service. Health-related entries may be sensitive personal information under the Philippine Data Privacy Act of 2012.',
  },
  {
    title: 'How We Use Information',
    tag: 'Purpose',
    icon: FileText,
    accent: {
      border: 'border-blue-100/80',
      card: 'from-blue-50/90 via-white to-white hover:shadow-blue-100/80',
      icon: 'bg-blue-50 text-blue-700 ring-blue-100',
      tag: 'bg-blue-100 text-blue-700',
    },
    body: 'We use information to provide AI-assisted triage, appointment routing, patient and facility dashboards, safety auditing, fraud prevention, service reliability, and public-health intelligence. Haliya does not sell personal health information.',
  },
  {
    title: 'Anonymization and Public Health Use',
    tag: 'Population Data',
    icon: Users,
    accent: {
      border: 'border-emerald-100/80',
      card: 'from-emerald-50/90 via-white to-white hover:shadow-emerald-100/80',
      icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      tag: 'bg-emerald-100 text-emerald-700',
    },
    body: 'Before data is used for trend dashboards, outbreak signals, research summaries, or public-health reporting, Haliya minimizes and aggregates records and may anonymize or de-identify them so the output does not reasonably identify a patient. Aggregated statistics may be retained for institutional reporting and community health monitoring.',
  },
  {
    title: 'Security and Access Controls',
    tag: 'Safeguards',
    icon: LockKeyhole,
    accent: {
      border: 'border-indigo-100/80',
      card: 'from-indigo-50/90 via-white to-white hover:shadow-indigo-100/80',
      icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      tag: 'bg-indigo-100 text-indigo-700',
    },
    body: 'We apply role-based access controls, encrypted transport, authenticated sessions, audit-friendly clinical records, and operational safeguards. Facility users should only access cases assigned to their facility and must protect their credentials.',
  },
  {
    title: 'Your Rights and Choices',
    tag: 'Rights',
    icon: ShieldCheck,
    accent: {
      border: 'border-cyan-100/80',
      card: 'from-cyan-50/90 via-white to-white hover:shadow-cyan-100/80',
      icon: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
      tag: 'bg-cyan-100 text-cyan-700',
    },
    body: 'You may request access, correction, portability where technically feasible, objection to certain processing, withdrawal of consent where applicable, and deletion of account-linked personal data. Patients and facilities can initiate account deletion from their profile page.',
  },
  {
    title: 'Deletion Requests',
    tag: 'Notice',
    icon: Trash2,
    accent: {
      border: 'border-amber-100/90',
      card: 'from-amber-50/90 via-white to-white hover:shadow-amber-100/90',
      icon: 'bg-amber-50 text-amber-700 ring-amber-100',
      tag: 'bg-amber-100 text-amber-700',
    },
    body: 'When you delete your account, we remove your account profile, linked appointments, and device triage history when the session token is available. We may retain anonymized statistics, security logs, or records required by law, dispute resolution, audits, or public-interest health reporting.',
  },
];

const retentionRows = [
  {
    category: 'Identity',
    categoryClass: 'bg-teal-50 text-teal-700',
    record: 'Account and profile records',
    retention: 'For the life of the account, then deleted or anonymized after account deletion unless retention is legally required.',
  },
  {
    category: 'Care',
    categoryClass: 'bg-blue-50 text-blue-700',
    record: 'Appointments and facility queue records',
    retention: 'Retained while needed for care coordination, facility audit, dispute handling, or legal compliance; deleted with account-linked records when permitted.',
  },
  {
    category: 'Device',
    categoryClass: 'bg-indigo-50 text-indigo-700',
    record: 'Symptom triage history',
    retention: 'Stored by session token for continuity and trend summaries; users may delete it with their account or by clearing device history where available.',
  },
  {
    category: 'Public Health',
    categoryClass: 'bg-emerald-50 text-emerald-700',
    record: 'Aggregated public-health indicators',
    retention: 'Retained as anonymized or de-identified statistical records for longitudinal public-health intelligence.',
  },
  {
    category: 'Security',
    categoryClass: 'bg-amber-50 text-amber-700',
    record: 'Security and operational logs',
    retention: 'Normally retained for up to 12 months unless an incident, investigation, or legal obligation requires longer retention.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-xl shadow-teal-100/50">
          <div className="policy-pattern relative p-8 sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-amber-400" />
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 font-display text-[11px] font-black uppercase tracking-normal text-teal-700">
                  <ShieldCheck size={14} />
                  Institutional Privacy Notice
                </div>
                <h1 className="mt-5 font-display text-5xl font-black leading-tight tracking-normal text-slate-950 sm:text-6xl">Data Privacy Policy</h1>
                <p className="mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-slate-700">
                  Official governance reference for safe, privacy-first health intelligence across patient, facility, and public-health workflows.
                </p>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600">
                  Haliya is designed for patients, health facilities, and public-health teams in the Philippines. This policy explains how we collect, use, protect, anonymize, retain, and delete information handled through the platform.
                </p>
              </div>
              <div className="space-y-4 lg:pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 shadow-sm">
                  <ShieldCheck size={14} />
                  v1.0 | Last updated May 7, 2026
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <p className="font-display text-[11px] font-black uppercase tracking-normal text-slate-500">Effective Date</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">May 7, 2026</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm dark:border-amber-500/30 dark:bg-slate-900/80">
                  <p className="font-display text-[11px] font-black uppercase tracking-normal text-amber-700">Privacy Office</p>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                    Privacy requests may be sent to the Haliya privacy team through the official support channel provided by the institution operating this deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="policy-pattern -mx-4 mt-10 rounded-[2rem] px-4 py-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {policySections.map(({ title, tag, body, icon: Icon, accent }, index) => (
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
            <p className="font-display text-[11px] font-black uppercase tracking-normal text-amber-700">Retention Controls</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-normal text-slate-950">Retention Schedule</h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-[11px] font-black uppercase tracking-normal text-slate-400">
                  <th className="w-36 px-6 pb-3 pt-1 sm:px-8">Category</th>
                  <th className="px-4 pb-3 pt-1">Record Type</th>
                  <th className="px-6 pb-3 pt-1 sm:px-8">Retention Approach</th>
                </tr>
              </thead>
              <tbody>
                {retentionRows.map(({ category, categoryClass, record, retention }, index) => (
                  <tr key={record} className={cn('border-b border-slate-100 last:border-b-0', index % 2 === 0 ? 'bg-slate-50/70' : 'bg-white')}>
                    <td className="px-6 py-4 align-top sm:px-8">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-black', categoryClass)}>{category}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-black text-slate-800">{record}</td>
                    <td className="px-6 py-4 align-top font-medium leading-relaxed text-slate-600 sm:px-8">{retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
