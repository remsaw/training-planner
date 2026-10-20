import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getWeekDays, formatDateRange, formatDate } from '../../utils/dateUtils';
import { isPersonInSession } from '../../utils/conflictEngine';
import { RoleBadge } from '../common/RoleBadge';
import { Person } from '../../types';
import { Clock, MapPin, Plus, AlertCircle } from 'lucide-react';

interface ResourceWeekViewProps {
  onSelectSession: (id: string) => void;
  onQuickAdd: (personId: string, dateStr: string) => void;
}

export const ResourceWeekView: React.FC<ResourceWeekViewProps> = ({
  onSelectSession,
  onQuickAdd,
}) => {
  const {
    filteredPeople,
    filteredSessions,
    courses,
    currentDate,
    settings,
    moveSession,
    resizeSession,
    allConflicts,
  } = usePlanner();

  const allWeekDays = getWeekDays(currentDate);
  const weekDays = settings.showWeekends
    ? allWeekDays
    : allWeekDays.filter((d) => !d.isWeekend);
  const numCols = weekDays.length;
  const weekStartStr = weekDays[0].dateStr;
  const weekEndStr = weekDays[weekDays.length - 1].dateStr;

  // Drag and drop state
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ personId: string; dateStr: string } | null>(null);

  // Resize state
  const [resizingSessionId, setResizingSessionId] = useState<string | null>(null);
  const [resizeHoverDateStr, setResizeHoverDateStr] = useState<string | null>(null);

  useEffect(() => {
    if (!resizingSessionId) return;
    const handleMouseUp = () => {
      if (resizingSessionId && resizeHoverDateStr) {
        resizeSession(resizingSessionId, resizeHoverDateStr);
      }
      setResizingSessionId(null);
      setResizeHoverDateStr(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [resizingSessionId, resizeHoverDateStr, resizeSession]);

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    if (resizingSessionId) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', sessionId);
    setDraggedSessionId(sessionId);
  };

  const handleDragOver = (e: React.DragEvent, personId: string, dateStr: string) => {
    e.preventDefault();
    setDragOverCell({ personId, dateStr });
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('text/plain') || draggedSessionId;
    if (sessionId) {
      moveSession(sessionId, targetDateStr);
    }
    setDraggedSessionId(null);
    setDragOverCell(null);
  };

  // Find all sessions assigned to a person that overlap this week
  const getPersonWeekSessions = (person: Person) => {
    return filteredSessions.filter((s) => {
      const inSession = isPersonInSession(person.id, s);
      if (!inSession.inSession) return false;
      // Check if session overlaps this week: s.startDate <= weekEndStr && s.endDate >= weekStartStr
      return s.startDate <= weekEndStr && s.endDate >= weekStartStr;
    });
  };

  // Today string for highlighting
  const todayStr = formatDate(new Date());

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden select-none">
      {/* Table Container */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full border-collapse text-left table-fixed min-w-[740px] sm:min-w-[980px]">
          {/* Header Row: Resources column + 7 Days */}
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-700">
              <th className="w-36 sm:w-52 md:w-64 p-2.5 sm:p-3.5 border-r border-gray-200 sticky left-0 bg-slate-50 z-20">
                <div className="flex items-center justify-between gap-1">
                  <span className="uppercase tracking-wider text-[10px] sm:text-[11px] text-gray-500 font-bold truncate">
                    Resource
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 shrink-0">
                    {filteredPeople.length}
                  </span>
                </div>
              </th>

              {weekDays.map((d) => {
                const isToday = d.dateStr === todayStr;
                return (
                  <th
                    key={d.dateStr}
                    className={`p-2 sm:p-3 text-center border-r border-gray-200/80 transition-colors ${
                      d.isWeekend ? 'bg-slate-100/60' : 'bg-slate-50'
                    } ${isToday ? 'bg-blue-50/70 border-b-2 border-b-blue-600' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-[10px] sm:text-[11px] uppercase font-bold tracking-wider ${
                          isToday ? 'text-blue-700 font-extrabold' : 'text-gray-500'
                        }`}
                      >
                        {d.dayName}
                      </span>
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-bold mt-0.5 ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-800'
                        }`}
                      >
                        {d.dayNumber}
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">
                        {d.date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body: One Row per Person */}
          <tbody className="divide-y divide-gray-200 text-xs">
            {filteredPeople.length === 0 ? (
              <tr>
                <td colSpan={numCols + 1} className="p-12 text-center text-gray-400">
                  <div className="max-w-xs mx-auto">
                    <p className="text-sm font-semibold text-gray-700">No resources found</p>
                    <p className="text-xs text-gray-500 mt-1">Adjust filters or search query to view resources.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPeople.map((person) => {
                const personSessions = getPersonWeekSessions(person);
                const rowHeightPx = Math.max(80, personSessions.length * 68 + 12);

                return (
                  <tr key={person.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Sticky Resource Column */}
                    <td className="p-2 sm:p-3 border-r border-gray-200 bg-white sticky left-0 z-10 shadow-xs">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                            person.avatarColor || 'bg-blue-600'
                          } text-white flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 shadow-2xs`}
                        >
                          {person.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate flex items-center gap-1 text-[11px] sm:text-xs">
                            <span className="truncate">{person.name}</span>
                            {!person.active && (
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                            {person.department}
                          </div>
                          <div className="hidden sm:flex gap-1 mt-1 flex-wrap">
                            {person.roles.map((r) => (
                              <RoleBadge key={r} role={r} size="sm" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Week Grid for this person */}
                    <td
                      colSpan={numCols}
                      className="p-0 relative"
                      style={{ height: `${rowHeightPx}px` }}
                    >
                      {/* Background Grid Cells for each day */}
                      <div
                        className="grid h-full absolute inset-0 pointer-events-none"
                        style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
                      >
                        {weekDays.map((d) => {
                          const isDragTarget =
                            dragOverCell?.personId === person.id && dragOverCell?.dateStr === d.dateStr;
                          const isResizeTarget =
                            resizingSessionId !== null && resizeHoverDateStr === d.dateStr;
                          return (
                            <div
                              key={d.dateStr}
                              className={`border-r border-gray-100 h-full transition-colors ${
                                d.isWeekend ? 'bg-slate-50/40' : 'bg-transparent'
                              } ${d.dateStr === todayStr ? 'bg-blue-50/20' : ''} ${
                                isDragTarget || isResizeTarget
                                  ? 'bg-blue-100/60 ring-2 ring-blue-500 ring-inset'
                                  : ''
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Interactive Drop Targets for each day */}
                      <div
                        className="grid h-full absolute inset-0"
                        style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
                      >
                        {weekDays.map((d) => (
                          <div
                            key={d.dateStr}
                            onDragOver={(e) => handleDragOver(e, person.id, d.dateStr)}
                            onDrop={(e) => handleDrop(e, d.dateStr)}
                            onMouseEnter={() => {
                              if (resizingSessionId) {
                                setResizeHoverDateStr(d.dateStr);
                              }
                            }}
                            className={`h-full relative group/cell ${
                              resizingSessionId ? 'cursor-ew-resize' : 'cursor-pointer'
                            }`}
                            onClick={(e) => {
                              if (resizingSessionId) return;
                              // If clicked on empty area, quick add
                              if (e.target === e.currentTarget) {
                                onQuickAdd(person.id, d.dateStr);
                              }
                            }}
                          >
                            {/* Hover Quick Schedule Button */}
                            {!resizingSessionId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickAdd(person.id, d.dateStr);
                                }}
                                title={`Schedule training for ${person.name} on ${d.dateStr}`}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-opacity cursor-pointer z-10"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Render Continuous Multi-Day Training Blocks */}
                      <div className="relative h-full py-2 px-1 flex flex-col justify-center pointer-events-none">
                        {personSessions.map((session, sessionIdx) => {
                          const course = courses.find((c) => c.id === session.courseId);
                          const { roles: sessionRoles } = isPersonInSession(person.id, session);

                          // Calculate start and end column index across visible weekDays
                          let startCol = -1;
                          let endCol = -1;
                          for (let i = 0; i < weekDays.length; i++) {
                            if (weekDays[i].dateStr >= session.startDate && startCol === -1) {
                              startCol = i;
                            }
                            if (weekDays[i].dateStr <= session.endDate) {
                              endCol = i;
                            }
                          }

                          if (startCol === -1 || endCol === -1 || endCol < startCol) return null;

                          const span = endCol - startCol + 1;
                          const leftPct = (startCol / numCols) * 100;
                          const widthPct = (span / numCols) * 100;

                          // Check if this session has any conflict
                          const isConflicting = allConflicts.some(
                            (c) =>
                              (c.conflictingSessionId === session.id || c.attemptedSessionId === session.id) &&
                              c.personId === person.id
                          );

                          const durationLabel = formatDateRange(session.startDate, session.endDate);
                          const topPx = 8 + sessionIdx * 68;

                          return (
                            <div
                              key={session.id}
                              draggable={!resizingSessionId}
                              onDragStart={(e) => handleDragStart(e, session.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSession(session.id);
                              }}
                              style={{
                                left: `calc(${leftPct}% + 4px)`,
                                width: `calc(${widthPct}% - 8px)`,
                                top: `${topPx}px`,
                                height: '62px',
                              }}
                              className={`absolute rounded-lg p-2 flex flex-col justify-between shadow-xs transition-all pointer-events-auto cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] ${
                                isConflicting
                                  ? 'bg-rose-50 border-2 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                                  : 'bg-blue-50/95 border border-blue-300 text-blue-950 hover:border-blue-500'
                              }`}
                            >
                              {/* Top Bar: Title + Badges */}
                              <div className="flex items-start justify-between gap-1 overflow-hidden">
                                <div className="font-bold truncate text-xs flex items-center gap-1.5 leading-snug">
                                  {isConflicting && (
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-bounce" />
                                  )}
                                  <span className="truncate">{course?.name || 'Training Course'}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                  {sessionRoles.map((r) => (
                                    <RoleBadge key={r} role={r} size="sm" />
                                  ))}
                                </div>
                              </div>

                              {/* Bottom Details: Date Range, Time, Location */}
                              <div className="flex items-center gap-2 text-[10px] text-gray-600 font-medium truncate mt-1">
                                <span className="bg-white/80 px-1 rounded border border-gray-200 shrink-0">
                                  {durationLabel}
                                </span>
                                <span className="flex items-center gap-0.5 shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-gray-500" />
                                  {session.startTime}–{session.endTime}
                                </span>
                                {session.location && (
                                  <span className="flex items-center gap-0.5 truncate hidden sm:inline-flex">
                                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                                    {session.location}
                                  </span>
                                )}
                              </div>

                              {/* Resize Handle on Right Edge for Multi-Day */}
                              <div
                                title="Drag edge to resize end date"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setResizingSessionId(session.id);
                                  setResizeHoverDateStr(session.endDate);
                                }}
                                className="absolute right-0 top-0 bottom-0 w-2.5 bg-blue-400/20 hover:bg-blue-500 rounded-r-lg cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <div className="w-0.5 h-4 bg-blue-600/60 rounded" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Helper Note */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-t border-gray-200 text-[11px] sm:text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded bg-blue-500 shrink-0"></span>
          <span>Multi-day training appears as ONE continuous bar across its dates.</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline">Drag blocks to reschedule date</span>
          <span className="hidden sm:inline">•</span>
          <span>Tap empty slot to schedule</span>
        </div>
      </div>
    </div>
  );
};
