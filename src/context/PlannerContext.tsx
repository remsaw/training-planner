import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Person,
  Course,
  TrainingSession,
  ConflictReport,
  CalendarViewType,
  AppSettings,
  Role,
} from '../types';
import { INITIAL_PEOPLE, INITIAL_COURSES, INITIAL_SESSIONS } from '../data/demoData';
import {
  validateSessionConflicts,
  detectAllConflicts,
  checkPersonConflict,
  isPersonInSession,
} from '../utils/conflictEngine';
import {
  formatDate,
  parseDate,
  addDays,
  calculateDaysBetween,
  getWeekDays,
  isDateWithin,
} from '../utils/dateUtils';
import {
  parsePeopleCsv,
  parseCoursesCsv,
  parseTrainingCsv,
  exportPeopleToCsv,
  exportCoursesToCsv,
  exportTrainingToCsv,
  exportConflictsToCsv,
  downloadCsv,
} from '../utils/csvUtils';
import { fetchFromGoogleSheets, pushToGoogleSheets } from '../utils/googleSheetsSync';

interface FilterState {
  role: 'All' | Role;
  personId: string;
  courseId: string;
  location: string;
  status: 'All' | 'Available' | 'Busy' | 'Conflict';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface PlannerContextType {
  // Data
  people: Person[];
  courses: Course[];
  sessions: TrainingSession[];
  settings: AppSettings;
  currentDate: Date;
  calendarView: CalendarViewType;
  activePage: 'calendar' | 'people' | 'courses' | 'conflicts' | 'reports' | 'settings';
  selectedSessionId: string | null;
  filters: FilterState;
  searchQuery: string;
  toasts: ToastMessage[];

  // Computed
  allConflicts: ConflictReport[];
  kpis: {
    todayTrainingsCount: number;
    thisWeekTrainingsCount: number;
    activePeopleCount: number;
    activeCoursesCount: number;
    conflictsCount: number;
  };
  filteredPeople: Person[];
  filteredSessions: TrainingSession[];

  // Setters
  setCurrentDate: (date: Date) => void;
  setCalendarView: (view: CalendarViewType) => void;
  setActivePage: (page: 'calendar' | 'people' | 'courses' | 'conflicts' | 'reports' | 'settings') => void;
  setSelectedSessionId: (id: string | null) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  setSearchQuery: (query: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  dismissToast: (id: string) => void;

  // Actions
  addPerson: (data: Omit<Person, 'id'>) => { success: boolean; person?: Person; error?: string };
  updatePerson: (id: string, data: Partial<Person>) => { success: boolean; error?: string };
  deactivatePerson: (id: string) => void;
  activatePerson: (id: string) => void;
  deletePerson: (id: string) => { success: boolean; reason?: string };

  addCourse: (data: Omit<Course, 'id'>) => { success: boolean; course?: Course; error?: string };
  updateCourse: (id: string, data: Partial<Course>) => { success: boolean; error?: string };
  deleteCourse: (id: string) => { success: boolean; error?: string };

  addSession: (data: Omit<TrainingSession, 'id'>) => { success: boolean; session?: TrainingSession; conflicts?: ConflictReport[]; error?: string };
  updateSession: (id: string, data: Partial<TrainingSession>) => { success: boolean; session?: TrainingSession; conflicts?: ConflictReport[]; error?: string };
  deleteSession: (id: string) => void;

  moveSession: (id: string, newStartDate: string) => { success: boolean; conflicts?: ConflictReport[]; error?: string };
  resizeSession: (id: string, newEndDate: string) => { success: boolean; conflicts?: ConflictReport[]; error?: string };
  duplicateSession: (id: string, newStartDate: string) => { success: boolean; session?: TrainingSession; conflicts?: ConflictReport[]; error?: string };

  importPeopleData: (csvText: string) => { imported: number; errors: string[] };
  importCoursesData: (csvText: string) => { imported: number; errors: string[] };
  importTrainingData: (csvText: string) => { imported: number; conflicts: ConflictReport[]; errors: string[] };

  exportPeople: () => void;
  exportCourses: () => void;
  exportTraining: () => void;
  exportConflicts: () => void;

  resetToDemoData: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Security & Password Access Gate
  isLocked: boolean;
  appPassword: string;
  unlockApp: (password: string, remember?: boolean) => boolean;
  lockApp: () => void;
  setAppPassword: (newPassword: string) => void;

  // Google Sheets Cloud Sync
  googleSheetsUrl: string;
  setGoogleSheetsUrl: (url: string) => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;
  syncError: string | null;
  pullFromCloud: (silent?: boolean) => Promise<boolean>;
  pushToCloud: (silent?: boolean) => Promise<boolean>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

const LOCAL_STORAGE_PEOPLE = 'trp_people_v2';
const LOCAL_STORAGE_COURSES = 'trp_courses_v2';
const LOCAL_STORAGE_SESSIONS = 'trp_sessions_v2';
const LOCAL_STORAGE_SETTINGS = 'trp_settings_v2';
const LOCAL_STORAGE_PASSWORD = 'trp_password_v2';
const LOCAL_STORAGE_GSHEETS_URL = 'trp_google_sheets_url_v1';
const DEFAULT_GSHEETS_URL =
  'https://script.google.com/macros/s/AKfycbxMHeQ9xplb82kBw1ye67Mmlr1MRGhx-80gUURx8aFOoUE3-l2vJS7Ph7flPUKiugb0_g/exec';
const SESSION_STORAGE_UNLOCKED = 'trp_unlocked_v2';

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Security State (Password Gate)
  const [appPassword, setAppPasswordState] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_PASSWORD) || 'Hitstc@2030';
    } catch {
      return 'Hitstc@2030';
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_UNLOCKED) !== 'true';
    } catch {
      return true;
    }
  });

  // Initial state from localStorage or demo data
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PEOPLE);
      return saved ? JSON.parse(saved) : INITIAL_PEOPLE;
    } catch {
      return INITIAL_PEOPLE;
    }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_COURSES);
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [sessions, setSessions] = useState<TrainingSession[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSIONS);
      return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS);
      return saved
        ? JSON.parse(saved)
        : {
            workingHoursStart: 8,
            workingHoursEnd: 22,
            timeSlotMinutes: 30,
            language: 'en',
            showWeekends: true,
            defaultDurationDays: 5,
          };
    } catch {
      return {
        workingHoursStart: 8,
        workingHoursEnd: 22,
        timeSlotMinutes: 30,
        language: 'en',
        showWeekends: true,
        defaultDurationDays: 5,
      };
    }
  });

  // Current calendar view date: default to today
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [calendarView, setCalendarView] = useState<CalendarViewType>('resource-week');
  const [activePage, setActivePage] = useState<'calendar' | 'people' | 'courses' | 'conflicts' | 'reports' | 'settings'>('calendar');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    role: 'All',
    personId: 'All',
    courseId: 'All',
    location: 'All',
    status: 'All',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Google Sheets Cloud Sync State
  const [googleSheetsUrl, setGoogleSheetsUrlState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(LOCAL_STORAGE_GSHEETS_URL) ||
        import.meta.env.VITE_GOOGLE_SHEETS_URL ||
        DEFAULT_GSHEETS_URL
      );
    } catch {
      return import.meta.env.VITE_GOOGLE_SHEETS_URL || DEFAULT_GSHEETS_URL;
    }
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isInitialCloudLoadRef = useRef<boolean>(true);
  const skipNextAutoPushRef = useRef<boolean>(false);

  // Synchronize with local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PEOPLE, JSON.stringify(people));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [settings]);

  // Toast notifications helper
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute all conflicts in database
  const allConflicts = useMemo(() => {
    return detectAllConflicts(sessions, people, courses);
  }, [sessions, people, courses]);

  // Compute KPIs
  const kpis = useMemo(() => {
    const currentDateStr = formatDate(currentDate);
    const weekDays = getWeekDays(currentDate);
    const weekStartStr = weekDays[0].dateStr;
    const weekEndStr = weekDays[6].dateStr;

    // Today's trainings: sessions that cover currentDateStr
    const todayTrainingsCount = sessions.filter((s) =>
      isDateWithin(currentDateStr, s.startDate, s.endDate)
    ).length;

    // This week trainings: sessions that overlap the week
    const thisWeekTrainingsCount = sessions.filter((s) =>
      s.startDate <= weekEndStr && s.endDate >= weekStartStr
    ).length;

    const activePeopleCount = people.filter((p) => p.active).length;
    const activeCoursesCount = courses.filter((c) => c.active).length;
    const conflictsCount = allConflicts.length;

    return {
      todayTrainingsCount,
      thisWeekTrainingsCount,
      activePeopleCount,
      activeCoursesCount,
      conflictsCount,
    };
  }, [sessions, people, courses, currentDate, allConflicts]);

  // Filtered people
  const filteredPeople = useMemo(() => {
    let result = people;

    if (filters.role !== 'All') {
      result = result.filter((p) => p.roles.includes(filters.role as Role));
    }

    if (filters.personId !== 'All') {
      result = result.filter((p) => p.id === filters.personId);
    }

    if (filters.status !== 'All') {
      const weekDays = getWeekDays(currentDate);
      const periodStart = calendarView === 'resource-day' ? formatDate(currentDate) : weekDays[0].dateStr;
      const periodEnd = calendarView === 'resource-day' ? formatDate(currentDate) : weekDays[6].dateStr;

      result = result.filter((p) => {
        const hasSessionInPeriod = sessions.some(
          (s) => isPersonInSession(p.id, s).inSession && s.startDate <= periodEnd && s.endDate >= periodStart
        );
        const hasConflict = allConflicts.some((c) => c.personId === p.id);

        if (filters.status === 'Available') return p.active && !hasSessionInPeriod;
        if (filters.status === 'Busy') return hasSessionInPeriod;
        if (filters.status === 'Conflict') return hasConflict;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.roles.some((r) => r.toLowerCase().includes(q))
      );
    }

    return result;
  }, [people, filters, searchQuery, currentDate, calendarView, sessions, allConflicts]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (filters.courseId !== 'All') {
      result = result.filter((s) => s.courseId === filters.courseId);
    }

    if (filters.location !== 'All') {
      result = result.filter((s) => s.location.toLowerCase() === filters.location.toLowerCase());
    }

    if (filters.personId !== 'All') {
      result = result.filter(
        (s) =>
          s.lecturerIds?.includes(filters.personId) ||
          s.supervisorIds?.includes(filters.personId) ||
          s.technicalIds?.includes(filters.personId)
      );
    }

    if (filters.role !== 'All') {
      const r = filters.role;
      result = result.filter((s) => {
        if (r === 'Lecturer') return s.lecturerIds?.length > 0;
        if (r === 'Supervisor') return s.supervisorIds?.length > 0;
        if (r === 'Technical') return s.technicalIds?.length > 0;
        return true;
      });
    }

    if (filters.status === 'Conflict') {
      result = result.filter((s) =>
        allConflicts.some((c) => c.conflictingSessionId === s.id || c.attemptedSessionId === s.id)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const course = courses.find((c) => c.id === s.courseId);
        const courseMatch = course && (course.name.toLowerCase().includes(q) || course.code?.toLowerCase().includes(q));
        const locMatch = s.location.toLowerCase().includes(q);
        const peopleMatch = [
          ...(s.lecturerIds || []),
          ...(s.supervisorIds || []),
          ...(s.technicalIds || []),
        ].some((pid) => {
          const person = people.find((p) => p.id === pid);
          return person && person.name.toLowerCase().includes(q);
        });
        return courseMatch || locMatch || peopleMatch;
      });
    }

    return result;
  }, [sessions, courses, people, filters, searchQuery, allConflicts]);

  // Actions: People
  const addPerson = useCallback((data: Omit<Person, 'id'>) => {
    if (!data.name.trim()) {
      return { success: false, error: 'Full Name is required' };
    }
    if (!data.roles || data.roles.length === 0) {
      return { success: false, error: 'At least one role is required' };
    }

    const newPerson: Person = {
      ...data,
      id: `person_${Date.now()}`,
      avatarColor: data.avatarColor || 'bg-blue-600',
    };

    setPeople((prev) => [...prev, newPerson]);
    showToast('success', 'Person Added', `${newPerson.name} has been added and is available immediately.`);
    return { success: true, person: newPerson };
  }, [showToast]);

  const updatePerson = useCallback((id: string, data: Partial<Person>) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
    showToast('success', 'Person Updated', 'Person information updated across all calendar references.');
    return { success: true };
  }, [showToast]);

  const deactivatePerson = useCallback((id: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: false } : p))
    );
    showToast('info', 'Person Deactivated', 'Person is deactivated. Historical training records are preserved.');
  }, [showToast]);

  const activatePerson = useCallback((id: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: true } : p))
    );
    showToast('success', 'Person Activated', 'Person is now active and available for training scheduling.');
  }, [showToast]);

  const deletePerson = useCallback((id: string) => {
    const hasSessions = sessions.some((s) => isPersonInSession(id, s).inSession);
    if (hasSessions) {
      deactivatePerson(id);
      showToast(
        'warning',
        'Person Deactivated (Protected)',
        'This person has training assignments. They have been deactivated instead of deleted to protect historical records.'
      );
      return { success: false, reason: 'deactivated' };
    }
    setPeople((prev) => prev.filter((p) => p.id !== id));
    showToast('success', 'Person Deleted', 'Person removed completely.');
    return { success: true };
  }, [sessions, deactivatePerson, showToast]);

  // Actions: Courses
  const addCourse = useCallback((data: Omit<Course, 'id'>) => {
    if (!data.name.trim()) {
      return { success: false, error: 'Course Name is required' };
    }

    const newCourse: Course = {
      ...data,
      id: `course_${Date.now()}`,
      color: data.color || '#2563eb',
    };

    setCourses((prev) => [...prev, newCourse]);
    showToast('success', 'Course Created', `${newCourse.name} is now available in the training scheduler.`);
    return { success: true, course: newCourse };
  }, [showToast]);

  const updateCourse = useCallback((id: string, data: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    showToast('success', 'Course Updated', 'Course details updated.');
    return { success: true };
  }, [showToast]);

  const deleteCourse = useCallback((id: string) => {
    const hasSessions = sessions.some((s) => s.courseId === id);
    if (hasSessions) {
      showToast(
        'warning',
        'Cannot Delete Course',
        'This course has scheduled sessions on the calendar. Remove or reschedule them before deleting the course.'
      );
      return { success: false, error: 'Cannot delete course with scheduled training events. Archive or reassign first.' };
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    showToast('success', 'Course Deleted', 'Course removed successfully.');
    return { success: true };
  }, [sessions, showToast]);

  // Actions: Training Sessions with STRICT DETERMINISTIC CONFLICT PREVENTION
  const addSession = useCallback((data: Omit<TrainingSession, 'id'>) => {
    // 1. Validation checks
    if (!data.courseId) {
      return { success: false, error: 'Course selection is required' };
    }
    if (!data.startDate || !data.endDate) {
      return { success: false, error: 'Start Date and End Date are required' };
    }
    if (data.endDate < data.startDate) {
      return { success: false, error: 'End Date must be on or after Start Date' };
    }
    if (!data.startTime || !data.endTime) {
      return { success: false, error: 'Start Time and End Time are required' };
    }
    if (data.endTime <= data.startTime) {
      return { success: false, error: 'End Time must be later than Start Time' };
    }

    const assignedCount =
      (data.lecturerIds?.length || 0) +
      (data.supervisorIds?.length || 0) +
      (data.technicalIds?.length || 0);

    if (assignedCount === 0) {
      return { success: false, error: 'Resource Required: Assign at least one Lecturer, Supervisor, or Technical specialist' };
    }

    // 2. Conflict engine check
    const conflicts = validateSessionConflicts(
      data,
      sessions,
      people,
      courses
    );

    if (conflicts.length > 0) {
      showToast(
        'error',
        'Scheduling Conflict Detected',
        conflicts[0].description
      );
      return { success: false, conflicts, error: conflicts[0].description };
    }

    const newSession: TrainingSession = {
      ...data,
      id: `training_${Date.now()}`,
    };

    setSessions((prev) => [...prev, newSession]);
    showToast(
      'success',
      'Training Scheduled',
      `Training scheduled for ${calculateDaysBetween(data.startDate, data.endDate)} day(s) without conflicts.`
    );
    return { success: true, session: newSession };
  }, [sessions, people, courses, showToast]);

  const updateSession = useCallback((id: string, data: Partial<TrainingSession>) => {
    const existing = sessions.find((s) => s.id === id);
    if (!existing) {
      return { success: false, error: 'Training session not found' };
    }

    const merged = { ...existing, ...data };

    if (merged.endDate < merged.startDate) {
      return { success: false, error: 'End Date must be on or after Start Date' };
    }
    if (merged.endTime <= merged.startTime) {
      return { success: false, error: 'End Time must be later than Start Time' };
    }

    // Conflict engine: exclude current session ID
    const conflicts = validateSessionConflicts(
      merged,
      sessions,
      people,
      courses
    );

    if (conflicts.length > 0) {
      showToast(
        'error',
        'Cannot Update: Scheduling Conflict',
        conflicts[0].description
      );
      return { success: false, conflicts, error: conflicts[0].description };
    }

    setSessions((prev) => prev.map((s) => (s.id === id ? merged : s)));
    showToast('success', 'Training Updated', 'Training event updated successfully.');
    return { success: true, session: merged };
  }, [sessions, people, courses, showToast]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedSessionId === id) setSelectedSessionId(null);
    showToast('info', 'Training Removed', 'Training event removed from calendar.');
  }, [selectedSessionId, showToast]);

  // Drag & drop: move session entire range
  const moveSession = useCallback((id: string, newStartDate: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return { success: false, error: 'Session not found' };

    const durationDays = calculateDaysBetween(session.startDate, session.endDate);
    const newEndDate = addDays(newStartDate, durationDays - 1);

    const candidate = {
      ...session,
      startDate: newStartDate,
      endDate: newEndDate,
    };

    // Run conflict detection
    const conflicts = validateSessionConflicts(candidate, sessions, people, courses);
    if (conflicts.length > 0) {
      showToast(
        'error',
        'Move Rejected: Scheduling Conflict',
        `Cannot move training to ${newStartDate}. ${conflicts[0].description}`
      );
      return { success: false, conflicts, error: conflicts[0].description };
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, startDate: newStartDate, endDate: newEndDate } : s))
    );
    showToast('success', 'Training Moved', `Training shifted to ${newStartDate} – ${newEndDate}.`);
    return { success: true };
  }, [sessions, people, courses, showToast]);

  // Resize session: change end date
  const resizeSession = useCallback((id: string, newEndDate: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return { success: false, error: 'Session not found' };

    if (newEndDate < session.startDate) {
      showToast('error', 'Invalid Resize', 'End Date cannot precede Start Date.');
      return { success: false, error: 'End Date cannot precede Start Date' };
    }

    const candidate = {
      ...session,
      endDate: newEndDate,
    };

    // Run conflict detection
    const conflicts = validateSessionConflicts(candidate, sessions, people, courses);
    if (conflicts.length > 0) {
      showToast(
        'error',
        'Resize Rejected: Scheduling Conflict',
        `Cannot extend training to ${newEndDate}. ${conflicts[0].description}`
      );
      return { success: false, conflicts, error: conflicts[0].description };
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, endDate: newEndDate } : s))
    );
    showToast('success', 'Training Resized', `Training period adjusted to end on ${newEndDate}.`);
    return { success: true };
  }, [sessions, people, courses, showToast]);

  // Duplicate session
  const duplicateSession = useCallback((id: string, newStartDate: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return { success: false, error: 'Original session not found' };

    const durationDays = calculateDaysBetween(session.startDate, session.endDate);
    const newEndDate = addDays(newStartDate, durationDays - 1);

    const duplicateData: Omit<TrainingSession, 'id'> = {
      courseId: session.courseId,
      startDate: newStartDate,
      endDate: newEndDate,
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      lecturerIds: [...session.lecturerIds],
      supervisorIds: [...session.supervisorIds],
      technicalIds: [...session.technicalIds],
      notes: session.notes ? `Copy of ${session.notes}` : 'Duplicated session',
    };

    return addSession(duplicateData);
  }, [sessions, addSession]);

  // CSV Imports
  const importPeopleData = useCallback((csvText: string) => {
    const { people: importedPeople, errors } = parsePeopleCsv(csvText);
    if (importedPeople.length > 0) {
      setPeople((prev) => {
        // Merge or replace by ID
        const existingMap = new Map(prev.map((p) => [p.id, p]));
        importedPeople.forEach((p) => existingMap.set(p.id, p));
        return Array.from(existingMap.values());
      });
      showToast('success', 'Import Successful', `Imported ${importedPeople.length} people.`);
    }
    return { imported: importedPeople.length, errors };
  }, [showToast]);

  const importCoursesData = useCallback((csvText: string) => {
    const { courses: importedCourses, errors } = parseCoursesCsv(csvText);
    if (importedCourses.length > 0) {
      setCourses((prev) => {
        const existingMap = new Map(prev.map((c) => [c.id, c]));
        importedCourses.forEach((c) => existingMap.set(c.id, c));
        return Array.from(existingMap.values());
      });
      showToast('success', 'Import Successful', `Imported ${importedCourses.length} courses.`);
    }
    return { imported: importedCourses.length, errors };
  }, [showToast]);

  const importTrainingData = useCallback((csvText: string) => {
    const { sessions: importedSessions, errors } = parseTrainingCsv(csvText);
    if (importedSessions.length > 0) {
      // Append sessions then scan for all conflicts
      const newSessionsList = [...sessions, ...importedSessions];
      const detectedConflicts = detectAllConflicts(newSessionsList, people, courses);
      setSessions(newSessionsList);
      showToast(
        detectedConflicts.length > 0 ? 'warning' : 'success',
        'Training Imported',
        `Imported ${importedSessions.length} training events. ${detectedConflicts.length} conflict(s) detected.`
      );
      return { imported: importedSessions.length, conflicts: detectedConflicts, errors };
    }
    return { imported: 0, conflicts: [], errors };
  }, [sessions, people, courses, showToast]);

  // Exports
  const exportPeople = useCallback(() => {
    const csv = exportPeopleToCsv(people);
    downloadCsv(`training_planner_people_${formatDate(new Date())}.csv`, csv);
    showToast('info', 'Export Complete', 'People list exported to CSV.');
  }, [people, showToast]);

  const exportCourses = useCallback(() => {
    const csv = exportCoursesToCsv(courses);
    downloadCsv(`training_planner_courses_${formatDate(new Date())}.csv`, csv);
    showToast('info', 'Export Complete', 'Courses list exported to CSV.');
  }, [courses, showToast]);

  const exportTraining = useCallback(() => {
    const csv = exportTrainingToCsv(sessions, courses, people);
    downloadCsv(`training_planner_calendar_${formatDate(new Date())}.csv`, csv);
    showToast('info', 'Export Complete', 'Calendar schedule exported to CSV.');
  }, [sessions, courses, people, showToast]);

  const exportConflicts = useCallback(() => {
    const csv = exportConflictsToCsv(allConflicts);
    downloadCsv(`training_planner_conflicts_${formatDate(new Date())}.csv`, csv);
    showToast('info', 'Export Complete', 'Conflicts report exported to CSV.');
  }, [allConflicts, showToast]);

  // Clear all data
  const resetToDemoData = useCallback(() => {
    setPeople([]);
    setCourses([]);
    setSessions([]);
    setCurrentDate(new Date());
    localStorage.removeItem(LOCAL_STORAGE_PEOPLE);
    localStorage.removeItem(LOCAL_STORAGE_COURSES);
    localStorage.removeItem(LOCAL_STORAGE_SESSIONS);
    showToast('info', 'Database Cleared', 'All people, courses, and training sessions have been cleared.');
  }, [showToast]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('success', 'Settings Saved', 'Configuration preferences updated.');
  }, [showToast]);

  // Security callbacks
  const unlockApp = useCallback(
    (password: string, remember: boolean = true) => {
      if (password === appPassword) {
        setIsLocked(false);
        try {
          if (remember) {
            sessionStorage.setItem(SESSION_STORAGE_UNLOCKED, 'true');
          }
        } catch (e) {
          console.warn(e);
        }
        showToast('success', 'Access Granted', 'Welcome to Training Resource Planner.');
        return true;
      }
      return false;
    },
    [appPassword, showToast]
  );

  const lockApp = useCallback(() => {
    setIsLocked(true);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_UNLOCKED);
    } catch (e) {
      console.warn(e);
    }
    showToast('info', 'Screen Locked', 'Password required to begin planning.');
  }, [showToast]);

  const setAppPassword = useCallback(
    (newPassword: string) => {
      setAppPasswordState(newPassword);
      try {
        localStorage.setItem(LOCAL_STORAGE_PASSWORD, newPassword);
      } catch (e) {
        console.warn(e);
      }
      showToast('success', 'Password Updated', 'Your access password has been changed.');
    },
    [showToast]
  );

  // Google Sheets Cloud Sync callbacks
  const setGoogleSheetsUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      setGoogleSheetsUrlState(trimmed);
      setSyncError(null);
      if (!trimmed) {
        setSyncStatus('idle');
      }
      try {
        if (trimmed) {
          localStorage.setItem(LOCAL_STORAGE_GSHEETS_URL, trimmed);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_GSHEETS_URL);
        }
      } catch (e) {
        console.warn(e);
      }
    },
    []
  );

  const pushToCloud = useCallback(
    async (silent: boolean = false) => {
      if (!googleSheetsUrl.trim()) return false;
      setSyncStatus('syncing');
      setSyncError(null);
      try {
        const res = await pushToGoogleSheets(googleSheetsUrl, {
          people,
          courses,
          sessions,
          settings,
        });
        if (!res.ok) {
          throw new Error(res.error || 'Failed to write to Google Sheets');
        }
        setSyncStatus('synced');
        setLastSyncedAt(res.updatedAt || new Date().toISOString());
        if (!silent) {
          showToast('success', 'Saved to Google Sheets', 'All people, courses, and training schedules synced to cloud.');
        }
        return true;
      } catch (err: any) {
        const msg = err?.message || String(err);
        setSyncStatus('error');
        setSyncError(msg);
        if (!silent) {
          showToast('error', 'Google Sheets Sync Error', msg);
        }
        return false;
      }
    },
    [googleSheetsUrl, people, courses, sessions, settings, showToast]
  );

  const pullFromCloud = useCallback(
    async (silent: boolean = false) => {
      if (!googleSheetsUrl.trim()) return false;
      setSyncStatus('syncing');
      setSyncError(null);
      try {
        const res = await fetchFromGoogleSheets(googleSheetsUrl);
        if (!res.ok) {
          throw new Error(res.error || 'Failed to read from Google Sheets');
        }

        if (res.hasData || res.settings !== null) {
          skipNextAutoPushRef.current = true;
          if (Array.isArray(res.people)) setPeople(res.people);
          if (Array.isArray(res.courses)) setCourses(res.courses);
          if (Array.isArray(res.sessions)) setSessions(res.sessions);
          if (res.settings) setSettings((prev) => ({ ...prev, ...res.settings }));
          setSyncStatus('synced');
          setLastSyncedAt(res.updatedAt || new Date().toISOString());
          if (!silent) {
            showToast('success', 'Synced from Google Sheets', 'Loaded latest schedule data from your cloud spreadsheet.');
          }
          return true;
        } else {
          // Blank spreadsheet: initialize it with current data
          return await pushToCloud(silent);
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        setSyncStatus('error');
        setSyncError(msg);
        if (!silent) {
          showToast('error', 'Google Sheets Sync Error', msg);
        }
        return false;
      }
    },
    [googleSheetsUrl, pushToCloud, showToast]
  );

  // Initial pull when app starts or when Google Sheets URL is newly configured
  useEffect(() => {
    if (!googleSheetsUrl.trim()) {
      isInitialCloudLoadRef.current = false;
      return;
    }
    isInitialCloudLoadRef.current = true;
    pullFromCloud(true).finally(() => {
      isInitialCloudLoadRef.current = false;
    });
  }, [googleSheetsUrl]);

  // Auto-push changes to Google Sheets (debounced 700ms)
  useEffect(() => {
    if (!googleSheetsUrl.trim()) return;
    if (isInitialCloudLoadRef.current) return;
    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }

    const timer = setTimeout(() => {
      pushToCloud(true);
    }, 700);

    return () => clearTimeout(timer);
  }, [people, courses, sessions, settings, googleSheetsUrl, pushToCloud]);

  const value = {
    people,
    courses,
    sessions,
    settings,
    currentDate,
    calendarView,
    activePage,
    selectedSessionId,
    filters,
    searchQuery,
    toasts,
    allConflicts,
    kpis,
    filteredPeople,
    filteredSessions,
    setCurrentDate,
    setCalendarView,
    setActivePage,
    setSelectedSessionId,
    setFilters,
    setSearchQuery,
    showToast,
    dismissToast,
    addPerson,
    updatePerson,
    deactivatePerson,
    activatePerson,
    deletePerson,
    addCourse,
    updateCourse,
    deleteCourse,
    addSession,
    updateSession,
    deleteSession,
    moveSession,
    resizeSession,
    duplicateSession,
    importPeopleData,
    importCoursesData,
    importTrainingData,
    exportPeople,
    exportCourses,
    exportTraining,
    exportConflicts,
    resetToDemoData,
    updateSettings,
    isLocked,
    appPassword,
    unlockApp,
    lockApp,
    setAppPassword,
    googleSheetsUrl,
    setGoogleSheetsUrl,
    syncStatus,
    lastSyncedAt,
    syncError,
    pullFromCloud,
    pushToCloud,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
