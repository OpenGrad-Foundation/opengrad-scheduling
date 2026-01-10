'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Calendar, Users, Shield, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Navigation() {
  const { userRole, isAuthenticated, isAdmin, displayName, signOut, isLoading } = useAuth({ disableRedirects: true });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderRoleBasedNav = (isMobile = false) => {
    const containerClass = isMobile ? "flex flex-col gap-4" : "flex items-center gap-6";
    const linkClass = "flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors";

    if (isAdmin) {
      return (
        <div className={containerClass}>
          <Link href="/admin/dashboard" className={linkClass}>
            <Shield className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/admin/mentors" className={linkClass}>
            <Users className="h-4 w-4" />
            Mentors
          </Link>
          <Link href="/admin/students" className={linkClass}>
            <Users className="h-4 w-4" />
            Students
          </Link>
          <Link href="/admin/slots" className={linkClass}>
            <Calendar className="h-4 w-4" />
            Slots
          </Link>
        </div>
      );
    }

    switch (userRole) {
      case 'student':
        return (
          <Link href="/student" className={linkClass}>
            <Users className="h-4 w-4" />
            Book Session
          </Link>
        );
      case 'mentor':
        return (
          <Link href="/mentor" className={linkClass}>
            <Calendar className="h-4 w-4" />
            Mentor Dashboard
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 text-xl font-bold">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <Image
                    src="/Opengrad-logo-2.png"
                    alt="OpenGrad Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="gradient-teal-green-text font-semibold">OpenGrad</span>
                <span className="text-gray-400 text-sm font-normal">x</span>
                <div className="relative w-24 h-24">
                  <Image
                    src="/Enphase-logo.png"
                    alt="Partner Logo"
                    width={96}
                    height={96}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated && renderRoleBasedNav(false)}
            </div>
          </div>
          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{displayName}</span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-lg gradient-teal-green px-4 py-2 text-white hover:opacity-90 transition-opacity shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-teal-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              {isAuthenticated && renderRoleBasedNav(true)}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isLoading ? (
                  <span className="text-sm text-gray-400">Loading...</span>
                ) : isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <span className="text-sm text-gray-600">{displayName}</span>
                    <button
                      onClick={signOut}
                      className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="rounded-lg gradient-teal-green px-4 py-2 text-white hover:opacity-90 transition-opacity shadow-md inline-block"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}