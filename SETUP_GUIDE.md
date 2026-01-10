# Complete Setup Guide

This guide will walk you through setting up all the required services and environment variables for the OpenGrad Scheduling system.

## Prerequisites

- Node.js 20.9.0 or higher (already set up ✓)
- A Google account
- Access to Google Cloud Console

---

## Step 1: Set Up Google OAuth (For Mentors)

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Name it "OpenGrad Scheduling" (or any name you prefer)
5. Click **"Create"**

### 1.2 Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for and enable these APIs:
   - **Google Identity API** (or **Google+ API** - if Identity API is not available)
   - **Google Calendar API** (required for creating calendar events)
   - **Gmail API** (for sending emails)

### 1.3 Configure OAuth Consent Screen

**This step is required before creating OAuth credentials.**

1. Go to **APIs & Services > OAuth consent screen**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the OAuth consent screen form:
   - **App name**: "OpenGrad Scheduling"
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload a logo
   - **App domain**: (Optional) Leave blank for now
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `openid` (automatically added)
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/calendar` (for calendar access)
   - Click **"Update"** then **"Save and Continue"**
7. **Test users** (Step 3 - Only for testing):
   - Click **"+ ADD USERS"**
   - Add your Google email address (and any other test emails)
   - Click **"Save and Continue"**
8. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

**Important Notes:**
- In **testing mode**, only test users can sign in
- To make it available to all users, you'll need to submit for verification (not required for development)
- The consent screen will show "Testing" status - this is fine for development

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Configure the OAuth client:
   - **Application type**: Select **"Web application"**
   - **Name**: "OpenGrad Scheduling Web Client"
   - **Authorized JavaScript origins**: 
     - Click **"+ ADD URI"**
     - Add: `http://localhost:3000`
     - (For production, also add your production URL)
   - **Authorized redirect URIs**:
     - Click **"+ ADD URI"**
     - Add: `http://localhost:3000/api/auth/callback/google`
     - (For production, also add: `https://yourdomain.com/api/auth/callback/google`)
5. Click **"Create"**
6. **Important**: A popup will show your credentials:
   - **Client ID**: Copy this immediately (starts with something like `123456789-abc...`)
   - **Client Secret**: Copy this immediately (starts with `GOCSPX-...`)
   - ⚠️ **You won't be able to see the Client Secret again!** Save it securely.
7. Click **"OK"**

**Security Notes:**
- Never commit these credentials to version control
- Store them in `.env.local` (which is gitignored)
- For production, use environment variables in your hosting platform

---

## Step 2: Set Up Google Sheets & Apps Script

### 2.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "OpenGrad Scheduling"
4. **Copy the Sheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
   - The `SHEET_ID_HERE` is what you need

### 2.2 Create Required Sheets (Tabs)

Create these **3 sheets** in your spreadsheet:

#### Sheet 1: "Mentors"

**Purpose:** Store mentor information. When mentors create slots, the system references `Mentor_ID` instead of name/email directly.

**Header Row (Row 1):**
```
Mentor_ID | Mentor_Name | Mentor_Email
```

**Column Details:**
| Column | Example | Purpose |
|--------|---------|---------|
| Mentor_ID | MEN001 | Primary key - unique identifier |
| Mentor_Name | Raghav | Display name |
| Mentor_Email | raghav@gmail.com | For calendar invites |

**Example Data (Row 2):**
```
MEN001 | Raghav | raghav@gmail.com
```

---

#### Sheet 2: "Students"

**Purpose:** Store student information. When a student books a slot, the script attaches the `Student_ID` to the slot row.

**Header Row (Row 1):**
```
Student_ID | Student_Name | Student_Email
```

**Column Details:**
| Column | Example | Purpose |
|--------|---------|---------|
| Student_ID | STU001 | Unique ID for system lookups |
| Student_Name | Aishwarya Menon | Display name |
| Student_Email | aish@example.com | For sending invite + reminders |

**Example Data (Row 2):**
```
STU001 | Aishwarya Menon | aish@example.com
```

---

#### Sheet 3: "Slots" ⭐ (Most Important)

