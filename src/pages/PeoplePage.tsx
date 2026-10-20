import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { RoleBadge } from '../components/common/RoleBadge';
import { isPersonInSession } from '../utils/conflictEngine';
import { isDateWithin, formatDate } from '../utils/dateUtils';
import {
  UserPlus,
  Search,
  Download,
  Upload,
  Edit2,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Role } from '../types';

interface PeoplePageProps {
  onOpenAddPerson: () => void;
  onEditPerson: (id: string) => void;
  onViewSchedule: (id: string) => void;
  onOpenImport: () => void;
}

export const PeoplePage: React.FC<PeoplePageProps> = ({
  onOpenAddPerson,
  onEditPerson,
  onViewSchedule,
  onOpenImport,
}) => {
  const { people, sessions, deactivatePerson, activatePerson, deletePerson, exportPeople } = usePlanner();
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | Role | 'Multiple'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const todayStr = formatDate(new Date());

  const filtered = people.filter((p) => {
    if (roleFilter === 'Multiple' && p.roles.length < 2) return false;
    if (roleFilter !== 'All' && roleFilter !== 'Multiple' && !p.roles.includes(roleFilter as Role)) return false;
    if (statusFilter === 'Active' && !p.active) return false;
    if (statusFilter === 'Inactive' && p.active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDept = p.department.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      const matchEmp = p.employeeId?.toLowerCase().includes(q);
      if (!matchName && !matchDept && !matchEmail && !matchEmp) return false;
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">People / Resources</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage instructional staff, department assignments, and availability
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import People</span>
          </button>

          <button
            onClick={exportPeople}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddPerson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Person</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-3.5 bg-white rounded-xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department, ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 w-full sm:w-auto"
          >
            <option value="All">All Roles</option>
            <option value="Multiple">⭐ Multiple Roles</option>
            <option value="Lecturer">Lecturer (🎓)</option>
            <option value="Supervisor">Supervisor (👁)</option>
            <option value="Technical">Technical (💻)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 w-full sm:w-auto"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3 sm:p-3.5 pl-4 sm:pl-5">Name &amp; ID</th>
                <th className="p-3 sm:p-3.5">Department</th>
                <th className="p-3 sm:p-3.5">Role</th>
                <th className="p-3 sm:p-3.5">Today's Status</th>
                <th className="p-3 sm:p-3.5 text-center">Training Count</th>
                <th className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No people found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((person) => {
                  const personSessions = sessions.filter(
                    (s) => isPersonInSession(person.id, s).inSession
                  );
                  const trainingCount = personSessions.length;

                  // Busy today check
                  const isBusyToday = personSessions.some((s) =>
                    isDateWithin(todayStr, s.startDate, s.endDate)
                  );

                  return (
                    <tr key={person.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3 sm:p-3.5 pl-4 sm:pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${
                              person.avatarColor || 'bg-blue-600'
                            } text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                          >
                            {person.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              <span>{person.name}</span>
                              {!person.active && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 font-normal px-1.5 py-0.2 rounded border">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {person.employeeId || 'EMP-N/A'} {person.email ? `• ${person.email}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-3.5 text-gray-700 font-medium">
                        {person.department}
                      </td>

                      <td className="p-3 sm:p-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {person.roles.map((r) => (
                            <RoleBadge key={r} role={r} size="sm" />
                          ))}
                        </div>
                      </td>

                      <td className="p-3 sm:p-3.5">
                        {!person.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Deactivated
                          </span>
                        ) : isBusyToday ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            Busy Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Available
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-3.5 text-center">
                        <span className="font-bold text-gray-900 bg-slate-100 px-2.5 py-1 rounded-md">
                          {trainingCount} Trainings
                        </span>
                      </td>

                      <td className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewSchedule(person.id)}
                            className="px-2.5 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            View Schedule
                          </button>
                          <button
                            onClick={() => onEditPerson(person.id)}
                            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            title="Edit Person"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deletingPersonId === person.id ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in">
                              <span className="text-[11px] font-bold text-rose-700">Delete?</span>
                              <button
                                onClick={() => {
                                  deletePerson(person.id);
                                  setDeletingPersonId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeletingPersonId(null)}
                                className="px-2 py-0.5 border border-gray-300 bg-white text-gray-700 rounded text-[11px] hover:bg-gray-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              {person.active ? (
                                <button
                                  onClick={() => deactivatePerson(person.id)}
                                  className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                  title="Deactivate Person (keeps history)"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => activatePerson(person.id)}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                  title="Activate Person"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setDeletingPersonId(person.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete Person"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
