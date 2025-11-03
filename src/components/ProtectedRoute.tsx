'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoadingScreen } from '@/components/LoadingScreen';

type UserRole = 'admin' | 'travailleur' | 'client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user role is allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !authorized) {
    return null;
  }

  return <>{children}</>;
}