**Purpose:** This is where all the mapping happens. Contains slot availability and booking information.

**Header Row (Row 1):**
```
Slot_ID | Mentor_ID | Mentor_Name | Date | Start_Time | End_Time | Status | Booked_By | Student_ID | Student_Email | Meeting_Link | Feedback_Status_Mentor | Feedback_Status_Student | Timestamp_Created | Timestamp_Booked
```

**Column Details:**
| Column | Example | Purpose | Auto-filled? |
|--------|---------|---------|--------------|
| Slot_ID | SLOT001 | Unique internal ID | ✅ Yes (by Apps Script) |
| Mentor_ID | MEN001 | Lookup to Mentors sheet | ❌ No (input by mentor) |
| Mentor_Name | Raghav | Useful for UI | ✅ Optional (via formula) |
| Date | 2025-01-20 | Date of the slot | ❌ No (input by mentor) |
| Start_Time | 18:00 | Start time (HH:MM format) | ❌ No (input by mentor) |
| End_Time | 18:30 | End time (HH:MM format) | ❌ No (input by mentor) |
| Status | OPEN / BOOKED | UI display + booking logic | ✅ Yes (changes to BOOKED) |
| Booked_By | Aisha Kumar | Student name for reference | ✅ Yes (when booked) |
| Student_ID | STU043 | For meeting invite | ✅ Yes (when booked) |
| Student_Email | aish@example.com | For meeting invite | ✅ Yes (when booked) |
| Meeting_Link | https://meet.google.com/... | Google Meet link | ✅ Yes (when booked) |
| Feedback_Status_Mentor | PENDING / DONE | After meeting | ✅ Yes (set to PENDING) |
| Feedback_Status_Student | PENDING / DONE | After meeting | ✅ Yes (set to PENDING) |
| Timestamp_Created | 2025-01-15T10:00:00Z | Logs | ✅ Yes (when created) |
| Timestamp_Booked | 2025-01-15T11:00:00Z | For analysis | ✅ Yes (when booked) |

**Important Notes:**

1. **Mentor_Name Auto-fill (Optional):** In cell C2 (Mentor_Name column), add this formula to auto-populate:
   ```
   =IFERROR(VLOOKUP(B2,Mentors!A:C,2,FALSE),"")
   ```
   Then copy this formula down for all rows. This automatically fills the mentor name based on `Mentor_ID`.

2. **Status Values:**
   - `OPEN` - Slot is available for booking
   - `BOOKED` - Slot has been reserved by a student
   - `CANCELLED` - Slot was cancelled by mentor

3. **Feedback Status Values:**
   - `PENDING` - Feedback not yet submitted
   - `DONE` - Feedback has been submitted

4. **Date/Time Formats:**
   - **Date**: Use `YYYY-MM-DD` format (e.g., `2025-01-20`)
   - **Start_Time**: Use `HH:MM` format (e.g., `18:00` or `18:30`)
   - **End_Time**: Use `HH:MM` format (e.g., `18:30` or `19:00`)

5. **Auto-filled Fields:** When a student books a slot, the Apps Script automatically fills:
   - `Status` → `BOOKED`
   - `Booked_By` → Student_Name
   - `Student_ID` → Student_ID
   - `Student_Email` → Fetched from Students sheet
   - `Meeting_Link` → Generated Google Meet link
   - `Feedback_Status_Mentor` → `PENDING`
   - `Feedback_Status_Student` → `PENDING`
   - `Timestamp_Booked` → Current timestamp

**Example Data (Row 2 - Open Slot):**
```
SLOT001 | MEN001 | Raghav | 2025-01-20 | 18:00 | 18:30 | OPEN | | | | | PENDING | PENDING | 2025-01-15T10:00:00Z | 
```

**Example Data (Row 3 - Booked Slot):**
```
SLOT002 | MEN001 | Raghav | 2025-01-21 | 19:00 | 19:30 | BOOKED | STU001 | STU001 | aish@example.com | https://meet.google.com/abc-defg-hij | PENDING | PENDING | 2025-01-15T10:05:00Z | 2025-01-15T11:00:00Z
```

