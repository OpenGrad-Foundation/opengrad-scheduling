'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Users, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isLoading, isAdmin } = useAuth({ redirectToRoleDashboard: true });

  // Redirect admin to dashboard
  useEffect(() => {
    if (!isLoading && isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isLoading, isAdmin, router]);

  // Show loading state while checking authentication
  if (isLoading || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <Image
                  src="/Opengrad-logo-2.png"
                  alt="OpenGrad Logo"
                  width={96}
                  height={96}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-gray-300 text-3xl font-light">x</span>
              <div className="relative w-48 h-48">
                <Image
                  src="/Enphase-logo.png"
                  alt="Partner Logo"
                  width={192}
                  height={192}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-teal-green-text">OpenGrad</span>{' '}
            <span className="text-gray-900">Scheduling</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Connect mentors and mentees for interview preparation sessions
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/student"
              className="rounded-lg gradient-teal-green px-8 py-3 text-white font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              Book a Session
            </Link>
            <Link
              href="/mentor"
              className="rounded-lg border-2 border-teal-600 px-8 py-3 text-teal-600 font-medium hover:bg-teal-50 transition-colors"
            >
              Mentor Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 rounded-lg gradient-teal-green flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Scheduling
            </h3>
            <p className="text-gray-600">
              Mentors can easily create and manage their availability slots
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 rounded-lg gradient-teal-green flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instant Booking
            </h3>
            <p className="text-gray-600">
              First-come-first-served booking with real-time availability
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 rounded-lg gradient-teal-green flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto Calendar
            </h3>
            <p className="text-gray-600">
              Automatic Google Calendar invites with Meet links
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 rounded-lg gradient-teal-green flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure & Reliable
            </h3>
            <p className="text-gray-600">
              Atomic booking prevents double-booking and conflicts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
