'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Don't protect the login page
    if (pathname === '/login') {
      return;
    }

    // Only redirect after loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading state while checking auth (only for protected routes)
  if (isLoading && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto"></div>
            <div className="h-3 w-24 bg-muted/50 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated (prevents flash)
  if (!isLoading && !isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
