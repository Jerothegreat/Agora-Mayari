'use client';

import Link from 'next/link';
import { HeartPulse, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 opacity-50">
          <HeartPulse className="text-teal-600" size={32} />
          <span className="text-2xl font-black tracking-tighter text-slate-800">HALIYA</span>
        </div>

        {/* 404 */}
        <div className="space-y-4">
          <h1 className="text-9xl font-black text-slate-200">404</h1>
          <h2 className="text-3xl font-black text-slate-900">Page Not Found</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-100"
          >
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-400 mb-4">HELPFUL LINKS</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold">
            <Link href="/triage" className="text-teal-600 hover:text-teal-700">
              Symptom Checker
            </Link>
            <Link href="/dashboard" className="text-teal-600 hover:text-teal-700">
              Dashboard
            </Link>
            <Link href="/public-health" className="text-teal-600 hover:text-teal-700">
              Public Health
            </Link>
            <Link href="/auth/login" className="text-teal-600 hover:text-teal-700">
              Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
