'use client';

import React, { useState } from 'react';
import { Building2, Mail, Lock, MapPin, ArrowRight, Loader2, Hospital } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import AuthPageShell from '@/components/ui/AuthPageShell';
import AuthField from '@/components/ui/AuthField';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';

export default function FacilityRegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [facilityType, setFacilityType] = useState('Clinic');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return 'Registration failed';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!acceptedTerms || !acceptedPrivacy) {
      setIsLoading(false);
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/register/facility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          location,
          type: facilityType,
          accepted_terms: acceptedTerms,
          accepted_privacy: acceptedPrivacy,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');
      
      login(data.access_token, data.role, data.name);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppHeader navItems={[...mainNavItems]} showLanguageToggle />
      <AuthPageShell
        variant="blue"
        cardClassName="max-w-xl"
        motionProps={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } }}
      >
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Facility Registration</h1>
          <p className="text-slate-500 font-medium">Partner with Haliya to manage triage and appointments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AuthField type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="St. Luke's Medical Center" label="Facility Name" icon={Hospital} className="focus:ring-blue-500" />

            <AuthField as="select" value={facilityType} onChange={(e) => setFacilityType(e.target.value)} label="Facility Type" className="focus:ring-blue-500">
                <option value="Hospital">Hospital</option>
                <option value="Clinic">Clinic</option>
                <option value="Urgent Care">Urgent Care</option>
                <option value="BHS">Barangay Health Station</option>
            </AuthField>
          </div>

          <AuthField type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@facility.com" label="Email Address" icon={Mail} className="focus:ring-blue-500" />

          <AuthField type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Quezon City, Metro Manila" label="Location / Province" icon={MapPin} className="focus:ring-blue-500" />

          <AuthField type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" label="Password" icon={Lock} className="focus:ring-blue-500" />

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the <Link href="/terms" className="font-bold text-blue-600 hover:underline">Terms and Conditions</Link>.
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the <Link href="/privacy" className="font-bold text-blue-600 hover:underline">Data Privacy Policy</Link>.
              </span>
            </label>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:bg-blue-400"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (
              <>
                Register Facility
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-500 font-medium">
          Already registered? <Link href="/facility/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
        </p>
      </AuthPageShell>
    </>
  );
}
