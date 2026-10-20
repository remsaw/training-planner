import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { Calendar, CalendarRange, Users, BookOpen, AlertTriangle } from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { kpis, setActivePage } = usePlanner();

  const cards = [
    {
      label: "Today's Trainings",
      value: kpis.todayTrainingsCount,
      sub: 'Active sessions today',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50/70 border-blue-100',
      iconBg: 'bg-blue-100/70',
      action: null,
    },
    {
      label: 'This Week',
      value: kpis.thisWeekTrainingsCount,
      sub: 'Scheduled in current week',
      icon: CalendarRange,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/70 border-indigo-100',
      iconBg: 'bg-indigo-100/70',
      action: null,
    },
    {
      label: 'Active People',
      value: kpis.activePeopleCount,
      sub: 'Instructors & team',
      icon: Users,
      color: 'text-teal-600',
      bg: 'bg-teal-50/70 border-teal-100',
      iconBg: 'bg-teal-100/70',
      action: () => setActivePage('people'),
    },
    {
      label: 'Active Courses',
      value: kpis.activeCoursesCount,
      sub: 'Training catalog',
      icon: BookOpen,
      color: 'text-purple-600',
      bg: 'bg-purple-50/70 border-purple-100',
      iconBg: 'bg-purple-100/70',
      action: () => setActivePage('courses'),
    },
    {
      label: 'Conflicts',
      value: kpis.conflictsCount,
      sub: kpis.conflictsCount > 0 ? 'Requires attention' : 'Zero scheduling overlaps',
      icon: AlertTriangle,
      color: kpis.conflictsCount > 0 ? 'text-rose-600' : 'text-emerald-600',
      bg:
        kpis.conflictsCount > 0
          ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/20'
          : 'bg-emerald-50/60 border-emerald-100',
      iconBg: kpis.conflictsCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600',
      badge: kpis.conflictsCount > 0 ? 'Action Needed' : 'Clean',
      action: () => setActivePage('conflicts'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            onClick={c.action || undefined}
            className={`p-3.5 rounded-xl border bg-white shadow-xs transition-all ${c.bg} ${
              c.action ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">{c.label}</span>
              <div className={`p-1.5 rounded-lg ${c.iconBg}`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-gray-900">{c.value}</span>
              {c.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    kpis.conflictsCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {c.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 truncate">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
};
