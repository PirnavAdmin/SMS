import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { LandingView } from './components/modules/Auth/LandingView';
import { LoginView } from './components/modules/Auth/LoginView';
import { ProfileCompletionView } from './components/modules/Auth/ProfileCompletionView';
import { ChangePasswordModal } from './components/modules/Auth/ChangePasswordModal';

import { DashboardView } from './components/modules/Dashboard/DashboardView';
import { StudentList } from './components/modules/Students/StudentList';
import { StaffList } from './components/modules/Staff/StaffList';
import { StaffRegistrationPage } from './components/modules/Staff/StaffRegistrationPage';
import { LeaveManagementView } from './components/modules/Staff/LeaveManagementView';
import { StaffAttendanceView } from './components/modules/Staff/StaffAttendanceView';
import { PayrollModuleView } from './components/modules/Staff/PayrollModuleViewSimple';
import { AdmissionsView } from './components/modules/Admissions/AdmissionsView';
import { AcademicsView } from './components/modules/Academics/AcademicsView';
import { SubjectsView } from './components/modules/Academics/SubjectsView';
import { AttendanceView } from './components/modules/Attendance/AttendanceView';
import { TimetableView } from './components/modules/Timetable/TimetableView';
import { ExaminationView } from './components/modules/Examination/ExaminationView';
import { MarksEntryView } from './components/modules/Examination/MarksEntryView';
import { HomeworkView } from './components/modules/Homework/HomeworkView';
import { ParentHomeworkView } from './components/modules/Academics/ParentHomeworkView';
import { ParentTimetableView } from './components/modules/Academics/ParentTimetableView';
import { ParentExaminationView } from './components/modules/Academics/ParentExaminationView';
import { ParentTeacherInfoView } from './components/modules/Academics/ParentTeacherInfoView';
import { ParentBusInfoView } from './components/modules/Transport/ParentBusInfoView';
import { ParentAttendanceView } from './components/modules/Attendance/ParentAttendanceView';
import { ParentFinanceView } from './components/modules/Dashboard/ParentFinanceView';
import { ParentHostelView } from './components/modules/Dashboard/ParentHostelView';
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
import { TrainingContainerView } from './components/modules/Training/TrainingContainerView';

const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  const userRole = user?.role?.toLowerCase() || '';

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveModule('dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeModule]);

  if (!isAuthenticated) {
    if (showLogin) {
      return <LoginView onBack={() => setShowLogin(false)} />;
    }
    return <LandingView onLoginClick={() => setShowLogin(true)} />;
  }

  if (user?.isFirstLogin) {
    return <ProfileCompletionView />;
  }

  const renderModuleContent = () => {
    if (activeModule.startsWith('parent-fee-')) {
      return <ParentFinanceView activeTab={activeModule} onTabChange={setActiveModule} />;
    }

    switch (activeModule) {
      case 'parent-hostel-details':
        return <ParentHostelView />;
      case 'parent-teacher-info':
        return <ParentTeacherInfoView />;
      case 'parent-bus-info':
        return <ParentBusInfoView />;
      default:
        break;
    }

    if (activeModule.startsWith('finance-')) {
      return <FinanceContainerView initialTab={activeModule} onTabChange={setActiveModule} />;
    }

    if (activeModule.startsWith('transport-')) {
      return <TransportContainerView initialTab={activeModule} onTabChange={setActiveModule} />;
    }

    if (activeModule.startsWith('hostel-')) {
      return <HostelContainerView initialTab={activeModule} onTabChange={setActiveModule} />;
    }

    if (activeModule.startsWith('uniform-')) {
      return <UniformContainerView initialTab={activeModule} onTabChange={setActiveModule} />;
    }

    if (activeModule.startsWith('staff-payroll')) {
      return <PayrollModuleView initialTab={activeModule} onTabChange={setActiveModule} />;
    }

    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      case 'students':
        return <StudentList onNavigate={(mod) => setActiveModule(mod)} />;
      case 'staff':
      case 'staff-teachers':
      case 'staff-directory':
        return <StaffList onNavigate={setActiveModule} />;
      case 'staff-add':
        return <StaffRegistrationPage onNavigate={setActiveModule} />;
      case 'staff-attendance':
        return <StaffAttendanceView />;
      case 'staff-leave':
        return <LeaveManagementView />;
      case 'admissions':
      case 'admissions-add':
        return (
          <AdmissionsView
            onNavigate={(mod) => setActiveModule(mod)}
            initialFormOpen={activeModule === 'admissions-add'}
          />
        );
      case 'academics':
        return <AcademicsView />;
      case 'subjects':
        return <SubjectsView />;
      case 'attendance':
        return userRole === 'parent' || userRole === 'student' ? <ParentAttendanceView /> : <AttendanceView />;
      case 'timetable':
        return userRole === 'parent' || userRole === 'student' ? <ParentTimetableView /> : <TimetableView onNavigate={(mod) => setActiveModule(mod)} />;
      case 'examination':
        return userRole === 'parent' || userRole === 'student' 
          ? <ParentExaminationView /> 
          : ((userRole === 'teacher' || userRole === 'class teacher') 
              ? <MarksEntryView /> 
              : <ExaminationView />);
      case 'homework':
        return userRole === 'parent' || userRole === 'student' ? <ParentHomeworkView /> : <HomeworkView />;
      case 'fees':
        return <FinanceContainerView initialTab="fee-collection" onTabChange={setActiveModule} />;
      case 'uniforms':
        return <UniformContainerView initialTab="uniform-dashboard" onTabChange={setActiveModule} />;
      case 'library':
        return <LibraryView />;
      case 'transport':
        return <TransportContainerView initialTab="transport-dashboard" onTabChange={setActiveModule} />;
      case 'hostel':
        return <HostelContainerView initialTab="hostel-dashboard" onTabChange={setActiveModule} />
      case 'inventory':
        return <InventoryView />;
      case 'communication':
        return <CommunicationView />;
      case 'events':
        return <EventsView />;
      case 'training':
        return <TrainingContainerView />;
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
        setCollapsed={setCollapsed}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenChangePass={() => setChangePassOpen(true)}
      />

      <main
        className={`pt-20 pb-12 px-4 sm:px-6 transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
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