**Setting Up Mentor_Name Auto-fill (Recommended):**

To automatically populate the `Mentor_Name` column based on `Mentor_ID`:

1. In the Slots sheet, click on cell **C2** (Mentor_Name column, first data row)
2. Enter this formula:
   ```
   =IFERROR(VLOOKUP(B2,Mentors!A:C,2,FALSE),"")
   ```
3. Press Enter
4. The formula will look up the Mentor_ID (column B) in the Mentors sheet and return the Mentor_Name
5. Copy this cell (Ctrl+C / Cmd+C)
6. Select all cells in column C from row 2 down to as many rows as you expect to have slots
7. Paste (Ctrl+V / Cmd+V)
8. The formula will automatically adjust for each row

This way, whenever you add a new slot with a `Mentor_ID`, the `Mentor_Name` will automatically populate!

### 2.3 Set Up Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any default code
3. Open the file `apps-script/Code.gs` from this project
4. Copy all the code
5. Paste it into the Apps Script editor
6. **Update line 13** - Replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID
7. Click **Save** (💾 icon or Ctrl+S / Cmd+S)
8. Name the project "OpenGrad Scheduling Backend"

### 2.4 Deploy Apps Script as Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Configure:
   - **Description**: "OpenGrad Scheduling API"
   - **Execute as**: "Me" (your account)
   - **Who has access**: "Anyone" (for development) or "Anyone with Google account" (more secure)
5. Click **"Deploy"**
6. **Copy the Web app URL** - you'll need this for `.env.local`
7. Click **"Done"**

### 2.5 Grant Permissions

1. When you first use the web app, Google will ask for permissions
2. Click **"Review Permissions"**
3. Select your Google account
4. Click **"Advanced"** > **"Go to [Project Name] (unsafe)"**
5. Click **"Allow"** to grant:
   - Google Sheets access
   - Google Calendar access (to create events)
   - Gmail access (to send emails)

---

## Step 3: Configure Environment Variables

### 3.1 Generate NEXTAUTH_SECRET

Open your terminal and run:

```bash
openssl rand -base64 32
```

Copy the output - this is your `NEXTAUTH_SECRET`.

### 3.2 Update .env.local

Open `.env.local` in your project and update it with your values:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-your-generated-secret-here

# Google OAuth (from Step 1.3)
GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here

# Apps Script Web App URL (from Step 2.4)
NEXT_PUBLIC_APPS_SCRIPT_URL=paste-your-web-app-url-here

# Admin Credentials
ADMIN_ID=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password
```

**Example:**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=LZfthEeH/2bLpgH/Ebepi36Ie9e9L1KcN91/DcbB4tk=

GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycby123456789/exec

# Admin Credentials
ADMIN_ID=admin
ADMIN_PASSWORD=secure-admin-password-123
```

### 3.3 Restart the Dev Server

After updating `.env.local`, restart your dev server:

```bash
# Stop the current server (Ctrl+C in the terminal where it's running)
# Then restart:
npm run dev
```

---

## Step 4: Test the Setup

### 4.1 Add Test Data

1. Open your Google Sheet
2. In the **Mentors** sheet, add a test mentor:
   ```
   MEN001 | Raghav | raghav@gmail.com
   ```
3. In the **Students** sheet, add a test student:
   ```
   STU001 | Aishwarya Menon | aish@example.com
   ```
4. (Optional) In the **Slots** sheet, you can manually add a test slot, or create one through the mentor dashboard after signing in.

### 4.2 Test Authentication

#### Test Google OAuth (Mentor)

1. Go to http://localhost:3000
2. Click the **"Mentor"** tab
3. Click **"Continue with Google (Mentor)"**
4. You should be redirected to Google's sign-in page
5. **Important**: Use a Google account that you added as a test user in Step 1.3
6. Sign in with your Google account
7. Grant permissions when prompted:
   - The app will request access to your email, profile, and calendar
   - Click **"Allow"** or **"Continue"**
8. You should be redirected back to the app
9. Verify you're signed in:
   - Check that you can see the Mentor Dashboard
   - Your email should appear in the navigation
   - You should have access to create slots

