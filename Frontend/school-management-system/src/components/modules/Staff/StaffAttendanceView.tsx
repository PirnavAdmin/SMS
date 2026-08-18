import React, { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { DailyAttendance, Staff } from "../../../types";
import { useData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { formatToDDMMYYYY } from "../../../utils/dateValidation";
import { DateInput } from "../../common/DateInput";

type AttendanceTab = "teaching" | "non-teaching";

export const StaffAttendanceView: React.FC = () => {
  const {
    staff,
    attendance,
    markAttendance,
    leaveApplications,
    holidays,
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

  // Find logged-in teacher profile
  const dbTeacher =
    staff.find(
      (s) =>
        s.email &&
        user?.email &&
        s.email === user.email &&
        s.employeeCategory === "Teacher",
    ) ||
    staff.find(
      (s) =>
        s.email &&
        (s.email.toLowerCase().includes("jenkins") ||
          s.email.toLowerCase().includes("miller")),
    ) ||
    staff.find((s) => s.employeeCategory === "Teacher");

  // Fallback to static mock data if no teacher profile is found
  const teacher = dbTeacher || {
    id: "STF-002",
    empId: "EMP002",
    firstName: user?.name || "Jonathan",
    lastName: "Miller",
    assignedClasses: ["Class 10-A", "Class 11-B"],
    assignedSubjects: ["Mathematics"],
    department: "Mathematics",
    designation: "Class Teacher",
    leaveBalance: { casual: 8, sick: 10, paid: 15 },
  };

  // PERSONAL TEACHER ATTENDANCE STATES
  const [persCheckInTime, setPersCheckInTime] = useState<string | null>(() =>
    localStorage.getItem("teacher_check_in_time"),
  );
  const [persCheckOutTime, setPersCheckOutTime] = useState<string | null>(() =>
    localStorage.getItem("teacher_check_out_time"),
  );
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

  useEffect(() => {
    if (!persCheckInTime) {
      setPersWorkingHours("0h 0m");
      return;
    }
    const calcHours = () => {
      const start = new Date(persCheckInTime).getTime();
      if (isNaN(start)) {
        setPersWorkingHours("0h 0m");
        return;
      }
      const end = persCheckOutTime
        ? new Date(persCheckOutTime).getTime()
        : Date.now();
      const diffMs = end - start;
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
    const interval = setInterval(calcHours, 60000);
    return () => clearInterval(interval);
  }, [persCheckInTime, persCheckOutTime]);

  const handlePersCheckIn = () => {
    const nowIso = new Date().toISOString();
    localStorage.setItem("teacher_check_in_time", nowIso);
    setPersCheckInTime(nowIso);
    addToast(
      "success",
      "Checked In Successfully",
      `Recorded check-in at ${new Date(nowIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    );
  };

  const handlePersCheckOut = () => {
    const nowIso = new Date().toISOString();
    localStorage.setItem("teacher_check_out_time", nowIso);
    setPersCheckOutTime(nowIso);
    addToast(
      "info",
      "Checked Out Successfully",
      `Recorded check-out at ${new Date(nowIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    );
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

  const fullHistory = useMemo(() => {
    const todayRecord = persCheckInTime
      ? {
          date: todayStr,
          checkIn: new Date(persCheckInTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          checkOut: persCheckOutTime
            ? new Date(persCheckOutTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--",
          workingHours: persWorkingHours,
          status: todayStatus,
        }
      : null;

    const base = [
      {
        date: "2026-07-29",
        checkIn: "09:02 AM",
        checkOut: "--",
        workingHours: "3h 15m",
        status: "Present",
      },
      {
        date: "2026-07-28",
        checkIn: "08:55 AM",
        checkOut: "05:32 PM",
        workingHours: "8h 37m",
        status: "Present",
      },
      {
        date: "2026-07-27",
        checkIn: "09:15 AM",
        checkOut: "05:00 PM",
        workingHours: "7h 45m",
        status: "Late",
      },
      {
        date: "2026-07-24",
        checkIn: "08:45 AM",
        checkOut: "04:30 PM",
        workingHours: "7h 45m",
        status: "Present",
      },
      {
        date: "2026-07-23",
        checkIn: "08:52 AM",
        checkOut: "05:00 PM",
        workingHours: "8h 08m",
        status: "Present",
      },
      {
        date: "2026-07-22",
        checkIn: "--",
        checkOut: "--",
        workingHours: "0h 0m",
        status: "Leave",
      },
      {
        date: "2026-07-21",
        checkIn: "08:58 AM",
        checkOut: "04:35 PM",
        workingHours: "7h 37m",
        status: "Present",
      },
      {
        date: "2026-07-20",
        checkIn: "--",
        checkOut: "--",
        workingHours: "0h 0m",
        status: "Absent",
      },
    ];

    const list = todayRecord ? [todayRecord, ...base] : base;

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
  ]);

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
    addToast(
      "success",
      "Report Export Started",
      "Downloading personal attendance registry in Excel format.",
    );
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

        {/* 2. Main content area: two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Today's Attendance, Monthly Summary & Leave Balance */}
          <div className="lg:col-span-1 space-y-6">
            {/* Today's Attendance Card */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-105 dark:border-slate-800/80">
                <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Today's Attendance
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Check-In
                  </span>
                  <p className="font-mono font-black text-slate-850 dark:text-white text-sm">
                    {persCheckInTime
                      ? new Date(persCheckInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Check-Out
                  </span>
                  <p className="font-mono font-black text-slate-850 dark:text-white text-sm">
                    {persCheckOutTime
                      ? new Date(persCheckOutTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">
                    Working Hours:
                  </span>
                  <span className="font-mono font-black text-slate-800 dark:text-white">
                    {persWorkingHours}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-805 pt-2">
                  <span className="font-bold text-slate-500">
                    Status today:
                  </span>
                  <span className="font-black text-slate-800 dark:text-white">
                    {todayStatus}
                  </span>
                </div>
                {todayStatus === "Late" && (
                  <div className="flex items-center justify-between border-t border-slate-105 pt-2 text-amber-600 dark:text-amber-400 font-bold">
                    <span>Late By:</span>
                    <span>{lateByMins} minutes</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!!persCheckInTime}
                  onClick={handlePersCheckIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800/40 disabled:text-slate-400 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Check In
                </button>
                <button
                  type="button"
                  disabled={!persCheckInTime || !!persCheckOutTime}
                  onClick={handlePersCheckOut}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-slate-800/40 disabled:text-slate-400 text-white font-black shadow-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Check Out
                </button>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-105 dark:border-slate-800/80">
                <BarChart3 className="w-5 h-5 text-sky-500" />
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
                    20 Days
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Absent Days
                  </span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    0 Days
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Late Days
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    2 Days
                  </span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Leave Days
                  </span>
                  <span className="text-base font-black text-sky-600 dark:text-sky-400">
                    1 Day
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">
                  Total Hours (Month):
                </span>
                <span className="font-black text-slate-850 dark:text-white">
                  168 hrs
                </span>
              </div>
            </div>

            {/* Leave Balance */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-105 dark:border-slate-800/80">
                <CalendarCheck className="w-5 h-5 text-purple-500" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Leave Balance
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                    Casual
                  </span>
                  <p className="font-black text-indigo-900 dark:text-white text-sm">
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
                <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/40 text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                    Earned
                  </span>
                  <p className="font-black text-emerald-900 dark:text-white text-sm">
                    {leaveBalance.paid}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApplyLeaveModal(true)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Apply Leave
              </button>
            </div>
          </div>

          {/* Right Column: Attendance History & Attendance Requests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance History */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 dark:border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />{" "}
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
              </div>

              {/* Table */}
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Check In</th>
                      <th className="py-2.5 px-4">Check Out</th>
                      <th className="py-2.5 px-4">Working Hours</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {fullHistory.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-855 dark:text-slate-200"
                      >
                        <td className="py-2.5 px-4 font-bold">
                          {formatToDDMMYYYY(item.date, "-")}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {item.checkIn}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {item.checkOut}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {item.workingHours}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.status === "Present"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : item.status === "Late"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                  : item.status === "Leave"
                                    ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400"
                                    : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
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
            </div>

            {/* Attendance Correction Requests */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 dark:border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />{" "}
                    Attendance Requests
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Request correction logs for missed check-in or checkout
                    scanners
                  </p>
                </div>

                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[11px] shadow-md transition-colors flex items-center gap-1"
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
    return (leaveApplications || []).find(
      (app) =>
        app.employeeId === empId &&
        app.status === "Approved" &&
        checkDate >= app.fromDate &&
        checkDate <= app.toDate,
    );
  };

  // Fetch daily attendance logs from API when filters change
  useEffect(() => {
    if (viewMode === "daily" && fetchDailyAttendance) {
      const activeDept =
        activeTab === "teaching" ? teachingDept : nonTeachingDept;
      fetchDailyAttendance(attendanceDate, activeDept);
    }
  }, [
    attendanceDate,
    activeTab,
    teachingDept,
    nonTeachingDept,
    viewMode,
    fetchDailyAttendance,
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
    const relevant = (attendance || []).filter(
      (r) => r.entityType === "Staff" && r.date === attendanceDate,
    );
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
    const newStatusMap: typeof attendanceMap = {};
    const newInTimeMap: typeof inTimeMap = {};
    const newOutTimeMap: typeof outTimeMap = {};
    const newRemarksMap: typeof remarksMap = {};

    staff.forEach((s) => {
      // 1. Check Approved Leave
      const approvedLeave = getApprovedLeave(s.id, attendanceDate);

      // 2. Check Existing Recorded Attendance (flexible match on ID, entityType & date)
      const targetDate = String(attendanceDate).split("T")[0];
      const existing = (attendance || []).find(
        (r) => {
          const rDate = String(r.date || "").split("T")[0];
          const isDateMatch = rDate === targetDate;
          const isStaffEntity = !r.entityType || r.entityType.toLowerCase() === "staff";
          const isIdMatch =
            String(r.entityId) === String(s.id) ||
            String(r.entityId) === String(s.empId) ||
            String((r as any).staffId) === String(s.id) ||
            String((r as any).employeeId) === String(s.id);
          return isDateMatch && isStaffEntity && isIdMatch;
        }
      );

      if (existing) {
        const normSt = normalizeStatus(existing.status);
        newStatusMap[s.id] = normSt;
        newInTimeMap[s.id] =
          existing.inTime ||
          (normSt === "Present" || normSt === "Late"
            ? "08:30 AM"
            : "");
        newOutTimeMap[s.id] =
          existing.outTime ||
          (normSt === "Present" || normSt === "Late"
            ? "04:30 PM"
            : "");
        newRemarksMap[s.id] = existing.remarks || "";
      } else if (approvedLeave) {
        newStatusMap[s.id] = approvedLeave.isHalfDay ? "HalfDay" : "Leave";
        newInTimeMap[s.id] = "";
        newOutTimeMap[s.id] = "";
        newRemarksMap[s.id] =
          `Approved Leave: ${approvedLeave.leaveTypeName || "Leave"}`;
      } else {
        newStatusMap[s.id] = "Present";
        newInTimeMap[s.id] = "08:30 AM";
        newOutTimeMap[s.id] = "04:30 PM";
        newRemarksMap[s.id] = "";
      }
    });

    setAttendanceMap(newStatusMap);
    setInTimeMap(newInTimeMap);
    setOutTimeMap(newOutTimeMap);
    setRemarksMap(newRemarksMap);
    setOverrideLeaveSet(new Set());
  }, [attendanceDate, staff, attendanceHash, leaveApplications, normalizeStatus]);

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
      const confirmOverwrite = window.confirm(
        `Attendance records already exist for ${attendanceDate}. Do you want to update and overwrite existing entries?`,
      );
      if (!confirmOverwrite) return;
    }

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
  };

  // Check if existing attendance entries exist for date
  const isExistingAttendanceForDate = useMemo(() => {
    return (attendance || []).some(
      (r) => r.entityType === "Staff" && r.date === attendanceDate,
    );
  }, [attendance, attendanceDate]);

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

          list.push({ dateStr, dayNum: current.getDate(), displayHeader });

          current.setDate(current.getDate() + 1);
          guard++;
        }
        return list;
      }
    }

    // Default to selected month
    const daysCount = new Date(regYear, regMonth + 1, 0).getDate();
    const list: { dateStr: string; dayNum: number; displayHeader: string }[] =
      [];
    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${regYear}-${String(regMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push({ dateStr, dayNum: d, displayHeader: `${d}` });
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

      if (regEmpId !== "All" && s.id !== regEmpId) return false;
      return s.status === "Active";
    });
  }, [staff, activeTab, teachingDept, nonTeachingDept, regEmpId]);

  // Export Report Handler
  const handleExportReport = () => {
    let csvRows: string[] = [];
    let filename = "";

    if (viewMode === "daily") {
      filename = `Staff_Daily_Attendance_${formatToDDMMYYYY(attendanceDate, "-")}`;
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
      csvRows.push(headers.join(","));

      currentTabStaffList.forEach((s) => {
        const approvedLeave = getApprovedLeave(s.id, attendanceDate);
        const status =
          attendanceMap[s.id] || (approvedLeave ? "Leave" : "Present");
        const inTime = inTimeMap[s.id] || "";
        const outTime = outTimeMap[s.id] || "";
        const remarks = remarksMap[s.id] || "";

        const row = [
          `"${formatToDDMMYYYY(attendanceDate, "-")}"`,
          `"${s.empId || s.id}"`,
          `"${s.firstName} ${s.lastName}"`,
          `"${activeTab === "teaching" ? "Teaching Staff" : "Non-Teaching Staff"}"`,
          `"${s.department || "General"}"`,
          `"${s.designation || "Staff"}"`,
          `"${status}"`,
          `"${inTime}"`,
          `"${outTime}"`,
          `"${remarks.replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });
    } else {
      const rangeLabel =
        regFromDate && regToDate
          ? `${formatToDDMMYYYY(regFromDate, "-")}_to_${formatToDDMMYYYY(regToDate, "-")}`
          : `${monthNames[regMonth]}_${regYear}`;
      filename = `Staff_Attendance_Register_${rangeLabel}`;

      const dateHeaders = registerDaysList.map(
        (item) => `"${item.displayHeader}"`,
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
      csvRows.push(headers.join(","));

      registerStaffList.forEach((s) => {
        let pCount = 0;
        let aCount = 0;
        let lCount = 0;

        const dayStatuses = registerDaysList.map((item) => {
          const record = (attendance || []).find(
            (r) =>
              r.entityType === "Staff" &&
              r.entityId === s.id &&
              r.date === item.dateStr,
          );
          let code = "P";
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
            }
          } else {
            pCount++;
          }
          return `"${code}"`;
        });

        const pct =
          registerDaysList.length > 0
            ? Math.round((pCount / registerDaysList.length) * 100)
            : 0;

        const row = [
          `"${s.empId || s.id}"`,
          `"${s.firstName} ${s.lastName}"`,
          `"${activeTab === "teaching" ? "Teaching Staff" : "Non-Teaching Staff"}"`,
          `"${s.department || "General"}"`,
          `"${s.designation || "Staff"}"`,
          ...dayStatuses,
          `"${pCount}"`,
          `"${aCount}"`,
          `"${lCount}"`,
          `"${pct}%"`,
        ];
        csvRows.push(row.join(","));
      });
    }

    if (csvRows.length <= 1) {
      addToast(
        "warning",
        "No Records to Export",
        "There are no staff records available for the selected criteria.",
      );
      return;
    }

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      "success",
      "Report Exported Successfully",
      `Downloaded ${filename}.csv`,
    );
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

        {(activeTab === "teaching" || activeTab === "non-teaching") &&
          canMarkAttendance && (
            <button
              onClick={handleSaveAttendance}
              disabled={isFutureDate}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-black shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all self-start sm:self-center"
            >
              <Save className="w-4 h-4" /> Save Attendance Log
            </button>
          )}
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === "daily"
                  ? "bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === "monthly"
                  ? "bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
            >
              Monthly Attendance
            </button>
          </div>

          <button
            onClick={handleExportReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* DAILY ATTENDANCE MARKING (TEACHING & NON-TEACHING) */}
      {(activeTab === "teaching" || activeTab === "non-teaching") &&
        viewMode === "daily" && (
          <div className="space-y-5">
            {/* Live Attendance Summary Card */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  Attendance Summary
                </h4>
                <span className="text-[10px] font-bold text-slate-400">
                  Date: {attendanceDate}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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

              {/* Quick Bulk Actions */}
              {canMarkAttendance && !isFutureDate && (
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
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

            {/* Filters Bar */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                {/* Search Input Bar */}
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Search Staff
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab === "teaching" ? "teaching" : "non-teaching"} staff by name or emp ID...`}
                      value={
                        activeTab === "teaching" ? teachingQuery : nonTeachingQuery
                      }
                      onChange={(e) =>
                        activeTab === "teaching"
                          ? setTeachingQuery(e.target.value)
                          : setNonTeachingQuery(e.target.value)
                      }
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Attendance Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Attendance Date *
                  </label>
                  <DateInput
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Department Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Department
                  </label>
                  <select
                    value={
                      activeTab === "teaching" ? teachingDept : nonTeachingDept
                    }
                    onChange={(e) =>
                      activeTab === "teaching"
                        ? setTeachingDept(e.target.value)
                        : setNonTeachingDept(e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    {(activeTab === "teaching"
                      ? teachingDepts
                      : nonTeachingDepartments
                    ).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Designation (Optional)
                  </label>
                  <select
                    value={
                      activeTab === "teaching"
                        ? teachingDesignation
                        : nonTeachingDesignation
                    }
                    onChange={(e) =>
                      activeTab === "teaching"
                        ? setTeachingDesignation(e.target.value)
                        : setNonTeachingDesignation(e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <option value="All">All Designations</option>
                    {(activeTab === "teaching"
                      ? teachingDesignations
                      : nonTeachingDesignations
                    ).map((des) => (
                      <option key={des} value={des}>
                        {des}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Grid Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3.5 px-4">Employee ID</th>
                      <th className="py-3.5 px-4">Employee Name</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Designation</th>
                      <th className="py-3.5 px-4 text-center">
                        Attendance Status
                      </th>
                      <th className="py-3.5 px-4">In Time</th>
                      <th className="py-3.5 px-4">Out Time</th>
                      <th className="py-3.5 px-4">Remarks</th>
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
                      currentTabStaffList.map((s) => {
                        const approvedLeave = getApprovedLeave(
                          s.id,
                          attendanceDate,
                        );
                        const isLeaveLocked =
                          !!approvedLeave && !overrideLeaveSet.has(s.id);
                        const currentStatus = attendanceMap[s.id] || "Present";

                        return (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100"
                          >
                            {/* Emp ID */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                              {s.empId || s.id}
                            </td>

                            {/* Employee Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {s.avatar ? (
                                  <img
                                    src={s.avatar}
                                    alt=""
                                    className="w-7 h-7 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs">
                                    {s.firstName[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-extrabold text-slate-900 dark:text-white">
                                    {s.firstName} {s.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {s.email}
                                  </p>
                                </div>
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
                                  isLeaveLocked ||
                                  !canMarkAttendance ||
                                  isFutureDate ||
                                  currentStatus === "Absent" ||
                                  currentStatus === "Leave"
                                }
                                value={inTimeMap[s.id] || ""}
                                onChange={(e) =>
                                  setInTimeMap({
                                    ...inTimeMap,
                                    [s.id]: e.target.value,
                                  })
                                }
                                placeholder="08:30 AM"
                                className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                              />
                            </td>

                            {/* Out Time */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                disabled={
                                  isLeaveLocked ||
                                  !canMarkAttendance ||
                                  isFutureDate ||
                                  currentStatus === "Absent" ||
                                  currentStatus === "Leave"
                                }
                                value={outTimeMap[s.id] || ""}
                                onChange={(e) =>
                                  setOutTimeMap({
                                    ...outTimeMap,
                                    [s.id]: e.target.value,
                                  })
                                }
                                placeholder="04:30 PM"
                                className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-center font-bold outline-none disabled:opacity-40"
                              />
                            </td>

                            {/* Remarks */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                disabled={!canMarkAttendance || isFutureDate}
                                value={remarksMap[s.id] || ""}
                                onChange={(e) =>
                                  setRemarksMap({
                                    ...remarksMap,
                                    [s.id]: e.target.value,
                                  })
                                }
                                placeholder="Notes..."
                                className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {/* MONTHLY ATTENDANCE REGISTER */}
      {(activeTab === "teaching" || activeTab === "non-teaching") &&
        viewMode === "monthly" && (
          <div className="space-y-5">
            {/* Register Filter Controls */}
            <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Specific Employee
                  </label>
                  <select
                    value={regEmpId}
                    onChange={(e) => setRegEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="All">
                      All Employees ({registerStaffList.length})
                    </option>
                    {registerStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.empId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Month
                  </label>
                  <select
                    value={regMonth}
                    onChange={(e) => {
                      setRegMonth(Number(e.target.value));
                      setRegFromDate("");
                      setRegToDate("");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Year
                  </label>
                  <select
                    value={regYear}
                    onChange={(e) => {
                      setRegYear(Number(e.target.value));
                      setRegFromDate("");
                      setRegToDate("");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    From Date (DD-MM-YYYY)
                  </label>
                  <DateInput
                    value={regFromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    To Date (DD-MM-YYYY)
                  </label>
                  <DateInput
                    value={regToDate}
                    onChange={(e) => setRegToDate(e.target.value)}
                    placeholder="DD-MM-YYYY"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {(regFromDate || regToDate) && (
                <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-brand-600 dark:text-brand-400 font-bold">
                    Showing custom range: {formatToDDMMYYYY(regFromDate, "-")}{" "}
                    to {formatToDDMMYYYY(regToDate, "-")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRegFromDate("");
                      setRegToDate("");
                    }}
                    className="text-rose-600 hover:text-rose-700 font-bold text-[11px]"
                  >
                    Clear Date Range Filter
                  </button>
                </div>
              )}
            </div>

            {/* Monthly Matrix Table */}
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
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
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                    P = Present
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    A = Absent
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    L = Leave
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    HD = Half Day
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b">
                      <th className="py-2.5 px-3 min-w-[160px]">Employee</th>
                      {registerDaysList.map((item, idx) => (
                        <th
                          key={idx}
                          className="py-2.5 px-1 text-center min-w-[32px] font-mono text-[10px] whitespace-nowrap"
                        >
                          {item.displayHeader}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center text-brand-600">
                        P
                      </th>
                      <th className="py-2.5 px-2 text-center text-rose-600">
                        A
                      </th>
                      <th className="py-2.5 px-2 text-center text-sky-600">
                        L
                      </th>
                      <th className="py-2.5 px-2 text-center text-sky-600">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold">
                    {registerStaffList.length === 0 ? (
                      <tr>
                        <td
                          colSpan={registerDaysList.length + 5}
                          className="py-8 text-center text-slate-400 italic"
                        >
                          No employees found for the selected register criteria.
                        </td>
                      </tr>
                    ) : (
                      registerStaffList.map((s) => {
                        let pCount = 0;
                        let aCount = 0;
                        let lCount = 0;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {s.firstName} {s.lastName}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                {s.empId || s.id}
                              </span>
                            </td>

                            {registerDaysList.map((item, idx) => {
                              const record = (attendance || []).find(
                                (r) =>
                                  r.entityType === "Staff" &&
                                  r.entityId === s.id &&
                                  r.date === item.dateStr,
                              );

                              let code = "P";
                              let badgeStyle = "text-brand-700 bg-brand-50";

                              if (record) {
                                if (record.status === "Present") {
                                  code = "P";
                                  pCount++;
                                } else if (record.status === "Absent") {
                                  code = "A";
                                  aCount++;
                                  badgeStyle =
                                    "text-rose-700 bg-rose-100 font-bold";
                                } else if (record.status === "Leave") {
                                  code = "L";
                                  lCount++;
                                  badgeStyle =
                                    "text-sky-700 bg-sky-100 font-bold";
                                } else if (
                                  record.status === "HalfDay" ||
                                  record.status === "Late"
                                ) {
                                  code = "HD";
                                  pCount += 0.5;
                                  badgeStyle =
                                    "text-amber-700 bg-amber-100 font-bold";
                                }
                              } else {
                                pCount++;
                              }

                              return (
                                <td
                                  key={idx}
                                  className="py-2 px-0.5 text-center font-mono font-bold text-[10px]"
                                >
                                  <span
                                    className={`inline-block w-6 py-0.5 rounded ${badgeStyle}`}
                                  >
                                    {code}
                                  </span>
                                </td>
                              );
                            })}

                            <td className="py-2 px-2 text-center font-bold text-brand-600">
                              {pCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-rose-600">
                              {aCount}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-sky-600">
                              {lCount}
                            </td>
                            <td className="py-2 px-2 text-center font-extrabold text-sky-600">
                              {registerDaysList.length > 0
                                ? Math.round(
                                    (pCount / registerDaysList.length) * 100,
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
            </div>
          </div>
        )}


    </div>
  );
};

export default StaffAttendanceView;
