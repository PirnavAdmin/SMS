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
import { DashboardShimmer } from '../../common/DashboardShimmer';

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
      <div className="relative flex items-center justify-center shrink-0 w-[110px] h-[110px] group/chart cursor-pointer">
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
              stroke="#f59e0b"
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
              stroke="#fb923c"
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
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Late: {lateVal} ({latePct}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" style={{ backgroundColor: '#fb923c' }} />
              <span>Half: {halfDayVal} ({halfDayPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 flex flex-col justify-center space-y-1.5 pl-1.5 text-[10.5px]">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Present</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {presentVal} ({presentPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Absent</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {absentVal} ({absentPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-350">Late</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {lateVal} ({latePct}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" style={{ backgroundColor: '#fb923c' }} />
            <span className="font-bold text-slate-700 dark:text-slate-350">Half Day</span>
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {halfDayVal} ({halfDayPct}%)
          </span>
        </div>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 font-bold flex justify-between">
          <span>Total {type === 'students' ? 'Students' : type === 'teaching-staff' ? 'Teaching Staff' : type === 'non-teaching-staff' ? 'Non-Teaching Staff' : 'Staff'}</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, selectedAcademicYear } = useAuth();
  const {
    students, staff, announcements, holidays, schoolEvents,
    schoolProfile, admissions, leaveApplications, attendance,
    academicClasses, departments, birthdays, exams,
    fetchStudents, fetchAdmissions, fetchAcademicClasses,
    totalStudentCount, todayStudentAttendanceSummary, fetchTodayStudentAttendanceSummary
  } = useData();
  const fetchStaff = (useData() as any).fetchStaff || (async () => {});

  const userRole = user?.role?.toLowerCase() || '';
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadSummaryData = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await fetchDashboardSummaryApi();
      if (res && res.success && res.data) {
        setSummaryData(res.data);
      } else if (res && (res as any).totalStudents !== undefined) {
        setSummaryData(res as any);
      }
    } catch (err: any) {
      console.error("Error loading real-time dashboard summary:", err);
      setSummaryError("Failed to fetch real-time dashboard summary.");
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

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadSummaryData(),
          fetchStudents(),
          typeof fetchStaff === 'function' ? fetchStaff() : Promise.resolve(),
          fetchAdmissions(),
          fetchAcademicClasses(),
          fetchTodayStudentAttendanceSummary()
        ]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [userRole, selectedAcademicYear]);

  if (userRole === 'student') return <StudentDashboardView onNavigate={onNavigate} />;
  if (userRole === 'parent') return <ParentDashboardView onNavigate={onNavigate} />;
  if (['teacher', 'class-teacher'].includes(userRole)) return <TeacherDashboardView onNavigate={onNavigate} />;
  if (['librarian', 'library'].includes(userRole)) return <LibrarianDashboardView onNavigate={onNavigate} />;

  const formatAcademicYearDisplay = (ay?: string) => {
    if (!ay) return '2026-27';
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
  
  const teachingStaff = useMemo(() => staff.filter(s => s.employeeCategory === 'Teacher' || s.role === 'Teacher' || s.designation?.toLowerCase().includes('teacher') || s.department?.toLowerCase() === 'academic'), [staff]);
  const nonTeachingStaff = useMemo(() => staff.filter(s => !teachingStaff.includes(s)), [staff, teachingStaff]);

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
    const teachingStaffIds = new Set(teachingStaff.map(s => String(s.id)));
    const todayAttendance = (attendance || []).filter(a => (!a.entityType || a.entityType.toLowerCase() === 'staff') && a.date === todayStr && teachingStaffIds.has(String(a.entityId)));
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present') present++;
        else if (a.status === 'Late') late++;
        else if (a.status === 'HalfDay' || a.status === 'Half Day') halfDay++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    }
    const total = summaryData?.teachingStaff || teachingStaff.length || (present + absent + late + halfDay) || 1;
    const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const latePct = total > 0 ? Math.round((late / total) * 100) : 0;
    const halfDayPct = total > 0 ? Math.round((halfDay / total) * 100) : 0;
    const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
    };
  }, [summaryData, attendance, teachingStaff]);

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
    const nonTeachingStaffIds = new Set(nonTeachingStaff.map(s => String(s.id)));
    const todayAttendance = (attendance || []).filter(a => (!a.entityType || a.entityType.toLowerCase() === 'staff') && a.date === todayStr && nonTeachingStaffIds.has(String(a.entityId)));
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present') present++;
        else if (a.status === 'Late') late++;
        else if (a.status === 'HalfDay' || a.status === 'Half Day') halfDay++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    }
    const total = summaryData?.nonTeachingStaff || nonTeachingStaff.length || (present + absent + late + halfDay) || 1;
    const presentPct = total > 0 ? Math.round((present / total) * 100) : 0;
    const latePct = total > 0 ? Math.round((late / total) * 100) : 0;
    const halfDayPct = total > 0 ? Math.round((halfDay / total) * 100) : 0;
    const absentPct = Math.max(0, 100 - presentPct - latePct - halfDayPct);

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd: presentPct, lEnd: presentPct + latePct, hdEnd: presentPct + latePct + halfDayPct
    };
  }, [summaryData, attendance, nonTeachingStaff]);

  const activeStaffStats = staffAttendanceTab === 'Teaching' ? teacherAttendanceStats : nonTeachingAttendanceStats;

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
    students.forEach(s => {
      const cName = s.className.startsWith('Class ') ? s.className : `Class ${s.className}`;
      if (counts[cName] !== undefined) {
        counts[cName]++;
      }
    });
    return counts;
  }, [summaryData, academicClasses, students]);

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

    return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
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
  }, [staff]);

  if (loading) {
    return <DashboardShimmer />;
  }  return (
    <div className="space-y-6 animate-in fade-in p-1">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 py-3 px-5 text-slate-900 dark:text-white border border-sky-200 dark:border-sky-900/40 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-100/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-brand-900 dark:text-white flex items-center gap-2">
                <span>{greeting}, {user?.name || (isLibrarian ? 'Librarian' : 'Admin')}</span>
                <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
              </h1>
              {isLibrarian && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                  👁️ Librarian Executive Overview (View-Only)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-[10px] font-black leading-none text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      {summaryError && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{summaryError} (Displaying latest session state)</span>
          </div>
          <button
            onClick={loadSummaryData}
            className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div onClick={() => onNavigate('students')} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Students</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(summaryData ? summaryData.totalStudents : (totalStudentCount || students.length)).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-100/50 dark:border-sky-900/30">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        
        {/* Total Teaching Staff */}
        <div onClick={() => onNavigate('staff')} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Teaching Staff</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(summaryData ? summaryData.teachingStaff : teachingStaff.length).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-100/50 dark:border-emerald-900/30">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Non-Teaching Staff */}
        <div onClick={() => onNavigate('staff-non-teaching')} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Non-Teaching Staff</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(summaryData ? summaryData.nonTeachingStaff : nonTeachingStaff.length).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 border border-rose-100/50 dark:border-rose-900/30">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Classes */}
        <div onClick={() => onNavigate('academics')} className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Total Classes</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{(summaryData ? summaryData.totalClasses : academicClasses.length).toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 border border-amber-100/50 dark:border-amber-900/30">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>
          {/* Quick Actions Panel */}
      <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs p-6 rounded-2xl flex flex-col gap-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
          <button 
            onClick={() => onNavigate('events')} 
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-50 text-brand-700 dark:bg-slate-850 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 transition-colors shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            View Calendar <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button 
            onClick={() => onNavigate('students')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-blue-500" />
            Add Student
          </button>
          <button 
            onClick={() => onNavigate('staff')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-emerald-500" />
            Add Staff
          </button>
          <button 
            onClick={() => onNavigate('academics')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-amber-500" />
            Create Class
          </button>
          <button 
            onClick={() => onNavigate('examination')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <ClipboardList className="w-4 h-4 text-rose-500" />
            Create Exam
          </button>
          <button 
            onClick={() => onNavigate('attendance')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-indigo-500" />
            Mark Attendance
          </button>
          <button 
            onClick={() => onNavigate('communication')} 
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <Megaphone className="w-4 h-4 text-purple-500" />
            New Announcement
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Student Attendance Donut */}
          <div onClick={() => onNavigate('attendance')} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:border-slate-350 transition-all duration-300 p-6 rounded-2xl space-y-4 cursor-pointer flex flex-col h-[320px]">
            <div className="flex items-start justify-between gap-2 shrink-0 text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Student Attendance</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Today's overall student attendance</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center min-h-0">
              <PremiumDonutChart stats={attendanceStats} type="students" />
            </div>
          </div>

          {/* Staff Attendance Donut */}
          <div onClick={() => onNavigate(staffAttendanceTab === 'Teaching' ? 'staff' : 'staff-non-teaching')} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:border-slate-350 transition-all duration-300 p-6 rounded-2xl space-y-4 cursor-pointer flex flex-col h-[320px]">
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="text-left">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Staff Attendance</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Today's {staffAttendanceTab.toLowerCase()} staff attendance</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700/50 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setStaffAttendanceTab('Teaching')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${staffAttendanceTab === 'Teaching' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Teaching
                </button>
                <button
                  onClick={() => setStaffAttendanceTab('Non-Teaching')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all duration-200 ${staffAttendanceTab === 'Non-Teaching' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Non-Teaching
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0">
              <PremiumDonutChart stats={activeStaffStats} type={staffAttendanceTab === 'Teaching' ? 'teaching-staff' : 'non-teaching-staff'} />
            </div>
          </div>

          {/* Upcoming Events */}
          <div onClick={() => onNavigate('events')} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md hover:border-slate-350 transition-all duration-300 p-6 rounded-2xl space-y-4 cursor-pointer flex flex-col h-[320px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-left">
                <Calendar className="w-5 h-5 text-brand-600 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Upcoming Events & Holidays</h3>
              </div>
              <span className="text-[10px] font-bold text-brand-600 hover:underline">View All</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {upcomingEventsAndHolidays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No upcoming events.</p>
              ) : upcomingEventsAndHolidays.map(e => {
                const dObj = new Date(e.date);
                const dayStr = dObj.getDate().toString().padStart(2, '0');
                const monthStr = dObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                
                const categoryLabel = e.type === 'Holiday' ? 'Holiday' : (e.category?.includes('Exam') ? 'Exam' : 'Meeting');
                const badgeColors: Record<string, string> = {
                  'Meeting': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/30',
                  'Holiday': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/30',
                  'Exam': 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200/30',
                };
                
                return (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 font-mono shrink-0 w-11 h-11">
                        <span className="text-sm font-black text-slate-850 dark:text-white leading-none">{dayStr}</span>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 mt-1 leading-none">{monthStr}</span>
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{e.title}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">
                          {e.type === 'Holiday' ? 'School Closed' : '10:00 AM • Main Campus'}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold px-2 py-0.5 rounded-md text-[9px] shrink-0 ml-auto ${badgeColors[categoryLabel] || 'bg-slate-100 text-slate-750'}`}>
                      {categoryLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row: Pending Approvals, Upcoming Examinations and Teacher Birthdays (Symmetric 3 equal columns layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col h-[280px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
              </div>
              <button onClick={() => onNavigate('staff-leave')} className="text-xs font-bold text-brand-600 hover:text-brand-700">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1 scrollbar-thin">
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('admissions')} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-300">Admission Approvals</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-100/30">
                  {summaryData ? summaryData.pendingAdmissions : pendingAdmissions.length}
                </span>
              </div>
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('staff')} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-300">Staff Requests</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450 border border-amber-100/30">
                  {staff.filter(s => s.profileStatus === 'Incomplete').length || 3}
                </span>
              </div>
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('staff-leave')} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-300">Leave Requests</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-100/30">
                  {pendingLeaves.length}
                </span>
              </div>
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('fees')} 
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-colors text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-300">Fee Concessions</span>
                <span className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-450 border border-sky-100/30">
                  1
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Examinations */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col h-[280px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Examinations</h3>
              </div>
              <button onClick={() => onNavigate('examination')} className="text-xs font-bold text-brand-600 hover:text-brand-700">View All</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {validExams.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No exams scheduled.</p>
              ) : validExams.map(ex => {
                const classLabel = (ex.applicableClasses && ex.applicableClasses.length > 0)
                  ? `${ex.applicableClasses.length} Classes`
                  : '2 Classes';
                return (
                  <div key={ex.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{ex.name}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {ex.startDate ? new Date(ex.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 28, 2026'}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold px-2 py-0.5 rounded-md text-[9px] shrink-0 bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/20">
                      {classLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Teacher Birthdays */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs p-6 rounded-2xl space-y-4 flex flex-col h-[280px]">
            <div className="flex items-center gap-2 shrink-0">
              <Cake className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Faculty & Staff Birthdays</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {upcomingBirthdays.length === 0 ? (
                 <p className="text-xs text-slate-500 py-4 text-center">No upcoming birthdays.</p>
              ) : upcomingBirthdays.map(b => (
                <div key={b.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/20 dark:bg-rose-950/15 text-xs border border-rose-100/50 dark:border-rose-950/50 hover:bg-rose-100/40 transition-colors border-l-3 border-l-rose-400">
                  <img src={b.avatar || 'https://ui-avatars.com/api/?name='+b.name} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-rose-200/50" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                    <p className="text-[9px] text-slate-550 truncate mt-0.5">{b.dob} • {b.role}</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shrink-0 shadow-xs cursor-pointer select-none transition-colors">🎂 Wish</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
