'use client';

import { X, Calendar, Video, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Booking, Slot } from '@/types';

interface BookingModalProps {
  booking: Booking;
  slot: Slot;
  mentorName?: string;
  onClose: () => void;
}

export default function BookingModal({
  booking,
  slot,
  mentorName,
  onClose,
}: BookingModalProps) {
  // Combine date and time strings to create proper Date objects
  const startTime = new Date(`${slot.date} ${slot.start_time}`);
  const endTime = new Date(`${slot.date} ${slot.end_time}`);

  const addToCalendar = () => {
    // Create Google Calendar link
    const start = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`Interview: ${mentorName || 'Mentor'}`);
    const details = encodeURIComponent(
      `Interview session with ${mentorName || 'mentor'}\n\nMeet Link: ${booking.meet_link || ''}`
    );
    const location = encodeURIComponent(booking.meet_link || '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Your booking has been confirmed</span>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                <p className="text-gray-900">
                  {format(startTime, 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </p>
              </div>
              {mentorName && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Mentor:</span>
                  <p className="text-gray-900">{mentorName}</p>
                </div>
              )}
              {booking.meet_link && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Meet Link:</span>
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-800 mt-1"
                  >
                    <Video className="h-4 w-4" />
                    <span className="break-all">{booking.meet_link}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            {booking.meet_link && (
              <button
                onClick={addToCalendar}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-teal-green px-4 py-2 text-white hover:opacity-90 transition-opacity shadow-md"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

