'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientProfile, updatePatientProfile } from '@/lib/api';
import AccountDangerZone from '@/components/dashboard/AccountDangerZone';

const splitList = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const joinList = (items?: string[]) => (items && items.length ? items.join(', ') : '');

const normalizeConditions = (conditions: unknown): string[] => {
  if (Array.isArray(conditions)) return conditions as string[];
  if (conditions && typeof conditions === 'object' && Array.isArray((conditions as Record<string, unknown>).list)) {
    return (conditions as Record<string, unknown>).list as string[];
  }
  if (conditions && typeof conditions === 'object') {
    return Object.keys(conditions as Record<string, unknown>);
  }
  return [];
};

export default function PatientProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [allergies, setAllergies] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const profile = await getPatientProfile(user.token);
        setEmail(profile.email || '');
        setFullName(profile.full_name || '');
        setPhone(profile.personal_info?.phone || '');
        setAddress(profile.personal_info?.address || '');
        setDateOfBirth(profile.personal_info?.dateOfBirth || '');
        setAllergies(joinList(profile.medical_info?.allergies));
        setSurgeries(joinList(profile.medical_info?.surgeries));
        setMedications(joinList(profile.medical_info?.medications));
        setConditions(joinList(normalizeConditions(profile.medical_info?.conditions)));

        if (profile.full_name && profile.full_name !== user.name) {
          updateUser({ name: profile.full_name });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, updateUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updatePatientProfile(user.token, {
        full_name: fullName,
        personal_info: {
          phone,
          address,
          dateOfBirth,
        },
        medical_info: {
          allergies: splitList(allergies),
          surgeries: splitList(surgeries),
          medications: splitList(medications),
          conditions: { list: splitList(conditions) },
        },
      });
      setSuccess('Profile updated.');
      if (updated.full_name && updated.full_name !== user.name) {
        updateUser({ name: updated.full_name });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Patient Profile</h1>
            <p className="text-slate-500">Update your personal details and medical history.</p>
          </div>
          <Link href="/dashboard/patient" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Email</label>
                <input
                  value={email}
                  readOnly
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="0917 000 0000"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                <input
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Past Medical History</h2>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Allergies</label>
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g., peanuts, penicillin"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Surgeries</label>
                <input
                  value={surgeries}
                  onChange={(e) => setSurgeries(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g., appendectomy, C-section"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Medications</label>
                <input
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g., metformin, losartan"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Chronic Conditions</label>
                <input
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g., asthma, hypertension"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-100 transition-all hover:bg-teal-700 disabled:bg-teal-300"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </form>

        <div className="mt-8">
          <AccountDangerZone tone="teal" />
        </div>
      </section>
    </main>
  );
}
