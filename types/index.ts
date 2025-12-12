// Core data types for the scheduling system

export type UserRole = 'mentor' | 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  timezone?: string;
  college?: string; // for students
  calendarId?: string; // for mentors
  createdAt: string;
}

export interface Mentor {
  mentor_id: string;
  name: string;
  email: string;
  timezone: string;
  display_name?: string;
  created_at: string;
  notes?: string;
  calendar_id?: string;
}

export interface Student {
  student_id: string;
  roll_number: string;
  name: string;
  email: string;
  college?: string;
  created_at: string;
  opt_in_notifications: 'Y' | 'N';
}

export interface Slot {
  slot_id: string;
  mentor_id: string;
  mentor_name?: string;
  date: string; // Date string (YYYY-MM-DD)
  start_time: string; // Time string (HH:MM or HH:MM AM/PM)
  end_time: string; // Time string (HH:MM or HH:MM AM/PM)
  status: 'OPEN' | 'BOOKED' | 'CANCELLED';
  booked_by?: string; // Student_ID
  student_id?: string;
  student_email?: string;
  meeting_link?: string;
  feedback_status_mentor?: 'PENDING' | 'DONE';
  feedback_status_student?: 'PENDING' | 'DONE';
  timestamp_created?: string;
  timestamp_booked?: string;
}

export interface Booking {
  booking_id: string;
  slot_id: string;
  mentor_id: string;
  student_id: string;
  student_email: string;
  mentor_email: string;
  meet_link?: string;
  calendar_event_id?: string;
  created_at: string;
  feedback_sent: 'Y' | 'N';
  feedback_submitted: 'Y' | 'N';
  status: 'confirmed' | 'completed' | 'no-show' | 'cancelled';
  notes?: string;
}

export interface Feedback {
  booking_id: string;
  student_rating?: number;
  mentor_rating?: number;
  free_text?: string;
  submitted_at?: string;
}

export interface BookingResponse {
  success: boolean;
  booking?: Booking;
  reason?: string;
  error?: string;
}

export interface SlotCreationRequest {
  mentorEmail: string;
  mentorName: string;
  date: string; // Date string (YYYY-MM-DD)
  start: string; // Time string (HH:MM)
  end: string; // Time string (HH:MM)
}

