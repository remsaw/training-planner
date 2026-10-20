import React from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  CalendarDays,
  Users,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Settings,
  Sparkles,
  Search,
  CheckCircle2,
  CalendarCheck,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  onOpenAvailabilityCheck: () => void;
  onOpenAddTraining: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAvailabilityCheck, onOpenAddTraining }) => {
  const { activePage, setActivePage, allConflicts, settings, lockApp, googleSheetsUrl, syncStatus } = usePlanner();

  const navItems = [
    {
      id: 'calendar' as const,
      label: 'Calendar',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'people' as const,
      label: 'People',
      icon: Users,
      badge: null,
    },
    {
      id: 'courses' as const,
      label: 'Courses',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'conflicts' as const,
      label: 'Conflicts',
      icon: AlertTriangle,
      badge: allConflicts.length > 0 ? allConflicts.length : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'reports' as const,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">
              Resource Planner
            </h1>
            <p className="text-[11px] text-blue-300 font-medium tracking-wide uppercase">
              Healthcare Training
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Professional Training Scheduling &amp; Resource Management
        </p>
      </div>

      {/* Quick Action Button */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={onOpenAddTraining}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-600/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Training</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Utilities
        </div>

        {/* Quick Check Availability Tool */}
        <button
          onClick={onOpenAvailabilityCheck}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Check Availability</span>
        </button>

        {/* Lock Portal Screen */}
        <button
          onClick={lockApp}
          title="Lock planner screen with password"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/70 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Lock Planner</span>
        </button>
      </nav>

      {/* Core Rule Reminder Footer */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Core Scheduling Rule</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          1 Person = 1 Training per Calendar Day. Multi-day overlaps are automatically blocked.
        </p>
      </div>

      {/* Status Footer */}
      <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div
          onClick={() => setActivePage('settings')}
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
          title={googleSheetsUrl ? 'Google Sheets Cloud Sync Active' : 'Click to configure Google Sheets Cloud Sync'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              !googleSheetsUrl
                ? 'bg-emerald-500'
                : syncStatus === 'syncing'
                ? 'bg-blue-400 animate-ping'
                : syncStatus === 'error'
                ? 'bg-rose-500'
                : 'bg-emerald-400'
            }`}
          ></span>
          <span>
            {!googleSheetsUrl
              ? 'Local Storage'
              : syncStatus === 'syncing'
              ? 'Syncing Sheet...'
              : syncStatus === 'error'
              ? 'Sync Error'
              : 'Google Sheets Synced'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">v1.0 • Oct 2026</span>
      </div>
    </aside>
  );
};
