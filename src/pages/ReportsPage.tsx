import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { calculateDaysBetween, timeToMinutes } from '../utils/dateUtils';
import { isPersonInSession } from '../utils/conflictEngine';
import { RoleBadge } from '../components/common/RoleBadge';
import {
  BarChart3,
  Download,
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { people, courses, sessions, allConflicts, exportTraining } = usePlanner();

  // Compute workload per person
  const personWorkloads = people.map((p) => {
    const assigned = sessions.filter((s) => isPersonInSession(p.id, s).inSession);
    let totalDays = 0;
    let totalHours = 0;

    assigned.forEach((s) => {
      const days = calculateDaysBetween(s.startDate, s.endDate);
      totalDays += days;
      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);
      totalHours += ((endMin - startMin) / 60) * days;
    });

    return {
      person: p,
      sessionCount: assigned.length,
      totalDays,
      totalHours: Math.round(totalHours),
    };
  }).sort((a, b) => b.totalDays - a.totalDays);

  // Compute course popularity
  const courseStats = courses.map((c) => {
    const courseSessions = sessions.filter((s) => s.courseId === c.id);
    let totalScheduledDays = 0;
    courseSessions.forEach((s) => {
      totalScheduledDays += calculateDaysBetween(s.startDate, s.endDate);
    });

    return {
      course: c,
      sessionCount: courseSessions.length,
      totalScheduledDays,
    };
  }).sort((a, b) => b.sessionCount - a.sessionCount);

  // Department distribution
  const deptCounts: Record<string, number> = {};
  people.forEach((p) => {
    deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Training Reports &amp; Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Resource utilization, instructor workload distribution, and curriculum volume
          </p>
        </div>

        <button
          onClick={exportTraining}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export Master Schedule CSV</span>
        </button>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Total Scheduled Sessions</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{sessions.length}</div>
          <span className="text-[11px] text-gray-400">Across Oct–Nov 2026</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Total Training Days</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">
            {sessions.reduce((acc, s) => acc + calculateDaysBetween(s.startDate, s.endDate), 0)}
          </div>
          <span className="text-[11px] text-gray-400">Cumulative instructor days</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Active Instructors &amp; Staff</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-teal-600">
            {people.filter((p) => p.active).length}
          </div>
          <span className="text-[11px] text-gray-400">Available resources</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Active Conflicts</span>
            <AlertTriangle className={`w-4 h-4 ${allConflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className={`mt-2 text-2xl font-bold ${allConflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {allConflicts.length}
          </div>
          <span className="text-[11px] text-gray-400">
            {allConflicts.length === 0 ? 'Optimal schedule' : 'Requires date adjustment'}
          </span>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Person Workload Ranking */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Resource Utilization Ranking</h2>
              <p className="text-xs text-gray-500">Instructor training days &amp; hours</p>
            </div>
            <Users className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs">
            {personWorkloads.map((item, idx) => {
              const maxDays = Math.max(...personWorkloads.map((w) => w.totalDays), 1);
              const barPct = Math.round((item.totalDays / maxDays) * 100);

              return (
                <div key={item.person.id} className="p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-400 text-xs w-4">#{idx + 1}</span>
                      <span className="font-bold text-gray-900">{item.person.name}</span>
                      <span className="text-gray-400 text-[10px]">({item.person.department})</span>
                    </div>
                    <span className="font-bold text-blue-700 text-xs">
                      {item.totalDays} days ({item.totalHours}h)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                    <span>{item.sessionCount} assigned trainings</span>
                    <div className="flex gap-1">
                      {item.person.roles.map((r) => (
                        <span key={r} className="text-[9px] bg-slate-100 px-1 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Demand Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Course Demand &amp; Volume</h2>
              <p className="text-xs text-gray-500">Scheduled occurrences by course</p>
            </div>
            <BookOpen className="w-4 h-4 text-gray-400" />
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs">
            {courseStats.map((item) => {
              const maxSessions = Math.max(...courseStats.map((c) => c.sessionCount), 1);
              const barPct = Math.round((item.sessionCount / maxSessions) * 100);

              return (
                <div key={item.course.id} className="p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.course.color || '#2563eb' }}
                      />
                      <span className="font-bold text-gray-900">{item.course.name}</span>
                    </div>
                    <span className="font-bold text-indigo-700 text-xs">
                      {item.sessionCount} sessions ({item.totalScheduledDays} days)
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                    <span>{item.course.category}</span>
                    <span className="font-mono">{item.course.code || 'N/A'}</span>
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
