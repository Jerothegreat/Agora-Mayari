'use client';

import { Globe } from 'lucide-react';

type LanguageToggleProps = {
  language: 'English' | 'Filipino';
  onToggle: () => void;
};

export default function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
    >
      <Globe size={14} />
      {language === 'English' ? 'EN' : 'FIL'}
    </button>
  );
}
