import React, { useState, useEffect, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { TrainingSession, Role, Person } from '../../types';
import { calculateDaysBetween, formatDuration, formatDateRange, addDays, formatDate } from '../../utils/dateUtils';
import { getPeopleAvailability, checkPersonConflict, validateSessionConflicts } from '../../utils/conflictEngine';
import { RoleBadge } from '../common/RoleBadge';
import {
  X,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Repeat,
  PlusCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSessionId?: string | null;
  initialDate?: string;
  initialEndDate?: string;
  initialPersonId?: string;
  initialTime?: string;
  initialCourseId?: string;
  onOpenCreateCourse: () => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  editSessionId,
  initialDate,
  initialEndDate,
  initialPersonId,
  initialTime,
  initialCourseId,
  onOpenCreateCourse,
}) => {
  const {
    courses,
    people,
    sessions,
    settings,
    addSession,
    updateSession,
    deleteSession,
    showToast,
  } = usePlanner();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = Boolean(editSessionId);
  const existingSession = useMemo(
    () => (editSessionId ? sessions.find((s) => s.id === editSessionId) : null),
    [editSessionId, sessions]
  );

  // Form state
  const [courseId, setCourseId] = useState('');
  const [startDate, setStartDate] = useState(() => initialDate || formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => initialEndDate || initialDate || addDays(formatDate(new Date()), 4));
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [endTime, setEndTime] = useState('14:00');
  const [location, setLocation] = useState('Training Hall 1');
  const [lecturerIds, setLecturerIds] = useState<string[]>([]);
  const [supervisorIds, setSupervisorIds] = useState<string[]>([]);
  const [technicalIds, setTechnicalIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [repeatMode, setRepeatMode] = useState<'None' | 'Daily' | 'Weekly'>('None');
  const [repeatWeeks, setRepeatWeeks] = useState(4);

  // Search states for person multi-selects
  const [lecturerSearch, setLecturerSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [technicalSearch, setTechnicalSearch] = useState('');

  // Conflict warning banner state
  const [inlineConflictWarning, setInlineConflictWarning] = useState<string | null>(null);

  // Populate form if editing or initial
  useEffect(() => {
    if (!isOpen) return;
    setConfirmDelete(false);
    setInlineConflictWarning(null);
    setLecturerSearch('');
    setSupervisorSearch('');
    setTechnicalSearch('');

    if (existingSession) {
      setCourseId(existingSession.courseId);
      setStartDate(existingSession.startDate);
      setEndDate(existingSession.endDate);
      setStartTime(existingSession.startTime);
      setEndTime(existingSession.endTime);
      setLocation(existingSession.location);
      setLecturerIds(existingSession.lecturerIds || []);
      setSupervisorIds(existingSession.supervisorIds || []);
      setTechnicalIds(existingSession.technicalIds || []);
      setNotes(existingSession.notes || '');
      setRepeatMode('None');
    } else {
      const selectedCourseId = initialCourseId || (courses.length > 0 ? courses[0].id : '');
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const defaultDur = selectedCourse?.defaultDurationDays || settings.defaultDurationDays || 5;

      const sDate = initialDate || formatDate(new Date());
      const eDate =
        initialEndDate ||
        (initialDate ? initialDate : addDays(sDate, Math.max(1, defaultDur) - 1));

      setCourseId(selectedCourseId);
      setStartDate(sDate);
      setEndDate(eDate);
      setStartTime(initialTime || '09:00');
      setEndTime('14:00');
      setLocation('Training Hall 1');
      setNotes('');
      setRepeatMode('None');
      setRepeatWeeks(4);

      if (initialPersonId) {
        const p = people.find((item) => item.id === initialPersonId);
        if (p) {
          setLecturerIds(p.roles.includes('Lecturer') ? [p.id] : []);
          setSupervisorIds(!p.roles.includes('Lecturer') && p.roles.includes('Supervisor') ? [p.id] : []);
          setTechnicalIds(
            !p.roles.includes('Lecturer') && !p.roles.includes('Supervisor') && p.roles.includes('Technical')
              ? [p.id]
              : []
          );
        } else {
          setLecturerIds([]);
          setSupervisorIds([]);
          setTechnicalIds([]);
        }
      } else {
        setLecturerIds([]);
        setSupervisorIds([]);
        setTechnicalIds([]);
      }
    }
  }, [existingSession, initialDate, initialEndDate, initialPersonId, initialTime, initialCourseId, courses, people, settings.defaultDurationDays, isOpen]);

  // Duration in days calculated automatically
  const durationLabel = useMemo(
    () => formatDuration(startDate, endDate),
    [startDate, endDate]
  );

  // Live availability for all people based on selected dates and times
  const availabilityMap = useMemo(() => {
    return getPeopleAvailability(
      people,
      startDate,
      endDate,
      startTime,
      endTime,
      sessions,
      courses,
      editSessionId || undefined
    );
  }, [people, startDate, endDate, startTime, endTime, sessions, courses, editSessionId]);

  // Live conflict evaluation for currently selected people
  const currentValidationConflicts = useMemo(() => {
    if (!courseId || !startDate || !endDate || !startTime || !endTime) return [];
    return validateSessionConflicts(
      {
        id: editSessionId || undefined,
        courseId,
        startDate,
        endDate,
        startTime,
        endTime,
        lecturerIds,
        supervisorIds,
        technicalIds,
      },
      sessions,
      people,
      courses
    );
  }, [
    editSessionId,
    courseId,
    startDate,
    endDate,
    startTime,
    endTime,
    lecturerIds,
    supervisorIds,
    technicalIds,
    sessions,
    people,
    courses,
  ]);

  if (!isOpen) return null;

  // Toggle selection with conflict feedback
  const handleTogglePerson = (personId: string, role: Role) => {
    const isLecturer = role === 'Lecturer';
    const isSupervisor = role === 'Supervisor';
    const isTechnical = role === 'Technical';

    const currentList = isLecturer ? lecturerIds : isSupervisor ? supervisorIds : technicalIds;
    const isSelected = currentList.includes(personId);

    if (isSelected) {
      if (isLecturer) setLecturerIds((prev) => prev.filter((id) => id !== personId));
      if (isSupervisor) setSupervisorIds((prev) => prev.filter((id) => id !== personId));
      if (isTechnical) setTechnicalIds((prev) => prev.filter((id) => id !== personId));
      setInlineConflictWarning(null);
    } else {
      // Check if person is busy
      const avail = availabilityMap.find((a) => a.person.id === personId);
      if (avail && !avail.isAvailable) {
        setInlineConflictWarning(
          `🔴 Scheduling Conflict: ${avail.person.name} is already assigned to "${
            avail.conflictingCourse?.name || 'another training'
          }" during ${formatDateRange(
            avail.conflictingSession?.startDate || '',
            avail.conflictingSession?.endDate || ''
          )} (${avail.conflictingSession?.startTime}–${avail.conflictingSession?.endTime}). One person = one training per calendar day.`
        );
        return; // Prevent selection of busy person!
      }

      // Add to selection
      if (isLecturer) setLecturerIds((prev) => [...prev, personId]);
      if (isSupervisor) setSupervisorIds((prev) => [...prev, personId]);
      if (isTechnical) setTechnicalIds((prev) => [...prev, personId]);
      setInlineConflictWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (endDate < startDate) {
      showToast('error', 'Invalid Date Range', 'End date must be on or after start date.');
      return;
    }
    if (endTime <= startTime) {
      showToast('error', 'Invalid Time', 'End time must be later than start time.');
      return;
    }
    if (!courseId) {
      showToast('warning', 'Course Required', 'Please select a training course.');
      return;
    }
    if (lecturerIds.length === 0 && supervisorIds.length === 0 && technicalIds.length === 0) {
      showToast('warning', 'Resource Required', 'Please assign at least one Lecturer, Supervisor, or Technical specialist.');
      return;
    }

    if (currentValidationConflicts.length > 0) {
      showToast('error', 'Scheduling Conflict', currentValidationConflicts[0].description);
      return;
    }

    if (isEdit && editSessionId) {
      const res = updateSession(editSessionId, {
        courseId,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        lecturerIds,
        supervisorIds,
        technicalIds,
        notes,
      });
      if (res.success) {
        onClose();
      }
    } else {
      // Pre-validate weekly recurring occurrences if enabled
      if (repeatMode === 'Weekly' && repeatWeeks > 1) {
        const durationDays = calculateDaysBetween(startDate, endDate);
        const simulatedSessions: TrainingSession[] = [
          ...sessions,
          {
            id: 'temp_occ_1',
            courseId,
            startDate,
            endDate,
            startTime,
            endTime,
            location,
            lecturerIds,
            supervisorIds,
            technicalIds,
            notes,
          },
        ];

        for (let w = 1; w < repeatWeeks; w++) {
          const shiftDays = w * 7;
          const repStartStr = addDays(startDate, shiftDays);
          const repEndStr = addDays(repStartStr, durationDays - 1);

          const occConflicts = validateSessionConflicts(
            {
              courseId,
              startDate: repStartStr,
              endDate: repEndStr,
              startTime,
              endTime,
              lecturerIds,
              supervisorIds,
              technicalIds,
            },
            simulatedSessions,
            people,
            courses
          );

          if (occConflicts.length > 0) {
            showToast(
              'error',
              `Recurrence Conflict (Week ${w + 1})`,
              occConflicts[0].description
            );
            return;
          }

          simulatedSessions.push({
            id: `temp_occ_${w + 1}`,
            courseId,
            startDate: repStartStr,
            endDate: repEndStr,
            startTime,
            endTime,
            location,
            lecturerIds,
            supervisorIds,
            technicalIds,
          });
        }
      }

      const res = addSession({
        courseId,
        startDate,
        endDate,
        startTime,
        endTime,
        location,
        lecturerIds,
        supervisorIds,
        technicalIds,
        notes,
      });

      // Handle Repeat Training
      if (res.success && repeatMode === 'Weekly' && repeatWeeks > 1) {
        const durationDays = calculateDaysBetween(startDate, endDate);
        for (let w = 1; w < repeatWeeks; w++) {
          const shiftDays = w * 7;
          const repStartStr = addDays(startDate, shiftDays);
          const repEndStr = addDays(repStartStr, durationDays - 1);

          addSession({
            courseId,
            startDate: repStartStr,
            endDate: repEndStr,
            startTime,
            endTime,
            location,
            lecturerIds,
            supervisorIds,
            technicalIds,
            notes: notes ? `${notes} (Occurrence ${w + 1})` : `Occurrence ${w + 1}`,
          });
        }
      }

      if (res.success) {
        onClose();
      }
    }
  };

  // Helper to render role selection block
  const renderRolePicker = (
    role: Role,
    selectedIds: string[],
    searchVal: string,
    setSearchVal: (val: string) => void
  ) => {
    const rolePeople = people.filter((p) => p.roles.includes(role));
    const filtered = rolePeople.filter(
      (p) =>
        p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
        p.department.toLowerCase().includes(searchVal.toLowerCase())
    );

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <RoleBadge role={role} size="sm" />
            <span>Assign {role}s</span>
          </label>
          <span className="text-[11px] text-gray-500 font-medium">
            {selectedIds.length} selected
          </span>
        </div>

        {/* Search input for role */}
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder={`Search ${role}s...`}
          className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-md bg-gray-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        />

        {/* People items */}
        <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white p-1">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-xs text-gray-400">No matching {role}s</div>
          ) : (
            filtered.map((person) => {
              const isSelected = selectedIds.includes(person.id);
              const avail = availabilityMap.find((a) => a.person.id === person.id);
              const isAvailable = avail ? avail.isAvailable : true;

              return (
                <div
                  key={person.id}
                  onClick={() => handleTogglePerson(person.id, role)}
                  className={`p-2 rounded-md flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200 text-blue-950 font-medium'
                      : !isAvailable
                      ? 'bg-rose-50/40 text-gray-500 hover:bg-rose-50'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-1">
                        <span>{person.name}</span>
                        {!person.active && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{person.department}</div>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="text-right shrink-0">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Available
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Busy
                        </span>
                        {avail?.conflictingCourse && (
                          <span className="text-[9px] text-rose-600 truncate max-w-[120px]">
                            {avail.conflictingCourse.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Edit Training Session' : 'Schedule Training Event'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Visual multi-day scheduling with deterministic conflict prevention
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Conflict Warning Alert Banner if any conflict detected */}
          {(inlineConflictWarning || currentValidationConflicts.length > 0) && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col gap-2 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="font-bold text-rose-900 text-sm">🔴 Scheduling Conflict</div>
                  <p className="mt-1 leading-relaxed">
                    {inlineConflictWarning || currentValidationConflicts[0]?.description}
                  </p>
                  <p className="mt-1 font-semibold text-rose-800">
                    Rule: One person = One training per calendar day. Overlapping assignments cannot be saved.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setInlineConflictWarning(null)}
                  className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 rounded-md text-xs font-semibold hover:bg-rose-100 cursor-pointer"
                >
                  Choose Another Person
                </button>
              </div>
            </div>
          )}

          {/* Course Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Course *</label>
              <button
                type="button"
                onClick={onOpenCreateCourse}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create New Course</span>
              </button>
            </div>
            <select
              value={courseId}
              onChange={(e) => {
                const newCourseId = e.target.value;
                setCourseId(newCourseId);
                if (!isEdit && !initialEndDate && !initialDate) {
                  const selectedCourse = courses.find((c) => c.id === newCourseId);
                  const dur = selectedCourse?.defaultDurationDays || settings.defaultDurationDays || 5;
                  setEndDate(addDays(startDate, Math.max(1, dur) - 1));
                }
              }}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">-- Select a Training Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''} • {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Dates & Auto Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Calculated Duration
              </label>
              <div className="px-3 py-1.5 bg-white border border-blue-200 text-blue-800 font-bold text-xs rounded-lg flex items-center justify-between">
                <span>{durationLabel}</span>
                <span className="text-[10px] text-gray-400 font-normal">Auto calculated</span>
              </div>
            </div>
          </div>

          {/* Daily Times & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Daily Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Daily End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Training Hall 1"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Team Roles Assignment Section */}
          <div className="pt-2 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Resource Assignment (Live Availability Checked)</span>
              </span>
              <span className="text-[11px] text-gray-400">
                Shows 🟢 Available / 🔴 Busy in real time
              </span>
            </div>

            {/* Lecturers */}
            {renderRolePicker('Lecturer', lecturerIds, lecturerSearch, setLecturerSearch)}

            {/* Supervisors */}
            {renderRolePicker('Supervisor', supervisorIds, supervisorSearch, setSupervisorSearch)}

            {/* Technical */}
            {renderRolePicker('Technical', technicalIds, technicalSearch, setTechnicalSearch)}
          </div>

          {/* Recurring Options */}
          {!isEdit && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Repeat Training</span>
                </span>
                <select
                  value={repeatMode}
                  onChange={(e) => setRepeatMode(e.target.value as any)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white"
                >
                  <option value="None">Does not repeat</option>
                  <option value="Weekly">Weekly recurrence</option>
                </select>
              </div>

              {repeatMode === 'Weekly' && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                  <span>Repeat every week for</span>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-md bg-white text-xs"
                  />
                  <span>weeks (each occurrence will be checked for conflicts).</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional equipment requirements, syllabus notes, or instructions..."
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
          {isEdit && editSessionId ? (
            confirmDelete ? (
              <div className="flex items-center gap-2 animate-in fade-in">
                <span className="text-xs text-rose-700 font-bold">Delete this training?</span>
                <button
                  type="button"
                  onClick={() => {
                    deleteSession(editSessionId);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Delete Training
              </button>
            )
          ) : (
            <div className="text-xs text-gray-500">
              {currentValidationConflicts.length > 0 ? (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cannot save with conflicts
                </span>
              ) : (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All assigned resources available
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={currentValidationConflicts.length > 0}
              className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
                currentValidationConflicts.length > 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isEdit ? 'Save Changes' : 'Save Training'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
