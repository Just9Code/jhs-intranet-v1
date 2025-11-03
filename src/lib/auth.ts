'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'travailleur' | 'client';
  phone?: string | null;
  address?: string | null;
  createdAt: Date;
  lastLogin?: Date | null;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SessionResponse {
  user: User | null;
  accountDisabled?: boolean;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur de connexion' };
    }

    // Store token in localStorage as backup
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('jhs_token', data.token);
    }

    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    console.error('🔴 [AUTH] Sign in error:', error);
    return { success: false, error: 'Erreur de connexion' };
  }
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'travailleur' | 'client' = 'client'
): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur d\'inscription' };
    }

    // Store token in localStorage as backup
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('jhs_token', data.token);
    }

    return { success: true, user: data.user, token: data.token };
  } catch (error) {
    console.error('🔴 [AUTH] Register error:', error);
    return { success: false, error: 'Erreur d\'inscription' };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Erreur de déconnexion' };
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jhs_token');
    }

    return { success: true };
  } catch (error) {
    console.error('🔴 [AUTH] Sign out error:', error);
    return { success: false, error: 'Erreur de déconnexion' };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    // ✅ Protect localStorage access for SSR compatibility
    const token = typeof window !== 'undefined' ? localStorage.getItem('jhs_token') : null;
    
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });

    const data = await response.json();

    return { user: data.user || null, accountDisabled: data.accountDisabled };
  } catch (error) {
    console.error('🔴 [AUTH] Get session error:', error);
    return { user: null };
  }
}

/**
 * React hook for authentication
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    setIsLoading(true);
    const { user, accountDisabled } = await getSession();
    
    // ✅ If account was disabled, force logout and show message
    if (accountDisabled && !user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jhs_token');
      }
      setUser(null);
      toast.error('Votre compte a été désactivé. Veuillez contacter un administrateur.', {
        duration: 6000,
      });
      router.push('/login?error=account_disabled');
      setIsLoading(false);
      return;
    }
    
    setUser(user);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return {
    user,
    isLoading,
    signIn: async (email: string, password: string) => {
      const result = await signIn(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    signOut: async () => {
      const result = await signOut();
      if (result.success) {
        setUser(null);
      }
      return result;
    },
    register: async (email: string, password: string, name: string, role?: 'admin' | 'travailleur' | 'client') => {
      const result = await register(email, password, name, role);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    },
    refetch: fetchSession,
  };
}