import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  BookPlus,
  Search,
  Download,
  Upload,
  CalendarPlus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface CoursesPageProps {
  onOpenAddCourse: () => void;
  onEditCourse: (id: string) => void;
  onScheduleCourse: (courseId: string) => void;
  onOpenImport: () => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  onOpenAddCourse,
  onEditCourse,
  onScheduleCourse,
  onOpenImport,
}) => {
  const { courses, sessions, deleteCourse, exportCourses } = usePlanner();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = Array.from(new Set(courses.map((c) => c.category)));

  const filtered = courses.filter((c) => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code?.toLowerCase().includes(q);
      const matchCat = c.category.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCat) return false;
    }
    return true;
  });

  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    deleteCourse(id);
    setDeletingCourseId(null);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Training Courses</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Course curriculum catalog, duration templates, and scheduled session counts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Courses</span>
          </button>

          <button
            onClick={exportCourses}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddCourse}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <BookPlus className="w-3.5 h-3.5" />
            <span>+ Add Course</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-3.5 bg-white rounded-xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by name or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3 sm:p-3.5 pl-4 sm:pl-5">Course Title</th>
                <th className="p-3 sm:p-3.5">Code</th>
                <th className="p-3 sm:p-3.5">Category</th>
                <th className="p-3 sm:p-3.5 text-center">Scheduled Events</th>
                <th className="p-3 sm:p-3.5">Status</th>
                <th className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No courses found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((course) => {
                  const courseSessions = sessions.filter((s) => s.courseId === course.id);

                  return (
                    <tr key={course.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3 sm:p-3.5 pl-4 sm:pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-8 rounded-full shrink-0"
                            style={{ backgroundColor: course.color || '#2563eb' }}
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{course.name}</div>
                            {course.description && (
                              <div className="text-[11px] text-gray-500 line-clamp-1 max-w-md">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-3.5 font-mono text-gray-600 font-semibold">
                        {course.code || '—'}
                      </td>

                      <td className="p-3 sm:p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {course.category}
                        </span>
                      </td>

                      <td className="p-3 sm:p-3.5 text-center">
                        <span className="font-bold text-gray-900 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                          {courseSessions.length} Scheduled
                        </span>
                      </td>

                      <td className="p-3 sm:p-3.5">
                        {course.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-3.5 text-right pr-4 sm:pr-5">
                        {deletingCourseId === course.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                            <span className="text-[11px] font-bold text-rose-700">Delete?</span>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingCourseId(null)}
                              className="px-2 py-0.5 border border-gray-300 bg-white text-gray-700 rounded text-[11px] hover:bg-gray-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onScheduleCourse(course.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Schedule</span>
                            </button>
                            <button
                              onClick={() => onEditCourse(course.id)}
                              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Edit Course"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCourseId(course.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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
