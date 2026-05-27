'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import ThemeToggle from '@/components/ThemeToggle';

type HeaderNavItem = {
  href: string;
  label: string;
};

type AppHeaderProps = {
  navItems: HeaderNavItem[];
  extraActions?: ReactNode;
  className?: string;
  showLanguageToggle?: boolean;
};

export default function AppHeader({ navItems, extraActions, className, showLanguageToggle = false }: AppHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl dark:bg-slate-950/75',
        className,
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/img/logo.jpg"
            alt="Haliya logo"
            width={44}
            height={44}
            className="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-teal-200/70 ring-1 ring-white/70"
            priority
          />
          <span className="hidden leading-none sm:block">
            <span className="block font-sans text-2xl font-black tracking-normal text-slate-900">HALIYA</span>
            <span className="mt-1 block text-[10px] font-black uppercase tracking-normal text-teal-700">Health Intelligence</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 text-sm font-bold text-slate-500 shadow-inner shadow-slate-200/60 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 transition-all hover:bg-white hover:text-slate-900',
                  active &&
                    'bg-slate-950 text-white shadow-lg shadow-teal-100 hover:bg-slate-950 hover:text-white dark:bg-teal-500 dark:text-slate-950',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {showLanguageToggle ? <LanguageToggle language={language} onToggle={toggleLanguage} /> : null}
          <ThemeToggle />
          {extraActions}
          {user ? (
            <>
              <Link
                href={user.role === 'patient' ? '/dashboard/patient' : '/dashboard/facility'}
                className="text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-slate-900">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-100 transition-all hover:bg-teal-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
