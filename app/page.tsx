'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Calendar, Users, BookOpen, Shield } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role;
      if (role === 'mentor') {
        router.replace('/mentor');
      } else if (role === 'student') {
        router.replace('/student');
      }
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OpenGrad Scheduling
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect mentors and mentees for interview preparation sessions
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/student"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Book a Session
            </Link>
            <Link
              href="/mentor"
              className="rounded-lg border border-blue-600 px-6 py-3 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
            >
              Mentor Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <Calendar className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Scheduling
            </h3>
            <p className="text-gray-600">
              Mentors can easily create and manage their availability slots
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <BookOpen className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instant Booking
            </h3>
            <p className="text-gray-600">
              First-come-first-served booking with real-time availability
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <Users className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto Calendar
            </h3>
            <p className="text-gray-600">
              Automatic Google Calendar invites with Meet links
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <Shield className="h-8 w-8 text-blue-600 mb-4" />
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
