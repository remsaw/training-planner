export type Role =
  | 'محاضر'
  | 'مشرف فنى'
  | 'تقنى/ادارى'
  | 'مسؤل مالى'
  | 'فنى اجهزة'
  | 'تصوير وطباعة';

export const ALL_ROLES: Role[] = [
  'محاضر',
  'مشرف فنى',
  'تقنى/ادارى',
  'مسؤل مالى',
  'فنى اجهزة',
  'تصوير وطباعة',
];

const LEGACY_ROLE_MAP: Record<string, Role> = {
  Lecturer: 'محاضر',
  Supervisor: 'مشرف فنى',
  Technical: 'تقنى/ادارى',
};

export function normalizeRole(role: string): Role | null {
  const trimmed = role.trim();
  if ((ALL_ROLES as string[]).includes(trimmed)) {
    return trimmed as Role;
  }
  if (LEGACY_ROLE_MAP[trimmed]) {
    return LEGACY_ROLE_MAP[trimmed];
  }
  return null;
}

export function normalizeRoles(roles: unknown): Role[] {
  if (!Array.isArray(roles)) return ['محاضر'];
  const mapped = roles
    .map((r) => (typeof r === 'string' ? normalizeRole(r) : null))
    .filter((r): r is Role => r !== null);
  return mapped.length > 0 ? Array.from(new Set(mapped)) : ['محاضر'];
}

export interface Person {
  id: string;
  name: string;
  employeeId?: string;
  department: string;
  roles: Role[];
  email?: string;
  phone?: string;
  active: boolean;
  avatarColor?: string;
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  category: string;
  description?: string;
  defaultDurationDays?: number;
  color?: string;
  active: boolean;
}

export interface TrainingSession {
  id: string;
  courseId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location: string;
  lecturerIds: string[];
  supervisorIds: string[];
  technicalIds: string[];
  financialIds?: string[];
  equipmentIds?: string[];
  printingIds?: string[];
  notes?: string;
  recurringGroupId?: string;
  isDemo?: boolean;
}

export type ConflictType = 'SAME_DAY' | 'DATE_RANGE' | 'TIME_OVERLAP';

export interface ConflictReport {
  id: string;
  type: ConflictType;
  personId: string;
  personName: string;
  role: Role;
  conflictingSessionId: string;
  conflictingCourseName: string;
  conflictingDates: string;
  conflictingTime: string;
  attemptedSessionId?: string;
  attemptedCourseName?: string;
  attemptedDates: string;
  attemptedTime: string;
  date: string;
  description: string;
}

export interface PersonAvailability {
  person: Person;
  isAvailable: boolean;
  reason?: string;
  conflictingSession?: TrainingSession;
  conflictingCourse?: Course;
}

export type CalendarViewType = 'resource-week' | 'resource-day' | 'month';

export interface AppSettings {
  workingHoursStart: number; // e.g. 8 (08:00)
  workingHoursEnd: number;   // e.g. 22 (22:00)
  timeSlotMinutes: number;   // 30
  language: 'en' | 'ar';
  showWeekends: boolean;
  defaultDurationDays: number;
}
