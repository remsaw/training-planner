/**
 * ============================================================================
 * TRAINING RESOURCE PLANNER — GOOGLE SHEETS CLOUD BACKEND (Code.gs)
 * ============================================================================
 * HOW TO SETUP (Takes 2 minutes):
 * 1. Create a new Google Sheet at https://sheets.new
 * 2. Click "Extensions" -> "Apps Script" in the top menu.
 * 3. Delete any existing code in Code.gs and paste this entire file.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Select type: "Web app" (click the gear icon next to Select type).
 *    - Description: "Training Planner API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (required so your web app can read/write without OAuth popups)
 * 6. Click "Deploy", authorize access if prompted, and copy the "Web app URL".
 * 7. Paste the Web app URL into your Training Planner -> Settings -> Google Sheets Cloud Sync
 *    (or set VITE_GOOGLE_SHEETS_URL in your environment variables when publishing).
 * ============================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var people = readSheetObjects(ss, 'People');
    var courses = readSheetObjects(ss, 'Courses');
    var sessions = readSheetObjects(ss, 'Sessions');
    var settingsRows = readSheetObjects(ss, 'Settings');

    var result = {
      ok: true,
      hasData: people.length > 0 || courses.length > 0 || sessions.length > 0,
      people: people.map(function (r) {
        return {
          id: String(r.id || ''),
          name: String(r.name || ''),
          employeeId: String(r.employeeId || ''),
          department: String(r.department || 'General'),
          roles: String(r.roles || 'Lecturer')
            .split(';')
            .map(function (s) { return s.trim(); })
            .filter(Boolean),
          email: String(r.email || ''),
          phone: String(r.phone || ''),
          active: String(r.active).toLowerCase() !== 'false',
          avatarColor: String(r.avatarColor || 'bg-blue-600')
        };
      }),
      courses: courses.map(function (r) {
        return {
          id: String(r.id || ''),
          name: String(r.name || ''),
          code: String(r.code || ''),
          category: String(r.category || 'General'),
          description: String(r.description || ''),
          defaultDurationDays: Number(r.defaultDurationDays) || 5,
          color: String(r.color || '#2563eb'),
          active: String(r.active).toLowerCase() !== 'false'
        };
      }),
      sessions: sessions.map(function (r) {
        return {
          id: String(r.id || ''),
          courseId: String(r.courseId || ''),
          startDate: String(r.startDate || ''),
          endDate: String(r.endDate || ''),
          startTime: String(r.startTime || '09:00'),
          endTime: String(r.endTime || '14:00'),
          location: String(r.location || ''),
          lecturerIds: splitIds(r.lecturerIds),
          supervisorIds: splitIds(r.supervisorIds),
          technicalIds: splitIds(r.technicalIds),
          notes: String(r.notes || ''),
          isDemo: String(r.isDemo).toLowerCase() === 'true'
        };
      }),
      settings: settingsRows.length > 0 ? parseSettingsRow(settingsRows[0]) : null,
      updatedAt: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (Array.isArray(payload.people)) {
      writeSheetObjects(
        ss,
        'People',
        ['id', 'name', 'employeeId', 'department', 'roles', 'email', 'phone', 'active', 'avatarColor'],
        payload.people.map(function (p) {
          return {
            id: p.id || '',
            name: p.name || '',
            employeeId: p.employeeId || '',
            department: p.department || '',
            roles: Array.isArray(p.roles) ? p.roles.join('; ') : 'Lecturer',
            email: p.email || '',
            phone: p.phone || '',
            active: p.active ? 'true' : 'false',
            avatarColor: p.avatarColor || 'bg-blue-600'
          };
        })
      );
    }

    if (Array.isArray(payload.courses)) {
      writeSheetObjects(
        ss,
        'Courses',
        ['id', 'name', 'code', 'category', 'description', 'defaultDurationDays', 'color', 'active'],
        payload.courses.map(function (c) {
          return {
            id: c.id || '',
            name: c.name || '',
            code: c.code || '',
            category: c.category || '',
            description: c.description || '',
            defaultDurationDays: c.defaultDurationDays || 5,
            color: c.color || '#2563eb',
            active: c.active ? 'true' : 'false'
          };
        })
      );
    }

    if (Array.isArray(payload.sessions)) {
      writeSheetObjects(
        ss,
        'Sessions',
        ['id', 'courseId', 'startDate', 'endDate', 'startTime', 'endTime', 'location', 'lecturerIds', 'supervisorIds', 'technicalIds', 'notes', 'isDemo'],
        payload.sessions.map(function (s) {
          return {
            id: s.id || '',
            courseId: s.courseId || '',
            startDate: s.startDate || '',
            endDate: s.endDate || '',
            startTime: s.startTime || '09:00',
            endTime: s.endTime || '14:00',
            location: s.location || '',
            lecturerIds: Array.isArray(s.lecturerIds) ? s.lecturerIds.join('; ') : '',
            supervisorIds: Array.isArray(s.supervisorIds) ? s.supervisorIds.join('; ') : '',
            technicalIds: Array.isArray(s.technicalIds) ? s.technicalIds.join('; ') : '',
            notes: s.notes || '',
            isDemo: s.isDemo ? 'true' : 'false'
          };
        })
      );
    }

    if (payload.settings) {
      writeSheetObjects(
        ss,
        'Settings',
        ['workingHoursStart', 'workingHoursEnd', 'timeSlotMinutes', 'language', 'showWeekends', 'defaultDurationDays'],
        [
          {
            workingHoursStart: payload.settings.workingHoursStart || 8,
            workingHoursEnd: payload.settings.workingHoursEnd || 22,
            timeSlotMinutes: payload.settings.timeSlotMinutes || 30,
            language: payload.settings.language || 'en',
            showWeekends: payload.settings.showWeekends ? 'true' : 'false',
            defaultDurationDays: payload.settings.defaultDurationDays || 5
          }
        ]
      );
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, updatedAt: new Date().toISOString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function splitIds(val) {
  if (!val) return [];
  return String(val)
    .split(/[;,]/)
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

function parseSettingsRow(r) {
  return {
    workingHoursStart: Number(r.workingHoursStart) || 8,
    workingHoursEnd: Number(r.workingHoursEnd) || 22,
    timeSlotMinutes: Number(r.timeSlotMinutes) || 30,
    language: r.language === 'ar' ? 'ar' : 'en',
    showWeekends: String(r.showWeekends).toLowerCase() !== 'false',
    defaultDurationDays: Number(r.defaultDurationDays) || 5
  };
}

function readSheetObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('').trim() === '') continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

function writeSheetObjects(ss, sheetName, headers, objects) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();
  var matrix = [headers];
  for (var i = 0; i < objects.length; i++) {
    var obj = objects[i];
    var row = headers.map(function (h) {
      return obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : '';
    });
    matrix.push(row);
  }
  sheet.getRange(1, 1, matrix.length, headers.length).setNumberFormat('@').setValues(matrix);
}
