'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFacilityProfile, updateFacilityProfile } from '@/lib/api';
import AccountDangerZone from '@/components/dashboard/AccountDangerZone';

const splitList = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const joinList = (items?: string[]) => (items && items.length ? items.join(', ') : '');

export default function FacilityProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [website, setWebsite] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [services, setServices] = useState('');
  const [languages, setLanguages] = useState('');
  const [accreditation, setAccreditation] = useState('');
  const [insurance, setInsurance] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const profile = await getFacilityProfile(user.token);
        setName(profile.name || '');
        setType(profile.type || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setLocation(profile.location || '');
        setAddress(profile.address || '');
        setCity(profile.city || '');
        setProvince(profile.province || '');
        setPostalCode(profile.postal_code || '');
        setWebsite(profile.website || '');
        setSpecialties(joinList(profile.specialties));
        setServices(joinList(profile.services));
        setLanguages(joinList(profile.languages));
        setAccreditation(joinList(profile.accreditation));
        setInsurance(joinList(profile.insurance_accepted));
        setLicenseNumber(profile.license_number || '');
        setDescription(profile.description || '');

        if (profile.name && profile.name !== user.name) {
          updateUser({ name: profile.name });
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
      const updated = await updateFacilityProfile(user.token, {
        name,
        type,
        email,
        phone,
        location,
        address,
        city,
        province,
        postal_code: postalCode,
        website,
        specialties: splitList(specialties),
        services: splitList(services),
        languages: splitList(languages),
        accreditation: splitList(accreditation),
        insurance_accepted: splitList(insurance),
        license_number: licenseNumber,
        description,
      });
      setSuccess('Profile updated.');
      if (updated.name && updated.name !== user.name) {
        updateUser({ name: updated.name });
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
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Facility Profile</h1>
            <p className="text-slate-500">Keep your facility details accurate for patients and referrals.</p>
          </div>
          <Link href="/dashboard/facility" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
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

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Facility Details</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Facility Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Facility name" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Facility Type</label>
                <input value={type} onChange={(e) => setType(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Hospital, Clinic, RHU" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@facility.com" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contact number" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="City, Province" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Street address" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="City" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Province</label>
                <input value={province} onChange={(e) => setProvince(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Province" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Postal Code</label>
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ZIP" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Website</label>
                <input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Services and Coverage</h2>
            <div className="mt-4 grid grid-cols-1 gap-5">
              <div>
                <label className="text-sm font-bold text-slate-700">Specialties</label>
                <input value={specialties} onChange={(e) => setSpecialties(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., pediatrics, cardiology" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Services</label>
                <input value={services} onChange={(e) => setServices(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., diagnostics, ER" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Languages Supported</label>
                <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="English, Filipino" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Accreditations</label>
                <input value={accreditation} onChange={(e) => setAccreditation(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., DOH, PhilHealth" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Insurance Accepted</label>
                <input value={insurance} onChange={(e) => setInsurance(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., PhilHealth, HMO" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">License Number</label>
                <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="License number" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700">Facility Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none" placeholder="Brief overview of your facility" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </form>

        <div className="mt-8">
          <AccountDangerZone tone="blue" />
        </div>
      </section>
    </main>
  );
}
