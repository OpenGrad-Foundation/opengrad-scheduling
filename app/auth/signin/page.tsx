'use client';

import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { AlertCircle, X } from 'lucide-react';

function SignInForm() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl');
  const errorParam = searchParams.get('error');
  const [isStudent, setIsStudent] = useState(true);
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ rollNumber?: string; email?: string }>({});
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect authenticated users to their dashboard (only once, when session is fully loaded)
  useEffect(() => {
    // Only redirect if:
    // 1. Session status is 'authenticated' (not 'loading')
    // 2. Session has a user with a role
    // 3. We haven't already redirected
    if (status === 'authenticated' && session?.user?.role && !hasRedirected) {
      setHasRedirected(true);
      const role = session.user.role;
      if (role === 'mentor') {
        router.replace('/mentor');
      } else if (role === 'student') {
        router.replace('/student');
      }
    }
  }, [status, session, router, hasRedirected]);

  // Handle OAuth errors from callback
  useEffect(() => {
    if (errorParam) {
      let errorMessage = '';
      switch (errorParam) {
        case 'Configuration':
          errorMessage = 'OAuth configuration error. Please contact support.';
          break;
        case 'AccessDenied':
          errorMessage = 'Access denied. You may not have permission to sign in as a mentor.';
          break;
        case 'Verification':
          errorMessage = 'Verification failed. Please try again.';
          break;
        case 'OAuthSignin':
          errorMessage = 'Error initiating OAuth sign-in. Please try again.';
          break;
        case 'OAuthCallback':
          errorMessage = 'Error processing OAuth callback. Please try again.';
          break;
        case 'OAuthCreateAccount':
          errorMessage = 'Could not create OAuth account. Please try again.';
          break;
        case 'EmailCreateAccount':
          errorMessage = 'Could not create account. Please try again.';
          break;
        case 'Callback':
          errorMessage = 'Error in callback. Please try again.';
          break;
        case 'OAuthAccountNotLinked':
          errorMessage = 'Account not linked. Please contact support.';
          break;
        case 'EmailSignin':
          errorMessage = 'Error sending email. Please try again.';
          break;
        case 'CredentialsSignin':
          errorMessage = 'Invalid credentials. Please check your roll number and email.';
          break;
        case 'SessionRequired':
          errorMessage = 'Please sign in to access this page.';
          break;
        default:
          errorMessage = 'An error occurred during sign-in. Please try again.';
      }
      setError(errorMessage);
      setIsStudent(false); // Show mentor tab if OAuth error
    }
  }, [errorParam]);

  const validateStudentForm = () => {
    const errors: { rollNumber?: string; email?: string } = {};
    
    if (!rollNumber.trim()) {
      errors.rollNumber = 'Roll number is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleSignIn = () => {
    setError('');
    setFieldErrors({});
    setLoading(true);
    
    // signIn with Google will redirect, so we can't catch errors here
    // Errors will be handled via the error query parameter in useEffect
    // Redirect to mentor dashboard after successful login
    signIn('google', { 
      callbackUrl: callbackUrl || '/mentor',
    } as any);
  };

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate form
    if (!validateStudentForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        rollNumber: rollNumber.trim(),
        email: email.trim(),
        redirect: false,
        callbackUrl: callbackUrl || undefined,
      });

      if (result?.error) {
        let errorMessage = '';
        switch (result.error) {
          case 'CredentialsSignin':
            errorMessage = 'Invalid credentials. Please check your roll number and email.';
            break;
          case 'Configuration':
            errorMessage = 'Authentication is not properly configured. Please contact support.';
            break;
          default:
            errorMessage = 'Sign-in failed. Please check your credentials and try again.';
        }
        setError(errorMessage);
      } else if (result?.ok) {
        // Wait a moment for session to be set, then redirect
        setTimeout(() => {
          router.push(callbackUrl || '/student');
        }, 100);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-teal-green-text">Sign In</span>
          </h1>
          <p className="text-gray-600">
            Sign in to access the scheduling system
          </p>
        </div>

        {/* Toggle between Student and Mentor */}
        <div className="mb-6 flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setIsStudent(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isStudent
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setIsStudent(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isStudent
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mentor
          </button>
        </div>

        {isStudent ? (
          <form onSubmit={handleStudentSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                required
                value={rollNumber}
                onChange={(e) => {
                  setRollNumber(e.target.value);
                  if (fieldErrors.rollNumber) {
                    setFieldErrors({ ...fieldErrors, rollNumber: undefined });
                  }
                }}
                placeholder="Enter your roll number"
                className={`w-full rounded-lg placeholder-gray-500 text-black border px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.rollNumber
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              />
              {fieldErrors.rollNumber && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.rollNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: undefined });
                  }
                }}
                placeholder="Enter your email"
                className={`w-full rounded-lg placeholder-gray-500 text-black border px-3 py-2 focus:outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-teal-500'
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Sign-in failed</p>
                  <p className="mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg gradient-teal-green px-4 py-3 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In as Student'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Sign-in failed</p>
                  <p className="mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google (Mentor)'}
            </button>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="text-center">
                Make sure you're using a Google account that's been added as a test user in the OAuth consent screen.
              </p>
              <p className="text-center text-gray-400">
                If you see "Access blocked" error, contact your administrator to add your email as a test user.
              </p>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500 text-center">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}

