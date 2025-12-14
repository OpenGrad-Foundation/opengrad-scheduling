'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Download, Calendar, Users, BookOpen, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Booking, Slot } from '@/types';

export default function AdminDashboard() {
  const { isAdmin, isLoading } = useAuth(); // Will auto-redirect if not admin
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalBookings: 0,
    completed: 0,
    noShows: 0,
    feedbackSubmitted: 0,
  });

  useEffect(() => {
    if (!isLoading && isAdmin) {
      fetchData();
    }
  }, [isAdmin, isLoading]);

  const fetchData = async () => {
    try {
      // Fetch bookings and stats in parallel
      const [bookingsRes, statsRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/stats'),
      ]);

      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.data);
      } else {
        console.error('Failed to fetch bookings:', bookingsData.error);
        setBookings([]);
      }

      if (statsData.success) {
        setStats(statsData.data);
      } else {
        console.error('Failed to fetch stats:', statsData.error);
        setStats({
          totalBookings: 0,
          completed: 0,
          noShows: 0,
          feedbackSubmitted: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setBookings([]);
      setStats({
        totalBookings: 0,
        completed: 0,
        noShows: 0,
        feedbackSubmitted: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.mentor_name && booking.mentor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      booking.booking_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = [
      'Booking ID',
      'Slot ID',
      'Student Email',
      'Mentor Email',
      'Created At',
      'Status',
      'Feedback Sent',
      'Feedback Submitted',
      'Meet Link',
    ];
    const rows = bookings.map((b) => [
      b.booking_id,
      b.slot_id,
      b.student_email,
      b.mentor_email,
      b.created_at,
      b.status,
      b.feedback_sent,
      b.feedback_submitted,
      b.meet_link || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage all bookings and slots</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No Shows</p>
                <p className="text-2xl font-bold text-red-600">{stats.noShows}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Feedback Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalBookings > 0
                    ? Math.round((stats.feedbackSubmitted / stats.totalBookings) * 100)
                    : 0}
                  %
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search and Export */}
        {/* <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, booking ID, or slot ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
        </div> */}

        {/* Bookings Table */}
        {/* <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No bookings found. Connect to Apps Script to load data.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {booking.booking_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.student_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.mentor_name || booking.mentor_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(booking.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'no-show'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span
                            className={`${
                              booking.feedback_sent === 'Y' ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            Sent: {booking.feedback_sent === 'Y' ? '✓' : '✗'}
                          </span>
                          <span
                            className={`${
                              booking.feedback_submitted === 'Y'
                                ? 'text-green-600'
                                : 'text-gray-400'
                            }`}
                          >
                            Submitted: {booking.feedback_submitted === 'Y' ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {booking.meet_link && (
                          <a
                            href={booking.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Join
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
    </div>
  );
}