import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getMonthDays, formatDate, formatDateRange } from '../../utils/dateUtils';
import { Clock, Plus, AlertCircle, Users } from 'lucide-react';

interface MonthViewProps {
  onSelectSession: (id: string) => void;
  onQuickAddDate: (dateStr: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  onSelectSession,
  onQuickAddDate,
}) => {
  const { currentDate, filteredSessions, courses, allConflicts, settings } = usePlanner();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthDays = getMonthDays(year, month);
  const todayStr = formatDate(new Date());

  // Group days into weeks (chunks of 7), then filter weekends if disabled
  const weeks: (typeof monthDays)[] = [];
  for (let i = 0; i < monthDays.length; i += 7) {
    const chunk = monthDays.slice(i, i + 7);
    weeks.push(settings.showWeekends ? chunk : chunk.filter((d) => !d.isWeekend));
  }

  const weekDayHeaders = settings.showWeekends
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const numCols = weekDayHeaders.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden select-none">
      <div className="overflow-x-auto">
        <div className="min-w-[640px] sm:min-w-0">
          {/* Weekday Header */}
          <div
            className="grid bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 text-center py-2.5"
            style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
          >
            {weekDayHeaders.map((day, idx) => (
              <div key={day} className={idx >= 5 ? 'text-gray-400' : 'text-gray-700'}>
                {day}
              </div>
            ))}
          </div>

          {/* Month Weeks Grid */}
          <div className="divide-y divide-gray-200">
            {weeks.map((week, weekIdx) => {
              const weekStart = week[0].dateStr;
              const weekEnd = week[week.length - 1].dateStr;

              // Find sessions active during this week
              const weekSessions = filteredSessions.filter(
                (s) => s.startDate <= weekEnd && s.endDate >= weekStart
              );

              return (
                <div key={weekIdx} className="relative min-h-[120px] bg-white">
                  {/* Day cells background */}
                  <div
                    className="grid absolute inset-0"
                    style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
                  >
                    {week.map((day) => {
                      const isToday = day.dateStr === todayStr;
                      return (
                        <div
                          key={day.dateStr}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              onQuickAddDate(day.dateStr);
                            }
                          }}
                          className={`border-r border-gray-100 p-2 flex flex-col justify-between group/cell transition-colors cursor-pointer ${
                            !day.isCurrentMonth
                              ? 'bg-slate-50/50 text-gray-300'
                              : day.isWeekend
                              ? 'bg-slate-50/30'
                              : 'bg-white'
                          } ${isToday ? 'bg-blue-50/20' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                isToday
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : day.isCurrentMonth
                                  ? 'text-gray-700'
                                  : 'text-gray-300'
                              }`}
                            >
                              {day.dayNumber}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickAddDate(day.dateStr);
                              }}
                              className="opacity-60 sm:opacity-0 group-hover/cell:opacity-100 p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                              title={`Schedule training on ${day.dateStr}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spanning Training Events in this week */}
                  <div className="relative pt-8 pb-2 px-1 space-y-1.5 pointer-events-none">
                    {weekSessions.map((session) => {
                      const course = courses.find((c) => c.id === session.courseId);

                      let startIdx = -1;
                      let endIdx = -1;
                      for (let i = 0; i < week.length; i++) {
                        if (week[i].dateStr >= session.startDate && startIdx === -1) {
                          startIdx = i;
                        }
                        if (week[i].dateStr <= session.endDate) {
                          endIdx = i;
                        }
                      }

                      if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;

                      const colSpan = endIdx - startIdx + 1;
                      const leftPct = (startIdx / numCols) * 100;
                      const widthPct = (colSpan / numCols) * 100;

                      const isConflicting = allConflicts.some(
                        (c) => c.conflictingSessionId === session.id || c.attemptedSessionId === session.id
                      );

                      const totalStaff =
                        (session.lecturerIds?.length || 0) +
                        (session.supervisorIds?.length || 0) +
                        (session.technicalIds?.length || 0);

                      return (
                        <div
                          key={session.id}
                          onClick={() => onSelectSession(session.id)}
                          style={{
                            marginLeft: `${leftPct}%`,
                            width: `calc(${widthPct}% - 6px)`,
                          }}
                          className={`pointer-events-auto cursor-pointer rounded-md p-1.5 text-xs shadow-2xs transition-all hover:shadow-md hover:scale-[1.01] ${
                            isConflicting
                              ? 'bg-rose-50 border border-rose-400 text-rose-950 ring-1 ring-rose-500/20'
                              : 'bg-blue-50 border border-blue-300 text-blue-900 hover:border-blue-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-bold truncate flex items-center gap-1">
                              {isConflicting && <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                              <span className="truncate">{course?.name || 'Course'}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium shrink-0 flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              {totalStaff}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium mt-0.5 truncate">
                            <span className="bg-white/80 px-1 rounded border border-gray-200 shrink-0">
                              {formatDateRange(session.startDate, session.endDate)}
                            </span>
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Clock className="w-2.5 h-2.5 text-gray-400" />
                              {session.startTime}–{session.endTime}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
