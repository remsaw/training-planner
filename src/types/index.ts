export type Role = 'Lecturer' | 'Supervisor' | 'Technical';

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
