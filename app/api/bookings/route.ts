import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { bookSlot, getStudentBookings } from '@/lib/apps-script';

// POST /api/bookings - Book a slot
export const POST = auth(async (request) => {
  try {
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slotId, studentName, studentEmail } = body;

    // Use session data if not provided in body
    const finalStudentName = studentName || session.user?.name || '';
    const finalStudentEmail = studentEmail || session.user?.email || '';

    if (!slotId || !finalStudentName || !finalStudentEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: slotId, studentName, studentEmail' },
        { status: 400 }
      );
    }

    // For student ID, use email as identifier (or roll number if available)
    const studentId = session.user?.rollNumber || session.user?.id || finalStudentEmail;

    const response = await bookSlot(slotId, studentId, finalStudentName, finalStudentEmail);

    if (!response.success) {
      return NextResponse.json(
        {
          success: false,
          error: response.error || 'Failed to book slot',
          reason: (response.data as any)?.reason,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: response.data,
    });
  } catch (error) {
    console.error('Error booking slot:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/bookings - Get user's bookings
export const GET = auth(async (request) => {
  try {
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId required' },
        { status: 400 }
      );
    }

    const response = await getStudentBookings(studentId);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: response.data });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

