// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

import {
  Calendar,
  CalendarCheck,
  Search,
  Filter,
  Save,
  CheckCircle,
  HelpCircle,
  XCircle,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Clock,
  Building2,
  UserCheck,
  ShieldAlert,
  Award,
  FileText,
  ChevronRight,
  Layers,
  SlidersHorizontal,
  UserX,
  Info,
  CheckSquare,
  Square,
  BarChart3,
  Plus,
  LogIn,
  LogOut,
  Loader2,
  Check,
  ChevronLeft,
  Edit,
  RotateCcw,
} from "lucide-react";
import { formatToDDMMYYYY, formatToISO, checkSundayOrHoliday, parseAcademicYearRange, getTargetMonthInAY } from "../../../utils/dateValidation";
import { exportToExcel } from "../../../utils/excelExport";
import { DailyAttendance, Staff } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { DateInput } from "../../common/DateInput";
import { ConfirmModal } from "../../common/ConfirmModal";
import { Pagination } from "../../common/Pagination";
import {
  teacherCheckInApi,
  teacherCheckOutApi,
  fetchTeacherTodayAttendanceApi,
  createAttendanceCorrectionApi,
  fetchAttendanceCorrectionsApi,
} from "../../../api/attendance";

type AttendanceTab = "teaching" | "non-teaching";

export const parseTimeToMinutes = (timeStr?: string | null): number | null => {
  if (!timeStr) return null;
  const s = timeStr.trim();
  if (!s || s === "--:--" || s === "--") return null;

  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hrs = parseInt(ampmMatch[1], 10);
    const mins = parseInt(ampmMatch[2], 10);
    const isPM = ampmMatch[3].toUpperCase() === "PM";
    if (isPM && hrs < 12) hrs += 12;
    if (!isPM && hrs === 12) hrs = 0;
    return hrs * 60 + mins;
  }

  const h24Match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (h24Match) {
    const hrs = parseInt(h24Match[1], 10);
    const mins = parseInt(h24Match[2], 10);
    return hrs * 60 + mins;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes();
  }
  return null;
};

