'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, RefreshCw,
  Building2, X, ArrowRight, Loader2, Eye, Ban,
  AlertCircle, Stethoscope, Clock3, ShieldAlert, UserRound, ClipboardList, HeartPulse, Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { API_URL, getHealthSummary, getTriage, HealthSummary, type TriageResponse, getPatientProfile } from '@/lib/api';
import { Brain } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import DashboardMetricCard from '@/components/dashboard/DashboardMetricCard';
import DashboardTabs from '@/components/dashboard/DashboardTabs';
import { mainNavItems } from '@/lib/navigation';
import Link from 'next/link';

type Appointment = {
  id: string;
  status: string;
  facility_name: string;
  appointment_date?: string | null;
  appointment_time?: string | null;
  appointment_type?: string | null;
  doctor_name?: string | null;
  specialty?: string | null;
  notes?: string | null;
  symptoms_summary?: string;
  triage_score?: number | null;
  triage_explanation?: string | null;
  data?: Record<string, unknown>;
};

type FacilityOption = {
  id: string;
  name: string;
  location: string;
  type?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  specialties?: string[] | null;
  services?: string[] | null;
  is_verified?: boolean | null;
};

type VisitType = 'first_consult' | 'follow_up' | 'diagnostic' | 'vaccination' | 'clearance' | 'urgent_walk_in';
type ConsultationMode = 'in_person' | 'teleconsult';

const visitTypeOptions: Array<{ value: VisitType; label: string }> = [
  { value: 'first_consult', label: 'First consultation' },
  { value: 'follow_up', label: 'Follow-up visit' },
  { value: 'diagnostic', label: 'Lab or diagnostic request' },
  { value: 'vaccination', label: 'Vaccination or preventive care' },
  { value: 'clearance', label: 'Medical certificate or clearance' },
  { value: 'urgent_walk_in', label: 'Urgent same-day concern' },
];

const consultationModeOptions: Array<{ value: ConsultationMode; label: string }> = [
  { value: 'in_person', label: 'In-person' },
  { value: 'teleconsult', label: 'Teleconsult' },
];

const sexOptions = ['', 'male', 'female', 'other'];

