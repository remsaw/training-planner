import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { calculateDaysBetween, addDays, formatDateRange, formatDuration } from '../../utils/dateUtils';
import { validateSessionConflicts } from '../../utils/conflictEngine';
import { X, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DuplicateModalProps {
  sessionId: string | null;
  onClose: () => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({ sessionId, onClose }) => {
  const { sessions, courses, people, duplicateSession, showToast } = usePlanner();

  const session = useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId) : null),
    [sessionId, sessions]
  );

  const durationDays = useMemo(() => {
    if (!session) return 1;
    return calculateDaysBetween(session.startDate, session.endDate);
  }, [session]);

  const [newStartDate, setNewStartDate] = useState('2026-11-09');

  const newEndDate = useMemo(() => {
    if (!newStartDate || durationDays <= 0) return newStartDate;
    return addDays(newStartDate, durationDays - 1);
  }, [newStartDate, durationDays]);

  // Live conflict detection on candidate duplication
  const conflicts = useMemo(() => {
    if (!session || !newStartDate || !newEndDate) return [];
    return validateSessionConflicts(
      {
        courseId: session.courseId,
        startDate: newStartDate,
        endDate: newEndDate,
        startTime: session.startTime,
        endTime: session.endTime,
        lecturerIds: session.lecturerIds || [],
        supervisorIds: session.supervisorIds || [],
        technicalIds: session.technicalIds || [],
        financialIds: session.financialIds || [],
        equipmentIds: session.equipmentIds || [],
        printingIds: session.printingIds || [],
      },
      sessions,
      people,
      courses
    );
  }, [session, newStartDate, newEndDate, sessions, people, courses]);

  if (!sessionId || !session) return null;

  const course = courses.find((c) => c.id === session.courseId);

  const handleDuplicate = () => {
    if (conflicts.length > 0) {
      showToast('error', 'Scheduling Conflict', conflicts[0].description);
      return;
    }

    const res = duplicateSession(session.id, newStartDate);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Duplicate Training Event</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950">
            <span className="font-semibold block text-blue-900">Source Training</span>
            <div className="font-bold text-sm mt-0.5">{course?.name}</div>
            <div className="text-[11px] text-blue-700 mt-1">
              Original: {formatDateRange(session.startDate, session.endDate)} ({formatDuration(session.startDate, session.endDate)})
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Start Date *
            </label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-500 font-medium block">Automatically Computed New Period</span>
            <div className="text-sm font-bold text-gray-900 mt-1">
              {formatDateRange(newStartDate, newEndDate)}
            </div>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Maintains original duration of {formatDuration(newStartDate, newEndDate)}
            </span>
          </div>

          {/* Conflict Alert if any */}
          {conflicts.length > 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">Scheduling Conflict Detected</span>
                <p className="text-[11px] text-rose-800 mt-0.5">{conflicts[0].description}</p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">All assigned team members are available!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={conflicts.length > 0}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-all cursor-pointer ${
              conflicts.length > 0
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Duplicate &amp; Schedule
          </button>
        </div>
      </div>
    </div>
  );
};
