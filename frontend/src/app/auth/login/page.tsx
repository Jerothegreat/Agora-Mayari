'use client';

import React, { useState } from 'react';
import { HeartPulse, Mail, Lock, ArrowRight, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import AuthPageShell from '@/components/ui/AuthPageShell';
import AuthField from '@/components/ui/AuthField';
import AppHeader from '@/components/AppHeader';
import { mainNavItems } from '@/lib/navigation';

export default function LoginPage() {
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
      <AuthPageShell variant="teal">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="bg-teal-600 p-3 rounded-2xl text-white shadow-lg shadow-teal-100">
            <HeartPulse size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Log in to manage your health and appointments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <AuthField type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@example.com" label="Email Address" icon={Mail} className="focus:ring-teal-500" />

          <AuthField type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" label="Password" icon={Lock} className="focus:ring-teal-500" />

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-teal-600 text-white rounded-2xl text-lg font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center gap-2 group disabled:bg-teal-400"
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
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Demo Patient Access</p>
          <button 
            onClick={() => {
              setEmail('patient@haliya.ph');
              setPassword('patient123');
            }}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-left hover:border-teal-500 transition-all group"
          >
            <p className="text-sm font-bold text-slate-700 group-hover:text-teal-600">patient@haliya.ph</p>
            <p className="text-xs text-slate-400">Password: patient123 (Click to autofill)</p>
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 font-medium">
          Don&apos;t have an account? <Link href="/auth/signup" className="text-teal-600 font-bold hover:underline">Sign up</Link>
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Link href="/facility/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors">
            Healthcare Facility Login <ChevronRight size={12} />
          </Link>
        </div>
      </AuthPageShell>
    </>
  );
}
