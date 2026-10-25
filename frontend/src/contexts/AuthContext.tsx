'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  name: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (token: string, role: string, name: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'mayari_auth';

const readStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem(STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsed = JSON.parse(storedUser) as Partial<AuthUser>;

    if (typeof parsed.token !== 'string' || typeof parsed.role !== 'string') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      token: parsed.token,
      role: parsed.role,
      name: typeof parsed.name === 'string' && parsed.name.trim().length > 0 ? parsed.name : 'User',
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const persistUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const syncFromStorage = () => {
      setUser(readStoredUser());
      setIsLoading(false);
    };

    const timer = window.setTimeout(syncFromStorage, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const login = (token: string, role: string, name: string) => {
    const normalizedRole = (role || 'patient').toLowerCase();
    const authData = { token, role: normalizedRole, name: name || 'User' };
    
    setUser(authData);
    persistUser(authData);
    
    // Explicit redirection logic
    if (normalizedRole === 'patient') {
      router.push('/dashboard/patient');
    } else {
      // Both 'admin' and 'facility' go to facility dashboard
      router.push('/dashboard/facility');
    }
  };

  const logout = () => {
    setUser(null);
    persistUser(null);
    router.push('/');
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      persistUser(next);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
