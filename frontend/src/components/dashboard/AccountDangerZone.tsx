'use client';

import { useState } from 'react';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { deleteMyAccount } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type AccountDangerZoneProps = {
  tone?: 'teal' | 'blue';
};

export default function AccountDangerZone({ tone = 'teal' }: AccountDangerZoneProps) {
  const { user, logout } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const canDelete = confirmation.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!user || !canDelete) return;

    setIsDeleting(true);
    setError('');
    try {
      const sessionToken = window.localStorage.getItem('haliya_session_token') || undefined;
      await deleteMyAccount(user.token, sessionToken);
      window.localStorage.removeItem('haliya_session_token');
      logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account right now.');
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="h-fit rounded-2xl bg-white p-3 text-red-600 shadow-sm">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Data Rights</p>
            <h2 className="mt-1 text-xl font-black text-red-950">Delete account and personal data</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-red-800">
              This removes your account, profile, appointments linked to your profile, and this device&apos;s triage history when available. Aggregated, anonymized public-health statistics may remain because they no longer identify you.
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-3 md:w-72">
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-900 outline-none transition-all placeholder:text-red-300 focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-50',
              tone === 'blue' ? 'bg-blue-950 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700',
            )}
          >
            {isDeleting ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
            Delete My Account
          </button>
          {error ? <p className="text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
