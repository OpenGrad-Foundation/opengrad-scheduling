/**
 * OpenGrad Scheduling - Apps Script Backend
 * 
 * This script handles:
 * - Slot creation and management
 * - Atomic booking with locking
 * - Google Calendar event creation
 * - Email notifications with calendar invites
 * - Feedback workflow
 */

// Configuration - Update these with your Sheet IDs
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Replace with your Google Sheet ID
const SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);

// Sheet names
const SHEET_MENTORS = 'Mentors';
const SHEET_STUDENTS = 'Students';
const SHEET_SLOTS = 'Slots';

// Column indices for Slots sheet (0-based)
// Slot_ID | Mentor_ID | Mentor_Name | Date | Start_Time | End_Time | Status | Booked_By | Student_ID | Student_Email | Meeting_Link | Feedback_Status_Mentor | Feedback_Status_Student | Timestamp_Created | Timestamp_Booked
const SLOT_COLS = {
  SLOT_ID: 0,              // A
  MENTOR_ID: 1,            // B
  MENTOR_NAME: 2,          // C (auto-filled via formula)
  DATE: 3,                 // D
  START_TIME: 4,           // E
  END_TIME: 5,             // F
  STATUS: 6,               // G (OPEN / BOOKED)
  BOOKED_BY: 7,            // H (Student_ID)
  STUDENT_ID: 8,           // I (auto-filled)
  STUDENT_EMAIL: 9,        // J (auto-filled)
  MEETING_LINK: 10,        // K (auto-generated)
  FEEDBACK_STATUS_MENTOR: 11,  // L (PENDING / DONE)
  FEEDBACK_STATUS_STUDENT: 12,  // M (PENDING / DONE)
  TIMESTAMP_CREATED: 13,    // N
  TIMESTAMP_BOOKED: 14     // O
};

// Column indices for Students sheet
// Student_ID | Student_Name | Student_Email
const STUDENT_COLS = {
  STUDENT_ID: 0,           // A
  STUDENT_NAME: 1,         // B
  STUDENT_EMAIL: 2         // C
};

// Column indices for Mentors sheet
// Mentor_ID | Mentor_Name | Mentor_Email
const MENTOR_COLS = {
  MENTOR_ID: 0,            // A
  MENTOR_NAME: 1,          // B
  MENTOR_EMAIL: 2         // C
};

/**
 * Web app entry point - handles all API calls
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const functionName = request.function;
    const parameters = request.parameters || {};

    let result;
    switch (functionName) {
      case 'getOpenSlots':
        result = getOpenSlots();
        break;
      case 'bookSlot':
        result = bookSlot(
          parameters.slotId,
          parameters.studentId,
          parameters.studentName,
          parameters.studentEmail
        );
        break;
      case 'getMentorSlots':
        result = getMentorSlots(parameters.mentorId);
        break;
      case 'createSlot':
        result = createSlot(parameters);
        break;
      case 'cancelSlot':
        result = cancelSlot(parameters.slotId, parameters.mentorId);
        break;
      case 'getStudentBookings':
        result = getStudentBookings(parameters.studentId);
        break;
      case 'submitFeedback':
        result = submitFeedback(parameters);
        break;
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, error: 'Unknown function' })
        ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all open slots (status == 'OPEN' and date >= today)
 */
