<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { HostelProvider } from './context/HostelContext';
import { ExaminationProvider } from './context/ExaminationContext';
import { HRProvider } from './context/HRContext';
=======
import React, { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
>>>>>>> cb326498cf1a5763bf149835a488ab5c84f96454

import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { GlobalSearchModal } from "./components/common/GlobalSearchModal";
import { LandingView } from "./components/modules/Auth/LandingView";
import { LoginView } from "./components/modules/Auth/LoginView";
import { ProfileCompletionView } from "./components/modules/Auth/ProfileCompletionView";
import { ChangePasswordModal } from "./components/modules/Auth/ChangePasswordModal";

import { DashboardView } from "./components/modules/Dashboard/DashboardView";
import { StudentList } from "./components/modules/Students/StudentList";
import { AcademicHistoryView } from "./components/modules/Students/AcademicHistoryView";
import { StudentPromotionView } from "./components/modules/Students/Student Promotion/StudentPromotionView";
import { CertificatesView } from "./components/modules/Certificates/CertificatesView";
import { AlumniView } from "./components/modules/Students/AlumniView";
import { StaffList } from "./components/modules/Staff/StaffList";
import { TeacherProfileView } from "./components/modules/Staff/TeacherProfileView";
import { StaffRegistrationPage } from "./components/modules/Staff/StaffRegistrationPage";
import { LeaveManagementView } from "./components/modules/Staff/LeaveManagementView";
import { StaffAttendanceView } from "./components/modules/Staff/StaffAttendanceView";
import { PayrollModuleView } from "./components/modules/Staff/PayrollModuleViewSimple";
import { TeacherPayslipsView } from "./components/modules/Staff/TeacherPayslipsView";
import { AdmissionsView } from "./components/modules/Admissions/AdmissionsView";
import { AcademicDashboardView } from "./components/modules/Academics/AcademicDashboardView";
import { ClassManagementWorkspace } from "./components/modules/Academics/ClassManagementWorkspace";
import { SubjectsView } from "./components/modules/Academics/SubjectsView";
import { AttendanceView } from "./components/modules/Attendance/AttendanceView";
import { TimetableView } from "./components/modules/Timetable/TimetableView";
import { ExaminationView } from "./components/modules/Examination/ExaminationView";
import { MarksEntryView } from "./components/modules/Examination/MarksEntryView";
import { HomeworkView } from "./components/modules/Homework/HomeworkView";
import { ParentHomeworkView } from "./components/modules/Academics/ParentHomeworkView";
import { ParentTimetableView } from "./components/modules/Academics/ParentTimetableView";
import { ParentExaminationView } from "./components/modules/Academics/ParentExaminationView";
import { ParentTeacherInfoView } from "./components/modules/Academics/ParentTeacherInfoView";
import { ParentBusInfoView } from "./components/modules/Transport/ParentBusInfoView";
import { ParentAttendanceView } from "./components/modules/Attendance/ParentAttendanceView";
import { ParentFinanceView } from "./components/modules/Dashboard/ParentFinanceView";
import { ParentHostelView } from "./components/modules/Dashboard/ParentHostelView";
import { FinanceContainerView } from "./components/modules/Finance/FinanceContainerView";
import { UniformContainerView } from "./components/modules/Uniform/UniformContainerView";
import { LibraryView } from "./components/modules/Library/LibraryView";
import { LibrarianAttendanceView } from "./components/modules/Library/LibrarianAttendanceView";
import { LibraryTimetableView } from "./components/modules/Library/LibraryTimetableView";
import { TransportView } from "./components/modules/Transport/TransportView";
import { TransportContainerView } from "./components/modules/Transport/TransportContainerView";
import { HostelView } from "./components/modules/Hostel/HostelView";
import { HostelContainerView } from "./components/modules/Hostel/HostelContainerView";
import { InventoryView } from "./components/modules/Inventory/InventoryView";
import { CommunicationView } from "./components/modules/School Administration/Communication Hub/CommunicationView";
import { EventsView } from "./components/modules/School Administration/Events & Holidays/EventsView";
import { ReportsView } from "./components/modules/School Administration/School Reports/ReportsView";
import { UserManagementView } from "./components/modules/UserManagement/UserManagementView";
import { SettingsView } from "./components/modules/Settings/SettingsView";
import { TrainingContainerView } from "./components/modules/School Administration/Faculty Development & Training/TrainingContainerView";

const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeModule, setActiveModule] = useState<string>("dashboard");
  const [showLogin, setShowLogin] = useState(false);
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const setCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("sidebar_collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classWorkspaceTab, setClassWorkspaceTab] = useState<
    | "overview"
    | "sections"
    | "subjects"
    | "teachers"
    | "students"
    | "timetable"
    | "settings"
    | "future"
  >("overview");
  const [autoOpenClassModal, setAutoOpenClassModal] = useState(false);

  const userRole = user?.role?.toLowerCase() || "";

  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveModule("dashboard");
      if (prevAuthenticated.current) {
        setShowLogin(true);
      }
    }
    prevAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (
      activeModule === "dashboard" ||
      activeModule === "academic-class" ||
      activeModule === "academic-dashboard"
    ) {
      setClassWorkspaceTab("overview");
      if (
        activeModule === "dashboard" ||
        activeModule === "academic-dashboard" ||
        activeModule === "academic-class"
      ) {
        setSelectedClassId("");
      }
    }
  }, [activeModule]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedClassId]);

  if (!isAuthenticated) {
    if (showLogin) {
      return <LoginView onBack={() => setShowLogin(false)} />;
    }
    return <LandingView onLoginClick={() => setShowLogin(true)} />;
  }

  // Straight to Dashboard on login (Profile completion accessible anytime via Edit Profile option)

  const renderModuleContent = () => {
    if (activeModule.startsWith("parent-fee-")) {
      return (
        <ParentFinanceView
          activeTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    switch (activeModule) {
      case "parent-hostel-details":
        return <ParentHostelView />;
      case "parent-teacher-info":
        return <ParentTeacherInfoView />;
      case "parent-bus-info":
        return <ParentBusInfoView />;
      default:
        break;
    }

    if (activeModule.startsWith("finance-")) {
      return userRole === "parent" || userRole === "student" ? (
        <ParentFinanceView
          activeTab="parent-fee-dues"
          onTabChange={setActiveModule}
        />
      ) : (
        <FinanceContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("transport-")) {
      return userRole === "parent" || userRole === "student" ? (
        <ParentBusInfoView />
      ) : (
        <TransportContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("hostel-")) {
      return userRole === "parent" || userRole === "student" ? (
        <ParentHostelView />
      ) : (
        <HostelContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("uniform-")) {
      return userRole === "parent" || userRole === "student" ? (
        <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
      ) : (
        <UniformContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("staff-payroll")) {
      if (userRole === "parent" || userRole === "student")
        return <ParentTeacherInfoView />;
      if (userRole === "teacher") return <TeacherPayslipsView />;
      return (
        <PayrollModuleView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    switch (activeModule) {
      case "dashboard":
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      case "students":
      case "student-directory":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <StudentList onNavigate={(mod) => setActiveModule(mod)} />
        );
      case "academic-history":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <AcademicHistoryView />
        );
      case "student-promotion":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <StudentPromotionView />
        );
      case "certificates":
      case "transfer-certificates":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <CertificatesView
            onNavigateToSettings={() => setActiveModule("settings")}
          />
        );
      case "alumni":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <AlumniView />
        );
      case "teacher-profile":
      case "teacher-my-profile":
        return <TeacherProfileView />;
      case "staff":
      case "staff-teachers":
      case "staff-directory":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "teacher") return <TeacherProfileView />;
        return <StaffList onNavigate={setActiveModule} />;
      case "staff-non-teaching":
        if (userRole === "teacher") return <TeacherProfileView />;
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <StaffList initialCategory="Staff" onNavigate={setActiveModule} />
        );
      case "staff-add":
        if (userRole === "teacher") return <TeacherProfileView />;
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <StaffRegistrationPage onNavigate={setActiveModule} />
        );
      case "staff-attendance":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <StaffAttendanceView onNavigate={(mod) => setActiveModule(mod)} />
        );
      case "staff-leave":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <LeaveManagementView />
        );
      case "staff-my-payslips":
      case "teacher-payslips":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <TeacherPayslipsView />
        );
      case "admissions":
      case "admissions-add":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <AdmissionsView
            onNavigate={(mod) => setActiveModule(mod)}
            initialFormOpen={activeModule === "admissions-add"}
          />
        );
      case "academics":
      case "academic-dashboard":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTimetableView />
        ) : (
          <AcademicDashboardView
            onNavigate={setActiveModule}
            setSelectedClassId={setSelectedClassId}
            setClassWorkspaceTab={setClassWorkspaceTab}
            setAutoOpenClassModal={setAutoOpenClassModal}
          />
        );
      case "academic-class":
      case "academic-subjects":
      case "academic-timetable":
      case "academic-settings":
      case "academic-year":
      case "academic-sections":
      case "academic-mapping":
      case "academic-class-teacher":
      case "academic-subject-teacher":
      case "academic-student-assignment":
      case "academic-publish": {
        if (userRole === "parent" || userRole === "student") {
          return <ParentTimetableView />;
        }
        let targetTab = classWorkspaceTab;
        if (activeModule === "academic-subjects") targetTab = "subjects";
        else if (activeModule === "academic-timetable") targetTab = "future";
        else if (
          activeModule === "academic-settings" ||
          activeModule === "academic-year"
        )
          targetTab = "settings";

        return (
          <ClassManagementWorkspace
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            classWorkspaceTab={targetTab}
            setClassWorkspaceTab={setClassWorkspaceTab}
            onTabChange={setActiveModule}
            autoOpenClassModal={autoOpenClassModal}
            setAutoOpenClassModal={setAutoOpenClassModal}
          />
        );
      }
      case "subjects":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTimetableView />
        ) : (
          <SubjectsView />
        );
      case "attendance":
        return userRole === "parent" || userRole === "student" ? (
          <ParentAttendanceView />
        ) : (
          <AttendanceView />
        );
      case "timetable":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTimetableView />
        ) : (
          <TimetableView onNavigate={(mod) => setActiveModule(mod)} />
        );
      case "examination":
        return userRole === "parent" || userRole === "student" ? (
          <ParentExaminationView />
        ) : (
          <ExaminationView />
        );
      case "homework":
        return userRole === "parent" || userRole === "student" ? (
          <ParentHomeworkView />
        ) : (
          <HomeworkView />
        );
      case "fees":
        return userRole === "parent" || userRole === "student" ? (
          <ParentFinanceView
            activeTab="parent-fee-dues"
            onTabChange={setActiveModule}
          />
        ) : (
          <FinanceContainerView
            initialTab="fee-collection"
            onTabChange={setActiveModule}
          />
        );
      case "uniforms":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <UniformContainerView
            initialTab="uniform-dashboard"
            onTabChange={setActiveModule}
          />
        );
      case "library":
        return <LibraryView />;
      case "librarian-attendance":
      case "library-attendance":
        return <LibrarianAttendanceView />;
      case "library-timetable":
        return <LibraryTimetableView />;
      case "transport":
        return userRole === "parent" || userRole === "student" ? (
          <ParentBusInfoView />
        ) : (
          <TransportContainerView
            initialTab="transport-dashboard"
            onTabChange={setActiveModule}
          />
        );
      case "hostel":
      case "hostel-room-allocation":
      case "room-allocation":
      case "student-hostel":
        return userRole === "parent" || userRole === "student" ? (
          <ParentHostelView />
        ) : (
          <HostelContainerView
            initialTab="hostel-student-hostel"
            onTabChange={setActiveModule}
          />
        );
      case "inventory":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <InventoryView />
        );
      case "communication":
        return <CommunicationView />;
      case "events":
        return <EventsView />;
      case "training":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <TrainingContainerView />
        );
      case "reports":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <ReportsView />
        );
      case "users":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <UserManagementView />
        );
      case "settings":
        return userRole === "parent" || userRole === "student" ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <SettingsView />
        );
      case "profile-completion":
      case "edit-profile":
        return (
          <ProfileCompletionView
            onComplete={() => setActiveModule("dashboard")}
          />
        );
      default:
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 dark:bg-brand-950 text-slate-900 dark:text-slate-100 font-sans">
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
        onNavigate={(mod) => setActiveModule(mod)}
      />

      <main
        className={`pt-20 pb-12 px-4 sm:px-6 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
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

<<<<<<< HEAD
=======
import { HostelProvider } from "./context/HostelContext";
import { ExaminationProvider } from "./context/ExaminationContext";
import { HRProvider } from "./context/HRContext";

>>>>>>> cb326498cf1a5763bf149835a488ab5c84f96454
export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <HostelProvider>
            <ExaminationProvider>
              <HRProvider>
                <DataProvider>
                  <MainLayout />
                </DataProvider>
              </HRProvider>
            </ExaminationProvider>
          </HostelProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
