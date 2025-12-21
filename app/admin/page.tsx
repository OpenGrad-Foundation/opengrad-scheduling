'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth({ disableRedirects: true });

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/signin');
      }
    }
  }, [isAdmin, isLoading, router]);

  // Show loading while checking auth and redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

