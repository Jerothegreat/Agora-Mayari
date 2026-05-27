'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RefreshCw, Search, Eye, Activity, Shield, Radio } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL, FeedbackMetrics, getFacilityProfile } from '@/lib/api';
import AppHeader from '@/components/AppHeader';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { mainNavItems } from '@/lib/navigation';
import Link from 'next/link';

type FacilityAppointment = {
  id: string;
  status: string;
  patient_name?: string;
  symptoms_summary?: string;
  triage_score?: number | null;
  triage_explanation?: string | null;
  appointment_date?: string | null;
  data?: {
    clinician_feedback?: ClinicianFeedback;
  };
};

type ClinicianFeedback = {
  ai_score: number;
  ai_urgency_level: string;
  clinician_score: number | null;
  clinician_urgency_level: string;
  agreement: boolean;
  correction_direction: 'ai_under_triaged' | 'ai_over_triaged' | 'aligned';
  notes?: string;
  reviewed_at: string;
};

export default function FacilityDashboard() {
  const { user, logout, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<FacilityAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'cancelled' | 'all'>('pending');
  const [viewAppt, setViewAppt] = useState<FacilityAppointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMetrics, setFeedbackMetrics] = useState<FeedbackMetrics | null>(null);
  const [queueError, setQueueError] = useState('');
  const [lastQueueSync, setLastQueueSync] = useState<Date | null>(null);
  const [clinicianLevel, setClinicianLevel] = useState('');
  const [clinicianScore, setClinicianScore] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const fetchData = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!user) return;
    if (!options.silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/appointments/my-appointments`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      if (!response.ok) throw new Error('Unable to load the live queue.');
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
      setQueueError('');
      setLastQueueSync(new Date());

      const metricsRes = await fetch(`${API_URL}/appointments/feedback/metrics`, { headers: { 'Authorization': `Bearer ${user.token}` } });
      if (metricsRes.ok) {
        setFeedbackMetrics(await metricsRes.json());
      }

      try {
        const profile = await getFacilityProfile(user.token);
        if (profile.name && profile.name !== user.name) {
          updateUser({ name: profile.name });
        }
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error(err);
      setQueueError(err instanceof Error ? err.message : 'Unable to load the live queue.');
    }
    finally {
      if (!options.silent) setLoading(false);
      setIsRefreshing(false);
    }
  }, [logout, updateUser, user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/status?status=${status}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${user?.token}` } });
      if (res.ok) fetchData({ silent: true });
    } catch (err) { console.error(err); }
  };

  const openAppointment = (appt: FacilityAppointment) => {
    const feedback = appt.data?.clinician_feedback;
    setViewAppt(appt);
    setClinicianLevel(feedback?.clinician_urgency_level || '');
    setClinicianScore(feedback?.clinician_score ? String(feedback.clinician_score) : '');
    setFeedbackNote(feedback?.notes || '');
  };

  const submitFeedback = async () => {
    if (!viewAppt || !clinicianLevel) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch(`${API_URL}/appointments/${viewAppt.id}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          clinician_urgency_level: clinicianLevel,
          clinician_score: clinicianScore ? Number(clinicianScore) : null,
          notes: feedbackNote,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setViewAppt((current) => current ? {
          ...current,
          data: {
            ...(current.data || {}),
            clinician_feedback: data.feedback,
          },
        } : current);
        await fetchData({ silent: true });
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmittingFeedback(false); }
  };

  useEffect(() => {
    if (!user) return;

    const initialLoad = window.setTimeout(() => {
      void fetchData();
    }, 0);
    const interval = window.setInterval(() => {
      void fetchData({ silent: true });
    }, 15000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [fetchData, user]);

  const filtered = appointments.filter(appt => {
    const matchTab = activeTab === 'all' || appt.status === activeTab;
    const matchSearch = !searchQuery || appt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || appt.symptoms_summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  }).sort((a, b) => (b.triage_score || 0) - (a.triage_score || 0));

  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const avgScore = appointments.length > 0 ? (appointments.reduce((sum, appointment) => sum + (appointment.triage_score || 0), 0) / appointments.length).toFixed(1) : '—';
  const lastSyncLabel = lastQueueSync
    ? new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(lastQueueSync)
    : 'Sync pending';

  if (loading && appointments.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-blue-600" size={40} /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
      <div className="mx-auto max-w-7xl p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-slate-500 font-medium">Healthcare Facility Dashboard • Central Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/facility/profile" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Edit Profile
            </Link>
            <button onClick={() => fetchData()} className="p-4 bg-white text-slate-400 rounded-2xl hover:text-blue-600 transition-all border border-slate-100 shadow-sm" title="Refresh queue">
              <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={18} />
            </button>
            <div className="bg-blue-600 px-5 py-3 rounded-2xl flex items-center gap-3 text-white font-bold shadow-xl shadow-blue-100 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <span className="flex items-center gap-2"><Radio size={16} />Live Queue</span>
              <span className="hidden text-xs font-semibold opacity-80 sm:inline">{lastSyncLabel}</span>
            </div>
          </div>
        </header>

        {queueError ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-700">
            {queueError} The last visible queue remains on screen while Haliya retries automatically.
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <DashboardMetricCard label="Total Queue" value={appointments.length} valueClassName="text-3xl" cardClassName="p-5" />
          <DashboardMetricCard label="Pending Review" value={pending} accentClassName="text-amber-500" valueClassName="text-3xl text-amber-600" cardClassName="p-5" />
          <DashboardMetricCard label="Confirmed" value={confirmed} accentClassName="text-emerald-500" valueClassName="text-3xl text-emerald-600" cardClassName="p-5" />
          <DashboardMetricCard label="Avg Risk" value={avgScore} suffix="/10" valueClassName="text-3xl" cardClassName="p-5" />
        </div>

        {/* Clinician Feedback Intelligence */}
        {feedbackMetrics && (
          <section className="mb-8 rounded-[2rem] border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Clinician Feedback Dashboard</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Live AI validation loop</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                  Provider corrections become an audit trail and confusion matrix, so Haliya can show measurable trust instead of just claiming accuracy.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-[9px] font-black uppercase text-indigo-400">Reviews</p>
                  <p className="mt-1 text-2xl font-black text-indigo-700">{feedbackMetrics.total_reviews}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-[9px] font-black uppercase text-emerald-500">Agreement</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{feedbackMetrics.agreement_rate}%</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-[9px] font-black uppercase text-amber-500">Caught</p>
                  <p className="mt-1 text-2xl font-black text-amber-700">{feedbackMetrics.corrections.ai_under_triaged}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="grid min-w-[560px] grid-cols-4 gap-2">
                {feedbackMetrics.confusion_matrix.filter(cell => cell.count > 0).length === 0 ? (
                  <div className="col-span-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
                    No reviewed triage cases yet. Open a patient and submit the clinical disposition to populate the matrix.
                  </div>
                ) : (
                  feedbackMetrics.confusion_matrix.filter(cell => cell.count > 0).map((cell) => (
                    <div key={`${cell.ai}-${cell.clinician}`} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">AI {cell.ai}</p>
                      <p className="mt-1 text-sm font-black text-slate-800">Clinician {cell.clinician}</p>
                      <p className="mt-1 text-2xl font-black text-indigo-600">{cell.count}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <DashboardTabs tabs={['pending', 'confirmed', 'cancelled', 'all'] as const} activeTab={activeTab} onChange={setActiveTab} activeClassName="text-blue-600" />
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search patient or symptom..." className="w-full sm:w-72 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-5">Patient</th>
                  <th className="px-6 py-5">Symptoms</th>
                  <th className="px-6 py-5">Risk</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No appointments found.</td></tr>
                ) : (
                  filtered.map(appt => (
                    <motion.tr key={appt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${getUrgencyBg(appt.triage_score)} ${getUrgencyText(appt.triage_score)}`}>{appt.patient_name?.[0] || '?'}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{appt.patient_name}</p>
                            <p className="text-[11px] text-slate-400 font-medium">ID: {appt.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 max-w-[200px]"><p className="text-slate-600 text-sm font-medium truncate">{appt.symptoms_summary || '—'}</p></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getUrgencyDot(appt.triage_score)}`} />
                          <span className={`text-sm font-black ${getUrgencyText(appt.triage_score)}`}>{appt.triage_score || '—'}/10</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">{getUrgencyLabel(appt.triage_score)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-800">{appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—'}</p>
                        <p className="text-[11px] text-slate-400 font-bold">{appt.appointment_date ? new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openAppointment(appt)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="View"><Eye size={16} /></button>
                          {appt.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(appt.id, 'confirmed')} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all" title="Confirm"><Check size={16} /></button>
                              <button onClick={() => updateStatus(appt.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Cancel"><X size={16} /></button>
                            </>
                          )}
                          {appt.status !== 'pending' && (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getStatusStyle(appt.status)}`}>{appt.status}</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === VIEW APPOINTMENT MODAL === */}
      <AnimatePresence>
        {viewAppt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setViewAppt(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900">Patient Details</h3>
                <button onClick={() => setViewAppt(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl ${getUrgencyBg(viewAppt.triage_score)} ${getUrgencyText(viewAppt.triage_score)}`}>{viewAppt.patient_name?.[0]}</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">{viewAppt.patient_name}</p>
                  <p className="text-xs text-slate-400 font-medium">ID: {viewAppt.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</p><p className="text-sm font-bold text-slate-800 mt-1">{viewAppt.appointment_date ? new Date(viewAppt.appointment_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending'}</p></div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p><p className={`text-sm font-bold mt-1 capitalize ${viewAppt.status === 'confirmed' ? 'text-emerald-600' : viewAppt.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'}`}>{viewAppt.status}</p></div>
              </div>

              {viewAppt.symptoms_summary && (
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Presenting Symptoms</p><p className="text-sm text-slate-700 mt-1 font-medium">{viewAppt.symptoms_summary}</p></div>
              )}

              {viewAppt.triage_score && (
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Risk Assessment</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-3 flex-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${viewAppt.triage_score && viewAppt.triage_score >= 8 ? 'bg-red-500' : viewAppt.triage_score && viewAppt.triage_score >= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(viewAppt.triage_score || 0) * 10}%` }} /></div>
                    <span className="text-lg font-black text-slate-800">{viewAppt.triage_score}/10</span>
                  </div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 mt-1">{getUrgencyLabel(viewAppt.triage_score)}</p>
                </div>
              )}

              {viewAppt.triage_explanation && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2"><Shield size={14} className="text-indigo-500" /><p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">AI Clinical Intelligence</p></div>
                  <p className="text-sm text-indigo-800 font-medium leading-relaxed">{viewAppt.triage_explanation}</p>
                </div>
              )}

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-teal-300" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-teal-300">Clinician Correction</p>
                </div>
                {viewAppt.data?.clinician_feedback && (
                  <div className={`mb-4 rounded-xl px-3 py-2 text-xs font-bold ${viewAppt.data.clinician_feedback.agreement ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>
                    Current review: {viewAppt.data.clinician_feedback.agreement ? 'Aligned with AI triage' : viewAppt.data.clinician_feedback.correction_direction === 'ai_under_triaged' ? 'Clinician marked higher urgency' : 'Clinician marked lower urgency'}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clinical disposition</label>
                    <select value={clinicianLevel} onChange={e => setClinicianLevel(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-teal-300">
                      <option className="text-slate-900" value="">Select disposition</option>
                      <option className="text-slate-900" value="self-care">Self-care</option>
                      <option className="text-slate-900" value="clinic">Clinic</option>
                      <option className="text-slate-900" value="er">ER / urgent care</option>
                      <option className="text-slate-900" value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clinician score</label>
                    <input value={clinicianScore} onChange={e => setClinicianScore(e.target.value)} type="number" min={1} max={10} placeholder="1-10" className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-teal-300" />
                  </div>
                </div>
                <textarea value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} placeholder="Optional note for audit trail..." className="mt-3 h-20 w-full resize-none rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-300" />
                <button onClick={submitFeedback} disabled={!clinicianLevel || isSubmittingFeedback} className="mt-3 w-full rounded-xl bg-teal-500 py-3 text-sm font-black text-white transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700">
                  {isSubmittingFeedback ? 'Saving review...' : 'Save Clinical Review'}
                </button>
              </div>

              {viewAppt.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { updateStatus(viewAppt.id, 'confirmed'); setViewAppt(null); }} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"><Check size={18} />Confirm</button>
                  <button onClick={() => { updateStatus(viewAppt.id, 'cancelled'); setViewAppt(null); }} className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"><X size={18} />Decline</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getUrgencyDot(score: number | null | undefined) {
  const s = score || 0;
  if (s >= 9) return 'bg-red-600 animate-pulse';
  if (s >= 7) return 'bg-orange-500';
  if (s >= 4) return 'bg-blue-500';
  return 'bg-teal-500';
}
function getUrgencyBg(score: number | null | undefined) {
  const s = score || 0;
  if (s >= 9) return 'bg-red-50';
  if (s >= 7) return 'bg-orange-50';
  if (s >= 4) return 'bg-blue-50';
  return 'bg-teal-50';
}
function getUrgencyText(score: number | null | undefined) {
  const s = score || 0;
  if (s >= 9) return 'text-red-600';
  if (s >= 7) return 'text-orange-600';
  if (s >= 4) return 'text-blue-600';
  return 'text-teal-600';
}
function getUrgencyLabel(score: number | null | undefined) {
  const s = score || 0;
  if (s >= 9) return 'CRITICAL / ER';
  if (s >= 7) return 'URGENT CARE';
  if (s >= 4) return 'CLINICAL';
  return 'ROUTINE';
}
function getStatusStyle(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-50 text-green-600';
    case 'cancelled': return 'bg-red-50 text-red-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}
