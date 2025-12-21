import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getMentorSlots } from '@/lib/apps-script';

// GET /api/mentor/slots - Get slots for a mentor
export const GET = auth(async (request) => {
  try {
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentorId required' },
        { status: 400 }
      );
    }

    const response = await getMentorSlots(mentorId);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({ slots: response.data });
  } catch (error) {
    console.error('Error fetching mentor slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

