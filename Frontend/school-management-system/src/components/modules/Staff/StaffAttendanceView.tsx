import React, { useState, useEffect, useMemo, useCallback } from "react";

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
} from "lucide-react";
import { formatToDDMMYYYY } from "../../../utils/dateValidation";
import { exportToExcel } from "../../../utils/excelExport";
import { DailyAttendance, Staff } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { DateInput } from "../../common/DateInput";
import { ConfirmModal } from "../../common/ConfirmModal";
import {
  teacherCheckInApi,
  teacherCheckOutApi,
  fetchTeacherTodayAttendanceApi,
} from "../../../api/attendance";

type AttendanceTab = "teaching" | "non-teaching";

export const StaffAttendanceView: React.FC<{ onNavigate?: (module: string) => void }> = ({ onNavigate }) => {
  const {
    staff,
    attendance,
    markAttendance,
    leaveApplications,
    holidays,
    schoolEvents,
    schoolProfile,
    fetchDailyAttendance,
    fetchMonthlyAttendance,
    lastAttendancePayload,
    lastAttendanceResponse,
  } = useData();
  const { addToast } = useToast();
  const { user, role } = useAuth();

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

  const isPersonalView =
    userRole === "teacher" ||
    userRole === "class-teacher" ||
    !canMarkAttendance;

  // Find logged-in teacher profile from DataContext staff
  const dbTeacher = useMemo(() => {
    const uId = (user?.id || "").trim();
    const uEmpId = ((user as any)?.empId || "").trim();
    const uEmail = (user?.email || "").toLowerCase().trim();
    const uName = (user?.name || "").toLowerCase().trim();

    if (uId || uEmpId) {
      const byId = staff.find(
        (s) =>
          (uId && (String(s.id) === uId || String(s.empId) === uId)) ||
          (uEmpId && (String(s.id) === uEmpId || String(s.empId) === uEmpId))
      );
      if (byId) return byId;
    }

    if (uEmail) {
      const byEmail = staff.find(
        (s) => s.email && s.email.toLowerCase().trim() === uEmail
      );
      if (byEmail) return byEmail;
    }

    if (uName) {
      const byName = staff.find((s) => {
        const full = `${s.firstName || ""} ${s.lastName || ""}`
          .toLowerCase()
          .trim();
        const sName = (s.name || "").toLowerCase().trim();
        return (full && full === uName) || (sName && sName === uName);
      });
      if (byName) return byName;
    }

    return null;
  }, [user, staff]);

  // Dynamic Teacher Profile resolution directly from logged in user & staff record
  const teacher = useMemo(() => {
    const rawName = user?.name || "";
    const parts = rawName.trim() ? rawName.trim().split(" ") : [];
    const defaultFirstName = parts[0] || (user as any)?.firstName || "";
    const defaultLastName = parts.slice(1).join(" ") || (user as any)?.lastName || "";

    if (dbTeacher) {
      return {
        ...dbTeacher,
        id: dbTeacher.id || user?.id || "",
        empId: dbTeacher.empId || dbTeacher.id || user?.id || "",
        firstName: dbTeacher.firstName || defaultFirstName,
        lastName: dbTeacher.lastName || defaultLastName,
        designation: dbTeacher.designation || (user as any)?.designation || "",
        department: dbTeacher.department || (user as any)?.department || "",
        assignedClasses: dbTeacher.assignedClasses || (user as any)?.assignedClasses || [],
        assignedSubjects: (dbTeacher as any).assignedSubjects || (user as any)?.assignedSubjects || [],
        leaveBalance: dbTeacher.leaveBalance || { casual: 10, sick: 10, paid: 15 }
      };
    }

    return {
      id: user?.id || (user as any)?.empId || "",
      empId: (user as any)?.empId || user?.id || "",
      firstName: defaultFirstName,
      lastName: defaultLastName,
      assignedClasses: (user as any)?.assignedClasses || [],
      assignedSubjects: (user as any)?.assignedSubjects || [],
      department: (user as any)?.department || "",
      designation: (user as any)?.designation || "",
      leaveBalance: { casual: 10, sick: 10, paid: 15 },
    };
  }, [dbTeacher, user]);

  // PERSONAL TEACHER ATTENDANCE STATES
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const [persCheckInTime, setPersCheckInTime] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("teacher_attendance_date");
    if (storedDate && storedDate !== todayDateStr) {
      localStorage.removeItem("teacher_check_in_time");
      localStorage.removeItem("teacher_check_out_time");
      localStorage.removeItem("teacher_is_checked_out");
      localStorage.setItem("teacher_attendance_date", todayDateStr);
      return null;
    }
    return localStorage.getItem("teacher_check_in_time");
  });

  const [persCheckOutTime, setPersCheckOutTime] = useState<string | null>(() => {
    const storedDate = localStorage.getItem("teacher_attendance_date");
    if (storedDate && storedDate !== todayDateStr) return null;
    const isOut = localStorage.getItem("teacher_is_checked_out") === "true";
    return isOut ? localStorage.getItem("teacher_check_out_time") : null;
  });

  const [persIsCheckedOut, setPersIsCheckedOut] = useState<boolean>(() => {
    const storedDate = localStorage.getItem("teacher_attendance_date");
    if (storedDate && storedDate !== todayDateStr) return false;
    return localStorage.getItem("teacher_is_checked_out") === "true";
  });

  const [persWorkingHours, setPersWorkingHours] = useState<string>("0h 0m");
  const [personalFilterDate, setPersonalFilterDate] = useState("");
  const [personalFilterMonth, setPersonalFilterMonth] = useState("All");
  const [personalSearchQuery, setPersonalSearchQuery] = useState("");
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Correction Form state
  const [correctionDate, setCorrectionDate] = useState(todayStr);
  const [correctionTime, setCorrectionTime] = useState("09:00 AM");
  const [correctionType, setCorrectionType] = useState<
    "Missed Check-In" | "Missed Check-Out"
  >("Missed Check-In");
  const [correctionReason, setCorrectionReason] = useState("");

  // Leave Application Form state
  const [leaveType, setLeaveType] = useState("Casual");
  const [leaveFromDate, setLeaveFromDate] = useState(todayStr);
  const [leaveToDate, setLeaveToDate] = useState(todayStr);
  const [leaveReason, setLeaveReason] = useState("");

  const [leaveBalance, setLeaveBalance] = useState({
    casual: teacher.leaveBalance?.casual ?? 8,
    sick: teacher.leaveBalance?.sick ?? 10,
    paid: teacher.leaveBalance?.paid ?? 15,
  });

  const [requests, setRequests] = useState([
    {
      id: "REQ-1",
      date: "2026-07-20",
      type: "Missed Check-In",
      status: "Pending",
      reason: "System outage at front gate scanner",
    },
    {
      id: "REQ-2",
      date: "2026-07-12",
      type: "Missed Check-Out",
      status: "Approved",
      reason: "Left early for official field trip",
    },
  ]);

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

  useEffect(() => {
    if (!persCheckInTime) {
      setPersWorkingHours("0h 0m");
      return;
    }
    const calcHours = () => {
      let startMs = new Date(persCheckInTime).getTime();
      if (isNaN(startMs) && persCheckInTime.includes("T")) {
        const afterT = persCheckInTime.split("T")[1];
        if (afterT) {
          const parts = persCheckInTime.split("T");
          startMs = new Date(`${parts[0]}T${afterT}`).getTime();
        }
      }
      if (isNaN(startMs) || startMs <= 0) {
        setPersWorkingHours("0h 0m");
        return;
      }

      let endMs = Date.now();
      if (persIsCheckedOut && persCheckOutTime) {
        let outD = new Date(persCheckOutTime).getTime();
        if (isNaN(outD) && persCheckOutTime.includes("T")) {
          const afterT = persCheckOutTime.split("T")[1];
          if (afterT) {
            const parts = persCheckOutTime.split("T");
            outD = new Date(`${parts[0]}T${afterT}`).getTime();
          }
        }
        if (!isNaN(outD) && outD > startMs) endMs = outD;
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
  }, [persCheckInTime, persCheckOutTime, persIsCheckedOut]);

  // Load today's check-in / check-out from backend on mount for personal view
  useEffect(() => {
    if (isPersonalView) {
      let isMounted = true;
      const loadPersonalAttendance = async () => {
        try {
          const res: any = await fetchTeacherTodayAttendanceApi();
          if (isMounted) {
            const attendanceData = res?.attendance || res;
            if (attendanceData && attendanceData.inTime) {
              const inTimeStr = attendanceData.inTime.includes("T")
                ? attendanceData.inTime
                : `${todayDateStr}T${attendanceData.inTime}`;
              setPersCheckInTime(inTimeStr);
              localStorage.setItem("teacher_check_in_time", inTimeStr);
              localStorage.setItem("teacher_attendance_date", todayDateStr);
              if (attendanceData.outTime) {
                const outTimeStr = attendanceData.outTime.includes("T")
                  ? attendanceData.outTime
                  : `${todayDateStr}T${attendanceData.outTime}`;
                setPersCheckOutTime(outTimeStr);
                setPersIsCheckedOut(true);
                localStorage.setItem("teacher_check_out_time", outTimeStr);
                localStorage.setItem("teacher_is_checked_out", "true");
              } else {
                setPersCheckOutTime(null);
                setPersIsCheckedOut(false);
                localStorage.removeItem("teacher_check_out_time");
                localStorage.setItem("teacher_is_checked_out", "false");
              }
            }
          }
        } catch {
          /* Ignored */
        }
      };
      loadPersonalAttendance();
      return () => {
        isMounted = false;
      };
    }
  }, [isPersonalView, todayDateStr]);

  const handlePersCheckIn = async () => {
    try {
      const res: any = await teacherCheckInApi();
      const attendanceData = res?.attendance || res;
      const now = new Date();
      const isoStr = now.toISOString();
      const inTimeVal = attendanceData?.inTime || now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      localStorage.setItem("teacher_attendance_date", todayDateStr);
      localStorage.setItem("teacher_check_in_time", isoStr);
      localStorage.removeItem("teacher_check_out_time");
      localStorage.setItem("teacher_is_checked_out", "false");
      setPersCheckInTime(isoStr);
      setPersCheckOutTime(null);
      setPersIsCheckedOut(false);

      const checkInHour = now.getHours();
      const checkInMinute = now.getMinutes();
      const computedStatus = (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) ? "Late" : "Present";
      const teacherEmpId = teacher?.id || dbTeacher?.id || user?.id || "";

      if (markAttendance && teacherEmpId) {
        await markAttendance([{
          id: `ATT-${Date.now()}-${teacherEmpId}`,
          date: todayDateStr,
          entityType: "Staff",
          entityId: teacherEmpId,
          status: computedStatus,
          inTime: inTimeVal,
          outTime: "",
          remarks: "Checked In Online",
          department: teacher?.department || dbTeacher?.department || (user as any)?.department || "",
          designation: teacher?.designation || dbTeacher?.designation || (user as any)?.designation || ""
        }]);
      }

      addToast(
        "success",
        "Checked In Successfully",
        `Recorded check-in at ${inTimeVal}`,
      );

      if (fetchDailyAttendance) {
        await fetchDailyAttendance(todayStr);
      }
    } catch (err: any) {
      console.error("Personal check-in error:", err);
      addToast("error", "Check In Failed", err.message || "Could not record check in");
    }
  };

  const handlePersCheckOut = async () => {
    try {
      const res: any = await teacherCheckOutApi();
      const attendanceData = res?.attendance || res;
      const now = new Date();
      const isoStr = now.toISOString();
      const outTimeVal = attendanceData?.outTime || now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      localStorage.setItem("teacher_attendance_date", todayDateStr);
      localStorage.setItem("teacher_check_out_time", isoStr);
      localStorage.setItem("teacher_is_checked_out", "true");
      setPersCheckOutTime(isoStr);
      setPersIsCheckedOut(true);

      const teacherEmpId = teacher?.id || dbTeacher?.id || user?.id || "";

      if (markAttendance && teacherEmpId) {
        await markAttendance([{
          id: `ATT-${Date.now()}-${teacherEmpId}`,
          date: todayDateStr,
          entityType: "Staff",
          entityId: teacherEmpId,
          status: todayStatus === "Late" ? "Late" : "Present",
          inTime: persCheckInTime ? formatDisplayTime(persCheckInTime) : inTimeVal,
          outTime: outTimeVal,
          remarks: "Checked In & Out Online",
          department: teacher?.department || dbTeacher?.department || (user as any)?.department || "",
          designation: teacher?.designation || dbTeacher?.designation || (user as any)?.designation || ""
        }]);
      }

      addToast(
        "info",
        "Checked Out Successfully",
        `Recorded check-out at ${outTimeVal}`,
      );

      if (fetchDailyAttendance) {
        await fetchDailyAttendance(todayStr);
      }
    } catch (err: any) {
      console.error("Personal check-out error:", err);
      addToast("error", "Check Out Failed", err.message || "Could not record check out");
    }
  };

  const todayStatus = useMemo(() => {
    if (!persCheckInTime) return "Pending Check-In";
    const checkInParsed = new Date(persCheckInTime);
    const checkInHour = checkInParsed.getHours();
    const checkInMinute = checkInParsed.getMinutes();
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0)) {
      return "Late";
    }
    return "Present";
  }, [persCheckInTime]);

  const lateByMins = useMemo(() => {
    if (todayStatus !== "Late") return 0;
    const checkInParsed = new Date(persCheckInTime!);
    const checkInMin =
      checkInParsed.getHours() * 60 + checkInParsed.getMinutes();
    const schoolStartMin = 9 * 60; // 09:00 AM
    return checkInMin - schoolStartMin;
  }, [todayStatus, persCheckInTime]);

  const formattedLateBy = useMemo(() => {
    if (lateByMins <= 0) return '';
    const hrs = Math.floor(lateByMins / 60);
    const mins = lateByMins % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} hrs ${mins} mins (${lateByMins} mins)`;
    } else if (hrs > 0) {
      return `${hrs} hrs (${lateByMins} mins)`;
    }
    return `${lateByMins} mins`;
  }, [lateByMins]);

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

    const teacherId = teacher?.id || dbTeacher?.id || "";
    const teacherRecords = (attendance || [])
      .filter((r) => {
        const isStaff = !r.entityType || r.entityType.toLowerCase() === "staff";
        const isId =
          String(r.entityId) === String(teacherId) ||
          String((r as any).staffId) === String(teacherId);
        const rDate = String(r.date || "").split("T")[0].split(" ")[0];
        return isStaff && isId && rDate !== todayStr;
      })
      .map((r) => {
        let calcHours = "--";
        if (r.inTime && r.outTime) {
          const startMs = new Date(r.inTime.includes('T') ? r.inTime : `${r.date}T${r.inTime}`).getTime();
          const endMs = new Date(r.outTime.includes('T') ? r.outTime : `${r.date}T${r.outTime}`).getTime();
          if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
            const diffMins = Math.floor((endMs - startMs) / 60000);
            const hrs = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            calcHours = `${hrs}h ${mins}m`;
          } else {
            calcHours = "8h 0m";
          }
        }
        return {
          date: String(r.date || "").split("T")[0].split(" ")[0],
          checkIn: formatDisplayTime(r.inTime),
          checkOut: formatDisplayTime(r.outTime),
          workingHours: calcHours,
          status: r.status || "Present",
        };
      });

    const list = todayRecord ? [todayRecord, ...teacherRecords] : teacherRecords;

    return list.filter((item) => {
      if (personalFilterDate && item.date !== personalFilterDate) return false;
      if (personalFilterMonth !== "All") {
        const itemMonth = new Date(item.date).getMonth();
        if (itemMonth.toString() !== personalFilterMonth) return false;
      }
      if (personalSearchQuery) {
        const q = personalSearchQuery.toLowerCase();
        return item.date.includes(q) || item.status.toLowerCase().includes(q);
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

    const typeKey = leaveType.toLowerCase() as "casual" | "sick" | "paid";
    const available =
      typeKey === "casual"
        ? leaveBalance.casual
        : typeKey === "sick"
          ? leaveBalance.sick
          : leaveBalance.paid;

    if (available < daysCount) {
      addToast(
        "error",
        "Insufficient Leave Balance",
        `You only have ${available} days of ${leaveType} leave remaining.`,
      );
      return;
    }

    setLeaveBalance((prev) => ({
      ...prev,
      [typeKey]:
        (typeKey === "casual"
          ? prev.casual
          : typeKey === "sick"
            ? prev.sick
            : prev.paid) - daysCount,
    }));

    addToast(
      "success",
      "Leave Applied Successfully",
      `Submitted application for ${daysCount} days of ${leaveType} Leave.`,
    );
    setShowApplyLeaveModal(false);
    setLeaveReason("");
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      date: correctionDate,
      type: correctionType,
      status: "Pending",
      reason: correctionReason,
    };
    setRequests((prev) => [newReq, ...prev]);
    addToast(
      "success",
      "Correction Request Submitted",
      `Attendance correction request for ${correctionDate} is pending approval.`,
    );
    setShowCorrectionModal(false);
    setCorrectionReason("");
    setCorrectionTime("");
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

  if (isPersonalView) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
        {/* 1. Header Section */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              Teacher Attendance Workspace
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-505 font-bold">
              <span>
                👤 Name:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {teacher.firstName} {teacher.lastName}
                </strong>
              </span>
              <span>
                🆔 Emp ID:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {teacher.empId || teacher.id}
                </strong>
              </span>
              <span>
                🏢 Dept:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {teacher.department}
                </strong>
              </span>
              <span>
                📅 Date:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {new Date().toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Attendance Status Today
            </p>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Attendance Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Today's Attendance
                </h3>
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
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Monthly Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Present Days
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {personalMonthlyStats.present} {personalMonthlyStats.present === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Absent Days
                  </span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    {personalMonthlyStats.absent} {personalMonthlyStats.absent === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Late Days
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {personalMonthlyStats.late} {personalMonthlyStats.late === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Leave Days
                  </span>
                  <span className="text-base font-black text-sky-600 dark:text-sky-400">
                    {personalMonthlyStats.leave} {personalMonthlyStats.leave === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs mt-2">
              <span className="font-bold text-slate-500">
                Total Hours (Month):
              </span>
              <span className="font-black text-slate-850 dark:text-white">
                {personalMonthlyStats.totalHoursDisplay}
              </span>
            </div>
          </div>

          {/* Leave Balance Overview & Quick Link Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Leave Balance
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-200/70 dark:border-sky-900/50">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 uppercase">
                    Casual
                  </span>
                  <p className="font-black text-sky-900 dark:text-white text-sm">
                    {leaveBalance.casual}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                    Sick
                  </span>
                  <p className="font-black text-amber-900 dark:text-white text-sm">
                    {leaveBalance.sick}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 text-center space-y-0.5">
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
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 mt-2"
            >
              <Calendar className="w-4 h-4" /> Go to Leave Management
            </button>
          </div>
        </div>

        {/* 3. Bottom Section: Attendance History & Attendance Requests */}
        <div className="space-y-6">
          {/* Attendance History */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 dark:border-slate-800/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />{" "}
                  Attendance History
                </h3>
                <p className="text-[10px] text-slate-400">
                  View personal daily registers and search records
                </p>
              </div>

              <button
                onClick={handleDownloadReport}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[11px] font-bold text-slate-750 dark:text-slate-200 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Report
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={personalSearchQuery}
                    onChange={(e) => setPersonalSearchQuery(e.target.value)}
                    placeholder="Search status (e.g. Present)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Filter by Month
                </label>
                <select
                  value={personalFilterMonth}
                  onChange={(e) => setPersonalFilterMonth(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="All">All Months</option>
                  <option value="6">July 2026</option>
                  <option value="5">June 2026</option>
                  <option value="4">May 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={personalFilterDate}
                  onChange={(e) => setPersonalFilterDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b border-slate-200 dark:border-slate-800 text-[11px]">
                    <th className="py-2.5 px-4 text-left">Date</th>
                    <th className="py-2.5 px-4 text-center">Check In</th>
                    <th className="py-2.5 px-4 text-center">Check Out</th>
                    <th className="py-2.5 px-4 text-center">Working Hours</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {fullHistory.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-855 dark:text-slate-200"
                    >
                      <td className="py-2.5 px-4 text-left font-bold whitespace-nowrap">
                        {formatToDDMMYYYY(item.date, "-")}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
                        {item.checkIn}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
                        {item.checkOut}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold whitespace-nowrap tabular-nums text-slate-800 dark:text-slate-100">
                        {item.workingHours}
                      </td>
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                            item.status === "Present"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50"
                              : item.status === "Late"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50"
                                : item.status === "Leave"
                                  ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200/50"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {/* Attendance Correction Requests */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 dark:border-slate-800/80 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-sky-600 dark:text-sky-400" />{" "}
                  Attendance Requests
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Request correction logs for missed check-in or checkout scanners
                </p>
              </div>

              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] shadow-md shadow-sky-600/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" /> Request Correction
              </button>
            </div>

            <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-505 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Request Date</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Reason</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {requests.map((req, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-855 dark:text-slate-200"
                      >
                        <td className="py-2.5 px-4 font-bold">
                          {formatToDDMMYYYY(req.date, "-")}
                        </td>
                        <td className="py-2.5 px-4 font-semibold">
                          {req.type}
                        </td>
                        <td
                          className="py-2.5 px-4 text-slate-500 max-w-[200px] truncate"
                          title={req.reason}
                        >
                          {req.reason}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : req.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="Casual">
                      Casual Leave ({leaveBalance.casual} left)
                    </option>
                    <option value="Sick">
                      Sick Leave ({leaveBalance.sick} left)
                    </option>
                    <option value="Paid">
                      Earned Leave ({leaveBalance.paid} left)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={leaveFromDate}
                      onChange={(e) => setLeaveFromDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={leaveToDate}
                      onChange={(e) => setLeaveToDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reason for Leave
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
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-colors"
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

              <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={correctionDate}
                      onChange={(e) => setCorrectionDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Request Type
                    </label>
                    <select
                      value={correctionType}
                      onChange={(e) => setCorrectionType(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-855 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Missed Check-In">Missed Check-In</option>
                      <option value="Missed Check-Out">Missed Check-Out</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Actual Time
                  </label>
                  <input
                    type="text"
                    value={correctionTime}
                    onChange={(e) => setCorrectionTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-855 dark:text-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reason for correction
                  </label>
                  <textarea
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Explain why check-in/checkout was missed..."
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
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition-colors"
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

  const [attendanceDate, setAttendanceDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
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
  const [regMonth, setRegMonth] = useState<number>(new Date().getMonth());
  const [regYear, setRegYear] = useState<number>(new Date().getFullYear());
  const [regFromDate, setRegFromDate] = useState("");
  const [regToDate, setRegToDate] = useState("");

  const [dateMode, setDateMode] = useState<'Daily' | 'Monthly' | 'Custom Range'>('Daily');
  const [monthInputVal, setMonthInputVal] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

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
    } else {
      setViewMode('monthly');
      if (dateMode === 'Monthly') {
        setRegFromDate("");
        setRegToDate("");
      } else if (dateMode === 'Custom Range') {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const today = String(d.getDate()).padStart(2, '0');
        setRegFromDate(`${y}-${m}-01`);
        setRegToDate(`${y}-${m}-${today}`);
      }
    }
  }, [dateMode]);

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
  const pageSize = 10;

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
    const list = staff
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
    const list = staff
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
    const list = staff
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
    if (viewMode === "monthly" && fetchMonthlyAttendance) {
      const activeDept =
        activeTab === "teaching" ? teachingDept : nonTeachingDept;
      fetchMonthlyAttendance(regMonth + 1, regYear, activeDept);
    }
  }, [
    regMonth,
    regYear,
    activeTab,
    teachingDept,
    nonTeachingDept,
    viewMode,
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

      // 2. Check Existing Recorded Attendance (flexible match on ID, entityType & date)
      const existing = (attendance || []).find((r) => {
        const rDate = String(r.date || "").split("T")[0];
        const isDateMatch = rDate === targetDate;
        const isStaffEntity = !r.entityType || r.entityType.toLowerCase() === "staff";
        const isIdMatch =
          String(r.entityId) === String(s.id) ||
          String(r.entityId) === String(s.empId) ||
          String((r as any).staffId) === String(s.id) ||
          String((r as any).staffId) === String(s.empId) ||
          String((r as any).employeeId) === String(s.id) ||
          String((r as any).employeeId) === String(s.empId);
        return isDateMatch && isStaffEntity && isIdMatch;
      });

      // 3. Check if this staff is the logged in teacher and has checked in today
      const isCurrentLoggedInTeacher =
        (teacher && (teacher.id === s.id || teacher.empId === s.empId || teacher.id === s.empId || teacher.empId === s.id)) ||
        (dbTeacher && (dbTeacher.id === s.id || dbTeacher.empId === s.empId || dbTeacher.id === s.empId || dbTeacher.empId === s.id));

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
        newInTimeMap[s.id] = existing.inTime || (normSt === "Present" || normSt === "Late" ? "08:30 AM" : "");
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
    return staff.filter((s) => {
      if (!isTeachingStaff(s) || s.status === "Inactive") return false;
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
  }, [staff, teachingDept, teachingDesignation, teachingQuery]);

  // Filter Active Non-Teaching Staff
  const nonTeachingStaffList = useMemo(() => {
    return staff.filter((s) => {
      if (isTeachingStaff(s) || s.status === "Inactive") return false;
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
  }, [staff, nonTeachingDept, nonTeachingDesignation, nonTeachingQuery]);

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
      if (st === "Present") present++;
      else if (st === "Absent") absent++;
      else if (st === "Leave") leave++;
      else if (st === "HalfDay" || st === "Late") halfDay++;
    });

    return { total, present, absent, leave, halfDay };
  }, [currentTabStaffList, attendanceMap, normalizeStatus]);

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
          prev[empId] && prev[empId] !== "00:00" ? prev[empId] : "08:30 AM",
      }));
      setOutTimeMap((prev) => ({
        ...prev,
        [empId]:
          prev[empId] && prev[empId] !== "00:00" ? prev[empId] : "04:30 PM",
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
          next[s.id] = "08:30 AM";
        });
        return next;
      });
      setOutTimeMap((prev) => {
        const next = { ...prev };
        currentTabStaffList.forEach((s) => {
          next[s.id] = "04:30 PM";
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
      const activeStaffCategoryList = staff.filter((s) => {
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
          const activeStaffListForCategory = staff.filter((s) => {
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
                  ? "08:30 AM"
                  : "");
              const outTime =
                existingRecordForTimes?.outTime ||
                ((status as string) === "Present" || (status as string) === "Late"
                  ? "04:30 PM"
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
    return staff.filter((s) => {
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

  return (
    <div className="space-y-6 animate-in fade-in text-xs pb-12">
      {/* Title & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Staff Attendance
          </h2>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-center"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
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

        {/* Search Staff Bar (Top Right corner of main module tabs line) */}
        <div className="w-full md:w-72 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={activeTab === "teaching" ? teachingQuery : nonTeachingQuery}
              onChange={(e) =>
                activeTab === "teaching"
                  ? setTeachingQuery(e.target.value)
                  : setNonTeachingQuery(e.target.value)
              }
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Control Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${dateMode === 'Custom Range' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 items-end`}>
          {/* Date Mode */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Date Mode
            </label>
            <select
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>

          {/* Date Selection */}
          <div className={dateMode === "Custom Range" ? "sm:col-span-2 lg:col-span-2" : ""}>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Date Selection
            </label>
            {dateMode === "Daily" && (
              <DateInput
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            )}
            {dateMode === "Monthly" && (
              <input
                type="month"
                value={monthInputVal}
                onChange={(e) => handleMonthInputChange(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer"
              />
            )}
            {dateMode === "Custom Range" && (
              <div className="flex items-center gap-2">
                <DateInput
                  value={regFromDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  placeholder="From"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-slate-400 font-bold">-</span>
                <DateInput
                  value={regToDate}
                  onChange={(e) => setRegToDate(e.target.value)}
                  placeholder="To"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Department
            </label>
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
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Designation
            </label>
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
        </div>
      </div>

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

                <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-center">
                  <p className="text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase">
                    Present
                  </p>
                  <p className="text-lg font-black text-brand-800 dark:text-brand-300 mt-0.5">
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
                    Half Day / Late
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
                      className="px-3 py-1.5 rounded-xl bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 hover:bg-brand-200 font-bold text-[11px] transition-colors"
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
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3.5 px-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 min-w-[110px] max-w-[110px] border-r border-slate-200 dark:border-slate-800">Employee ID</th>
                      <th className="py-3.5 px-4 sticky left-[110px] bg-slate-100 dark:bg-slate-800 z-20 min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-800">Employee Name</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Designation</th>
                      <th className="py-3.5 px-4 text-center">
                        Attendance Status
                      </th>
                      <th className="py-3.5 px-4">In Time</th>
                      <th className="py-3.5 px-4">Out Time</th>
                      <th className="py-3.5 px-4 min-w-[260px]">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                    {currentTabStaffList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-12 text-center text-slate-400 italic"
                        >
                          No employees found matching the filter criteria.
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
                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100"
                          >
                            {/* Emp ID */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 z-10 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 dark:border-slate-800">
                              {s.empId || s.id}
                            </td>

                            {/* Employee Name */}
                            <td className="py-3 px-4 sticky left-[110px] bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 z-10 w-[200px] min-w-[200px] max-w-[200px] border-r border-slate-200 dark:border-slate-800">
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
                                  const isSelected = currentStatus === st;
                                  let activeStyle = "";
                                  if (st === "Present")
                                    activeStyle =
                                      "bg-brand-600 text-white font-black border-brand-600 shadow-sm";
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
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-4 px-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{(dailyPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{Math.min(dailyPage * pageSize, currentTabStaffList.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{currentTabStaffList.length}</strong> employees
                  </span>

                  {Math.ceil(currentTabStaffList.length / pageSize) > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={dailyPage === 1}
                        onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-xs h-[32px]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.ceil(currentTabStaffList.length / pageSize) },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setDailyPage(page)}
                            className={`w-8 h-8 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center justify-center ${
                              dailyPage === page
                                ? "bg-sky-600 text-white shadow-xs"
                                : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={dailyPage === Math.ceil(currentTabStaffList.length / pageSize)}
                        onClick={() =>
                          setDailyPage((p) =>
                            Math.min(Math.ceil(currentTabStaffList.length / pageSize), p + 1),
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-xs h-[32px]"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
                   <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap">Filter:</span>
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
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-550 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 dark:border-slate-800">Employee ID</th>
                      <th className="py-2.5 px-3 sticky left-[110px] bg-slate-100 dark:bg-slate-800 z-20 w-[180px] min-w-[180px] max-w-[180px] border-r border-slate-200 dark:border-slate-800">Employee Name</th>
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
                          No employees found for the selected register criteria.
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
                            className="group hover:bg-slate-50/50 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/80"
                          >
                            {/* Employee ID */}
                            <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 z-10 w-[110px] min-w-[110px] max-w-[110px] border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                              {s.empId || s.id}
                            </td>

                            {/* Employee Name */}
                            <td className="py-2 px-3 sticky left-[110px] bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 z-10 w-[180px] min-w-[180px] max-w-[180px] border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-4 px-6 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                  <span className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{(monthlyPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{Math.min(monthlyPage * pageSize, registerStaffList.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{registerStaffList.length}</strong> employees
                  </span>

                  {Math.ceil(registerStaffList.length / pageSize) > 1 && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <button
                        type="button"
                        disabled={monthlyPage === 1}
                        onClick={() => setMonthlyPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-xs h-[32px]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.ceil(registerStaffList.length / pageSize) },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setMonthlyPage(page)}
                            className={`w-8 h-8 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center justify-center ${
                              monthlyPage === page
                                ? "bg-sky-600 text-white shadow-xs"
                                : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={monthlyPage === Math.ceil(registerStaffList.length / pageSize)}
                        onClick={() =>
                          setMonthlyPage((p) =>
                            Math.min(Math.ceil(registerStaffList.length / pageSize), p + 1),
                          )
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-[11px] shadow-xs h-[32px]"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
