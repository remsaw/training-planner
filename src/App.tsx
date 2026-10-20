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

const MainLayout: React.FC = () => {
  const {
    activePage,
    setActivePage,
    selectedSessionId,
    setSelectedSessionId,
    settings,
    isLocked,
    appPassword,
    unlockApp,
  } = usePlanner();

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
      className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-gray-900 antialiased"
    >
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAvailabilityCheck={() => setAvailabilityModalOpen(true)}
        onOpenAddTraining={() => handleOpenAddTraining()}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
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
