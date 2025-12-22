'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSigninModal from '@/components/AdminSigninModal';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminSigninPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAuth({ disableRedirects: true });

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isLoading, isAdmin, router]);

  const handleSigninSuccess = () => {
    // Dispatch event to trigger useAuth update
    window.dispatchEvent(new Event('adminAuthChange'));
    router.replace('/admin/dashboard');
  };

  // Show nothing while checking auth or redirecting
  if (isLoading || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AdminSigninModal
          isOpen={true}
          onClose={() => router.push('/')}
          onSuccess={handleSigninSuccess}
        />
      </div>
    </div>
  );
}