import React, { useState, useEffect, useRef, useCallback } from "react";
import { installGlobalInputValidation } from "./utils/validation";
import { hasModuleAccess } from "./utils/rbac";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HostelProvider } from "./context/HostelContext";
import { ExaminationProvider } from "./context/ExaminationContext";
import { HRProvider } from "./context/HRContext";
import { DataProvider, useData } from "./context/DataContext";

import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { GlobalSearchModal } from "./components/common/GlobalSearchModal";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
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
import { DriverProfileView } from "./components/modules/Staff/DriverProfileView";
import { DriverAttendanceView } from "./components/modules/Staff/DriverAttendanceView";
import { DriverLeaveView } from "./components/modules/Staff/DriverLeaveView";
import { DriverPayslipsView } from "./components/modules/Staff/DriverPayslipsView";
import { AdmissionsView } from "./components/modules/Admissions/AdmissionsView";
import { AcademicDashboardView } from "./components/modules/Academics/AcademicDashboardView";
import { ClassManagementWorkspace } from "./components/modules/Academics/ClassManagementWorkspace";
import { SubjectsView } from "./components/modules/Academics/SubjectsView";
import { AttendanceView } from "./components/modules/Attendance/AttendanceView";
import { TimetableView } from "./components/modules/Timetable/TimetableView";
import { ExaminationView } from "./components/modules/Examination/ExaminationView";
import { MarksEntryView } from "./components/modules/Examination/MarksEntryView";
import { ClassTeacherMarksEntryView } from "./components/modules/Examination/ClassTeacherMarksEntryView";
import { GlobalReportCardsView } from "./components/modules/Examination/GlobalReportCardsView";
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
import { DriverTransportPortalView } from "./components/modules/Transport/DriverTransportPortalView";
import { HostelView } from "./components/modules/Hostel/HostelView";
import { HostelContainerView } from "./components/modules/Hostel/HostelContainerView";
import { WardenAttendanceView } from "./components/modules/Hostel/WardenAttendanceView";
import { InventoryView } from "./components/modules/Inventory/InventoryView";
import { CommunicationView } from "./components/modules/School Administration/Communication Hub/CommunicationView";
import { EventsView } from "./components/modules/School Administration/Events & Holidays/EventsView";
import { ReportsView } from "./components/modules/School Administration/School Reports/ReportsView";
import { UserManagementView } from "./components/modules/UserManagement/UserManagementView";
import { SettingsView } from "./components/modules/Settings/SettingsView";
import { TrainingContainerView } from "./components/modules/School Administration/Faculty Development & Training/TrainingContainerView";
import { StaffLettersManagementView } from "./components/modules/Staff/Letters/StaffLettersManagementView";

const formatEmailToName = (email?: string): string => {
  if (!email || !email.includes('@')) return '';
  const username = email.split('@')[0];
  const parts = username.split(/[._-]/);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
};

