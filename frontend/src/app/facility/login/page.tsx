'use client';

import React, { useState } from 'react';
import { Building2, Mail, Lock, ArrowRight, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import AuthPageShell from '@/components/ui/AuthPageShell';
import AuthField from '@/components/ui/AuthField';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';

export default function FacilityLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return 'Login failed';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Login failed');
      
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
      <AuthPageShell variant="blue">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Facility Login</h1>
          <p className="text-slate-500 font-medium">Access your patient queue and health alerts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <AuthField type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@facility.com" label="Email Address" icon={Mail} className="focus:ring-blue-500" />

          <AuthField type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" label="Password" icon={Lock} className="focus:ring-blue-500" />

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:bg-blue-400"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <>
                  Login
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Demo Facility Access</p>
          <button 
            onClick={() => {
              setEmail('provider@mayari.ph');
              setPassword('provider123');
            }}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-500 transition-all group"
          >
            <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">provider@mayari.ph</p>
            <p className="text-xs text-slate-400">Password: provider123 (Click to autofill)</p>
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 font-medium">
          Need to register your facility? <Link href="/facility/register" className="text-blue-600 font-bold hover:underline">Register here</Link>
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Link href="/auth/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors">
            Patient Login <ChevronRight size={12} />
          </Link>
        </div>
      </AuthPageShell>
    </>
  );
}
