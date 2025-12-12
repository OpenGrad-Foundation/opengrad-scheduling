'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Plus, Calendar, Clock } from 'lucide-react';
import SlotCard from '@/components/SlotCard';
import type { Slot, SlotCreationRequest } from '@/types';

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    duration: '30',
    topic: '',
    notes: '',
  });

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Wait for status to be fully determined (not 'loading')
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/mentor');
    }
  }, [status, router]);

  useEffect(() => {
    // Only fetch slots when we're sure the user is authenticated
    if (status === 'authenticated' && session?.user) {
      fetchMentorSlots();
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

  const fetchMentorSlots = async () => {
    if (!session?.user?.email) return;

    try {
      // TODO: Get mentor ID from session or API
      const mentorId = session.user.id || session.user.email;
      const response = await fetch(`/api/mentor/slots?mentorId=${mentorId}`, {
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

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setCreating(true);

    try {
      // Calculate end time from start time + duration
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const durationMinutes = parseInt(formData.duration);
      const totalMinutes = startHours * 60 + startMinutes + durationMinutes;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

      const slotData: SlotCreationRequest = {
        mentorEmail: session.user.email || '',
        mentorName: session.user.name || '',
        date: formData.startDate, // YYYY-MM-DD format
        start: formData.startTime, // HH:MM format
        end: endTime, // HH:MM format
      };

      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify(slotData),
      });

      if (response.ok) {
        const data = await response.json();
        setSlots([...slots, data.slot]);
        setShowCreateModal(false);
        setFormData({
          startDate: '',
          startTime: '',
          duration: '30',
          topic: '',
          notes: '',
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create slot');
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setCreating(false);
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

  const upcomingSlots = slots.filter(
    (slot) => slot.status !== 'CANCELLED' && new Date(`${slot.date}T${slot.end_time}`) > new Date()
  );
  const pastSlots = slots.filter((slot) => new Date(`${slot.date}T${slot.end_time}`) <= new Date());

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your interview slots</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Slot
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Slots</h2>
            {upcomingSlots.length === 0 ? (
              <p className="text-gray-500">No upcoming slots. Create one to get started!</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingSlots.map((slot) => (
                  <SlotCard key={slot.slot_id} slot={slot} />
                ))}
              </div>
            )}
          </section>

          {pastSlots.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Slots</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastSlots.map((slot) => (
                  <SlotCard key={slot.slot_id} slot={slot} />
                ))}
              </div>
            </section>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Slot</h2>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Technical Interview Prep"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional information..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create Slot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

