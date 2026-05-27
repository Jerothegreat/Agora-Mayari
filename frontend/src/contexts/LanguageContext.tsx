'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'English' | 'Filipino';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'haliya_language';
const isLanguage = (value: string | null): value is Language => value === 'English' || value === 'Filipino';

const readStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'English';
  const stored = localStorage.getItem(STORAGE_KEY);
  return isLanguage(stored) ? stored : 'English';
};

const persistLanguage = (language: Language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, language);
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncLanguage = () => {
      setLanguageState(readStoredLanguage());
      setIsLoading(false);
    };

    const timer = window.setTimeout(syncLanguage, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncLanguage();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        persistLanguage(nextLanguage);
      },
      toggleLanguage: () => {
        setLanguageState((current) => {
          const newLang = current === 'English' ? 'Filipino' : 'English';
          persistLanguage(newLang);
          return newLang;
        });
      },
      isLoading,
    }),
    [language, isLoading],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export type { Language };
