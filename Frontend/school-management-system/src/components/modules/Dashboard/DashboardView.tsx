import React, { useMemo, useState, useEffect } from 'react';
import {
  UserCheck, Users, Calendar, Cake, ArrowRight, Sparkles, 
  WalletCards, ClipboardList, CheckSquare, Bell, BookOpen, Building, Sun, Moon
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../common/Badge';

import { TeacherDashboardView } from './TeacherDashboardView';
import { ParentDashboardView } from './ParentDashboardView';
import { StudentDashboardView } from './StudentDashboardView';
import { LibrarianDashboardView } from './LibrarianDashboardView';
import { DashboardShimmer } from '../../common/DashboardShimmer';

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

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
  }, [userRole]);

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

  // Pie chart calculation (Student Attendance)
  const attendanceStats = useMemo(() => {
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    
    if (todayStudentAttendanceSummary && todayStudentAttendanceSummary.totalDays > 0) {
      present = todayStudentAttendanceSummary.present;
      absent = todayStudentAttendanceSummary.absent;
      late = todayStudentAttendanceSummary.late;
      halfDay = todayStudentAttendanceSummary.halfDay;
    } else {
       // Mock fallback mapped to real student count
       present = Math.floor(students.length * 0.85);
       late = Math.floor(students.length * 0.05);
       halfDay = Math.floor(students.length * 0.02);
       absent = students.length - present - late - halfDay;
    }
    const total = present + absent + late + halfDay || 1;
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = 100 - presentPct - latePct - halfDayPct;

    const pEnd = presentPct;
    const lEnd = pEnd + latePct;
    const hdEnd = lEnd + halfDayPct;

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd, lEnd, hdEnd
    };
  }, [todayStudentAttendanceSummary, students.length]);

  // Pie chart calculation (Teaching Staff Attendance)
  const [staffAttendanceTab, setStaffAttendanceTab] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  
  const teacherAttendanceStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const teachingStaffIds = new Set(teachingStaff.map(s => s.id));
    const todayAttendance = attendance.filter(a => a.entityType === 'Staff' && a.date === todayStr && teachingStaffIds.has(a.entityId));
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present') present++;
        else if (a.status === 'Late') late++;
        else if (a.status === 'HalfDay') halfDay++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    } else {
       // Mock data if no attendance found for today
       present = Math.floor(teachingStaff.length * 0.90);
       late = Math.floor(teachingStaff.length * 0.03);
       halfDay = Math.floor(teachingStaff.length * 0.02);
       absent = teachingStaff.length - present - late - halfDay;
    }
    const total = present + absent + late + halfDay || 1;
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = 100 - presentPct - latePct - halfDayPct;

    const pEnd = presentPct;
    const lEnd = pEnd + latePct;
    const hdEnd = lEnd + halfDayPct;

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd, lEnd, hdEnd
    };
  }, [attendance, teachingStaff]);

  // Section 2: Non-Teaching Staff Attendance calculation
  const nonTeachingAttendanceStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const nonTeachingStaffIds = new Set(nonTeachingStaff.map(s => s.id));
    const todayAttendance = attendance.filter(a => a.entityType === 'Staff' && a.date === todayStr && nonTeachingStaffIds.has(a.entityId));
    let present = 0; let absent = 0; let late = 0; let halfDay = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present') present++;
        else if (a.status === 'Late') late++;
        else if (a.status === 'HalfDay') halfDay++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    } else {
       // Mock data if no attendance found for today
       present = Math.floor(nonTeachingStaff.length * 0.92);
       late = Math.floor(nonTeachingStaff.length * 0.04);
       halfDay = Math.floor(nonTeachingStaff.length * 0.01);
       absent = nonTeachingStaff.length - present - late - halfDay;
    }
    const total = present + absent + late + halfDay || 1;
    const presentPct = Math.round((present / total) * 100);
    const latePct = Math.round((late / total) * 100);
    const halfDayPct = Math.round((halfDay / total) * 100);
    const absentPct = 100 - presentPct - latePct - halfDayPct;

    const pEnd = presentPct;
    const lEnd = pEnd + latePct;
    const hdEnd = lEnd + halfDayPct;

    return { 
      present, absent, late, halfDay, total, 
      presentPct, latePct, halfDayPct, absentPct,
      pEnd, lEnd, hdEnd
    };
  }, [attendance, nonTeachingStaff]);

  const activeStaffStats = staffAttendanceTab === 'Teaching' ? teacherAttendanceStats : nonTeachingAttendanceStats;

  // Class wise strength calculation
  const classCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    academicClasses.forEach(c => { counts[c.name] = 0; });
    students.forEach(s => {
      const cName = s.className.startsWith('Class ') ? s.className : `Class ${s.className}`;
      if (counts[cName] !== undefined) {
        counts[cName]++;
      }
    });
    return counts;
  }, [academicClasses, students]);

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

    // Filter for upcoming items (today onwards)
    const upcoming = all.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() >= today.getTime();
    });

    if (upcoming.length > 0) {
      return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
    }

    // Fallback: If all are in the past or none upcoming, sort closest by date
    return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  }, [schoolEvents, announcements, holidays]);

  // Valid examinations with names, sorted by date
  const validExams = useMemo(() => {
    return exams
      .filter(ex => ex.name && ex.name.trim() !== '')
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
  }, [exams]);

  // Upcoming Teacher Birthdays
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

      // Show birthday if it's within the next 365 days, sorted by proximity
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
    });

    // Sort by days until birthday
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }, [staff]);

  if (loading) {
    return <DashboardShimmer />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 py-2 px-4 text-slate-900 dark:text-white border border-brand-200 dark:border-slate-800 shadow-xs">
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
          <div className="hidden md:flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div onClick={() => onNavigate('students')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-indigo-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 transition-colors">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Total Students</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{(totalStudentCount || students.length).toLocaleString()}</p>
        </div>
        
        {/* Total Teaching Staff */}
        <div onClick={() => onNavigate('staff')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-emerald-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-slate-700 transition-colors">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Teaching Staff</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{teachingStaff.length.toLocaleString()}</p>
        </div>

        {/* Total Non-Teaching Staff */}
        <div onClick={() => onNavigate('staff-non-teaching')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-rose-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-slate-700 transition-colors">
              <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Non-Teaching Staff</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{nonTeachingStaff.length.toLocaleString()}</p>
        </div>

        {/* Total Classes */}
        <div onClick={() => onNavigate('academics')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-amber-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-slate-700 transition-colors">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Total Classes</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{academicClasses.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Row: Attendance & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pie Chart: Student Attendance */}
          <div onClick={() => onNavigate('attendance')} className="lg:col-span-4 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[300px]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Student Attendance</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Today's overall student attendance</p>
                </div>
                <div className="shrink-0">
                  <Badge variant="info">Total: {attendanceStats.total}</Badge>
                </div>
              </div>
            <div className="flex-1 flex flex-col items-center justify-center pt-2">
              <div 
                className="w-40 h-40 rounded-full shrink-0 relative flex items-center justify-center group/chart cursor-pointer"
                style={{
                  background: `conic-gradient(
                    #4ade80 0% ${attendanceStats.pEnd}%, 
                    #facc15 ${attendanceStats.pEnd}% ${attendanceStats.lEnd}%, 
                    #fb923c ${attendanceStats.lEnd}% ${attendanceStats.hdEnd}%, 
                    #f87171 ${attendanceStats.hdEnd}% 100%
                  )`
                }}
              >
                {/* Inner Donut Circle (Normal state) */}
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner group-hover/chart:scale-95 transition-transform duration-200">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{attendanceStats.presentPct}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
                </div>

                {/* Tooltip Overlay displayed inside the circle on hover */}
                <div className="absolute inset-0 bg-slate-950/95 dark:bg-slate-900/95 text-white rounded-full opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center shadow-lg border border-slate-700/50">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 w-24 pb-0.5">Details</p>
                  <div className="text-[9px] font-bold space-y-0.5 text-left">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                      <span>Present: {attendanceStats.present} ({attendanceStats.presentPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#facc15' }} />
                      <span>Late: {attendanceStats.late} ({attendanceStats.latePct}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#fb923c' }} />
                      <span>Half Day: {attendanceStats.halfDay} ({attendanceStats.halfDayPct}%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                      <span>Absent: {attendanceStats.absent} ({attendanceStats.absentPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
            {/* Pie Chart: Staff Attendance */}
            <div onClick={() => onNavigate(staffAttendanceTab === 'Teaching' ? 'staff' : 'staff-non-teaching')} className="lg:col-span-5 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[300px]">
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Staff Attendance</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Today's overall staff attendance</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setStaffAttendanceTab('Teaching'); }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${staffAttendanceTab === 'Teaching' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Teaching
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setStaffAttendanceTab('Non-Teaching'); }}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${staffAttendanceTab === 'Non-Teaching' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Non-Teaching
                  </button>
                </div>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center pt-2">
                <div 
                  className="w-40 h-40 rounded-full shrink-0 relative flex items-center justify-center group/chart cursor-pointer"
                  style={{
                    background: `conic-gradient(
                      #4ade80 0% ${activeStaffStats.pEnd}%, 
                      #facc15 ${activeStaffStats.pEnd}% ${activeStaffStats.lEnd}%, 
                      #fb923c ${activeStaffStats.lEnd}% ${activeStaffStats.hdEnd}%, 
                      #f87171 ${activeStaffStats.hdEnd}% 100%
                    )`
                  }}
                >
                  {/* Inner Donut Circle (Normal state) */}
                  <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner group-hover/chart:scale-95 transition-transform duration-200">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{activeStaffStats.presentPct}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
                  </div>

                  {/* Tooltip Overlay displayed inside the circle on hover */}
                  <div className="absolute inset-0 bg-slate-950/95 dark:bg-slate-900/95 text-white rounded-full opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center shadow-lg border border-slate-700/50">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 w-24 pb-0.5">Details</p>
                    <div className="text-[9px] font-bold space-y-0.5 text-left">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                        <span>Present: {activeStaffStats.present} ({activeStaffStats.presentPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#facc15' }} />
                        <span>Late: {activeStaffStats.late} ({activeStaffStats.latePct}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#fb923c' }} />
                        <span>Half Day: {activeStaffStats.halfDay} ({activeStaffStats.halfDayPct}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                        <span>Absent: {activeStaffStats.absent} ({activeStaffStats.absentPct}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Upcoming Events & Holidays */}
          <div onClick={() => onNavigate('events')} className="lg:col-span-3 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[300px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5 text-brand-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Upcoming Events & Holidays</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {upcomingEventsAndHolidays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No upcoming events or holidays.</p>
              ) : upcomingEventsAndHolidays.map(e => (
                <div key={e.id} className={`flex items-center justify-between p-3 rounded-xl text-xs border ${e.type === 'Holiday' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'}`}>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                    <p className="text-[10px] text-slate-500">{e.category}</p>
                  </div>
                  <span className={`font-semibold px-2 py-1 rounded-lg text-[10px] shrink-0 ml-2 ${e.type === 'Holiday' ? 'bg-amber-100 text-amber-700 dark:bg-amber-855 dark:text-amber-100' : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'}`}>
                    {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Pending Approvals, Examinations & Birthdays */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 flex flex-col h-[250px]">
            <div className="flex items-center gap-2 shrink-0">
              <Bell className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pt-2 pr-1">
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('staff-leave')} 
                className={`w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 ${isLibrarian ? 'cursor-default' : 'hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors'}`}
              >
                <div className="flex flex-col items-start text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Leave Requests</span>
                  <span className="text-[10px] text-slate-500">Requires manager approval</span>
                </div>
                <Badge variant="warning">{pendingLeaves.length} Pending</Badge>
              </div>
              <div 
                onClick={isLibrarian ? undefined : () => onNavigate('admissions')} 
                className={`w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 ${isLibrarian ? 'cursor-default' : 'hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors'}`}
              >
                <div className="flex flex-col items-start text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Admissions</span>
                  <span className="text-[10px] text-slate-500">Submitted / Under Review</span>
                </div>
                <Badge variant="info">{pendingAdmissions.length} Pending</Badge>
              </div>
            </div>
          </div>

          {/* Examinations info container */}
          <div 
            onClick={isLibrarian ? undefined : () => onNavigate('examination')} 
            className={`lg:col-span-5 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 flex flex-col h-[250px] ${isLibrarian ? 'cursor-default' : 'cursor-pointer hover:border-brand-400 transition-colors'}`}
          >
            <div className="flex items-center gap-2 shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Examinations</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {validExams.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No exams scheduled.</p>
              ) : validExams.map(ex => {
                const classLabel = (ex.applicableClasses && ex.applicableClasses.length > 0)
                  ? ex.applicableClasses.join(', ')
                  : (ex.className || 'All Classes');
                return (
                  <div key={ex.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{ex.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{classLabel}</p>
                    </div>
                    <span className="font-semibold px-2 py-0.5 rounded-md text-[9px] shrink-0 ml-auto bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {ex.startDate ? new Date(ex.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Teacher Birthdays */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-xl space-y-4 transition-colors flex flex-col h-[250px]">
            <div className="flex items-center gap-2 shrink-0">
              <Cake className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Teacher Birthdays</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {upcomingBirthdays.length === 0 ? (
                 <p className="text-xs text-slate-500 py-4 text-center">No upcoming birthdays.</p>
              ) : upcomingBirthdays.map(b => (
                <div key={b.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 text-xs border border-rose-100/50 dark:border-rose-950">
                  <img src={b.avatar || 'https://ui-avatars.com/api/?name='+b.name} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{b.dob} • {b.role}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isLibrarian ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-rose-500 text-white'} shrink-0`}>
                    {isLibrarian ? '🎂 Birthday' : '🎂 Wish'}
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
