import React, { useState, useEffect } from 'react';
import { usePlanner } from '../../context/PlannerContext';
import { X, BookPlus, BookOpen } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string | null;
}

export const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, courseId }) => {
  const { courses, addCourse, updateCourse } = usePlanner();

  const isEdit = Boolean(courseId);
  const existingCourse = courseId ? courses.find((c) => c.id === courseId) : null;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Health Informatics');
  const [description, setDescription] = useState('');
  const [defaultDurationDays, setDefaultDurationDays] = useState(5);
  const [color, setColor] = useState('#2563eb');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (existingCourse) {
      setName(existingCourse.name);
      setCode(existingCourse.code || '');
      setCategory(existingCourse.category);
      setDescription(existingCourse.description || '');
      setDefaultDurationDays(existingCourse.defaultDurationDays || 5);
      setColor(existingCourse.color || '#2563eb');
      setActive(existingCourse.active);
    } else {
      setName('');
      setCode('');
      setCategory('Healthcare Analytics');
      setDescription('');
      setDefaultDurationDays(5);
      setColor('#2563eb');
      setActive(true);
    }
  }, [existingCourse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEdit && courseId) {
      updateCourse(courseId, {
        name,
        code,
        category,
        description,
        defaultDurationDays,
        color,
        active,
      });
    } else {
      addCourse({
        name,
        code,
        category,
        description,
        defaultDurationDays,
        color,
        active,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            {isEdit ? <BookOpen className="w-5 h-5 text-blue-600" /> : <BookPlus className="w-5 h-5 text-blue-600" />}
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Edit Course' : '+ Add Course'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Course Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advanced Healthcare Analytics"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Course Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AHA-301"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Health Informatics"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Duration</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={defaultDurationDays}
                  onChange={(e) => setDefaultDurationDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">Days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <span className="text-gray-500 font-mono text-[11px]">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Overview of syllabus, clinical objectives, prerequisites..."
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-gray-800 text-xs block">Active Course</span>
              <span className="text-[11px] text-gray-500">Available for new scheduling events</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
