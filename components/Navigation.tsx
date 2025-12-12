'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, Users, Shield, LogOut, Home } from 'lucide-react';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
              <Calendar className="h-6 w-6" />
              OpenGrad
            </Link>
            {session && (
              <div className="flex items-center gap-4">
                <Link
                  href="/student"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Book Session
                </Link>
                <Link
                  href="/mentor"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Mentor
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600">{session.user?.name || session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

