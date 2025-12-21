'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { UserRole } from '@/types';

interface UseAuthOptions {
  requiredRole?: UserRole;
  redirectToRoleDashboard?: boolean;
  disableRedirects?: boolean;
}

interface AuthState {
  session: ReturnType<typeof useSession>['data'];
  isLoading: boolean;
  userRole: UserRole | undefined;
  isAdmin: boolean;
  isAuthenticated: boolean;
  displayName: string | null;
  signOut: () => void;
}

export function useAuth(options?: UseAuthOptions): AuthState {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  // Check admin auth from localStorage
  useEffect(() => {
    const checkAdminAuth = () => {
      if (typeof window !== 'undefined') {
        const adminAuth = localStorage.getItem('admin_authenticated');
        setIsAdmin(adminAuth === 'true');
        setAdminLoading(false);
      }
    };

    checkAdminAuth();

    // Listen for admin auth changes
    window.addEventListener('adminAuthChange', checkAdminAuth);
    window.addEventListener('storage', checkAdminAuth);

    return () => {
      window.removeEventListener('adminAuthChange', checkAdminAuth);
      window.removeEventListener('storage', checkAdminAuth);
    };
  }, []);

  // Unified sign out function
  const signOut = useCallback(() => {
    if (isAdmin) {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_id');
      setIsAdmin(false);
      window.dispatchEvent(new Event('adminAuthChange'));
      // Use window.location for immediate redirect to prevent useAuth redirect logic
      window.location.href = '/';
    } else if (session) {
      nextAuthSignOut({ callbackUrl: '/' });
    }
  }, [isAdmin, session]);

  // Handle redirects
  useEffect(() => {
    // Skip redirects if disabled
    if (options?.disableRedirects) {
      return;
    }

    // Don't redirect while loading
    if (status === 'loading' || adminLoading) {
      return;
    }

    // Admin pages have their own redirect logic
    if (pathname.startsWith('/admin')) {
      // If on admin signin and already authenticated as admin, go to dashboard
      if (pathname === '/admin/signin' && isAdmin) {
        router.replace('/admin/dashboard');
        return;
      }
      // If on admin dashboard/other admin pages and not authenticated, go to signin
      if (pathname !== '/admin/signin' && pathname !== '/admin' && !isAdmin) {
        router.replace('/admin/signin');
        return;
      }
      return;
    }

    // For non-admin pages, use NextAuth session
    if (status === 'authenticated' && session?.user?.role) {
      const userRole = session.user.role;

      // If redirectToRoleDashboard is true (for home page), redirect to role-specific dashboard
      if (options?.redirectToRoleDashboard) {
        if (userRole === 'mentor') {
          router.replace('/mentor');
        } else if (userRole === 'student') {
          router.replace('/student');
        }
        return;
      }

      // If a specific role is required, check if user has it
      if (options?.requiredRole && userRole !== options.requiredRole) {
        if (userRole === 'mentor') {
          router.replace('/mentor');
        } else if (userRole === 'student') {
          router.replace('/student');
        }
        return;
      }
    }

    // Handle unauthenticated users for protected pages
    if (status === 'unauthenticated' && !isAdmin) {
      // Don't redirect from public pages
      const publicPaths = ['/', '/auth/signin', '/admin', '/admin/signin'];
      if (!publicPaths.includes(pathname)) {
        const callbackUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    }
  }, [status, session, router, options, pathname, isAdmin, adminLoading]);

  // Determine effective role
  const effectiveRole: UserRole | undefined = isAdmin ? 'admin' : session?.user?.role;

  // Determine display name
  const displayName = isAdmin 
    ? 'Admin' 
    : session?.user?.name || session?.user?.email || null;

  // Combined authentication status
  const isAuthenticated = isAdmin || status === 'authenticated';

  // Combined loading status
  const isLoading = status === 'loading' || adminLoading;

  return {
    session,
    isLoading,
    userRole: effectiveRole,
    isAdmin,
    isAuthenticated,
    displayName,
    signOut,
  };
}