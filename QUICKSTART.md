# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Google Sheets

1. Create a new Google Sheet
2. Follow the guide in `docs/SHEETS_SETUP.md` to create the required sheets
3. Copy the Sheet ID from the URL

## 3. Set Up Apps Script

1. Open the sheet → Extensions → Apps Script
2. Copy the code from `apps-script/Code.gs`
3. Update `SHEET_ID` constant
4. Deploy as Web App (Deploy → New deployment → Web app)
5. Copy the Web App URL

## 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

## 5. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXTAUTH_SECRET`: Run `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `NEXT_PUBLIC_APPS_SCRIPT_URL`: From Apps Script deployment

## 6. Run the App

```bash
npm run dev
```

Visit http://localhost:3000

## Next Steps

- Add test data to Google Sheets (mentors, students, slots)
- Test the booking flow
- Set up feedback form (optional)
- Configure time-driven triggers in Apps Script

For detailed setup, see `docs/SHEETS_SETUP.md`
