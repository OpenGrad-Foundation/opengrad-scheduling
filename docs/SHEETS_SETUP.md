# Google Sheets Setup Guide

This guide will help you set up the Google Sheets backend for the OpenGrad Scheduling system.

## Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "OpenGrad Scheduling"
4. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)

## Step 2: Create the Required Sheets

Create the following sheets (tabs) in your spreadsheet:

### Sheet 1: Mentors

Create a sheet named `Mentors` with the following columns (in order):

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | mentor_id | Text (UUID) | Unique identifier for mentor |
| B | name | Text | Mentor's full name |
| C | email | Text | Mentor's email address |
| D | timezone | Text | Timezone (e.g., "Asia/Kolkata", "America/New_York") |
| E | display_name | Text | Optional display name |
| F | created_at | DateTime | Timestamp when mentor was added |
| G | notes | Text | Optional notes about the mentor |
| H | calendar_id | Text | Optional Google Calendar ID |

**Header Row:**
```
mentor_id | name | email | timezone | display_name | created_at | notes | calendar_id
```

### Sheet 2: Students

Create a sheet named `Students` with the following columns:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | student_id | Text (UUID) | Unique identifier for student |
| B | name | Text | Student's full name |
| C | email | Text | Student's email address |
| D | college | Text | Optional college/university name |
| E | created_at | DateTime | Timestamp when student was added |
| F | opt_in_notifications | Text | "Y" or "N" |

**Header Row:**
```
student_id | name | email | college | created_at | opt_in_notifications
```

### Sheet 3: Slots

Create a sheet named `Slots` with the following columns:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | slot_id | Text (UUID) | Unique identifier for slot |
| B | mentor_id | Text | Reference to mentor_id in Mentors sheet |
| C | start_time | DateTime (ISO) | Slot start time in ISO format |
| D | end_time | DateTime (ISO) | Slot end time in ISO format |
| E | duration_mins | Number | Duration in minutes |
| F | status | Text | "open", "booked", or "cancelled" |
| G | created_at | DateTime | Timestamp when slot was created |
| H | max_bookings | Number | Maximum bookings (default: 1) |
| I | topic | Text | Optional topic/description |
| J | notes | Text | Optional notes |
| K | booking_id | Text | Reference to booking_id when booked |

**Header Row:**
```
slot_id | mentor_id | start_time | end_time | duration_mins | status | created_at | max_bookings | topic | notes | booking_id
```

### Sheet 4: Bookings

Create a sheet named `Bookings` with the following columns:

| Column | Name | Type | Description |
|--------|------|------|-------------|
| A | booking_id | Text (UUID) | Unique identifier for booking |
| B | slot_id | Text | Reference to slot_id in Slots sheet |
| C | mentor_id | Text | Reference to mentor_id |
| D | student_id | Text | Reference to student_id in Students sheet |
| E | student_email | Text | Student's email |
| F | mentor_email | Text | Mentor's email |
| G | meet_link | Text | Google Meet link (if available) |
| H | calendar_event_id | Text | Google Calendar event ID |
| I | created_at | DateTime | Timestamp when booking was created |
| J | feedback_sent | Text | "Y" or "N" |
| K | feedback_submitted | Text | "Y" or "N" |
| L | status | Text | "confirmed", "completed", "no-show", or "cancelled" |
| M | notes | Text | Optional notes |

**Header Row:**
```
booking_id | slot_id | mentor_id | student_id | student_email | mentor_email | meet_link | calendar_event_id | created_at | feedback_sent | feedback_submitted | status | notes
```

## Step 3: Set Up Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete the default `myFunction` code
3. Copy the contents of `apps-script/Code.gs` from this project
4. Update the `SHEET_ID` constant at the top with your Sheet ID
5. Save the script (Ctrl+S or Cmd+S)
6. Name your project "OpenGrad Scheduling Backend"

## Step 4: Deploy as Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "OpenGrad Scheduling API"
   - **Execute as**: "Me" (your account)
   - **Who has access**: "Anyone" (or "Anyone with Google account" for more security)
4. Click **Deploy**
5. Copy the **Web app URL** - you'll need this for your `.env` file

## Step 5: Set Up Permissions

1. When you first run the script, Google will ask for permissions
2. Click **Review Permissions**
3. Choose your Google account
4. Click **Advanced > Go to [Project Name] (unsafe)**
5. Click **Allow** to grant permissions for:
   - Google Sheets (read/write)
   - Google Calendar (create events)
   - Gmail (send emails)

## Step 6: Set Up Time-Driven Trigger (Optional)

To automatically send feedback forms after sessions:

1. In Apps Script, click **Triggers** (clock icon) in the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Function to run**: `sendFeedbackForms`
   - **Event source**: "Time-driven"
   - **Type**: "Minutes timer"
   - **Interval**: "Every 5 minutes"
4. Click **Save**

## Step 7: Create Feedback Form (Optional)

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form
3. Add fields:
   - **booking_id** (pre-populated via URL parameter)
   - **student_rating** (1-5 scale)
   - **mentor_rating** (1-5 scale)
   - **free_text** (paragraph text)
4. In form settings, enable "Collect email addresses"
5. Link the form to your spreadsheet (Responses tab > Link to Sheets)
6. Update the `feedbackUrl` in `sendFeedbackForms()` function with your form URL

## Step 8: Test the Setup

1. Add a test mentor row in the Mentors sheet
2. Add a test student row in the Students sheet
3. Use the Apps Script editor to test functions:
   - Run `createSlot` with test data
   - Run `getOpenSlots` to verify it works
   - Run `bookSlot` with test data

## Troubleshooting

### "Sheet not found" errors
- Verify sheet names match exactly (case-sensitive): `Mentors`, `Students`, `Slots`, `Bookings`
- Check that the SHEET_ID constant is correct

### Calendar events not creating
- Ensure the script has Calendar permissions
- Check that the default calendar is accessible
- Verify time format is correct (ISO format)

### Emails not sending
- Check Gmail permissions
- Verify email addresses are valid
- Check Apps Script execution logs for errors

### Lock timeout errors
- This happens during high concurrency
- The lock timeout is set to 30 seconds
- Consider reducing concurrent requests or increasing timeout

## Next Steps

1. Update your `.env.local` file with the Apps Script Web App URL
2. Test the booking flow end-to-end
3. Monitor the Sheets for data integrity
4. Set up regular backups (File > Download > Comma-separated values)

