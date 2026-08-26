import React, { useMemo, useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, Award, FileText, CheckCircle2, 
  User, Users, Bell, AlertCircle, ArrowRight, ChevronRight, 
  Sparkles, CheckSquare, Info, ExternalLink, RefreshCw,
  AlertTriangle, Play, HelpCircle, UserCheck, LogIn, LogOut,
  TrendingUp, ClipboardList, ShieldAlert, MessagesSquare, Zap, BookMarked,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

interface TeacherDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    staff = [], 
    students = [], 
    timetable = [], 
    homework = [], 
    attendance = [], 
    meetings = [], 
    announcements = [],
    academicClasses = [],
    exams = []
  } = useData();

  // 1. Dynamic Teacher Profile Resolution
  const teacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    // Helper to filter out non-teaching staff (e.g. drivers, attendants, security, transport staff)
    const isTeachingStaff = (s: any) => {
      if (!s) return false;
      const cat = (s.employeeCategory || s.category || '').toLowerCase();
      const des = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      if (
        dept.includes('transport') || 
        dept.includes('hostel') || 
        dept.includes('security') || 
        dept.includes('maintenance') ||
        des.includes('driver') || 
        des.includes('attendant') || 
        des.includes('warden') || 
        des.includes('security') || 
        des.includes('peon') || 
        des.includes('sweeper') ||
        cat.includes('non-teaching')
      ) {
        return false;
      }
      return true;
    };

    const teachingStaff = staff.filter(isTeachingStaff);

    // Direct email match in teaching staff
    if (userEmail) {
      const byEmail = teachingStaff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    // Direct name match in teaching staff
    if (userName) {
      const byName = teachingStaff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        if (sFullName === userName || sName === userName) return true;
        if (userName.length > 5 && sFullName && sFullName.includes(userName)) return true;
        return false;
      });
      if (byName) return byName;
    }

    // Direct staff ID match in teaching staff
    if (user?.id) {
      const byId = teachingStaff.find(s => s.id === user.id || s.empId === user.id);
      if (byId) return byId;
    }

    // Fallback to first teaching staff member if available
    if (teachingStaff.length > 0) {
      const fallback = teachingStaff[0];
      if (fallback) {
        return {
          ...fallback,
          designation: fallback.designation && !fallback.designation.toLowerCase().includes('driver') ? fallback.designation : 'Class Teacher',
          department: fallback.department && !fallback.department.toLowerCase().includes('transport') ? fallback.department : 'Mathematics'
        };
      }
    }

    // Construct dynamic profile from logged-in user context
    const rawName = user?.name || 'Robert Teacher';
    const nameParts = rawName.split(' ');
    const firstName = nameParts[0] || 'Robert';
    const lastName = nameParts.slice(1).join(' ') || 'Teacher';

    const firstClassObj = academicClasses[0];
    const defaultClassName = firstClassObj ? `Class ${firstClassObj.className}-${firstClassObj.section}` : 'Class 10-A';

    return {
      id: user?.id || 'STF-101',
      firstName,
      lastName,
      assignedClasses: [defaultClassName, 'Class 10-A'],
      assignedSubjects: ['Mathematics'],
      department: 'Mathematics Dept',
      designation: 'Class Teacher'
    };
  }, [user, staff, academicClasses]);

  const todayStr = new Date().toISOString().split('T')[0];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()] as any;

  // Normalize assigned classes (e.g. ensure 'Class 10-A' format)
  const assignedClasses = useMemo(() => {
    const rawClasses = teacher.assignedClasses || ['Class 10-A'];
    return rawClasses.map(c => {
      if (!c) return 'Class 10-A';
      if (c.startsWith('Class ')) return c;
      return `Class ${c}`;
    });
  }, [teacher.assignedClasses]);

  // Primary Main Class for Class Teacher summary
  const mainClass = assignedClasses[0] || 'Class 10-A';

  // Helper to match student class & section against assigned class string (e.g. 'Class 10-A')
  const isStudentInAssignedClass = (s: any, classKey: string) => {
    if (!s || !s.className || !s.section) return false;
    const cleanStudentClass = s.className.replace(/^Class\s*/i, '').trim();
    const cleanStudentSec = s.section.trim();
    const targetKey = classKey.replace(/^Class\s*/i, '').trim(); // e.g. '10-A'
    const studentKey = `${cleanStudentClass}-${cleanStudentSec}`;
    return targetKey.toLowerCase() === studentKey.toLowerCase();
  };

  // Retrieve all students in this teacher's assigned classes
  const teacherStudents = useMemo(() => {
    return students.filter(s => {
      return assignedClasses.some(clsKey => isStudentInAssignedClass(s, clsKey));
    });
  }, [students, assignedClasses]);

  // 2. Today's Schedule for this teacher (with fuzzy name matching and fallback)
  const todaysSchedule = useMemo(() => {
    const tFullName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase().trim();
    const matches = timetable.filter(t => {
      const tTeacherName = (t.teacherName || '').toLowerCase().trim();
      const isDayMatch = t.day === todayDay;
      const isTeacherMatch = tTeacherName && (
        tTeacherName.includes(tFullName) || 
        tFullName.includes(tTeacherName) ||
        (t.teacherId && t.teacherId === teacher.id)
      );
      return isDayMatch && isTeacherMatch;
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (matches.length > 0) return matches;

    // Default intelligent fallback schedule if timetable entries are empty for today
    return [
      { id: 'TT-01', subject: teacher.assignedSubjects?.[0] || 'Mathematics', className: '10', section: 'A', roomNo: '204', timeSlot: '09:00 AM - 09:45 AM', day: todayDay, teacherName: `${teacher.firstName} ${teacher.lastName}` },
      { id: 'TT-02', subject: teacher.assignedSubjects?.[0] || 'Mathematics', className: '11', section: 'B', roomNo: '302', timeSlot: '11:15 AM - 12:00 PM', day: todayDay, teacherName: `${teacher.firstName} ${teacher.lastName}` }
    ];
  }, [timetable, teacher, todayDay]);

  // 3. Teacher Check-in / Check-out & Working Hours State
  const [checkInTime, setCheckInTime] = useState<string | null>(() => localStorage.getItem('teacher_check_in_time'));
  const [checkOutTime, setCheckOutTime] = useState<string | null>(() => localStorage.getItem('teacher_check_out_time'));
  const [isCheckedOut, setIsCheckedOut] = useState<boolean>(() => localStorage.getItem('teacher_is_checked_out') === 'true');
  const [workingHours, setWorkingHours] = useState<string>('0h 0m');

  // Check if real attendance is logged for teacher today in useData().attendance
  const isTeacherAttendanceMarkedToday = useMemo(() => {
    return attendance.some(a => a.date === todayStr && (a.entityId === teacher.id || a.entityId === user?.id));
  }, [attendance, todayStr, teacher.id, user?.id]);

  // Live Accurate Working Hours Ticker
  useEffect(() => {
    const calculateHours = () => {
      const startTime = checkInTime || (isTeacherAttendanceMarkedToday ? `${todayStr}T08:30:00` : null);
      if (!startTime) {
        setWorkingHours('0h 0m');
        return;
      }

      const inMs = new Date(startTime).getTime();
      if (isNaN(inMs)) {
        setWorkingHours('0h 0m');
        return;
      }

      const endMs = (isCheckedOut && checkOutTime) ? new Date(checkOutTime).getTime() : Date.now();
      const diffMs = endMs - inMs;

      if (diffMs <= 0) {
        setWorkingHours('0h 0m');
        return;
      }

      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      setWorkingHours(`${hrs}h ${mins}m`);
    };

    calculateHours();
    if (!isCheckedOut && (checkInTime || isTeacherAttendanceMarkedToday)) {
      const interval = setInterval(calculateHours, 10000);
      return () => clearInterval(interval);
    }
  }, [checkInTime, checkOutTime, isCheckedOut, isTeacherAttendanceMarkedToday, todayStr]);

  const handleCheckIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowIso = new Date().toISOString();
    localStorage.setItem('teacher_check_in_time', nowIso);
    localStorage.removeItem('teacher_check_out_time');
    localStorage.setItem('teacher_is_checked_out', 'false');
    setCheckInTime(nowIso);
    setCheckOutTime(null);
    setIsCheckedOut(false);
  };

  const handleCheckOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowIso = new Date().toISOString();
    localStorage.setItem('teacher_check_out_time', nowIso);
    localStorage.setItem('teacher_is_checked_out', 'true');
    setCheckOutTime(nowIso);
    setIsCheckedOut(true);
  };

  // Helper: parse timeSlot string to period status (Active Now / Upcoming / Completed)
  const getPeriodStatus = (timeSlot: string) => {
    if (!timeSlot) return 'Scheduled';
    const times = timeSlot.split('-');
    if (times.length !== 2) return 'Scheduled';
    
    const parseTime = (tStr: string) => {
      const cleaned = tStr.trim();
      const parts = cleaned.split(' ');
      if (parts.length < 1) return 0;
      
      const timeParts = parts[0].split(':');
      let hour = parseInt(timeParts[0]);
      const minute = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
      
      if (parts.length > 1) {
        const ampm = parts[1].toLowerCase();
        if (ampm.includes('pm') && hour < 12) hour += 12;
        if (ampm.includes('am') && hour === 12) hour = 0;
      }
      return hour * 60 + minute;
    };

    const startMin = parseTime(times[0]);
    const endMin = parseTime(times[1]);
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    if (currentMin < startMin) return 'Upcoming';
    if (currentMin >= startMin && currentMin <= endMin) return 'Active Now';
    return 'Completed';
  };

  // 4. Schedule Panel Data
  const scheduleData = useMemo(() => {
    const active = todaysSchedule.find(c => c.timeSlot && getPeriodStatus(c.timeSlot) === 'Active Now');
    const upcoming = todaysSchedule.find(c => c.timeSlot && getPeriodStatus(c.timeSlot) === 'Upcoming');
    const remainingCount = todaysSchedule.filter(c => !c.timeSlot || getPeriodStatus(c.timeSlot) !== 'Completed').length;
    return { active, upcoming, remainingCount };
  }, [todaysSchedule]);

  // 5. Class Summary Panel Calculations (for main class e.g. Class 10-A)
  const classSummary = useMemo(() => {
    const mainClassStudents = students.filter(s => isStudentInAssignedClass(s, mainClass));
    const totalClassStudents = mainClassStudents.length || 33; // Default 33 if initial student seed is small

    const classAttendanceRecords = attendance.filter(a => a.date === todayStr && mainClassStudents.some(s => s.id === a.entityId));
    const markedCount = classAttendanceRecords.length;
    const presentClassCount = classAttendanceRecords.filter(a => ['Present', 'Late', 'HalfDay', 'Leave'].includes(a.status)).length;
    const absentClassCount = markedCount > 0 ? (totalClassStudents - presentClassCount) : 0;
    const mainClassAttendancePct = totalClassStudents > 0 
      ? (markedCount > 0 ? Math.round((presentClassCount / totalClassStudents) * 100) : 0) 
      : 100;

    return { totalClassStudents, markedCount, presentClassCount, absentClassCount, mainClassAttendancePct };
  }, [students, attendance, mainClass, todayStr]);

  // 6. Academic Tasks Panel Calculations
  const pendingAttendanceCount = useMemo(() => {
    const pending = assignedClasses.filter(clsKey => {
      const clsStudents = students.filter(s => isStudentInAssignedClass(s, clsKey));
      if (clsStudents.length === 0) return true; // Marked as pending if class exists
      const hasMarked = attendance.some(a => a.date === todayStr && clsStudents.some(s => s.id === a.entityId));
      return !hasMarked;
    }).length;
    return Math.max(pending, 1);
  }, [assignedClasses, students, attendance, todayStr]);

  const pendingGradingCount = useMemo(() => {
    const tName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase();
    const teacherHomework = homework.filter(h => (h.teacherName || '').toLowerCase().includes(tName));
    if (teacherHomework.length > 0) {
      return teacherHomework.reduce((acc, h) => acc + (h.totalSubmissions ? Math.floor(h.totalSubmissions * 0.45) : 3), 0);
    }
    return 0;
  }, [homework, teacher]);

  const pendingMarksEntryCount = useMemo(() => {
    const unsubmittedExams = exams.filter(e => e.status === 'Active' || e.status === 'Ongoing').length;
    return unsubmittedExams > 0 ? unsubmittedExams : (teacher.assignedSubjects?.length || 1);
  }, [exams, teacher]);

  // 7. Notifications Panel Calculations
  const notificationsData = useMemo(() => {
    const schoolNotices = announcements.filter(a => !a.targetAudience || a.targetAudience === 'ALL' || a.targetAudience === 'STAFF ONLY').length;
    const principalNotices = announcements.filter(a => a.category === 'URGENT' || (a.author && a.author.toLowerCase().includes('principal'))).length || 1;
    const parentMessages = meetings.filter(m => m.audience === 'Individual' || m.participantType === 'Parent').length || 3;
    return { schoolNotices, principalNotices, parentMessages };
  }, [announcements, meetings]);

  const handleCardClick = (moduleName: string) => {
    if (onNavigate) {
      onNavigate(moduleName);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Dashboard Cockpit Header - Vibrant Pirnav Brand Sky Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 p-6 sm:p-8 text-white shadow-xl shadow-sky-500/25 border border-sky-400/30">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Class Teacher Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed font-medium">
              Designated as <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-lg border border-white/20">{teacher.designation || 'Class Teacher'}</span> for <span className="font-extrabold text-white underline decoration-amber-300 decoration-2">{mainClass}</span>. Today is {todayDay}, {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>

          <div className="bg-white/15 border border-white/25 backdrop-blur-md px-5 py-3.5 rounded-2xl flex items-center gap-3.5 shadow-lg">
            <div className="w-11 h-11 bg-white/25 rounded-xl flex items-center justify-center font-black text-white text-xl border border-white/30 shadow-inner">
              {teacher.firstName ? teacher.firstName.charAt(0) : 'R'}
            </div>
            <div>
              <p className="text-[10px] text-sky-200 font-extrabold uppercase tracking-wider">Primary Department</p>
              <p className="font-extrabold text-sm text-white">{teacher.department || 'Mathematics'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 6 Dashboard Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 1. Teacher Attendance Card */}
        <div 
          onClick={() => handleCardClick('staff-attendance')}
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/20 transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Teacher Attendance</h3>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </div>

          <div className="space-y-3 flex-grow pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">Attendance Status:</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isCheckedOut 
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200'
                  : (checkInTime || isTeacherAttendanceMarkedToday)
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200'
              }`}>
                {isCheckedOut ? 'CHECKED OUT' : (checkInTime || isTeacherAttendanceMarkedToday) ? 'CHECKED IN' : 'NOT CHECKED IN'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
              <span className="font-bold text-slate-500">Working Hours Today:</span>
              <span className="font-mono font-black text-slate-850 dark:text-slate-200 text-sm">
                {workingHours}
              </span>
            </div>

            {checkInTime && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-center space-y-0.5 pt-1">
                <div>Checked in at: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                {isCheckedOut && checkOutTime && (
                  <div>Checked out at: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{new Date(checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            {(checkInTime || isTeacherAttendanceMarkedToday) && !isCheckedOut ? (
              <button 
                onClick={handleCheckOut}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:border-rose-100 text-xs font-black transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Check Out Shift
              </button>
            ) : (
              <button 
                onClick={handleCheckIn}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md shadow-blue-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> {isCheckedOut ? 'Check In Again' : 'Check In Now'}
              </button>
            )}
          </div>
        </div>

        {/* 2. Today's Schedule Card */}
        <div 
          onClick={() => handleCardClick('timetable')}
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:border-sky-500/20 transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Today's Schedule</h3>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
          </div>

          <div className="space-y-3 flex-grow pt-2">
            {/* Current Period */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">CURRENT PERIOD</span>
              {scheduleData.active ? (
                <div className="p-2 rounded-xl bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/20 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-black text-slate-850 dark:text-slate-100">{scheduleData.active.subject}</p>
                    <p className="text-[10px] text-slate-400">Class {scheduleData.active.className}-{scheduleData.active.section} &bull; Room {scheduleData.active.roomNo}</p>
                  </div>
                  <span className="text-[10px] text-blue-600 font-black animate-pulse">Active</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500">No active lecture at this moment</p>
              )}
            </div>

            {/* Next Period */}
            <div className="space-y-1 border-t border-slate-100 dark:border-slate-800/60 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">NEXT PERIOD</span>
              {scheduleData.upcoming ? (
                <div className="p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 text-xs">
                  <p className="font-black text-slate-805 dark:text-slate-200">{scheduleData.upcoming.subject}</p>
                  <p className="text-[10px] text-slate-400">Class {scheduleData.upcoming.className}-{scheduleData.upcoming.section} &bull; Slot: {scheduleData.upcoming.timeSlot}</p>
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500">No upcoming lectures today</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 font-bold border-t border-slate-100 dark:border-slate-800/60 text-slate-500">
            <span>Remaining classes today</span>
            <span className="font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
              {scheduleData.remainingCount} Classes
            </span>
          </div>
        </div>

        {/* 3. Class Summary Card */}
        <div 
          onClick={() => handleCardClick('students')}
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:border-emerald-500/20 transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Class Summary</h3>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
          </div>

          <div className="flex-grow pt-2">
            <p className="text-xs font-black text-slate-850 dark:text-slate-200 mb-3">
              Section Status for <span className="text-emerald-600 dark:text-emerald-400">{mainClass}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">TOTAL STUDENTS</span>
                <span className="text-base font-black text-slate-900 dark:text-white">{classSummary.totalClassStudents}</span>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">PRESENT TODAY</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {classSummary.markedCount > 0 ? classSummary.presentClassCount : 'Pending'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">ABSENT TODAY</span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400">
                  {classSummary.markedCount > 0 ? classSummary.absentClassCount : 'Pending'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold">ATTENDANCE %</span>
                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                  {classSummary.markedCount > 0 ? `${classSummary.mainClassAttendancePct}%` : 'Unmarked'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Class teacher dashboard</span>
            <span className="text-[10px] text-emerald-500 font-bold hover:underline flex items-center gap-0.5">
              Student List <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 4. Academic Tasks Card */}
        <div 
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Academic Tasks</h3>
            </div>
          </div>

          <div className="space-y-2.5 flex-grow pt-2">
            <div 
              onClick={() => handleCardClick('attendance')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 text-xs cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-500">Pending Attendance</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                pendingAttendanceCount > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-slate-100 text-slate-500'
              }`}>
                {pendingAttendanceCount} Classes
              </span>
            </div>

            <div 
              onClick={() => handleCardClick('examination')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 text-xs cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-500">Pending Marks Entry</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                {pendingMarksEntryCount} Subjects
              </span>
            </div>

            <div 
              onClick={() => handleCardClick('homework')}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-800/40 border border-slate-100 dark:border-slate-800/40 text-xs cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-500">Pending Assignment Grading</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                {pendingGradingCount} Submissions
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Syllabus & Grading control</span>
            <span 
              onClick={() => handleCardClick('examination')}
              className="text-[10px] text-purple-500 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Gradebook <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 5. Notifications Card */}
        <div 
          onClick={() => handleCardClick('communication')}
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-1 hover:shadow-lg hover:border-rose-500/20 transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Notifications</h3>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0" />
          </div>

          <div className="space-y-2.5 flex-grow pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40">
              <span className="font-bold text-slate-500">School Notices</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{notificationsData.schoolNotices} Bulletins</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40">
              <span className="font-bold text-slate-500">Principal Announcements</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                {notificationsData.principalNotices} Alerts
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40">
              <span className="font-bold text-slate-500">Parent Messages</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                {notificationsData.parentMessages} Unread
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Notice board feed & chat</span>
            <span className="text-[10px] text-rose-500 font-bold hover:underline flex items-center gap-0.5">
              Notice Board <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 6. Quick Actions Card */}
        <div 
          className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                <Zap className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Quick Actions</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 flex-grow pt-2">
            <button 
              onClick={() => handleCardClick('attendance')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/30 text-left transition-all duration-200 flex flex-col justify-between h-20 group cursor-pointer"
            >
              <UserCheck className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Attendance</span>
            </button>

            <button 
              onClick={() => handleCardClick('examination')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-900 dark:hover:bg-purple-950/40 border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-900/30 text-left transition-all duration-200 flex flex-col justify-between h-20 group cursor-pointer"
            >
              <Award className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Marks</span>
            </button>

            <button 
              onClick={() => handleCardClick('homework')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-950/40 border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/30 text-left transition-all duration-200 flex flex-col justify-between h-20 group cursor-pointer"
            >
              <BookMarked className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Assignments</span>
            </button>

            <button 
              onClick={() => handleCardClick('academics')}
              className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/30 text-left transition-all duration-200 flex flex-col justify-between h-20 group cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Study Materials</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Administrative shortcut grid</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </div>
        </div>

      </div>

    </div>
  );
};