function PatientDashboardContent() {
  const { user, logout, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [viewAppt, setViewAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  
  // Booking Form State
  const [selectedFacility, setSelectedFacility] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('first_consult');
  const [consultationMode, setConsultationMode] = useState<ConsultationMode>('in_person');
  const [specialty, setSpecialty] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [duration, setDuration] = useState('');
  const [conditions, setConditions] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [contactPreference, setContactPreference] = useState('sms');
  const [triageScore, setTriageScore] = useState<number | null>(null);
  const [triageExplanation, setTriageExplanation] = useState('');
  const [triageSummary, setTriageSummary] = useState('');
  const [latestAssessment, setLatestAssessment] = useState<TriageResponse | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const selectedFacilityDetails = facilities.find((facility) => facility.id === selectedFacility) || null;

  useEffect(() => {
    if (searchParams.get('book') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBooking(true);
      const s = searchParams.get('symptoms');
      const sc = searchParams.get('score');
      const ex = searchParams.get('explanation');
      const recommendedFacilityId = searchParams.get('facility_id');
      if (s) setSymptoms(s);
      if (sc) setTriageScore(parseInt(sc));
      if (ex) {
        setTriageExplanation(ex);
        setTriageSummary(ex);
      }
      if (recommendedFacilityId) setSelectedFacility(recommendedFacilityId);
    }
  }, [searchParams]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [apptRes, facRes] = await Promise.all([
        fetch(`${API_URL}/appointments/my-appointments`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
        fetch(`${API_URL}/appointments/facilities`, { headers: { 'Authorization': `Bearer ${user.token}` } })
      ]);
      if (apptRes.status === 401 || facRes.status === 401) { logout(); return; }
      const appts = await apptRes.json();
      const facs = await facRes.json();
      setAppointments(Array.isArray(appts) ? appts : []);
      setFacilities(Array.isArray(facs) ? facs : []);

      try {
        const profile = await getPatientProfile(user.token);
        if (profile.full_name && profile.full_name !== user.name) {
          updateUser({ name: profile.full_name });
        }
      } catch (err) {
        console.error(err);
      }
      // Fetch AI health summary
      const sessionToken = localStorage.getItem('mayari_session_token');
      if (sessionToken) {
        try { const hs = await getHealthSummary(sessionToken); setHealthSummary(hs); } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [user]);

  const resetBookingForm = () => {
    setShowBooking(false);
    setSelectedFacility('');
    setApptDate('');
    setSymptoms('');
    setVisitType('first_consult');
    setConsultationMode('in_person');
    setSpecialty('');
    setDoctorName('');
    setAge('');
    setSex('');
    setDuration('');
    setConditions('');
    setMedications('');
    setNotes('');
    setContactPreference('sms');
    setTriageScore(null);
    setTriageExplanation('');
    setTriageSummary('');
    setLatestAssessment(null);
    setBookingError('');
    const scoreParam = searchParams.get('score');
    const explanationParam = searchParams.get('explanation');
    const symptomsParam = searchParams.get('symptoms');
    const facilityParam = searchParams.get('facility_id');
    if (symptomsParam) setSymptoms(symptomsParam);
    if (scoreParam) setTriageScore(parseInt(scoreParam));
    if (explanationParam) {
      setTriageExplanation(explanationParam);
      setTriageSummary(explanationParam);
    }
    if (facilityParam) setSelectedFacility(facilityParam);
  };

  const buildAssessmentPayload = () => {
    const parsedAge = age ? Number(age) : undefined;
    const conditionList = conditions
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const symptomNarrative = [
      `Visit type: ${visitTypeOptions.find((option) => option.value === visitType)?.label || visitType}.`,
      specialty ? `Preferred specialty: ${specialty}.` : null,
      `Consultation mode: ${consultationMode === 'teleconsult' ? 'Teleconsultation requested' : 'In-person visit requested'}.`,
      symptoms ? `Main concern: ${symptoms}.` : null,
      medications ? `Current medications: ${medications}.` : null,
      notes ? `Additional context: ${notes}.` : null,
    ].filter(Boolean).join(' ');

    return {
      parsedAge,
      conditionList,
      symptomNarrative,
      region: selectedFacilityDetails?.province || selectedFacilityDetails?.city || selectedFacilityDetails?.location || 'Metro Manila',
    };
  };

  const runAssessment = async () => {
    if (!symptoms.trim()) {
      setBookingError('Please describe the patient concern so we can assess urgency accurately.');
      return null;
    }

    const { parsedAge, conditionList, symptomNarrative, region } = buildAssessmentPayload();
    if (age && (parsedAge === undefined || !Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 120 || !Number.isInteger(parsedAge))) {
      setBookingError('Age must be a whole number between 0 and 120.');
      return null;
    }

    setBookingError('');
    setIsAssessing(true);
    try {
      const assessment = await getTriage({
        symptoms: symptomNarrative,
        age: parsedAge,
        sex: sex || undefined,
        duration: duration || undefined,
        conditions: conditionList,
        region,
      });
      setLatestAssessment(assessment);
      setTriageScore(assessment.urgency_score);
      setTriageExplanation(assessment.explanation);
      setTriageSummary(assessment.summary);
      return assessment;
    } catch (error) {
      console.error(error);
      setBookingError(error instanceof Error ? error.message : 'Unable to generate the triage assessment right now.');
      return null;
    } finally {
      setIsAssessing(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !apptDate) {
      setBookingError('Facility and appointment time are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const assessment = await runAssessment();
      if (!assessment) return;

      const [appointmentDateOnly, appointmentTimeOnly] = apptDate.includes('T') ? apptDate.split('T') : [apptDate, null];
      const { conditionList, symptomNarrative } = buildAssessmentPayload();
      const res = await fetch(`${API_URL}/appointments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({
          facility_id: selectedFacility,
          appointment_date: appointmentDateOnly,
          appointment_time: appointmentTimeOnly ? `${appointmentTimeOnly}:00` : null,
          appointment_type: visitType,
          specialty: specialty || null,
          doctor_name: doctorName || null,
          notes: notes || null,
          symptoms_summary: symptomNarrative,
          triage_score: assessment.urgency_score,
          triage_explanation: assessment.explanation,
          data: {
            consultation_mode: consultationMode,
            contact_preference: contactPreference,
            patient_intake: {
              age: age ? Number(age) : null,
              sex: sex || null,
              duration: duration || null,
              conditions: conditionList,
              medications: medications
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
              notes: notes || null,
            },
            triage_snapshot: {
              urgency_level: assessment.urgency_level,
              classification: assessment.classification || null,
              summary: assessment.summary,
              confidence_level: assessment.confidence_level ?? null,
              red_flags: assessment.red_flags || [],
              next_steps: assessment.next_steps || [],
            },
            routing_recommendation: {
              source: 'mayari_facility_load_balancer',
              preselected_facility_name: searchParams.get('facility_name') || null,
            },
          },
        }),
      });
      if (res.ok) {
        resetBookingForm();
        fetchData();
      } else {
        const error = await res.json().catch(() => null) as { message?: string } | null;
        setBookingError(error?.message || 'Failed to create appointment.');
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!cancelAppt) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/appointments/${cancelAppt.id}/status?status=cancelled`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      if (res.ok) { setCancelAppt(null); setCancelReason(''); fetchData(); }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const filtered = appointments.filter(a => activeTab === 'all' || a.status === activeTab);
  const pending = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;

  if (loading && appointments.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-teal-600" size={40} /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
      <div className="mx-auto max-w-7xl p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hello, {user?.name}</h1>
            <p className="text-slate-500 font-medium">Manage your healthcare journey and appointments.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Link href="/dashboard/patient/profile" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Edit Profile
            </Link>
            <button onClick={() => setShowBooking(true)} className="flex items-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100">
              <Plus size={20} />Book New Appointment
            </button>
          </div>
        </header>

        {/* AI Health Summary */}
        {healthSummary && healthSummary.report_count > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 mb-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shrink-0"><Brain size={24} /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">AI Health Intelligence</p>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${healthSummary.trend === 'improving' ? 'bg-emerald-100 text-emerald-700' : healthSummary.trend === 'worsening' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                  {healthSummary.trend === 'improving' ? '↑ Improving' : healthSummary.trend === 'worsening' ? '↓ Worsening' : '→ Stable'}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${healthSummary.risk_level === 'high' ? 'bg-red-100 text-red-700' : healthSummary.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {healthSummary.risk_level} risk
                </span>
              </div>
              <p className="text-indigo-900 font-semibold leading-relaxed text-sm">{healthSummary.summary}</p>
              <p className="text-indigo-400 text-[11px] font-medium mt-2">Based on {healthSummary.report_count} assessment{healthSummary.report_count !== 1 ? 's' : ''}{healthSummary.top_symptom ? ` • Top concern: ${healthSummary.top_symptom}` : ''}</p>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <DashboardMetricCard label="Total" value={appointments.length} />
          <DashboardMetricCard label="Pending" value={pending} accentClassName="text-amber-500" valueClassName="text-2xl text-amber-600" />
          <DashboardMetricCard label="Confirmed" value={confirmed} accentClassName="text-emerald-500" valueClassName="text-2xl text-emerald-600" />
          <DashboardMetricCard label="Facilities" value={facilities.length} />
        </div>

        {/* Tabs */}
        <DashboardTabs tabs={['all', 'pending', 'confirmed', 'cancelled'] as const} activeTab={activeTab} onChange={setActiveTab} activeClassName="text-teal-600" className="mb-6" />

        {/* Appointments Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No {activeTab === 'all' ? '' : activeTab} appointments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(appt => (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Building2 size={22} /></div>
                  <div className="flex items-center gap-2">
                    {appt.triage_score && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${appt.triage_score >= 8 ? 'bg-red-100 text-red-700' : appt.triage_score >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{appt.triage_score}/10</span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(appt.status)}`}>{appt.status}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{appt.facility_name}</h3>
                  {appt.symptoms_summary && <p className="text-slate-500 text-sm font-medium mt-1 line-clamp-2">{appt.symptoms_summary}</p>}
                </div>
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-bold text-slate-600">
                    <Calendar size={14} className="text-teal-500" />
                    {appt.appointment_date ? new Date(appt.appointment_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date pending'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewAppt(appt)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-all" title="View Details"><Eye size={16} /></button>
                    {appt.status === 'pending' && (
                      <button onClick={() => setCancelAppt(appt)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all" title="Cancel"><Ban size={16} /></button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* === VIEW APPOINTMENT MODAL === */}
      <AnimatePresence>
        {viewAppt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setViewAppt(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900">Appointment Details</h3>
                <button onClick={() => setViewAppt(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                  <Building2 className="text-blue-600" size={24} />
                  <div><p className="font-bold text-slate-800">{viewAppt.facility_name}</p><p className="text-xs text-slate-500">Healthcare Facility</p></div>
                </div>
                {(viewAppt.appointment_type || viewAppt.specialty) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visit Type</p><p className="text-sm font-bold text-slate-800 mt-1 capitalize">{formatVisitType(viewAppt.appointment_type)}</p></div>
                    <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Specialty</p><p className="text-sm font-bold text-slate-800 mt-1">{viewAppt.specialty || 'General medicine'}</p></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</p><p className="text-sm font-bold text-slate-800 mt-1">{viewAppt.appointment_date ? new Date(viewAppt.appointment_date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending'}</p></div>
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Time</p><p className="text-sm font-bold text-slate-800 mt-1">{formatAppointmentTime(viewAppt.appointment_time)}</p></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p><p className={`text-sm font-bold mt-1 capitalize ${viewAppt.status === 'confirmed' ? 'text-emerald-600' : viewAppt.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'}`}>{viewAppt.status}</p></div>
                {viewAppt.doctor_name && (
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Requested Clinician</p><p className="text-sm text-slate-700 mt-1 font-medium">{viewAppt.doctor_name}</p></div>
                )}
                {viewAppt.symptoms_summary && (
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Symptoms</p><p className="text-sm text-slate-700 mt-1 font-medium">{viewAppt.symptoms_summary}</p></div>
                )}
                {viewAppt.notes && (
                  <div className="p-4 bg-slate-50 rounded-2xl"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Booking Notes</p><p className="text-sm text-slate-700 mt-1 font-medium">{viewAppt.notes}</p></div>
                )}
                {viewAppt.triage_score && (
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Risk Score</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${viewAppt.triage_score >= 8 ? 'bg-red-500' : viewAppt.triage_score >= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${viewAppt.triage_score * 10}%` }} /></div>
                      <span className="text-sm font-black text-slate-800">{viewAppt.triage_score}/10</span>
                    </div>
                  </div>
                )}
                {viewAppt.triage_explanation && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">AI Clinical Assessment</p><p className="text-sm text-indigo-800 mt-1 font-medium leading-relaxed">{viewAppt.triage_explanation}</p></div>
                )}
              </div>
              {viewAppt.status === 'pending' && (
                <button onClick={() => { setViewAppt(null); setCancelAppt(viewAppt); }} className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all">Cancel This Appointment</button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === CANCEL MODAL === */}
      <AnimatePresence>
        {cancelAppt && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><AlertCircle size={24} /></div>
                <div><h3 className="text-xl font-black text-slate-900">Cancel Appointment</h3><p className="text-sm text-slate-500">{cancelAppt.facility_name}</p></div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Why are you cancelling?</label>
                <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-400 outline-none font-medium text-sm">
                  <option value="">Select a reason</option>
                  <option value="schedule_conflict">Schedule conflict</option>
                  <option value="feeling_better">Feeling better</option>
                  <option value="found_another">Found another facility</option>
                  <option value="financial">Financial reasons</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setCancelAppt(null); setCancelReason(''); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Go Back</button>
                <button onClick={handleCancel} disabled={isSubmitting} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all disabled:bg-red-300 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Confirm Cancel</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === BOOKING MODAL === */}
      <AnimatePresence>
        {showBooking && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-hidden">
              <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Book Appointment</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Complete a fuller intake so the clinical routing and urgency score are based on real context.</p>
                </div>
                <button onClick={resetBookingForm} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <div className="modal-scroll max-h-[calc(92vh-10.5rem)] pr-2 md:pr-4 mt-6">
                <form onSubmit={handleBook} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-6">
                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-teal-600 p-3 text-white"><ClipboardList size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Visit Details</p>
                        <p className="text-xs font-medium text-slate-500">Start with schedule, visit type, and destination facility.</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Select Facility</label>
                        <select required value={selectedFacility} onChange={e => setSelectedFacility(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium">
                          <option value="">Choose a hospital or clinic</option>
                          {facilities.map(f => <option key={f.id} value={f.id}>{f.name} ({f.location})</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Date &amp; Time</label>
                        <input type="datetime-local" required value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Visit Type</label>
                        <select value={visitType} onChange={e => setVisitType(e.target.value as VisitType)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium">
                          {visitTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Consultation Mode</label>
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 border border-slate-200">
                          {consultationModeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setConsultationMode(option.value)}
                              className={`rounded-xl px-3 py-3 text-sm font-bold transition-all ${consultationMode === option.value ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Preferred Specialty</label>
                        <input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="General medicine, pediatrics, OB-GYN..." className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Requested Clinician</label>
                        <input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Optional doctor or team name" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-amber-500 p-3 text-white"><HeartPulse size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Clinical Intake</p>
                        <p className="text-xs font-medium text-slate-500">These details directly improve the urgency score and recommended care level.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Main Concern and Symptoms</label>
                      <textarea required value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Describe symptoms clearly: onset, severity, location of pain, fever, shortness of breath, vomiting, bleeding, etc." className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-32 resize-none" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                        <input type="number" min={0} max={120} step={1} value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 34" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Sex</label>
                        <select value={sex} onChange={e => setSex(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium">
                          {sexOptions.map((option) => <option key={option || 'blank'} value={option}>{option ? option.charAt(0).toUpperCase() + option.slice(1) : 'Select sex'}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Symptom Duration</label>
                        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 6 hours, 2 days" className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Pre-existing Conditions</label>
                        <textarea value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Asthma, diabetes, pregnancy, hypertension..." className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-24 resize-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Current Medications</label>
                        <textarea value={medications} onChange={e => setMedications(e.target.value)} placeholder="Paracetamol, insulin, inhaler, antibiotics..." className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-24 resize-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Extra Notes</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Recent travel, pregnancy, allergies, previous admission, mobility issues, preferred contact time..." className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium h-24 resize-none" />
                    </div>
                  </section>
                </div>

                <div className="space-y-6 pb-2">
                  <section className="rounded-[1.75rem] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-900 p-3 text-white"><Building2 size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Facility Summary</p>
                        <p className="text-xs font-medium text-slate-500">Confirm the fit before sending the request.</p>
                      </div>
                    </div>
                    {selectedFacilityDetails ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-lg font-black text-slate-900">{selectedFacilityDetails.name}</p>
                          <p className="text-sm font-medium text-slate-500">{selectedFacilityDetails.location}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedFacilityDetails.type && <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">{selectedFacilityDetails.type}</span>}
                          {selectedFacilityDetails.is_verified && <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">Verified</span>}
                        </div>
                        {selectedFacilityDetails.specialties && selectedFacilityDetails.specialties.length > 0 && (
                          <p className="text-xs font-medium text-slate-600">Specialties: {selectedFacilityDetails.specialties.slice(0, 4).join(', ')}</p>
                        )}
                        {selectedFacilityDetails.phone && (
                          <p className="flex items-center gap-2 text-xs font-medium text-slate-600"><Phone size={14} className="text-teal-600" />{selectedFacilityDetails.phone}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-slate-500">Choose a facility to see its profile before booking.</p>
                    )}
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-indigo-600 p-3 text-white"><Stethoscope size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">AI Triage Preview</p>
                        <p className="text-xs font-medium text-slate-500">Generated from the appointment intake before submission.</p>
                      </div>
                    </div>
                    {latestAssessment || triageScore || triageExplanation ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Urgency</p>
                              <p className="mt-1 text-base font-black text-slate-900">{latestAssessment?.classification || getUrgencyLabel(triageScore)}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${getUrgencyPillClass(triageScore)}`}>{triageScore || '--'}/10</span>
                          </div>
                          {(triageSummary || latestAssessment?.summary) && <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{latestAssessment?.summary || triageSummary}</p>}
                        </div>
                        {latestAssessment?.red_flags && latestAssessment.red_flags.length > 0 && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-700"><ShieldAlert size={14} />Watch for these red flags</p>
                            <ul className="mt-2 space-y-2 text-sm font-medium text-amber-900">
                              {latestAssessment.red_flags.slice(0, 3).map((flag) => <li key={flag}>{flag}</li>)}
                            </ul>
                          </div>
                        )}
                        {(latestAssessment?.explanation || triageExplanation) && <p className="text-sm font-medium leading-relaxed text-slate-600">{latestAssessment?.explanation || triageExplanation}</p>}
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed text-slate-500">Fill in the intake details and submit the request. We will recalculate the triage score right before the booking is created.</p>
                    )}
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-rose-500 p-3 text-white"><UserRound size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Booking Preferences</p>
                        <p className="text-xs font-medium text-slate-500">A little extra context helps the facility follow through smoothly.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Preferred Contact Method</label>
                      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1 border border-slate-200">
                        {['sms', 'call', 'email'].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setContactPreference(option)}
                            className={`rounded-xl px-3 py-3 text-sm font-bold transition-all ${contactPreference === option ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            {option.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {bookingError && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{bookingError}</div>}
                    <button type="submit" disabled={isSubmitting || isAssessing} className="w-full py-5 bg-teal-600 text-white rounded-2xl text-lg font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2 group disabled:bg-teal-400">
                      {isSubmitting || isAssessing ? <><Loader2 className="animate-spin" />{isAssessing ? 'Generating Triage...' : 'Confirming Booking...'}</> : <>Confirm Booking <ArrowRight size={20} /></>}
                    </button>
                    <p className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 size={14} />The urgency score refreshes from your latest intake right before booking is saved.</p>
                  </section>
                </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-50 text-yellow-600';
    case 'confirmed': return 'bg-green-50 text-green-600';
    case 'cancelled': return 'bg-red-50 text-red-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}

function formatVisitType(value?: string | null) {
  if (!value) return 'General consultation';
  return value.replaceAll('_', ' ');
}

function formatAppointmentTime(value?: string | null) {
  if (!value) return '--:--';
  const normalized = value.slice(0, 5);
  const [hours, minutes] = normalized.split(':');
  if (!hours || !minutes) return value;
  const hourNumber = Number(hours);
  if (!Number.isFinite(hourNumber)) return value;
  const suffix = hourNumber >= 12 ? 'PM' : 'AM';
  const twelveHour = hourNumber % 12 || 12;
  return `${twelveHour}:${minutes} ${suffix}`;
}

function getUrgencyPillClass(score?: number | null) {
  if ((score || 0) >= 8) return 'bg-red-100 text-red-700';
  if ((score || 0) >= 5) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getUrgencyLabel(score?: number | null) {
  if ((score || 0) >= 9) return 'Emergency care now';
  if ((score || 0) >= 7) return 'Urgent care within hours';
  if ((score || 0) >= 4) return 'Clinic visit within 24-48 hours';
  if ((score || 0) > 0) return 'Home care with monitoring';
  return 'Awaiting assessment';
}

export default function PatientDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>}>
      <PatientDashboardContent />
    </Suspense>
  );
}
