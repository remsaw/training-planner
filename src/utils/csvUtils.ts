import { Person, Course, TrainingSession, ConflictReport, Role, normalizeRole } from '../types';

/**
 * Escapes and formats a single value for CSV output
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Download a CSV file in browser
 */
export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------- EXPORT FUNCTIONS ----------------

export function exportPeopleToCsv(people: Person[]): string {
  const headers = ['ID', 'Name', 'Employee ID', 'Department', 'Role', 'Email', 'Phone', 'Active'];
  const rows = people.map((p) => [
    escapeCsv(p.id),
    escapeCsv(p.name),
    escapeCsv(p.employeeId || ''),
    escapeCsv(p.department),
    escapeCsv(p.roles.join('; ')),
    escapeCsv(p.email || ''),
    escapeCsv(p.phone || ''),
    escapeCsv(p.active ? 'true' : 'false'),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportCoursesToCsv(courses: Course[]): string {
  const headers = ['Course ID', 'Course Name', 'Course Code', 'Category', 'Description', 'Default Duration Days', 'Active'];
  const rows = courses.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.name),
    escapeCsv(c.code || ''),
    escapeCsv(c.category),
    escapeCsv(c.description || ''),
    escapeCsv(c.defaultDurationDays || 1),
    escapeCsv(c.active ? 'true' : 'false'),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportTrainingToCsv(sessions: TrainingSession[], courses: Course[], people: Person[]): string {
  const headers = [
    'Training ID',
    'Course ID',
    'Course Name',
    'Start Date',
    'End Date',
    'Start Time',
    'End Time',
    'Location',
    'محاضر IDs',
    'محاضر Names',
    'مشرف فنى IDs',
    'مشرف فنى Names',
    'تقنى/ادارى IDs',
    'تقنى/ادارى Names',
    'مسؤل مالى IDs',
    'مسؤل مالى Names',
    'فنى اجهزة IDs',
    'فنى اجهزة Names',
    'تصوير وطباعة IDs',
    'تصوير وطباعة Names',
    'Notes',
  ];

  const getNames = (ids: string[]) =>
    (ids || [])
      .map((id) => people.find((p) => p.id === id)?.name || id)
      .join('; ');

  const rows = sessions.map((s) => {
    const course = courses.find((c) => c.id === s.courseId);
    return [
      escapeCsv(s.id),
      escapeCsv(s.courseId),
      escapeCsv(course ? course.name : s.courseId),
      escapeCsv(s.startDate),
      escapeCsv(s.endDate),
      escapeCsv(s.startTime),
      escapeCsv(s.endTime),
      escapeCsv(s.location),
      escapeCsv((s.lecturerIds || []).join('; ')),
      escapeCsv(getNames(s.lecturerIds || [])),
      escapeCsv((s.supervisorIds || []).join('; ')),
      escapeCsv(getNames(s.supervisorIds || [])),
      escapeCsv((s.technicalIds || []).join('; ')),
      escapeCsv(getNames(s.technicalIds || [])),
      escapeCsv((s.financialIds || []).join('; ')),
      escapeCsv(getNames(s.financialIds || [])),
      escapeCsv((s.equipmentIds || []).join('; ')),
      escapeCsv(getNames(s.equipmentIds || [])),
      escapeCsv((s.printingIds || []).join('; ')),
      escapeCsv(getNames(s.printingIds || [])),
      escapeCsv(s.notes || ''),
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportConflictsToCsv(conflicts: ConflictReport[]): string {
  const headers = [
    'Conflict ID',
    'Type',
    'Person ID',
    'Person Name',
    'Role',
    'Conflicting Course',
    'Conflicting Dates',
    'Conflicting Time',
    'Attempted Course',
    'Attempted Dates',
    'Attempted Time',
    'Description',
  ];

  const rows = conflicts.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.type),
    escapeCsv(c.personId),
    escapeCsv(c.personName),
    escapeCsv(c.role),
    escapeCsv(c.conflictingCourseName),
    escapeCsv(c.conflictingDates),
    escapeCsv(c.conflictingTime),
    escapeCsv(c.attemptedCourseName || ''),
    escapeCsv(c.attemptedDates || ''),
    escapeCsv(c.attemptedTime || ''),
    escapeCsv(c.description),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ---------------- IMPORT / PARSE FUNCTIONS ----------------

/**
 * Standard CSV line parser that respects quotes and commas
 */
export function parseCsvRows(text: string): string[][] {
  const lines: string[][] = [];
  const rows = text.split(/\r?\n/);

  for (const row of rows) {
    if (!row.trim()) continue;
    const entries: string[] = [];
    let insideQuotes = false;
    let entry = '';

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        if (insideQuotes && row[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        entries.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    entries.push(entry.trim());
    lines.push(entries);
  }

  return lines;
}

export function parsePeopleCsv(csvText: string): { people: Person[]; errors: string[] } {
  const lines = parseCsvRows(csvText);
  if (lines.length < 2) {
    return { people: [], errors: ['CSV file is empty or missing headers'] };
  }

  const people: Person[] = [];
  const errors: string[] = [];

  const headerRow = lines[0].map((h) => h.toLowerCase());
  const hasEmployeeIdCol = headerRow.some((h) => h.includes('employee'));

  // Supports both 8-col export format (ID, Name, Employee ID, Department, Role, Email, Phone, Active)
  // and 7-col template format (ID, Name, Department, Role, Email, Phone, Active)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 2) continue;

    const id = row[0] || `person_${Date.now()}_${i}`;
    const name = row[1];
    const employeeId = hasEmployeeIdCol ? row[2] || '' : '';
    const offset = hasEmployeeIdCol ? 1 : 0;
    const department = row[2 + offset] || 'General';
    const roleStr = row[3 + offset] || 'محاضر';
    const email = row[4 + offset] || '';
    const phone = row[5 + offset] || '';
    const activeStr = row[6 + offset] || 'true';

    if (!name) {
      errors.push(`Row ${i + 1}: Name is required`);
      continue;
    }

    const rawRoles = roleStr.split(/[;,]/).map((r) => r.trim());
    const validRoles: Role[] = rawRoles
      .map((r) => normalizeRole(r))
      .filter((r): r is Role => r !== null);
    if (validRoles.length === 0) validRoles.push('محاضر');

    people.push({
      id,
      name,
      ...(employeeId ? { employeeId } : {}),
      department,
      roles: validRoles,
      email,
      phone,
      active: activeStr.toLowerCase() !== 'false' && activeStr.toLowerCase() !== '0',
    });
  }

  return { people, errors };
}

export function parseCoursesCsv(csvText: string): { courses: Course[]; errors: string[] } {
  const lines = parseCsvRows(csvText);
  if (lines.length < 2) {
    return { courses: [], errors: ['CSV file is empty or missing headers'] };
  }

  const courses: Course[] = [];
  const errors: string[] = [];

  const headerRow = lines[0].map((h) => h.toLowerCase());
  const hasDurationCol = headerRow.some((h) => h.includes('duration'));

  // Supports both 7-col export format (Course ID, Course Name, Course Code, Category, Description, Default Duration Days, Active)
  // and 6-col template format (Course ID, Course Name, Course Code, Category, Description, Active)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 2) continue;

    const id = row[0] || `course_${Date.now()}_${i}`;
    const name = row[1];
    const code = row[2] || '';
    const category = row[3] || 'General Training';
    const description = row[4] || '';
    const parsedDuration = hasDurationCol ? Number(row[5]) : 3;
    const defaultDurationDays = !Number.isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : 3;
    const activeStr = (hasDurationCol ? row[6] : row[5]) || 'true';

    if (!name) {
      errors.push(`Row ${i + 1}: Course Name is required`);
      continue;
    }

    courses.push({
      id,
      name,
      code,
      category,
      description,
      defaultDurationDays,
      color: '#2563eb',
      active: activeStr.toLowerCase() !== 'false' && activeStr.toLowerCase() !== '0',
    });
  }

  return { courses, errors };
}

export function parseTrainingCsv(csvText: string): { sessions: TrainingSession[]; errors: string[] } {
  const lines = parseCsvRows(csvText);
  if (lines.length < 2) {
    return { sessions: [], errors: ['CSV file is empty or missing headers'] };
  }

  const sessions: TrainingSession[] = [];
  const errors: string[] = [];

  const headerRow = lines[0].map((h) => h.toLowerCase());
  const isExportFormat = headerRow.some((h) => h.includes('course name'));

  // Supports both 15-col export format (with Course Name and Staff Names)
  // and 11-col template format (Training ID, Course ID, Start Date, End Date, Start Time, End Time, Location, Lecturer IDs, Supervisor IDs, Technical IDs, Notes)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 4) continue;

    const id = row[0] || `training_${Date.now()}_${i}`;
    const courseId = row[1];
    const startDate = isExportFormat ? row[3] : row[2];
    const endDate = (isExportFormat ? row[4] : row[3]) || startDate;
    const startTime = (isExportFormat ? row[5] : row[4]) || '09:00';
    const endTime = (isExportFormat ? row[6] : row[5]) || '14:00';
    const location = (isExportFormat ? row[7] : row[6]) || 'Training Room';
    const lecturerIds = ((isExportFormat ? row[8] : row[7]) || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const supervisorIds = ((isExportFormat ? row[10] : row[8]) || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const technicalIds = ((isExportFormat ? row[12] : row[9]) || '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const hasNewRolesExport = isExportFormat && row.length >= 21;
    const financialIds = (hasNewRolesExport ? row[14] || '' : '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const equipmentIds = (hasNewRolesExport ? row[16] || '' : '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const printingIds = (hasNewRolesExport ? row[18] || '' : '').split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const notes = (hasNewRolesExport ? row[20] : isExportFormat ? row[14] : row[10]) || '';

    if (!courseId) {
      errors.push(`Row ${i + 1}: Course ID is required`);
      continue;
    }
    if (!startDate) {
      errors.push(`Row ${i + 1}: Start Date is required`);
      continue;
    }

    sessions.push({
      id,
      courseId,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      lecturerIds,
      supervisorIds,
      technicalIds,
      financialIds,
      equipmentIds,
      printingIds,
      notes,
    });
  }

  return { sessions, errors };
}
