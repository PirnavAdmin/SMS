import React, { useMemo } from 'react';
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

interface DashboardViewProps {
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, selectedAcademicYear } = useAuth();
  const {
    students, staff, announcements, holidays,
    schoolProfile, admissions, leaveApplications, attendance,
    academicClasses, departments, birthdays
  } = useData();

  const userRole = user?.role?.toLowerCase() || '';

  if (userRole === 'student') return <StudentDashboardView onNavigate={onNavigate} />;
  if (userRole === 'parent') return <ParentDashboardView onNavigate={onNavigate} />;
  if (['teacher', 'class-teacher'].includes(userRole)) return <TeacherDashboardView onNavigate={onNavigate} />;

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

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';  const teachingStaff = useMemo(() => staff.filter(s => s.employeeCategory === 'Teacher' || s.role === 'Teacher' || s.designation?.toLowerCase().includes('teacher') || s.department?.toLowerCase() === 'academic'), [staff]);
  const nonTeachingStaff = useMemo(() => staff.filter(s => !teachingStaff.includes(s)), [staff, teachingStaff]);

  // Pie chart calculation (Student Attendance)
  const attendanceStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.entityType === 'Student' && a.date === todayStr);
    let present = 0; let absent = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present' || a.status === 'Late' || a.status === 'HalfDay') present++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    } else {
       // Mock data if no attendance found for today
       present = Math.floor(students.length * 0.92);
       absent = students.length - present;
    }
    const total = present + absent || 1;
    return { present, absent, total, presentPct: Math.round((present / total) * 100) };
  }, [attendance, students.length]);

  // Pie chart calculation (Teaching Staff Attendance)
  const teacherAttendanceStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const teachingStaffIds = new Set(teachingStaff.map(s => s.id));
    const todayAttendance = attendance.filter(a => a.entityType === 'Staff' && a.date === todayStr && teachingStaffIds.has(a.entityId));
    let present = 0; let absent = 0;
    if (todayAttendance.length > 0) {
      todayAttendance.forEach(a => {
        if (a.status === 'Present' || a.status === 'Late' || a.status === 'HalfDay') present++;
        else if (a.status === 'Absent' || a.status === 'Leave') absent++;
      });
    } else {
       // Mock data if no attendance found for today
       present = Math.floor(teachingStaff.length * 0.95);
       absent = teachingStaff.length - present;
    }
    const total = present + absent || 1;
    return { present, absent, total, presentPct: Math.round((present / total) * 100) };
  }, [attendance, teachingStaff]);

  // Class-wise strength
  const classCounts: Record<string, number> = {};
  students.forEach(s => {
    classCounts[s.className] = (classCounts[s.className] || 0) + 1;
  });
  const maxStrength = Math.max(...Object.values(classCounts), 1);

  // Pending Approvals
  const pendingLeaves = leaveApplications?.filter(l => l.status === 'Pending') || [];
  const pendingAdmissions = admissions?.filter(a => a.status === 'Pending') || [];

  const upcomingEventsAndHolidays = useMemo(() => {
    const events = announcements.map(a => ({ id: a.id, title: a.title, category: a.category || 'Event', date: a.date, type: 'Event' }));
    const hols = holidays.map(h => ({ id: h.id, title: h.name, category: h.type || 'Holiday', date: h.startDate, type: 'Holiday' }));
    return [...events, ...hols].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8); // Changed to sort ascending (upcoming first)
  }, [announcements, holidays]);

  // Upcoming Teacher Birthdays (Next 30 days) - Using static birthdays as requested
  const upcomingBirthdays = useMemo(() => {
    return birthdays.slice(0, 5);
  }, [birthdays]);
  
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-sky-600 to-sky-600 p-4 sm:p-4 text-white shadow-xl shadow-brand-500/20 border border-brand-200 dark:border-brand-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {greeting}, {user?.name || 'Admin'}!
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 max-w-xl">
              Welcome to {schoolProfile.name}. Here's what's happening today.
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
             {hour < 17 ? <Sun className="w-8 h-8 text-yellow-300" /> : <Moon className="w-8 h-8 text-indigo-200" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div onClick={() => onNavigate('students')} className="glass-card p-4 rounded-3xl flex flex-col gap-2 cursor-pointer hover:border-brand-400 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 transition-colors">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Total Students</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{students.length.toLocaleString()}</p>
        </div>
        
        {/* Total Teaching Staff */}
        <div onClick={() => onNavigate('staff')} className="glass-card p-4 rounded-3xl flex flex-col gap-2 cursor-pointer hover:border-brand-400 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-slate-700 transition-colors">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Teaching Staff</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{teachingStaff.length.toLocaleString()}</p>
        </div>

        {/* Total Non-Teaching Staff */}
        <div onClick={() => onNavigate('staff')} className="glass-card p-4 rounded-3xl flex flex-col gap-2 cursor-pointer hover:border-brand-400 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-slate-700 transition-colors">
              <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Non-Teaching Staff</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{nonTeachingStaff.length.toLocaleString()}</p>
        </div>

        {/* Total Classes */}
        <div onClick={() => onNavigate('academics')} className="glass-card p-4 rounded-3xl flex flex-col gap-2 cursor-pointer hover:border-brand-400 group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-slate-700 transition-colors">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">Total Classes</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{academicClasses.length.toLocaleString()}</p>
        </div>
      </div>



      <div className="space-y-6">
        {/* Top Row: Attendance & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart: Student Attendance */}
          <div onClick={() => onNavigate('attendance')} className="glass-card p-6 rounded-3xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[340px]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Attendance</h3>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Today's overall student attendance</p>
                <Badge variant="info">Total: {attendanceStats.total}</Badge>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div 
                className="w-40 h-40 rounded-full shrink-0 relative flex items-center justify-center"
                style={{
                  background: `conic-gradient(#4ade80 0% ${attendanceStats.presentPct}%, #f87171 ${attendanceStats.presentPct}% 100%)`
                }}
              >
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{attendanceStats.presentPct}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs font-semibold">Present ({attendanceStats.present})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold">Absent ({attendanceStats.absent})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart: Teaching Staff Attendance */}
          <div onClick={() => onNavigate('staff')} className="glass-card p-6 rounded-3xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[340px]">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Teaching Staff Attendance</h3>
              <p className="text-xs text-slate-500">Today's overall teaching staff attendance</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div 
                className="w-40 h-40 rounded-full shrink-0 relative flex items-center justify-center"
                style={{
                  background: `conic-gradient(#4ade80 0% ${teacherAttendanceStats.presentPct}%, #f87171 ${teacherAttendanceStats.presentPct}% 100%)`
                }}
              >
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{teacherAttendanceStats.presentPct}%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs font-semibold">Present ({teacherAttendanceStats.present})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-xs font-semibold">Absent ({teacherAttendanceStats.absent})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events & Holidays */}
          <div onClick={() => onNavigate('events')} className="glass-card p-6 rounded-3xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[340px]">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Events & Holidays</h3>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {upcomingEventsAndHolidays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No upcoming events or holidays.</p>
              ) : upcomingEventsAndHolidays.map(e => (
                <div key={e.id} className={`flex items-center justify-between p-3 rounded-xl text-xs border ${e.type === 'Holiday' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/60 border-brand-200 dark:border-brand-800'}`}>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{e.title}</p>
                    <p className="text-[10px] text-slate-500">{e.category}</p>
                  </div>
                  <span className={`font-semibold px-2 py-1 rounded-lg text-[10px] shrink-0 ml-2 ${e.type === 'Holiday' ? 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-100' : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'}`}>
                    {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row: Pending Approvals & Birthdays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button onClick={() => onNavigate('staff-leaves')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors border border-brand-200 dark:border-brand-800">
                <div className="flex flex-col items-start text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Leave Requests</span>
                  <span className="text-xs text-slate-500">Requires manager approval</span>
                </div>
                <Badge variant="warning">{pendingLeaves.length} Pending</Badge>
              </button>
              <button onClick={() => onNavigate('admissions')} className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors border border-brand-200 dark:border-brand-800">
                <div className="flex flex-col items-start text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Admissions</span>
                  <span className="text-xs text-slate-500">Submitted / Under Review</span>
                </div>
                <Badge variant="info">{pendingAdmissions.length} Pending</Badge>
              </button>
            </div>
          </div>

          {/* Upcoming Teacher Birthdays */}
          <div onClick={() => onNavigate('staff-directory')} className="glass-card p-6 rounded-3xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors">
            <div className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Teacher Birthdays</h3>
            </div>
            <div className="space-y-3">
              {upcomingBirthdays.length === 0 ? (
                 <p className="text-xs text-slate-500 py-2 text-center">No upcoming birthdays.</p>
              ) : upcomingBirthdays.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 text-xs border border-brand-200 dark:border-brand-800">
                  <img src={b.avatar || 'https://ui-avatars.com/api/?name='+b.name} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{b.dob} • {b.role}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white shadow-sm shrink-0">🎂 Wish</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
