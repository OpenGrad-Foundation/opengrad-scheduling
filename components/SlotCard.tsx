'use client';

import { format } from 'date-fns';
import { Calendar, Clock, User, BookOpen, Video } from 'lucide-react';
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
  // DEBUG: Log slot data
  console.log('SlotCard rendering slot:', slot.slot_id, 'end_date:', slot.end_date);
  
  // Parse date and time strings
  const slotDate = slot.date ? new Date(slot.date) : new Date();
  const endDate = slot.end_date ? new Date(slot.end_date) : slotDate;
  const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
  const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
  
  const startTime = new Date(slotDate);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(endDate);
  endTime.setHours(endHours, endMinutes, 0, 0);
  
  const isPast = endTime < new Date();
  const isMultiDay = slot.end_date && slot.end_date !== slot.date;
  
  // DEBUG: Log multi-day detection
  console.log('SlotCard:', slot.slot_id, 'isMultiDay:', isMultiDay, 'end_date:', slot.end_date, 'date:', slot.date);
  
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
          ? 'border-teal-200 bg-white hover:shadow-md'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-semibold text-gray-900">
              {(() => {
                const dateText = isMultiDay
                  ? `${format(startTime, 'MMM d')} - ${format(endTime, 'MMM d, yyyy')}`
                  : format(startTime, 'MMM d, yyyy');
                console.log('SlotCard date display:', slot.slot_id, 'isMultiDay:', isMultiDay, 'dateText:', dateText);
                return dateText;
              })()}
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
          {slot.topic && (
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700 text-sm"><strong>Topic:</strong> {slot.topic}</span>
            </div>
          )}
          {slot.notes && (
            <div className="mb-2">
              <p className="text-gray-600 text-sm"><strong>Notes:</strong> {slot.notes}</p>
            </div>
          )}
          {slot.meeting_link && (slot.status === 'BOOKED' || isBooked) && (
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-4 w-4 text-teal-600" />
              <a
                href={slot.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-800 hover:underline text-sm font-medium break-all"
              >
                Join Google Meet
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                slot.status === 'OPEN'
                  ? 'bg-green-100 text-green-800'
                  : slot.status === 'BOOKED'
                  ? 'bg-teal-100 text-teal-800'
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
            className="ml-4 flex items-center gap-2 rounded-lg gradient-teal-green px-4 py-2 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md"
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

