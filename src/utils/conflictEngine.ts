import { TrainingSession, Person, Course, Role, ConflictReport, PersonAvailability } from '../types';
import { formatDateRange } from './dateUtils';

/**
 * Checks if a given person is in the specified training session and returns all roles they hold
 */
export function isPersonInSession(personId: string, session: TrainingSession): { inSession: boolean; role?: Role; roles: Role[] } {
  const roles: Role[] = [];
  if (session.lecturerIds?.includes(personId)) {
    roles.push('Lecturer');
  }
  if (session.supervisorIds?.includes(personId)) {
    roles.push('Supervisor');
  }
  if (session.technicalIds?.includes(personId)) {
    roles.push('Technical');
  }
  return {
    inSession: roles.length > 0,
    role: roles[0],
    roles,
  };
}

/**
 * Deterministic Conflict Detection Algorithm
 * Primary rule:
 * existingStartDate <= newEndDate AND existingEndDate >= newStartDate AND personId is the same
 */
export function checkPersonConflict(
  personId: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  sessions: TrainingSession[],
  excludeSessionId?: string
): { hasConflict: boolean; conflictingSession?: TrainingSession; roleInConflicting?: Role; rolesInConflicting?: Role[]; reason?: string } {
  if (!personId || !startDate || !endDate) {
    return { hasConflict: false };
  }

  for (const session of sessions) {
    // Exclude the session itself if we are editing
    if (excludeSessionId && session.id === excludeSessionId) {
      continue;
    }

    const { inSession, role, roles } = isPersonInSession(personId, session);
    if (!inSession) {
      continue;
    }

    // PRIMARY RULE: Date range overlap (One person = One training per calendar day)
    // existingStartDate <= newEndDate AND existingEndDate >= newStartDate
    const dateOverlap = session.startDate <= endDate && session.endDate >= startDate;

    if (dateOverlap) {
      // Check if times overlap too for extra description
      const timeOverlap = session.startTime < endTime && session.endTime > startTime;
      const roleText = roles.join(' & ');
      
      const reason = `Assigned to another training during ${formatDateRange(session.startDate, session.endDate)} (${session.startTime}–${session.endTime}) as ${roleText}${timeOverlap ? ' with overlapping hours' : ' (same calendar date rule)'}`;

      return {
        hasConflict: true,
        conflictingSession: session,
        roleInConflicting: role,
        rolesInConflicting: roles,
        reason,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Get availability status for all active people for a requested date & time
 */
export function getPeopleAvailability(
  people: Person[],
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  sessions: TrainingSession[],
  courses: Course[],
  excludeSessionId?: string
): PersonAvailability[] {
  return people.map((person) => {
    // If person is inactive, they cannot be assigned to new training
    if (!person.active) {
      return {
        person,
        isAvailable: false,
        reason: 'Person is inactive',
      };
    }

    const conflict = checkPersonConflict(
      person.id,
      startDate,
      endDate,
      startTime,
      endTime,
      sessions,
      excludeSessionId
    );

    if (conflict.hasConflict && conflict.conflictingSession) {
      const course = courses.find((c) => c.id === conflict.conflictingSession!.courseId);
      return {
        person,
        isAvailable: false,
        reason: conflict.reason,
        conflictingSession: conflict.conflictingSession,
        conflictingCourse: course,
      };
    }

    return {
      person,
      isAvailable: true,
    };
  });
}

/**
 * Validate a candidate session before saving or moving
 * Returns an array of detailed ConflictReports
 */
export function validateSessionConflicts(
  candidate: {
    id?: string;
    courseId: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    lecturerIds: string[];
    supervisorIds: string[];
    technicalIds: string[];
  },
  sessions: TrainingSession[],
  people: Person[],
  courses: Course[]
): ConflictReport[] {
  const conflicts: ConflictReport[] = [];
  const candidateCourse = courses.find((c) => c.id === candidate.courseId);
  const attemptedCourseName = candidateCourse ? candidateCourse.name : 'Selected Course';
  const attemptedDates = formatDateRange(candidate.startDate, candidate.endDate);
  const attemptedTime = `${candidate.startTime}–${candidate.endTime}`;

  const checkRoleGroup = (personIds: string[], role: Role) => {
    for (const personId of personIds) {
      const person = people.find((p) => p.id === personId);
      const personName = person ? person.name : `Person ${personId}`;

      const result = checkPersonConflict(
        personId,
        candidate.startDate,
        candidate.endDate,
        candidate.startTime,
        candidate.endTime,
        sessions,
        candidate.id
      );

      if (result.hasConflict && result.conflictingSession) {
        const confSession = result.conflictingSession;
        const confCourse = courses.find((c) => c.id === confSession.courseId);
        const confCourseName = confCourse ? confCourse.name : 'Another Course';
        const confDates = formatDateRange(confSession.startDate, confSession.endDate);
        const confTime = `${confSession.startTime}–${confSession.endTime}`;

        const isExactSameDay = candidate.startDate === confSession.startDate && candidate.endDate === confSession.endDate;
        const timeOverlap = confSession.startTime < candidate.endTime && confSession.endTime > candidate.startTime;

        let type: 'SAME_DAY' | 'DATE_RANGE' | 'TIME_OVERLAP' = 'DATE_RANGE';
        if (isExactSameDay) {
          type = timeOverlap ? 'TIME_OVERLAP' : 'SAME_DAY';
        }

        conflicts.push({
          id: `conflict_${personId}_${role}_${confSession.id}`,
          type,
          personId,
          personName,
          role,
          conflictingSessionId: confSession.id,
          conflictingCourseName: confCourseName,
          conflictingDates: confDates,
          conflictingTime: confTime,
          attemptedSessionId: candidate.id,
          attemptedCourseName,
          attemptedDates,
          attemptedTime,
          date: candidate.startDate,
          description: `${personName} is already assigned to "${confCourseName}" (${confDates}, ${confTime}) as ${result.roleInConflicting}. Cannot assign to "${attemptedCourseName}" (${attemptedDates}, ${attemptedTime}).`,
        });
      }
    }
  };

  checkRoleGroup(candidate.lecturerIds || [], 'Lecturer');
  checkRoleGroup(candidate.supervisorIds || [], 'Supervisor');
  checkRoleGroup(candidate.technicalIds || [], 'Technical');

  return conflicts;
}

/**
 * Scan entire database to detect all existing conflicts (e.g. for Conflicts page or KPI audit)
 */
export function detectAllConflicts(
  sessions: TrainingSession[],
  people: Person[],
  courses: Course[]
): ConflictReport[] {
  const allConflicts: ConflictReport[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < sessions.length; i++) {
    const s1 = sessions[i];
    for (let j = i + 1; j < sessions.length; j++) {
      const s2 = sessions[j];

      // Check if dates overlap: s1.startDate <= s2.endDate && s1.endDate >= s2.startDate
      if (s1.startDate <= s2.endDate && s1.endDate >= s2.startDate) {
        // Find people in both
        const s1People = [
          ...(s1.lecturerIds || []).map((id) => ({ id, role: 'Lecturer' as Role })),
          ...(s1.supervisorIds || []).map((id) => ({ id, role: 'Supervisor' as Role })),
          ...(s1.technicalIds || []).map((id) => ({ id, role: 'Technical' as Role })),
        ];

        for (const p of s1People) {
          const inS2 = isPersonInSession(p.id, s2);
          if (inS2.inSession) {
            const pairKey = [s1.id, s2.id, p.id].sort().join(':');
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            const person = people.find((item) => item.id === p.id);
            const personName = person ? person.name : p.id;
            const c1 = courses.find((c) => c.id === s1.courseId);
            const c2 = courses.find((c) => c.id === s2.courseId);

            const c1Name = c1 ? c1.name : 'Training A';
            const c2Name = c2 ? c2.name : 'Training B';

            const timeOverlap = s1.startTime < s2.endTime && s1.endTime > s2.startTime;
            const isSameDay = s1.startDate === s2.startDate && s1.endDate === s2.endDate;

            allConflicts.push({
              id: `conflict_${pairKey}`,
              type: timeOverlap ? 'TIME_OVERLAP' : (isSameDay ? 'SAME_DAY' : 'DATE_RANGE'),
              personId: p.id,
              personName,
              role: p.role,
              conflictingSessionId: s1.id,
              conflictingCourseName: c1Name,
              conflictingDates: formatDateRange(s1.startDate, s1.endDate),
              conflictingTime: `${s1.startTime}–${s1.endTime}`,
              attemptedSessionId: s2.id,
              attemptedCourseName: c2Name,
              attemptedDates: formatDateRange(s2.startDate, s2.endDate),
              attemptedTime: `${s2.startTime}–${s2.endTime}`,
              date: s1.startDate > s2.startDate ? s1.startDate : s2.startDate,
              description: `${personName} is assigned to both "${c1Name}" and "${c2Name}" across overlapping dates (${formatDateRange(s1.startDate, s1.endDate)} vs ${formatDateRange(s2.startDate, s2.endDate)}).`,
            });
          }
        }
      }
    }
  }

  return allConflicts;
}
