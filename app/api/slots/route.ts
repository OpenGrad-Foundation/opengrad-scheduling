import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getOpenSlots, createSlot } from '@/lib/apps-script';
import type { SlotCreationRequest } from '@/types';

// GET /api/slots - Get open slots
export const GET = auth(async (request) => {
  try {
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching open slots for user:', session.user.email);

    const response = await getOpenSlots();
    if (!response.success) {
      console.error('getOpenSlots failed:', response.error);
      return NextResponse.json(
        { 
          error: response.error || 'Failed to fetch slots',
          details: 'Check server logs for more information'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ slots: response.data || [] });
  } catch (error) {
    console.error('Error fetching slots:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
});

// POST /api/slots - Create a new slot (mentor only)
export const POST = auth(async (request) => {
  try {
    // Validate session
    const session = request.auth;
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a mentor
    if (session.user.role !== 'mentor') {
      return NextResponse.json(
        { error: 'Only mentors can create slots' },
        { status: 403 }
      );
    }

    // Validate session user has required fields
    if (!session.user.email) {
      console.error('Session user missing email:', session.user);
      return NextResponse.json(
        { error: 'User email not found in session' },
        { status: 400 }
      );
    }

    if (!session.user.name) {
      console.error('Session user missing name:', session.user);
      return NextResponse.json(
        { error: 'User name not found in session' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: SlotCreationRequest;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Ensure mentorEmail and mentorName are set from session
    body.mentorEmail = body.mentorEmail || session.user.email;
    body.mentorName = body.mentorName || session.user.name;

    // Validate required fields
    if (!body.date || !body.start || !body.end) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: {
            date: !body.date ? 'date is required (YYYY-MM-DD)' : undefined,
            start: !body.start ? 'start is required (HH:MM)' : undefined,
            end: !body.end ? 'end is required (HH:MM)' : undefined,
          }
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(body.start) || !timeRegex.test(body.end)) {
      return NextResponse.json(
        { error: 'Invalid time format. Expected HH:MM' },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    const [startHours, startMinutes] = body.start.split(':').map(Number);
    const [endHours, endMinutes] = body.end.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    if (endTotal <= startTotal) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    console.log('Creating slot with data:', {
      mentorEmail: body.mentorEmail,
      mentorName: body.mentorName,
      date: body.date,
      start: body.start,
      end: body.end,
    });

    const response = await createSlot(body);

    if (!response.success) {
      console.error('createSlot failed:', response.error);
      return NextResponse.json(
        { 
          error: response.error || 'Failed to create slot',
          details: 'Check server logs for more information'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ slot: response.data });
  } catch (error) {
    console.error('Error creating slot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
});

