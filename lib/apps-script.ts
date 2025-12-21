// Client-side utilities for calling Apps Script web app endpoints
import type { Slot, Booking, SlotCreationRequest } from '@/types';

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || '';

export interface AppsScriptResponse<T = any> {
  mentor?: any;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Call Apps Script web app endpoint
 */
async function callAppsScript(
  functionName: string,
  params: Record<string, any> = {}
): Promise<AppsScriptResponse> {
  if (!APPS_SCRIPT_URL) {
    return {
      success: false,
      error: 'Apps Script URL not configured',
    };
  }

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: functionName,
        parameters: params,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Apps Script HTTP error ${response.status}:`, errorText.substring(0, 200));
      return {
        success: false,
        error: `Apps Script returned ${response.status}: ${isJson ? JSON.parse(errorText).error || errorText : 'Non-JSON error response'}`,
      };
    }

    if (!isJson) {
      const text = await response.text();
      console.error('Apps Script returned non-JSON response:', text.substring(0, 200));
      return {
        success: false,
        error: 'Apps Script returned invalid response format (expected JSON)',
      };
    }

    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.error('Apps Script returned invalid data:', data);
      return {
        success: false,
        error: 'Apps Script returned invalid data format',
      };
    }

    return data;
  } catch (error) {
    console.error('Apps Script call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all open slots
 */
export async function getOpenSlots(): Promise<AppsScriptResponse<Slot[]>> {
  return callAppsScript('getOpenSlots');
}

/**
 * Book a slot (atomic operation with locking)
 */
export async function bookSlot(
  slotId: string,
  studentId: string,
  studentName: string,
  studentEmail: string
): Promise<AppsScriptResponse<Booking>> {
  return callAppsScript('bookSlot', {
    slotId,
    studentId,
    studentName,
    studentEmail,
  });
}

/**
 * Get slots for a mentor
 */
export async function getMentorSlots(
  mentorId: string
): Promise<AppsScriptResponse<Slot[]>> {
  return callAppsScript('getMentorSlots', { mentorId });
}

/**
 * Create a new slot
 */
export async function createSlot(
  slotData: SlotCreationRequest
): Promise<AppsScriptResponse<Slot>> {
  return callAppsScript('createSlot', slotData);
}

/**
 * Cancel a slot
 */
export async function cancelSlot(
  slotId: string,
  mentorId: string
): Promise<AppsScriptResponse> {
  return callAppsScript('cancelSlot', { slotId, mentorId });
}

/**
 * Get booking details
 */
export async function getBooking(
  bookingId: string
): Promise<AppsScriptResponse<Booking>> {
  return callAppsScript('getBooking', { bookingId });
}

/**
 * Get student bookings
 */
export async function getStudentBookings(
  studentId: string
): Promise<AppsScriptResponse<Booking[]>> {
  return callAppsScript('getStudentBookings', { studentId });
}

/**
 * Get mentor info by email
 */
export async function getMentorByEmail(
  email: string
): Promise<AppsScriptResponse<{ mentor_id: string; name: string; email: string }>> {
  return callAppsScript('getMentorByEmail', { email });
}

/**
 * Get all bookings for admin dashboard
 */
export async function getAllBookings(): Promise<AppsScriptResponse<Booking[]>> {
  return callAppsScript('getAllBookings');
}

/**
 * Get all slots for admin dashboard
 */
export async function getAllSlots(): Promise<AppsScriptResponse<Slot[]>> {
  return callAppsScript('getAllSlots');
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<AppsScriptResponse<{
  totalBookings: number;
  completed: number;
  noShows: number;
  feedbackSubmitted: number;
}>> {
  return callAppsScript('getAdminStats');
}

/**
 * Get all mentors
 */
export async function getAllMentors(): Promise<AppsScriptResponse<{
  mentor_id: string;
  name: string;
  email: string;
}[]>> {
  return callAppsScript('getAllMentors');
}

/**
 * Get all students
 */
export async function getAllStudents(): Promise<AppsScriptResponse<{
  student_id: string;
  name: string;
  email: string;
}[]>> {
  return callAppsScript('getAllStudents');
}

