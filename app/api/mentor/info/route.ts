import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getMentorByEmail } from '@/lib/apps-script';

// GET /api/mentor/info - Get mentor info by email
export const GET = auth(async (request: NextRequest & { auth: any }) => {
  try {
    const session = request.auth;
    console.log('[mentor/info] Session:', session ? 'exists' : 'null');
    
    if (!session || !session.user) {
      console.error('[mentor/info] No session or user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    console.log('[mentor/info] Requested email:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'email required' },
        { status: 400 }
      );
    }

    // Verify the requested email matches the authenticated user
    if (email !== session.user.email) {
      console.warn('[mentor/info] Email mismatch:', email, 'vs', session.user.email);
      return NextResponse.json(
        { error: 'Can only request your own mentor info' },
        { status: 403 }
      );
    }

    console.log('[mentor/info] Calling getMentorByEmail for:', email);
    const response = await getMentorByEmail(email);
    console.log('[mentor/info] Response success:', response.success);
    
    if (!response || typeof response !== 'object') {
      console.error('[mentor/info] Invalid response format:', response);
      return NextResponse.json(
        { error: 'Invalid response from Apps Script' },
        { status: 500 }
      );
    }

    if (!response.success) {
      console.error('[mentor/info] Apps Script error:', response.error);
      return NextResponse.json(
        { error: response.error || 'Failed to fetch mentor info' },
        { status: 500 }
      );
    }

    if (!response.mentor) {
      console.warn('[mentor/info] No mentor data in response');
      return NextResponse.json(
        { error: 'Mentor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mentor: response.mentor });
  } catch (error) {
    console.error('[mentor/info] Exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
      { status: 500 }
    );
  }
});