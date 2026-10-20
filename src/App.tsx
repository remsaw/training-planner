import React, { useState } from 'react';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { CalendarPage } from './pages/CalendarPage';
import { PeoplePage } from './pages/PeoplePage';
import { CoursesPage } from './pages/CoursesPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrainingModal } from './components/modals/TrainingModal';
import { TrainingDetailsModal } from './components/modals/TrainingDetailsModal';
import { DuplicateModal } from './components/modals/DuplicateModal';
import { PersonModal } from './components/modals/PersonModal';
import { CourseModal } from './components/modals/CourseModal';
import { PersonScheduleModal } from './components/modals/PersonScheduleModal';
import { AvailabilityCheckerModal } from './components/modals/AvailabilityCheckerModal';
import { ImportModal } from './components/modals/ImportModal';
import { PasswordGateScreen } from './components/auth/PasswordGateScreen';
import { Menu, CalendarCheck, Plus, Search, AlertTriangle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activePage,
    setActivePage,
    selectedSessionId,
    setSelectedSessionId,
    settings,
    isLocked,
    unlockApp,
    allConflicts,
  } = usePlanner();

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [initialTrainingDate, setInitialTrainingDate] = useState<string | undefined>();
  const [initialTrainingEndDate, setInitialTrainingEndDate] = useState<string | undefined>();
  const [initialTrainingPersonId, setInitialTrainingPersonId] = useState<string | undefined>();
  const [initialTrainingTime, setInitialTrainingTime] = useState<string | undefined>();
  const [initialTrainingCourseId, setInitialTrainingCourseId] = useState<string | undefined>();

  const [duplicateSessionId, setDuplicateSessionId] = useState<string | null>(null);

  const [personModalOpen, setPersonModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const [viewSchedulePersonId, setViewSchedulePersonId] = useState<string | null>(null);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Handlers
  const handleOpenAddTraining = (
    date?: string,
    personId?: string,
    time?: string,
    endDate?: string,
    courseId?: string
  ) => {
    setEditingSessionId(null);
    setInitialTrainingDate(date);
    setInitialTrainingEndDate(endDate);
    setInitialTrainingPersonId(personId);
    setInitialTrainingTime(time);
    setInitialTrainingCourseId(courseId);
    setTrainingModalOpen(true);
  };

  const handleEditTraining = (id: string) => {
    setSelectedSessionId(null);
    setEditingSessionId(id);
    setTrainingModalOpen(true);
  };

  const handleDuplicateTraining = (id: string) => {
    setSelectedSessionId(null);
    setDuplicateSessionId(id);
  };

  const handleOpenAddPerson = () => {
    setEditingPersonId(null);
    setPersonModalOpen(true);
  };

  const handleEditPerson = (id: string) => {
    setEditingPersonId(id);
    setPersonModalOpen(true);
  };

  const handleOpenAddCourse = () => {
    setEditingCourseId(null);
    setCourseModalOpen(true);
  };

  const handleEditCourse = (id: string) => {
    setEditingCourseId(id);
    setCourseModalOpen(true);
  };

  const handleScheduleForCourse = (courseId: string) => {
    handleOpenAddTraining(undefined, undefined, undefined, undefined, courseId);
  };

  const isRtl = settings.language === 'ar';

  if (isLocked) {
    return (
      <>
        <PasswordGateScreen onUnlock={unlockApp} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-slate-50 font-sans text-gray-900 antialiased"
    >
      {/* Mobile Top Header Bar */}
      <header className="md:hidden bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="p-2 -ml-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActivePage('calendar')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-tight">
                Resource Planner
              </span>
              <span className="text-[10px] text-blue-300 font-medium uppercase block leading-none">
                {activePage}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {allConflicts.length > 0 && (
            <button
              onClick={() => setActivePage('conflicts')}
              title={`${allConflicts.length} Conflict(s)`}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{allConflicts.length}</span>
            </button>
          )}

          <button
            onClick={() => setAvailabilityModalOpen(true)}
            title="Check Availability"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenAddTraining()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAvailabilityCheck={() => setAvailabilityModalOpen(true)}
        onOpenAddTraining={() => handleOpenAddTraining()}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {activePage === 'calendar' && (
          <CalendarPage
            onOpenAddTraining={handleOpenAddTraining}
            onSelectSession={(id) => setSelectedSessionId(id)}
          />
        )}

        {activePage === 'people' && (
          <PeoplePage
            onOpenAddPerson={handleOpenAddPerson}
            onEditPerson={handleEditPerson}
            onViewSchedule={(id) => setViewSchedulePersonId(id)}
            onOpenImport={() => setImportModalOpen(true)}
          />
        )}

        {activePage === 'courses' && (
          <CoursesPage
            onOpenAddCourse={handleOpenAddCourse}
            onEditCourse={handleEditCourse}
            onScheduleCourse={handleScheduleForCourse}
            onOpenImport={() => setImportModalOpen(true)}
          />
        )}

        {activePage === 'conflicts' && (
          <ConflictsPage
            onNavigateToSession={(sessionId) => {
              setSelectedSessionId(sessionId);
              setActivePage('calendar');
            }}
          />
        )}

        {activePage === 'reports' && <ReportsPage />}

        {activePage === 'settings' && <SettingsPage />}
      </main>

      {/* Global Modals & Drawers */}
      <TrainingModal
        isOpen={trainingModalOpen}
        onClose={() => setTrainingModalOpen(false)}
        editSessionId={editingSessionId}
        initialDate={initialTrainingDate}
        initialEndDate={initialTrainingEndDate}
        initialPersonId={initialTrainingPersonId}
        initialTime={initialTrainingTime}
        initialCourseId={initialTrainingCourseId}
        onOpenCreateCourse={() => {
          setTrainingModalOpen(false);
          setEditingCourseId(null);
          setCourseModalOpen(true);
        }}
      />

      <TrainingDetailsModal
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        onEdit={handleEditTraining}
        onDuplicate={handleDuplicateTraining}
      />

      <DuplicateModal
        sessionId={duplicateSessionId}
        onClose={() => setDuplicateSessionId(null)}
      />

      <PersonModal
        isOpen={personModalOpen}
        onClose={() => setPersonModalOpen(false)}
        personId={editingPersonId}
      />

      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        courseId={editingCourseId}
      />

      <PersonScheduleModal
        personId={viewSchedulePersonId}
        onClose={() => setViewSchedulePersonId(null)}
        onSelectSession={(id) => setSelectedSessionId(id)}
      />

      <AvailabilityCheckerModal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
        onScheduleForPerson={(personId, sDate, eDate) => {
          handleOpenAddTraining(sDate, personId, undefined, eDate);
        }}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PlannerProvider>
      <MainLayout />
    </PlannerProvider>
  );
}