**Troubleshooting OAuth:**
- If you see "Access blocked", make sure your email is in the test users list
- If redirect fails, check the redirect URI matches exactly
- Check browser console (F12) for any errors
- Verify `.env.local` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

#### Test Student Authentication

1. Click the **"Student"** tab
2. Enter:
   - **Roll Number**: Use any identifier (e.g., `STU001` or `ROLL123`)
   - **Email**: Use any valid email format (e.g., `aish@example.com`)
3. Click **"Sign In as Student"**
4. You should be redirected to the Student Dashboard
5. Verify you can see available slots

**Note**: The system accepts any valid email format for student authentication. In production, you may want to validate against your Students sheet.

### 4.3 Test Booking Flow

1. **As a mentor:**
   - Sign in with Google OAuth
   - Go to Mentor Dashboard
   - Click "Create Slot"
   - Fill in:
     - Date: Select a future date (e.g., `2025-01-20`)
     - Start Time: Enter time (e.g., `18:00`)
     - Duration: Select duration (e.g., 30 minutes)
   - Click "Create Slot"
   - Verify the slot appears in your Google Sheet with `Status = OPEN`

2. **As a student:**
   - Sign in with roll number and email
   - Go to Student Dashboard
   - You should see the slot you just created
   - Click "Book Now" on the slot
   - Wait for confirmation

3. **Verify in Google Sheet:**
   - Check the Slots sheet
   - The slot should now have:
     - `Status = BOOKED`
     - `Booked_By = STU001` (or your student ID)
     - `Student_ID` and `Student_Email` filled in
     - `Meeting_Link` with a Google Meet URL
     - `Timestamp_Booked` with the booking time

4. **Check Email:**
   - Both student and mentor should receive emails with:
     - HTML formatted confirmation
     - Google Meet link
     - Calendar invite attachment (.ics file)
   - Check spam folder if emails don't arrive

---

## Troubleshooting

### "Apps Script URL not configured"
- Check that `NEXT_PUBLIC_APPS_SCRIPT_URL` is set in `.env.local`
- Make sure the URL is correct and the web app is deployed
- Restart the dev server after updating `.env.local`

### "Unauthorized" errors when signing in
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env.local`
- Check that the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/api/auth/callback/google`
- Make sure `NEXTAUTH_SECRET` is set and properly formatted
- Verify you're using a test user email (if in testing mode)
- Check browser console for detailed error messages
- Ensure the OAuth consent screen is properly configured

### OAuth 2.0 specific issues

**"Access blocked: This app's request is invalid"**
- Check that your email is added as a test user in OAuth consent screen
- Verify the OAuth consent screen is in "Testing" mode (for development)

**"redirect_uri_mismatch" error**
- Verify the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or typos
- Make sure you're using `http://` not `https://` for localhost

**"invalid_client" error**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check for extra spaces or quotes in `.env.local`
- Restart the dev server after updating `.env.local`

**OAuth flow redirects but doesn't sign in**
- Check browser console for errors
- Verify `NEXTAUTH_SECRET` is set
- Check that cookies are enabled in your browser
- Try clearing browser cookies and cache
- Verify the session callback is working (check server logs)

### Calendar events not creating
- Ensure Apps Script has Calendar permissions (check Step 2.5)
- Verify the script owner's calendar is accessible
- Check Apps Script execution logs: **Executions** tab in Apps Script

### Emails not sending
- Check Gmail permissions in Apps Script
- Verify email addresses are valid
- Check Apps Script execution logs for errors

### Student authentication not working
- Make sure you're using the "Student" tab on the sign-in page
- Verify roll number and email are entered correctly
- Check browser console for errors

---

## Quick Reference

| Variable | Where to Get It |
|----------|----------------|
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console > Credentials > OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console > Credentials > OAuth 2.0 Client ID |
| `NEXT_PUBLIC_APPS_SCRIPT_URL` | Apps Script > Deploy > Web app > Copy URL |
| Sheet ID | From Google Sheets URL (between `/d/` and `/edit`) |

---

