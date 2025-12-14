'use client';

import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Mentor } from '@/types';

export default function AdminMentorsPage() {
  const { isAdmin, isLoading } = useAuth(); // Will auto-redirect if not admin
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isLoading && isAdmin) {
      fetchMentors();
    }
  }, [isAdmin, isLoading]);

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/admin/mentors');
      const result = await response.json();

      if (result.success) {
        setMentors(result.data);
      } else {
        console.error('Failed to fetch mentors:', result.error);
        setMentors([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // useAuth hook handles redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 h-8 w-8 text-blue-600" />
            Mentors Management
          </h1>
          <p className="mt-2 text-gray-600">View and manage all mentors in the system</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search mentors by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mentors</p>
                <p className="text-2xl font-bold text-gray-900">{mentors.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mentors Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading mentors...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.mentor_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {mentor.mentor_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {mentor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentor.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMentors.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No mentors found matching your search.' : 'No mentors found.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}