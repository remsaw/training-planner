import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { getPeopleAvailability } from '../../utils/conflictEngine';
import { RoleBadge } from '../common/RoleBadge';
import { Role } from '../../types';
import { formatDateRange, formatDuration, formatDate, addDays } from '../../utils/dateUtils';
import { X, Search, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface AvailabilityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleForPerson?: (personId: string, startDate: string, endDate: string) => void;
}

export const AvailabilityCheckerModal: React.FC<AvailabilityCheckerModalProps> = ({
  isOpen,
  onClose,
  onScheduleForPerson,
}) => {
  const { people, sessions, courses } = usePlanner();

  const [startDate, setStartDate] = useState(() => formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => addDays(formatDate(new Date()), 4));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('14:00');
  const [roleFilter, setRoleFilter] = useState<'All' | Role>('All');

  // Compute live availability
  const availability = useMemo(() => {
    return getPeopleAvailability(
      people,
      startDate,
      endDate,
      startTime,
      endTime,
      sessions,
      courses
    );
  }, [people, startDate, endDate, startTime, endTime, sessions, courses]);

  if (!isOpen) return null;

  const filteredAvailability = availability.filter((item) => {
    if (roleFilter === 'All') return true;
    return item.person.roles.includes(roleFilter);
  });

  const availableList = filteredAvailability.filter((item) => item.isAvailable);
  const busyList = filteredAvailability.filter((item) => !item.isAvailable);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Check Resource Availability</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Instantly check who is free vs occupied based on 1-person-1-training-per-day rule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Parameters */}
        <div className="p-3.5 sm:p-5 border-b border-gray-200 bg-gray-50/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs shrink-0">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Time Window</label>
            <div className="flex items-center gap-1">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-1/2 px-1 py-1.5 border border-gray-300 rounded-lg bg-white text-[11px]"
              />
              <span className="text-gray-400">–</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-1/2 px-1 py-1.5 border border-gray-300 rounded-lg bg-white text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
            >
              <option value="All">All Roles</option>
              <option value="محاضر">محاضر</option>
              <option value="مشرف فنى">مشرف فنى</option>
              <option value="تقنى/ادارى">تقنى/ادارى</option>
              <option value="مسؤل مالى">مسؤل مالى</option>
              <option value="فنى اجهزة">فنى اجهزة</option>
              <option value="تصوير وطباعة">تصوير وطباعة</option>
            </select>
          </div>
        </div>

        {/* Results Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Target Query Summary */}
          <div className="text-xs text-gray-600 flex flex-wrap items-center justify-between gap-2 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
            <span>
              Target Period: <strong>{formatDateRange(startDate, endDate)}</strong> ({formatDuration(startDate, endDate)}), daily {startTime}–{endTime}
            </span>
            <span className="text-blue-700 font-bold">
              {availableList.length} Available / {busyList.length} Busy
            </span>
          </div>

          {/* Available People */}
          <div>
            <h3 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Available ({availableList.length})</span>
            </h3>

            {availableList.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400">
                No available resources matching current filter and dates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableList.map((item) => (
                  <div
                    key={item.person.id}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{item.person.name}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {item.person.department}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.person.roles.map((r) => (
                          <RoleBadge key={r} role={r} size="sm" />
                        ))}
                      </div>
                    </div>

                    {onScheduleForPerson && (
                      <button
                        onClick={() => {
                          onClose();
                          onScheduleForPerson(item.person.id, startDate, endDate);
                        }}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                        title="Schedule this person"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Busy People */}
          <div>
            <h3 className="font-bold text-rose-800 text-xs flex items-center gap-1.5 mb-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Busy ({busyList.length})</span>
            </h3>

            {busyList.length === 0 ? (
              <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400 text-[11px]">
                Zero conflicts for this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {busyList.map((item) => (
                  <div
                    key={item.person.id}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>{item.person.name}</span>
                      </div>
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-semibold">
                        Busy
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.person.department}
                    </div>

                    {/* Conflict reason detail */}
                    <div className="mt-2 p-1.5 bg-white/80 rounded border border-rose-200 text-[10px] text-rose-900 leading-snug">
                      <strong>Assigned to:</strong> {item.conflictingCourse?.name || 'Another Training'}
                      {item.conflictingSession && (
                        <div className="text-gray-500">
                          {formatDateRange(item.conflictingSession.startDate, item.conflictingSession.endDate)} • {item.conflictingSession.startTime}–{item.conflictingSession.endTime}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
