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
const SHEET_ID = '15of0yJZQ3GFfiSLghIoCjYFfD-na-CoLt1VyLEWEaBM'; // Replace with your Google Sheet ID
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
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Invalid request: missing postData' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const request = JSON.parse(e.postData.contents);
    const functionName = request.function;
    const parameters = request.parameters || {};

    if (!functionName) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Missing function name' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    let result;
    try {
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
        case 'getMentorByEmail':
          result = getMentorByEmail(parameters.email);
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
        case 'getAllMentors':
          result = getAllMentors();
          break;
        case 'getAllStudents':
          result = getAllStudents();
          break;
        case 'getAllBookings':
          result = getAllBookings();
          break;
        case 'getAllSlots':
          result = getAllSlots();
          break;
        case 'getAdminStats':
          result = getAdminStats();
          break;
        default:
          return ContentService.createTextOutput(
            JSON.stringify({ success: false, error: 'Unknown function: ' + functionName })
          ).setMimeType(ContentService.MimeType.JSON);
      }
    } catch (functionError) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Function execution error: ' + functionError.toString() })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Normalize result to ensure correct format
    if (!result || typeof result !== 'object') {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'Invalid result format from function' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // If result already has success property, use it as-is
    if (result.success === true) {
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else if (result.success === false) {
      return ContentService.createTextOutput(
        JSON.stringify(result)
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      // If result doesn't have success property, wrap it
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, data: result })
      ).setMimeType(ContentService.MimeType.JSON);
    }
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
        let slotDate = row[SLOT_COLS.DATE];
        if (typeof slotDate === 'string') {
          slotDate = new Date(slotDate);
        } else if (typeof slotDate === 'number') {
          slotDate = new Date((slotDate - 25569) * 86400 * 1000);
        }
        slotDate.setHours(0, 0, 0, 0);
        return status === 'OPEN' && slotDate >= today;
      })
      .map((row) => {
        let slotDate = row[SLOT_COLS.DATE];
        if (typeof slotDate === 'string') {
          slotDate = new Date(slotDate);
        } else if (typeof slotDate === 'number') {
          slotDate = new Date((slotDate - 25569) * 86400 * 1000);
        }
        return {
          slot_id: row[SLOT_COLS.SLOT_ID],
          mentor_id: row[SLOT_COLS.MENTOR_ID],
          mentor_name: row[SLOT_COLS.MENTOR_NAME] || '',
          date: Utilities.formatDate(slotDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
          start_time: Utilities.formatDate(new Date(row[SLOT_COLS.START_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
          end_time: Utilities.formatDate(new Date(row[SLOT_COLS.END_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
          status: row[SLOT_COLS.STATUS],
          meeting_link: row[SLOT_COLS.MEETING_LINK] || '',
        };
      });

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
    let slotDate = slotData[SLOT_COLS.DATE];
    if (typeof slotDate === 'string') {
      slotDate = new Date(slotDate);
    } else if (typeof slotDate === 'number') {
      slotDate = new Date((slotDate - 25569) * 86400 * 1000);
    }
    // If it's already a Date object, use it as is
    const startTimeStr = slotData[SLOT_COLS.START_TIME];
    const endTimeStr = slotData[SLOT_COLS.END_TIME];
    
    // Parse time strings (assuming format like "18:00" or "6:00 PM")
    const startTime = parseDateTime(slotDate, startTimeStr);
    const endTime = parseDateTime(slotDate, endTimeStr);

    let calendarEventId = '';
    let meetLink = '';

    // Create calendar event with Google Meet using Calendar API v3
    try {
      const calendarId = 'primary'; // Use 'primary' for your main calendar
      const eventTitle = `Interview: ${studentName} with ${mentorName}`;
      
      const eventDetails = {
        summary: eventTitle,
        start: {
          dateTime: startTime.toISOString(),
        },
        end: {
          dateTime: endTime.toISOString(),
        },
        attendees: [
          { email: studentEmail },
          { email: mentorEmail }
        ],
        // The key part to add the Meet link
        conferenceData: {
          createRequest: {
            requestId: "meet-request-" + Utilities.getUuid(), // Use a unique ID
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        },
        description: `Interview scheduled between ${studentName} and ${mentorName}`
      };

      // Insert the event using Calendar API v3
      const newEvent = Calendar.Events.insert(eventDetails, calendarId, {
        conferenceDataVersion: 1,
        sendUpdates: 'all' // Send invites to attendees
      });

      calendarEventId = newEvent.id;
      
      // Get the generated Google Meet link from the created event
      // Use conferenceData.entryPoints[0].uri as the reliable source
      meetLink =
        newEvent.conferenceData &&
        newEvent.conferenceData.entryPoints &&
        newEvent.conferenceData.entryPoints.length > 0
          ? newEvent.conferenceData.entryPoints[0].uri
          : '';
      
      Logger.log('Event created with Meet link: %s', meetLink);
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
        date: Utilities.formatDate(slotDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail booking if email fails
    }

    // Enqueue feedback email job (meeting end time + 1 hour)
    try {
      enqueueFeedbackJob({
        calendarEventId: calendarEventId || 'slot-' + slotId,
        mentorEmail: mentorEmail,
        studentEmail: studentEmail,
        mentorName: mentorName,
        studentName: studentName,
        interviewEndTime: endTime,
      });
    } catch (jobError) {
      Logger.log('Error enqueueing feedback job: ' + jobError.toString());
      // Don't fail booking if job enqueueing fails
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
      .map((row) => {
        let slotDate = row[SLOT_COLS.DATE];
        if (typeof slotDate === 'string') {
          slotDate = new Date(slotDate);
        } else if (typeof slotDate === 'number') {
          slotDate = new Date((slotDate - 25569) * 86400 * 1000);
        }
        return {
          slot_id: row[SLOT_COLS.SLOT_ID],
          mentor_id: row[SLOT_COLS.MENTOR_ID],
          mentor_name: row[SLOT_COLS.MENTOR_NAME] || '',
          date: Utilities.formatDate(slotDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
          start_time: Utilities.formatDate(new Date(row[SLOT_COLS.START_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
          end_time: Utilities.formatDate(new Date(row[SLOT_COLS.END_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
          status: row[SLOT_COLS.STATUS],
          booked_by: row[SLOT_COLS.BOOKED_BY] || '',
          student_id: row[SLOT_COLS.STUDENT_ID] || '',
          student_email: row[SLOT_COLS.STUDENT_EMAIL] || '',
          meeting_link: row[SLOT_COLS.MEETING_LINK] || '',
          feedback_status_mentor: row[SLOT_COLS.FEEDBACK_STATUS_MENTOR] || 'PENDING',
          feedback_status_student: row[SLOT_COLS.FEEDBACK_STATUS_STUDENT] || 'PENDING',
          timestamp_created: row[SLOT_COLS.TIMESTAMP_CREATED] || '',
          timestamp_booked: row[SLOT_COLS.TIMESTAMP_BOOKED] || '',
        };
      });

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
      new Date(parameters.date + 'T00:00:00'),   // Date
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
        date: Utilities.formatDate(new Date(row[SLOT_COLS.DATE]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        start_time: Utilities.formatDate(new Date(row[SLOT_COLS.START_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
        end_time: Utilities.formatDate(new Date(row[SLOT_COLS.END_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
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
 * Generate .ics calendar file content (RFC 5545 compliant)
 * @param {Date} startTime - Event start time
 * @param {Date} endTime - Event end time
 * @param {string} mentorName - Mentor name
 * @param {string} studentName - Student name
 * @param {string} meetLink - Google Meet link (optional)
 * @return {string} .ics file content
 */
function generateICSFile(startTime, endTime, mentorName, studentName, meetLink) {
  // Format date to UTC in RFC 5545 format: YYYYMMDDTHHMMSSZ
  function formatICSDate(date) {
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    const hours = ('0' + date.getUTCHours()).slice(-2);
    const minutes = ('0' + date.getUTCMinutes()).slice(-2);
    const seconds = ('0' + date.getUTCSeconds()).slice(-2);
    return year + month + day + 'T' + hours + minutes + seconds + 'Z';
  }
  
  // Escape special characters in text fields (RFC 5545)
  function escapeICSText(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
  
  const now = new Date();
  const uid = 'opengrad-' + Utilities.getUuid() + '@opengrad.in';
  const summary = 'Interview Session: ' + studentName + ' with ' + mentorName;
  
  // Build description with Meet link
  let description = 'Interview session between ' + studentName + ' and ' + mentorName;
  if (meetLink) {
    description += '\\n\\nGoogle Meet Link: ' + meetLink;
  }
  
  // Build location with Meet link if available
  const location = meetLink || 'Online';
  
  // Generate .ics content (CRLF line endings required by RFC 5545)
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenGrad//Interview Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    'UID:' + uid,
    'DTSTAMP:' + formatICSDate(now),
    'DTSTART:' + formatICSDate(startTime),
    'DTEND:' + formatICSDate(endTime),
    'SUMMARY:' + escapeICSText(summary),
    'DESCRIPTION:' + escapeICSText(description),
    'LOCATION:' + escapeICSText(location),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Interview session in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n'); // CRLF line endings as per RFC 5545
  
  return icsContent;
}

/**
 * Send booking confirmation email with .ics calendar attachment
 */
function sendBookingConfirmation(studentEmail, mentorEmail, bookingData) {
  const subject = 'Interview Session Confirmed - OpenGrad';
  
  // Format dates - extract date components to avoid timezone issues
  const dateStr = Utilities.formatDate(new Date(bookingData.date + 'T00:00:00'), Session.getScriptTimeZone(), 'EEEE, MMMM d, yyyy');
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
        ${bookingData.meetLink ? `<p><strong>Google Meet Link:</strong> <a href="${bookingData.meetLink}" style="color: #1a73e8; word-break: break-all;">${bookingData.meetLink}</a></p>` : ''}
      </div>
      
      ${bookingData.meetLink ? `
      <div style="margin: 20px 0;">
        <a href="${bookingData.meetLink}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Join Google Meet
        </a>
      </div>
      ` : ''}
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        A calendar invite with Google Meet link has been sent to your email by Google Calendar.<br>
        Please check your calendar and accept the invite.<br>
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

${bookingData.meetLink ? `Google Meet Link: ${bookingData.meetLink}` : ''}

A calendar invite with Google Meet link has been sent to your email by Google Calendar.
Please check your calendar and accept the invite.

Please make sure to attend on time. You will receive a feedback form after the session.

Best regards,
OpenGrad Scheduling System
  `;
  
  // Generate .ics calendar file
  let icsBlob = null;
  try {
    const icsContent = generateICSFile(
      bookingData.startTime,
      bookingData.endTime,
      bookingData.mentorName,
      bookingData.studentName,
      bookingData.meetLink || ''
    );
    icsBlob = Utilities.newBlob(icsContent, 'text/calendar', 'interview-session.ics');
    Logger.log('Generated .ics file for booking confirmation');
  } catch (icsError) {
    Logger.log('Error generating .ics file: ' + icsError.toString());
    // Continue without attachment if generation fails
  }
  
  // Send to student with .ics attachment
  try {
    const emailOptions = {
      to: studentEmail,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody,
    };
    
    // Attach .ics file if generated successfully
    if (icsBlob) {
      emailOptions.attachments = [icsBlob];
    }
    
    MailApp.sendEmail(emailOptions);
  } catch (e) {
    Logger.log('Error sending email to student: ' + e.toString());
  }

  // Send to mentor with .ics attachment
  try {
    const emailOptions = {
      to: mentorEmail,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody,
    };
    
    // Attach .ics file if generated successfully
    if (icsBlob) {
      emailOptions.attachments = [icsBlob];
    }
    
    MailApp.sendEmail(emailOptions);
  } catch (e) {
    Logger.log('Error sending email to mentor: ' + e.toString());
  }
}


/**
 * Submit feedback after interview
 * Expected parameters: { slotId, feedbackType: 'mentor' | 'student', feedbackData: {...} }
 */
function getMentorByEmail(email) {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_MENTORS);
    if (!sheet) {
      return { success: false, error: 'Mentors sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1); // Skip header

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row[MENTOR_COLS.MENTOR_EMAIL] === email) {
        return {
          success: true,
          mentor: {
            mentor_id: row[MENTOR_COLS.MENTOR_ID],
            name: row[MENTOR_COLS.MENTOR_NAME],
            email: row[MENTOR_COLS.MENTOR_EMAIL],
          },
        };
      }
    }

    return { success: false, error: 'Mentor not found' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

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

/**
 * Get all bookings (BOOKED slots) for admin dashboard
 */
function getAllBookings() {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = slotsSheet.getDataRange().getValues();
    const bookings = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[SLOT_COLS.STATUS];

      // Only include BOOKED slots as bookings
      if (status === 'BOOKED') {
        const booking = {
          booking_id: row[SLOT_COLS.SLOT_ID], // Use slot_id as booking_id
          slot_id: row[SLOT_COLS.SLOT_ID],
          mentor_id: row[SLOT_COLS.MENTOR_ID],
          mentor_name: row[SLOT_COLS.MENTOR_NAME],
          student_id: row[SLOT_COLS.STUDENT_ID],
          student_email: row[SLOT_COLS.STUDENT_EMAIL],
          date: row[SLOT_COLS.DATE],
          start_time: row[SLOT_COLS.START_TIME],
          end_time: row[SLOT_COLS.END_TIME],
          meet_link: row[SLOT_COLS.MEETING_LINK],
          status: 'confirmed', // All BOOKED slots are confirmed bookings
          feedback_sent: row[SLOT_COLS.FEEDBACK_STATUS_MENTOR] === 'DONE' ? 'Y' : 'N',
          feedback_submitted: row[SLOT_COLS.FEEDBACK_STATUS_STUDENT] === 'DONE' ? 'Y' : 'N',
          created_at: row[SLOT_COLS.TIMESTAMP_BOOKED] || row[SLOT_COLS.TIMESTAMP_CREATED],
          timestamp_created: row[SLOT_COLS.TIMESTAMP_CREATED],
          timestamp_booked: row[SLOT_COLS.TIMESTAMP_BOOKED],
        };
        bookings.push(booking);
      }
    }

    return {
      success: true,
      data: bookings,
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all slots for admin dashboard
 */
function getAllSlots() {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = slotsSheet.getDataRange().getValues();
    const slots = [];

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let slotDate = row[SLOT_COLS.DATE];
      if (typeof slotDate === 'string') {
        slotDate = new Date(slotDate);
      } else if (typeof slotDate === 'number') {
        slotDate = new Date((slotDate - 25569) * 86400 * 1000);
      }
      const slot = {
        slot_id: row[SLOT_COLS.SLOT_ID],
        mentor_id: row[SLOT_COLS.MENTOR_ID],
        mentor_name: row[SLOT_COLS.MENTOR_NAME],
        date: Utilities.formatDate(slotDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        start_time: Utilities.formatDate(new Date(row[SLOT_COLS.START_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
        end_time: Utilities.formatDate(new Date(row[SLOT_COLS.END_TIME]), Session.getScriptTimeZone(), 'HH:mm'),
        status: row[SLOT_COLS.STATUS],
        booked_by: row[SLOT_COLS.BOOKED_BY],
        student_id: row[SLOT_COLS.STUDENT_ID],
        student_email: row[SLOT_COLS.STUDENT_EMAIL],
        meeting_link: row[SLOT_COLS.MEETING_LINK],
        feedback_status_mentor: row[SLOT_COLS.FEEDBACK_STATUS_MENTOR],
        feedback_status_student: row[SLOT_COLS.FEEDBACK_STATUS_STUDENT],
        timestamp_created: row[SLOT_COLS.TIMESTAMP_CREATED],
        timestamp_booked: row[SLOT_COLS.TIMESTAMP_BOOKED],
      };
      slots.push(slot);
    }

    return {
      success: true,
      data: slots,
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get admin statistics for dashboard
 */
function getAdminStats() {
  try {
    const slotsSheet = SPREADSHEET.getSheetByName(SHEET_SLOTS);
    if (!slotsSheet) {
      return { success: false, error: 'Slots sheet not found' };
    }

    const data = slotsSheet.getDataRange().getValues();
    let totalBookings = 0;
    let completed = 0;
    let noShows = 0;
    let feedbackSubmitted = 0;

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[SLOT_COLS.STATUS];
      const feedbackMentor = row[SLOT_COLS.FEEDBACK_STATUS_MENTOR];
      const feedbackStudent = row[SLOT_COLS.FEEDBACK_STATUS_STUDENT];

      if (status === 'BOOKED') {
        totalBookings++;
        // Consider completed if both feedback statuses are DONE
        if (feedbackMentor === 'DONE' && feedbackStudent === 'DONE') {
          completed++;
        }
        // For now, no logic for no-shows as we don't track attendance
        // Count feedback submitted if either mentor or student has submitted
        if (feedbackMentor === 'DONE' || feedbackStudent === 'DONE') {
          feedbackSubmitted++;
        }
      }
    }

    return {
      success: true,
      data: {
        totalBookings,
        completed,
        noShows,
        feedbackSubmitted,
      },
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all mentors
 */
function getAllMentors() {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_MENTORS);
    if (!sheet) {
      return { success: false, error: 'Mentors sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const mentors = rows.map((row) => ({
      mentor_id: row[MENTOR_COLS.MENTOR_ID],
      name: row[MENTOR_COLS.MENTOR_NAME],
      email: row[MENTOR_COLS.MENTOR_EMAIL],
    }));

    return { success: true, data: mentors };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Get all students
 */
function getAllStudents() {
  try {
    const sheet = SPREADSHEET.getSheetByName(SHEET_STUDENTS);
    if (!sheet) {
      return { success: false, error: 'Students sheet not found' };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const students = rows.map((row) => ({
      student_id: row[STUDENT_COLS.STUDENT_ID],
      name: row[STUDENT_COLS.STUDENT_NAME],
      email: row[STUDENT_COLS.STUDENT_EMAIL],
    }));

    return { success: true, data: students };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Enqueue a feedback job to be sent 1 hour after interview end time
 * Called after successful booking and calendar event creation
 * 
 * @param {Object} metadata - Interview metadata
 * @param {string} metadata.calendarEventId - Calendar event ID (or slot-based ID)
 * @param {string} metadata.mentorEmail - Mentor email address
 * @param {string} metadata.studentEmail - Student email address
 * @param {string} metadata.mentorName - Mentor name
 * @param {string} metadata.studentName - Student name
 * @param {Date} metadata.interviewEndTime - Interview end time (Date object)
 */
function enqueueFeedbackJob(metadata) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Load existing feedback queue
    const queueJson = properties.getProperty('FEEDBACK_QUEUE') || '[]';
    const queue = JSON.parse(queueJson);
    
    // Calculate sendAt time: interview end time + 1 hour (in epoch milliseconds)
    const interviewEndTimeMs = metadata.interviewEndTime.getTime();
    const sendAtMs = interviewEndTimeMs + (60 * 60 * 1000); // Add 1 hour
    
    // Don't enqueue if send time is in the past
    if (sendAtMs <= Date.now()) {
      Logger.log('Send time is in the past, skipping job enqueue for event: ' + metadata.calendarEventId);
      return;
    }
    
    // Generate unique job ID from calendar event ID or timestamp
    const jobId = metadata.calendarEventId || 'job-' + Date.now() + '-' + Utilities.getUuid();
    
    // Create feedback job object
    const job = {
      id: jobId,
      mentorEmail: metadata.mentorEmail,
      studentEmail: metadata.studentEmail,
      mentorName: metadata.mentorName,
      studentName: metadata.studentName,
      interviewEndTime: interviewEndTimeMs, // Epoch milliseconds
      sendAt: sendAtMs, // Epoch milliseconds
      sent: false // Boolean flag
    };
    
    // Check if job already exists (prevent duplicates)
    const existingJobIndex = queue.findIndex(function(j) {
      return j.id === jobId && !j.sent;
    });
    
    if (existingJobIndex >= 0) {
      // Update existing job
      queue[existingJobIndex] = job;
      Logger.log('Updated existing feedback job: ' + jobId);
    } else {
      // Add new job to queue
      queue.push(job);
      Logger.log('Enqueued feedback job: ' + jobId + ' (sendAt: ' + new Date(sendAtMs).toISOString() + ')');
    }
    
    // Save updated queue back to PropertiesService
    properties.setProperty('FEEDBACK_QUEUE', JSON.stringify(queue));
    
  } catch (error) {
    Logger.log('Error enqueueing feedback job: ' + error.toString());
    // Don't throw - allow booking to succeed even if job enqueueing fails
  }
}

/**
 * Process feedback queue - called by recurring time-driven trigger (every 5 minutes)
 * Loads queue from PropertiesService, sends emails for ready jobs, marks as sent
 * Idempotent: safe to run multiple times, won't send duplicate emails
 */
function processFeedbackQueue() {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Load feedback queue from PropertiesService
    const queueJson = properties.getProperty('FEEDBACK_QUEUE') || '[]';
    let queue = JSON.parse(queueJson);
    
    if (queue.length === 0) {
      Logger.log('Feedback queue is empty');
      return;
    }
    
    const nowMs = Date.now(); // Current time in epoch milliseconds
    let queueUpdated = false;
    
    // Feedback form links
    const mentorFeedbackLink = 'https://forms.gle/MKVruH1J432Knz1V9';
    const studentFeedbackLink = 'https://forms.gle/yeqQiMsYfTG3znNa7';
    
    // Iterate over all jobs in queue
    queue.forEach(function(job) {
      try {
        // Skip if already sent
        if (job.sent === true) {
          return;
        }
        
        // Skip if send time hasn't arrived yet
        if (nowMs < job.sendAt) {
          return;
        }
        
        // Job is ready to send - send feedback emails
        const interviewEndDate = new Date(job.interviewEndTime);
        const interviewDateStr = Utilities.formatDate(interviewEndDate, Session.getScriptTimeZone(), 'EEEE, MMMM d, yyyy');
        const interviewTimeStr = Utilities.formatDate(interviewEndDate, Session.getScriptTimeZone(), 'h:mm a');
        
        // Send email to mentor
        try {
          const mentorSubject = 'Feedback Request: Interview Session with ' + job.studentName;
          const mentorBody = 'Hello ' + job.mentorName + ',\n\n' +
            'Thank you for conducting the interview session with ' + job.studentName + '.\n\n' +
            'Interview Date: ' + interviewDateStr + '\n' +
            'Interview Time: ' + interviewTimeStr + '\n\n' +
            'We would appreciate your feedback on the session. Please take a moment to share your thoughts:\n\n' +
            mentorFeedbackLink + '\n\n' +
            'Your feedback helps us improve the program and support our students better.\n\n' +
            'Best regards,\n' +
            'OpenGrad Team';
          
          MailApp.sendEmail(
            job.mentorEmail,
            mentorSubject,
            mentorBody
          );
          
          Logger.log('Feedback email sent to mentor: ' + job.mentorEmail + ' (jobId: ' + job.id + ')');
        } catch (mentorEmailError) {
          Logger.log('Error sending email to mentor: ' + mentorEmailError.toString() + ' (jobId: ' + job.id + ')');
          // Continue processing other jobs even if one fails
        }
        
        // Send email to student
        try {
          const studentSubject = 'Feedback Request: Interview Session with ' + job.mentorName;
          const studentBody = 'Hello ' + job.studentName + ',\n\n' +
            'Thank you for participating in the interview session with ' + job.mentorName + '.\n\n' +
            'Interview Date: ' + interviewDateStr + '\n' +
            'Interview Time: ' + interviewTimeStr + '\n\n' +
            'We would love to hear about your experience. Please share your feedback:\n\n' +
            studentFeedbackLink + '\n\n' +
            'Your feedback helps us improve the program and match you with better opportunities.\n\n' +
            'Best regards,\n' +
            'OpenGrad Team';
          
          MailApp.sendEmail(
            job.studentEmail,
            studentSubject,
            studentBody
          );
          
          Logger.log('Feedback email sent to student: ' + job.studentEmail + ' (jobId: ' + job.id + ')');
        } catch (studentEmailError) {
          Logger.log('Error sending email to student: ' + studentEmailError.toString() + ' (jobId: ' + job.id + ')');
          // Continue processing other jobs even if one fails
        }
        
        // Mark job as sent (idempotent - safe to run multiple times)
        job.sent = true;
        queueUpdated = true;
        Logger.log('Marked feedback job as sent: ' + job.id);
        
      } catch (jobError) {
        Logger.log('Error processing job ' + job.id + ': ' + jobError.toString());
        // Keep job in queue if processing failed - will retry on next trigger
      }
    });
    
    // Save updated queue back to PropertiesService (only if changes were made)
    if (queueUpdated) {
      properties.setProperty('FEEDBACK_QUEUE', JSON.stringify(queue));
      Logger.log('Updated feedback queue in PropertiesService');
    }
    
  } catch (error) {
    Logger.log('Error in processFeedbackQueue: ' + error.toString());
    // Don't throw - allow trigger to continue running
  }
}

/**
 * Setup recurring time-driven trigger for feedback queue processing
 * Must be run manually once to initialize the system
 * Creates a trigger that runs every 5 minutes and calls processFeedbackQueue
 */
function setupFeedbackQueueTrigger() {
  try {
    // Delete existing triggers for processFeedbackQueue to prevent duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'processFeedbackQueue') {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('Deleted existing processFeedbackQueue trigger');
      }
    });
    
    // Create new time-driven trigger: runs every 5 minutes
    ScriptApp.newTrigger('processFeedbackQueue')
      .timeBased()
      .everyMinutes(5)
      .create();
    
    Logger.log('Feedback queue trigger set up successfully (runs every 5 minutes)');
  } catch (error) {
    Logger.log('Error setting up feedback queue trigger: ' + error.toString());
    throw error;
  }
}

