import React, { useRef, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { formatDate, timeToMinutes, isDateWithin } from '../../utils/dateUtils';
import { isPersonInSession } from '../../utils/conflictEngine';
import { RoleBadge } from '../common/RoleBadge';
import { Clock, MapPin, AlertCircle, Plus } from 'lucide-react';

interface ResourceDayViewProps {
  onSelectSession: (id: string) => void;
  onQuickAdd: (personId: string, dateStr: string, timeStr?: string) => void;
}

export const ResourceDayView: React.FC<ResourceDayViewProps> = ({
  onSelectSession,
  onQuickAdd,
}) => {
  const {
    filteredPeople,
    filteredSessions,
    courses,
    currentDate,
    settings,
    allConflicts,
    moveSession,
  } = usePlanner();

  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDateStr = formatDate(currentDate);

  // Time grid parameters: 08:00 to 22:00 in 30-min intervals
  const startHour = settings.workingHoursStart || 8;
  const endHour = settings.workingHoursEnd || 22;
  const slotMinutes = settings.timeSlotMinutes || 30;

  const totalMinutes = (endHour - startHour) * 60;
  const pixelsPerMinute = 1.6; // 1 hour = 96px, 30 min = 48px
  const gridHeight = totalMinutes * pixelsPerMinute;

  // Generate 30-min intervals
  const intervals: { minutes: number; label: string; isHour: boolean }[] = [];
  for (let m = 0; m <= totalMinutes; m += slotMinutes) {
    const totalCurrentMins = startHour * 60 + m;
    const h = Math.floor(totalCurrentMins / 60);
    const min = totalCurrentMins % 60;
    const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    intervals.push({
      minutes: m,
      label,
      isHour: min === 0,
    });
  }

  // Scroll to 08:30 on initial load
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 40;
    }
  }, [currentDate]);

  // Check if today matches reference
  const isToday = selectedDateStr === formatDate(new Date());
  const now = new Date();
  const currentNowMinutes = now.getHours() * 60 + now.getMinutes() - startHour * 60;
  const nowTopPosition = currentNowMinutes * pixelsPerMinute;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden select-none flex flex-col h-[700px]">
      {/* Top Banner Notice */}
      <div className="bg-slate-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-600 shrink-0">
        <div className="font-semibold text-gray-800">
          Resource Day View: {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span>Working hours: {String(startHour).padStart(2, '0')}:00 – {String(endHour).padStart(2, '0')}:00</span>
          <span>•</span>
          <span>30-min increments</span>
        </div>
      </div>

      {/* Main Scrollable Grid */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        <div className="min-w-fit">
          {/* Sticky Resource Column Headers */}
          <div className="sticky top-0 z-30 bg-slate-100/95 backdrop-blur-xs border-b border-gray-200 flex">
            {/* Corner Cell: Sticky Time Header */}
            <div className="w-20 shrink-0 p-3 border-r border-gray-200 bg-slate-100 font-bold text-xs text-gray-500 uppercase tracking-wider text-center sticky left-0 z-40">
              TIME
            </div>

            {/* People Resource Headers */}
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="w-56 shrink-0 p-3 border-r border-gray-200 bg-slate-100 flex items-center gap-2.5"
              >
                <div
                  className={`w-7 h-7 rounded-full ${person.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {person.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gray-900 truncate">{person.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{person.department}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Rows and Resource Grid Container */}
          <div className="relative flex" style={{ height: `${gridHeight}px` }}>
            {/* Sticky Time Column */}
            <div className="w-20 shrink-0 border-r border-gray-200 bg-slate-50 sticky left-0 z-20 select-none">
              {intervals.map((item) => (
                <div
                  key={item.label}
                  style={{ top: `${item.minutes * pixelsPerMinute}px` }}
                  className="absolute left-0 right-0 text-center"
                >
                  <span
                    className={`text-[11px] font-semibold tracking-tight ${
                      item.isHour ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid Lines across all resource columns */}
            <div className="absolute inset-0 pointer-events-none">
              {intervals.map((item) => (
                <div
                  key={`line_${item.label}`}
                  style={{ top: `${item.minutes * pixelsPerMinute}px` }}
                  className={`absolute left-20 right-0 border-t ${
                    item.isHour ? 'border-gray-200' : 'border-gray-100 border-dashed'
                  }`}
                />
              ))}

              {/* Dynamic Horizontal "Now" line */}
              {isToday && nowTopPosition >= 0 && nowTopPosition <= gridHeight && (
                <div
                  style={{ top: `${nowTopPosition}px` }}
                  className="absolute left-0 right-0 z-25 flex items-center pointer-events-none"
                >
                  <div className="w-20 text-right pr-2 text-[10px] font-bold text-rose-600 bg-rose-50 rounded-r py-0.5">
                    NOW
                  </div>
                  <div className="h-0.5 bg-rose-500 flex-1 relative">
                    <div className="w-2 h-2 rounded-full bg-rose-600 absolute -top-[3px] -left-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Resource Columns */}
            {filteredPeople.map((person) => {
              // Find sessions active on selectedDateStr that this person is part of
              const activeSessions = filteredSessions.filter((s) => {
                if (!isDateWithin(selectedDateStr, s.startDate, s.endDate)) return false;
                const inSession = isPersonInSession(person.id, s);
                return inSession.inSession;
              });

              return (
                <div
                  key={person.id}
                  className="w-56 shrink-0 border-r border-gray-200/80 relative group/col hover:bg-blue-50/10 transition-colors"
                >
                  {/* Click to add training at time slot */}
                  {intervals
                    .filter((i) => i.isHour)
                    .map((item) => (
                      <button
                        key={item.label}
                        onClick={() => onQuickAdd(person.id, selectedDateStr, item.label)}
                        style={{ top: `${item.minutes * pixelsPerMinute + 4}px` }}
                        className="absolute right-2 opacity-0 group-hover/col:opacity-40 hover:!opacity-100 p-1 rounded bg-blue-600 text-white transition-opacity z-10 cursor-pointer"
                        title={`Schedule for ${person.name} at ${item.label}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    ))}

                  {/* Render Scheduled Training Blocks for this person on this date */}
                  {activeSessions.map((session) => {
                    const course = courses.find((c) => c.id === session.courseId);
                    const { role, roles: sessionRoles } = isPersonInSession(person.id, session);

                    // Compute vertical positioning in pixels based on session.startTime and session.endTime
                    const gridStartMin = startHour * 60;
                    const gridEndMin = endHour * 60;
                    const clampedStartMin = Math.min(gridEndMin, Math.max(gridStartMin, timeToMinutes(session.startTime)));
                    const clampedEndMin = Math.min(gridEndMin, Math.max(clampedStartMin, timeToMinutes(session.endTime)));
                    const startOffsetMin = clampedStartMin - gridStartMin;
                    const durationMins = Math.min(totalMinutes - startOffsetMin, Math.max(30, clampedEndMin - clampedStartMin));

                    const topPx = startOffsetMin * pixelsPerMinute;
                    const heightPx = durationMins * pixelsPerMinute;

                    const isConflicting = allConflicts.some(
                      (c) =>
                        (c.conflictingSessionId === session.id || c.attemptedSessionId === session.id) &&
                        c.personId === person.id
                    );

                    return (
                      <div
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                        }}
                        className={`absolute left-1.5 right-1.5 rounded-lg p-2.5 flex flex-col justify-between shadow-xs transition-all z-15 cursor-pointer hover:shadow-md hover:scale-[1.01] ${
                          isConflicting
                            ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                            : 'bg-blue-50/95 border border-blue-300 text-blue-950 hover:border-blue-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-bold text-xs truncate flex items-center gap-1">
                              {isConflicting && <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                              <span className="truncate">{course?.name || 'Training'}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 flex-wrap">
                              {sessionRoles.map((r) => (
                                <RoleBadge key={r} role={r} size="sm" />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{session.startTime} – {session.endTime}</span>
                          </div>

                          {session.startDate !== session.endDate && (
                            <span className="inline-block mt-1 text-[10px] font-medium bg-white/80 px-1 rounded border border-gray-200 text-gray-600">
                              Part of multi-day ({session.startDate.slice(5)} to {session.endDate.slice(5)})
                            </span>
                          )}
                        </div>

                        {session.location && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate mt-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{session.location}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