export const StaffAttendanceView: React.FC<{ onNavigate?: (module: string) => void }> = ({ onNavigate }) => {
  const {
    staff = [],
    attendance = [],
    markAttendance,
    leaveApplications = [],
    leaveTypes = [],
    addLeaveApplication,
    holidays = [],
    schoolEvents = [],
    schoolProfile,
    fetchDailyAttendance,
    fetchMonthlyAttendance,
    lastAttendancePayload,
    lastAttendanceResponse,
    driverMasters = [],
    academicYears = [],
  } = useData();
  const { addToast } = useToast();
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();

  const userRole = role?.toLowerCase() || "";
  const canMarkAttendance = [
    "admin",
    "super admin",
    "principal",
    "hr",
    "vice principal",
  ].includes(userRole);
  const canOverrideLeave = ["admin", "super admin", "principal", "hr"].includes(
    userRole,
  );

  const todayStr = new Date().toLocaleDateString('en-CA');

  const getLeaveTypeAllowance = (codeOrName: string): number => {
    const q = codeOrName.toLowerCase();
    const found = (leaveTypes || []).find(t => 
      (t.code && t.code.toLowerCase() === q) || 
      (t.name && t.name.toLowerCase().includes(q))
    );
    return found ? (Number(found.annualAllowance) || Number(found.maxDays) || 0) : 0;
  };

  const defaultCasual = getLeaveTypeAllowance('cl') || getLeaveTypeAllowance('casual');
  const defaultSick = getLeaveTypeAllowance('sl') || getLeaveTypeAllowance('sick');
  const defaultEarned = getLeaveTypeAllowance('pl') || getLeaveTypeAllowance('el') || getLeaveTypeAllowance('earned') || getLeaveTypeAllowance('paid');

  const isPersonalView =
    userRole === "teacher" ||
    userRole === "class-teacher" ||
    userRole === "driver" ||
    !canMarkAttendance;

  // Find logged-in teacher / staff profile from DataContext staff
  const dbTeacher = useMemo(() => {
    const uId = String(user?.id || "").trim();
    const uEmpId = String((user as any)?.empId || (user as any)?.employeeId || "").trim();
    const uEmail = String(user?.email || "").toLowerCase().trim();

    // 1. Strict exact Email matching (highest reliability)
    if (uEmail) {
      const byEmail = (staff || []).find(
        (s) => s.email && s.email.toLowerCase().trim() === uEmail
      );
      if (byEmail) return byEmail;
    }

    // 2. Strict Employee ID or Staff ID matching
    if (uEmpId || uId) {
      const byId = (staff || []).find((s) => {
        const sId = String(s.id || "").trim();
        const sEmpId = String(s.empId || (s as any).employeeId || "").trim();
        return (
          (uEmpId && (sEmpId === uEmpId || sId === uEmpId)) ||
          (uId && (sId === uId || sEmpId === uId))
        );
      });
      if (byId) return byId;
    }

    return null;
  }, [user, staff]);

  // Dynamic Teacher Profile resolution directly from logged in user & staff record
  const teacher = useMemo(() => {
    const rawName = user?.name || "";
    let firstName = dbTeacher?.firstName || "";
    let lastName = dbTeacher?.lastName || "";
    if (!firstName && rawName.trim()) {
      const parts = rawName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    const resolvedEmpId = dbTeacher?.empId || (dbTeacher as any)?.employeeId || (user as any)?.empId || (user as any)?.employeeId || String(dbTeacher?.id || user?.id || "");
    const resolvedDept = dbTeacher?.department || (user as any)?.department || "General Staff";
    const resolvedDesig = dbTeacher?.designation || (user as any)?.designation || "Staff";

    return {
      id: resolvedEmpId || String(user?.id || ""),
      empId: resolvedEmpId || String(user?.id || ""),
      firstName: firstName || "Staff",
      lastName: lastName || "",
      designation: resolvedDesig,
      department: resolvedDept,
      assignedClasses: dbTeacher?.assignedClasses || (user as any)?.assignedClasses || [],
      assignedSubjects: (dbTeacher as any)?.assignedSubjects || (user as any)?.assignedSubjects || [],
      leaveBalance: dbTeacher?.leaveBalance || { casual: defaultCasual, sick: defaultSick, paid: defaultEarned }
    };
  }, [dbTeacher, user, defaultCasual, defaultSick, defaultEarned]);

  // PERSONAL TEACHER ATTENDANCE STATES
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const activeTeacherId = useMemo(() => {
    return teacher?.id || dbTeacher?.id || (user as any)?.empId || user?.id || "";
  }, [teacher, dbTeacher, user]);

  const [persCheckInTime, setPersCheckInTime] = useState<string | null>(null);
  const [persCheckOutTime, setPersCheckOutTime] = useState<string | null>(null);
  const [persIsCheckedOut, setPersIsCheckedOut] = useState<boolean>(false);

  useEffect(() => {
    if (!activeTeacherId && !user?.email) {
      setPersCheckInTime(null);
      setPersCheckOutTime(null);
      setPersIsCheckedOut(false);
      return;
    }

    const uEmail = String(user?.email || "").toLowerCase().trim();
    const uStaffId = String(dbTeacher?.id || "").trim();
    const uEmpId = String(teacher?.empId || dbTeacher?.empId || (user as any)?.empId || "").trim();

    // Sync from DataContext attendance records if present
    const todayRec = (attendance || []).find((r) => {
      const rDate = String(r.date || "").split("T")[0];
      if (rDate !== todayDateStr) return false;
      const isStaff = !r.entityType || r.entityType.toLowerCase() === "staff";
      if (!isStaff) return false;

      const rEntityId = String(r.entityId || "").trim();
      const rStaffId = String((r as any).staffId || "").trim();
      const rEmployeeId = String((r as any).employeeId || "").trim();
      const rEmail = String((r as any).email || "").toLowerCase().trim();

      const isIdMatch =
        (uEmpId && (rEntityId === uEmpId || rStaffId === uEmpId || rEmployeeId === uEmpId)) ||
        (uStaffId && (rEntityId === uStaffId || rStaffId === uStaffId || rEmployeeId === uStaffId)) ||
        (activeTeacherId && (rEntityId === String(activeTeacherId) || rStaffId === String(activeTeacherId) || rEmployeeId === String(activeTeacherId)));

      const isEmailMatch = !!uEmail && !!rEmail && uEmail === rEmail;

      return isIdMatch || isEmailMatch;
    });

    if (todayRec) {
      setPersCheckInTime(todayRec.inTime || null);
      if (todayRec.outTime) {
        setPersCheckOutTime(todayRec.outTime);
        setPersIsCheckedOut(true);
      } else {
        setPersCheckOutTime(null);
        setPersIsCheckedOut(false);
      }
    } else {
      setPersCheckInTime(null);
      setPersCheckOutTime(null);
      setPersIsCheckedOut(false);
    }
  }, [activeTeacherId, dbTeacher, teacher, todayDateStr, attendance, user]);

  const [persWorkingHours, setPersWorkingHours] = useState<string>("0h 0m");
  const [personalFilterDate, setPersonalFilterDate] = useState(todayStr);
  const [personalFilterMonth, setPersonalFilterMonth] = useState("All");
  const [personalSearchQuery, setPersonalSearchQuery] = useState("");
  const [persDateMode, setPersDateMode] = useState<"Daily" | "Monthly" | "Custom Range">("Monthly");
  const [persMonthInputVal, setPersMonthInputVal] = useState<string>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.monthStr;
  });
  const [persRegYear, setPersRegYear] = useState<number>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.year;
  });
  const [persRegMonth, setPersRegMonth] = useState<number>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.month;
  });
  const [persFromDate, setPersFromDate] = useState("");
  const [persToDate, setPersToDate] = useState("");
  const [persPage, setPersPage] = useState<number>(1);
  const [persPageSize, setPersPageSize] = useState<number>(10);

  const persMonthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePersMonthInputChange = (val: string) => {
    setPersMonthInputVal(val);
    if (val) {
      const [yearStr, monthStr] = val.split("-");
      setPersRegYear(parseInt(yearStr, 10));
      setPersRegMonth(parseInt(monthStr, 10) - 1);
      setPersFromDate("");
      setPersToDate("");
    }
  };

  const persRegisterDaysList = useMemo(() => {
    if (persDateMode === "Custom Range" && persFromDate && persToDate) {
      const start = new Date(persFromDate);
      const end = new Date(persToDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const list: { dateStr: string; dayNum: number; displayHeader: string; dayOfWeek: string }[] = [];
        const current = new Date(start);
        const isMultiMonth = start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();
        let guard = 0;
        while (current <= end && guard < 366) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, "0");
          const d = String(current.getDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${d}`;
          const monthShort = current.toLocaleString("en-US", { month: "short" });
          const displayHeader = isMultiMonth ? `${d} ${monthShort}` : `${current.getDate()}`;
          const dayOfWeek = current.toLocaleString("en-US", { weekday: "short" }).toUpperCase();
          list.push({ dateStr, dayNum: current.getDate(), displayHeader, dayOfWeek });
          current.setDate(current.getDate() + 1);
          guard++;
        }
        return list;
      }
    }
    const daysCount = new Date(persRegYear, persRegMonth + 1, 0).getDate();
    const list: { dateStr: string; dayNum: number; displayHeader: string; dayOfWeek: string }[] = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${persRegYear}-${String(persRegMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(persRegYear, persRegMonth, d).toLocaleString("en-US", { weekday: "short" }).toUpperCase();
      list.push({ dateStr, dayNum: d, displayHeader: `${d}`, dayOfWeek });
    }
    return list;
  }, [persDateMode, persRegYear, persRegMonth, persFromDate, persToDate]);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Correction Form state & policy period (last 30 days up to today)
  const CORRECTION_POLICY_DAYS = 30;
  const minCorrectionDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - CORRECTION_POLICY_DAYS);
    return d.toLocaleDateString("en-CA");
  }, []);
  const personalAYRange = useMemo(
    () => parseAcademicYearRange(selectedAcademicYear, academicYears),
    [selectedAcademicYear, academicYears],
  );

  const [correctionDate, setCorrectionDate] = useState("");
  const [correctionDateTouched, setCorrectionDateTouched] = useState(false);
  const [correctionDateBadInput, setCorrectionDateBadInput] = useState(false);
  const [correctionTime, setCorrectionTime] = useState("");
  const [correctionType, setCorrectionType] = useState<
    "Missed Check-In" | "Missed Check-Out" | "Late Login" | "Late Logout" | ""
  >("");
  const [correctionReason, setCorrectionReason] = useState("");

  const sanitizeDateInputYear = (e: React.ChangeEvent<HTMLInputElement>): string => {
    const raw = e.target.value;
    if (!raw) return "";
    const cleaned = raw.replace(/^\+/, "");
    const parts = cleaned.split("-");
    if (parts.length === 3) {
      const [rawY, m, d] = parts;
      const numericYear = parseInt(rawY, 10);
      const yearStr = !isNaN(numericYear) ? String(numericYear) : rawY;
      if (yearStr.length > 4 || rawY.length > 4) {
        const clampedYear = yearStr.slice(0, 4).padStart(4, "0");
        const clamped = `${clampedYear}-${m}-${d}`;
        e.target.value = clamped;
        return clamped;
      }
    }
    return raw;
  };

  const correctionDateError = useMemo(() => {
    if (correctionDateBadInput) {
      return "Invalid date or year entered. Please enter a valid 4-digit year within the attendance correction policy period.";
    }
    if (!correctionDate) {
      return correctionDateTouched ? "Please select a Target Date." : "";
    }
    const cleaned = String(correctionDate).trim().replace(/^\+/, "");
    const parts = cleaned.split("-");
    const rawYear = parts[0] || "";
    const yearNum = parseInt(rawYear, 10);
    const currentYear = new Date().getFullYear();
    const minPolicyYear = parseInt(minCorrectionDateStr.slice(0, 4), 10) || currentYear - 1;
    const validYearRangeLabel =
      minPolicyYear === currentYear ? `${currentYear}` : `${minPolicyYear}–${currentYear}`;

    if (rawYear.length !== 4 || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return `Invalid year (${rawYear || "N/A"}). Please enter a valid 4-digit year (${validYearRangeLabel}).`;
    }
    if (yearNum > currentYear) {
      return `Invalid year (${yearNum}). Future years are not allowed; please select a date in ${validYearRangeLabel}.`;
    }
    if (yearNum < minPolicyYear) {
      return `Invalid year (${yearNum}). Year must be within the attendance correction policy period (${validYearRangeLabel}).`;
    }
    if (cleaned > todayStr) {
      return `Future dates are not allowed. Please select today (${formatToDDMMYYYY(todayStr, "/")}) or an earlier date within the policy period.`;
    }
    if (cleaned < minCorrectionDateStr) {
      return `Selected date is outside the ${CORRECTION_POLICY_DAYS}-day attendance correction policy period (${formatToDDMMYYYY(minCorrectionDateStr, "/")} to ${formatToDDMMYYYY(todayStr, "/")}).`;
    }
    return "";
  }, [correctionDate, correctionDateBadInput, minCorrectionDateStr, todayStr]);

  // Leave Application Form state
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>("");
  const [leaveFromDate, setLeaveFromDate] = useState("");
  const [leaveToDate, setLeaveToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  useEffect(() => {
    if (!selectedLeaveTypeId && leaveTypes && leaveTypes.length > 0) {
      setSelectedLeaveTypeId(String(leaveTypes[0].id));
    }
  }, [leaveTypes, selectedLeaveTypeId]);

  const [leaveBalance, setLeaveBalance] = useState({
    casual: teacher.leaveBalance?.casual ?? defaultCasual,
    sick: teacher.leaveBalance?.sick ?? defaultSick,
    paid: teacher.leaveBalance?.paid ?? defaultEarned,
  });

  useEffect(() => {
    if (teacher?.leaveBalance) {
      setLeaveBalance({
        casual: teacher.leaveBalance.casual ?? defaultCasual,
        sick: teacher.leaveBalance.sick ?? defaultSick,
        paid: teacher.leaveBalance.paid ?? defaultEarned,
      });
    }
  }, [teacher?.leaveBalance, defaultCasual, defaultSick, defaultEarned]);

  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadCorrections = async () => {
      try {
        const res: any = await fetchAttendanceCorrectionsApi();
        if (isMounted && res) {
          const list = Array.isArray(res) ? res : res.data || [];
          setRequests(list);
        }
      } catch (err) {
        console.warn("Failed to load attendance corrections:", err);
      }
    };
    loadCorrections();
    return () => { isMounted = false; };
  }, [activeTeacherId]);

  const formatDisplayTime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "--:--";
    const trimmed = timeStr.trim();
    if (!trimmed || trimmed.toLowerCase().includes("invalid") || trimmed === "null" || trimmed === "undefined") return "--:--";
    
    const timeMatch = trimmed.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/i);
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (timeMatch) {
      return timeMatch[0].trim();
    }
    if (trimmed.includes("T")) {
      const afterT = trimmed.split("T")[1];
      if (afterT && afterT.trim()) {
        const subMatch = afterT.match(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\b/i);
        if (subMatch) return subMatch[0].trim();
      }
    }
    return "--:--";
  };

  const parseTimeToMs = (timeStr: string | null | undefined, baseDateStr?: string): number | null => {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();
    if (!trimmed || trimmed.toLowerCase().includes("invalid") || trimmed === "null" || trimmed === "undefined") return null;

    // 1. Direct Date parsing (ISO string or standard date representation)
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.getTime();

    const refDate = baseDateStr ? new Date(baseDateStr) : new Date();
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const day = refDate.getDate();

    // 2. Parse 12-hour format e.g. "09:51 AM", "9:51:00 PM"
    const twelveHourMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
    if (twelveHourMatch) {
      let hours = parseInt(twelveHourMatch[1], 10);
      const minutes = parseInt(twelveHourMatch[2], 10);
      const seconds = twelveHourMatch[3] ? parseInt(twelveHourMatch[3], 10) : 0;
      const period = twelveHourMatch[4].toUpperCase();

      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return new Date(year, month, day, hours, minutes, seconds).getTime();
    }

    // 3. Parse 24-hour format e.g. "09:51", "09:51:00"
    const twentyFourMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (twentyFourMatch) {
      const hours = parseInt(twentyFourMatch[1], 10);
      const minutes = parseInt(twentyFourMatch[2], 10);
      const seconds = twentyFourMatch[3] ? parseInt(twentyFourMatch[3], 10) : 0;

      return new Date(year, month, day, hours, minutes, seconds).getTime();
    }

    return null;
  };

  useEffect(() => {
    if (!persCheckInTime) {
      setPersWorkingHours("0h 0m");
      return;
    }
    const calcHours = () => {
      const startMs = parseTimeToMs(persCheckInTime, todayStr);
      if (!startMs || startMs <= 0) {
        setPersWorkingHours("0h 0m");
        return;
      }

      let endMs = Date.now();
      if (persIsCheckedOut && persCheckOutTime) {
        const outMs = parseTimeToMs(persCheckOutTime, todayStr);
        if (outMs && outMs > startMs) {
          endMs = outMs;
        }
      }

      const diffMs = endMs - startMs;
      if (diffMs <= 0 || isNaN(diffMs)) {
        setPersWorkingHours("0h 0m");
        return;
      }
      const diffMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      setPersWorkingHours(`${hrs}h ${mins}m`);
    };
    calcHours();
    const interval = setInterval(calcHours, 10000);
    return () => clearInterval(interval);
  }, [persCheckInTime, persCheckOutTime, persIsCheckedOut, todayStr]);

  // Load today's check-in / check-out from backend on mount for personal view
  useEffect(() => {
    let isMounted = true;
    const loadBackendTodayAttendance = async () => {
      if (!user?.email && !user?.id) return;
      try {
        const res: any = await fetchTeacherTodayAttendanceApi();
        if (isMounted) {
          const attendanceData = res?.attendance ?? (res?.inTime ? res : null);
          if (attendanceData && attendanceData.inTime) {
            setPersCheckInTime(attendanceData.inTime);
            if (attendanceData.outTime) {
              setPersCheckOutTime(attendanceData.outTime);
              setPersIsCheckedOut(true);
            } else {
              setPersCheckOutTime(null);
              setPersIsCheckedOut(false);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load today's attendance from server", err);
      }
    };
    loadBackendTodayAttendance();
    return () => { isMounted = false; };
  }, [todayDateStr, user?.email, user?.id]);

  const handlePersCheckIn = async () => {
    try {
      try { await teacherCheckInApi(); } catch {}
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      setPersCheckInTime(formattedTime);
      setPersCheckOutTime(null);
      setPersIsCheckedOut(false);

      const checkInMinutes = now.getHours() * 60 + now.getMinutes();
      const expMinutes = parseTimeToMinutes(schoolProfile?.staffCheckInTime) ?? (8 * 60 + 30);
      const graceMinutes = Number(schoolProfile?.staffGracePeriodMinutes ?? 15);
      const computedStatus = (checkInMinutes > expMinutes + graceMinutes) ? "Late" : "Present";
      const teacherEmpId = teacher?.empId || dbTeacher?.empId || teacher?.id || dbTeacher?.id || user?.id || "";

      if (markAttendance && teacherEmpId) {
        await markAttendance([{
          id: `ATT-${Date.now()}-${teacherEmpId}`,
          date: todayDateStr,
          entityType: "Staff",
          entityId: String(teacherEmpId),
          staffId: String(dbTeacher?.id || teacherEmpId),
          employeeId: String(teacherEmpId),
          email: user?.email || dbTeacher?.email || "",
          employeeName: `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim() || user?.name || "Staff Member",
          status: computedStatus,
          inTime: formattedTime,
          outTime: "",
          remarks: computedStatus === "Late" ? "Late Check-In Online" : "Checked In Online",
          department: teacher?.department || dbTeacher?.department || (user as any)?.department || "General Staff",
          designation: teacher?.designation || dbTeacher?.designation || (user as any)?.designation || "Staff"
        }]);
      }

      addToast(
        "success",
        "Checked In Successfully",
        `Recorded check-in at ${formattedTime}${computedStatus === "Late" ? " (Late Arrival)" : ""}`,
      );
    } catch (err: any) {
      console.error("Personal check-in error:", err);
      addToast("error", "Check In Failed", err.message || "Could not record check in");
    }
  };

  const handlePersCheckOut = async () => {
    try {
      try { await teacherCheckOutApi(); } catch {}
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const inTimeVal = persCheckInTime ? formatDisplayTime(persCheckInTime) : (schoolProfile?.staffCheckInTime || "08:30 AM");
      
      setPersCheckOutTime(formattedTime);
      setPersIsCheckedOut(true);

      const teacherEmpId = teacher?.empId || dbTeacher?.empId || teacher?.id || dbTeacher?.id || user?.id || "";

      if (markAttendance && teacherEmpId) {
        await markAttendance([{
          id: `ATT-${Date.now()}-${teacherEmpId}`,
          date: todayDateStr,
          entityType: "Staff",
          entityId: String(teacherEmpId),
          staffId: String(dbTeacher?.id || teacherEmpId),
          employeeId: String(teacherEmpId),
          email: user?.email || dbTeacher?.email || "",
          employeeName: `${teacher?.firstName || ''} ${teacher?.lastName || ''}`.trim() || user?.name || "Staff Member",
          status: todayStatus === "Late" ? "Late" : "Present",
          inTime: persCheckInTime ? formatDisplayTime(persCheckInTime) : inTimeVal,
          outTime: formattedTime,
          remarks: "Checked In & Out Online",
          department: teacher?.department || dbTeacher?.department || (user as any)?.department || "General Staff",
          designation: teacher?.designation || dbTeacher?.designation || (user as any)?.designation || "Staff"
        }]);
      }

      addToast(
        "info",
        "Checked Out Successfully",
        `Recorded check-out at ${formattedTime}`,
      );
    } catch (err: any) {
      console.error("Personal check-out error:", err);
      addToast("error", "Check Out Failed", err.message || "Could not record check out");
    }
  };

  const handleResetShift = () => {
    setPersCheckInTime(null);
    setPersCheckOutTime(null);
    setPersIsCheckedOut(false);
    setPersWorkingHours("0h 0m");
    addToast("info", "Shift Reset", "Today's shift attendance has been reset.");
  };

  const todayStatus = useMemo(() => {
    if (!persCheckInTime) return "Pending Check-In";
    const checkInMins = parseTimeToMinutes(persCheckInTime);
    if (checkInMins === null) return "Present";

    const expMins = parseTimeToMinutes(schoolProfile?.staffCheckInTime) ?? (8 * 60 + 30);
    const graceMins = Number(schoolProfile?.staffGracePeriodMinutes ?? 15);

    if (checkInMins > expMins + graceMins) {
      return "Late";
    }
    return "Present";
  }, [persCheckInTime, schoolProfile?.staffCheckInTime, schoolProfile?.staffGracePeriodMinutes]);

  const lateByMins = useMemo(() => {
    if (todayStatus !== "Late" || !persCheckInTime) return 0;
    const checkInMins = parseTimeToMinutes(persCheckInTime);
    if (checkInMins === null) return 0;
    const expMins = parseTimeToMinutes(schoolProfile?.staffCheckInTime) ?? (8 * 60 + 30);
    return Math.max(0, checkInMins - expMins);
  }, [todayStatus, persCheckInTime, schoolProfile?.staffCheckInTime]);

  const formattedLateBy = useMemo(() => {
    if (lateByMins <= 0) return '';
    const hrs = Math.floor(lateByMins / 60);
    const mins = lateByMins % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} hrs ${mins} mins`;
    } else if (hrs > 0) {
      return `${hrs} hrs`;
    }
    return `${lateByMins} mins`;
  }, [lateByMins]);

  const availableMonths = useMemo(() => {
    const rawToday = persCheckInTime ? { date: todayStr } : null;
    const teacherId = teacher?.id || dbTeacher?.id || "";
    const teacherRecords = (attendance || [])
      .filter((r) => {
        const isStaff = !r.entityType || r.entityType.toLowerCase() === "staff";
        const isId =
          String(r.entityId) === String(teacherId) ||
          String((r as any).staffId) === String(teacherId);
        const rDate = formatToISO(String(r.date || "").split("T")[0].split(" ")[0]);
        return isStaff && isId && rDate !== todayStr;
      })
      .map((r) => ({ date: formatToISO(String(r.date || "").split("T")[0].split(" ")[0]) }));

    const rawList = rawToday ? [rawToday, ...teacherRecords] : teacherRecords;

    const map = new Map<string, { value: string; label: string; yearMonthKey: string }>();

    rawList.forEach((item) => {
      if (!item.date) return;
      const iso = formatToISO(item.date);
      const d = new Date(iso);
      if (isNaN(d.getTime())) return;
      const mIdx = d.getMonth().toString();
      const monthName = d.toLocaleDateString("en-US", { month: "long" });
      const year = d.getFullYear();
      const label = `${monthName} ${year}`;
      const yearMonthKey = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(mIdx)) {
        map.set(mIdx, { value: mIdx, label, yearMonthKey });
      }
    });

    const ayRange = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const target = getTargetMonthInAY(new Date().getMonth(), ayRange);
    const currM = target.month.toString();
    const targetDate = new Date(target.year, target.month, 1);
    const currLabel = `${targetDate.toLocaleDateString("en-US", { month: "long" })} ${target.year}`;
    if (!map.has(currM)) {
      map.set(currM, {
        value: currM,
        label: currLabel,
        yearMonthKey: target.monthStr,
      });
    }

    return Array.from(map.values()).sort((a, b) => b.yearMonthKey.localeCompare(a.yearMonthKey));
  }, [persCheckInTime, todayStr, attendance, teacher, dbTeacher, selectedAcademicYear, academicYears]);

  const fullHistory = useMemo(() => {
    const todayRecord = persCheckInTime
      ? {
          date: todayStr,
          checkIn: formatDisplayTime(persCheckInTime),
          checkOut: formatDisplayTime(persCheckOutTime),
          workingHours: persWorkingHours,
          status: todayStatus,
        }
      : null;

    const teacherId = String(teacher?.id || "").toLowerCase().trim();
    const dbId = dbTeacher?.id ? String(dbTeacher.id).toLowerCase().trim() : "";
    const dbEmpId = dbTeacher?.empId ? String(dbTeacher.empId).toLowerCase().trim() : "";
    const userId = user?.id ? String(user.id).toLowerCase().trim() : "";
    const userEmpId = (user as any)?.empId ? String((user as any).empId).toLowerCase().trim() : "";

    const teacherRecords = (attendance || [])
      .filter((r) => {
        const isStaff = !r.entityType || r.entityType.toLowerCase() === "staff";
        const rEntityId = String(r.entityId || (r as any).staffId || "").toLowerCase().trim();
        const isId =
          (teacherId && rEntityId === teacherId) ||
          (dbId && rEntityId === dbId) ||
          (dbEmpId && rEntityId === dbEmpId) ||
          (userId && rEntityId === userId) ||
          (userEmpId && rEntityId === userEmpId);

        const rDate = formatToISO(String(r.date || "").split("T")[0].split(" ")[0]);
        return isStaff && isId && rDate !== todayStr;
      })
      .map((r) => {
        let calcHours = "--";
        if (r.inTime && r.outTime) {
          const startMs = parseTimeToMs(r.inTime, r.date);
          const endMs = parseTimeToMs(r.outTime, r.date);
          if (startMs && endMs && endMs > startMs) {
            const diffMins = Math.floor((endMs - startMs) / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            calcHours = `${hrs}h ${mins}m`;
          } else {
            calcHours = "8h 0m";
          }
        }
        return {
          date: formatToISO(String(r.date || "").split("T")[0].split(" ")[0]),
          checkIn: formatDisplayTime(r.inTime),
          checkOut: formatDisplayTime(r.outTime),
          workingHours: calcHours,
          status: r.status || "Present",
        };
      });

    const list = todayRecord ? [todayRecord, ...teacherRecords] : teacherRecords;

    // SORT ALL RECORDS BY ISO DATE IN DESCENDING ORDER (NEWEST DATE FIRST)
    const sortedList = [...list].sort((a, b) => {
      const isoA = formatToISO(a.date);
      const isoB = formatToISO(b.date);
      return isoB.localeCompare(isoA);
    });

    return sortedList.filter((item) => {
      const isoItemDate = formatToISO(item.date);
      if (personalFilterDate) {
        const isoFilterDate = formatToISO(personalFilterDate);
        if (isoItemDate !== isoFilterDate) return false;
      }
      if (personalFilterMonth !== "All") {
        const d = new Date(isoItemDate);
        const itemMonth = isNaN(d.getTime()) ? -1 : d.getMonth();
        if (itemMonth.toString() !== personalFilterMonth) return false;
      }
      if (personalSearchQuery) {
        const q = personalSearchQuery.toLowerCase();
        const displayDateStr = formatToDDMMYYYY(isoItemDate, "-").toLowerCase();
        return (
          isoItemDate.toLowerCase().includes(q) ||
          displayDateStr.includes(q) ||
          (item.status || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    persCheckInTime,
    persCheckOutTime,
    persWorkingHours,
    todayStatus,
    todayStr,
    personalFilterDate,
    personalFilterMonth,
    personalSearchQuery,
    attendance,
    teacher,
    dbTeacher,
  ]);

  const personalMonthlyStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;
    let totalMinutes = 0;

    fullHistory.forEach((rec) => {
      const st = (rec.status || "").toLowerCase();
      if (st.includes("late")) {
        late += 1;
        present += 1;
      } else if (st.includes("present")) {
        present += 1;
      } else if (st.includes("absent")) {
        absent += 1;
      } else if (st.includes("leave")) {
        leave += 1;
      }

      if (rec.workingHours && rec.workingHours.includes("h")) {
        const parts = rec.workingHours.split("h");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]?.replace("m", "")) || 0;
        totalMinutes += h * 60 + m;
      }
    });

    const totalHrs = Math.floor(totalMinutes / 60);
    const remMins = totalMinutes % 60;
    const totalHoursDisplay = totalMinutes > 0 ? `${totalHrs} hrs ${remMins > 0 ? `${remMins} m` : ''}`.trim() : "0 hrs";

    return {
      present: present > 0 ? present : (persCheckInTime ? 1 : 0),
      absent,
      late,
      leave,
      totalHoursDisplay
    };
  }, [fullHistory, persCheckInTime]);

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFromDate || !leaveToDate) {
      addToast("error", "Dates Required", "Please select both from and to dates.");
      return;
    }
    const from = new Date(leaveFromDate);
    const to = new Date(leaveToDate);
    const diffMs = to.getTime() - from.getTime();
    const daysCount =
      diffMs >= 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1 : 0;

    if (daysCount === 0) {
      addToast(
        "error",
        "Invalid Date Range",
        "End date must be on or after start date.",
      );
      return;
    }

    const selectedType = (leaveTypes || []).find(t => String(t.id) === String(selectedLeaveTypeId)) || (leaveTypes || [])[0];
    const typeName = selectedType?.name || "Leave";
    const typeCode = (selectedType?.code || "").toUpperCase();
    const typeNameLower = typeName.toLowerCase();

    let available = 0;
    if (typeCode.includes("CL") || typeNameLower.includes("casual")) {
      available = leaveBalance.casual;
    } else if (typeCode.includes("SL") || typeNameLower.includes("sick")) {
      available = leaveBalance.sick;
    } else if (typeCode.includes("EL") || typeCode.includes("PL") || typeNameLower.includes("earned") || typeNameLower.includes("paid")) {
      available = leaveBalance.paid;
    } else {
      available = Number(selectedType?.annualAllowance) || Number(selectedType?.maxDays) || 99;
    }

    if (available < daysCount) {
      addToast(
        "error",
        "Insufficient Leave Balance",
        `You only have ${available} days of ${typeName} remaining.`,
      );
      return;
    }

    const currentStaff = dbTeacher || (staff || []).find(s => s.id === teacher.id || s.empId === teacher.empId) || (user as any);
    const empId = currentStaff?.empId || teacher.empId || (user as any)?.empId || teacher.id || String(user?.id || "");
    const employeeId = currentStaff?.id || teacher.id || empId;
    const employeeName = `${currentStaff?.firstName || teacher.firstName || ""} ${currentStaff?.lastName || teacher.lastName || ""}`.trim() || user?.name || "";
    const department = currentStaff?.department || teacher.department || (user as any)?.department || "";
    const designation = currentStaff?.designation || teacher.designation || (user as any)?.designation || "";
    const branch = currentStaff?.branch || (currentStaff as any)?.branchName || (teacher as any)?.branch || selectedBranch || "";
    const employeeCategory = currentStaff?.employeeCategory || teacher.employeeCategory || (userRole === "teacher" || userRole === "class-teacher" ? "Teaching Staff" : "Non-Teaching Staff");

    if (addLeaveApplication) {
      addLeaveApplication({
        employeeId,
        empId,
        employeeName,
        department,
        designation,
        branch,
        employeeCategory,
        leaveTypeId: String(selectedType?.id || ""),
        leaveTypeName: typeName,
        fromDate: leaveFromDate,
        toDate: leaveToDate,
        numberOfDays: daysCount,
        reason: leaveReason,
        status: "Pending",
        appliedDate: new Date().toISOString().split("T")[0],
        isHalfDay: false,
      });
    }

    addToast(
      "success",
      "Leave Applied Successfully",
      `Submitted application for ${daysCount} ${daysCount === 1 ? "day" : "days"} of ${typeName} (Pending approval).`,
    );
    setShowApplyLeaveModal(false);
    setLeaveFromDate("");
    setLeaveToDate("");
    setLeaveReason("");
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (correctionDateError) {
      addToast("error", "Invalid Target Date", correctionDateError);
      return;
    }
    if (!correctionDate || !correctionType || !correctionTime.trim() || !correctionReason.trim()) {
      addToast(
        "error",
        "Required Fields Missing",
        "Please fill in Target Date, Request Type, Actual Time, and Reason for Correction.",
      );
      return;
    }
    const newReq = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      date: correctionDate,
      type: correctionType,
      status: "Pending",
      reason: correctionReason.trim(),
    };
    
    setRequests((prev) => [newReq, ...prev]);

    addToast(
      "success",
      "Correction Request Submitted",
      `Attendance correction request for ${correctionDate} is pending approval.`,
    );
    setShowCorrectionModal(false);
    setCorrectionDate("");
    setCorrectionDateTouched(false);
    setCorrectionDateBadInput(false);
    setCorrectionType("");
    setCorrectionReason("");
    setCorrectionTime("");

    try {
      await createAttendanceCorrectionApi({
        date: correctionDate,
        requestType: correctionType,
        reason: correctionReason,
        actualTime: correctionTime,
      });
    } catch (err: any) {
      console.warn("API error during correction submission (saved to persistent local storage):", err);
    }
  };

  const handleDownloadReport = () => {
    if (!fullHistory || fullHistory.length === 0) {
      addToast("warning", "No Records", "No attendance records available to export.");
      return;
    }
    const exportData = fullHistory.map((item) => ({
      "Date": item.date,
      "Employee Name": `${teacher.firstName} ${teacher.lastName}`,
      "Designation": teacher.designation,
      "Department": teacher.department,
      "Check In": item.checkIn || "-",
      "Check Out": item.checkOut || "-",
      "Working Hours": item.workingHours || "-",
      "Status": item.status,
    }));
    try {
      exportToExcel(
        exportData,
        `Staff_Attendance_${teacher.firstName}_${teacher.lastName}_${new Date().toISOString().split("T")[0]}`,
        "Personal Attendance"
      );
      addToast(
        "success",
        "Report Exported Successfully",
        "Downloaded personal attendance registry in Excel format.",
      );
    } catch (err: any) {
      console.error("Personal export error:", err);
      addToast("error", "Export Failed", err.message || "Failed to export report.");
    }
  };

  let personalView: React.ReactNode = null;
  if (isPersonalView) {
    personalView = (
      <div className="space-y-4 animate-in fade-in duration-300 text-xs pb-12 max-w-7xl mx-auto">
        {/* 1. Header Section */}
        <div className="glass-card p-3 sm:p-4 rounded-2xl border border-sky-200/90 dark:border-sky-850 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              My Attendance
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-0.5">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Attendance Status Today
            </p>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                todayStatus === "Present"
                  ? "bg-emerald-100 text-emerald-805 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : todayStatus === "Late"
                    ? "bg-amber-100 text-amber-805 dark:bg-amber-950/60 dark:text-amber-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400"
              }`}
            >
              {todayStatus}
            </span>
          </div>
        </div>

        {/* 2. Top Row: 3 Summary Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Today's Attendance Card */}
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Today's Attendance
                </h3>
              </div>

              {/* Operational Shift Window from Admin Settings */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/40 text-[11px]">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Shift Window:</span>
                <span className="font-mono font-black text-sky-700 dark:text-sky-300">
                  {schoolProfile?.staffCheckInTime || "08:30 AM"} - {schoolProfile?.staffCheckOutTime || "05:00 PM"}
                  <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-sans font-bold">
                    (+{schoolProfile?.staffGracePeriodMinutes ?? 15}m grace)
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Check-In
                  </span>
                  <p className="font-mono font-black text-slate-850 dark:text-white text-sm">
                    {formatDisplayTime(persCheckInTime)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Check-Out
                  </span>
                  <p className="font-mono font-black text-slate-850 dark:text-white text-sm">
                    {formatDisplayTime(persCheckOutTime)}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-sky-200/60 dark:border-slate-800/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">
                    Working Hours:
                  </span>
                  <span className="font-mono font-black text-slate-800 dark:text-white text-sm">
                    {persWorkingHours}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span className="font-bold text-slate-500">
                    Status today:
                  </span>
                  <span className="font-black text-slate-800 dark:text-white">
                    {todayStatus}
                  </span>
                </div>
                {todayStatus === "Late" && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-amber-600 dark:text-amber-400 font-bold">
                    <span>Late By:</span>
                    <span>{formattedLateBy}</span>
                  </div>
                )}
              </div>
            </div>

            {persIsCheckedOut ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-black text-center border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center gap-2 shadow-xs mt-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Daily Shift Completed</span>
              </div>
            ) : (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  disabled={!!persCheckInTime}
                  onClick={handlePersCheckIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800/40 disabled:text-slate-400 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Check In
                </button>
                <button
                  type="button"
                  disabled={!persCheckInTime}
                  onClick={handlePersCheckOut}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-slate-800/40 disabled:text-slate-400 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Check Out
                </button>
              </div>
            )}
          </div>

          {/* Monthly Summary Card */}
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Monthly Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Present Days
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {personalMonthlyStats.present} {personalMonthlyStats.present === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Absent Days
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {personalMonthlyStats.absent} {personalMonthlyStats.absent === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Late Days
                  </span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {personalMonthlyStats.late} {personalMonthlyStats.late === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Leave Days
                  </span>
                  <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                    {personalMonthlyStats.leave} {personalMonthlyStats.leave === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs mt-1.5">
              <span className="font-bold text-slate-500 text-[11px]">
                Total Hours (Month):
              </span>
              <span className="font-black text-slate-850 dark:text-white">
                {personalMonthlyStats.totalHoursDisplay}
              </span>
            </div>
          </div>

          {/* Leave Balance Overview & Quick Link Card */}
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Leave Balance
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-900/60">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 uppercase">
                    Casual
                  </span>
                  <p className="font-black text-sky-900 dark:text-white text-sm">
                    {leaveBalance.casual}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                    Sick
                  </span>
                  <p className="font-black text-amber-900 dark:text-white text-sm">
                    {leaveBalance.sick}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                    Earned
                  </span>
                  <p className="font-black text-emerald-900 dark:text-white text-sm">
                    {leaveBalance.paid}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate("staff-leave");
                } else {
                  setShowApplyLeaveModal(true);
                }
              }}
              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mt-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Go to Leave Management
            </button>
          </div>
        </div>

        {/* 3. Bottom Section: Admin-Style Attendance Register UI */}
        <div className="space-y-4">
          {/* Control Filters Row */}
          <div className="glass-card p-4 rounded-2xl border border-sky-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              {/* Date Mode */}
              <div>
                <select
                  value={persDateMode}
                  onChange={(e) => {
                    const nextMode = e.target.value as "Daily" | "Monthly" | "Custom Range";
                    setPersDateMode(nextMode);
                    if (nextMode === "Custom Range") {
                      const y = persRegYear;
                      const m = String(persRegMonth + 1).padStart(2, "0");
                      const daysInM = new Date(y, persRegMonth + 1, 0).getDate();
                      setPersFromDate(`${y}-${m}-01`);
                      setPersToDate(`${y}-${m}-${String(daysInM).padStart(2, "0")}`);
                    } else {
                      setPersFromDate("");
                      setPersToDate("");
                    }
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
                >
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Custom Range">Custom Range</option>
                </select>
              </div>

              {/* Date / Month Selection */}
              <div className={persDateMode === "Custom Range" ? "sm:col-span-2 lg:col-span-2" : ""}>
                {persDateMode === "Daily" && (
                  <DateInput
                    value={personalFilterDate || todayStr}
                    min={personalAYRange.startDate}
                    max={todayStr}
                    onChange={(e) => setPersonalFilterDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                )}
                {persDateMode === "Monthly" && (
                  <input
                    type="month"
                    value={persMonthInputVal}
                    min={personalAYRange.minMonth}
                    max={personalAYRange.maxMonth}
                    onChange={(e) => handlePersMonthInputChange(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
                  />
                )}
                {persDateMode === "Custom Range" && (
                  <div className="flex items-center gap-2">
                    <DateInput
                      value={persFromDate}
                      min={personalAYRange.startDate}
                      max={personalAYRange.endDate}
                      onChange={(e) => setPersFromDate(e.target.value)}
                      placeholder="From"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <DateInput
                      value={persToDate}
                      min={persFromDate || personalAYRange.startDate}
                      max={personalAYRange.endDate}
                      onChange={(e) => setPersToDate(e.target.value)}
                      placeholder="To"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {persDateMode === "Daily" ? (
            /* Daily View Table (Admin Style) */
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left">
                        Employee ID
                      </th>
                      <th className="py-3.5 px-4 sticky left-[160px] bg-slate-100 dark:bg-slate-800 z-20 min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left">
                        Employee Name
                      </th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-left">Department</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-left">Designation</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Date</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Attendance Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">In Time</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Out Time</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Working Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {(() => {
                      const targetDailyDate = formatToISO(personalFilterDate || todayStr);
                      const matchedDaily = fullHistory.find((item) => formatToISO(item.date) === targetDailyDate);
                      const statusVal = matchedDaily?.status || (targetDailyDate === todayStr && persCheckInTime ? todayStatus : "Absent");
                      const inVal = matchedDaily?.checkIn || (targetDailyDate === todayStr ? formatDisplayTime(persCheckInTime) : "--:--");
                      const outVal = matchedDaily?.checkOut || (targetDailyDate === todayStr ? formatDisplayTime(persCheckOutTime) : "--:--");
                      const hrsVal = matchedDaily?.workingHours || (targetDailyDate === todayStr ? persWorkingHours : "0h 0m");
                      return (
                        <tr className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                          <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400 sticky left-0 bg-white dark:bg-slate-900 z-10 w-[160px] min-w-[160px] max-w-[160px] border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                            {teacher.empId || teacher.id}
                          </td>
                          <td className="py-3 px-4 sticky left-[160px] bg-white dark:bg-slate-900 z-10 min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-800">
                            <p className="font-extrabold text-slate-900 dark:text-white">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {dbTeacher?.email || user?.email || ""}
                            </p>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold">{teacher.department}</td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold">{teacher.designation}</td>
                          <td className="py-3 px-4 text-center font-bold whitespace-nowrap">{formatToDDMMYYYY(targetDailyDate, "-")}</td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                                statusVal === "Present"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50"
                                  : statusVal === "Late"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50"
                                    : statusVal === "Leave"
                                      ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200/50"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50"
                              }`}
                            >
                              {statusVal}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">{inVal}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">{outVal}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">{hrsVal}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="px-6 pb-4">
                <Pagination
                  currentPage={persPage}
                  totalItems={1}
                  itemsPerPage={persPageSize}
                  onPageChange={setPersPage}
                  onItemsPerPageChange={(n) => {
                    setPersPageSize(n);
                    setPersPage(1);
                  }}
                  label="employees"
                />
              </div>
            </div>
          ) : (
            /* Monthly & Custom Range Register (Exact Admin Login Style) */
            <div className="space-y-4">
              {/* Monthly Register Legend & Controls Bar */}
              <div className="glass-card py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-500/20">
                    P = Present
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-500/20">
                    A = Absent
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 border border-sky-500/20">
                    L = Leave
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-500/20">
                    HD = Half Day
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-500 border border-slate-200/40">
                    W = Weekend
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 border border-amber-500/20">
                    H = Holiday
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-300 border border-slate-200/40">
                    TL = Total Leaves
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-100/50 dark:bg-sky-950/20 text-sky-700 border border-sky-200/40">
                    OL = On Leave
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-100/50 dark:bg-sky-950/20 text-sky-700 border border-sky-200/40">
                    UL = Used Leaves
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={teacher.id}
                    disabled
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-default"
                  >
                    <option value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} (1)
                    </option>
                  </select>
                </div>
              </div>

              {/* Monthly Matrix Table */}
              <div className="glass-card rounded-3xl overflow-hidden border border-sky-200/80 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                    Monthly Register:{" "}
                    {persDateMode === "Custom Range" && persFromDate && persToDate
                      ? `Custom Range (${formatToDDMMYYYY(persFromDate, "-")} to ${formatToDDMMYYYY(persToDate, "-")})`
                      : `${persMonthNames[persRegMonth]} ${persRegYear}`}{" "}
                    ({teacher.designation || teacher.department || "Staff"})
                  </h3>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-separate border-spacing-0 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold uppercase">
                        <th
                          className="py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                          style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                        >
                          Employee ID
                        </th>
                        <th
                          className="py-2.5 px-3 sticky left-[160px] bg-slate-100 dark:bg-slate-800 z-20 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                          style={{ left: 160, width: 180, minWidth: 180, maxWidth: 180 }}
                        >
                          Employee Name
                        </th>
                        {persRegisterDaysList.map((item, idx) => (
                          <th
                            key={idx}
                            className="py-2.5 px-1 text-center min-w-[36px] font-mono whitespace-nowrap"
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">
                                {item.displayHeader}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold mt-0.5">
                                {item.dayOfWeek}
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className="py-2.5 px-2 text-center text-brand-600 cursor-help" title="Present days">P</th>
                        <th className="py-2.5 px-2 text-center text-rose-600 cursor-help" title="Absent days">A</th>
                        <th className="py-2.5 px-2 text-center text-sky-600 cursor-help" title="Leave days">L</th>
                        <th className="py-2.5 px-2 text-center text-amber-600 cursor-help" title="Half Days">HD</th>
                        <th className="py-2.5 px-2 text-center text-slate-600 cursor-help" title="Total Leaves">TL</th>
                        <th className="py-2.5 px-2 text-center text-sky-700 cursor-help" title="On Leave">OL</th>
                        <th className="py-2.5 px-2 text-center text-sky-700 cursor-help" title="Used Leaves">UL</th>
                        <th className="py-2.5 px-2 text-center text-slate-600">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold">
                      {(() => {
                        const q = personalSearchQuery.toLowerCase().trim();
                        const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
                        const empCode = String(teacher.empId || teacher.id || "").toLowerCase();
                        if (q && !fullName.includes(q) && !empCode.includes(q)) {
                          return (
                            <tr>
                              <td colSpan={persRegisterDaysList.length + 10} className="py-8 text-center text-slate-400 italic">
                                No employee records match "{personalSearchQuery}".
                              </td>
                            </tr>
                          );
                        }

                        let pCount = 0;
                        let aCount = 0;
                        let lCount = 0;
                        let hdCount = 0;

                        const teacherId = String(teacher?.id || "").toLowerCase().trim();
                        const dbId = dbTeacher?.id ? String(dbTeacher.id).toLowerCase().trim() : "";
                        const dbEmpId = dbTeacher?.empId ? String(dbTeacher.empId).toLowerCase().trim() : "";
                        const userId = user?.id ? String(user.id).toLowerCase().trim() : "";
                        const userEmpId = (user as any)?.empId ? String((user as any)?.empId).toLowerCase().trim() : "";

                        const rowCells = persRegisterDaysList.map((item, idx) => {
                          const rec = (attendance || []).find((r) => {
                            const isStaff = !r.entityType || r.entityType.toLowerCase() === "staff";
                            const rEntityId = String(r.entityId || (r as any).staffId || "").toLowerCase().trim();
                            const isId =
                              (teacherId && rEntityId === teacherId) ||
                              (dbId && rEntityId === dbId) ||
                              (dbEmpId && rEntityId === dbEmpId) ||
                              (userId && rEntityId === userId) ||
                              (userEmpId && rEntityId === userEmpId);
                            const rDate = formatToISO(String(r.date || "").split("T")[0].split(" ")[0]);
                            return isStaff && isId && rDate === item.dateStr;
                          });

                          const status =
                            item.dateStr === todayStr && persCheckInTime
                              ? todayStatus
                              : rec?.status;

                          const dayObj = new Date(item.dateStr);
                          const isWeekend = !isNaN(dayObj.getTime()) && dayObj.getDay() === 0;
                          const holidayCheck = checkSundayOrHoliday(item.dateStr, holidays);
                          const isHoliday = holidayCheck.isHoliday && holidayCheck.type === "Holiday";

                          let code = "";
                          let badgeStyle = "";

                          if (status) {
                            if (status === "Present" || status === "Late") {
                              code = "P";
                              badgeStyle =
                                "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20";
                              pCount++;
                            } else if (status === "Absent") {
                              code = "A";
                              badgeStyle =
                                "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20";
                              aCount++;
                            } else if (status === "Leave") {
                              code = "L";
                              badgeStyle =
                                "text-sky-500 bg-sky-50 dark:bg-sky-950/30 border border-sky-500/20";
                              lCount++;
                            } else if (status === "HalfDay") {
                              code = "HD";
                              badgeStyle =
                                "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20";
                              hdCount++;
                            }
                          } else if (isHoliday) {
                            code = "H";
                            badgeStyle =
                              "text-amber-600 bg-amber-100/50 dark:bg-amber-900/30 font-semibold";
                          } else if (isWeekend) {
                            code = "W";
                            badgeStyle =
                              "text-slate-400 bg-slate-100 dark:bg-slate-800/60 font-semibold";
                          } else {
                            code = "";
                            badgeStyle =
                              "border border-dashed border-slate-200 dark:border-slate-800 bg-transparent text-transparent";
                          }

                          return (
                            <td
                              key={idx}
                              className="py-2 px-0.5 text-center font-mono font-bold text-[10px]"
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mx-auto ${badgeStyle}`}
                              >
                                {code}
                              </span>
                            </td>
                          );
                        });

                        const totalLeaves = lCount + hdCount * 0.5;
                        const totalRecordedDays = pCount + aCount + lCount + hdCount;

                        return (
                          <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200">
                            <td
                              className="py-2 px-3 font-mono font-bold text-brand-600 dark:text-brand-400 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                              style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                            >
                              {teacher.empId || teacher.id}
                            </td>
                            <td
                              className="py-2 px-3 sticky left-[160px] bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                              style={{ left: 160, width: 180, minWidth: 180, maxWidth: 180 }}
                            >
                              <span className="font-extrabold text-slate-900 dark:text-white block">
                                {teacher.firstName} {teacher.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {dbTeacher?.email || user?.email || ""}
                              </span>
                            </td>
                            {rowCells}
                            <td className="py-2 px-2 text-center font-bold text-emerald-600">{pCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-sky-600">{lCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-amber-600">{hdCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-slate-500">{totalLeaves}</td>
                            <td className="py-2 px-2 text-center font-bold text-sky-700">{lCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-sky-700">{totalLeaves}</td>
                            <td className="py-2 px-2 text-center font-extrabold text-slate-700 dark:text-slate-350">
                              {totalRecordedDays > 0
                                ? Math.round(((pCount + hdCount * 0.5) / totalRecordedDays) * 100)
                                : 0}
                              %
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="px-6 pb-4">
                  <Pagination
                    currentPage={persPage}
                    totalItems={1}
                    itemsPerPage={persPageSize}
                    onPageChange={setPersPage}
                    onItemsPerPageChange={(n) => {
                      setPersPageSize(n);
                      setPersPage(1);
                    }}
                    label="employees"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Apply Leave Modal */}
        {showApplyLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-purple-600" /> Apply for
                  Leave
                </h3>
                <button
                  onClick={() => setShowApplyLeaveModal(false)}
                  className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Leave Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <select
                    value={selectedLeaveTypeId}
                    onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none cursor-pointer"
                    required
                  >
                    {(leaveTypes || []).map((t) => {
                      const c = (t.code || "").toUpperCase();
                      const n = (t.name || "").toLowerCase();
                      const bal =
                        c.includes("CL") || n.includes("casual")
                          ? leaveBalance.casual
                          : c.includes("SL") || n.includes("sick")
                            ? leaveBalance.sick
                            : c.includes("EL") || c.includes("PL") || n.includes("earned") || n.includes("paid")
                              ? leaveBalance.paid
                              : (t.annualAllowance ?? t.maxDays ?? 0);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({bal} days left)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      From Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      min={personalAYRange.startDate}
                      max={personalAYRange.endDate}
                      value={leaveFromDate}
                      onChange={(e) => setLeaveFromDate(sanitizeDateInputYear(e))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      To Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      min={leaveFromDate || personalAYRange.startDate}
                      max={personalAYRange.endDate}
                      value={leaveToDate}
                      onChange={(e) => setLeaveToDate(sanitizeDateInputYear(e))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reason for Leave <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Provide description of reason for leave application..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-855 dark:text-slate-200 outline-none min-h-[80px]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowApplyLeaveModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedLeaveTypeId || !leaveFromDate || !leaveToDate || !leaveReason.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. Request Attendance Correction Modal */}
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Attendance
                  Correction
                </h3>
                <button
                  onClick={() => setShowCorrectionModal(false)}
                  className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCorrectionSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Target Date <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="date"
                        min={minCorrectionDateStr}
                        max={todayStr}
                        value={correctionDate}
                        placeholder="Select Date"
                        onChange={(e) => {
                          setCorrectionDateTouched(true);
                          setCorrectionDateBadInput(Boolean(e.target.validity?.badInput));
                          const sanitized = sanitizeDateInputYear(e);
                          setCorrectionDate(sanitized);
                        }}
                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                          setCorrectionDateBadInput(Boolean(e.currentTarget.validity?.badInput));
                        }}
                        onBlur={() => setCorrectionDateTouched(true)}
                        className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold outline-none transition-colors ${
                          !correctionDate
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-855 dark:text-slate-200"
                        } ${
                          correctionDateError
                            ? "border-rose-500 dark:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Request Type <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <select
                        value={correctionType}
                        onChange={(e) => setCorrectionType(e.target.value as any)}
                        className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer ${
                          !correctionType
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-855 dark:text-slate-200"
                        }`}
                        required
                      >
                        <option value="" disabled>
                          Select Request Type
                        </option>
                        <option value="Missed Check-In" className="text-slate-900 dark:text-white">Missed Check-In</option>
                        <option value="Missed Check-Out" className="text-slate-900 dark:text-white">Missed Check-Out</option>
                        <option value="Late Login" className="text-slate-900 dark:text-white">Late Login</option>
                        <option value="Late Logout" className="text-slate-900 dark:text-white">Late Logout</option>
                      </select>
                    </div>
                  </div>

                  {correctionDateError ? (
                    <div
                      role="alert"
                      className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] font-bold text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{correctionDateError}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      Policy period: {formatToDDMMYYYY(minCorrectionDateStr, "/")} – {formatToDDMMYYYY(todayStr, "/")} (Last {CORRECTION_POLICY_DAYS} days, no future dates)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Actual Time <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={correctionTime}
                    onChange={(e) => {
                      let val = e.target.value;
                      const isDeleting = val.length < correctionTime.length;
                      if (!isDeleting) {
                        const m = val.match(/^(\d{3,4})(\s*(?:[aApP][mM]?)?)?$/);
                        if (m) {
                          const digits = m[1];
                          const suffix = m[2] || "";
                          const firstTwo = parseInt(digits.slice(0, 2), 10);
                          if (digits.length === 3) {
                            val = firstTwo > 23
                              ? `0${digits[0]}:${digits.slice(1)}${suffix}`
                              : `${digits.slice(0, 2)}:${digits.slice(2)}${suffix}`;
                          } else if (digits.length === 4) {
                            val = `${digits.slice(0, 2)}:${digits.slice(2, 4)}${suffix}`;
                          }
                          e.target.value = val;
                        }
                      }
                      setCorrectionTime(val);
                    }}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reason for correction <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Explain the reason for missed check-in/check-out or late login/logout..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-855 dark:text-slate-200 outline-none min-h-[80px]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !correctionDate ||
                      Boolean(correctionDateError) ||
                      !correctionType ||
                      !correctionTime.trim() ||
                      !correctionReason.trim()
                    }
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tab Tab-specific filters and registers below for Admin/HR view...
  // Active Main Module Tab
  const [activeTab, setActiveTab] = useState<AttendanceTab>("teaching");

  useEffect(() => {
    try {
      localStorage.removeItem('staff_attendance_active_tab');
    } catch {}
  }, []);

  const activeAYInfo = useMemo(() => {
    return parseAcademicYearRange(selectedAcademicYear, academicYears);
  }, [selectedAcademicYear, academicYears]);

  const [monthInputVal, setMonthInputVal] = useState<string>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.monthStr;
  });

  const [regYear, setRegYear] = useState<number>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.year;
  });

  const [regMonth, setRegMonth] = useState<number>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const d = new Date();
    const target = getTargetMonthInAY(d.getMonth(), range);
    return target.month;
  });

  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
    const today = new Date().toLocaleDateString('en-CA');
    if (today >= range.startDate && today <= range.endDate) {
      return today;
    }
    const target = getTargetMonthInAY(new Date().getMonth(), range);
    const cand = `${target.year}-${String(target.month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    if (cand >= range.startDate && cand <= range.endDate) {
      return cand;
    }
    return range.startDate;
  });

  const [viewMode, setViewMode] = useState<"daily" | "monthly" | "">("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});

  // Teaching Staff Filters
  const [teachingDept, setTeachingDept] = useState("All");
  const [teachingDesignation, setTeachingDesignation] = useState("All");
  const [teachingQuery, setTeachingQuery] = useState("");

  // Non-Teaching Staff Filters
  const [nonTeachingDept, setNonTeachingDept] = useState("All");
  const [nonTeachingDesignation, setNonTeachingDesignation] = useState("All");
  const [nonTeachingQuery, setNonTeachingQuery] = useState("");

  // Register Filters (Tab 3 logic now in viewMode='monthly')
  const [regEmpId, setRegEmpId] = useState("All");
  const [regFromDate, setRegFromDate] = useState("");
  const [regToDate, setRegToDate] = useState("");

  const [dateMode, setDateMode] = useState<'Daily' | 'Monthly' | 'Custom Range' | 'Select' | ''>('');

  const prevAYRef = useRef(selectedAcademicYear);
  useEffect(() => {
    if (prevAYRef.current !== selectedAcademicYear) {
      prevAYRef.current = selectedAcademicYear;
      const range = parseAcademicYearRange(selectedAcademicYear, academicYears);
      const target = getTargetMonthInAY(regMonth, range);
      setMonthInputVal(target.monthStr);
      setRegYear(target.year);
      setRegMonth(target.month);
      setRegFromDate("");
      setRegToDate("");

      // Also synchronize daily attendanceDate
      const parsedD = attendanceDate ? new Date(attendanceDate) : new Date();
      const mNum = !isNaN(parsedD.getTime()) ? parsedD.getMonth() : target.month;
      const dNum = !isNaN(parsedD.getTime()) ? String(parsedD.getDate()).padStart(2, "0") : "01";
      const cand = `${target.year}-${String(target.month + 1).padStart(2, "0")}-${dNum}`;
      if (cand >= range.startDate && cand <= range.endDate) {
        setAttendanceDate(cand);
      } else {
        setAttendanceDate(range.startDate);
      }
    }
  }, [selectedAcademicYear, academicYears, regMonth, attendanceDate]);

  const handleMonthInputChange = (val: string) => {
    setMonthInputVal(val);
    if (val) {
      const [yearStr, monthStr] = val.split('-');
      setRegYear(parseInt(yearStr, 10));
      setRegMonth(parseInt(monthStr, 10) - 1);
      setRegFromDate("");
      setRegToDate("");
    }
  };

  useEffect(() => {
    if (dateMode === 'Daily') {
      setViewMode('daily');
    } else if (dateMode === 'Monthly') {
      setViewMode('monthly');
      setRegFromDate("");
      setRegToDate("");
    } else if (dateMode === 'Custom Range') {
      setViewMode('monthly');
      const y = regYear;
      const m = String(regMonth + 1).padStart(2, '0');
      const daysInM = new Date(y, regMonth + 1, 0).getDate();
      setRegFromDate(`${y}-${m}-01`);
      setRegToDate(`${y}-${m}-${String(daysInM).padStart(2, '0')}`);
    } else {
      setViewMode('');
    }
  }, [dateMode, regYear, regMonth]);

  const handleFromDateChange = (isoDate: string) => {
    setRegFromDate(isoDate);
    if (isoDate) {
      const parts = isoDate.split("-");
      if (parts.length === 3) {
        const yearNum = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10) - 1;
        if (
          !isNaN(yearNum) &&
          !isNaN(monthNum) &&
          monthNum >= 0 &&
          monthNum < 12
        ) {
          setRegMonth(monthNum);
          setRegYear(yearNum);
        }
      }
    }
  };

  // Local Attendance State Maps: employeeId -> values
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, "Present" | "Absent" | "Late" | "HalfDay" | "Leave">
  >({});
  const [inTimeMap, setInTimeMap] = useState<Record<string, string>>({});
  const [outTimeMap, setOutTimeMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [overrideLeaveSet, setOverrideLeaveSet] = useState<Set<string>>(
    new Set(),
  );

  const [isDirty, setIsDirty] = useState(false);
  const [isEditingMonthly, setIsEditingMonthly] = useState(false);
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [monthlyEditsMap, setMonthlyEditsMap] = useState<
    Record<string, "Present" | "Absent" | "Leave" | "HalfDay">
  >({});

  // Pagination State
  const [dailyPage, setDailyPage] = useState<number>(1);
  const [monthlyPage, setMonthlyPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset pagination on filter changes
  useEffect(() => {
    setDailyPage(1);
  }, [
    activeTab,
    attendanceDate,
    teachingDept,
    teachingDesignation,
    teachingQuery,
    nonTeachingDept,
    nonTeachingDesignation,
    nonTeachingQuery,
  ]);

  useEffect(() => {
    setMonthlyPage(1);
  }, [
    activeTab,
    regEmpId,
    regMonth,
    regYear,
    regFromDate,
    regToDate,
    teachingDept,
    nonTeachingDept,
    teachingQuery,
    nonTeachingQuery,
    teachingDesignation,
    nonTeachingDesignation,
  ]);

  // Reset daily edit mode on tab or date changes
  useEffect(() => {
    setIsEditingDaily(false);
  }, [activeTab, attendanceDate, viewMode]);

  // Non-Teaching Departments List
  const nonTeachingDepartments = [
    "Administration",
    "Finance & Accounts",
    "Human Resources",
    "Transport",
    "Hostel",
    "Information Technology",
    "Security",
    "Maintenance",
    "Housekeeping",
    "Medical",
  ];

  // Helper check for teaching staff
  const isTeachingStaff = (s: Staff) => {
    return (
      s.employeeCategory === "Teacher" ||
      (s.employeeCategory as string) === "Teaching Staff" ||
      s.role === "Teacher"
    );
  };

  // Derive unique lists for dropdowns
  const teachingDepts = useMemo(() => {
    const list = (staff || [])
      .filter((s) => isTeachingStaff(s))
      .map((s) => s.department)
      .filter(Boolean);
    return Array.from(
      new Set([
        "Academics",
        "Mathematics",
        "Science",
        "English",
        "Social Science",
        "Languages",
        "Computer Science",
        ...list,
      ]),
    );
  }, [staff]);

  const teachingDesignations = useMemo(() => {
    const list = (staff || [])
      .filter((s) => isTeachingStaff(s))
      .map((s) => s.designation)
      .filter(Boolean);
    return Array.from(
      new Set([
        "Principal",
        "Vice Principal",
        "Academic Coordinator",
        "HOD",
        "Class Teacher",
        "Subject Teacher",
        "Senior Teacher",
        ...list,
      ]),
    );
  }, [staff]);

  const nonTeachingDesignations = useMemo(() => {
    const list = (staff || [])
      .filter((s) => !isTeachingStaff(s))
      .map((s) => s.designation)
      .filter(Boolean);
    return Array.from(
      new Set([
        "Office Administrator",
        "Accountant",
        "HR Executive",
        "System Administrator",
        "Transport Incharge",
        "Warden",
        "Security Guard",
        "Maintenance Engineer",
        "Staff Nurse",
        ...list,
      ]),
    );
  }, [staff]);

  // Check Holiday or Weekend Status for attendanceDate
  const holidayEvent = useMemo(() => {
    return (holidays || []).find(
      (h) => attendanceDate >= h.startDate && attendanceDate <= h.endDate,
    );
  }, [attendanceDate, holidays]);

  const isWeekend = useMemo(() => {
    if (!attendanceDate) return false;
    const day = new Date(attendanceDate).getDay();
    return day === 0; // Sunday
  }, [attendanceDate]);

  const isFutureDate = attendanceDate > todayStr;

  // Helper: check if employee has approved leave on selected attendanceDate
  const getApprovedLeave = (empId: string, checkDate: string) => {
    return (leaveApplications || []).find((app) => {
      const isEmpMatch =
        String(app.employeeId) === String(empId) ||
        String(app.empId) === String(empId) ||
        String((app as any).staffId) === String(empId);
      const isStatusMatch = (app.status || "").toLowerCase() === "approved";
      const fromStr = String(app.fromDate || "").split("T")[0];
      const toStr = String(app.toDate || "").split("T")[0];
      const targetStr = String(checkDate || "").split("T")[0];
      return isEmpMatch && isStatusMatch && targetStr >= fromStr && targetStr <= toStr;
    });
  };

  // Fetch daily attendance logs from API when filters change, and poll every 5s for live auto-reflection
  useEffect(() => {
    if (viewMode === "daily" && fetchDailyAttendance) {
      const activeDept =
        activeTab === "teaching" ? teachingDept : nonTeachingDept;
      fetchDailyAttendance(attendanceDate, activeDept);

      if (isDirty) return;

      const pollInterval = setInterval(() => {
        fetchDailyAttendance(attendanceDate, activeDept);
      }, 5000);

      return () => clearInterval(pollInterval);
    }
  }, [
    attendanceDate,
    activeTab,
    teachingDept,
    nonTeachingDept,
    viewMode,
    fetchDailyAttendance,
    isDirty,
  ]);

  // Fetch monthly attendance logs from API when filters change
  useEffect(() => {
    if ((viewMode === "monthly" || isPersonalView) && fetchMonthlyAttendance) {
      const activeDept =
        activeTab === "teaching" ? teachingDept : nonTeachingDept;
      const m = regMonth + 1;
      const y = regYear;
      fetchMonthlyAttendance(m, y, activeDept);
    }
  }, [
    regMonth,
    regYear,
    activeTab,
    teachingDept,
    nonTeachingDept,
    viewMode,
    isPersonalView,
    fetchMonthlyAttendance,
  ]);

  // Stable hash representation of relevant recorded attendance items to prevent unnecessary reset of edited state maps
  const attendanceHash = useMemo(() => {
    const targetDate = String(attendanceDate || "").split("T")[0].split(" ")[0];
    const relevant = (attendance || []).filter((r) => {
      const rDate = String(r.date || "").split("T")[0].split(" ")[0];
      return (!r.entityType || r.entityType.toLowerCase() === "staff") && rDate === targetDate;
    });
    return JSON.stringify(relevant);
  }, [attendance, attendanceDate]);

  // Helper to normalize status strings to standard TitleCase enum
  const normalizeStatus = useCallback((raw: string | undefined): "Present" | "Absent" | "Late" | "HalfDay" | "Leave" => {
    if (!raw) return "Present";
    const val = String(raw).trim().toLowerCase();
    if (val === "absent") return "Absent";
    if (val === "leave" || val === "on leave" || val === "onleave") return "Leave";
    if (val === "halfday" || val === "half day" || val === "half-day") return "HalfDay";
    if (val === "late") return "Late";
    return "Present";
  }, []);

  // Populate / Sync local attendance maps whenever attendanceDate or staff changes
  useEffect(() => {
    if (isDirty) return;

    const newStatusMap: typeof attendanceMap = {};
    const newInTimeMap: typeof inTimeMap = {};
    const newOutTimeMap: typeof outTimeMap = {};
    const newRemarksMap: typeof remarksMap = {};

    const targetDate = String(attendanceDate).split("T")[0];
    const isToday = targetDate === todayStr;

    staff.forEach((s) => {
      // 1. Check Approved Leave for this staff and this date
      const approvedLeave =
        getApprovedLeave(s.id, targetDate) ||
        (s.empId ? getApprovedLeave(s.empId, targetDate) : undefined);

      // 2. Check Existing Recorded Attendance (Strict match on exact ID, Staff ID, Employee ID or Email)
      let existing = (attendance || []).find((r) => {
        const rDate = String(r.date || "").split("T")[0];
        const isDateMatch = rDate === targetDate;
        const isStaffEntity = !r.entityType || r.entityType.toLowerCase() === "staff";
        if (!isDateMatch || !isStaffEntity) return false;

        const sId = String(s.id || "").trim();
        const sEmpId = String(s.empId || (s as any).employeeId || "").trim();
        const sEmail = String(s.email || "").toLowerCase().trim();

        const rEntityId = String(r.entityId || "").trim();
        const rStaffId = String((r as any).staffId || "").trim();
        const rEmployeeId = String((r as any).employeeId || "").trim();
        const rEmail = String((r as any).email || "").toLowerCase().trim();

        const isIdMatch =
          (sId && (rEntityId === sId || rStaffId === sId || rEmployeeId === sId)) ||
          (sEmpId && (rEntityId === sEmpId || rStaffId === sEmpId || rEmployeeId === sEmpId));

        const isEmailMatch = !!sEmail && !!rEmail && sEmail === rEmail;

        return isIdMatch || isEmailMatch;
      });

      // 3. Check if this staff is the logged in teacher and has checked in today
      const isCurrentLoggedInTeacher =
        (dbTeacher && (String(dbTeacher.id) === String(s.id) || String(dbTeacher.empId) === String(s.empId))) ||
        (user?.email && s.email && user.email.toLowerCase().trim() === s.email.toLowerCase().trim());

      const defCheckInTime = schoolProfile?.staffCheckInTime || "08:30 AM";

      if (approvedLeave) {
        newStatusMap[s.id] = approvedLeave.isHalfDay ? "HalfDay" : "Leave";
        newInTimeMap[s.id] = "";
        newOutTimeMap[s.id] = "";
        newRemarksMap[s.id] = approvedLeave.reason
          ? `Approved Leave: ${approvedLeave.leaveTypeName || "Leave"} (${approvedLeave.reason})`
          : `Approved Leave: ${approvedLeave.leaveTypeName || "Leave"}`;
      } else if (existing) {
        const normSt = normalizeStatus(existing.status);
        newStatusMap[s.id] = normSt;
        newInTimeMap[s.id] = existing.inTime || (normSt === "Present" || normSt === "Late" ? defCheckInTime : "");
        newOutTimeMap[s.id] = existing.outTime || "";
        newRemarksMap[s.id] = existing.remarks || "";
      } else if (isToday && isCurrentLoggedInTeacher && persCheckInTime) {
        newStatusMap[s.id] = todayStatus === "Late" ? "Late" : "Present";
        newInTimeMap[s.id] = formatDisplayTime(persCheckInTime);
        newOutTimeMap[s.id] = persCheckOutTime ? formatDisplayTime(persCheckOutTime) : "";
        newRemarksMap[s.id] = persCheckOutTime ? "Checked In & Out" : "Checked In Online";
      } else {
        newStatusMap[s.id] = "Absent";
        newInTimeMap[s.id] = "";
        newOutTimeMap[s.id] = "";
        newRemarksMap[s.id] = isToday ? "Not Checked In" : "Absent";
      }
    });

    setAttendanceMap(newStatusMap);
    setInTimeMap(newInTimeMap);
    setOutTimeMap(newOutTimeMap);
    setRemarksMap(newRemarksMap);
    setOverrideLeaveSet(new Set());
  }, [
    attendanceDate,
    staff,
    attendanceHash,
    leaveApplications,
    normalizeStatus,
    isDirty,
    persCheckInTime,
    persCheckOutTime,
    todayStatus,
    teacher,
    dbTeacher,
    todayStr
  ]);

  // Reset dirty status on view filter changes to fetch fresh sync data
  useEffect(() => {
    setIsDirty(false);
  }, [attendanceDate, activeTab, teachingDept, nonTeachingDept, viewMode]);

  // Filter Active Teaching Staff
  const teachingStaffList = useMemo(() => {
    return (staff || []).filter((s) => {
      if (!isTeachingStaff(s) || s.status === "Inactive") return false;
      if (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && selectedBranch !== "All Campuses") {
        const staffBranch = (s.branch || "").trim().toLowerCase();
        if (staffBranch && staffBranch !== selectedBranch.trim().toLowerCase()) return false;
      }
      const deptMatch =
        teachingDept === "All" ||
        (s.department || "").toLowerCase() === teachingDept.toLowerCase();
      const desMatch =
        teachingDesignation === "All" ||
        (s.designation || "").toLowerCase() ===
          teachingDesignation.toLowerCase();
      const q = teachingQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.empId || "").toLowerCase().includes(q);
      return deptMatch && desMatch && searchMatch;
    });
  }, [staff, selectedBranch, teachingDept, teachingDesignation, teachingQuery]);

  // Filter Active Non-Teaching Staff
  const nonTeachingStaffList = useMemo(() => {
    const driverItems = (driverMasters || []).map(d => ({
      id: String(d.id),
      empId: d.employeeId || String(d.id),
      firstName: d.driverName,
      lastName: '',
      designation: 'Driver',
      department: 'Transport Dept',
      email: d.email || '',
      phone: d.mobileNumber || '',
      status: d.status || 'Active',
      employeeCategory: 'Non-Teaching',
      branch: (d as any).branch || (selectedBranch && selectedBranch !== 'All' && selectedBranch !== 'All Branches' ? selectedBranch : '') || ''
    }));

    const combinedStaff = [...staff];
    driverItems.forEach(dItem => {
      const exists = combinedStaff.some(s =>
        String(s.id) === String(dItem.id) ||
        String(s.empId) === String(dItem.empId) ||
        (s.email && dItem.email && s.email.toLowerCase() === dItem.email.toLowerCase()) ||
        `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === dItem.firstName.toLowerCase().trim()
      );
      if (!exists) {
        combinedStaff.push(dItem as any);
      }
    });

    return combinedStaff.filter((s) => {
      if (isTeachingStaff(s) || s.status === "Inactive") return false;
      if (selectedBranch && selectedBranch !== "All" && selectedBranch !== "All Branches" && selectedBranch !== "All Campuses") {
        const staffBranch = (s.branch || "").trim().toLowerCase();
        if (staffBranch && staffBranch !== selectedBranch.trim().toLowerCase()) return false;
      }
      const deptMatch =
        nonTeachingDept === "All" ||
        (s.department || "").toLowerCase() === nonTeachingDept.toLowerCase();
      const desMatch =
        nonTeachingDesignation === "All" ||
        (s.designation || "").toLowerCase() ===
          nonTeachingDesignation.toLowerCase();
      const q = nonTeachingQuery.toLowerCase().trim();
      const searchMatch =
        !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.empId || "").toLowerCase().includes(q);
      return deptMatch && desMatch && searchMatch;
    });
  }, [staff, driverMasters, selectedBranch, nonTeachingDept, nonTeachingDesignation, nonTeachingQuery]);

  // Active working staff list for currently selected tab
  const currentTabStaffList =
    activeTab === "teaching" ? teachingStaffList : nonTeachingStaffList;

  // Daily Pagination Calculations
  const paginatedDailyStaffList = useMemo(() => {
    const start = (dailyPage - 1) * pageSize;
    return currentTabStaffList.slice(start, start + pageSize);
  }, [currentTabStaffList, dailyPage, pageSize]);

  // Live Summary Metrics Computation
  const liveSummaryStats = useMemo(() => {
    let total = currentTabStaffList.length;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let halfDay = 0;

    currentTabStaffList.forEach((s) => {
      const rawSt = attendanceMap[s.id];
      const st = normalizeStatus(rawSt);
      if (st === "Present" || st === "Late") present++;
      else if (st === "Absent") absent++;
      else if (st === "Leave") leave++;
      else if (st === "HalfDay") halfDay++;
    });

    return { total, present, absent, leave, halfDay };
  }, [currentTabStaffList, attendanceMap, normalizeStatus]);

  // Search Input Validation State
  const currentSearchQuery = activeTab === "teaching" ? teachingQuery : nonTeachingQuery;
  const isSearchQueryEntered = currentSearchQuery.trim().length > 0;
  const hasInvalidSearchChars = /[^a-zA-Z0-9\s\-_./]/.test(currentSearchQuery.trim());
  const isSearchUnmatched = isSearchQueryEntered && currentTabStaffList.length === 0;
  const hasStaffSearchError = isSearchQueryEntered && (hasInvalidSearchChars || isSearchUnmatched);

  // Status Change Handler with Leave Locks & Permission Checks
  const handleStatusChange = (
    empId: string,
    newStatus: "Present" | "Absent" | "Late" | "HalfDay" | "Leave",
  ) => {
    const approvedLeave = getApprovedLeave(empId, attendanceDate);

    if (approvedLeave && !overrideLeaveSet.has(empId) && !canOverrideLeave) {
      addToast(
        "warning",
        "Leave Locked",
        `Cannot override approved leave for employee without HR/Admin privileges.`,
      );
      return;
    }

    setIsDirty(true);
    setAttendanceMap((prev) => ({ ...prev, [empId]: newStatus }));

    // Set default times based on status
    if (newStatus === "Present" || newStatus === "Late") {
      setInTimeMap((prev) => ({
        ...prev,
        [empId]:
          prev[empId] && prev[empId] !== "00:00" ? prev[empId] : (schoolProfile?.staffCheckInTime || "08:30 AM"),
      }));
      setOutTimeMap((prev) => ({
        ...prev,
        [empId]:
          prev[empId] && prev[empId] !== "00:00" ? prev[empId] : (schoolProfile?.staffCheckOutTime || "05:00 PM"),
      }));
    } else {
      setInTimeMap((prev) => ({ ...prev, [empId]: "" }));
      setOutTimeMap((prev) => ({ ...prev, [empId]: "" }));
    }
  };

  // Quick Bulk Actions Handler
  const handleBulkAction = (
    bulkStatus: "Present" | "Absent" | "Leave" | "Clear",
  ) => {
    if (isFutureDate) {
      addToast(
        "error",
        "Invalid Action",
        "Cannot mark attendance for future dates.",
      );
      return;
    }

    setIsDirty(true);
    setAttendanceMap((prev) => {
      const next = { ...prev };
      currentTabStaffList.forEach((s) => {
        const approvedLeave = getApprovedLeave(s.id, attendanceDate);
        if (!approvedLeave || overrideLeaveSet.has(s.id) || canOverrideLeave) {
          if (bulkStatus === "Clear") {
            delete next[s.id];
          } else {
            next[s.id] = bulkStatus;
          }
        }
      });
      return next;
    });

    if (bulkStatus === "Present") {
      setInTimeMap((prev) => {
        const next = { ...prev };
        currentTabStaffList.forEach((s) => {
          next[s.id] = schoolProfile?.staffCheckInTime || "08:30 AM";
        });
        return next;
      });
      setOutTimeMap((prev) => {
        const next = { ...prev };
        currentTabStaffList.forEach((s) => {
          next[s.id] = schoolProfile?.staffCheckOutTime || "05:00 PM";
        });
        return next;
      });
    } else {
      setInTimeMap((prev) => {
        const next = { ...prev };
        currentTabStaffList.forEach((s) => {
          next[s.id] = "";
        });
        return next;
      });
      setOutTimeMap((prev) => {
        const next = { ...prev };
        currentTabStaffList.forEach((s) => {
          next[s.id] = "";
        });
        return next;
      });
    }

    const actionMsg =
      bulkStatus === "Clear"
        ? `Cleared attendance selection for ${currentTabStaffList.length} visible staff.`
        : `Applied '${bulkStatus}' status to ${currentTabStaffList.length} visible staff.`;

    addToast("info", "Bulk Action Applied", actionMsg);
  };

  // Toggle Override Leave Lock
  const handleToggleOverrideLeave = (empId: string) => {
    if (!canOverrideLeave) {
      addToast(
        "error",
        "Permission Denied",
        "Only HR and Administrators can unlock approved leave statuses.",
      );
      return;
    }

    setOverrideLeaveSet((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  // Save Attendance Execution
  const executeSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const activeStaffCategoryList = (staff || []).filter((s) => {
        const isTeacher = isTeachingStaff(s);
        const isCorrectCategory = activeTab === "teaching" ? isTeacher : !isTeacher;
        return isCorrectCategory && s.status !== "Inactive";
      });

      const recordsToSave: DailyAttendance[] = activeStaffCategoryList.map((s) => ({
        date: attendanceDate,
        entityType: "Staff",
        entityId: s.id,
        status: normalizeStatus(attendanceMap[s.id]),
        inTime: inTimeMap[s.id] || "",
        outTime: outTimeMap[s.id] || "",
        department: s.department || "",
        designation: s.designation || "",
        remarks: remarksMap[s.id] || "",
      }));

      const success = await markAttendance(recordsToSave);
      if (success) {


        setIsDirty(false);
        addToast(
          "success",
          "Attendance Saved Successfully",
          `Saved daily attendance logs for ${recordsToSave.length} ${activeTab === "teaching" ? "teaching" : "non-teaching"} staff members on ${attendanceDate}.`,
        );
        if (fetchDailyAttendance) {
          const activeDept = activeTab === "teaching" ? teachingDept : nonTeachingDept;
          fetchDailyAttendance(attendanceDate, activeDept);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save Attendance Handler
  const handleSaveAttendance = async () => {
    if (!canMarkAttendance) {
      addToast(
        "error",
        "Access Denied",
        "You do not have permission to log or edit employee attendance.",
      );
      return;
    }

    if (isFutureDate) {
      addToast(
        "error",
        "Future Date Restriction",
        "Attendance cannot be recorded for future dates.",
      );
      return;
    }

    // Check if existing records will be overwritten
    const hasExisting = (attendance || []).some(
      (r) => r.entityType === "Staff" && r.date === attendanceDate,
    );
    if (hasExisting) {
      setShowSaveConfirm(true);
    } else {
      executeSaveAttendance();
    }
  };

  // Weekend Check
  const getIsWeekend = (dateStr: string) => {
    const day = new Date(dateStr).getDay();
    try {
      const stored = localStorage.getItem('edu_db_weekend_days');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.includes(day);
        }
      }
    } catch (e) {
      console.error("Error parsing weekend days settings:", e);
    }
    return day === 0; // 0 = Sunday
  };

  // Holiday Check
  const getIsHoliday = (checkDate: string, s: any) => {
    const isTeacher = isTeachingStaff(s);
    const targetAudience = isTeacher ? "Teaching Staff" : "Non-Teaching Staff";

    const inHolidays = (holidays || []).some(
      (h) => {
        if (h.status === "Inactive") return false;

        const isDateMatch =
          checkDate >= h.startDate.split("T")[0] &&
          checkDate <= h.endDate.split("T")[0];

        if (!isDateMatch) return false;

        // Check if holiday is applicable to this specific employee group
        const app = h.applicableTo;
        return !app || app === "All" || app === targetAudience;
      }
    );
    if (inHolidays) return true;

    return (schoolEvents || []).some((e) => {
      if (e.status === "Cancelled") return false;
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      const cat = (e.category || "").toLowerCase();
      const isHolidayEvent =
        title.includes("holiday") ||
        title.includes("vacation") ||
        title.includes("festival") ||
        desc.includes("holiday") ||
        desc.includes("vacation") ||
        desc.includes("festival") ||
        cat.includes("holiday") ||
        cat.includes("vacation") ||
        cat.includes("festival");

      if (!isHolidayEvent) return false;

      const start = e.startDate.split("T")[0];
      const end = e.endDate.split("T")[0];
      return checkDate >= start && checkDate <= end;
    });
  };

  // Monthly Attendance Cell Click Handler
  const handleCellClick = (staffId: string, dateStr: string) => {
    if (!isEditingMonthly) {
      addToast(
        "warning",
        "Edit Mode Required",
        "Please click 'Edit Attendance' at the top right of the register to modify attendance."
      );
      return;
    }

    // Do not edit future days or days before joining
    const isFuture = dateStr > todayStr;
    const s = staff.find((x) => x.id === staffId);
    const isBeforeJoining = s?.joiningDate && dateStr < s.joiningDate;
    if (isFuture || isBeforeJoining) {
      addToast(
        "info",
        "Invalid Action",
        "Cannot mark attendance for upcoming days or days before the employee's joining date."
      );
      return;
    }

    const key = `${staffId}_${dateStr}`;
    const localEdit = monthlyEditsMap[key];
    const record = (attendance || []).find(
      (r) =>
        r.entityType === "Staff" &&
        r.entityId === staffId &&
        r.date === dateStr
    );
    const currentStatus =
      localEdit !== undefined
        ? localEdit
        : record
        ? record.status
        : undefined;

    // Cycle: default/Present -> Absent -> Leave -> HalfDay -> Present
    let nextStatus: "Present" | "Absent" | "Leave" | "HalfDay" = "Present";
    if (currentStatus === undefined || currentStatus === "Present") nextStatus = "Absent";
    else if (currentStatus === "Absent") nextStatus = "Leave";
    else if (currentStatus === "Leave") nextStatus = "HalfDay";
    else if (currentStatus === "HalfDay" || currentStatus === "Late")
      nextStatus = "Present";

    setMonthlyEditsMap((prev) => ({
      ...prev,
      [key]: nextStatus,
    }));
  };

  const handleCancelMonthlyEditing = () => {
    setMonthlyEditsMap({});
    setIsEditingMonthly(false);
  };

  const [isSavingMonthly, setIsSavingMonthly] = useState(false);

  const handleSaveMonthlyChanges = async () => {
    const editKeys = Object.keys(monthlyEditsMap);
    if (editKeys.length === 0) {
      setIsEditingMonthly(false);
      return;
    }

    setIsSavingMonthly(true);
    try {
      // 1. Group edits by Date
      const editsByDate: Record<
        string,
        Record<string, "Present" | "Absent" | "Leave" | "HalfDay">
      > = {};
      editKeys.forEach((key) => {
        const [staffId, dateStr] = key.split("_");
        if (!editsByDate[dateStr]) {
          editsByDate[dateStr] = {};
        }
        editsByDate[dateStr][staffId] = monthlyEditsMap[key];
      });

      // 2. Prepare save promises for each date
      const savePromises = Object.entries(editsByDate).map(
        async ([dateStr, staffEdits]) => {
          // Find all active staff in the current category
          const activeStaffListForCategory = (staff || []).filter((s) => {
            const isTeacher = isTeachingStaff(s);
            const isCorrectCategory =
              activeTab === "teaching" ? isTeacher : !isTeacher;
            return isCorrectCategory && s.status !== "Inactive";
          });

          // Map them to DailyAttendance[] (only include staff with edits or existing records)
          const recordsToSave: DailyAttendance[] = activeStaffListForCategory
            .filter((s) => {
              const hasEdit = staffEdits[s.id] !== undefined;
              const hasExisting = (attendance || []).some(
                (r) =>
                  r.entityType === "Staff" &&
                  r.entityId === s.id &&
                  r.date === dateStr
              );
              return hasEdit || hasExisting;
            })
            .map((s) => {
              let status = staffEdits[s.id];
              if (status === undefined) {
                const existingRecord = (attendance || []).find(
                  (r) =>
                    r.entityType === "Staff" &&
                    r.entityId === s.id &&
                    r.date === dateStr
                );
                status = existingRecord
                  ? (existingRecord.status as any)
                  : "Present";
              }

              // Fetch the current saved in/out times or use defaults
              const existingRecordForTimes = (attendance || []).find(
                (r) =>
                  r.entityType === "Staff" &&
                  r.entityId === s.id &&
                  r.date === dateStr
              );
              const inTime =
                existingRecordForTimes?.inTime ||
                ((status as string) === "Present" || (status as string) === "Late"
                  ? (schoolProfile?.staffCheckInTime || "08:30 AM")
                  : "");
              const outTime =
                existingRecordForTimes?.outTime ||
                ((status as string) === "Present" || (status as string) === "Late"
                  ? (schoolProfile?.staffCheckOutTime || "05:00 PM")
                  : "");
              const remarks = existingRecordForTimes?.remarks || "";

              return {
                date: dateStr,
                entityType: "Staff" as const,
                entityId: s.id,
                status: normalizeStatus(status),
                inTime,
                outTime,
                department: s.department || "",
                designation: s.designation || "",
                remarks,
              };
            });

          // Call markAttendance context function
          return markAttendance(recordsToSave);
        }
      );

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(Boolean);

      if (allSuccess) {
        addToast(
          "success",
          "Monthly Attendance Saved",
          `Successfully saved changes for ${
            Object.keys(editsByDate).length
          } dates.`
        );
        // Refresh monthly attendance
        if (fetchMonthlyAttendance) {
          const activeDept =
            activeTab === "teaching" ? teachingDept : nonTeachingDept;
          fetchMonthlyAttendance(regMonth + 1, regYear, activeDept);
        }
        setMonthlyEditsMap({});
        setIsEditingMonthly(false);
      }
    } catch (error) {
      console.error("Error saving monthly attendance:", error);
      addToast(
        "danger",
        "Save Failed",
        "Failed to save monthly attendance updates."
      );
    } finally {
      setIsSavingMonthly(false);
    }
  };

  // Monthly Register Computations (Tab 3)
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const daysInSelectedMonth = new Date(regYear, regMonth + 1, 0).getDate();

  const registerDaysList = useMemo(() => {
    if (regFromDate && regToDate) {
      const start = new Date(regFromDate);
      const end = new Date(regToDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const list: {
          dateStr: string;
          dayNum: number;
          displayHeader: string;
          dayOfWeek: string;
        }[] = [];
        const current = new Date(start);

        const isMultiMonth =
          start.getMonth() !== end.getMonth() ||
          start.getFullYear() !== end.getFullYear();

        let guard = 0;
        while (current <= end && guard < 366) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, "0");
          const d = String(current.getDate()).padStart(2, "0");
          const dateStr = `${y}-${m}-${d}`;

          const monthShort = current.toLocaleString("en-US", {
            month: "short",
          });
          const displayHeader = isMultiMonth
            ? `${d} ${monthShort}`
            : `${current.getDate()}`;

          const dayOfWeek = current.toLocaleString("en-US", {
            weekday: "short",
          }).toUpperCase();

          list.push({ dateStr, dayNum: current.getDate(), displayHeader, dayOfWeek });

          current.setDate(current.getDate() + 1);
          guard++;
        }
        return list;
      }
    }

    // Default to selected month
    const daysCount = new Date(regYear, regMonth + 1, 0).getDate();
    const list: { dateStr: string; dayNum: number; displayHeader: string; dayOfWeek: string }[] =
      [];
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${regYear}-${String(regMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = new Date(regYear, regMonth, d).toLocaleString("en-US", {
        weekday: "short",
      }).toUpperCase();
      list.push({ dateStr, dayNum: d, displayHeader: `${d}`, dayOfWeek });
    }
    return list;
  }, [regYear, regMonth, regFromDate, regToDate]);

  const registerStaffList = useMemo(() => {
    return (staff || []).filter((s) => {
      const isTeacher = isTeachingStaff(s);
      if (activeTab === "teaching" && !isTeacher) return false;
      if (activeTab === "non-teaching" && isTeacher) return false;

      const activeDept =
        activeTab === "teaching" ? teachingDept : nonTeachingDept;
      if (
        activeDept !== "All" &&
        (s.department || "").toLowerCase() !== activeDept.toLowerCase()
      )
        return false;

      const activeDesig =
        activeTab === "teaching" ? teachingDesignation : nonTeachingDesignation;
      if (
        activeDesig !== "All" &&
        (s.designation || "").toLowerCase() !== activeDesig.toLowerCase()
      )
        return false;

      const q = (activeTab === "teaching" ? teachingQuery : nonTeachingQuery).toLowerCase().trim();
      const searchMatch =
        !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.empId || "").toLowerCase().includes(q);
      if (!searchMatch) return false;

      if (regEmpId !== "All" && s.id !== regEmpId) return false;
      return s.status === "Active";
    });
  }, [
    staff,
    activeTab,
    teachingDept,
    nonTeachingDept,
    teachingDesignation,
    nonTeachingDesignation,
    teachingQuery,
    nonTeachingQuery,
    regEmpId,
  ]);

  // Monthly Pagination Calculations
  const paginatedMonthlyStaffList = useMemo(() => {
    const start = (monthlyPage - 1) * pageSize;
    return registerStaffList.slice(start, start + pageSize);
  }, [registerStaffList, monthlyPage, pageSize]);

  // Export Report Handler
  const handleExportReport = () => {
    if (!dateMode || dateMode === "Select") {
      addToast("warning", "Select Date Mode", "Please select a Date Mode first to export attendance reports.");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      try {
        let excelRows: any[][] = [];
        let filename = "";
        let sheetName = "Attendance";

        if (viewMode === "daily") {
          filename = `Staff_Daily_Attendance_${formatToDDMMYYYY(attendanceDate, "-")}`;
          sheetName = "Daily Attendance";
          const headers = [
            "Attendance Date",
            "Employee ID",
            "Employee Name",
            "Staff Category",
            "Department",
            "Designation",
            "Status",
            "In Time",
            "Out Time",
            "Remarks",
          ];
          excelRows.push(headers);

          currentTabStaffList.forEach((s) => {
            const approvedLeave =
              getApprovedLeave(s.id, attendanceDate) ||
              (s.empId ? getApprovedLeave(s.empId, attendanceDate) : undefined);
            const status = String(
              attendanceMap[s.id] || (approvedLeave ? "Leave" : "Absent")
            );
            const inTime = String(inTimeMap[s.id] || "");
            const outTime = String(outTimeMap[s.id] || "");
            const remarks = String(remarksMap[s.id] || "");

            const row = [
              formatToDDMMYYYY(attendanceDate, "-"),
              s.empId || s.id,
              `${s.firstName} ${s.lastName}`,
              activeTab === "teaching" ? "Teaching Staff" : "Non-Teaching Staff",
              s.department || "General",
              s.designation || "Staff",
              status,
              inTime,
              outTime,
              remarks,
            ];
            excelRows.push(row);
          });
        } else {
          const rangeLabel =
            regFromDate && regToDate
              ? `${formatToDDMMYYYY(regFromDate, "-")}_to_${formatToDDMMYYYY(regToDate, "-")}`
              : `${monthNames[regMonth]}_${regYear}`;
          filename = `Staff_Attendance_Register_${rangeLabel}`;
          sheetName = "Monthly Register";

          const dateHeaders = registerDaysList.map(
            (item) => item.displayHeader,
          );
          const headers = [
            "Employee ID",
            "Employee Name",
            "Staff Category",
            "Department",
            "Designation",
            ...dateHeaders,
            "Present (P)",
            "Absent (A)",
            "Leave (L)",
            "Attendance %",
          ];
          excelRows.push(headers);

          registerStaffList.forEach((s) => {
            let pCount = 0;
            let aCount = 0;
            let lCount = 0;
            let hdCount = 0;

            const dayStatuses = registerDaysList.map((item) => {
              const record = (attendance || []).find(
                (r) =>
                  r.entityType === "Staff" &&
                  r.entityId === s.id &&
                  r.date === item.dateStr,
              );
              let code = "-";
              if (record) {
                if (record.status === "Present") {
                  code = "P";
                  pCount++;
                } else if (record.status === "Absent") {
                  code = "A";
                  aCount++;
                } else if (record.status === "Leave") {
                  code = "L";
                  lCount++;
                } else if (
                  record.status === "HalfDay" ||
                  record.status === "Late"
                ) {
                  code = "HD";
                  pCount += 0.5;
                  hdCount++;
                }
              } else {
                const isBeforeJoining = s.joiningDate && item.dateStr < s.joiningDate;
                const isHoliday = getIsHoliday(item.dateStr, s);
                const isWeekend = getIsWeekend(item.dateStr);
                if (isBeforeJoining) code = "-";
                else if (isHoliday) code = "H";
                else if (isWeekend) code = "W";
                else code = "-";
              }
              return code;
            });

            const totalRecordedDays = pCount + aCount + lCount + hdCount;
            const pct =
              totalRecordedDays > 0
                ? Math.round(((pCount + hdCount * 0.5) / totalRecordedDays) * 100)
                : 0;

            const row = [
              s.empId || s.id,
              `${s.firstName} ${s.lastName}`,
              activeTab === "teaching" ? "Teaching Staff" : "Non-Teaching Staff",
              s.department || "General",
              s.designation || "Staff",
              ...dayStatuses,
              pCount,
              aCount,
              lCount,
              `${pct}%`,
            ];
            excelRows.push(row);
          });
        }

        if (excelRows.length <= 1) {
          addToast(
            "warning",
            "No Records to Export",
            "There are no staff records available for the selected criteria.",
          );
          return;
        }

        exportToExcel(excelRows, filename, sheetName);

        addToast(
          "success",
          "Report Exported Successfully",
          `Downloaded ${filename}.xlsx with auto-fitted columns.`,
        );
      } catch (err: any) {
        console.error("Export failed:", err);
        addToast(
          "error",
          "Export Failed",
          err.message || "An unexpected error occurred during export."
        );
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  if (isPersonalView) return personalView;

  return (
    <div className="space-y-6 animate-in fade-in text-xs pb-12">
      {/* Title & Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Staff Attendance
          </h2>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          disabled={isExporting || !dateMode || dateMode === "Select"}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? "Downloading..." : "Download"}
        </button>
      </div>

      {/* Main Module Tabs (Teaching, Non-Teaching) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("teaching")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === "teaching"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Users className="w-4 h-4" /> Teaching Staff
        </button>

        <button
          onClick={() => setActiveTab("non-teaching")}
          className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all ${
            activeTab === "non-teaching"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Building2 className="w-4 h-4" /> Non-Teaching Staff
        </button>
      </div>

      {/* Control Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${dateMode === 'Custom Range' ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-5'} gap-3 items-start`}>
          {/* Date Mode */}
          <div>
            <select
              value={dateMode || ""}
              onChange={(e) => setDateMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="">Select Mode</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          {/* Date Selection */}
          <div className={dateMode === "Custom Range" ? "sm:col-span-2 lg:col-span-2 xl:col-span-2" : ""}>
            {(!dateMode || dateMode === "Select") && (
              <input
                type="text"
                disabled
                placeholder="Select Date Mode"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-400 cursor-not-allowed"
              />
            )}
            {dateMode === "Daily" && (
              <DateInput
                value={attendanceDate}
                min={activeAYInfo?.startDate}
                max={activeAYInfo?.endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeAYInfo && val) {
                    if (val < activeAYInfo.startDate || val > activeAYInfo.endDate) {
                      addToast("warning", "Date Out of Academic Year", `Please select a date between ${activeAYInfo.startDate} and ${activeAYInfo.endDate} for academic year ${selectedAcademicYear}.`);
                      return;
                    }
                  }
                  setAttendanceDate(val);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            )}
            {dateMode === "Monthly" && (
              <input
                type="month"
                value={monthInputVal}
                min={activeAYInfo?.minMonth}
                max={activeAYInfo?.maxMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeAYInfo && val) {
                    if (val < activeAYInfo.minMonth || val > activeAYInfo.maxMonth) {
                      addToast("warning", "Month Out of Academic Year", `Please select a month between ${activeAYInfo.minMonth} and ${activeAYInfo.maxMonth} for academic year ${selectedAcademicYear}.`);
                      return;
                    }
                  }
                  handleMonthInputChange(val);
                }}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
              />
            )}
            {dateMode === "Custom Range" && (
              <div className="flex items-center gap-2">
                <DateInput
                  value={regFromDate}
                  min={activeAYInfo?.startDate}
                  max={activeAYInfo?.endDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  placeholder="From"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-slate-400 font-bold">-</span>
                <DateInput
                  value={regToDate}
                  min={activeAYInfo?.startDate}
                  max={activeAYInfo?.endDate}
                  onChange={(e) => setRegToDate(e.target.value)}
                  placeholder="To"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Department */}
          <div>
            <select
              value={activeTab === "teaching" ? teachingDept : nonTeachingDept}
              onChange={(e) =>
                activeTab === "teaching"
                  ? setTeachingDept(e.target.value)
                  : setNonTeachingDept(e.target.value)
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="All">All Departments</option>
              {(activeTab === "teaching" ? teachingDepts : nonTeachingDepartments).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div>
            <select
              value={activeTab === "teaching" ? teachingDesignation : nonTeachingDesignation}
              onChange={(e) =>
                activeTab === "teaching"
                  ? setTeachingDesignation(e.target.value)
                  : setNonTeachingDesignation(e.target.value)
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="All">All Designations</option>
              {(activeTab === "teaching" ? teachingDesignations : nonTeachingDesignations).map((des) => (
                <option key={des} value={des}>
                  {des}
                </option>
              ))}
            </select>
          </div>

          {/* Search Staff */}
          <div>
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${hasStaffSearchError ? "text-red-500" : "text-slate-400"}`} />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={currentSearchQuery}
                onChange={(e) =>
                  activeTab === "teaching"
                    ? setTeachingQuery(e.target.value)
                    : setNonTeachingQuery(e.target.value)
                }
                className={`w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-semibold outline-none transition-colors ${
                  hasStaffSearchError
                    ? "border-red-500 text-red-700 dark:text-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-brand-500"
                }`}
              />
            </div>
            {hasStaffSearchError && (
              <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Invalid input, please enter a valid staff name/ID</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* PROMPT TO SELECT DATE MODE */}
      {(activeTab === "teaching" || activeTab === "non-teaching") && (!dateMode || dateMode === "Select") && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Select Date Mode
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please choose a Date Mode (Daily, Monthly, or Custom Range) from the dropdown above to view and mark staff attendance.
          </p>
        </div>
      )}

      {/* DAILY ATTENDANCE MARKING (TEACHING & NON-TEACHING) */}
      {(activeTab === "teaching" || activeTab === "non-teaching") &&
        viewMode === "daily" && (
          <div className="space-y-5">
            {/* Live Attendance Summary Card */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  Attendance Summary
                  <span className="text-[10px] font-bold text-slate-400 normal-case ml-1">
                    ({attendanceDate})
                  </span>
                </h4>

                {/* Edit & Mode Control Buttons (Top Right of Container) */}
                {canMarkAttendance && !isFutureDate && (
                  <div className="flex items-center gap-2">
                    {!isEditingDaily ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingDaily(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Attendance
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingDaily(false);
                            setIsDirty(false);
                            // Reset local attendance maps to match the database
                            if (fetchDailyAttendance) {
                              const activeDept = activeTab === "teaching" ? teachingDept : nonTeachingDept;
                              fetchDailyAttendance(attendanceDate, activeDept);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveAttendance}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-55"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Save Changes
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Total Employees
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {liveSummaryStats.total}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                    Present
                  </p>
                  <p className="text-lg font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {liveSummaryStats.present}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                  <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">
                    Absent
                  </p>
                  <p className="text-lg font-black text-rose-800 dark:text-rose-300 mt-0.5">
                    {liveSummaryStats.absent}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-center">
                  <p className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase">
                    On Leave
                  </p>
                  <p className="text-lg font-black text-sky-800 dark:text-sky-300 mt-0.5">
                    {liveSummaryStats.leave}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                    Half Day
                  </p>
                  <p className="text-lg font-black text-amber-800 dark:text-amber-300 mt-0.5">
                    {liveSummaryStats.halfDay}
                  </p>
                </div>
              </div>

              {/* Quick Bulk Actions (only visible in edit mode) */}
              {isEditingDaily && canMarkAttendance && !isFutureDate && (
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Bulk Actions:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkAction("Present")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 font-bold text-[11px] transition-colors"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAction("Absent")}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 hover:bg-rose-200 font-bold text-[11px] transition-colors"
                    >
                      Mark All Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAction("Leave")}
                      className="px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 hover:bg-sky-200 font-bold text-[11px] transition-colors"
                    >
                      Mark All Leave
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkAction("Clear")}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-[11px] transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>



            {/* Attendance Grid Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0 text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th
                        className="py-3.5 px-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                        style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                      >
                        Employee ID
                      </th>
                      <th
                        className="py-3.5 px-4 sticky left-[160px] bg-slate-100 dark:bg-slate-800 z-20 min-w-[200px] max-w-[200px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                        style={{ left: 160, width: 200, minWidth: 200, maxWidth: 200 }}
                      >
                        Employee Name
                      </th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-left">Department</th>
                      <th className="py-3.5 px-4 whitespace-nowrap text-left">Designation</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Attendance Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">In Time</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Out Time</th>
                      <th className="py-3.5 px-4 min-w-[260px] whitespace-nowrap text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {currentTabStaffList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-slate-400 italic"
                        >
                          {hasStaffSearchError ? (
                            <div className="inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 gap-1.5 max-w-md mx-auto shadow-sm not-italic">
                              <AlertCircle className="w-6 h-6 shrink-0" />
                              <p className="text-xs font-bold">Invalid input, please enter a valid staff name/ID</p>
                              <p className="text-[11px] text-red-500/80 font-medium">No employee records match "{currentSearchQuery}". Please check the spelling or employee ID.</p>
                            </div>
                          ) : (
                            "No employees found matching the filter criteria."
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedDailyStaffList.map((s) => {
                        const approvedLeave =
                          getApprovedLeave(s.id, attendanceDate) ||
                          (s.empId ? getApprovedLeave(s.empId, attendanceDate) : undefined);
                        const isLeaveLocked =
                          !!approvedLeave && !overrideLeaveSet.has(s.id);
                        const currentStatus =
                          attendanceMap[s.id] || (approvedLeave ? "Leave" : "Absent");

                        return (
                          <tr
                            key={s.id}
                            className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100"
                          >
                            {/* Emp ID */}
                            <td
                              className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                              style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                            >
                              {s.empId || s.id}
                            </td>

                            {/* Employee Name */}
                            <td
                              className="py-3 px-4 sticky left-[160px] bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[200px] min-w-[200px] max-w-[200px] border-b border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                              style={{ left: 160, width: 200, minWidth: 200, maxWidth: 200 }}
                            >
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white">
                                  {s.firstName} {s.lastName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {s.email}
                                </p>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                              {s.department || "General"}
                            </td>

                            {/* Designation */}
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                              {s.designation || "Staff"}
                            </td>

                            {/* Attendance Status Buttons */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {(
                                  [
                                    "Present",
                                    "Absent",
                                    "HalfDay",
                                    "Leave",
                                  ] as const
                                ).map((st) => {
                                  const hasCheckedInTime = Boolean(inTimeMap[s.id] && inTimeMap[s.id].trim() !== "" && inTimeMap[s.id].trim() !== "--:--");
                                  const isSelected = currentStatus === st || (st === "Present" && (currentStatus === "Late" || (hasCheckedInTime && currentStatus !== "Absent" && currentStatus !== "Leave")));
                                  let activeStyle = "";
                                  if (st === "Present")
                                    activeStyle =
                                      "bg-emerald-600 text-white font-black border-emerald-600 shadow-sm";
                                  else if (st === "Absent")
                                    activeStyle =
                                      "bg-rose-600 text-white font-black border-rose-600 shadow-sm";
                                  else if (st === "HalfDay")
                                    activeStyle =
                                      "bg-amber-600 text-white font-black border-amber-600 shadow-sm";
                                  else if (st === "Leave")
                                    activeStyle =
                                      "bg-sky-600 text-white font-black border-sky-600 shadow-sm";

                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      disabled={
                                        !isEditingDaily ||
                                        isLeaveLocked ||
                                        !canMarkAttendance ||
                                        isFutureDate
                                      }
                                      onClick={() =>
                                        handleStatusChange(s.id, st)
                                      }
                                      className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all font-bold ${
                                        isSelected
                                          ? activeStyle
                                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      {st === "HalfDay" ? "Half Day" : st}
                                    </button>
                                  );
                                })}

                                {/* Approved Leave Badge & Unlock Button */}
                                {approvedLeave && (
                                  <div className="flex items-center gap-1 ml-1.5">
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">
                                      Approved Leave
                                    </span>
                                    {canOverrideLeave && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleOverrideLeave(s.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-sky-600"
                                        title={
                                          overrideLeaveSet.has(s.id)
                                            ? "Relock Leave Status"
                                            : "Override & Unlock Leave Status"
                                        }
                                      >
                                        {overrideLeaveSet.has(s.id) ? (
                                          <Unlock className="w-3.5 h-3.5 text-rose-500" />
                                        ) : (
                                          <Lock className="w-3.5 h-3.5 text-sky-600" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* In Time */}
                            <td className="py-3 px-4 text-center">
                              <input
                                type="text"
                                disabled={
                                  !isEditingDaily ||
                                  isLeaveLocked ||
                                  !canMarkAttendance ||
                                  isFutureDate ||
                                  currentStatus === "Absent" ||
                                  currentStatus === "Leave"
                                }
                                value={inTimeMap[s.id] || ""}
                                onChange={(e) => {
                                  setInTimeMap({
                                    ...inTimeMap,
                                    [s.id]: e.target.value,
                                  });
                                  setIsDirty(true);
                                }}
                                placeholder="--:--"
                                className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                              />
                            </td>

                            {/* Out Time */}
                            <td className="py-3 px-4 text-center">
                              <input
                                type="text"
                                disabled={
                                  !isEditingDaily ||
                                  isLeaveLocked ||
                                  !canMarkAttendance ||
                                  isFutureDate ||
                                  currentStatus === "Absent" ||
                                  currentStatus === "Leave"
                                }
                                value={outTimeMap[s.id] || ""}
                                onChange={(e) => {
                                  setOutTimeMap({
                                    ...outTimeMap,
                                    [s.id]: e.target.value,
                                  });
                                  setIsDirty(true);
                                }}
                                placeholder="--:--"
                                className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                              />
                            </td>

                            {/* Remarks */}
                            <td className="py-3 px-4 min-w-[260px]">
                              {isEditingDaily ? (
                                <input
                                  type="text"
                                  disabled={!canMarkAttendance || isFutureDate}
                                  value={remarksMap[s.id] || ""}
                                  onChange={(e) => {
                                    setRemarksMap({
                                      ...remarksMap,
                                      [s.id]: e.target.value,
                                    });
                                    setIsDirty(true);
                                  }}
                                  placeholder="Notes..."
                                  className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                                />
                              ) : (() => {
                                const remarkText = remarksMap[s.id] || "";
                                if (!remarkText) {
                                  return <span className="text-slate-400 italic font-semibold">No notes</span>;
                                }
                                if (remarkText.length <= 30) {
                                  return <span className="text-slate-700 dark:text-slate-300 font-semibold">{remarkText}</span>;
                                }
                                const isExpanded = !!expandedRemarks[s.id];
                                return (
                                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    <span>
                                      {isExpanded ? remarkText : `${remarkText.slice(0, 30)}...`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedRemarks({
                                          ...expandedRemarks,
                                          [s.id]: !isExpanded,
                                        })
                                      }
                                      className="ml-1.5 text-brand-600 hover:text-brand-500 font-extrabold underline cursor-pointer inline-block"
                                    >
                                      {isExpanded ? "Show Less" : "Show More"}
                                    </button>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Daily Pagination Controls */}
              {currentTabStaffList.length > 0 && (
                <div className="px-6 pb-4">
                  <Pagination
                    currentPage={dailyPage}
                    totalItems={currentTabStaffList.length}
                    itemsPerPage={pageSize}
                    onPageChange={setDailyPage}
                    onItemsPerPageChange={(n) => {
                      setPageSize(n);
                      setDailyPage(1);
                    }}
                    label="employees"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      {/* MONTHLY ATTENDANCE REGISTER */}
      {(activeTab === "teaching" || activeTab === "non-teaching") &&
        viewMode === "monthly" && (
          <div className="space-y-5">
             {/* Monthly Register Legend & Controls Bar */}
             <div className="glass-card py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                 <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-500/20">
                   P = Present
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-500/20">
                   A = Absent
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 border border-sky-500/20">
                   L = Leave
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-500/20">
                   HD = Half Day
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-500 border border-slate-200/40">
                   W = Weekend
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 border border-amber-500/20">
                   H = Holiday
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-300 border border-slate-200/40">
                   TL = Total Leaves
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-sky-100/50 dark:bg-sky-950/20 text-sky-700 border border-sky-200/40">
                   OL = On Leave
                 </span>
                 <span className="px-2 py-0.5 rounded-lg bg-sky-100/50 dark:bg-sky-950/20 text-sky-700 border border-sky-200/40">
                   UL = Used Leaves
                 </span>
               </div>

               <div className="flex flex-wrap items-center gap-3">
                 {/* Specific Employee Filter */}
                 <div className="flex items-center gap-2">
                   <select
                     value={regEmpId}
                     onChange={(e) => setRegEmpId(e.target.value)}
                     className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                   >
                     <option value="All">All Staff ({registerStaffList.length})</option>
                     {registerStaffList.map((s) => (
                       <option key={s.id} value={s.id}>
                         {s.firstName} {s.lastName}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>

            {/* Monthly Matrix Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                  Monthly Register:{" "}
                  {regFromDate && regToDate
                    ? `Custom Range (${formatToDDMMYYYY(regFromDate, "-")} to ${formatToDDMMYYYY(regToDate, "-")})`
                    : `${monthNames[regMonth]} ${regYear}`}{" "}
                  (
                  {activeTab === "teaching"
                    ? "Teaching Staff"
                    : "Non-Teaching Staff"}
                  )
                </h3>

                {/* Edit Controls (Relocated to right corner of Monthly Register card header) */}
                <div className="flex items-center gap-2">
                  {isEditingMonthly ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelMonthlyEditing}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingMonthly}
                        onClick={handleSaveMonthlyChanges}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-55"
                      >
                        {isSavingMonthly ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingMonthly(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Attendance
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-separate border-spacing-0 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 font-bold uppercase">
                      <th
                        className="py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                        style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                      >
                        Employee ID
                      </th>
                      <th
                        className="py-2.5 px-3 sticky left-[160px] bg-slate-100 dark:bg-slate-800 z-20 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                        style={{ left: 160, width: 180, minWidth: 180, maxWidth: 180 }}
                      >
                        Employee Name
                      </th>
                      {registerDaysList.map((item, idx) => (
                        <th
                          key={idx}
                          className="py-2.5 px-1 text-center min-w-[36px] font-mono whitespace-nowrap"
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-extrabold text-[10px] text-slate-800 dark:text-slate-200">
                              {item.displayHeader}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">
                              {item.dayOfWeek}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center text-brand-600 cursor-help" title="Present days">P</th>
                      <th className="py-2.5 px-2 text-center text-rose-600 cursor-help" title="Absent days">A</th>
                      <th className="py-2.5 px-2 text-center text-sky-600 cursor-help" title="Leave days">L</th>
                      <th className="py-2.5 px-2 text-center text-amber-600 cursor-help" title="Half Days">HD</th>
                      <th className="py-2.5 px-2 text-center text-slate-600 cursor-help" title="Total Leaves">TL</th>
                      <th className="py-2.5 px-2 text-center text-sky-700 cursor-help" title="On Leave">OL</th>
                      <th className="py-2.5 px-2 text-center text-sky-700 cursor-help" title="Used Leaves">UL</th>
                      <th className="py-2.5 px-2 text-center text-slate-600">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold">
                    {registerStaffList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={registerDaysList.length + 10}
                          className="py-8 text-center text-slate-400 italic"
                        >
                          {hasStaffSearchError ? (
                            <div className="inline-flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 gap-1.5 max-w-md mx-auto shadow-sm not-italic">
                              <AlertCircle className="w-6 h-6 shrink-0" />
                              <p className="text-xs font-bold">Invalid input, please enter a valid staff name/ID</p>
                              <p className="text-[11px] text-red-500/80 font-medium">No employee records match "{currentSearchQuery}". Please check the spelling or employee ID.</p>
                            </div>
                          ) : (
                            "No employees found for the selected register criteria."
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginatedMonthlyStaffList.map((s) => {
                        let pCount = 0;
                        let aCount = 0;
                        let lCount = 0;
                        let hdCount = 0;

                        const rowCells = registerDaysList.map((item, idx) => {
                          const record = (attendance || []).find(
                            (r) =>
                              r.entityType === "Staff" &&
                              r.entityId === s.id &&
                              r.date === item.dateStr,
                          );

                          const key = `${s.id}_${item.dateStr}`;
                          const localEdit = monthlyEditsMap[key];

                          const status =
                            localEdit !== undefined
                              ? localEdit
                              : record
                              ? record.status
                              : undefined;

                          const isWeekend = getIsWeekend(item.dateStr);
                          const isHoliday = getIsHoliday(item.dateStr, s);
                          const isFuture = item.dateStr > todayStr;
                          const isBeforeJoining =
                            s.joiningDate && item.dateStr < s.joiningDate;

                          let code = "";
                          let badgeStyle = "";

                          if (status) {
                            if (status === "Present" || status === "Late") {
                              code = "P";
                              badgeStyle =
                                "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20";
                              pCount++;
                            } else if (status === "Absent") {
                              code = "A";
                              badgeStyle =
                                "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20";
                              aCount++;
                            } else if (status === "Leave") {
                              code = "L";
                              badgeStyle =
                                "text-sky-500 bg-sky-50 dark:bg-sky-950/30 border border-sky-500/20";
                              lCount++;
                            } else if (status === "HalfDay") {
                              code = "HD";
                              badgeStyle =
                                "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20";
                              hdCount++;
                            }
                          } else {
                            if (isBeforeJoining) {
                              code = "";
                              badgeStyle =
                                "border border-dashed border-slate-200 dark:border-slate-800 bg-transparent text-transparent";
                            } else if (isHoliday) {
                              code = "H";
                              badgeStyle =
                                "text-amber-600 bg-amber-100/50 dark:bg-amber-900/30 font-semibold";
                            } else if (isWeekend) {
                              code = "W";
                              badgeStyle =
                                "text-slate-400 bg-slate-100 dark:bg-slate-800/60 font-semibold";
                            } else {
                              code = "";
                              badgeStyle =
                                "border border-dashed border-slate-200 dark:border-slate-800 bg-transparent text-transparent";
                            }
                          }

                          return (
                            <td
                              key={idx}
                              className="py-2 px-0.5 text-center font-mono font-bold text-[10px]"
                            >
                              <button
                                type="button"
                                onClick={() => handleCellClick(s.id, item.dateStr)}
                                disabled={!isEditingMonthly || Boolean(isFuture) || Boolean(isBeforeJoining)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mx-auto transition-all ${
                                  isEditingMonthly && !isFuture && !isBeforeJoining
                                    ? "hover:scale-110 active:scale-95 cursor-pointer"
                                    : "cursor-default"
                                } ${badgeStyle}`}
                                title={
                                  isEditingMonthly && !isFuture && !isBeforeJoining
                                    ? `Click to toggle status for ${s.firstName} on ${item.dateStr}`
                                    : undefined
                                }
                              >
                                {code}
                              </button>
                            </td>
                          );
                        });

                        const totalLeaves = lCount + hdCount * 0.5;
                        const totalRecordedDays = pCount + aCount + lCount + hdCount;

                        return (
                          <tr
                            key={s.id}
                            className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                          >
                            {/* Employee ID */}
                            <td
                              className="py-2 px-3 font-mono font-bold text-brand-600 dark:text-brand-400 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[160px] min-w-[160px] max-w-[160px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left"
                              style={{ left: 0, width: 160, minWidth: 160, maxWidth: 160 }}
                            >
                              {s.empId || s.id}
                            </td>

                            {/* Employee Name */}
                            <td
                              className="py-2 px-3 sticky left-[160px] bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10 w-[180px] min-w-[180px] max-w-[180px] border-b border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-left shadow-[2px_0_4px_rgba(0,0,0,0.04)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.2)]"
                              style={{ left: 160, width: 180, minWidth: 180, maxWidth: 180 }}
                            >
                              <span className="font-extrabold text-slate-900 dark:text-white block">
                                {s.firstName} {s.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {s.email}
                              </span>
                            </td>

                            {rowCells}

                            <td className="py-2 px-2 text-center font-bold text-emerald-600">
                              {pCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-rose-600">
                              {aCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-sky-600">
                              {lCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-amber-600">
                              {hdCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-slate-500">
                              {totalLeaves}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-sky-700">
                              {lCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-sky-700">
                              {totalLeaves}
                            </td>
                            <td className="py-2 px-2 text-center font-extrabold text-slate-700 dark:text-slate-350">
                              {totalRecordedDays > 0
                                ? Math.round(
                                    ((pCount + hdCount * 0.5) /
                                      totalRecordedDays) *
                                      100,
                                  )
                                : 0}
                              %
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Monthly Pagination Controls */}
              {registerStaffList.length > 0 && (
                <div className="px-6 pb-4">
                  <Pagination
                    currentPage={monthlyPage}
                    totalItems={registerStaffList.length}
                    itemsPerPage={pageSize}
                    onPageChange={setMonthlyPage}
                    onItemsPerPageChange={(n) => {
                      setPageSize(n);
                      setMonthlyPage(1);
                    }}
                    label="employees"
                  />
                </div>
              )}
            </div>
          </div>
        )}


      <ConfirmModal
        isOpen={showSaveConfirm}
        title="Overwrite Attendance Logs?"
        message={`Attendance records already exist for ${attendanceDate}. Do you want to update and overwrite these existing entries?`}
        confirmLabel="Update Logs"
        cancelLabel="Keep Current"
        variant="warning"
        onConfirm={() => {
          setShowSaveConfirm(false);
          executeSaveAttendance();
        }}
        onCancel={() => setShowSaveConfirm(false)}
      />

    </div>
  );
};

export default StaffAttendanceView;
