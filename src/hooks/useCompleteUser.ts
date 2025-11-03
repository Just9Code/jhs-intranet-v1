'use client';

import { useEffect, useState } from 'react';
import { useAuth, User } from '@/lib/auth';

export interface CompleteUser {
  id: number;
  authUserId: string | null;
  email: string;
  name: string;
  role: 'admin' | 'travailleur' | 'client';
  status: string;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export function useCompleteUser() {
  const { user, isLoading: authLoading, refetch } = useAuth();
  const [completeUser, setCompleteUser] = useState<CompleteUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompleteUser() {
      if (authLoading) return;

      if (!user) {
        setCompleteUser(null);
        setIsLoading(false);
        return;
      }

      // ✅ Use auth user data directly instead of fetching from API
      // This avoids 403 errors for non-admin users
      setCompleteUser({
        id: user.id,
        authUserId: null,
        email: user.email,
        name: user.name,
        role: user.role,
        status: 'active',
        phone: user.phone || null,
        address: user.address || null,
        photoUrl: null,
        createdAt: user.createdAt.toString(),
        lastLogin: user.lastLogin?.toString() || null,
      });
      setIsLoading(false);
    }

    fetchCompleteUser();
  }, [user, authLoading]);

  return {
    user: completeUser,
    isLoading: authLoading || isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}