function getOpenSlots() {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!sheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const openSlots = rows
      .filter((row) => {
        const status = row[SLOT_COLS.STATUS];
        const slotDate = new Date(row[SLOT_COLS.DATE]);
        slotDate.setHours(0, 0, 0, 0);
        return status === 'OPEN' && slotDate >= today;
      })
      .map((row) => ({
        slot_id: row[SLOT_COLS.SLOT_ID],
        mentor_id: row[SLOT_COLS.MENTOR_ID],
        mentor_name: row[SLOT_COLS.MENTOR_NAME] || '',
        date: row[SLOT_COLS.DATE],
        start_time: row[SLOT_COLS.START_TIME],
        end_time: row[SLOT_COLS.END_TIME],
        status: row[SLOT_COLS.STATUS],
        meeting_link: row[SLOT_COLS.MEETING_LINK] || '',
      }));

    return { success: true, data: openSlots };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Book a slot with atomic locking
 */
function bookSlot(slotId, studentId, studentName, studentEmail) {
  const lock = LockService.getScriptLock();
  
  try {
    // Try to acquire lock with 30 second timeout
    if (!lock.tryLock(30000)) {
      return { success: false, reason: 'lock_timeout', error: 'Could not acquire lock' };
    }

    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    const studentsSheet = SPREADSHEET.getSheetByName(SHEET_STUDENTS);
    const mentorsSheet = SPREADSHEET.getSheetByName(SHEET_MENTORS);

    if (!slotsSheet || !studentsSheet || !mentorsSheet) {
      return { success: false, error: 'Required sheets not found' };
    }

    // Find the slot row
    const slotsData = slotsSheet.getDataRange().getValues();
    let slotRow = -1;
    let slotData = null;

    for (let i = 1; i < slotsData.length; i++) {
      if (slotsData[i][SLOT_COLS.SLOT_ID] === slotId) {
        slotRow = i + 1; // 1-based row index
        slotData = slotsData[i];
        break;
      }
    }

    if (slotRow === -1 || !slotData) {
      return { success: false, reason: 'slot_not_found', error: 'Slot not found' };
    }

    // Check if slot is still open
    if (slotData[SLOT_COLS.STATUS] !== 'OPEN') {
      return {
        success: false,
        reason: 'already_booked',
        error: 'Slot is no longer available',
      };
    }

    // Get student information (verify student exists)
    const studentsData = studentsSheet.getDataRange().getValues();
    let studentFound = false;
    for (let i = 1; i < studentsData.length; i++) {
      if (studentsData[i][STUDENT_COLS.STUDENT_ID] === studentId) {
        studentFound = true;
        // Use student data from sheet if available
        if (!studentName) studentName = studentsData[i][STUDENT_COLS.STUDENT_NAME];
        if (!studentEmail) studentEmail = studentsData[i][STUDENT_COLS.STUDENT_EMAIL];
        break;
      }
    }

    if (!studentFound) {
      return { success: false, error: 'Student not found' };
    }

    // Get mentor information
    const mentorsData = mentorsSheet.getDataRange().getValues();
    let mentorEmail = '';
    let mentorName = '';
    for (let i = 1; i < mentorsData.length; i++) {
      if (mentorsData[i][MENTOR_COLS.MENTOR_ID] === slotData[SLOT_COLS.MENTOR_ID]) {
        mentorEmail = mentorsData[i][MENTOR_COLS.MENTOR_EMAIL];
        mentorName = mentorsData[i][MENTOR_COLS.MENTOR_NAME];
        break;
      }
    }

    if (!mentorEmail) {
      return { success: false, error: 'Mentor not found' };
    }

    // Create date-time objects for calendar
    const slotDate = new Date(slotData[SLOT_COLS.DATE]);
    const startTimeStr = slotData[SLOT_COLS.START_TIME];
    const endTimeStr = slotData[SLOT_COLS.END_TIME];
    
    // Parse time strings (assuming format like "18:00" or "6:00 PM")
    const startTime = parseDateTime(slotDate, startTimeStr);
    const endTime = parseDateTime(slotDate, endTimeStr);

    let calendarEventId = '';
    let meetLink = '';

    // Create calendar event with Google Meet
    try {
      const calendar = CalendarApp.getDefaultCalendar();
      const eventTitle = `Interview: ${studentName} with ${mentorName}`;
      
      const event = calendar.createEvent(
        eventTitle,
        startTime,
        endTime,
        {
          guests: `${studentEmail}, ${mentorEmail}`,
          sendInvites: true,
        }
      );

      // Add Google Meet conference
      try {
        event.addConference(CalendarApp.ConferenceType.HANGOUT);
      } catch (e) {
        console.log('Could not add Meet conference:', e);
      }

      calendarEventId = event.getId();
      
      // Get Meet link
      try {
        const conferenceData = event.getConferenceData();
        if (conferenceData) {
          const entryPoints = conferenceData.getEntryPoints();
          if (entryPoints && entryPoints.length > 0) {
            meetLink = entryPoints[0].getUri();
          }
        }
        if (!meetLink) {
          meetLink = event.getHtmlLink();
        }
      } catch (e) {
        console.log('Could not get Meet link:', e);
        meetLink = event.getHtmlLink() || '';
      }
    } catch (calendarError) {
      console.error('Calendar creation error:', calendarError);
      // Continue with booking even if calendar creation fails
    }

    // Update slot row with booking information
    const now = new Date();
    
    // Update status to BOOKED
    slotsSheet.getRange(slotRow, SLOT_COLS.STATUS + 1).setValue('BOOKED');
    
    // Update Booked_By (Student_ID)
    slotsSheet.getRange(slotRow, SLOT_COLS.BOOKED_BY + 1).setValue(studentId);
    
    // Update Student_ID
    slotsSheet.getRange(slotRow, SLOT_COLS.STUDENT_ID + 1).setValue(studentId);
    
    // Update Student_Email
    slotsSheet.getRange(slotRow, SLOT_COLS.STUDENT_EMAIL + 1).setValue(studentEmail);
    
    // Update Meeting_Link
    slotsSheet.getRange(slotRow, SLOT_COLS.MEETING_LINK + 1).setValue(meetLink);
    
    // Update Feedback_Status_Mentor to PENDING
    slotsSheet.getRange(slotRow, SLOT_COLS.FEEDBACK_STATUS_MENTOR + 1).setValue('PENDING');
    
    // Update Feedback_Status_Student to PENDING
    slotsSheet.getRange(slotRow, SLOT_COLS.FEEDBACK_STATUS_STUDENT + 1).setValue('PENDING');
    
    // Update Timestamp_Booked
    slotsSheet.getRange(slotRow, SLOT_COLS.TIMESTAMP_BOOKED + 1).setValue(now.toISOString());

    // Send confirmation email with calendar invite
    try {
      sendBookingConfirmation(studentEmail, mentorEmail, {
        bookingId: slotId,
        startTime,
        endTime,
        meetLink: meetLink || '',
        studentName,
        mentorName,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail booking if email fails
    }

    return {
      success: true,
      data: {
        slot_id: slotId,
        mentor_id: slotData[SLOT_COLS.MENTOR_ID],
        student_id: studentId,
        student_email: studentEmail,
        mentor_email: mentorEmail,
        meet_link: meetLink,
        calendar_event_id: calendarEventId,
        booked_at: now.toISOString(),
        status: 'BOOKED',
      },
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Parse date and time string into Date object
 */
function parseDateTime(date, timeStr) {
  // Handle various time formats: "18:00", "6:00 PM", "18:00:00"
  let hours = 0;
  let minutes = 0;
  
  if (typeof timeStr === 'string') {
    // Remove seconds if present
    timeStr = timeStr.split(':').slice(0, 2).join(':');
    
    // Check for AM/PM format
    const pmMatch = timeStr.match(/(\d+):(\d+)\s*PM/i);
    const amMatch = timeStr.match(/(\d+):(\d+)\s*AM/i);
    
    if (pmMatch) {
      hours = parseInt(pmMatch[1]);
      if (hours !== 12) hours += 12;
      minutes = parseInt(pmMatch[2]);
    } else if (amMatch) {
      hours = parseInt(amMatch[1]);
      if (hours === 12) hours = 0;
      minutes = parseInt(amMatch[2]);
    } else {
      // 24-hour format
      const parts = timeStr.split(':');
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    }
  } else if (typeof timeStr === 'object' && timeStr instanceof Date) {
    return timeStr;
  }
  
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Get slots for a specific mentor
 */
function getMentorSlots(mentorId) {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!sheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);

    const mentorSlots = rows
      .filter((row) => row[SLOT_COLS.MENTOR_ID] === mentorId)
      .map((row) => ({
        slot_id: row[SLOT_COLS.SLOT_ID],
        mentor_id: row[SLOT_COLS.MENTOR_ID],
        mentor_name: row[SLOT_COLS.MENTOR_NAME] || '',
        date: row[SLOT_COLS.DATE],
        start_time: row[SLOT_COLS.START_TIME],
        end_time: row[SLOT_COLS.END_TIME],
        status: row[SLOT_COLS.STATUS],
        booked_by: row[SLOT_COLS.BOOKED_BY] || '',
        student_id: row[SLOT_COLS.STUDENT_ID] || '',
        student_email: row[SLOT_COLS.STUDENT_EMAIL] || '',
        meeting_link: row[SLOT_COLS.MEETING_LINK] || '',
        feedback_status_mentor: row[SLOT_COLS.FEEDBACK_STATUS_MENTOR] || 'PENDING',
        feedback_status_student: row[SLOT_COLS.FEEDBACK_STATUS_STUDENT] || 'PENDING',
        timestamp_created: row[SLOT_COLS.TIMESTAMP_CREATED] || '',
        timestamp_booked: row[SLOT_COLS.TIMESTAMP_BOOKED] || '',
      }));

    return { success: true, data: mentorSlots };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Create a new slot
 * Expected parameters: { mentorEmail, mentorName, date, start, end }
 */
function createSlot(parameters) {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    const mentorsSheet = SPREADSHEET.getSheetByName(SHEET_MENTORS);
    
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    // Generate slot ID
    const slotId = 'SLOT' + String(slotsSheet.getLastRow()).padStart(3, '0');
    const now = new Date();

    // Get or create mentor in Mentors sheet
    let mentorId = '';
    if (mentorsSheet) {
      const mentorsData = mentorsSheet.getDataRange().getValues();
      let mentorFound = false;
      
      // Look for existing mentor by email
      for (let i = 1; i < mentorsData.length; i++) {
        if (mentorsData[i][MENTOR_COLS.MENTOR_EMAIL] === parameters.mentorEmail) {
          mentorId = mentorsData[i][MENTOR_COLS.MENTOR_ID];
          mentorFound = true;
          break;
        }
      }
      
      // If mentor doesn't exist, create one
      if (!mentorFound) {
        mentorId = 'MEN' + String(mentorsSheet.getLastRow()).padStart(3, '0');
        const mentorRow = [
          mentorId,
          parameters.mentorName,
          parameters.mentorEmail
        ];
        mentorsSheet.appendRow(mentorRow);
      }
    } else {
      // If Mentors sheet doesn't exist, use email as ID
      mentorId = parameters.mentorEmail;
    }

    // Create slot row
    // Slot_ID | Mentor_ID | Mentor_Name | Date | Start_Time | End_Time | Status | Booked_By | Student_ID | Student_Email | Meeting_Link | Feedback_Status_Mentor | Feedback_Status_Student | Timestamp_Created | Timestamp_Booked
    const slotRow = [
      slotId,                                    // Slot_ID
      mentorId,                                  // Mentor_ID (or Mentor_Email)
      parameters.mentorName,                     // Mentor_Name
      parameters.date,                           // Date
      parameters.start,                          // Start_Time
      parameters.end,                            // End_Time
      'OPEN',                                    // Status
      '',                                        // Booked_By
      '',                                        // Student_ID
      '',                                        // Student_Email
      '',                                        // Meeting_Link
      'PENDING',                                 // Feedback_Status_Mentor
      'PENDING',                                 // Feedback_Status_Student
      now.toISOString(),                         // Timestamp_Created
      ''                                         // Timestamp_Booked
    ];

    slotsSheet.appendRow(slotRow);

    return {
      success: true,
      data: {
        slot_id: slotId,
        mentor_id: mentorId,
        mentor_name: parameters.mentorName,
        mentor_email: parameters.mentorEmail,
        date: parameters.date,
        start_time: parameters.start,
        end_time: parameters.end,
        status: 'OPEN',
        created_at: now.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Cancel a slot
 */
function cancelSlot(slotId, mentorId) {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = slotsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][SLOT_COLS.SLOT_ID] === slotId &&
        data[i][SLOT_COLS.MENTOR_ID] === mentorId
      ) {
        const row = i + 1;
        slotsSheet.getRange(row, SLOT_COLS.STATUS + 1).setValue('CANCELLED');
        return { success: true };
      }
    }

    return { success: false, error: 'Slot not found' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get bookings for a student
 */
function getStudentBookings(studentId) {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!sheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);

    const bookings = rows
      .filter((row) => row[SLOT_COLS.STUDENT_ID] === studentId && row[SLOT_COLS.STATUS] === 'BOOKED')
      .map((row) => ({
        slot_id: row[SLOT_COLS.SLOT_ID],
        mentor_id: row[SLOT_COLS.MENTOR_ID],
        mentor_name: row[SLOT_COLS.MENTOR_NAME] || '',
        date: row[SLOT_COLS.DATE],
        start_time: row[SLOT_COLS.START_TIME],
        end_time: row[SLOT_COLS.END_TIME],
        student_id: row[SLOT_COLS.STUDENT_ID],
        student_email: row[SLOT_COLS.STUDENT_EMAIL],
        meeting_link: row[SLOT_COLS.MEETING_LINK] || '',
        feedback_status_mentor: row[SLOT_COLS.FEEDBACK_STATUS_MENTOR] || 'PENDING',
        feedback_status_student: row[SLOT_COLS.FEEDBACK_STATUS_STUDENT] || 'PENDING',
        timestamp_booked: row[SLOT_COLS.TIMESTAMP_BOOKED] || '',
      }));

    return { success: true, data: bookings };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Send booking confirmation email with calendar invite
 */
function sendBookingConfirmation(studentEmail, mentorEmail, bookingData) {
  const subject = 'Interview Session Confirmed - OpenGrad';
  
  // Format dates
  const dateStr = Utilities.formatDate(bookingData.startTime, Session.getScriptTimeZone(), 'EEEE, MMMM d, yyyy');
  const startTimeStr = Utilities.formatDate(bookingData.startTime, Session.getScriptTimeZone(), 'h:mm a');
  const endTimeStr = Utilities.formatDate(bookingData.endTime, Session.getScriptTimeZone(), 'h:mm a');
  
  // Create HTML email body
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Interview Session Confirmed!</h2>
      
      <p>Your interview session has been successfully booked.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${startTimeStr} - ${endTimeStr}</p>
        <p><strong>Student:</strong> ${bookingData.studentName}</p>
        <p><strong>Mentor:</strong> ${bookingData.mentorName}</p>
        ${bookingData.meetLink ? `<p><strong>Google Meet Link:</strong> <a href="${bookingData.meetLink}" style="color: #1a73e8;">${bookingData.meetLink}</a></p>` : ''}
      </div>
      
      ${bookingData.meetLink ? `
      <div style="margin: 20px 0;">
        <a href="${bookingData.meetLink}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Join Google Meet
        </a>
      </div>
      ` : ''}
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        A calendar invite has been sent to your email. Please add it to your calendar.<br>
        Make sure to attend on time. You will receive a feedback form after the session.
      </p>
      
      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Best regards,<br>
        OpenGrad Scheduling System
      </p>
    </div>
  `;
  
  // Plain text version
  const plainBody = `
Your interview session has been confirmed!

Date: ${dateStr}
Time: ${startTimeStr} - ${endTimeStr}
Student: ${bookingData.studentName}
Mentor: ${bookingData.mentorName}

${bookingData.meetLink ? `Google Meet Link: ${bookingData.meetLink}` : 'A calendar invite has been sent to you.'}

Please make sure to attend on time. You will receive a feedback form after the session.

Best regards,
OpenGrad Scheduling System
  `;

  // Generate ICS calendar file content
  const icsContent = generateICSFile(bookingData, studentEmail, mentorEmail);
  
  // Send to student
  try {
    const studentBlob = Utilities.newBlob(icsContent, 'text/calendar', 'invite.ics');
    MailApp.sendEmail({
      to: studentEmail,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody,
      attachments: [studentBlob],
    });
  } catch (e) {
    console.error('Error sending email to student:', e);
    MailApp.sendEmail({
      to: studentEmail,
      subject: subject,
      body: plainBody,
    });
  }

  // Send to mentor
  try {
    const mentorBlob = Utilities.newBlob(icsContent, 'text/calendar', 'invite.ics');
    MailApp.sendEmail({
      to: mentorEmail,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody,
      attachments: [mentorBlob],
    });
  } catch (e) {
    console.error('Error sending email to mentor:', e);
    MailApp.sendEmail({
      to: mentorEmail,
      subject: subject,
      body: plainBody,
    });
  }
}

/**
 * Generate ICS calendar file content
 */
function generateICSFile(bookingData, studentEmail, mentorEmail) {
  const formatICSDate = (date) => {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyyMMdd'T'HHmmss'Z'");
  };
  
  const startDate = formatICSDate(bookingData.startTime);
  const endDate = formatICSDate(bookingData.endTime);
  const now = formatICSDate(new Date());
  const uid = bookingData.bookingId + '@opengrad-scheduling';
  
  const description = `Interview session between ${bookingData.studentName} and ${bookingData.mentorName}.\n\n${bookingData.meetLink ? `Google Meet Link: ${bookingData.meetLink}` : ''}`;
  const location = bookingData.meetLink || 'Online';
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OpenGrad Scheduling//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:${startDate}
DTEND:${endDate}
DTSTAMP:${now}
ORGANIZER;CN=${bookingData.mentorName}:mailto:${mentorEmail}
UID:${uid}
ATTENDEE;CN=${bookingData.studentName};RSVP=TRUE:mailto:${studentEmail}
ATTENDEE;CN=${bookingData.mentorName};RSVP=TRUE:mailto:${mentorEmail}
SUMMARY:Interview Session - ${bookingData.studentName} with ${bookingData.mentorName}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: Interview session in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return ics;
}

/**
 * Submit feedback after interview
 * Expected parameters: { slotId, feedbackType: 'mentor' | 'student', feedbackData: {...} }
 */
function submitFeedback(parameters) {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const { slotId, feedbackType, feedbackData } = parameters;
    
    if (!slotId || !feedbackType) {
      return { success: false, error: 'Missing required fields: slotId, feedbackType' };
    }

    if (feedbackType !== 'mentor' && feedbackType !== 'student') {
      return { success: false, error: 'feedbackType must be "mentor" or "student"' };
    }

    // Find the slot row
    const data = slotsSheet.getDataRange().getValues();
    let slotRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][SLOT_COLS.SLOT_ID] === slotId) {
        slotRow = i + 1; // 1-based row index
        break;
      }
    }

    if (slotRow === -1) {
      return { success: false, error: 'Slot not found' };
    }

    // Update feedback status
    if (feedbackType === 'mentor') {
      slotsSheet.getRange(slotRow, SLOT_COLS.FEEDBACK_STATUS_MENTOR + 1).setValue('DONE');
    } else {
      slotsSheet.getRange(slotRow, SLOT_COLS.FEEDBACK_STATUS_STUDENT + 1).setValue('DONE');
    }

    // Store feedback data in notes column (or create a separate Feedback sheet if needed)
    // For now, we'll store it as JSON in the notes column
    const currentNotes = slotsSheet.getRange(slotRow, SLOT_COLS.STUDENT_EMAIL + 1).getValue() || '';
    const feedbackJson = JSON.stringify({
      type: feedbackType,
      data: feedbackData,
      submittedAt: new Date().toISOString()
    });
    
    // You might want to create a separate Feedback sheet for detailed feedback
    // For now, we'll just mark the status as DONE

    return {
      success: true,
      data: {
        slot_id: slotId,
        feedback_type: feedbackType,
        status: 'DONE',
        submitted_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
