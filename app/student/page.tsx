'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SlotCard from '@/components/SlotCard';
import BookingModal from '@/components/BookingModal';
import type { Slot, Booking } from '@/types';

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    booking: Booking;
    slot: Slot;
  } | null>(null);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Wait for status to be fully determined (not 'loading')
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/student');
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch slots when we're sure the user is authenticated
    if (status === 'authenticated' && session?.user) {
      fetchSlots();
      // Refresh slots every 10 seconds
      const interval = setInterval(fetchSlots, 10000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

  // Show loading state while checking authentication (after ALL hooks)
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots', {
        credentials: 'include', // Send cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      } else if (response.status === 401) {
        // Session expired or not authenticated
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

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
          // Refresh slots to update status
          fetchSlots();
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const openSlots = slots.filter(
    (slot) => slot.status === 'OPEN' && new Date(`${slot.date}T${slot.end_time}`) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Interview Slots</h1>
          <p className="mt-2 text-gray-600">
            Book a slot with a mentor. First come, first served!
          </p>
        </div>

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

