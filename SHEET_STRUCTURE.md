# Sheet Structure Reference

This document describes the exact sheet structure used in the OpenGrad Scheduling system.

## Sheet Overview

The system uses **3 sheets**:
1. **Students** - Student information
2. **Mentors** - Mentor information  
3. **Slots** - All slot and booking data (most important for mapping)

---

## 1. Students Sheet

| Column | Example | Purpose |
|--------|---------|---------|
| Student_ID | STU001 | Unique ID for system lookups |
| Student_Name | Aishwarya Menon | Display name |
| Student_Email | aish@example.com | For sending invite + reminders |

**Header Row:**
```
Student_ID | Student_Name | Student_Email
```

**Why you need this?**
→ When a student books a slot, the script attaches the `Student_ID` to the slot row.

---

## 2. Mentors Sheet

| Column | Example | Purpose |
|--------|---------|---------|
| Mentor_ID | MEN001 | Primary key |
| Mentor_Name | Raghav | Display name |
| Mentor_Email | raghav@gmail.com | For calendar invite |

**Header Row:**
```
Mentor_ID | Mentor_Name | Mentor_Email
```

**Why?**
→ When mentors create slots, you reference `Mentor_ID` instead of their name/email directly.

---

## 3. Slots Sheet (Most Important)

This is where all the mapping happens.

| Column | Example | Purpose |
|--------|---------|---------|
| Slot_ID | SLOT001 | Unique internal ID |
| Mentor_ID | MEN001 | Lookup to Mentors sheet |
| Mentor_Name | (auto-filled via formula) | Useful for UI |
| Date | 2025-01-20 | Input by mentor |
| Start_Time | 18:00 | Input |
| End_Time | 18:30 | Input |
| Status | OPEN / BOOKED | UI display + booking logic |
| Booked_By | STU043 | student_id reference |
| Student_ID | (auto) | For meeting invite |
| Student_Email | (auto) | For meeting invite |
| Meeting_Link | auto-generated | Zoom/Meet link |
| Feedback_Status_Mentor | PENDING / DONE | After meeting |
| Feedback_Status_Student | PENDING / DONE | After meeting |
| Timestamp_Created | auto | Logs |
| Timestamp_Booked | auto | For analysis |

**Header Row:**
```
Slot_ID | Mentor_ID | Mentor_Name | Date | Start_Time | End_Time | Status | Booked_By | Student_ID | Student_Email | Meeting_Link | Feedback_Status_Mentor | Feedback_Status_Student | Timestamp_Created | Timestamp_Booked
```

### Optional: Auto-fill Mentor_Name with Formula

In cell C2 (Mentor_Name column), you can add this formula to auto-fill the mentor name:

```
=IFERROR(VLOOKUP(B2,Mentors!A:C,2,FALSE),"")
```

This will automatically populate the mentor name based on the Mentor_ID.

---

## How Mapping Works

### 1. Mentor Creates a Slot

Your frontend submits:
- `mentor_id`
- `date`
- `start_time`
- `end_time`

Apps Script writes a new row in Slots:
- `slot_id`: SLOT213
- `mentor_id`: MEN045
- `status`: OPEN
- `booked_by`: (empty)
- `meeting_link`: (empty)
- `timestamp_created`: now()

### 2. Students View Slots

Frontend filters:
- `status == 'OPEN'`
- `date >= today()`

Slots are shown grouped by mentor.

### 3. Student Books a Slot

Student clicks Book → frontend sends:
- `slot_id`
- `student_id`

Apps Script updates the row:
- `status` → BOOKED
- `booked_by` → STU077
- `student_id` → STU077
- `student_email` → (fetched from Students sheet)
- `timestamp_booked` → now()

It also:
- ✔ Fetches student details from Students sheet
- ✔ Fetches mentor email from Mentors sheet
- ✔ Generates Google Meet link
- ✔ Creates calendar event
- ✔ Sends meeting invite to both (with .ics attachment)

### 4. After the Call Ends

Your system can update:
- `feedback_status_student` → DONE
- `feedback_status_mentor` → DONE

---

## Status Values

### Slot Status
- `OPEN` - Available for booking
- `BOOKED` - Reserved by a student
- `CANCELLED` - Cancelled by mentor

### Feedback Status
- `PENDING` - Feedback not yet submitted
- `DONE` - Feedback submitted

---

## Date/Time Formats

- **Date**: `YYYY-MM-DD` format (e.g., `2025-01-20`)
- **Start_Time**: `HH:MM` format (e.g., `18:00` or `18:30`)
- **End_Time**: `HH:MM` format (e.g., `18:30` or `19:00`)

The Apps Script will parse these and create proper Date objects for calendar events.

---

## Auto-Generated Fields

These fields are automatically populated by the Apps Script:

- **Slot_ID**: Generated as `SLOT001`, `SLOT002`, etc.
- **Mentor_Name**: Can be auto-filled with VLOOKUP formula (optional)
- **Student_ID**: Filled when booking
- **Student_Email**: Fetched from Students sheet when booking
- **Meeting_Link**: Generated when booking (Google Meet link)
- **Timestamp_Created**: Set when slot is created
- **Timestamp_Booked**: Set when slot is booked
- **Feedback_Status_Mentor**: Set to `PENDING` when booked
- **Feedback_Status_Student**: Set to `PENDING` when booked

---

## Example Data

### Students Sheet
```
STU001 | Aishwarya Menon | aish@example.com
STU002 | John Smith | john@example.com
```

### Mentors Sheet
```
MEN001 | Raghav | raghav@gmail.com
MEN002 | Priya | priya@gmail.com
```

### Slots Sheet
```
SLOT001 | MEN001 | Raghav | 2025-01-20 | 18:00 | 18:30 | OPEN | | | | | PENDING | PENDING | 2025-01-15T10:00:00Z | 
SLOT002 | MEN001 | Raghav | 2025-01-21 | 19:00 | 19:30 | BOOKED | STU001 | STU001 | aish@example.com | https://meet.google.com/... | PENDING | PENDING | 2025-01-15T10:05:00Z | 2025-01-15T11:00:00Z
```

---

## Notes

1. **No separate Bookings sheet** - All booking information is stored in the Slots sheet
2. **Atomic booking** - Uses Apps Script LockService to prevent double-booking
3. **Email notifications** - Both student and mentor receive emails with calendar invites
4. **Google Meet integration** - Meet links are automatically generated and included in calendar events

