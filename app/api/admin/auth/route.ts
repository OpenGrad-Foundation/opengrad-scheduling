import { NextRequest, NextResponse } from 'next/server';

// Admin credentials from environment variables
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { adminId, password } = body;

    // Check if environment variables are set
    if (!ADMIN_ID || !ADMIN_PASSWORD) {
      console.error('Admin credentials not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    // Validate credentials
    if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
};