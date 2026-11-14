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
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { hasModuleAccess } from "../../utils/rbac";
import { resolveMediaUrl } from "../../utils/mediaUtils";

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
  const authCtx = useAuth() || {};
  const role = authCtx.role || 'admin';
  const user = authCtx.user;
  const safeRole = (role || user?.role || '').toLowerCase();
  const dataCtx = useData() || {};
  const schoolProfile = dataCtx.schoolProfile;
  const admissions = Array.isArray(dataCtx.admissions) ? dataCtx.admissions : [];
  const students = Array.isArray(dataCtx.students) ? dataCtx.students : [];
  const studentHostels = Array.isArray(dataCtx.studentHostels) ? dataCtx.studentHostels : [];
  const studentTransports = Array.isArray(dataCtx.studentTransports) ? dataCtx.studentTransports : [];
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string>(() => {
    return (
      schoolProfile?.logoUrl ||
      localStorage.getItem("school_logo") ||
      localStorage.getItem("logoUrl") ||
      localStorage.getItem("schoolLogo") ||
      ""
    );
  });
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [logoMeta, setLogoMeta] = useState<{ width: number; height: number; ratio: number } | null>(null);

  React.useEffect(() => {
    const updateLogo = () => {
      const activeLogo =
        schoolProfile?.logoUrl ||
        localStorage.getItem("school_logo") ||
        localStorage.getItem("logoUrl") ||
        localStorage.getItem("schoolLogo") ||
        "";
      setCurrentLogoUrl(activeLogo);
      setLogoLoadError(false);
    };

    updateLogo();

    window.addEventListener("school_profile_updated", updateLogo);
    window.addEventListener("storage", updateLogo);
    return () => {
      window.removeEventListener("school_profile_updated", updateLogo);
      window.removeEventListener("storage", updateLogo);
    };
  }, [schoolProfile?.logoUrl]);

  const handleSidebarLogoLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setLogoMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight,
      });
    }
  };

  const handleSidebarLogoError = () => {
    setLogoLoadError(true);
  };

  let isHosteller = true;
  let usesTransport = true;

  if (safeRole === "student" || safeRole === "parent") {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const rawUserPhone = String(user?.phone || (user as any)?.mobileNumber || '').trim();
    const userPhone = rawUserPhone.replace(/\D/g, '');
    const userId = String(user?.id || '').trim().toLowerCase();
    const userAdm = String((user as any)?.admissionNo || (user as any)?.admissionNumber || (user as any)?.admNo || '').trim().toLowerCase();
    const userRoll = String((user as any)?.rollNo || (user as any)?.rollNumber || (user as any)?.empId || '').trim().toLowerCase();
    const userStudentId = String((user as any)?.studentId || '').trim().toLowerCase();
    const rawUserName = (user?.name || (user as any)?.fullName || (user as any)?.studentName || '').trim().toLowerCase();
    const isNameReal = rawUserName && !['student', 'user', 'demo', 'test', 'admin'].includes(rawUserName);

    // 1. Match from students array
    const matchedStudents = (students || []).filter((s: any) => {
      if (!s) return false;
      const stStatus = String(s.status || '').toLowerCase().trim();
      if (stStatus && ['inactive', 'rejected', 'deleted', 'left', 'discontinued'].includes(stStatus)) return false;

      const sId = String(s.id || '').trim().toLowerCase();
      const sAdm = String(s.admissionNo || s.admissionNumber || s.admNo || '').trim().toLowerCase();
      const sRoll = String(s.rollNo || s.rollNumber || s.registrationNo || '').trim().toLowerCase();
      const sStudentId = String(s.studentId || '').trim().toLowerCase();
      const sEmail = String(s.email || s.studentEmail || s.contactEmail || '').trim().toLowerCase();
      const sPhone = String(s.phone || s.mobileNumber || s.contactNumber || '').replace(/\D/g, '');
      const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const sName = String(s.name || s.studentName || '').trim().toLowerCase();

      if (safeRole === "student") {
        if (userAdm && (sAdm === userAdm || sRoll === userAdm)) return true;
        if (userRoll && (sRoll === userRoll || sAdm === userRoll || sStudentId === userRoll)) return true;
        if (userStudentId && (sId === userStudentId || sStudentId === userStudentId)) return true;
        if (userId && (sId === userId || sAdm === userId || sRoll === userId || sStudentId === userId)) return true;
        if (isNameReal && (sFullName === rawUserName || sName === rawUserName || (s.firstName && s.lastName && rawUserName.includes(s.firstName.toLowerCase()) && rawUserName.includes(s.lastName.toLowerCase())))) return true;
        if (userEmail && !userEmail.endsWith('@school.internal') && sEmail === userEmail) return true;
        if (userPhone && userPhone.length >= 7 && sPhone && (sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone))) return true;
        return false;
      } else {
        // Parent
        const fPhone = String(s.fatherPhone || s.fatherMobile || '').replace(/\D/g, '');
        const mPhone = String(s.motherPhone || s.motherMobile || '').replace(/\D/g, '');
        const pPhone = String(s.parentPhone || s.guardianPhone || '').replace(/\D/g, '');

        const fEmail = String(s.fatherEmail || '').trim().toLowerCase();
        const mEmail = String(s.motherEmail || '').trim().toLowerCase();
        const pEmail = String(s.parentEmail || s.guardianEmail || s.contactEmail || '').trim().toLowerCase();

        if (userPhone && userPhone.length >= 7 && (
          (fPhone && (fPhone.endsWith(userPhone) || userPhone.endsWith(fPhone))) ||
          (mPhone && (mPhone.endsWith(userPhone) || userPhone.endsWith(mPhone))) ||
          (pPhone && (pPhone.endsWith(userPhone) || userPhone.endsWith(pPhone))) ||
          (sPhone && (sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone)))
        )) return true;

        if (userEmail && !userEmail.endsWith('@school.internal') && (
          fEmail === userEmail ||
          mEmail === userEmail ||
          pEmail === userEmail ||
          sEmail === userEmail
        )) return true;

        return false;
      }
    });

    // 2. Match from admissions array
    const matchedAdmissions = (admissions || []).filter((a: any) => {
      if (!a) return false;
      const aStatus = String(a.status || '').toLowerCase().trim();
      if (aStatus && ['rejected', 'cancelled', 'deleted'].includes(aStatus)) return false;

      const aId = String(a.id || '').trim().toLowerCase();
      const aAdm = String(a.admissionNo || a.admissionNumber || '').trim().toLowerCase();
      const aReg = String(a.registrationNo || a.applicationNo || '').trim().toLowerCase();
      const aName = String(a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`).trim().toLowerCase();
      const aEmail = String(a.email || a.studentEmail || '').trim().toLowerCase();
      const aPhone = String(a.phone || a.mobileNumber || '').replace(/\D/g, '');

      if (safeRole === "student") {
        if (userAdm && (aAdm === userAdm || aReg === userAdm)) return true;
        if (userRoll && (aReg === userRoll || aAdm === userRoll)) return true;
        if (userStudentId && (aId === userStudentId || aAdm === userStudentId)) return true;
        if (userId && (aId === userId || aAdm === userId || aReg === userId)) return true;
        if (isNameReal && (aName === rawUserName || (a.firstName && a.lastName && rawUserName.includes(a.firstName.toLowerCase()) && rawUserName.includes(a.lastName.toLowerCase())))) return true;
        if (userEmail && !userEmail.endsWith('@school.internal') && aEmail === userEmail) return true;
        if (userPhone && userPhone.length >= 7 && aPhone && (aPhone.endsWith(userPhone) || userPhone.endsWith(aPhone))) return true;
        return false;
      } else {
        // Parent
        const fContact = String(a.fatherContact || a.fatherMobileNo || a.fatherPhone || '').replace(/\D/g, '');
        const mContact = String(a.motherContact || a.motherMobileNo || a.motherPhone || '').replace(/\D/g, '');
        const pEmail = String(a.parentEmail || a.fatherEmail || a.motherEmail || '').trim().toLowerCase();

        if (userPhone && userPhone.length >= 7 && (
          (fContact && (fContact.endsWith(userPhone) || userPhone.endsWith(fContact))) ||
          (mContact && (mContact.endsWith(userPhone) || userPhone.endsWith(mContact))) ||
          (aPhone && (aPhone.endsWith(userPhone) || userPhone.endsWith(aPhone)))
        )) return true;

        if (userEmail && !userEmail.endsWith('@school.internal') && (
          pEmail === userEmail ||
          aEmail === userEmail
        )) return true;

        return false;
      }
    });

    const studentIds = new Set<string>([
      ...matchedStudents.map((s: any) => String(s.id || s.studentId || '').trim().toLowerCase()),
      ...matchedAdmissions.map((a: any) => String(a.id || '').trim().toLowerCase()),
      ...(userAdm ? [userAdm] : []),
      ...(userStudentId ? [userStudentId] : []),
      ...(userId ? [userId] : [])
    ].filter(Boolean));

    const studentAdmissions = new Set<string>([
      ...matchedStudents.map((s: any) => String(s.admissionNo || s.admissionNumber || '').trim().toLowerCase()),
      ...matchedAdmissions.map((a: any) => String(a.admissionNo || a.admissionNumber || a.registrationNo || '').trim().toLowerCase()),
      ...(userAdm ? [userAdm] : [])
    ].filter(Boolean));

    // Check Hostel Enrollment
    const hasHostelRecord = (studentHostels || []).some((sh: any) => {
      const shStatus = String(sh.status || '').toLowerCase().trim();
      const isActive = !shStatus || shStatus === 'active' || shStatus === 'occupied';
      if (!isActive) return false;
      const shStudentId = String(sh.studentId || '').trim().toLowerCase();
      const shAdmNo = String(sh.admissionNo || '').trim().toLowerCase();
      return (
        (shStudentId && (studentIds.has(shStudentId) || (userAdm && shStudentId === userAdm))) ||
        (shAdmNo && (studentAdmissions.has(shAdmNo) || (userAdm && shAdmNo === userAdm)))
      );
    });

    const isHostelTypeString = (val?: string) => {
      const clean = String(val || '').toLowerCase().trim();
      if (!clean) return false;
      if (clean.includes('non') || clean.includes('day scholar') || clean.includes('dayscholar') || clean.includes('day-scholar')) return false;
      return clean === 'residential' || clean === 'hosteller' || clean === 'hostel' || clean.includes('hostel');
    };

    const hasHostelStudentType = matchedStudents.some((s: any) => {
      return (
        isHostelTypeString(s.studentType) ||
        Boolean(s.isHosteller || s.hostelBlock || s.hostelRoom || s.hostelBed)
      );
    });

    const hasHostelAdmission = matchedAdmissions.some((a: any) => {
      return (
        isHostelTypeString(a.studentType) ||
        Boolean(a.isHosteller || a.hostelBlock || a.hostelRoom || a.hostelBed || a.allocatedBedId)
      );
    });

    const userType = String((user as any)?.studentType || '').toLowerCase().trim();
    const hasHostelUser =
      isHostelTypeString(userType) ||
      Boolean((user as any)?.isHosteller || (user as any)?.hostelBlock);

    isHosteller = hasHostelRecord || hasHostelStudentType || hasHostelAdmission || hasHostelUser;

    // Check Transport Enrollment
    const hasTransportRecord = (studentTransports || []).some((ta: any) => {
      const taStatus = String(ta.status || '').toLowerCase().trim();
      const isActive = !taStatus || taStatus === 'active' || taStatus === 'assigned';
      if (!isActive) return false;
      const taStudentId = String(ta.studentId || '').trim().toLowerCase();
      const taAdmNo = String(ta.admissionNo || '').trim().toLowerCase();
      return (
        (taStudentId && (studentIds.has(taStudentId) || (userAdm && taStudentId === userAdm))) ||
        (taAdmNo && (studentAdmissions.has(taAdmNo) || (userAdm && taAdmNo === userAdm)))
      );
    });

    const hasTransportField = matchedStudents.some((s: any) => {
      const isReq = s.transportRequired === true || String(s.transportRequired).toLowerCase() === 'true' || String(s.transportRequired).toLowerCase() === 'yes';
      const sType = String(s.studentType || '').toLowerCase();
      const typeHasTransport = sType.includes('transport') || sType.includes('bus');
      return (
        isReq ||
        typeHasTransport ||
        Boolean(s.busRoute && s.busRoute.trim()) ||
        Boolean(s.pickupPoint && s.pickupPoint.trim()) ||
        Boolean(s.dropPoint && s.dropPoint.trim()) ||
        Boolean(s.transportRoute || s.route || s.transport || s.busNumber || s.transportOpted || s.transportType || s.routeId)
      );
    });

    const hasTransportAdmission = matchedAdmissions.some((a: any) => {
      const isReq = a.transportRequired === true || String(a.transportRequired).toLowerCase() === 'true' || String(a.transportRequired).toLowerCase() === 'yes';
      return (
        isReq ||
        Boolean(a.busRoute && a.busRoute.trim()) ||
        Boolean(a.pickupPoint && a.pickupPoint.trim()) ||
        Boolean(a.dropPoint && a.dropPoint.trim()) ||
        Boolean(a.transportType && a.transportType.trim())
      );
    });

    const userReq = (user as any)?.transportRequired === true || String((user as any)?.transportRequired).toLowerCase() === 'true';
    const hasTransportUser =
      userReq ||
      Boolean((user as any)?.busRoute) ||
      Boolean((user as any)?.pickupPoint) ||
      Boolean((user as any)?.transport);

    usesTransport = hasTransportRecord || hasTransportField || hasTransportAdmission || hasTransportUser;
  }

  const isFinanceActive =
    activeModule.startsWith("finance-") ||
    activeModule === "fees" ||
    activeModule.startsWith("parent-fee-");
  const isHostelActive =
    activeModule.startsWith("hostel-") ||
    activeModule === "hostel" ||
    activeModule.startsWith("parent-hostel-") ||
    activeModule === "room-allocation" ||
    activeModule === "outpass" ||
    activeModule === "student-hostel";
  const isTransportActive =
    activeModule.startsWith("transport-") ||
    activeModule === "transport" ||
    activeModule.startsWith("parent-bus-") ||
    activeModule.startsWith("parent-transport-");
  const isUniformActive =
    activeModule.startsWith("uniform-") ||
    activeModule === "uniforms" ||
    activeModule === "uniform";
  const isLibraryActive =
    activeModule.startsWith("library") ||
    activeModule === "librarian-attendance";
  const isStaffActive =
    activeModule.startsWith("staff-") ||
    activeModule === "staff" ||
    activeModule === "teacher-profile" ||
    activeModule === "warden-profile" ||
    activeModule.startsWith("driver-") ||
    activeModule.startsWith("teacher-") ||
    activeModule.startsWith("warden-") ||
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

  const navRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isFinanceActive) {
      setFinanceExpanded(true);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    } else if (isHostelActive) {
      setHostelExpanded(true);
      setFinanceExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    } else if (isTransportActive) {
      setTransportExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    } else if (isUniformActive) {
      setUniformExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    } else if (isLibraryActive) {
      setLibraryExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    } else if (isStaffActive) {
      setStaffExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setAcademicsExpanded(false);
    } else if (isAcademicsActive) {
      setAcademicsExpanded(true);
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
    } else {
      setFinanceExpanded(false);
      setHostelExpanded(false);
      setTransportExpanded(false);
      setUniformExpanded(false);
      setLibraryExpanded(false);
      setStaffExpanded(false);
      setAcademicsExpanded(false);
    }

    const timer = setTimeout(() => {
      if (navRef.current) {
        const activeElem = navRef.current.querySelector<HTMLElement>('[data-active="true"]');
        if (activeElem) {
          activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [
    activeModule,
    isFinanceActive,
    isHostelActive,
    isTransportActive,
    isUniformActive,
    isLibraryActive,
    isStaffActive,
    isAcademicsActive,
  ]);

  const pendingAdmissions = (admissions || []).filter(
    (a) => a?.status === "Pending",
  ).length;

  const financeSubItems =
    safeRole === "parent" || safeRole === "student"
      ? []
      : [
          {
            id: "finance-dashboard",
            label: "Finance Dashboard",
            icon: LayoutDashboard,
          },
          {
            id: "finance-fee-setup",
            label: "Fee Setup",
            icon: SlidersHorizontal,
          },
          {
            id: "finance-student-fees",
            label: "Student Fees",
            icon: Users,
          },
          {
            id: "finance-fee-collection",
            label: "Fee Collection",
            icon: IndianRupee,
          },
          {
            id: "finance-concessions",
            label: "Concessions",
            icon: Percent,
          },
          {
            id: "finance-ledger",
            label: "Finance Ledger",
            icon: FileSpreadsheet,
          },
          {
            id: "finance-reports",
            label: "Finance Reports",
            icon: FileText,
          },
        ];

  const hostelSubItems =
    safeRole === "parent" || safeRole === "student"
      ? []
      : safeRole.includes("warden")
      ? [
          { id: "hostel-dashboard", label: "Dashboard", icon: LayoutDashboard },
          {
            id: "hostel-masters",
            label: "Hostel Blocks & Rooms",
            icon: Building2,
          },
          {
            id: "hostel-student-hostel",
            label: "Student Management",
            icon: UserPlus,
          },
          {
            id: "hostel-reports",
            label: "Hostel Reports",
            icon: FileSpreadsheet,
          },
        ]
      : [
          { id: "hostel-dashboard", label: "Dashboard", icon: LayoutDashboard },
          {
            id: "hostel-masters",
            label: "Hostel Master Setup",
            icon: Building2,
          },
          {
            id: "hostel-student-hostel",
            label: "Student Management",
            icon: UserPlus,
          },
          {
            id: "hostel-reports",
            label: "Hostel Reports",
            icon: FileSpreadsheet,
          },
        ];

  const transportSubItems =
    safeRole === "parent" || safeRole === "student" || safeRole === "driver"
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
      label: "Uniform Distribution",
      icon: UserPlus,
    },
    { id: "uniform-reports", label: "Uniform Reports", icon: FileSpreadsheet },
  ];

  const librarySubItems =
    safeRole === "parent" || safeRole === "student"
      ? [
          { id: "library", label: "Digital Library", icon: Library },
        ]
      : safeRole.includes("librarian")
      ? [
          { id: "library", label: "Digital Library", icon: Library },
          { id: "librarian-attendance", label: "Librarian Attendance", icon: CalendarCheck },
          { id: "library-timetable", label: "Library Timetable", icon: Clock },
        ]
      : [
          { id: "library", label: "Digital Library", icon: Library },
          { id: "library-timetable", label: "Library Timetable", icon: Clock },
        ];

  const staffSubItems =
    safeRole === "parent" || safeRole === "student"
      ? []
      : safeRole === "teacher" || safeRole.includes("warden") || safeRole.includes("accountant") || safeRole === "finance" || safeRole.includes("librarian") || safeRole === "driver"
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
          { id: "staff-letters", label: "Offer & Relieving", icon: FileText },
          {
            id: "staff-attendance",
            label: "Staff Attendance",
            icon: CalendarCheck,
          },
          { id: "staff-leave", label: "Leave Management", icon: FileText },
          { id: "staff-payroll", label: "Payroll", icon: IndianRupee },
        ];

  const academicSubItems =
    safeRole === "parent" || safeRole === "student"
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
            safeRole === "parent" || safeRole === "student"
              ? "Teachers"
              : ["teacher", "driver", "warden", "librarian", "accountant", "staff"].some((r) =>
                  safeRole.includes(r)
                ) &&
                !safeRole.includes("admin") &&
                !safeRole.includes("principal")
              ? "My Details"
              : "Faculty & Staff",
          icon: Users,
        },
      ],
    },
    {
      title: "Student Management",
      items: [
        { id: "admissions", label: "Admissions", icon: GraduationCap },
        { id: "students", label: safeRole.includes('warden') ? "Students" : "Student Directory", icon: UserCheck },
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
            safeRole === "parent" || safeRole === "student"
              ? "Timetable"
              : "Time Table",
          icon: Clock,
        },
        {
          id: "examination",
          label: "Examinations",
          icon: Award,
        },
        {
          id: "marks-entry",
          label: "Marks Entry",
          icon: Award,
        },
        {
          id: "report-cards",
          label: "Report Cards",
          icon: ClipboardList,
        },
        { id: "homework", label: "Homework", icon: FileText },
      ],
    },
    {
      title: "Finance & Logistics",
      isFinanceSection: true,
      items: [
        { id: "library", label: "Library", icon: Library },
        { id: "library-timetable", label: "Library Timetable", icon: Clock },
        { id: "inventory", label: "Inventory", icon: Package },
      ],
    },
    {
      title: "School Administration",
      items: [
        ...(safeRole.includes('librarian') ? [] : [
          { id: "training", label: "Faculty Training", icon: GraduationCap }
        ]),
        { id: "communication", label: "Communication Hub", icon: Megaphone },
        { id: "events", label: "Events & Holidays", icon: Calendar },
        { id: "reports", label: "School Reports", icon: BarChart3 },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasModuleAccess(role || '', item.id)),
    }))
    .filter((group) => group.items.length > 0 || group.isFinanceSection);

  // Handled above

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-brand-50/90 dark:bg-brand-950/90 backdrop-blur-2xl border-r border-brand-200/60 dark:border-brand-800/40 flex flex-col transition-all duration-300 shadow-xs ${
        collapsed ? "w-20" : "w-56"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-center border-b border-brand-200/60 dark:border-brand-800/40 px-2`}
      >
        {collapsed ? (
          <div
            className="flex items-center justify-center w-11 h-11 rounded-2xl btn-glass-secondary cursor-pointer overflow-hidden p-1 active:scale-95 transition-all"
            onClick={() => setCollapsed(false)}
            title={schoolProfile?.name || "School Dashboard"}
          >
            {currentLogoUrl && !logoLoadError ? (
              <img
                src={resolveMediaUrl(currentLogoUrl)}
                alt=""
                onError={handleSidebarLogoError}
                onLoad={handleSidebarLogoLoad}
                className="max-h-8 max-w-8 object-contain"
              />
            ) : (
              <School className="w-5 h-5 text-sky-600 dark:text-sky-400 stroke-[2.2]" />
            )}
          </div>
        ) : (
          <div
            className={`flex items-center justify-center select-none cursor-pointer btn-glass-secondary transition-all overflow-hidden active:scale-98 ${
              logoMeta && Math.abs(logoMeta.ratio - 1) < 0.3
                ? "w-12 h-12 rounded-2xl p-1.5 shrink-0"
                : "h-12 w-auto max-w-[190px] px-3 py-1 rounded-2xl shrink-0"
            }`}
            onClick={() => setActiveModule("dashboard")}
            title={schoolProfile?.name || "School Dashboard"}
          >
            {currentLogoUrl && !logoLoadError ? (
              <img
                src={resolveMediaUrl(currentLogoUrl)}
                alt=""
                onError={handleSidebarLogoError}
                onLoad={handleSidebarLogoLoad}
                className={`object-contain ${
                  logoMeta && Math.abs(logoMeta.ratio - 1) < 0.3
                    ? "max-h-9 max-w-9"
                    : "max-h-10 max-w-full w-auto"
                }`}
              />
            ) : (
              <div className="flex items-center gap-2 px-2">
                <School className="w-6 h-6 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-white truncate max-w-[145px]">
                  {schoolProfile?.name || "School Portal"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <div
        ref={navRef}
        className={`flex-1 overflow-y-auto py-4 space-y-6 no-scrollbar ${
          collapsed ? "px-0 w-full flex flex-col items-center" : "px-3"
        }`}
      >
        {menuGroups.map((group, idx) => {
          const visibleItems = group.items.filter(
            (item: any) => {
              if (item.roles && !item.roles.includes(role || "")) return false;
              if (item.id === "marks-entry" && safeRole !== "teacher") {
                return false;
              }
              if (safeRole === "teacher") {
                if (item.id === "examination") {
                  return false;
                }
              }
              if (safeRole === "parent") {
                if (item.id === "library" || item.id === "librarian-attendance" || item.id === "library-timetable") {
                  return false;
                }
              }
              if (safeRole === "student") {
                if (item.id === "librarian-attendance" || item.id === "library-timetable") {
                  return false;
                }
              }
              if (safeRole.includes("librarian")) {
                if (item.id === "librarian-attendance") {
                  return false;
                }
              }
              return true;
            }
          );

          const hasCustomModules =
            group.isFinanceSection &&
            (hasModuleAccess(role || '', "fees") ||
              (hasModuleAccess(role || '', "hostel") && isHosteller) ||
              (hasModuleAccess(role || '', "transport") && usesTransport) ||
              hasModuleAccess(role || '', "uniforms"));

          if (visibleItems.length === 0 && !hasCustomModules) return null;

          return (
            <div
              key={idx}
              className={`space-y-1.5 ${
                collapsed ? "w-full flex flex-col items-center" : ""
              }`}
            >
              {!collapsed && (
                <h3 className="px-3 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}

              {group.isFinanceSection && (
                <>
                  {hasModuleAccess(role, "fees") && (
                    <div
                      className={`space-y-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                        title={
                          collapsed
                            ? role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                              ? "Fee Details"
                              : "Finance & Fees"
                            : undefined
                        }
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isFinanceActive
                            ? financeExpanded &&
                              financeSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <IndianRupee
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isFinanceActive
                                ? financeExpanded &&
                                  financeSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-sky-500"
                            }`}
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {financeSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "finance-student-fees" &&
                                [
                                  "finance-student-fees",
                                  "finance-student-assignment",
                                  "finance-student-fee-assignment",
                                  "finance-due-fees",
                                  "finance-due",
                                  "finance-dues",
                                  "finance-student-ledger",
                                ].includes(activeModule)) ||
                              (sub.id === "finance-fee-collection" &&
                                [
                                  "finance-fee-collection",
                                  "finance-fee-receipts",
                                  "finance-promoted-dues",
                                  "fees",
                                ].includes(activeModule)) ||
                              (sub.id === "finance-masters" &&
                                [
                                  "finance-masters",
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
                              ((sub.id === "finance-ledger" || sub.id === "finance-transactions") &&
                                [
                                  "finance-transactions",
                                  "finance-ledger",
                                  "finance-master-ledger",
                                ].includes(activeModule)) ||
                              (sub.id === "finance-reports" &&
                                [
                                  "finance-reports",
                                ].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "hostel") && isHosteller && (
                    <div
                      className={`space-y-1 pt-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                          if (
                            role.toLowerCase() === "parent" ||
                            role.toLowerCase() === "student"
                          ) {
                            setActiveModule("parent-hostel-details");
                          } else if (!isHostelActive) {
                            setActiveModule("hostel-dashboard");
                          }
                        }}
                        title={
                          collapsed
                            ? role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                              ? "Hostel"
                              : "Hostel Management"
                            : undefined
                        }
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isHostelActive
                            ? hostelExpanded &&
                              hostelSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Home
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isHostelActive
                                ? hostelExpanded &&
                                  hostelSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-indigo-500"
                            }`}
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {hostelSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "hostel-dashboard" &&
                                ["hostel-dashboard", "hostel"].includes(activeModule)) ||
                              (sub.id === "hostel-masters" &&
                                [
                                  "hostel-masters",
                                  "hostel-master",
                                  "hostel-blocks",
                                  "hostel-room-type",
                                  "hostel-room-master",
                                  "hostel-rooms",
                                  "hostel-wardens",
                                ].includes(activeModule)) ||
                              (sub.id === "hostel-student-hostel" &&
                                [
                                  "hostel-student-hostel",
                                  "hostel-student-assignment",
                                  "hostel-attendance",
                                  "hostel-outpass",
                                  "hostel-outpass-leave",
                                  "hostel-leave",
                                  "hostel-room-allocation",
                                  "hostel-room-allocations",
                                  "hostel-allocation",
                                  "hostel-allocations",
                                  "hostel-student-room-allocation",
                                  "room-allocation",
                                  "outpass",
                                  "student-hostel",
                                ].includes(activeModule)) ||
                              (sub.id === "hostel-reports" &&
                                ["hostel-reports"].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "transport") && usesTransport && (
                    <div
                      className={`space-y-1 pt-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                          if (
                            role.toLowerCase() === "parent" ||
                            role.toLowerCase() === "student"
                          ) {
                            setActiveModule("parent-bus-info");
                          } else if (!isTransportActive) {
                            if (role.toLowerCase() === "driver") {
                              setActiveModule("transport");
                            } else {
                              setActiveModule("transport-dashboard");
                            }
                          }
                        }}
                        title={
                          collapsed
                            ? role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                              ? "Transport"
                              : role.toLowerCase() === "driver"
                              ? "My Bus & Route"
                              : "Transport Management"
                            : undefined
                        }
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isTransportActive
                            ? transportExpanded &&
                              transportSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Bus
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isTransportActive
                                ? transportExpanded &&
                                  transportSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-slate-400"
                            }`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {role.toLowerCase() === "parent" ||
                              role.toLowerCase() === "student"
                                ? "Transport"
                                : role.toLowerCase() === "driver"
                                ? "My Bus & Route"
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
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
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {hasModuleAccess(role, "uniforms") && (
                    <div
                      className={`space-y-1 pt-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                        title={collapsed ? "Uniform Management" : undefined}
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isUniformActive
                            ? uniformExpanded &&
                              uniformSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Shirt
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isUniformActive
                                ? uniformExpanded &&
                                  uniformSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-slate-400"
                            }`}
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {uniformSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "uniform-dashboard" &&
                                ["uniform-dashboard", "uniforms", "uniform"].includes(activeModule)) ||
                              (sub.id === "uniform-masters" &&
                                [
                                  "uniform-masters",
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
                                  "uniform-distribution",
                                ].includes(activeModule)) ||
                              (sub.id === "uniform-reports" &&
                                ["uniform-reports"].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
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
                    <div
                      className={`space-y-1 pt-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                        title={collapsed ? "Library Management" : undefined}
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isLibraryActive
                            ? libraryExpanded &&
                              librarySubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Library
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isLibraryActive
                                ? libraryExpanded &&
                                  librarySubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-slate-400"
                            }`}
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {librarySubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "library" &&
                                [
                                  "library",
                                  "library-books",
                                  "library-issue",
                                  "library-return",
                                  "library-fines",
                                  "digital-library",
                                ].includes(activeModule)) ||
                              (sub.id === "librarian-attendance" &&
                                ["librarian-attendance", "library-attendance"].includes(activeModule)) ||
                              (sub.id === "library-timetable" &&
                                ["library-timetable"].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
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
                  (safeRole === "admin" ||
                    safeRole === "super admin" ||
                    safeRole === "principal")
                ) {
                  return null;
                }

                if (
                  (item.id === "library" || item.id === "librarian-attendance" || item.id === "library-timetable") &&
                  (safeRole === "admin" ||
                    safeRole === "super admin" ||
                    safeRole === "principal")
                ) {
                  return null;
                }

                if (
                  item.id === "academics" &&
                  (safeRole === "admin" ||
                    safeRole === "super admin" ||
                    safeRole === "principal")
                ) {
                  return (
                    <div
                      key={item.id}
                      className={`space-y-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                        title={collapsed ? "Academic Management" : undefined}
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isAcademicsActive
                            ? academicsExpanded &&
                              academicSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Presentation
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isAcademicsActive
                                ? academicsExpanded &&
                                  academicSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-sky-500"
                            }`}
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {academicSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isSubActive =
                              activeModule === sub.id ||
                              (sub.id === "academic-dashboard" &&
                                ["academic-dashboard", "academics"].includes(activeModule)) ||
                              (sub.id === "academic-class" &&
                                [
                                  "academic-class",
                                  "academic-sections",
                                  "academic-settings",
                                  "academic-year",
                                  "academic-mapping",
                                  "academic-class-teacher",
                                  "academic-subject-teacher",
                                  "academic-student-assignment",
                                  "academic-publish",
                                ].includes(activeModule)) ||
                              (sub.id === "subjects" &&
                                ["subjects", "academic-subjects"].includes(activeModule)) ||
                              (sub.id === "timetable" &&
                                ["timetable", "academic-timetable"].includes(activeModule));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (item.id === "staff" && hasModuleAccess(role || '', "staff")) {
                  return (
                    <div
                      key={item.id}
                      className={`space-y-1 ${
                        collapsed ? "w-full flex flex-col items-center" : ""
                      }`}
                    >
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
                              safeRole === "parent" ||
                              safeRole === "student"
                            ) {
                              setActiveModule("parent-teacher-info");
                            } else if (
                              safeRole === "teacher" ||
                              safeRole.includes("warden") ||
                              safeRole.includes("librarian") ||
                              safeRole.includes("accountant") ||
                              safeRole === "finance" ||
                              safeRole === "driver"
                            ) {
                              setActiveModule("teacher-profile");
                            } else {
                              setActiveModule("staff-directory");
                            }
                          }
                        }}
                        title={
                          collapsed
                            ? safeRole === "parent" ||
                              safeRole === "student"
                              ? "Teachers"
                              : ["teacher", "driver", "warden", "librarian", "accountant", "staff"].some((r) =>
                                  safeRole.includes(r)
                                ) &&
                                !safeRole.includes("admin") &&
                                !safeRole.includes("principal")
                              ? "My Details"
                              : "Faculty & Staff"
                            : undefined
                        }
                        className={`flex items-center transition-all ${
                          collapsed
                            ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                            : "w-full justify-between px-3 py-2 rounded-xl text-xs"
                        } ${
                          isStaffActive
                            ? staffExpanded &&
                              staffSubItems.length > 0 &&
                              !collapsed
                              ? "text-sky-700 dark:text-sky-400 font-bold"
                              : "btn-glass-primary font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                        }`}
                      >
                        <div
                          className={`flex items-center ${
                            collapsed
                              ? "justify-center w-full h-full"
                              : "gap-3 truncate"
                          }`}
                        >
                          <Users
                            className={`${
                              collapsed ? "w-5 h-5" : "w-4 h-4"
                            } shrink-0 ${
                              isStaffActive
                                ? staffExpanded &&
                                  staffSubItems.length > 0 &&
                                  !collapsed
                                  ? "text-sky-600 dark:text-sky-400"
                                  : "text-white"
                                : "text-sky-500"
                            }`}
                          />
                          {!collapsed && (
                            <span className="font-bold">
                              {safeRole === "parent" ||
                              safeRole === "student"
                                ? "Teachers"
                                : ["teacher", "driver", "warden", "librarian", "accountant", "staff"].some((r) =>
                                    safeRole.includes(r)
                                  ) &&
                                  !safeRole.includes("admin") &&
                                  !safeRole.includes("principal")
                                ? "My Details"
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
                        <div className="pl-3 border-l-2 border-[var(--primary-color)]/35 dark:border-[var(--primary-color)]/40 ml-3 space-y-0.5 my-1 animate-rollout origin-top">
                          {staffSubItems.map((sub) => {
                            const SubIcon = sub.icon;
                            const isPayroll = sub.id === "staff-payroll";
                            const isSubActive =
                              activeModule === sub.id ||
                              ((sub.id === "teacher-profile" || sub.id === "warden-profile" || sub.id === "driver-profile") &&
                                [
                                  "teacher-profile",
                                  "warden-profile",
                                  "driver-profile",
                                  "teacher-my-profile",
                                  "staff-teachers",
                                  "staff",
                                ].includes(activeModule)) ||
                              (sub.id === "staff-directory" &&
                                [
                                  "staff-add",
                                  "staff-teachers",
                                  "staff",
                                  "staff-directory",
                                  "staff-non-teaching",
                                ].includes(activeModule)) ||
                              ((sub.id === "staff-attendance" || sub.id === "librarian-attendance" || sub.id === "driver-attendance") &&
                                ["staff-attendance", "attendance-staff", "librarian-attendance", "library-attendance", "driver-attendance"].includes(activeModule)) ||
                              ((sub.id === "staff-leave" || sub.id === "driver-leave") &&
                                ["staff-leave", "leave-management", "driver-leave"].includes(activeModule)) ||
                              ((sub.id === "staff-my-payslips" || sub.id === "driver-payslips") &&
                                ["staff-my-payslips", "teacher-payslips", "driver-payslips"].includes(activeModule)) ||
                              (isPayroll &&
                                (activeModule === "staff-payroll" ||
                                  activeModule.startsWith("staff-payroll-") ||
                                  activeModule === "payroll"));
                            return (
                              <button
                                key={sub.id}
                                data-active={isSubActive ? "true" : undefined}
                                onClick={() => setActiveModule(sub.id)}
                                title={sub.label}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                  isSubActive
                                    ? "btn-glass-primary font-bold shadow-xs"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                <SubIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`}
                                />
                                <span className="truncate text-left">{sub.label}</span>
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
                  (item.id === "dashboard" && activeModule === "dashboard") ||
                  (item.id === "admissions" && ["admissions", "admissions-add"].includes(activeModule)) ||
                  (item.id === "students" && ["students", "student-directory"].includes(activeModule)) ||
                  (item.id === "certificates" && ["certificates", "transfer-certificates"].includes(activeModule)) ||
                  (item.id === "student-promotion" && activeModule === "student-promotion") ||
                  (item.id === "alumni" && activeModule === "alumni") ||
                  (item.id === "attendance" && activeModule === "attendance") ||
                  (item.id === "examination" && ["examination", "exam-results", "marks-entry"].includes(activeModule)) ||
                  (item.id === "report-cards" && ["report-cards", "examination-report-cards"].includes(activeModule)) ||
                  (item.id === "homework" && activeModule === "homework") ||
                  (item.id === "inventory" && activeModule === "inventory") ||
                  (item.id === "communication" && activeModule === "communication") ||
                  (item.id === "events" && activeModule === "events") ||
                  (item.id === "training" && activeModule === "training") ||
                  (item.id === "reports" && activeModule === "reports") ||
                  (item.id === "users" && ["users", "roles"].includes(activeModule)) ||
                  (item.id === "roles" && ["users", "roles"].includes(activeModule)) ||
                  (item.id === "settings" && activeModule === "settings");

                return (
                  <button
                    key={item.id}
                    data-active={isActive ? "true" : undefined}
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
                    className={`flex items-center transition-all active:scale-98 ${
                      collapsed
                        ? "w-11 h-11 p-0 rounded-2xl justify-center mx-auto"
                        : "w-full justify-between px-3 py-2 rounded-2xl text-xs"
                    } ${
                      isActive
                        ? "btn-glass-primary font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        collapsed
                          ? "justify-center w-full h-full"
                          : "gap-3 truncate"
                      }`}
                    >
                      <Icon
                        className={`${
                          collapsed ? "w-5 h-5" : "w-4 h-4"
                        } shrink-0 stroke-[2] ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
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
