import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { isPersonInSession } from '../../utils/conflictEngine';
import { calculateDaysBetween, formatDateRange, timeToMinutes, isDateWithin, formatDate } from '../../utils/dateUtils';
import { RoleBadge } from '../common/RoleBadge';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface PersonScheduleModalProps {
  personId: string | null;
  onClose: () => void;
  onSelectSession: (id: string) => void;
}

export const PersonScheduleModal: React.FC<PersonScheduleModalProps> = ({
  personId,
  onClose,
  onSelectSession,
}) => {
  const { people, sessions, courses } = usePlanner();

  if (!personId) return null;

  const person = people.find((p) => p.id === personId);
  if (!person) return null;

  // Find all assigned sessions for this person
  const personSessions = sessions
    .filter((s) => isPersonInSession(person.id, s).inSession)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Compute statistics
  const trainingCount = personSessions.length;

  let totalDays = 0;
  let totalHours = 0;
  personSessions.forEach((s) => {
    const days = calculateDaysBetween(s.startDate, s.endDate);
    totalDays += days;

    const startMin = timeToMinutes(s.startTime);
    const endMin = timeToMinutes(s.endTime);
    const hoursPerDay = Math.max(0, (endMin - startMin) / 60);
    totalHours += hoursPerDay * days;
  });

  // Check if busy today
  const todayStr = formatDate(new Date());
  const busyTodaySession = personSessions.find((s) =>
    isDateWithin(todayStr, s.startDate, s.endDate)
  );
  const isBusyToday = Boolean(busyTodaySession);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full ${person.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-base shadow-sm`}
            >
              {person.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{person.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{person.department}</span>
                <span className="text-gray-300">•</span>
                <div className="flex gap-1">
                  {person.roles.map((r) => (
                    <RoleBadge key={r} role={r} size="sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-4 divide-x divide-gray-200 border-b border-gray-200 bg-white p-3 text-center text-xs">
          <div>
            <span className="text-gray-400 block text-[11px]">Training Count</span>
            <span className="font-bold text-gray-900 text-base">{trainingCount}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Training Days</span>
            <span className="font-bold text-blue-600 text-base">{totalDays}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Training Hours</span>
            <span className="font-bold text-indigo-600 text-base">{Math.round(totalHours)}h</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">Today's Status</span>
            {isBusyToday ? (
              <span className="font-bold text-rose-600 text-xs flex items-center justify-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Busy Today
              </span>
            ) : (
              <span className="font-bold text-emerald-600 text-xs flex items-center justify-center gap-1 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Available
              </span>
            )}
          </div>
        </div>

        {/* Schedule List */}
        <div className="p-6 max-h-96 overflow-y-auto space-y-3 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[11px] text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Assigned Training Sessions ({personSessions.length})</span>
          </h3>

          {personSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl">
              No training assignments scheduled for this person.
            </div>
          ) : (
            personSessions.map((session) => {
              const course = courses.find((c) => c.id === session.courseId);
              const { role } = isPersonInSession(person.id, session);
              const period = formatDateRange(session.startDate, session.endDate);
              const duration = calculateDaysBetween(session.startDate, session.endDate);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onClose();
                    onSelectSession(session.id);
                  }}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{course?.name}</span>
                      {role && <RoleBadge role={role} size="sm" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 mt-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {period} ({duration} days)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {session.startTime}–{session.endTime}
                      </span>
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {session.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-blue-600 font-semibold hover:underline shrink-0">
                    View &rsaquo;
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Rule enforced: Maximum 1 session per calendar day.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