## How the System Works

### Flow Overview

1. **Mentor Creates Slot:**
   - Frontend sends: `mentor_id`, `date`, `start_time`, `end_time`
   - Apps Script creates new row in Slots sheet with `Status = OPEN`

2. **Student Views Slots:**
   - Frontend filters: `Status == 'OPEN'` and `Date >= today()`
   - Slots are displayed grouped by mentor

3. **Student Books Slot:**
   - Frontend sends: `slot_id`, `student_id`
   - Apps Script updates Slots row:
     - `Status` → `BOOKED`
     - `Booked_By` → Student_ID
     - `Student_ID` and `Student_Email` → Auto-filled
     - `Meeting_Link` → Generated
     - `Timestamp_Booked` → Current time
   - Calendar event created with Google Meet
   - Emails sent to both student and mentor with calendar invite

4. **After Meeting:**
   - Update `Feedback_Status_Mentor` and `Feedback_Status_Student` to `DONE`
   - This can be done manually or via a feedback form system

---

## Next Steps

1. ✅ Set up Google OAuth credentials
2. ✅ Create Google Sheets with 3 tabs (Mentors, Students, Slots)
3. ✅ Add the VLOOKUP formula for Mentor_Name (optional but recommended)
4. ✅ Deploy Apps Script as web app
5. ✅ Update `.env.local` with all values
6. ✅ Restart dev server
7. ✅ Add test data to Sheets
8. ✅ Test the complete booking flow

Your app should now be fully functional! 🎉

For detailed information about the sheet structure and mapping, see `SHEET_STRUCTURE.md`.

---

## OAuth 2.0 Verification Checklist

Before testing, verify all these items are configured:

### Google Cloud Console Setup
- [ ] Google Cloud project created
- [ ] Google Identity API enabled
- [ ] Google Calendar API enabled
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added to OAuth consent screen
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized JavaScript origin: `http://localhost:3000`
- [ ] Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Environment Variables
- [ ] `NEXTAUTH_URL=http://localhost:3000` set in `.env.local`
- [ ] `NEXTAUTH_SECRET` generated and set (32+ character string)
- [ ] `GOOGLE_CLIENT_ID` copied from Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` copied from Google Cloud Console
- [ ] No extra spaces or quotes around values in `.env.local`
- [ ] Dev server restarted after updating `.env.local`

### Testing
- [ ] Can access sign-in page at http://localhost:3000
- [ ] Google OAuth button visible for mentors
- [ ] Can click "Continue with Google" without errors
- [ ] Redirected to Google sign-in page
- [ ] Can sign in with test user account
- [ ] Permissions granted successfully
- [ ] Redirected back to app after sign-in
- [ ] Session persists (can refresh page and stay signed in)
- [ ] Can access mentor dashboard after OAuth sign-in
- [ ] User role is correctly set to "mentor"

### Common Issues to Check
- [ ] Browser cookies enabled
- [ ] No ad blockers interfering with OAuth flow
- [ ] Using correct test user email
- [ ] OAuth consent screen in "Testing" mode
- [ ] Redirect URI matches exactly (no trailing slash)
- [ ] Client ID and Secret are correct (no typos)

---

## Production Deployment Considerations

When deploying to production, update these settings:

### Google Cloud Console
1. **OAuth Consent Screen:**
   - Submit for verification (if making public)
   - Or keep in testing mode and add all user emails as test users
   - Update app domain and privacy policy URLs

2. **OAuth Credentials:**
   - Add production URL to Authorized JavaScript origins:
     - `https://yourdomain.com`
   - Add production redirect URI:
     - `https://yourdomain.com/api/auth/callback/google`

### Environment Variables
Update your production environment variables:
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APPS_SCRIPT_URL=your-apps-script-url
```

### Security Best Practices
- Use strong, unique `NEXTAUTH_SECRET` for production
- Never commit `.env.local` or production secrets to version control
- Use environment variables in your hosting platform (Vercel, Netlify, etc.)
- Enable HTTPS in production (required for OAuth)
- Regularly rotate secrets and credentials
- Monitor OAuth usage and errors

