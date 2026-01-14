import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-emerald-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="gradient-teal-green px-8 py-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
          </div>
          <p className="text-teal-50 mt-2 opacity-90">Last updated: 10th January 2026</p>
        </div>
        
        <div className="p-8 max-w-none text-gray-600">
          <p className="text-lg mb-8">
            Welcome to OpenGrad Scheduler. By accessing or using this platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the service.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Purpose of the Platform</h2>
            <p>
              OpenGrad Scheduler is a scheduling and coordination tool that enables interviewers and interviewees to book interview slots, receive calendar invites, and submit feedback.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. User Eligibility</h2>
            <p>
              You must be at least 18 years old or have permission from an authorized institution to use this platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide accurate and truthful information</li>
              <li>Attend scheduled sessions on time</li>
              <li>Use the platform only for lawful and intended purposes</li>
              <li>Not misuse, scrape, or attempt to disrupt the service</li>
            </ul>
            <p className="mt-4">
              Mentors are responsible for honoring confirmed slots. Students are responsible for attending booked interviews.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Scheduling and Cancellations</h2>
            <p>
              Interview slots are created by mentors and booked by students. Once confirmed, both parties are expected to attend. OpenGrad is not responsible for missed sessions, late arrivals, or disputes between users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Calendar and Email Communication</h2>
            <p>
              By using the platform, you consent to receiving transactional emails and calendar invitations related to interviews, feedback, and scheduling updates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p>
              OpenGrad is provided “as is”. We do not guarantee uninterrupted availability or error-free operation. OpenGrad is not liable for any direct or indirect damages arising from the use of the platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p>
              All platform content, branding, and software belong to OpenGrad unless otherwise stated. Users retain ownership of their submitted feedback and responses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate access if these terms are violated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p>
              These terms may be updated periodically. Continued use of the platform indicates acceptance of updated terms.
            </p>
          </section>

          <section className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <p>
              For questions or concerns, contact: <a href="mailto:sebbin@opengrad.in" className="text-teal-600 hover:underline">sebbin@opengrad.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
