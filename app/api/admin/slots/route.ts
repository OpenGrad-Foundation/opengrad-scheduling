import { NextRequest, NextResponse } from 'next/server';
import { getAllSlots } from '@/lib/apps-script';

export const GET = async (request: NextRequest) => {
  try {
    const result = await getAllSlots();

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch slots' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Admin slots API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};