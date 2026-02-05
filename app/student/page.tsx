'use client';

import { useState, useEffect, useCallback } from 'react';
import SlotCard from '@/components/SlotCard';
import BookingModal from '@/components/BookingModal';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Slot, Booking } from '@/types';

export default function StudentDashboard() {
  const { session, isLoading } = useAuth({ requiredRole: 'student' });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    booking: Booking;
    slot: Slot;
  } | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/slots', {
        credentials: 'include', // Send cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      } else if (response.status === 401) {
        // Session expired - auth hook will handle redirect
        console.warn('Session expired while fetching slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!session?.user) return;

    try {
      const studentId = session.user.rollNumber || session.user.id || session.user.email;
      if (!studentId) {
        setBookingsLoading(false);
        return;
      }

      const response = await fetch(`/api/bookings?studentId=${encodeURIComponent(studentId)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Convert bookings (which are slots) to Slot format
        const bookingSlots: Slot[] = (data.bookings || []).map((booking: any) => ({
          slot_id: booking.slot_id,
          mentor_id: booking.mentor_id,
          mentor_name: booking.mentor_name || '',
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: 'BOOKED' as const,
          student_id: booking.student_id,
          student_email: booking.student_email,
          meeting_link: booking.meeting_link || '',
          feedback_status_mentor: booking.feedback_status_mentor || 'PENDING',
          feedback_status_student: booking.feedback_status_student || 'PENDING',
          topic: booking.topic || '',
          notes: booking.notes || '',
          timestamp_booked: booking.timestamp_booked || '',
        }));
        setBookings(bookingSlots);
      } else if (response.status === 401) {
        console.warn('Session expired while fetching bookings');
      } else {
        console.error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    // Only fetch slots and bookings when we're sure the user is authenticated
    if (!isLoading && session?.user) {
      fetchSlots();
      fetchBookings();
      // Refresh slots every 10 seconds
      const interval = setInterval(() => {
        fetchSlots();
        fetchBookings();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isLoading, session, fetchSlots, fetchBookings]);

  // Show loading state while checking authentication (after ALL hooks)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBook = async (slotId: string) => {
    if (!session?.user) return;

    setBookingSlotId(slotId);
    setBookingLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify({
          slotId,
          studentId: session.user.id || session.user.email,
          studentName: session.user.name || '',
          studentEmail: session.user.email || '',
          rollNumber: session.user.rollNumber || session.user.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.booking) {
        const bookedSlot = slots.find((s) => s.slot_id === slotId);
        if (bookedSlot) {
          setConfirmedBooking({
            booking: data.booking,
            slot: bookedSlot,
          });
          // Refresh slots and bookings to update status
          fetchSlots();
          fetchBookings();
        }
      } else {
        alert(data.error || data.reason || 'Failed to book slot. It may have been taken.');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('An error occurred while booking. Please try again.');
    } finally {
      setBookingLoading(false);
      setBookingSlotId(null);
    }
  };

  if (loading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const openSlots = slots.filter((slot) => {
    if (slot.status !== 'OPEN') return false;
    
    // For midnight-spanning slots, use end_date + end_time
    // For same-day slots, use date + end_time
    const endDate = slot.end_date || slot.date;
    const endDateTime = new Date(`${endDate}T${slot.end_time}`);
    return endDateTime > new Date();
  });

  // Separate upcoming and past bookings
  const now = new Date();
  const upcomingBookings = bookings.filter((slot) => {
    // For midnight-spanning slots, use end_date + end_time
    // For same-day slots, use date + end_time
    const endDate = slot.end_date || slot.date;
    const endDateTime = new Date(`${endDate}T${slot.end_time}`);
    return endDateTime > now;
  });
  const pastBookings = bookings.filter((slot) => {
    // For midnight-spanning slots, use end_date + end_time
    // For same-day slots, use date + end_time
    const endDate = slot.end_date || slot.date;
    const endDateTime = new Date(`${endDate}T${slot.end_time}`);
    return endDateTime <= now;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Book sessions, view your upcoming interviews, and review past sessions
          </p>
        </div>

        <div className="space-y-12">
          {/* Upcoming Booked Sessions */}
          {upcomingBookings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                My Upcoming Sessions
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingBookings.map((slot) => (
                  <SlotCard
                    key={slot.slot_id}
                    slot={slot}
                    isBooked={true}
                    mentorName={slot.mentor_name}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Available Slots */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Available Interview Slots
            </h2>
            <p className="text-gray-600 mb-4">
              Book a slot with a mentor. First come, first served!
            </p>
            {openSlots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No open slots available at the moment.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Check back soon or contact an admin.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {openSlots.map((slot) => (
                  <SlotCard
                    key={slot.slot_id}
                    slot={slot}
                    onBook={handleBook}
                    isLoading={bookingSlotId === slot.slot_id && bookingLoading}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Past Sessions */}
          {pastBookings.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Past Sessions
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastBookings.map((slot) => (
                  <SlotCard
                    key={slot.slot_id}
                    slot={slot}
                    isBooked={true}
                    mentorName={slot.mentor_name}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {confirmedBooking && (
          <BookingModal
            booking={confirmedBooking.booking}
            slot={confirmedBooking.slot}
            onClose={() => setConfirmedBooking(null)}
          />
        )}
      </div>
    </div>
  );
}

