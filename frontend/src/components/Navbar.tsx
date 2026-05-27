"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { ArrowLeft, Globe, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface NavbarProps {
  language?: "English" | "Filipino";
  onLanguageToggle?: () => void;
  showLanguageToggle?: boolean;
}

export default function Navbar({ language, onLanguageToggle, showLanguageToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const { language: contextLanguage, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromFacility = searchParams.get("from") === "facility";
  const resolvedLanguage = language ?? contextLanguage;
  const resolvedToggle = onLanguageToggle ?? toggleLanguage;
  const shouldShowToggle =
    showLanguageToggle || (pathname === "/triage" && resolvedLanguage && resolvedToggle);

  const navLinks = [
    { href: "/triage", label: "Triage Checker" },
    { href: "/history", label: "History" },
    { href: "/public-health", label: "Public Health" },
  ];

  if (fromFacility) {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <Link
            href="/dashboard/facility"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo + App Name */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/img/logo.jpg"
            alt="Mayari logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-teal-200"
            priority
          />
          <span className="font-sans text-2xl font-black tracking-tighter text-slate-800">MAYARI</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`hover:text-teal-600 transition-colors ${
                pathname === href ? "text-teal-600" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Language Toggle — only on /triage */}
          {shouldShowToggle ? (
            <button
              onClick={resolvedToggle}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              <Globe size={14} />
              {resolvedLanguage === "English" ? "EN" : "FIL"}
            </button>
          ) : (
            <button
              className="invisible flex items-center gap-2 font-bold px-3 py-1.5"
              aria-label="placeholder"
              aria-hidden="true"
              tabIndex={-1}
            >
              <Globe size={14} />
              EN
            </button>
          )}

          <ThemeToggle />

          {user ? (
            <>
              <Link
                href="/dashboard/patient"
                className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
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
