import React, { useState } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Plus,
  Grid3X3,
  Columns3,
  CalendarDays,
  X,
  RotateCcw,
} from 'lucide-react';
import { getWeekDays } from '../../utils/dateUtils';

interface CalendarToolbarProps {
  onOpenAddTraining: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({ onOpenAddTraining }) => {
  const {
    currentDate,
    setCurrentDate,
    calendarView,
    setCalendarView,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    people,
    courses,
    sessions,
  } = usePlanner();

  const [showFilterPopover, setShowFilterPopover] = useState(false);

  // Period label computation
  const getPeriodLabel = () => {
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });

    if (calendarView === 'month') {
      return `${monthName} ${year}`;
    }

    if (calendarView === 'resource-day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Resource week
    const week = getWeekDays(currentDate);
    const start = week[0].date;
    const end = week[6].date;
    const startM = start.toLocaleDateString('en-US', { month: 'short' });
    const endM = end.toLocaleDateString('en-US', { month: 'short' });

    if (startM === endM) {
      return `${start.getDate()} – ${end.getDate()} ${startM} ${year}`;
    }
    return `${start.getDate()} ${startM} – ${end.getDate()} ${endM} ${year}`;
  };

  // Navigation handlers
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (calendarView === 'resource-day') {
      d.setDate(d.getDate() - 1);
    } else if (calendarView === 'resource-week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (calendarView === 'resource-day') {
      d.setDate(d.getDate() + 1);
    } else if (calendarView === 'resource-week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  // Distinct locations from sessions
  const locations = Array.from(new Set(sessions.map((s) => s.location).filter(Boolean)));

  const hasActiveFilters =
    filters.role !== 'All' ||
    filters.personId !== 'All' ||
    filters.courseId !== 'All' ||
    filters.location !== 'All' ||
    filters.status !== 'All' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setFilters({
      role: 'All',
      personId: 'All',
      courseId: 'All',
      location: 'All',
      status: 'All',
    });
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-3 sm:p-3.5 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Today, Prev/Next, Period Name */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow-2xs">
            <button
              onClick={handlePrev}
              aria-label="Previous Period"
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-gray-200" />
            <button
              onClick={handleNext}
              aria-label="Next Period"
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="ml-0.5 sm:ml-1 text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-2 flex-wrap">
            <span>{getPeriodLabel()}</span>
            <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              {calendarView === 'resource-week'
                ? 'Week Grid'
                : calendarView === 'resource-day'
                ? 'Resource Columns'
                : 'Month Overview'}
            </span>
          </div>
        </div>

        {/* Center / Right: View Toggle, Search, Filter, + Add Training */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="grid grid-cols-3 sm:flex items-center p-1 bg-gray-100 rounded-lg text-xs font-medium border border-gray-200 w-full sm:w-auto">
            <button
              onClick={() => setCalendarView('resource-week')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                calendarView === 'resource-week'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Week</span>
              <span className="hidden sm:inline">Resource Week</span>
            </button>

            <button
              onClick={() => setCalendarView('resource-day')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                calendarView === 'resource-day'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Day</span>
              <span className="hidden sm:inline">Resource Day</span>
            </button>

            <button
              onClick={() => setCalendarView('month')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                calendarView === 'month'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span>Month</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-initial">
            {/* Search Bar */}
            <div className="relative flex-1 sm:min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, people..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Popover Toggle */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  hasActiveFilters
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                )}
              </button>

              {/* Filter Dropdown Popover */}
              {showFilterPopover && (
                <>
                  <div
                    onClick={() => setShowFilterPopover(false)}
                    className="fixed inset-0 z-30 bg-black/20 sm:bg-transparent"
                  />
                  <div className="fixed inset-x-3 top-24 sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-40 text-xs">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-900">Filter Calendar</span>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px]"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Role Filter */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Role</label>
                        <select
                          value={filters.role}
                          onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value as any }))}
                          className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
                        >
                          <option value="All">All Roles</option>
                          <option value="Lecturer">Lecturer (🎓)</option>
                          <option value="Supervisor">Supervisor (👁)</option>
                          <option value="Technical">Technical (💻)</option>
                        </select>
                      </div>

                      {/* Person Filter */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Person</label>
                        <select
                          value={filters.personId}
                          onChange={(e) => setFilters((f) => ({ ...f, personId: e.target.value }))}
                          className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
                        >
                          <option value="All">All People</option>
                          {people.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.roles.join(', ')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Course Filter */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Course</label>
                        <select
                          value={filters.courseId}
                          onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
                          className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
                        >
                          <option value="All">All Courses</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Location Filter */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Location</label>
                        <select
                          value={filters.location}
                          onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
                          className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
                        >
                          <option value="All">All Locations</option>
                          {locations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">Availability / Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any }))}
                          className="w-full p-1.5 border border-gray-300 rounded-md bg-white text-xs"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Available">🟢 Available</option>
                          <option value="Busy">🔴 Busy</option>
                          <option value="Conflict">⚠️ Has Conflict</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => setShowFilterPopover(false)}
                        className="px-3 py-1 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* + Add Training Button */}
            <button
              onClick={onOpenAddTraining}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs shadow-blue-500/25 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Training</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
