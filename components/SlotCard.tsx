'use client';

import { format } from 'date-fns';
import { Calendar, Clock, User, BookOpen } from 'lucide-react';
import type { Slot } from '@/types';

interface SlotCardProps {
  slot: Slot;
  onBook?: (slotId: string) => void;
  isBooked?: boolean;
  isLoading?: boolean;
  mentorName?: string;
}

export default function SlotCard({
  slot,
  onBook,
  isBooked = false,
  isLoading = false,
  mentorName,
}: SlotCardProps) {
  // Parse date and time strings
  const slotDate = slot.date ? new Date(slot.date) : new Date();
  const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
  const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
  
  const startTime = new Date(slotDate);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(slotDate);
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  const isPast = endTime < new Date();
  
  // Calculate duration
  const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isBooked
          ? 'border-green-200 bg-green-50'
          : isPast
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : slot.status === 'OPEN'
          ? 'border-blue-200 bg-white hover:shadow-md'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-gray-900">
              {format(startTime, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
            <span className="text-sm text-gray-500">
              ({durationMins} min)
            </span>
          </div>
          {(mentorName || slot.mentor_name) && (
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{mentorName || slot.mentor_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                slot.status === 'OPEN'
                  ? 'bg-green-100 text-green-800'
                  : slot.status === 'BOOKED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {slot.status}
            </span>
          </div>
        </div>
        {slot.status === 'OPEN' && !isPast && onBook && (
          <button
            onClick={() => onBook(slot.slot_id)}
            disabled={isLoading}
            className="ml-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {isLoading ? 'Booking...' : 'Book Now'}
          </button>
        )}
        {isBooked && (
          <div className="ml-4 flex items-center gap-2 text-green-600">
            <span className="text-sm font-medium">Booked</span>
          </div>
        )}
      </div>
    </div>
  );
}

