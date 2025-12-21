# OpenGrad Scheduling

A lightweight, reliable scheduling system for mentor-mentee interview sessions built with Next.js and Google Sheets + Apps Script.

## Features

- ✅ **Mentor Dashboard**: Create and manage availability slots
- ✅ **Student Booking**: Real-time slot viewing and fastest-finger booking
- ✅ **Atomic Booking**: Prevents double-booking with Apps Script locking
- ✅ **Auto Calendar**: Automatic Google Calendar events with Meet links
- ✅ **Feedback System**: Post-session feedback forms
- ✅ **Admin Dashboard**: Monitor bookings and system health

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: Google Apps Script (Google Sheets API, Calendar API, Gmail API)
- **Authentication**: NextAuth.js with Google OAuth
- **Data Storage**: Google Sheets

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- Google account with access to:
  - Google Sheets
  - Google Calendar
  - Gmail (for sending emails)

### Installation

1. **Clone and install dependencies:**

```bash
cd opengrad-scheduling
npm install
```

2. **Set up Google Sheets:**

Follow the detailed guide in [`docs/SHEETS_SETUP.md`](./docs/SHEETS_SETUP.md) to:
- Create the required Google Sheets
- Set up Apps Script
- Deploy as a web app
- Configure permissions

3. **Set up Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable **Google+ API** and **Google Calendar API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret

4. **Configure environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APPS_SCRIPT_URL=your-apps-script-web-app-url
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

5. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
opengrad-scheduling/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth routes
│   │   ├── bookings/       # Booking endpoints
│   │   └── slots/          # Slot endpoints
│   ├── admin/              # Admin dashboard
│   ├── mentor/             # Mentor dashboard
│   ├── student/            # Student booking interface
│   └── auth/               # Authentication pages
├── components/             # React components
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
├── apps-script/            # Google Apps Script code
├── docs/                   # Documentation
└── public/                 # Static assets
```

## Usage

### For Students

1. Sign in with Google
2. Browse available slots on the student dashboard
3. Click "Book Now" on a slot (first-come-first-served)
4. Receive confirmation with Google Meet link
5. Add event to calendar
6. Submit feedback after the session

### For Mentors

1. Sign in with Google
2. Go to Mentor Dashboard
3. Click "Create Slot" to add availability
4. View your upcoming and past slots
5. Manage bookings and cancellations

### For Admins

1. Navigate to `/admin` (redirects to signin if not authenticated)
2. Enter admin credentials (configured in environment variables)
3. Access Admin Dashboard at `/admin/dashboard`
4. Monitor all bookings
5. Search and filter bookings
6. Export data to CSV
7. View system metrics

## API Endpoints

### Frontend → Apps Script

All API calls go through Next.js API routes which proxy to Apps Script:

- `GET /api/slots` - Get all open slots
- `POST /api/slots` - Create a new slot (mentor)
- `POST /api/bookings` - Book a slot (student)
- `GET /api/bookings?studentId=...` - Get student's bookings
- `GET /api/mentor/slots?mentorId=...` - Get mentor's slots

### Apps Script Functions

- `getOpenSlots()` - Returns all open slots
- `bookSlot(slotId, studentId, studentName, studentEmail)` - Atomic booking
- `createSlot(parameters)` - Create new slot
- `getMentorSlots(mentorId)` - Get mentor's slots
- `cancelSlot(slotId, mentorId)` - Cancel a slot
- `getBooking(bookingId)` - Get booking details
- `getStudentBookings(studentId)` - Get student's bookings

## Security Considerations

- Apps Script web app should validate requests (add HMAC or API key)
- Restrict access to admin dashboard (implement role-based access)
- Store minimal PII in Sheets
- Use environment variables for all secrets
- Enable HTTPS in production

## Performance

- Booking endpoint uses Apps Script `LockService` for atomic operations
- Frontend polls for slots every 10 seconds
- Consider caching for high-traffic scenarios
- Apps Script has rate limits (see [Quotas](https://developers.google.com/apps-script/guides/services/quotas))

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## Monitoring

- Check Apps Script execution logs: **Apps Script > Executions**
- Monitor Google Sheets for data integrity
- Set up error tracking (Sentry, LogRocket, etc.)
- Track booking success rate and feedback submission rate

## Troubleshooting

### "Apps Script URL not configured"
- Check `.env.local` has `NEXT_PUBLIC_APPS_SCRIPT_URL`
- Verify the URL is correct and the web app is deployed

### "Unauthorized" errors
- Check Google OAuth credentials
- Verify redirect URIs match
- Check NextAuth secret is set

### Booking fails with "already_booked"
- This is expected behavior when multiple users try to book the same slot
- The first successful booking wins
- User should try another slot

### Calendar events not created
- Check Apps Script has Calendar permissions
- Verify the script owner's calendar is accessible
- Check execution logs for errors

## Roadmap

- [ ] Migrate to Firestore for better scalability
- [ ] Add SMS/WhatsApp reminders
- [ ] Implement booking quotas
- [ ] Add video recording integration
- [ ] Mentor rating and matching algorithm
- [ ] Mobile app (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [documentation](./docs/)
- Review Apps Script execution logs
- Open an issue on GitHub

---

Built with ❤️ for OpenGrad
