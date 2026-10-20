import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { formatDateRange, formatDuration } from '../../utils/dateUtils';
import { RoleBadge } from '../common/RoleBadge';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Edit2,
  Copy,
  Trash2,
  Users,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

interface TrainingDetailsModalProps {
  sessionId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const TrainingDetailsModal: React.FC<TrainingDetailsModalProps> = ({
  sessionId,
  onClose,
  onEdit,
  onDuplicate,
}) => {
  const { sessions, courses, people, deleteSession, allConflicts } = usePlanner();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [sessionId]);

  if (!sessionId) return null;

  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  const course = courses.find((c) => c.id === session.courseId);

  const lecturers = people.filter((p) => session.lecturerIds?.includes(p.id));
  const supervisors = people.filter((p) => session.supervisorIds?.includes(p.id));
  const technicals = people.filter((p) => session.technicalIds?.includes(p.id));

  const conflicts = allConflicts.filter(
    (c) => c.conflictingSessionId === session.id || c.attemptedSessionId === session.id
  );

  const durationStr = formatDuration(session.startDate, session.endDate);
  const periodStr = formatDateRange(session.startDate, session.endDate);

  const handleExecuteDelete = () => {
    deleteSession(session.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Training Details
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">
              {course?.name || 'Scheduled Training'}
            </h2>
            {course?.code && (
              <span className="text-xs text-gray-500 font-mono mt-0.5 inline-block">
                Code: {course.code} • {course.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Conflict Banner if this session has one */}
          {conflicts.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Detected Scheduling Conflict</div>
                <div className="text-[11px] text-rose-800 mt-0.5">{conflicts[0].description}</div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
            <div>
              <span className="text-gray-500 font-medium block">Training Period</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">{periodStr}</span>
            </div>

            <div>
              <span className="text-gray-500 font-medium block">Duration</span>
              <span className="font-bold text-blue-700 text-sm mt-0.5 block">{durationStr}</span>
            </div>

            <div>
              <span className="text-gray-500 font-medium block">Daily Time</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                {session.startTime} → {session.endTime}
              </span>
            </div>

            <div>
              <span className="text-gray-500 font-medium block">Location</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block truncate">
                {session.location || 'Not specified'}
              </span>
            </div>
          </div>

          {/* Team Assigned */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Assigned Team</span>
            </h3>

            <div className="space-y-2">
              {/* Lecturers */}
              <div className="p-2.5 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <RoleBadge role="Lecturer" size="sm" />
                  <span className="text-[10px] text-gray-400">{lecturers.length} assigned</span>
                </div>
                {lecturers.length === 0 ? (
                  <span className="text-gray-400 italic text-[11px]">No lecturer assigned</span>
                ) : (
                  <div className="space-y-1">
                    {lecturers.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="text-[11px] text-gray-500">{p.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Supervisors */}
              <div className="p-2.5 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <RoleBadge role="Supervisor" size="sm" />
                  <span className="text-[10px] text-gray-400">{supervisors.length} assigned</span>
                </div>
                {supervisors.length === 0 ? (
                  <span className="text-gray-400 italic text-[11px]">No supervisor assigned</span>
                ) : (
                  <div className="space-y-1">
                    {supervisors.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="text-[11px] text-gray-500">{p.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical */}
              <div className="p-2.5 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <RoleBadge role="Technical" size="sm" />
                  <span className="text-[10px] text-gray-400">{technicals.length} assigned</span>
                </div>
                {technicals.length === 0 ? (
                  <span className="text-gray-400 italic text-[11px]">No technical specialist assigned</span>
                ) : (
                  <div className="space-y-1">
                    {technicals.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="text-[11px] text-gray-500">{p.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-500 font-semibold block mb-0.5">Notes</span>
              <p className="text-gray-700 text-xs leading-relaxed">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-rose-700 font-bold">Delete this training?</span>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Training</span>
            </button>
          )}

          {!confirmDelete && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicate(session.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={() => onEdit(session.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
