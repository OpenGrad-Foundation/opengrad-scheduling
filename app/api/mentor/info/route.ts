import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getMentorByEmail } from '@/lib/apps-script';

// GET /api/mentor/info - Get mentor info by email
export const GET = auth(async (request: NextRequest & { auth: any }) => {
  try {
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'email required' },
        { status: 400 }
      );
    }

    // Verify the requested email matches the authenticated user
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Can only request your own mentor info' },
        { status: 403 }
      );
    }

    const response = await getMentorByEmail(email);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch mentor info' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mentor: response.mentor });
  } catch (error) {
    console.error('Error fetching mentor info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});