const MainLayout: React.FC = () => {
  const { isAuthenticated, user, setUser, role, setRole } = useAuth();
  const { staff, driverMasters, students, admissions } = useData();
  const [activeModule, setActiveModuleState] = useState<string>(() => {
    try {
      const isTimeout = localStorage.getItem("session_timeout_occurred") === "true";
      const resume = isTimeout ? localStorage.getItem("session_resume_module") : null;
      if (resume && resume !== "dashboard") {
        localStorage.setItem("active_module", resume);
        localStorage.removeItem("session_resume_module");
        localStorage.removeItem("session_timeout_occurred");
        return resume;
      }
      const saved = localStorage.getItem("active_module");
      return saved || "dashboard";
    } catch {
      return "dashboard";
    }
  });

  const setActiveModule = useCallback((mod: string | ((prev: string) => string)) => {
    setActiveModuleState((prev) => {
      const next = typeof mod === "function" ? mod(prev) : mod;
      try {
        localStorage.setItem("active_module", next);
      } catch {}
      return next;
    });
  }, []);
  const [showLogin, setShowLogin] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        return window.location.hash === "#login";
      }
      return false;
    } catch {
      return false;
    }
  });
  const [selectedPortalRole, setSelectedPortalRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleModuleNav = (e: any) => {
      if (e?.detail) {
        setActiveModule(e.detail);
      }
    };
    const handleSessionExpired = () => {
      try {
        sessionStorage.setItem("show_login_view", "true");
        window.location.hash = "#login";
      } catch {}
      setShowLogin(true);
      setActiveModuleState("dashboard");
    };

    const handleHashChange = () => {
      const isLoginHash = window.location.hash === "#login";
      setShowLogin(isLoginHash);
      if (!isLoginHash) {
        try {
          sessionStorage.removeItem("show_login_view");
          localStorage.removeItem("session_timeout_occurred");
          localStorage.removeItem("show_login_view");
        } catch {}
      }
    };

    window.addEventListener('navigate_module', handleModuleNav as EventListener);
    window.addEventListener('session_expired', handleSessionExpired);
    window.addEventListener('auth_unauthorized', handleSessionExpired);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('navigate_module', handleModuleNav as EventListener);
      window.removeEventListener('session_expired', handleSessionExpired);
      window.removeEventListener('auth_unauthorized', handleSessionExpired);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


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
  const [selectedClassId, setSelectedClassIdState] = useState<string>(() => {
    try {
      return localStorage.getItem("active_selected_class_id") || "";
    } catch {
      return "";
    }
  });
  const setSelectedClassId = (val: string | ((prev: string) => string)) => {
    setSelectedClassIdState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("active_selected_class_id", next);
      } catch {}
      return next;
    });
  };

  const [classWorkspaceTab, setClassWorkspaceTabState] = useState<
    | "overview"
    | "sections"
    | "subjects"
    | "teachers"
    | "students"
    | "timetable"
    | "settings"
    | "future"
  >(() => {
    try {
      const saved = localStorage.getItem("active_class_tab");
      return (saved as any) || "overview";
    } catch {
      return "overview";
    }
  });
  const setClassWorkspaceTab = (tab: any) => {
    setClassWorkspaceTabState((prev: any) => {
      const next = typeof tab === "function" ? tab(prev) : tab;
      try {
        localStorage.setItem("active_class_tab", next);
      } catch {}
      return next;
    });
  };
  const [autoOpenClassModal, setAutoOpenClassModal] = useState(false);

  const userRole = user?.role?.toLowerCase() || "";

  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      if (prevAuthenticated.current) {
        // User transitioned from authenticated -> logged out or session expired
        const isTimeout = localStorage.getItem("session_timeout_occurred") === "true";
        setActiveModuleState("dashboard");
        try {
          if (isTimeout) {
            const resumeMod = localStorage.getItem("session_resume_module") || localStorage.getItem("active_module");
            if (resumeMod && resumeMod !== "dashboard") {
              localStorage.setItem("session_resume_module", resumeMod);
            }
          } else {
            localStorage.removeItem("session_resume_module");
            localStorage.removeItem("settings_active_tab");
            try { sessionStorage.removeItem("settings_active_tab"); } catch {}
          }
          localStorage.setItem("active_module", "dashboard");
          if (window.location.hash !== "#login") {
            window.location.hash = "#login";
          }
        } catch {}
        setShowLogin(true);
      }
    } else {
      if (!prevAuthenticated.current) {
        const isTimeout = localStorage.getItem("session_timeout_occurred") === "true";
        const resumeMod = isTimeout ? localStorage.getItem("session_resume_module") : null;
        const targetMod = (resumeMod && resumeMod !== "dashboard") ? resumeMod : "dashboard";
        setActiveModuleState(targetMod);
        try {
          localStorage.setItem("active_module", targetMod);
          localStorage.removeItem("session_resume_module");
          localStorage.removeItem("session_timeout_occurred");
          if (!isTimeout) {
            localStorage.removeItem("settings_active_tab");
            try { sessionStorage.removeItem("settings_active_tab"); } catch {}
          }
          if (window.location.hash === "#login") {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } catch {}
      } else {
        try {
          const saved = localStorage.getItem("active_module");
          if (saved && saved !== activeModule) {
            setActiveModuleState(saved);
          }
        } catch {}
      }
    }
    prevAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (activeModule === "dashboard") {
      setClassWorkspaceTab("overview");
      setSelectedClassId("");
    }
  }, [activeModule]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [selectedClassId]);

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <LoginView
          onBack={() => {
            try {
              sessionStorage.removeItem("show_login_view");
              localStorage.removeItem("session_timeout_occurred");
              localStorage.removeItem("show_login_view");
              if (window.location.hash === "#login") {
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
              }
            } catch {}
            setShowLogin(false);
          }}
          initialRole={selectedPortalRole}
        />
      );
    }
    return (
      <LandingView
        onLoginClick={(role) => {
          setSelectedPortalRole(role);
          try {
            sessionStorage.setItem("show_login_view", "true");
            if (window.location.hash !== "#login") {
              window.location.hash = "#login";
            }
          } catch {}
          setShowLogin(true);
        }}
      />
    );
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
      if (userRole === "parent" || userRole === "student") {
        return (
          <ParentFinanceView
            activeTab="parent-fee-dues"
            onTabChange={setActiveModule}
          />
        );
      }
      if (!hasModuleAccess(role || userRole, "fees")) {
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      }
      return (
        <FinanceContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("transport-")) {
      if (userRole === "parent" || userRole === "student") {
        return <ParentBusInfoView />;
      }
      if (userRole === "driver") {
        return <DriverTransportPortalView onNavigate={setActiveModule} />;
      }
      if (!hasModuleAccess(role || userRole, "transport")) {
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      }
      return (
        <TransportContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("hostel-")) {
      if (userRole === "parent" || userRole === "student") {
        return <ParentHostelView />;
      }
      if (!hasModuleAccess(role || userRole, "hostel")) {
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      }
      return (
        <HostelContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("uniform-")) {
      if (userRole === "parent" || userRole === "student" || !hasModuleAccess(role || userRole, "uniforms")) {
        return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      }
      return (
        <UniformContainerView
          initialTab={activeModule}
          onTabChange={setActiveModule}
        />
      );
    }

    if (activeModule.startsWith("staff-payroll")) {
      if (userRole === "parent" || userRole === "student")
        return <ParentTeacherInfoView />;
      if (userRole === "driver") return <DriverPayslipsView />;
      if (["teacher", "hostel warden", "warden", "librarian", "staff"].includes(userRole))
        return <TeacherPayslipsView />;
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
        return !hasModuleAccess(role || userRole, "students") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <StudentList onNavigate={(mod) => setActiveModule(mod)} />
        );
      case "academic-history":
        return !hasModuleAccess(role || userRole, "academic-history") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <AcademicHistoryView />
        );
      case "student-promotion":
        return !hasModuleAccess(role || userRole, "student-promotion") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <StudentPromotionView />
        );
      case "certificates":
      case "transfer-certificates":
        return !hasModuleAccess(role || userRole, "certificates") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <CertificatesView
            onNavigateToSettings={() => setActiveModule("settings")}
          />
        );
      case "alumni":
        return !hasModuleAccess(role || userRole, "alumni") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <AlumniView />
        );
      case "driver-profile":
        return <DriverProfileView />;
      case "driver-attendance":
        return <DriverAttendanceView />;
      case "driver-leave":
        return <DriverLeaveView />;
      case "driver-payslips":
        return <DriverPayslipsView />;
      case "warden-profile":
      case "teacher-profile":
      case "teacher-my-profile":
        return userRole === "driver" ? <DriverProfileView /> : <TeacherProfileView />;
      case "staff":
      case "staff-teachers":
      case "staff-directory":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "teacher" || userRole === "hostel warden" || userRole === "warden" || userRole === "accountant" || userRole === "finance" || userRole === "librarian" || userRole === "staff") return <TeacherProfileView />;
        if (userRole === "driver") return <DriverProfileView />;
        return <StaffList onNavigate={setActiveModule} />;
      case "staff-letters":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "teacher" || userRole === "hostel warden" || userRole === "warden" || userRole === "accountant" || userRole === "finance" || userRole === "librarian" || userRole === "staff") return <TeacherProfileView />;
        if (userRole === "driver") return <DriverProfileView />;
        return <StaffLettersManagementView onNavigate={setActiveModule} />;
      case "staff-non-teaching":
        if (["teacher", "librarian", "hostel warden", "warden", "accountant", "finance", "staff"].includes(userRole)) return <TeacherProfileView />;
        if (userRole === "driver") return <DriverProfileView />;
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <StaffList initialCategory="Staff" onNavigate={setActiveModule} />
        );
      case "staff-add":
        if (["teacher", "librarian", "hostel warden", "warden", "accountant", "finance", "staff"].includes(userRole)) return <TeacherProfileView />;
        if (userRole === "driver") return <DriverProfileView />;
        return userRole === "parent" || userRole === "student" ? (
          <ParentTeacherInfoView />
        ) : (
          <StaffRegistrationPage onNavigate={setActiveModule} />
        );
      case "staff-attendance":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "driver") return <DriverAttendanceView />;
        return <StaffAttendanceView onNavigate={(mod) => setActiveModule(mod)} />;
      case "staff-leave":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "driver") return <DriverLeaveView />;
        return <LeaveManagementView />;
      case "staff-my-payslips":
      case "teacher-payslips":
        if (userRole === "parent" || userRole === "student")
          return <ParentTeacherInfoView />;
        if (userRole === "driver") return <DriverPayslipsView />;
        return <TeacherPayslipsView />;
      case "admissions":
      case "admissions-add":
        return !hasModuleAccess(role || userRole, "admissions") ? (
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
        ) : !hasModuleAccess(role || userRole, "academics") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
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
        if (!hasModuleAccess(role || userRole, "academics")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
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
        ) : !hasModuleAccess(role || userRole, "subjects") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <SubjectsView />
        );
      case "warden-attendance":
      case "hostel-warden-attendance":
        return (userRole === "hostel warden" || userRole === "warden")
          ? <WardenAttendanceView />
          : <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
      case "attendance":
        return userRole === "parent" || userRole === "student" ? (
          <ParentAttendanceView />
        ) : (
          <AttendanceView />
        );
      case "timetable":
        return userRole === "parent" || userRole === "student" ? (
          <ParentTimetableView />
        ) : !hasModuleAccess(role || userRole, "timetable") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <TimetableView onNavigate={(mod) => setActiveModule(mod)} />
        );
      case "examination":
        return userRole === "parent" || userRole === "student" ? (
          <ParentExaminationView />
        ) : (
          <ExaminationView />
        );
      case "marks-entry":
      case "teacher-marks-entry":
      case "examination-marks":
      case "examination-marks-entry":
        if (userRole === "parent" || userRole === "student") return <ParentExaminationView />;
        if (!hasModuleAccess(role || userRole, "marks-entry")) return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        return <ClassTeacherMarksEntryView onNavigate={setActiveModule} />;
      case "report-cards":
      case "examination-report-cards":
        return userRole === "parent" || userRole === "student" ? (
          <ParentExaminationView />
        ) : (
          <GlobalReportCardsView onNavigate={setActiveModule} />
        );
      case "homework":
        return userRole === "parent" || userRole === "student" ? (
          <ParentHomeworkView />
        ) : (
          <HomeworkView />
        );
      case "fees":
        if (userRole === "parent" || userRole === "student") {
          return (
            <ParentFinanceView
              activeTab="parent-fee-dues"
              onTabChange={setActiveModule}
            />
          );
        }
        if (!hasModuleAccess(role || userRole, "fees")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return (
          <FinanceContainerView
            initialTab="fee-collection"
            onTabChange={setActiveModule}
          />
        );
      case "uniforms":
        return !hasModuleAccess(role || userRole, "uniforms") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <UniformContainerView
            initialTab="uniform-dashboard"
            onTabChange={setActiveModule}
          />
        );
      case "library":
        return !hasModuleAccess(role || userRole, "library") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <LibraryView initialPhase="phase1" initialTab="dashboard" />
        );
      case "library-books":
        return !hasModuleAccess(role || userRole, "library") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <LibraryView initialPhase="phase1" initialTab="books" />
        );
      case "library-issue":
      case "library-return":
      case "library-fines":
        if (userRole === "parent" || userRole === "student" || !hasModuleAccess(role || userRole, "library")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return activeModule === "library-issue"
          ? <LibraryView initialPhase="phase2" initialTab="issue" />
          : activeModule === "library-return"
          ? <LibraryView initialPhase="phase2" initialTab="return" />
          : <LibraryView initialPhase="phase3" initialTab="fines" />;
      case "librarian-attendance":
      case "library-attendance":
        if (userRole !== "librarian") {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return <LibrarianAttendanceView />;
      case "library-timetable":
        if (userRole === "parent" || !hasModuleAccess(role || userRole, "library")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return <LibraryTimetableView />;
      case "transport":
        if (userRole === "parent" || userRole === "student") {
          return <ParentBusInfoView />;
        }
        if (userRole === "driver") {
          return <DriverTransportPortalView onNavigate={setActiveModule} />;
        }
        if (!hasModuleAccess(role || userRole, "transport")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return (
          <TransportContainerView
            initialTab="transport-dashboard"
            onTabChange={setActiveModule}
          />
        );
      case "hostel":
      case "hostel-dashboard":
      case "hostel-masters":
      case "hostel-student-hostel":
      case "hostel-reports":
      case "hostel-room-allocation":
      case "hostel-attendance":
      case "hostel-attendance-register":
      case "hostel-outpass":
      case "hostel-outpass-leave":
      case "hostel-blocks":
      case "hostel-rooms":
      case "hostel-wardens":
      case "outpass":
      case "room-allocation":
      case "student-hostel":
        if (userRole === "parent" || userRole === "student") {
          return <ParentHostelView />;
        }
        if (!hasModuleAccess(role || userRole, "hostel")) {
          return <DashboardView onNavigate={(mod) => setActiveModule(mod)} />;
        }
        return (
          <HostelContainerView
            initialTab={activeModule}
            onTabChange={setActiveModule}
          />
        );
      case "inventory":
        return !hasModuleAccess(role || userRole, "inventory") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <InventoryView />
        );
      case "communication":
        return <CommunicationView />;
      case "events":
        return <EventsView />;
      case "training":
        return !hasModuleAccess(role || userRole, "training") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <TrainingContainerView />
        );
      case "reports":
        return !hasModuleAccess(role || userRole, "reports") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <ReportsView />
        );
      case "users":
      case "roles":
        return !hasModuleAccess(role || userRole, "users") ? (
          <DashboardView onNavigate={(mod) => setActiveModule(mod)} />
        ) : (
          <UserManagementView />
        );
      case "settings":
        return !hasModuleAccess(role || userRole, "settings") ? (
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
        className={`pt-20 pb-4 sm:pb-6 px-4 sm:px-6 transition-all duration-300 print:ml-0 print:m-0 print:p-0 print:w-full ${
          collapsed ? "ml-20" : "ml-56"
        }`}
      >
        <ErrorBoundary key={activeModule}>
          {renderModuleContent()}
        </ErrorBoundary>
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
  useEffect(() => {
    return installGlobalInputValidation();
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
