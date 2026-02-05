import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-emerald-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="gradient-teal-green px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-teal-50 mt-2 opacity-90">Last updated: 10th January 2026</p>
        </div>
        
        <div className="p-8 max-w-none text-gray-600">
          <p className="text-lg mb-8">
            OpenGrad values your privacy. This Privacy Policy explains how we collect, use, and protect your information.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p>We may collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Role (mentor or student)</li>
              <li>Interview scheduling data (date, time, participants)</li>
              <li>Feedback form responses</li>
              <li>Calendar event metadata</li>
            </ul>
            <p className="mt-2 font-medium">We do not collect passwords.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>Your data is used only to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Schedule interviews</li>
              <li>Send calendar invites and notifications</li>
              <li>Collect interview feedback</li>
              <li>Improve platform functionality</li>
            </ul>
            <p className="mt-2">We do not sell or rent user data.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Google Services</h2>
            <p>
              The platform integrates with Google services (OAuth, Calendar, Forms). Access is limited strictly to what is required for scheduling and invites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Storage</h2>
            <p>
              Data is stored in Google Sheets and Google Forms associated with the platform. Access is restricted to authorized administrators.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies and Sessions</h2>
            <p>
              Authentication is handled using secure session cookies for login and access control. These are essential for platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Sharing</h2>
            <p>
              We do not share personal data with third parties except where required for core functionality (e.g., Google Calendar).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p>
              Data is retained only as long as necessary for operational and reporting purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p>
              You may request access, correction, or deletion of your data by contacting support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Security</h2>
            <p>
              We follow industry-standard security practices, but no system can guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated. Continued use of the platform implies acceptance of the revised policy.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
            <p>
              For privacy-related concerns, contact: <a href="mailto:sebbin@opengrad.in" className="text-teal-600 hover:underline">sebbin@opengrad.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
