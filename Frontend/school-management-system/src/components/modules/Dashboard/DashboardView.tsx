// @ts-nocheck
import React, { useMemo, useState, useEffect } from 'react';
import {
  UserCheck, Users, Calendar, Cake, ArrowRight, Sparkles, 
  WalletCards, ClipboardList, CheckSquare, Bell, BookOpen, Building, Sun, Moon,
  UserPlus, Megaphone, TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';
import { fetchDashboardSummaryApi, DashboardSummaryResponse } from '../../../api/dashboard';

import { TeacherDashboardView } from './TeacherDashboardView';
import { ParentDashboardView } from './ParentDashboardView';
import { StudentDashboardView } from './StudentDashboardView';
import { LibrarianDashboardView } from './LibrarianDashboardView';
import { WardenDashboardView } from './WardenDashboardView';
import { DriverDashboardView } from './DriverDashboardView';
import { FinanceDashboardView } from '../Finance/FinanceDashboardView';
import { TransportDashboardView } from '../Transport/TransportDashboardView';
import { DashboardShimmer } from '../../common/DashboardShimmer';
import { EmployeesByDepartmentChart } from './EmployeesByDepartmentChart';
import { SpeedometerAttendanceCard } from './SpeedometerAttendanceCard';
import { PendingApprovalsCard } from './PendingApprovalsCard';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

const PremiumDonutChart: React.FC<{
  stats: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    presentPct: number;
    latePct: number;
    halfDayPct: number;
    absentPct: number;
  };
  type: 'students' | 'staff';
}> = ({ stats, type }) => {
  const [hoveredSegment, setHoveredSegment] = useState<{
    label: string;
    value: number;
    pct: number;
  } | null>(null);

  const total = stats.total || 1;
  const radius = 30;
  const circumference = 2 * Math.PI * radius; // ~188.5

  const presentVal = stats.present;
  const absentVal = stats.absent;
  const lateVal = stats.late;
  const halfDayVal = stats.halfDay;

  const presentPct = Math.round((presentVal / total) * 100);
  const absentPct = Math.round((absentVal / total) * 100);
  const latePct = Math.round((lateVal / total) * 100);
  const halfDayPct = Math.max(0, 100 - presentPct - absentPct - latePct);

  const rotPresent = -90;
  const rotAbsent = rotPresent + (presentVal / total) * 360;
  const rotLate = rotAbsent + (absentVal / total) * 360;
  const rotHalfDay = rotLate + (lateVal / total) * 360;

  return (
    <div className="flex items-center justify-between w-full h-full gap-2.5 text-left">
      {/* Circle SVG */}
      <div className="relative flex items-center justify-center shrink-0 w-[105px] h-[105px] group/chart cursor-pointer">
        <svg className="w-full h-full transform rotate-0" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="10"
          />
          {presentVal > 0 && (
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray={`${(presentVal / total) * circumference} ${circumference}`}
              strokeDashoffset="0"
              transform={`rotate(${rotPresent} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
              onMouseEnter={() => setHoveredSegment({ label: 'Present', value: presentVal, pct: presentPct })}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
          {absentVal > 0 && (
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="10"
              strokeDasharray={`${(absentVal / total) * circumference} ${circumference}`}
              strokeDashoffset="0"
              transform={`rotate(${rotAbsent} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
              onMouseEnter={() => setHoveredSegment({ label: 'Absent', value: absentVal, pct: absentPct })}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
          {lateVal > 0 && (
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="#f97316"
              strokeWidth="10"
              strokeDasharray={`${(lateVal / total) * circumference} ${circumference}`}
              strokeDashoffset="0"
              transform={`rotate(${rotLate} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
              onMouseEnter={() => setHoveredSegment({ label: 'Late', value: lateVal, pct: latePct })}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
          {halfDayVal > 0 && (
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray={`${(halfDayVal / total) * circumference} ${circumference}`}
              strokeDashoffset="0"
              transform={`rotate(${rotHalfDay} 40 40)`}
              className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
              onMouseEnter={() => setHoveredSegment({ label: 'Half Day', value: halfDayVal, pct: halfDayPct })}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none group-hover/chart:opacity-0 transition-opacity duration-200">
          <span className="text-xs font-black text-slate-900 dark:text-white leading-none">
            {hoveredSegment ? `${hoveredSegment.pct}%` : `${presentPct}%`}
          </span>
          <span className="text-[6.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            {hoveredSegment ? hoveredSegment.label : 'Present'}
          </span>
        </div>

        {/* Tooltip Overlay displayed inside the circle on hover */}
        <div className="absolute inset-0 bg-slate-950/95 dark:bg-slate-900/95 text-white rounded-full opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-2 text-center shadow-lg border border-slate-700/50 pointer-events-none">
          <p className="text-[7.5px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 w-16 pb-0.5">Details</p>
          <div className="text-[7.5px] font-bold space-y-0.5 text-left">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Pres: {presentVal} ({presentPct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Abs: {absentVal} ({absentPct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>Late: {lateVal} ({latePct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Half: {halfDayVal} ({halfDayPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 flex flex-col justify-center space-y-1 pl-1.5 text-[10px]">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Present</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {presentVal} ({presentPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Absent</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {absentVal} ({absentPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Late</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {lateVal} ({latePct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Half Day</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {halfDayVal} ({halfDayPct}%)
          </span>
        </div>
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[9.5px] text-slate-400 font-bold flex justify-between">
          <span>Total {type === 'students' ? 'Students' : type === 'teaching-staff' ? 'Teaching Staff' : type === 'non-teaching-staff' ? 'Non-Teaching Staff' : 'Staff'}</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, selectedAcademicYear, selectedBranch } = useAuth();
  const {
    students = [], staff = [], announcements = [], holidays = [], schoolEvents = [],
    schoolProfile, admissions = [], leaveApplications = [], attendance = [],
    academicClasses = [], departments = [], birthdays = [], exams = [],
    fetchStudents, fetchAdmissions, fetchAcademicClasses,
    totalStudentCount, todayStudentAttendanceSummary, fetchTodayStudentAttendanceSummary
  } = useData();
  const fetchStaff = (useData() as any).fetchStaff || (async () => {});

  const userRole = user?.role?.toLowerCase() || '';
  const hasRoleSpecificDashboard =
    userRole === 'student' ||
    userRole === 'parent' ||
    ['teacher', 'class-teacher'].includes(userRole) ||
    ['librarian', 'library'].includes(userRole) ||
    userRole.includes('warden') ||
    ['driver', 'bus driver', 'chauffeur'].includes(userRole) ||
    ['accountant', 'accounts', 'finance'].includes(userRole) ||
    ['transport manager', 'transport_manager', 'transport'].includes(userRole);
  const [loading, setLoading] = useState<boolean>(() => {
    return (students || []).length === 0 && (staff || []).length === 0 && (academicClasses || []).length === 0;
  });
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummaryData = async (branch?: string, ay?: string) => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const targetBranch = branch !== undefined ? branch : selectedBranch;
      const targetAY = ay !== undefined ? ay : selectedAcademicYear;
      const res = await fetchDashboardSummaryApi(targetBranch, targetAY);
      if (res && res.success && res.data) {
        setSummaryData(res.data);
      } else if (res && (res as any).totalStudents !== undefined) {
        setSummaryData(res as any);
      }
    } catch (err: any) {
      console.warn("Real-time dashboard summary backend notice:", err);
      if (!students || students.length === 0) {
        setSummaryError("Failed to fetch real-time dashboard summary.");
      } else {
        setSummaryError(null);
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    const isParentOrStudent = ['parent', 'student'].includes(userRole);
    if (isParentOrStudent) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        if (isMounted && (students || []).length === 0 && (staff || []).length === 0) {
          setLoading(true);
        }
        await Promise.all([
          loadSummaryData(selectedBranch, selectedAcademicYear),
          typeof fetchStudents === 'function' ? fetchStudents() : Promise.resolve(),
          typeof fetchStaff === 'function' ? fetchStaff() : Promise.resolve(),
          typeof fetchAdmissions === 'function' ? fetchAdmissions() : Promise.resolve(),
          typeof fetchAcademicClasses === 'function' ? fetchAcademicClasses() : Promise.resolve(),
          typeof fetchTodayStudentAttendanceSummary === 'function' ? fetchTodayStudentAttendanceSummary() : Promise.resolve()
        ]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [userRole, selectedAcademicYear, selectedBranch]);

  const formatAcademicYearDisplay = (ay?: string) => {
    if (!ay) return '';
    const parts = ay.split(/[-–]/);
    if (parts.length === 2) {
      const start = parts[0].trim();
      let end = parts[1].trim();
      if (end.length === 4) {
        end = end.substring(2);
      }
      return `${start}-${end}`;
    }
    return ay;
  };

  const currentSessionDisplay = formatAcademicYearDisplay(selectedAcademicYear);

  const isLibrarian = ['librarian', 'library'].includes(userRole);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const displayUserName = useMemo(() => {
    const rawName = (user?.name || '').trim();
    if (rawName && rawName.toLowerCase() !== 'user' && rawName.toLowerCase() !== 'administrator') {
      return rawName;
    }
    if (user?.email) {
      const username = user.email.split('@')[0];
      const parts = username.split(/[._-]/);
      const derived = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      if (derived) return derived;
    }
    return rawName || (isLibrarian ? 'Librarian' : (user?.role || ''));
  }, [user, isLibrarian]);
  
  const isBranchMatch = useMemo(() => {
    return (s: any) => {
      if (!selectedBranch || selectedBranch === 'All' || selectedBranch === 'All Branches' || selectedBranch === 'All Campuses') return true;
      const sBranch = (s.branch || s.branchName || s.campus || s.campusLocation || '').trim().toLowerCase();
      const selBranch = selectedBranch.trim().toLowerCase();
      if (!sBranch) return true;
      const sBranchBase = sBranch.replace(/ branch| campus/gi, '').trim();
      const selBranchBase = selBranch.replace(/ branch| campus/gi, '').trim();
      return (
        sBranch === selBranch ||
        sBranch.includes(selBranch) ||
        selBranch.includes(sBranch) ||
        (Boolean(sBranchBase && selBranchBase) && (sBranchBase === selBranchBase || sBranchBase.includes(selBranchBase) || selBranchBase.includes(sBranchBase)))
      );
    };
  }, [selectedBranch]);

  useEffect(() => {
    if (hasRoleSpecificDashboard) return;

    const handleLiveSync = () => {
      if (typeof fetchStudents === 'function') fetchStudents();
      if (typeof fetchAdmissions === 'function') fetchAdmissions();
      loadSummaryData(selectedBranch, selectedAcademicYear);
    };
    window.addEventListener('storage', handleLiveSync);
    window.addEventListener('students_updated', handleLiveSync);
    window.addEventListener('admissions_updated', handleLiveSync);
    return () => {
      window.removeEventListener('storage', handleLiveSync);
      window.removeEventListener('students_updated', handleLiveSync);
      window.removeEventListener('admissions_updated', handleLiveSync);
    };
  }, [hasRoleSpecificDashboard, selectedBranch, selectedAcademicYear]);

  const displayTotalStudents = useMemo(() => {
    if (summaryData?.totalStudents !== undefined) {
      return summaryData.totalStudents;
    }
    // Only count enrolled/active students for the selected branch
    const enrolledStudents = (students || []).filter(s => 
      isBranchMatch(s) && (s.status === 'Active' || s.status === 'Enrolled' || !s.status)
    );
    const existingAdmNos = new Set(
      students.flatMap(s => [
        String(s.admissionNo || '').trim().toLowerCase(),
        String(s.id || '').trim().toLowerCase(),
        String((s as any).admissionNumber || '').trim().toLowerCase(),
        String((s as any).rollNumber || '').trim().toLowerCase(),
        String(s.name || '').trim().toLowerCase()
      ]).filter(Boolean)
    );
    const enrolledAdmissions = (admissions || []).filter(a =>
      (a.status === 'Enrolled' || a.status === 'Admitted') &&
      isBranchMatch(a) &&
      !existingAdmNos.has(String(a.applicationNo || '').trim().toLowerCase()) &&
      !existingAdmNos.has(String((a as any).admissionNo || '').trim().toLowerCase()) &&
      !existingAdmNos.has(String(a.registrationNo || '').trim().toLowerCase()) &&
      !existingAdmNos.has(String(a.applicantName || '').trim().toLowerCase())
    );
    const liveEnrolledCount = enrolledStudents.length + enrolledAdmissions.length;
    if (liveEnrolledCount > 0) return liveEnrolledCount;
    if (summaryData?.enrolledAdmissions !== undefined && summaryData.enrolledAdmissions > 0) return summaryData.enrolledAdmissions;
    return totalStudentCount || enrolledStudents.length || 0;
  }, [students, admissions, isBranchMatch, summaryData, totalStudentCount]);

  const teachingStaff = useMemo(() => (staff || []).filter(s => {
    const isTeacher = s.employeeCategory === 'Teacher' || s.role === 'Teacher' || s.designation?.toLowerCase().includes('teacher') || s.department?.toLowerCase() === 'academic';
    return isTeacher && isBranchMatch(s);
  }), [staff, isBranchMatch]);

  const nonTeachingStaff = useMemo(() => (staff || []).filter(s => {
    const isTeacher = s.employeeCategory === 'Teacher' || s.role === 'Teacher' || s.designation?.toLowerCase().includes('teacher') || s.department?.toLowerCase() === 'academic';
    return !isTeacher && isBranchMatch(s);
  }), [staff, isBranchMatch]);

  const displayTeachingStaff = useMemo(() => {
    if (summaryData?.teachingStaff !== undefined && summaryData.teachingStaff > 0) {
      return summaryData.teachingStaff;
    }
    return teachingStaff.length;
  }, [summaryData, teachingStaff]);

  const displayNonTeachingStaff = useMemo(() => {
    if (summaryData?.nonTeachingStaff !== undefined && summaryData.nonTeachingStaff > 0) {
      return summaryData.nonTeachingStaff;
    }
    return nonTeachingStaff.length;
  }, [summaryData, nonTeachingStaff]);

  // Real-Time Student Attendance from Backend Summary
  const attendanceStats = useMemo(() => {
    if (summaryData?.studentAttendance && summaryData.studentAttendance.total > 0) {
      const { present, absent, late, halfDay, total, presentPct } = summaryData.studentAttendance;
      const latePct = Math.round((late / total) * 100);
      const halfDayPct = Math.round((halfDay / total) * 100);
      const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);
      return {
        present, absent, late, halfDay, total,
        presentPct, latePct, halfDayPct, absentPct,
        pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
      };
    }
    
    // Live attendance summary from attendance session records
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    if (todayStudentAttendanceSummary && todayStudentAttendanceSummary.totalDays > 0) {
      present = todayStudentAttendanceSummary.present;
      absent = todayStudentAttendanceSummary.absent;
      late = todayStudentAttendanceSummary.late;
      halfDay = todayStudentAttendanceSummary.halfDay;
    }
    const total = present + absent + late + halfDay || (summaryData?.totalStudents || students.length || 1);
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
    };
  }, [summaryData, todayStudentAttendanceSummary, students.length]);

  // Pie chart calculation (Teaching & Non-Teaching Staff Attendance)
  const [staffAttendanceTab, setStaffAttendanceTab] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  
  const teacherAttendanceStats = useMemo(() => {
    if (summaryData?.teachingStaffAttendance && summaryData.teachingStaffAttendance.total > 0) {
      const { present, absent, late, halfDay = 0, total, presentPct } = summaryData.teachingStaffAttendance;
      const latePct = Math.round((late / total) * 100);
      const halfDayPct = Math.round((halfDay / total) * 100);
      const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);
      return {
        present, absent, late, halfDay, total,
        presentPct, latePct, halfDayPct, absentPct,
        pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
      };
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const teacherInTime = localStorage.getItem('teacher_check_in_time');
    const teacherAttDate = localStorage.getItem('teacher_attendance_date');

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;

    teachingStaff.forEach((s) => {
      // 1. Check Approved Leave
      const isApprovedLeave = (leaveApplications || []).find((app) => {
        const isEmp =
          String(app.employeeId) === String(s.id) ||
          String(app.empId) === String(s.id) ||
          (s.empId && (String(app.employeeId) === String(s.empId) || String(app.empId) === String(s.empId)));
        const isApproved = (app.status || '').toLowerCase() === 'approved';
        const fromStr = String(app.fromDate || '').split('T')[0];
        const toStr = String(app.toDate || '').split('T')[0];
        return isEmp && isApproved && todayStr >= fromStr && todayStr <= toStr;
      });

      // 2. Check Recorded Attendance in DataContext
      const record = (attendance || []).find((a) => {
        const isStaff = !a.entityType || a.entityType.toLowerCase() === 'staff';
        const isDate = String(a.date || '').split('T')[0] === todayStr;
        const isId =
          String(a.entityId) === String(s.id) ||
          String(a.entityId) === String(s.empId) ||
          String((a as any).staffId) === String(s.id) ||
          String((a as any).staffId) === String(s.empId) ||
          String((a as any).employeeId) === String(s.id) ||
          String((a as any).employeeId) === String(s.empId);
        return isStaff && isDate && isId;
      });

      // 3. Check Logged-in Teacher Check-in in LocalStorage
      const isCurrentLoggedInUser =
        (user?.id && (String(user.id) === String(s.id) || String(user.id) === String(s.empId))) ||
        (user?.email && s.email && user.email.toLowerCase().trim() === s.email.toLowerCase().trim());
      const hasLocalCheckIn = isCurrentLoggedInUser && teacherAttDate === todayStr && !!teacherInTime;

      if (isApprovedLeave) {
        if (isApprovedLeave.isHalfDay) {
          halfDay++;
        } else {
          absent++;
        }
      } else if (record) {
        const st = (record.status || '').toLowerCase();
        if (st === 'present') present++;
        else if (st === 'late') late++;
        else if (st === 'halfday' || st === 'half day') halfDay++;
        else absent++;
      } else if (hasLocalCheckIn) {
        const checkInDate = new Date(teacherInTime!);
        const checkInHour = checkInDate.getHours();
        const checkInMin = checkInDate.getMinutes();
        if (checkInHour > 9 || (checkInHour === 9 && checkInMin > 0)) {
          late++;
        } else {
          present++;
        }
      } else {
        absent++;
      }
    });

    const total = teachingStaff.length || 1;
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
    };
  }, [attendance, teachingStaff, leaveApplications, user, summaryData]);

  // Section 2: Non-Teaching Staff Attendance calculation
  const nonTeachingAttendanceStats = useMemo(() => {
    if (summaryData?.nonTeachingStaffAttendance && summaryData.nonTeachingStaffAttendance.total > 0) {
      const { present, absent, late, halfDay = 0, total, presentPct } = summaryData.nonTeachingStaffAttendance;
      const latePct = Math.round((late / total) * 100);
      const halfDayPct = Math.round((halfDay / total) * 100);
      const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);
      return {
        present, absent, late, halfDay, total,
        presentPct, latePct, halfDayPct, absentPct,
        pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
      };
    }

    const todayStr = new Date().toLocaleDateString('en-CA');

    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;

    nonTeachingStaff.forEach((s) => {
      // 1. Check Approved Leave
      const isApprovedLeave = (leaveApplications || []).find((app) => {
        const isEmp =
          String(app.employeeId) === String(s.id) ||
          String(app.empId) === String(s.id) ||
          (s.empId && (String(app.employeeId) === String(s.empId) || String(app.empId) === String(s.empId)));
        const isApproved = (app.status || '').toLowerCase() === 'approved';
        const fromStr = String(app.fromDate || '').split('T')[0];
        const toStr = String(app.toDate || '').split('T')[0];
        return isEmp && isApproved && todayStr >= fromStr && todayStr <= toStr;
      });

      // 2. Check Recorded Attendance in DataContext
      const record = (attendance || []).find((a) => {
        const isStaff = !a.entityType || a.entityType.toLowerCase() === 'staff';
        const isDate = String(a.date || '').split('T')[0] === todayStr;
        const isId =
          String(a.entityId) === String(s.id) ||
          String(a.entityId) === String(s.empId) ||
          String((a as any).staffId) === String(s.id) ||
          String((a as any).staffId) === String(s.empId) ||
          String((a as any).employeeId) === String(s.id) ||
          String((a as any).employeeId) === String(s.empId);
        return isStaff && isDate && isId;
      });

      if (isApprovedLeave) {
        if (isApprovedLeave.isHalfDay) {
          halfDay++;
        } else {
          absent++;
        }
      } else if (record) {
        const st = (record.status || '').toLowerCase();
        if (st === 'present') present++;
        else if (st === 'late') late++;
        else if (st === 'halfday' || st === 'half day') halfDay++;
        else absent++;
      } else {
        absent++;
      }
    });

    const total = nonTeachingStaff.length || 1;
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
    };
  }, [attendance, nonTeachingStaff, leaveApplications, summaryData]);

  const activeStaffStats = staffAttendanceTab === 'Teaching' ? teacherAttendanceStats : nonTeachingAttendanceStats;

  // Real-time absent students list for Speedometer Attendance Card footer
  const absentStudents = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const absentRecords = (attendance || []).filter(a => {
      const isStudent = !a.entityType || a.entityType.toLowerCase() === 'student';
      const isToday = String(a.date || '').split('T')[0] === todayStr;
      const isAbsent = (a.status || '').toLowerCase() === 'absent';
      return isStudent && isToday && isAbsent;
    });

    const studentMap = new Map((students || []).map(s => [String(s.id), s]));
    (students || []).forEach(s => {
      if (s.admissionNo) studentMap.set(String(s.admissionNo), s);
    });

    const list: { name: string; avatar?: string; roleOrClass?: string }[] = [];
    absentRecords.forEach(rec => {
      const match = studentMap.get(String(rec.entityId));
      if (match) {
        list.push({
          name: match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim() || 'Student',
          avatar: (match as any).avatar || (match as any).photo,
          roleOrClass: match.className ? `${match.className}-${match.section || ''}` : undefined
        });
      }
    });

    // Graceful fallback if backend gave an absent count without raw logs
    if (list.length === 0 && attendanceStats.absent > 0) {
      const enrolledStudents = (students || []).filter(isBranchMatch);
      for (let i = 0; i < Math.min(attendanceStats.absent, 4); i++) {
        const s = enrolledStudents[i];
        if (s) {
          list.push({
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${i + 1}`,
            avatar: (s as any).avatar || (s as any).photo,
            roleOrClass: s.className ? `${s.className}-${s.section || ''}` : undefined
          });
        }
      }
    }

    return list;
  }, [attendance, students, attendanceStats.absent, isBranchMatch]);

  // Real-time absent staff list for Speedometer Attendance Card footer
  const absentStaffList = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const targetStaff = staffAttendanceTab === 'Teaching' ? teachingStaff : nonTeachingStaff;
    const staffMap = new Map(targetStaff.map(s => [String(s.id), s]));
    targetStaff.forEach(s => {
      if (s.empId) staffMap.set(String(s.empId), s);
    });

    const list: { name: string; avatar?: string; roleOrClass?: string }[] = [];

    // 1. Check approved full-day leave
    (leaveApplications || []).forEach(app => {
      const isApproved = (app.status || '').toLowerCase() === 'approved';
      const fromStr = String(app.fromDate || '').split('T')[0];
      const toStr = String(app.toDate || '').split('T')[0];
      if (isApproved && !app.isHalfDay && todayStr >= fromStr && todayStr <= toStr) {
        const match = staffMap.get(String(app.employeeId)) || staffMap.get(String(app.empId));
        if (match && !list.some(item => item.name === (match.name || `${match.firstName} ${match.lastName}`))) {
          list.push({
            name: match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim() || 'Staff',
            avatar: (match as any).avatar || (match as any).photo,
            roleOrClass: match.designation || match.department
          });
        }
      }
    });

    // 2. Check explicit absent records in attendance
    (attendance || []).forEach(rec => {
      const isStaff = !rec.entityType || rec.entityType.toLowerCase() === 'staff';
      const isToday = String(rec.date || '').split('T')[0] === todayStr;
      const isAbsent = (rec.status || '').toLowerCase() === 'absent';
      if (isStaff && isToday && isAbsent) {
        const match = staffMap.get(String(rec.entityId));
        if (match && !list.some(item => item.name === (match.name || `${match.firstName} ${match.lastName}`))) {
          list.push({
            name: match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim() || 'Staff',
            avatar: (match as any).avatar || (match as any).photo,
            roleOrClass: match.designation || match.department
          });
        }
      }
    });

    // Graceful fallback if backend returned summary absent count
    if (list.length === 0 && activeStaffStats.absent > 0) {
      for (let i = 0; i < Math.min(activeStaffStats.absent, 4); i++) {
        const s = targetStaff[i];
        if (s) {
          list.push({
            name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Staff ${i + 1}`,
            avatar: (s as any).avatar || (s as any).photo,
            roleOrClass: s.designation || s.department
          });
        }
      }
    }

    return list;
  }, [attendance, leaveApplications, staffAttendanceTab, teachingStaff, nonTeachingStaff, activeStaffStats.absent]);

  // Class wise strength calculation
  const classCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (summaryData?.classWiseStrength && summaryData.classWiseStrength.length > 0) {
      summaryData.classWiseStrength.forEach(item => {
        const cName = item.className.startsWith('Class ') ? item.className : `Class ${item.className}`;
        counts[cName] = item.studentCount;
      });
      return counts;
    }
    academicClasses.forEach(c => { counts[c.name] = 0; });
    const enrolledStudents = (students || []).filter(s => isBranchMatch(s) && (s.status === 'Active' || s.status === 'Enrolled' || !s.status));
    const existingAdmNos = new Set(students.map(s => String(s.admissionNo || s.id || '').trim().toLowerCase()));
    const enrolledAdmissions = (admissions || []).filter(a =>
      (a.status === 'Enrolled' || a.status === 'Admitted') &&
      isBranchMatch(a) &&
      !existingAdmNos.has(String(a.applicationNo || a.id || '').trim().toLowerCase())
    );

    enrolledStudents.forEach(s => {
      const cName = s.className ? (s.className.startsWith('Class ') ? s.className : `Class ${s.className}`) : '';
      if (cName && counts[cName] !== undefined) {
        counts[cName]++;
      }
    });
    enrolledAdmissions.forEach(a => {
      const cName = (a.gradeApplied || a.classApplied || a.className) ? ((a.gradeApplied || a.classApplied || a.className)!.startsWith('Class ') ? (a.gradeApplied || a.classApplied || a.className)! : `Class ${a.gradeApplied || a.classApplied || a.className}`) : '';
      if (cName && counts[cName] !== undefined) {
        counts[cName]++;
      }
    });
    return counts;
  }, [summaryData, academicClasses, students, admissions, isBranchMatch]);

  const sortedClasses = Object.entries(classCounts).sort((a, b) => {
    const numA = parseInt(a[0].replace(/\D/g, '')) || 0;
    const numB = parseInt(b[0].replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  const maxStrength = Math.max(...Object.values(classCounts), 1);

  // Pending Approvals
  const pendingLeaves = leaveApplications?.filter(l => l.status === 'Pending') || [];
  const pendingAdmissions = admissions?.filter(a => a.status === 'Pending') || [];

  const upcomingEventsAndHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventsList = (schoolEvents || []).map(e => ({
      id: `SE-${e.id}`,
      title: e.title,
      category: e.category || 'School Event',
      date: e.startDate,
      type: 'Event'
    }));

    const announces = (announcements || []).map(a => ({
      id: `AN-${a.id}`,
      title: a.title,
      category: a.category || 'Event',
      date: a.date,
      type: 'Event'
    }));

    const hols = (holidays || []).map(h => ({
      id: `HL-${h.id}`,
      title: h.name,
      category: h.type || 'Holiday',
      date: h.startDate,
      type: 'Holiday'
    }));

    const all = [...eventsList, ...announces, ...hols].filter(item => Boolean(item.date));

    // Filter for upcoming items (today onwards) - only return future events
    const upcoming = all.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() >= today.getTime();
    });

    const seen = new Set<string>();
    const deduplicated = upcoming.filter(item => {
      const key = `${(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  }, [schoolEvents, announcements, holidays]);

  // Valid examinations (upcoming or ongoing, sorted by date)
  const validExams = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return exams
      .filter(ex => ex.name && ex.name.trim() !== '')
      .filter(ex => {
        if (!ex.startDate) return true; // Keep TBD exams
        const examDate = new Date(ex.startDate);
        examDate.setHours(0, 0, 0, 0);
        return examDate.getTime() >= today.getTime();
      })
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }, [exams]);

  // Upcoming Teacher Birthdays (within the next 30 days)
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    const results: Array<{
      id: string | number;
      name: string;
      role: string;
      dob: string;
      avatar?: string;
      daysUntil: number;
    }> = [];

    staff.forEach(s => {
      if (!isBranchMatch(s)) return;
      if (!s.dob) return;
      
      // Parse dob string (expected YYYY-MM-DD or DD/MM/YYYY)
      let birthDate: Date;
      if (s.dob.includes('-')) {
        birthDate = new Date(s.dob);
      } else if (s.dob.includes('/')) {
        const [d, m, y] = s.dob.split('/');
        birthDate = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        return;
      }

      if (isNaN(birthDate.getTime())) return;

      // Calculate next occurrence of this birthday
      let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      // If birthday already passed this year, look at next year
      if (nextBday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
        nextBday.setFullYear(currentYear + 1);
      }

      // Calculate difference in days
      const diffTime = nextBday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Show birthday if it's within the next 30 days
      if (diffDays <= 30) {
        const formattedDay = nextBday.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        const dobLabel = diffDays === 0 
          ? 'Today' 
          : diffDays === 1 
            ? 'Tomorrow' 
            : formattedDay;

        results.push({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          role: s.designation || 'Teacher',
          dob: dobLabel,
          avatar: s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.firstName + ' ' + (s.lastName || ''))}`,
          daysUntil: diffDays
        });
      }
    });

    // Sort by days until birthday
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }, [staff, isBranchMatch]);

  if (userRole === 'student') return <StudentDashboardView onNavigate={onNavigate} />;
  if (userRole === 'parent') return <ParentDashboardView onNavigate={onNavigate} />;
  if (['teacher', 'class-teacher'].includes(userRole)) return <TeacherDashboardView onNavigate={onNavigate} />;
  if (['librarian', 'library'].includes(userRole)) return <LibrarianDashboardView onNavigate={onNavigate} />;
  if (userRole.includes('warden') || userRole === 'hostel warden') return <WardenDashboardView onNavigate={onNavigate} />;
  if (['driver', 'bus driver', 'chauffeur'].includes(userRole)) return <DriverDashboardView onNavigate={onNavigate} />;
  if (['accountant', 'accounts', 'finance'].includes(userRole)) return <FinanceDashboardView />;
  if (['transport manager', 'transport_manager', 'transport'].includes(userRole)) {
    return (
      <TransportDashboardView
        onNavigateToSection={(s) =>
          onNavigate(
            s === 'setup'
              ? 'transport-masters'
              : s === 'reports'
              ? 'transport-reports'
              : 'transport-operations'
          )
        }
      />
    );
  }

  if (loading) {
    return <DashboardShimmer />;
  }  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in">
      {/* Welcome Banner with School Illustration (Transparent / No Background) */}
      <div className="relative flex items-center justify-between text-slate-900 dark:text-white -mb-1">
        {/* Left side: Greeting */}
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {displayUserName}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
            {isLibrarian && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                👁️ Librarian Overview
              </span>
            )}
          </div>
        </div>

        {/* Right side: School Building Graphic Illustration with Expanded Panorama Landscape */}
        <div className="relative z-10 shrink-0 pointer-events-none select-none pl-3">
          <svg className="w-36 sm:w-52 md:w-64 h-12 sm:h-14 md:h-16 overflow-visible" viewBox="0 0 280 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sun */}
            <circle cx="248" cy="20" r="14" fill="#FDE68A" opacity="0.85" />
            <circle cx="248" cy="20" r="10" fill="#FBBF24" opacity="0.9" />

            {/* Clouds */}
            <ellipse cx="25" cy="20" rx="14" ry="7" fill="#E0F2FE" opacity="0.7" />
            <ellipse cx="35" cy="16" rx="11" ry="6" fill="#E0F2FE" opacity="0.8" />
            <ellipse cx="140" cy="24" rx="14" ry="7" fill="#E0F2FE" opacity="0.6" />
            <ellipse cx="210" cy="18" rx="12" ry="6" fill="#E0F2FE" opacity="0.7" />

            {/* Left Background Trees */}
            <circle cx="22" cy="80" r="13" fill="#86EFAC" />
            <circle cx="34" cy="74" r="14" fill="#4ADE80" />
            <circle cx="46" cy="76" r="12" fill="#22C55E" />

            {/* Main School Building Base */}
            <rect x="42" y="52" width="76" height="42" rx="3" fill="#FED7AA" stroke="#FDBA74" strokeWidth="1.5" />
            <rect x="64" y="38" width="32" height="56" rx="3" fill="#FFEDD5" stroke="#FDBA74" strokeWidth="1.5" />

            {/* Roof - Side Wings */}
            <path d="M38 52 L80 32 L80 52 Z" fill="#F87171" />
            <path d="M122 52 L80 32 L80 52 Z" fill="#EF4444" />
            
            {/* Central Tower Roof */}
            <polygon points="80,14 58,38 102,38" fill="#DC2626" />
            
            {/* Flagpole & Flag */}
            <line x1="80" y1="14" x2="80" y2="4" stroke="#78716C" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="80,4 93,8 80,12" fill="#EF4444" />

            {/* Central Clock */}
            <circle cx="80" cy="46" r="4.5" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
            <line x1="80" y1="46" x2="80" y2="43.5" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
            <line x1="80" y1="46" x2="82" y2="46" stroke="#475569" strokeWidth="1" strokeLinecap="round" />

            {/* Windows Left Wing */}
            <rect x="47" y="58" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="55" y="58" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="47" y="72" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="55" y="72" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />

            {/* Windows Right Wing */}
            <rect x="99" y="58" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="107" y="58" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="99" y="72" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="107" y="72" width="5.5" height="7.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />

            {/* Windows Center */}
            <rect x="70" y="58" width="7" height="8.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
            <rect x="83" y="58" width="7" height="8.5" rx="1" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />

            {/* Front Entrance Door */}
            <path d="M75 94 V78 Q80 74 85 78 V94 Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="1" />
            <line x1="80" y1="76" x2="80" y2="94" stroke="#1D4ED8" strokeWidth="1" />

            {/* Extended Right-Side Landscape Trees & Bushes */}
            <circle cx="124" cy="74" r="13" fill="#4ADE80" />
            <circle cx="136" cy="76" r="14" fill="#86EFAC" />
            
            {/* Tree 1 */}
            <rect x="150" y="80" width="3.5" height="14" fill="#92400E" rx="1" />
            <circle cx="152" cy="68" r="13" fill="#22C55E" />
            <circle cx="148" cy="64" r="9" fill="#4ADE80" />

            {/* Tree 2 (Tall dense canopy) */}
            <rect x="170" y="74" width="4" height="20" fill="#78350F" rx="1" />
            <circle cx="172" cy="56" r="16" fill="#16A34A" />
            <circle cx="166" cy="60" r="11" fill="#4ADE80" />
            <circle cx="178" cy="62" r="10" fill="#86EFAC" />

            {/* Tree 3 (Pine / Conifer) */}
            <polygon points="196,52 186,72 206,72" fill="#15803D" />
            <polygon points="196,64 184,82 208,82" fill="#16A34A" />
            <rect x="194.5" y="82" width="3" height="12" fill="#78350F" rx="1" />

            {/* Tree 4 (Lush round tree) */}
            <rect x="220" y="76" width="3.5" height="18" fill="#92400E" rx="1" />
            <circle cx="222" cy="60" r="14" fill="#22C55E" />
            <circle cx="218" cy="64" r="10" fill="#4ADE80" />
            <circle cx="228" cy="64" r="9" fill="#86EFAC" />

            {/* Tree 5 (Far Right Fluffy Tree) */}
            <rect x="246" y="78" width="3.5" height="16" fill="#78350F" rx="1" />
            <circle cx="248" cy="64" r="13" fill="#16A34A" />
            <circle cx="244" cy="68" r="9" fill="#4ADE80" />
            <circle cx="254" cy="68" r="8" fill="#86EFAC" />

            {/* Far Right Bushes */}
            <circle cx="266" cy="78" r="12" fill="#4ADE80" />
            <circle cx="274" cy="80" r="10" fill="#86EFAC" />

            {/* Ground / Pathway */}
            <path d="M6 94 Q140 92 276 94" stroke="#86EFAC" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M70 94 L73 101 L87 101 L90 94 Z" fill="#E2E8F0" />
          </svg>
        </div>
      </div>

      {summaryError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{summaryError} (Displaying latest session state)</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadSummaryData(selectedBranch, selectedAcademicYear)}
              className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
            <button
              onClick={() => setSummaryError(null)}
              className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer font-bold px-1 text-sm"
              title="Dismiss warning"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div onClick={() => onNavigate('students')} className="glass-card border-primary-interactive hover-tilt p-5 rounded-3xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">Total Students</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayTotalStudents.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-500/20 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        
        {/* Total Teaching Staff */}
        <div onClick={() => onNavigate('staff')} className="glass-card border-primary-interactive hover-tilt p-5 rounded-3xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">Teaching Staff</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayTeachingStaff.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-500/20 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Non-Teaching Staff */}
        <div onClick={() => onNavigate('staff-non-teaching')} className="glass-card border-primary-interactive hover-tilt p-5 rounded-3xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">Non-Teaching Staff</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayNonTeachingStaff.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 border border-rose-500/20 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Classes */}
        <div onClick={() => onNavigate('academics')} className="glass-card border-primary-interactive hover-tilt p-5 rounded-3xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">Total Classes</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(summaryData ? summaryData.totalClasses : academicClasses.length).toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 border border-amber-500/20 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Actions Panel - iPhone Liquid Glass Style */}
      <div className="glass-card border-primary-interactive p-6 rounded-3xl flex flex-col gap-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Quick Actions</h3>
          </div>
          <button 
            onClick={() => onNavigate('events')} 
            className="btn-glass-pill flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-sky-600 dark:text-sky-400 shrink-0 cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-500 stroke-[2.2]" />
            <span>View Calendar</span>
            <ArrowRight className="w-3 h-3 stroke-[2.5]" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-3.5">
          <button 
            onClick={() => onNavigate('students')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Add Student</span>
          </button>
          <button 
            onClick={() => onNavigate('staff')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Add Staff</span>
          </button>
          <button 
            onClick={() => onNavigate('academics')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Create Class</span>
          </button>
          <button 
            onClick={() => onNavigate('examination')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Create Exam</span>
          </button>
          <button 
            onClick={() => onNavigate('attendance')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Attendance</span>
          </button>
          <button 
            onClick={() => onNavigate('communication')} 
            className="btn-glass-pill flex flex-col sm:flex-row items-center justify-center gap-2.5 px-3 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 group active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/12 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="truncate">Announcement</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Top Row: Student Attendance, Staff Attendance, Events & Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Dynamic Speedometer Student Attendance Card */}
          <SpeedometerAttendanceCard
            title="Student Attendance"
            subtitle="Today's overall student attendance"
            iconType="students"
            stats={attendanceStats}
            onViewDetails={() => onNavigate('attendance')}
            className="lg:col-span-4 min-h-[350px] lg:h-[355px]"
          />

          {/* Dynamic Speedometer Staff Attendance Card */}
          <SpeedometerAttendanceCard
            title="Staff Attendance"
            subtitle={`Today's ${staffAttendanceTab.toLowerCase()} staff`}
            iconType="staff"
            headerRight={
              <div
                className="flex bg-slate-200/50 dark:bg-slate-800/80 p-0.5 rounded-xl border border-white/60 dark:border-white/10 shrink-0 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setStaffAttendanceTab('Teaching')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    staffAttendanceTab === 'Teaching'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Teaching
                </button>
                <button
                  type="button"
                  onClick={() => setStaffAttendanceTab('Non-Teaching')}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    staffAttendanceTab === 'Non-Teaching'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Non-Teaching
                </button>
              </div>
            }
            stats={activeStaffStats}
            onViewDetails={() => onNavigate('staff-attendance')}
            className="lg:col-span-4 min-h-[350px] lg:h-[355px]"
          />

          {/* Events & Holidays */}
          <div onClick={() => onNavigate('events')} className="lg:col-span-4 glass-card border-primary-interactive p-5 rounded-3xl cursor-pointer flex flex-col justify-between min-h-[350px] lg:h-[355px] active:scale-[0.99] transition-all">
            <div className="shrink-0 space-y-0.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 text-left">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">Events & Holidays</h3>
                </div>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0">View All</span>
              </div>
              <div className="min-h-[20px] flex items-center">
                <p className="text-[11px] text-slate-400 font-medium">Upcoming calendar activities</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin pt-2">
              {upcomingEventsAndHolidays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No upcoming events.</p>
              ) : upcomingEventsAndHolidays.map(e => {
                const dObj = new Date(e.date);
                const dayStr = dObj.getDate().toString().padStart(2, '0');
                const monthStr = dObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                
                const categoryLabel = e.type === 'Holiday' ? 'Holiday' : (e.category?.includes('Exam') ? 'Exam' : 'Meeting');
                const badgeColors: Record<string, string> = {
                  'Meeting': 'bg-purple-500/12 text-purple-700 dark:text-purple-300 border border-purple-500/25',
                  'Holiday': 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25',
                  'Exam': 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/25',
                };
                
                return (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-2xl glass-surface border border-white/60 dark:border-white/5 hover:border-sky-400/50 transition-all text-xs active:scale-[0.98]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="flex flex-col items-center justify-center p-1 rounded-xl btn-glass-secondary font-mono shrink-0 w-9 h-9">
                        <span className="text-xs font-black text-slate-850 dark:text-white leading-none">{dayStr}</span>
                        <span className="text-[7.5px] font-black text-sky-600 dark:text-sky-400 mt-0.5 leading-none">{monthStr}</span>
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="font-bold text-slate-850 dark:text-slate-100 text-xs truncate leading-snug">{e.title}</p>
                        <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                          {e.type === 'Holiday' ? 'School Closed' : 'Scheduled Event'}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[9px] shrink-0 ${badgeColors[categoryLabel] || 'bg-slate-100 text-slate-750'}`}>
                      {categoryLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle Row: Employees By Department (6 cols) + Pending Approvals (6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Employees By Department */}
          <div className="lg:col-span-6">
            <EmployeesByDepartmentChart onNavigate={onNavigate} className="h-[280px]" />
          </div>

          {/* Pending Approvals */}
          <div className="lg:col-span-6">
            <PendingApprovalsCard
              onNavigate={onNavigate}
              admissionsCount={summaryData ? summaryData.pendingAdmissions : pendingAdmissions.length}
              staffCount={(staff || []).filter(s => s.profileStatus === 'Incomplete').length || 3}
              leavesCount={pendingLeaves.length}
              feeCount={summaryData?.pendingFeeConcessions ?? 1}
              isLibrarian={isLibrarian}
              className="h-[280px]"
            />
          </div>
        </div>

        {/* Bottom Row: Upcoming Examinations (6 cols) and Upcoming Birthdays (6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Upcoming Examinations */}
          <div className="lg:col-span-6 glass-card border-primary-interactive p-5 sm:p-6 rounded-3xl flex flex-col justify-between h-[280px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Examinations</h3>
              </div>
              <button onClick={() => onNavigate('examination')} className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin max-h-[190px] pt-3 no-scrollbar">
              {validExams.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No exams scheduled.</p>
              ) : validExams.map(ex => {
                const classLabel = (ex.applicableClasses && ex.applicableClasses.length > 0)
                  ? `${ex.applicableClasses.length} Classes`
                  : '2 Classes';
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-2xl glass-surface border border-white/60 dark:border-white/5 hover:border-sky-400/50 text-xs transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{ex.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {ex.startDate ? new Date(ex.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 28, 2026'}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] shrink-0 bg-sky-500/12 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      {classLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Birthdays */}
          <div className="lg:col-span-6 glass-card border-primary-interactive p-5 sm:p-6 rounded-3xl flex flex-col justify-between h-[280px]">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-rose-500/12 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Cake className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Upcoming Birthdays</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin max-h-[190px] pt-3 no-scrollbar">
              {upcomingBirthdays.length === 0 ? (
                 <p className="text-xs text-slate-500 py-4 text-center">No upcoming birthdays.</p>
              ) : upcomingBirthdays.map(b => (
                <div key={b.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl glass-surface border border-white/60 dark:border-white/5 text-xs transition-colors border-l-4 border-l-rose-500">
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <img src={b.avatar || 'https://ui-avatars.com/api/?name='+b.name} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-rose-500/20" />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{b.role}</p>
                    </div>
                  </div>
                  <span className="font-bold px-2.5 py-0.5 rounded-full text-[10px] shrink-0 bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {b.dob}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
