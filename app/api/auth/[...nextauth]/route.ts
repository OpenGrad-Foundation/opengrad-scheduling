import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAllStudents } from '@/lib/apps-script';

// Validate required environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID is not set in .env.local');
}

if (!GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  GOOGLE_CLIENT_SECRET is not set in .env.local');
} else if (GOOGLE_CLIENT_SECRET.startsWith('C') && GOOGLE_CLIENT_SECRET.includes(GOOGLE_CLIENT_ID || '')) {
  console.error('❌ GOOGLE_CLIENT_SECRET appears to be a placeholder value!');
  console.error('   Please update it with the actual secret from Google Cloud Console.');
  console.error('   Current value looks incorrect:', GOOGLE_CLIENT_SECRET.substring(0, 20) + '...');
}

if (!NEXTAUTH_SECRET) {
  console.error('❌ NEXTAUTH_SECRET is not set in .env.local - This will cause authentication to fail!');
  console.error('   Generate one with: openssl rand -base64 32');
}

if (!NEXTAUTH_URL) {
  console.warn('⚠️  NEXTAUTH_URL is not set in .env.local');
}

// Validate NEXTAUTH_SECRET (but don't throw at module level to allow server to start)
// NextAuth will handle missing secret with its own error
const isValidSecret = NEXTAUTH_SECRET && NEXTAUTH_SECRET.trim() !== '';
if (!isValidSecret) {
  console.error('❌ CRITICAL: NEXTAUTH_SECRET is missing or empty!');
  console.error('   Authentication will fail. Generate one with: openssl rand -base64 32');
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID?.trim() || '',
      clientSecret: GOOGLE_CLIENT_SECRET?.trim() || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        },
      },
    }),
    CredentialsProvider({
      name: 'Student Credentials',
      credentials: {
        rollNumber: { label: 'Roll Number', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        try {
          // Validate credentials are provided
          if (!credentials?.rollNumber || !credentials?.email) {
            return null;
          }

          // Trim whitespace
          const rollNumber = String(credentials.rollNumber || '').trim();
          const email = String(credentials.email || '').trim();

          // Validate roll number is not empty
          if (!rollNumber) {
            return null;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return null;
          }

          // Fetch all students from Google Sheets
          const studentsResult = await getAllStudents();
          if (!studentsResult.success || !studentsResult.data) {
            console.error('Failed to fetch students for authentication:', studentsResult.error);
            return null;
          }

          // Find student with matching roll number (student_id) and email
          const student = studentsResult.data.find((s: any) =>
            s.student_id === rollNumber && s.email.toLowerCase() === email.toLowerCase()
          );

          if (!student) {
            console.log('Student not found with roll number:', rollNumber, 'and email:', email);
            return null;
          }

          // Return user object for students
          return {
            id: student.student_id,
            email: student.email,
            name: student.name,
            role: 'student',
            rollNumber: student.student_id,
          };
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // If using Google OAuth, always allow sign-in and set role to mentor
      if (account?.provider === 'google') {
        // Always allow Google sign-in - never block at login time
        user.role = 'mentor';
        // Store OAuth account info for later use
        (user as any).account = account;
        return true;
      }
      // If using credentials, role is already set to 'student'
      return true;
    },
    async session({ session, token }: any) {
      // Always return a valid session object (NextAuth requirement)
      // If no session provided, create a minimal one
      if (!session) {
        return {
          user: null,
          expires: new Date().toISOString(),
        } as any;
      }

      // If no user in session, return session as-is (unauthenticated state)
      if (!session.user) {
        return session;
      }

      // Safely add user role and ID to session
      // For OAuth users, use the sub (subject) from the token
      // For credentials users, use the id from the token
      if (token && typeof token === 'object') {
        // Token exists - enhance session
        const tokenSub = token.sub as string | undefined;
        const tokenId = token.id as string | undefined;
        const tokenEmail = token.email as string | undefined;
        
        session.user.id = tokenSub || tokenId || tokenEmail || session.user.email || '';
        session.user.role = (token.role as 'student' | 'mentor' | 'admin') || 'student';
        
        if (token.rollNumber) {
          session.user.rollNumber = String(token.rollNumber);
        }
        
        // Store access token for OAuth users (if needed for API calls)
        if (token.accessToken) {
          (session as any).accessToken = token.accessToken;
        }
      } else {
        // Fallback if token is not available or doesn't have expected structure
        session.user.id = session.user.email || '';
        session.user.role = 'student';
      }
      
      return session;
    },
    async jwt({ token, user, account, profile }: any) {
      try {
        // Initial sign in - persist user and account info
        if (user) {
          token.role = (user as any).role || (account?.provider === 'google' ? 'mentor' : 'student');
          if ((user as any).rollNumber) {
            token.rollNumber = (user as any).rollNumber;
          }
          // For OAuth, use the account's sub (subject) as the user ID
          if (account?.provider === 'google') {
            token.id = account.providerAccountId || user.id || '';
            token.sub = account.providerAccountId || user.id || '';
          } else {
            token.id = user.id || '';
          }
        }
        
        // Store OAuth access token if available
        if (account?.access_token) {
          token.accessToken = account.access_token;
        }
        
        // Refresh token handling (if needed)
        if (account?.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
        
        return token;
      } catch (error) {
        console.error('Error in jwt callback:', error);
        // Return token even if there's an error to prevent crashes
        return token;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect to sign-in on error
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Ensure cookies are sent with requests
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

// NextAuth v5 returns an object with GET and POST handlers
const { handlers, auth } = NextAuth(authOptions as any);

export const { GET, POST } = handlers;
export { auth };

