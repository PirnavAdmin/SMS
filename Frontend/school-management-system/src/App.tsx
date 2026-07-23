import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LoginView } from './components/modules/Auth/LoginView';
import { ChangePasswordModal } from './components/modules/Auth/ChangePasswordModal';

import { DashboardView } from './components/modules/Dashboard/DashboardView';
import { StudentList } from './components/modules/Students/StudentList';
import { StaffList } from './components/modules/Staff/StaffList';
import { AdmissionsView } from './components/modules/Admissions/AdmissionsView';
import { AcademicsView } from './components/modules/Academics/AcademicsView';
import { SubjectsView } from './components/modules/Academics/SubjectsView';
import { AttendanceView } from './components/modules/Attendance/AttendanceView';
import { TimetableView } from './components/modules/Timetable/TimetableView';
import { ExaminationView } from './components/modules/Examination/ExaminationView';
import { HomeworkView } from './components/modules/Homework/HomeworkView';
import { FeeManagementView } from './components/modules/FeeManagement/FeeManagementView';
import { FinanceContainerView } from './components/modules/Finance/FinanceContainerView';
import { UniformContainerView } from './components/modules/Uniform/UniformContainerView';
import { LibraryView } from './components/modules/Library/LibraryView';
import { TransportView } from './components/modules/Transport/TransportView';
import { TransportContainerView } from './components/modules/Transport/TransportContainerView';
import { HostelView } from './components/modules/Hostel/HostelView';
import { HostelContainerView } from './components/modules/Hostel/HostelContainerView';
import { InventoryView } from './components/modules/Inventory/InventoryView';
import { CommunicationView } from './components/modules/Communication/CommunicationView';
import { EventsView } from './components/modules/Events/EventsView';
import { ReportsView } from './components/modules/Reports/ReportsView';
import { UserManagementView } from './components/modules/UserManagement/UserManagementView';
import { SettingsView } from './components/modules/Settings/SettingsView';
import { AcademicYearContainerView } from './components/modules/Settings/AcademicYearContainerView';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderModuleContent = () => {
    if (activeModule.startsWith('finance-')) {
      return <FinanceContainerView initialTab={activeModule} />;
    }

    if (activeModule.startsWith('transport-')) {
      return <TransportContainerView initialTab={activeModule} />;
    }

    if (activeModule.startsWith('hostel-')) {
      return <HostelContainerView initialTab={activeModule} />;
    }

    if (activeModule.startsWith('uniform-')) {
      return <UniformContainerView initialTab={activeModule} />;
    }

    if (activeModule.startsWith('acad-')) {
      return <AcademicYearContainerView initialTab={activeModule} />;
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      case 'students':
        return <StudentList />;
      case 'staff':
        return <StaffList />;
      case 'admissions':
        return <AdmissionsView />;
      case 'academics':
        return <AcademicsView />;
      case 'subjects':
        return <SubjectsView />;
      case 'attendance':
        return <AttendanceView />;
      case 'timetable':
        return <TimetableView />;
      case 'examination':
        return <ExaminationView />;
      case 'homework':
        return <HomeworkView />;
      case 'fees':
        return <FinanceContainerView initialTab="fee-collection" />;
      case 'uniforms':
        return <UniformContainerView initialTab="uniform-dashboard" />;
      case 'library':
        return <LibraryView />;
      case 'transport':
        return <TransportContainerView initialTab="transport-dashboard" />;
      case 'hostel':
        return <HostelContainerView initialTab="hostel-dashboard" />;
      case 'inventory':
        return <InventoryView />;
      case 'communication':
        return <CommunicationView />;
      case 'events':
        return <EventsView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UserManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <Header
        collapsed={collapsed}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenChangePass={() => setChangePassOpen(true)}
      />

      <main
        className={`pt-20 pb-12 px-4 sm:px-8 transition-all duration-300 ${
          collapsed ? 'pl-24' : 'pl-24 sm:pl-72'
        }`}
      >
        {renderModuleContent()}
      </main>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
      />

      <ChangePasswordModal
        isOpen={changePassOpen}
        onClose={() => setChangePassOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <MainLayout />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
