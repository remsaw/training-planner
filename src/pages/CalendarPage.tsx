import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { CalendarToolbar } from '../components/calendar/CalendarToolbar';
import { KpiCards } from '../components/calendar/KpiCards';
import { ResourceWeekView } from '../components/calendar/ResourceWeekView';
import { ResourceDayView } from '../components/calendar/ResourceDayView';
import { MonthView } from '../components/calendar/MonthView';
import { Calendar, AlertCircle } from 'lucide-react';

interface CalendarPageProps {
  onOpenAddTraining: (date?: string, personId?: string, time?: string) => void;
  onSelectSession: (id: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onOpenAddTraining,
  onSelectSession,
}) => {
  const { calendarView, filteredSessions, allConflicts, setActivePage } = usePlanner();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Training Calendar</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Visual Training Schedule &amp; Resource Availability
          </p>
        </div>

        {/* Global Conflict Warning Pill if conflicts exist */}
        {allConflicts.length > 0 && (
          <button
            onClick={() => setActivePage('conflicts')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer animate-pulse"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{allConflicts.length} Scheduling Conflict(s) Detected</span>
            <span className="text-rose-500 font-bold">&rsaquo;</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Calendar Toolbar */}
      <CalendarToolbar onOpenAddTraining={() => onOpenAddTraining()} />

      {/* Calendar View Container */}
      {calendarView === 'resource-week' && (
        <ResourceWeekView
          onSelectSession={onSelectSession}
          onQuickAdd={(personId, dateStr) => onOpenAddTraining(dateStr, personId)}
        />
      )}

      {calendarView === 'resource-day' && (
        <ResourceDayView
          onSelectSession={onSelectSession}
          onQuickAdd={(personId, dateStr, timeStr) => onOpenAddTraining(dateStr, personId, timeStr)}
        />
      )}

      {calendarView === 'month' && (
        <MonthView
          onSelectSession={onSelectSession}
          onQuickAddDate={(dateStr) => onOpenAddTraining(dateStr)}
        />
      )}
    </div>
  );
};
