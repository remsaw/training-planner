import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { RoleBadge } from '../components/common/RoleBadge';
import {
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ConflictsPageProps {
  onNavigateToSession: (sessionId: string) => void;
}

export const ConflictsPage: React.FC<ConflictsPageProps> = ({ onNavigateToSession }) => {
  const { allConflicts, exportConflicts } = usePlanner();

  const getConflictTypeBadge = (type: string) => {
    switch (type) {
      case 'SAME_DAY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            🔴 Same-Day Conflict
          </span>
        );
      case 'DATE_RANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            🔴 Date Range Overlap
          </span>
        );
      case 'TIME_OVERLAP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Clock className="w-3 h-3 text-purple-600" />
            🔴 Time Overlap
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
            Conflict
          </span>
        );
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Conflicts Log</h1>
            {allConflicts.length > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                {allConflicts.length} Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                0 Conflicts
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit of double-bookings violating the one-person-one-training-per-day rule
          </p>
        </div>

        {allConflicts.length > 0 && (
          <button
            onClick={exportConflicts}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export Conflicts CSV</span>
          </button>
        )}
      </div>

      {/* Explanatory Rule Box */}
      <div className="p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900">Core Conflict Prevention Engine:</strong> A person cannot be assigned to more than one training event on the same calendar day (regardless of role, daily hours, or location). If a course runs 26–30 Oct, the assigned instructor is occupied on all five days.
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        {allConflicts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Schedule is Completely Clean</h3>
              <p className="text-xs text-gray-500 mt-1">
                Zero conflicting assignments detected across all instructors and courses.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3 sm:p-3.5 pl-4 sm:pl-5">Date / Period</th>
                  <th className="p-3 sm:p-3.5">Person Involved</th>
                  <th className="p-3 sm:p-3.5">Role</th>
                  <th className="p-3 sm:p-3.5">Conflict Type</th>
                  <th className="p-3 sm:p-3.5">Conflicting Trainings</th>
                  <th className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">Resolve / Navigate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allConflicts.map((c) => (
                  <tr key={c.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="p-3 sm:p-3.5 pl-4 sm:pl-5 font-semibold text-gray-900">
                      <div>{c.conflictingDates}</div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        Overlap on {c.date}
                      </div>
                    </td>

                    <td className="p-3 sm:p-3.5">
                      <div className="font-bold text-gray-900 text-xs">{c.personName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: {c.personId}</div>
                    </td>

                    <td className="p-3 sm:p-3.5">
                      <RoleBadge role={c.role} size="sm" />
                    </td>

                    <td className="p-3 sm:p-3.5">{getConflictTypeBadge(c.type)}</td>

                    <td className="p-3 sm:p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-800">
                          <span className="font-semibold">{c.conflictingCourseName}</span>
                          <span className="text-[10px] text-gray-500">
                            ({c.conflictingDates}, {c.conflictingTime})
                          </span>
                        </div>
                        {c.attemptedCourseName && (
                          <div className="flex items-center gap-1.5 text-rose-700 font-medium text-[11px]">
                            <span>vs. {c.attemptedCourseName}</span>
                            <span className="text-[10px] text-rose-500">
                              ({c.attemptedDates}, {c.attemptedTime})
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">
                      <button
                        onClick={() => onNavigateToSession(c.conflictingSessionId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
                      >
                        <span>View in Calendar</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
