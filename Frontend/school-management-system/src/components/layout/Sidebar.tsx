import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  User,
  UserCheck,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  BookOpen,
  Clock,
  Award,
  FileText,
  FileCheck,
  Library,
  Bus,
  Home,
  Package,
  Megaphone,
  Calendar,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronRight,
  School,
  Shirt,
  Layers,
  Tag,
  UserPlus,
  Gift,
  Percent,
  AlertTriangle,
  Route,
  Bed,
  Receipt,
  RotateCcw,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Presentation,
  Link2,
  TrendingUp,
  History,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { hasModuleAccess } from "../../utils/rbac";

interface SidebarProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  collapsed: boolean;
  setCollapsed: (col: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  collapsed,
  setCollapsed,
}) => {
  const { role, user } = useAuth();
  const { schoolProfile, admissions, students } = useData();

  let isHosteller = true;
  let usesTransport = true;

  if (role.toLowerCase() === "student" || role.toLowerCase() === "parent") {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const parentWards = students.filter(
          (s) =>
            s.status === "Active" &&
            (role.toLowerCase() === "student"
              ? (s.id === user?.id || s.email === user?.email)
              : (
                  (userEmail && (
                    s.guardianEmail?.toLowerCase() === userEmail || 
                    s.guardianPhone?.toLowerCase() === userEmail || 
                    s.contactEmail?.toLowerCase() === userEmail || 
                    s.contactPhone?.toLowerCase() === userEmail ||
                    s.fatherPhone?.toLowerCase() === userEmail ||
                    s.motherPhone?.toLowerCase() === userEmail
                  )) ||
                  (userName && (
                    s.fatherName?.toLowerCase() === userName ||
                    s.motherName?.toLowerCase() === userName ||
                    s.guardianName?.toLowerCase() === userName
                  ))
                )),
        );

    isHosteller = true;
    usesTransport = true;
  }

  const isFinanceActive =
    activeModule.startsWith("finance-") ||
    activeModule === "fees" ||
    activeModule.startsWith("parent-fee-");
  const isHostelActive =
    activeModule.startsWith("hostel-") ||
    activeModule === "hostel" ||
    activeModule.startsWith("parent-hostel-");
  const isTransportActive =
    activeModule.startsWith("transport-") ||
    activeModule === "transport" ||
    activeModule.startsWith("parent-bus-") ||
    activeModule.startsWith("parent-transport-");
  const isUniformActive =
    activeModule.startsWith("uniform-") || activeModule === "uniforms";
  const isLibraryActive =
    activeModule.startsWith("library") ||
    activeModule === "librarian-attendance";
  const isStaffActive =
    activeModule.startsWith("staff-") ||
    activeModule === "staff" ||
    activeModule === "teacher-profile" ||
    activeModule.startsWith("parent-teacher-");
  const isAcademicsActive =
    activeModule.startsWith("academic-") ||
    activeModule === "academics" ||
    activeModule === "subjects" ||
    activeModule === "timetable";

  const [financeExpanded, setFinanceExpanded] = useState(isFinanceActive);
  const [hostelExpanded, setHostelExpanded] = useState(isHostelActive);
  const [transportExpanded, setTransportExpanded] = useState(isTransportActive);
  const [uniformExpanded, setUniformExpanded] = useState(isUniformActive);
  const [libraryExpanded, setLibraryExpanded] = useState(isLibraryActive);
  const [staffExpanded, setStaffExpanded] = useState(isStaffActive);
  const [academicsExpanded, setAcademicsExpanded] = useState(isAcademicsActive);

  const [lastActiveGroup, setLastActiveGroup] = useState<
    | "finance"
    | "hostel"
    | "transport"
    | "uniform"
    | "staff"
    | "academics"
    | "other"
  >(
    isFinanceActive
      ? "finance"
      : isHostelActive
        ? "hostel"
        : isTransportActive
          ? "transport"
          : isUniformActive
            ? "uniform"
            : isStaffActive
              ? "staff"
              : isAcademicsActive
                ? "academics"
                : "other",
  );

  React.useEffect(() => {
    if (isFinanceActive && lastActiveGroup !== "finance") {
      setFinanceExpanded(true);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("finance");
    } else if (isHostelActive && lastActiveGroup !== "hostel") {
      setHostelExpanded(true);
      setFinanceExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("hostel");
    } else if (isTransportActive && lastActiveGroup !== "transport") {
      setTransportExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("transport");
    } else if (isUniformActive && lastActiveGroup !== "uniform") {
      setUniformExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("uniform");
    } else if (isStaffActive && lastActiveGroup !== "staff") {
      setStaffExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("staff");
    } else if (isAcademicsActive && lastActiveGroup !== "academics") {
      setAcademicsExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setLastActiveGroup("academics");
    } else if (
      !isFinanceActive &&
      !isHostelActive &&
      !isTransportActive &&
      !isUniformActive &&
      !isStaffActive &&
      !isAcademicsActive
    ) {
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
      setLastActiveGroup("other");
    }
  }, [
    activeModule,
    isFinanceActive,
    isHostelActive,
    isTransportActive,
    isUniformActive,
    isStaffActive,
    isAcademicsActive,
    lastActiveGroup,
  ]);

  const pendingAdmissions = admissions.filter(
    (a) => a.status === "Pending",
  ).length;

  const financeSubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? []
      : [
          {
            id: "finance-dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "finance-fee-collection",
            label: "Fee Collection",
            icon: IndianRupee,
          },
          {
            id: "finance-masters",
            label: "Finance Setup",
            icon: SlidersHorizontal,
          },
          {
            id: "finance-transactions",
            label: "Transactions",
            icon: FileSpreadsheet,
          },
          {
            id: "finance-reports",
            label: "Finance Reports",
            icon: FileSpreadsheet,
          },
        ];

  const hostelSubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? []
      : [
          { id: "hostel-dashboard", label: "Dashboard", icon: LayoutDashboard },
          {
            id: "hostel-masters",
            label: "Hostel Master Setup",
            icon: Building2,
          },
          {
            id: "hostel-student-hostel",
            label: "Room Allocation",
            icon: UserPlus,
          },
          {
            id: "hostel-reports",
            label: "Hostel Reports",
            icon: FileSpreadsheet,
          },
        ];

  const transportSubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? []
      : [
          {
            id: "transport-dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "transport-setup",
            label: "Route & Vehicle Setup",
            icon: Route,
          },
          {
            id: "transport-operations",
            label: "Transport Operations",
            icon: Layers,
          },
          { id: "transport-reports", label: "Reports", icon: FileSpreadsheet },
        ];

  const uniformSubItems = [
    { id: "uniform-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "uniform-masters", label: "Uniform Configuration", icon: Shirt },
    {
      id: "uniform-student-uniform",
      label: "Student Uniform Distribution",
      icon: UserPlus,
    },
    { id: "uniform-reports", label: "Uniform Reports", icon: FileSpreadsheet },
  ];

  const librarySubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? [
          { id: "library", label: "Digital Library", icon: Library },
        ]
      : [
          { id: "library", label: "Digital Library", icon: Library },
          { id: "librarian-attendance", label: "Librarian Attendance", icon: CalendarCheck },
          { id: "library-timetable", label: "Library Timetable", icon: Clock },
        ];

  const staffSubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? []
      : role.toLowerCase() === "teacher"
      ? [
          { id: "teacher-profile", label: "My Profile", icon: User },
          {
            id: "staff-attendance",
            label: "My Attendance",
            icon: CalendarCheck,
          },
          { id: "staff-leave", label: "Leave Management", icon: FileText },
          { id: "staff-my-payslips", label: "My Payslips", icon: IndianRupee },
        ]
      : [
          { id: "staff-directory", label: "Staff Directory", icon: Users },
          {
            id: "staff-attendance",
            label: "Staff Attendance",
            icon: CalendarCheck,
          },
          { id: "staff-leave", label: "Leave Management", icon: FileText },
          { id: "staff-payroll", label: "Payroll", icon: IndianRupee },
        ];

  const academicSubItems =
    role.toLowerCase() === "parent" || role.toLowerCase() === "student"
      ? []
      : [
          { id: "academic-dashboard", label: "Dashboard", icon: School },
          {
            id: "academic-class",
            label: "Class Management",
            icon: Presentation,
          },
          { id: "subjects", label: "Subject Management", icon: BookOpen },
          { id: "timetable", label: "Time Table", icon: Clock },
        ];

  const transportSetupModules = [
    "transport-setup",
    "transport-masters",
    "transport-route-management",
    "transport-pickup-points",
    "transport-vehicle-management",
    "transport-driver-management",
    "transport-bus-attendants",
    "transport-routes",
    "transport-pickups",
    "transport-vehicles",
    "transport-drivers",
    "transport-attendants",
  ];
  const transportOperationsModules = [
    "transport-operations",
    "transport-vehicle-assignment",
    "transport-trip-scheduling",
    "transport-student-transport-assignment",
    "transport-gps-tracking",
    "transport-maintenance",
    "transport-trips",
    "transport-student-assignment",
    "transport-assignment",
    "transport-vehicle-trips",
    "transport-gps",
    "transport-vehicle-maintenance",
  ];
  const transportReportModules = [
    "transport-reports",
    "transport-dashboard-report",
    "transport-trip-reports",
    "transport-vehicle-reports",
    "transport-driver-reports",
    "transport-route-reports",
    "transport-student-transport-reports",
    "transport-maintenance-reports",
  ];

  const menuGroups = [
    {
      title: "Core Operations",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        {
          id: "staff",
          label:
            role.toLowerCase() === "parent" || role.toLowerCase() === "student"
              ? "Teachers"
              : "Faculty & Staff",
          icon: Users,
        },
      ],
    },
    {
      title: "Student Management",
      items: [
        { id: "admissions", label: "Admissions", icon: GraduationCap },
        { id: "students", label: "Student Directory", icon: UserCheck },
        { id: "academic-history", label: "Academic History", icon: History },
        { id: "attendance", label: "Student Attendance", icon: CalendarCheck },
        {
          id: "student-promotion",
          label: "Student Promotion",
          icon: TrendingUp,
        },
        {
          id: "certificates",
          label: "Certificates",
          icon: FileCheck,
        },
        { id: "alumni", label: "Alumni", icon: Award },
      ],
    },
    {
      title: "Academics",
      items: [
        { id: "academics", label: "Class Management", icon: Presentation },
        { id: "subjects", label: "Subject Management", icon: BookOpen },
        {
          id: "timetable",
          label:
            role.toLowerCase() === "parent" || role.toLowerCase() === "student"
              ? "Timetable"
              : "Time Table",
          icon: Clock,
        },
        {
          id: "examination",
          label:
            role.toLowerCase() === "parent" || role.toLowerCase() === "student"
              ? "Report Cards"
              : "Examinations",
          icon: Award,
        },
        { id: "homework", label: "Homework", icon: FileText },
      ],
    },
    {
      title: "Finance & Logistics",
      isFinanceSection: true,
      items: [
        { id: "library", label: "Library", icon: Library },
        { id: "librarian-attendance", label: "Librarian Attendance", icon: CalendarCheck },
        { id: "library-timetable", label: "Library Timetable", icon: Clock },
        { id: "inventory", label: "Inventory", icon: Package },
      ],
    },
    {
      title: "School Administration",
      items: [
        { id: "communication", label: "Communication Hub", icon: Megaphone },
        { id: "events", label: "Events & Holidays", icon: Calendar },
        { id: "training", label: "Faculty Training", icon: GraduationCap },
        { id: "reports", label: "School Reports", icon: BarChart3 },
        // { id: 'users', label: 'Roles', icon: ShieldCheck },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasModuleAccess(role, item.id)),
    }))
    .filter((group) => group.items.length > 0 || group.isFinanceSection);

  // Handled above

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-brand-50 dark:bg-brand-950 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-center border-b border-slate-200/80 dark:border-slate-800 px-2`}
      >
        {collapsed ? (
          <div
            className="flex items-center justify-center w-12 h-10 rounded-xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors overflow-hidden p-1"
            onClick={() => setCollapsed(false)}
            title="School Dashboard"
          >
            <img
              src={schoolProfile?.logoUrl || "/pirnav-school-logo.png"}
              alt="School Logo"
              className="max-h-8 max-w-8 object-contain"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-52 h-12 select-none cursor-pointer px-2 py-1 rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-slate-900 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800/80 overflow-hidden"
            onClick={() => setActiveModule("dashboard")}
            title="School Dashboard"
          >
            <img
              src={schoolProfile?.logoUrl || "/pirnav-school-logo.png"}
              alt="School Logo"
              className="max-h-10 max-w-[190px] object-contain"
            />
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(
            (item: any) => {
              if (item.roles && !item.roles.includes(role || "")) return false;
              if (role.toLowerCase() === "teacher") {
                if (item.id === "examination") {
                  return false;
                }
              }
              if (role.toLowerCase() === "parent") {
                if (item.id === "library" || item.id === "librarian-attendance" || item.id === "library-timetable") {
                  return false;
                }
              }
              if (role.toLowerCase() === "student") {
                if (item.id === "librarian-attendance" || item.id === "library-timetable") {
                  return false;
                }
              }
              return true;
            }
          );

          const hasCustomModules =
            group.isFinanceSection &&
            (hasModuleAccess(role, "fees") ||
              hasModuleAccess(role, "hostel") ||
              hasModuleAccess(role, "transport") ||
              hasModuleAccess(role, "uniforms"));

          if (visibleItems.length === 0 && !hasCustomModules) return null;

          return (
            <div key={idx} className="space-y-1.5">
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}

              {group.isFinanceSection && (
                <>
                  {hasModuleAccess(role, "fees") && (
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          const newExpanded = !financeExpanded;
                          setFinanceExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                          if (!isFinanceActive) {
                            setActiveModule(
                              role.toLowerCase() === "parent" ||
                                role.toLowerCase() === "student"
                                ? "parent-fee-dues"
                                : "finance-dashboard",
                            );
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isFinanceActive
                            ? financeExpanded &&
                              financeSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <IndianRupee
                            className={`w-4 h-4 shrink-0 ${isFinanceActive ? (financeExpanded && financeSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-sky-500"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                                ? "Fee Details"
                                : "Finance & Fees"}
                            </span>
                          )}
                        </div>
                        {!collapsed && financeSubItems.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${financeExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && financeExpanded && (
                        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                          {financeSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "finance-dashboard" &&
                                activeModule === "fees") ||
                              (sub.id === "finance-masters" &&
                                [
                                  "finance-fee-heads",
                                  "finance-fee-structure",
                                  "finance-student-fee-assignment",
                                  "finance-scholarships",
                                  "finance-discounts",
                                  "finance-fine-rules",
                                  "finance-transport-config",
                                  "finance-student-transport",
                                  "finance-hostel-config",
                                  "finance-student-hostel",
                                  "finance-refund-management",
                                  "finance-settings",
                                ].includes(activeModule)) ||
                              (sub.id === "finance-fee-collection" &&
                                [
                                  "finance-fee-collection",
                                  "finance-fee-receipts",
                                  "finance-due-fees",
                                  "fees",
                                ].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "hostel") && isHosteller && (
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          const newExpanded = !hostelExpanded;
                          setHostelExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                          if (!isHostelActive) {
                            setActiveModule(
                              role.toLowerCase() === "parent" ||
                                role.toLowerCase() === "student"
                                ? "parent-hostel-details"
                                : "hostel-dashboard",
                            );
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isHostelActive
                            ? hostelExpanded &&
                              hostelSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Home
                            className={`w-4 h-4 shrink-0 ${isHostelActive ? (hostelExpanded && hostelSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-indigo-500"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                                ? "Hostel"
                                : "Hostel Management"}
                            </span>
                          )}
                        </div>
                        {!collapsed && hostelSubItems.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${hostelExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && hostelExpanded && (
                        <div className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900 ml-3 space-y-0.5 my-1">
                          {hostelSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "hostel-dashboard" &&
                                activeModule === "hostel") ||
                              (sub.id === "hostel-masters" &&
                                [
                                  "hostel-master",
                                  "hostel-room-type",
                                  "hostel-room-master",
                                ].includes(activeModule)) ||
                              (sub.id === "hostel-student-hostel" &&
                                [
                                  "hostel-student-hostel",
                                  "hostel-student-assignment",
                                  "hostel-attendance",
                                ].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "transport") && usesTransport && (
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          const newExpanded = !transportExpanded;
                          setTransportExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setUniformExpanded(false);
                          }
                          if (!isTransportActive) {
                            if (
                              role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                            ) {
                              setActiveModule("parent-bus-info");
                            } else {
                              setActiveModule("transport-dashboard");
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isTransportActive
                            ? transportExpanded &&
                              transportSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Bus
                            className={`w-4 h-4 shrink-0 ${isTransportActive ? (transportExpanded && transportSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-slate-400"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                                ? "Transport"
                                : "Transport Management"}
                            </span>
                          )}
                        </div>
                        {!collapsed && transportSubItems.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${transportExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && transportExpanded && (
                        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                          {transportSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              (sub.id === "transport-dashboard" &&
                                ["transport-dashboard", "transport"].includes(
                                  activeModule,
                                )) ||
                              (sub.id === "transport-setup" &&
                                (activeModule === "transport-setup" ||
                                  transportSetupModules.includes(
                                    activeModule,
                                  ))) ||
                              (sub.id === "transport-operations" &&
                                (activeModule === "transport-operations" ||
                                  transportOperationsModules.includes(
                                    activeModule,
                                  ))) ||
                              (sub.id === "transport-reports" &&
                                (activeModule === "transport-reports" ||
                                  transportReportModules.includes(
                                    activeModule,
                                  )));
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "uniforms") && (
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          const newExpanded = !uniformExpanded;
                          setUniformExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                          }
                          if (!isUniformActive) {
                            setActiveModule("uniform-dashboard");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isUniformActive
                            ? uniformExpanded &&
                              uniformSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Shirt
                            className={`w-4 h-4 shrink-0 ${isUniformActive ? (uniformExpanded && uniformSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-slate-400"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              Uniform Management
                            </span>
                          )}
                        </div>
                        {!collapsed && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${uniformExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && uniformExpanded && (
                        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                          {uniformSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "uniform-dashboard" &&
                                activeModule === "uniforms") ||
                              (sub.id === "uniform-masters" &&
                                [
                                  "uniform-master",
                                  "uniform-categories",
                                  "uniform-sizes",
                                  "uniform-suppliers",
                                  "uniform-inventory",
                                ].includes(activeModule)) ||
                              (sub.id === "uniform-student-uniform" &&
                                [
                                  "uniform-student-uniform",
                                  "uniform-issues",
                                ].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {(role.toLowerCase() === "admin" ||
                    role.toLowerCase() === "super admin" ||
                    role.toLowerCase() === "principal") &&
                    hasModuleAccess(role, "library") && (
                    <div className="space-y-1 pt-1">
                      <button
                        onClick={() => {
                          const newExpanded = !libraryExpanded;
                          setLibraryExpanded(newExpanded);
                          if (newExpanded) {
                            setStaffExpanded(false);
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                            setAcademicsExpanded(false);
                          }
                          if (!isLibraryActive) {
                            setActiveModule("library");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isLibraryActive
                            ? libraryExpanded &&
                              librarySubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Library
                            className={`w-4 h-4 shrink-0 ${isLibraryActive ? (libraryExpanded && librarySubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-slate-400"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              Library Management
                            </span>
                          )}
                        </div>
                        {!collapsed && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${libraryExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && libraryExpanded && (
                        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-0.5 my-1">
                          {librarySubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive = activeModule === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {visibleItems.map((item) => {
                if (
                  (item.id === "subjects" || item.id === "timetable") &&
                  (role.toLowerCase() === "admin" ||
                    role.toLowerCase() === "super admin" ||
                    role.toLowerCase() === "principal")
                ) {
                  return null;
                }

                if (
                  (item.id === "library" || item.id === "librarian-attendance" || item.id === "library-timetable") &&
                  (role.toLowerCase() === "admin" ||
                    role.toLowerCase() === "super admin" ||
                    role.toLowerCase() === "principal")
                ) {
                  return null;
                }

                if (
                  item.id === "academics" &&
                  (role.toLowerCase() === "admin" ||
                    role.toLowerCase() === "super admin" ||
                    role.toLowerCase() === "principal")
                ) {
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          const newExpanded = !academicsExpanded;
                          setAcademicsExpanded(newExpanded);
                          if (newExpanded) {
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                            setStaffExpanded(false);
                          }
                          if (!isAcademicsActive) {
                            setActiveModule("academic-dashboard");
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isAcademicsActive
                            ? academicsExpanded &&
                              academicSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Presentation
                            className={`w-4 h-4 shrink-0 ${isAcademicsActive ? (academicsExpanded && academicSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-sky-500"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              Academic Management
                            </span>
                          )}
                        </div>
                        {!collapsed && academicSubItems.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${academicsExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && academicsExpanded && (
                        <div className="pl-3 border-l-2 border-sky-200 dark:border-sky-950 ml-3 space-y-0.5 my-1">
                          {academicSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "academic-class" &&
                                activeModule === "academics");
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === "staff" && hasModuleAccess(role, "staff")) {
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          const newExpanded = !staffExpanded;
                          setStaffExpanded(newExpanded);
                          if (newExpanded) {
                            setFinanceExpanded(false);
                            setHostelExpanded(false);
                            setTransportExpanded(false);
                            setUniformExpanded(false);
                          }
                          if (!isStaffActive) {
                            if (
                              role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                            ) {
                              setActiveModule("parent-teacher-info");
                            } else if (role.toLowerCase() === "teacher") {
                              setActiveModule("teacher-profile");
                            } else {
                              setActiveModule("staff-directory");
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isStaffActive
                            ? staffExpanded &&
                              staffSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Users
                            className={`w-4 h-4 shrink-0 ${isStaffActive ? (staffExpanded && staffSubItems.length > 0 && !collapsed ? "text-sky-600 dark:text-sky-400" : "text-white") : "text-sky-500"}`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                                ? "Teachers"
                                : "Faculty & Staff"}
                            </span>
                          )}
                        </div>
                        {!collapsed && staffSubItems.length > 0 && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${staffExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </button>

                      {!collapsed && staffExpanded && (
                        <div className="pl-3 border-l-2 border-sky-200 dark:border-sky-950 ml-3 space-y-0.5 my-1">
                          {staffSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isPayroll = sub.id === "staff-payroll";
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "teacher-profile" &&
                                [
                                  "teacher-profile",
                                  "staff-teachers",
                                  "staff",
                                ].includes(activeModule)) ||
                              (sub.id === "staff-directory" &&
                                [
                                  "staff-add",
                                  "staff-teachers",
                                  "staff",
                                  "staff-directory",
                                ].includes(activeModule)) ||
                              (isPayroll &&
                                (activeModule === "staff-payroll" ||
                                  activeModule.startsWith("staff-payroll-")));
                            return (
                              <button
                                key={sub.id}
                                onClick={() => setActiveModule(sub.id)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  isSubActive
                                    ? "bg-sky-600 text-white font-bold"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400"}`}
                                />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                const isActive =
                  activeModule === item.id ||
                  (item.id === "admissions" &&
                    activeModule === "admissions-add");

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveModule(item.id);
                      setStaffExpanded(false);
                      setFinanceExpanded(false);
                      setHostelExpanded(false);
                      setTransportExpanded(false);
                      setUniformExpanded(false);
                      setAcademicsExpanded(false);
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? "bg-sky-600 text-white shadow-md shadow-sky-500/20 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!collapsed && (item as any).badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                        }`}
                      >
                        {(item as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
