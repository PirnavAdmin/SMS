// @ts-nocheck
import React from 'react';
import { BookOpen, Calendar, Clock, Target, Home, MapPin, User, Megaphone, AlertCircle, Users, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

interface StudentDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    students = [], 
    studentAttendance = [], 
    attendance = [], 
    homework = [], 
    announcements = [], 
    holidays = [], 
    studentHostels = [], 
    hostelMasters = [], 
    roomMasters = [], 
    timetable = [], 
    subjects = [], 
    staff = [], 
    studentFeeLedgers = [], 
    meetings = [],
    fetchHomeworkData
  } = useData();
  
  React.useEffect(() => {
    fetchHomeworkData?.();
  }, [fetchHomeworkData]);

  const [registryVersion, setRegistryVersion] = React.useState(0);
  React.useEffect(() => {
    const handleUpdate = () => setRegistryVersion(v => v + 1);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
    };
  }, []);
  
  const userEmail = (user?.email || '').toLowerCase().trim();
  const userPhone = (user?.phone || '').replace(/\D/g, '');
  const userId = String(user?.id || '').trim();
  const rawUserName = (user?.name || '').trim().toLowerCase();

  const currentWard = React.useMemo(() => {
    // 1. Check in students array with comprehensive criteria
    const matchedStudent = (students || []).find(s => {
      if (!s) return false;
      const sId = String(s.id || '').trim().toLowerCase();
      const sAdm = String(s.admissionNo || (s as any).admNo || (s as any).admissionNumber || '').trim().toLowerCase();
      const sRoll = String((s as any).rollNo || '').trim().toLowerCase();
      const sEmail = (s.email || (s as any).studentEmail || (s as any).contactEmail || '').trim().toLowerCase();

      // Check ID or Admission Number
      if (userId && (sId === userId.toLowerCase() || sAdm === userId.toLowerCase() || sRoll === userId.toLowerCase())) return true;
      if ((user as any)?.studentId && (sId === String((user as any).studentId).toLowerCase() || sAdm === String((user as any).studentId).toLowerCase())) return true;
      if ((user as any)?.admissionNo && sAdm === String((user as any).admissionNo).trim().toLowerCase()) return true;

      // Check Email
      if (userEmail && sEmail && sEmail === userEmail) return true;

      // Check Phone
      if (userPhone && userPhone.length >= 7) {
        const sPhone = (s.phone || (s as any).mobileNumber || (s as any).contactNumber || '').replace(/\D/g, '');
        if (sPhone && (sPhone.endsWith(userPhone) || userPhone.endsWith(sPhone))) return true;
      }

      // Check Full Name / Name
      if (rawUserName && !['student', 'user', 'test', 'demo'].includes(rawUserName)) {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const sName = ((s as any).name || (s as any).studentName || '').trim().toLowerCase();
        if (sFullName === rawUserName || sName === rawUserName) return true;
        if (s.firstName && s.lastName && rawUserName.includes(s.firstName.toLowerCase()) && rawUserName.includes(s.lastName.toLowerCase())) return true;
      }
      return false;
    });

    if (matchedStudent) {
      return {
        ...matchedStudent,
        studentName: `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim() || (matchedStudent as any).name || (user?.name || 'Student'),
        className: matchedStudent.className || (matchedStudent as any).class || (matchedStudent as any).grade || (user as any)?.className || '',
        section: matchedStudent.section || (matchedStudent as any).sectionName || (user as any)?.section || '',
        admissionNo: matchedStudent.admissionNo || (matchedStudent as any).admNo || (matchedStudent as any).admissionNumber || (user as any)?.admissionNo || String(matchedStudent.id || '')
      };
    }

    // 2. Check in Admissions array
    const admissionsList = useData().admissions || [];
    const matchedAdmission = admissionsList.find((a: any) => {
      if (!a || a.status === 'Rejected' || a.status === 'Cancelled') return false;
      const aId = String(a.id || '').trim().toLowerCase();
      const aReg = String(a.registrationNo || (a as any).applicationNo || '').trim().toLowerCase();
      if (userId && (aId === userId.toLowerCase() || aReg === userId.toLowerCase())) return true;
      if (userEmail && (a.email?.toLowerCase().trim() === userEmail || (a as any).studentEmail?.toLowerCase().trim() === userEmail)) return true;
      if (userPhone && userPhone.length >= 7) {
        const aPhone = (a.phone || (a as any).fatherMobileNo || (a as any).motherMobileNo || '').replace(/\D/g, '');
        if (aPhone && (aPhone.endsWith(userPhone) || userPhone.endsWith(aPhone))) return true;
      }
      if (rawUserName && !['student', 'user'].includes(rawUserName) && a.applicantName?.toLowerCase().trim() === rawUserName) return true;
      return false;
    });

    if (matchedAdmission) {
      const appName = matchedAdmission.applicantName || user?.name || 'Student';
      return {
        id: String(matchedAdmission.id),
        studentName: appName,
        firstName: appName.split(' ')[0] || '',
        lastName: appName.split(' ').slice(1).join(' ') || '',
        className: (matchedAdmission as any).appliedClass?.className || (matchedAdmission as any).className || matchedAdmission.appliedClass || (user as any)?.className || '',
        section: (matchedAdmission as any).section || (user as any)?.section || '',
        admissionNo: matchedAdmission.registrationNo || (matchedAdmission as any).applicationNo || (user as any)?.admissionNo || '',
        status: 'Active'
      };
    }

    // 3. Dynamic resolution from user object
    const userClass = (user as any)?.className || (user as any)?.class || (user as any)?.grade || '';
    const userSec = (user as any)?.section || (user as any)?.sectionName || '';
    const userAdm = (user as any)?.admissionNo || (user as any)?.admNo || (user as any)?.rollNo || (user?.id && !String(user.id).startsWith('USR') ? String(user.id) : '');
    const nameToUse = (user?.name && !['student', 'user'].includes(user.name.toLowerCase()))
      ? user.name
      : (userEmail ? userEmail.split('@')[0].split(/[._-]/).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') : 'Student');

    return {
      id: (user as any)?.studentId || (user as any)?.id || userId || '',
      studentName: nameToUse,
      firstName: nameToUse.split(' ')[0] || '',
      lastName: nameToUse.split(' ').slice(1).join(' ') || '',
      className: userClass,
      section: userSec,
      admissionNo: userAdm,
      status: 'Active'
    };
  }, [students, user, userId, userEmail, userPhone, rawUserName]);

  const studentDisplayName = (user?.name || '').trim();

  // Combined Attendance
  const wardId = String(currentWard?.id || '').trim();
  const wardStudentId = String((currentWard as any)?.studentId || '').trim();
  const wardRoll = String(currentWard?.rollNo || '').trim();
  const wardAdm = String(currentWard?.admissionNo || '').trim();

  const combinedAttendance = React.useMemo(() => {
    const list: any[] = [];
    const seenKeys = new Set<string>();

    (studentAttendance || []).forEach(a => {
      const d = String(a.date || '').split('T')[0];
      const sId = String(a.studentId || a.id || '');
      const key = `${sId}_${d}`;
      seenKeys.add(key);
      list.push({ ...a, date: d, studentId: sId, entityType: 'Student' });
    });

    try {
      const regRaw = localStorage.getItem('sms_attendance_registry');
      if (regRaw) {
        const registry = JSON.parse(regRaw);
        Object.entries(registry).forEach(([regKey, studentMap]) => {
          if (studentMap && typeof studentMap === 'object') {
            const parts = regKey.split('_');
            const d = parts[parts.length - 1];
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
              Object.entries(studentMap).forEach(([sId, status]) => {
                if (status) {
                  const key = `${sId}_${d}`;
                  if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                      id: `reg_${sId}_${d}`,
                      studentId: sId,
                      date: d,
                      status: status,
                      entityType: 'Student'
                    });
                  }
                }
              });
            }
          }
        });
      }
    } catch {}

    (attendance || []).forEach(a => {
      const d = String(a.date || '').split('T')[0];
      const sId = String(a.studentId || a.entityId || '');
      const key = `${sId}_${d}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        list.push({ ...a, date: d, studentId: sId, entityType: a.entityType || 'Student' });
      }
    });

    return list;
  }, [studentAttendance, attendance, registryVersion]);

  const wardAttendance = combinedAttendance.filter(a => {
    const isStudentEntity = !a.entityType || a.entityType === 'Student';
    if (!isStudentEntity) return false;

    const recId = String(a.studentId || a.entityId || a.id || '').trim().toLowerCase();
    const recRoll = String(a.rollNo || '').trim().toLowerCase();
    const recAdm = String(a.admissionNo || '').trim().toLowerCase();
    const recName = String(a.studentName || '').trim().toLowerCase();

    const wardIdStr = wardId.toLowerCase();
    const wardStudentIdStr = wardStudentId.toLowerCase();
    const wardRollStr = wardRoll.toLowerCase();
    const wardAdmStr = wardAdm.toLowerCase();
    const wardNameStr = String(currentWard?.studentName || `${currentWard?.firstName || ''} ${currentWard?.lastName || ''}`).trim().toLowerCase();

    return (
      (recId && (recId === wardIdStr || recId === wardStudentIdStr || recId === wardRollStr || recId === wardAdmStr)) ||
      (recRoll && (recRoll === wardRollStr || recRoll === wardIdStr || recRoll === wardAdmStr)) ||
      (recAdm && (recAdm === wardAdmStr || recAdm === wardIdStr || recAdm === wardRollStr)) ||
      (recName && wardNameStr && (recName === wardNameStr || recName.includes(wardNameStr) || wardNameStr.includes(recName)))
    );
  });
  const presentDays = wardAttendance.filter(a => a.status === 'Present').length;
  const attPercentage = wardAttendance.length > 0 ? Math.round((presentDays / wardAttendance.length) * 100) : 100;

  // Homework (Pending tasks)
  const normalizeClassNumHw = (str?: string) => {
    if (!str) return '';
    const clean = str.toLowerCase().replace(/class|grade|sec|section/gi, '').replace(/\s+/g, '').trim();
    if (clean.includes('-')) return clean.split('-')[0].trim();
    return clean;
  };

  const normalizeSectionHw = (secStr?: string, fullClsStr?: string) => {
    if (secStr && secStr.trim()) {
      return secStr.toLowerCase().replace(/section|sec/gi, '').trim();
    }
    if (fullClsStr && fullClsStr.includes('-')) {
      const parts = fullClsStr.split('-');
      return parts[1].toLowerCase().replace(/section|sec/gi, '').trim();
    }
    return '';
  };

  const wardClsNormHw = normalizeClassNumHw(currentWard?.className);
  const wardSecNormHw = normalizeSectionHw(currentWard?.section, currentWard?.className);

  const pendingHomework = React.useMemo(() => {
    if (!currentWard) return [];
    let submissions: Record<string, any> = {};
    try {
      const saved = localStorage.getItem('parent_student_homework_submissions');
      if (saved) submissions = JSON.parse(saved);
    } catch {}

    const wardId = String(currentWard.id || '').trim().toLowerCase();
    const wardRoll = String(currentWard.rollNo || '').trim().toLowerCase();
    const wardAdm = String(currentWard.admissionNo || '').trim().toLowerCase();

    const matchedMap = new Map<string, any>();

    (homework || []).forEach(h => {
      if (!h) return;
      const hClassNum = normalizeClassNumHw(h.className || (h as any).classRoom || (h as any).class);
      const hSec = normalizeSectionHw(h.section, h.className || (h as any).classRoom || (h as any).class);

      if (!wardClsNormHw || !hClassNum || hClassNum !== wardClsNormHw) return;
      if (hSec && hSec !== 'all' && wardSecNormHw && hSec !== wardSecNormHw) return;

      const hStatus = (h.status || 'PUBLISHED').toString().toLowerCase().trim();
      const isPublished = ['published', 'active', 'assigned', 'pending'].includes(hStatus);
      if (!isPublished) return;

      if (h.publishToType === 'Students' || (h as any).publishedTo === 'Selected Students') {
        const studentIds = h.publishedStudentIds || [];
        if (Array.isArray(studentIds) && studentIds.length > 0) {
          const isTargeted = studentIds.some((id: any) => {
            const sId = String(id).trim().toLowerCase();
            return sId === wardId || (wardRoll && sId === wardRoll) || (wardAdm && sId === wardAdm);
          });
          if (!isTargeted) return;
        }
      }

      // Check if already submitted
      const hwKey = String(h.id || (h as any).homeworkId);
      const subRecord = submissions[hwKey];
      if (subRecord && subRecord.status === 'Submitted') return;

      const dedupeKey = `${hClassNum}_${hSec}_${(h.subject || '').trim()}_${(h.title || '').trim()}_${h.dueDate}`.toLowerCase();
      if (!matchedMap.has(dedupeKey)) {
        matchedMap.set(dedupeKey, h);
      }
    });

    return Array.from(matchedMap.values());
  }, [homework, currentWard, wardClsNormHw, wardSecNormHw]);
  
  // Timetable
  const norm = (str?: string) => (str || '').toLowerCase().replace(/class|section/gi, '').trim();
  const wardClassNorm = norm(currentWard.className);
  const wardSecNorm = norm(currentWard.section);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()] as any;
  const todaysSchedule = (timetable || [])
    .filter(t => {
      const tClassNorm = norm(t.className);
      const tSecNorm = norm(t.section);
      const matchesClass = tClassNorm === wardClassNorm || tClassNorm.includes(wardClassNorm) || wardClassNorm.includes(tClassNorm);
      const matchesSec = !wardSecNorm || !tSecNorm || tSecNorm === 'all' || tSecNorm === wardSecNorm;
      const matchesDay = !t.day || t.day === 'All' || t.day.toLowerCase() === todayName.toLowerCase();
      return matchesClass && matchesSec && matchesDay;
    })
    .sort((a,b) => (a.startTime || a.timeSlot || '').localeCompare(b.startTime || b.timeSlot || ''));

  const getSubjectName = (id?: string) => id ? ((subjects || []).find(s => s.id === id)?.name || id) : 'Subject';

  // Hostel
  const wardHostel = (studentHostels || []).find(sh => sh.studentId === currentWard.id && (sh.status === 'Active' || sh.status === 'Occupied'));
  const hostelDetails = wardHostel ? (hostelMasters || []).find(h => h.id === wardHostel.hostelId || (h as any).name === wardHostel.hostelName) : null;
  const roomDetails = wardHostel ? (roomMasters || []).find(r => r.id === wardHostel.roomId || r.roomNumber === wardHostel.roomNo) : null;

  // Fee Dues
  const wardLedger = (studentFeeLedgers || []).find(l => l.studentId === currentWard.id);
  const dueBalance = wardLedger ? wardLedger.dueBalance : 0;

  // Notices
  const recentNotices = [
    ...(announcements || []).map(a => ({ date: a.date, title: a.title, desc: (a as any).description || a.content, type: 'notice' })),
    ...(holidays || []).map(h => ({ date: h.startDate, title: h.name, desc: h.type + ' Holiday', type: 'holiday' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Today's formatted date string (e.g. Aug 6, 2026 THURSDAY)
  const todayObj = new Date();
  const dateFormatted = todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dayFormatted = todayObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  if (!currentWard) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading student records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Welcome Banner (Compact box height & padding matching Admin reference) */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 p-3 sm:p-3.5 text-slate-900 dark:text-white border border-brand-200 dark:border-slate-800 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-100/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-brand-900 dark:text-white flex items-center gap-2">
              <span>{greeting}{studentDisplayName ? `, ${studentDisplayName}` : ''}</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {currentWard.className ? (
                <strong className="text-slate-800 dark:text-slate-200">
                  {currentWard.className.toLowerCase().startsWith('class') ? currentWard.className : `Class ${currentWard.className}`}
                  {currentWard.section ? `-${currentWard.section}` : ''}
                </strong>
              ) : null}
              {currentWard.className && currentWard.admissionNo ? ' • ' : ''}
              {currentWard.admissionNo ? (
                <>Adm No: <strong className="text-slate-800 dark:text-slate-200">{currentWard.admissionNo}</strong></>
              ) : null}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{dateFormatted}</p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">{dayFormatted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Grid (Identical to Admin Dashboard: left vertical colored border strip, flex icon+title, text-2xl font-black) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Attendance (Indigo) */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-indigo-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 transition-colors">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Attendance</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{attPercentage}%</p>
        </div>

        {/* Card 2: Homework (Emerald) */}
        <div
          onClick={() => onNavigate?.('homework')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-emerald-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-slate-700 transition-colors">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Pending Homework</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingHomework.length}</p>
        </div>

        {/* Card 3: Fee Due (Rose) */}
        <div
          onClick={() => onNavigate?.('parent-fee-dues')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-rose-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-slate-700 transition-colors">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Fee Due</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">₹{dueBalance.toLocaleString()}</p>
        </div>

        {/* Card 4: Today's Classes (Amber) */}
        <div
          onClick={() => onNavigate?.('timetable')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-amber-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-slate-700 transition-colors">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Today's Classes</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{todaysSchedule.length}</p>
        </div>
      </div>

      {/* Boarding / Hostel Widget (If applicable) */}
      {wardHostel && hostelDetails && roomDetails && (
        <div
          onClick={() => onNavigate?.('parent-hostel-details')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Boarding Details</h4>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                {hostelDetails.hostelName || (hostelDetails as any).name} • Room {roomDetails.roomNumber || (roomDetails as any).roomNo} • Warden: {hostelDetails.wardenName}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
            Active Resident
          </span>
        </div>
      )}

      {/* Main Content Containers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Circulars & Events (Takes 2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-sky-500" /> Circulars & Events
            </h3>
            <button onClick={() => onNavigate?.('events')} className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentNotices.length > 0 ? recentNotices.map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${item.type === 'notice' ? 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'}`}>
                  {item.type === 'notice' ? <Megaphone className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{item.title}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{item.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.desc}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-xs text-slate-400">No recent circulars or events.</div>
            )}
          </div>
        </div>

        {/* Right Side Column: To-Do List & Scheduled Meetings */}
        <div className="space-y-4">
          {/* To-Do List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" /> To-Do List
              </h3>
              <button onClick={() => onNavigate?.('homework')} className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
                View Homework
              </button>
            </div>

            <div className="space-y-2">
              {pendingHomework.length > 0 ? pendingHomework.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-2.5">
                  <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title || (item as any).homeworkTitle || (item as any).topic || 'Homework'}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="font-bold text-slate-400 uppercase">{getSubjectName(item.subjectId || item.subject || (item as any).subjectName || 'General')}</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Due: {item.dueDate || (item as any).assignedDate || 'Upcoming'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-4">No pending homework assignments.</p>
              )}
            </div>
          </div>

          {/* Scheduled Meetings */}
          {(() => {
            const studentMeetings = meetings.filter(m => 
              m.status === 'Scheduled' &&
              m.participants.some(p => p.id === currentWard.id || p.name.toLowerCase().includes(currentWard.firstName.toLowerCase()))
            );

            if (studentMeetings.length === 0) return null;

            return (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Users className="w-4 h-4 text-sky-500" />
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Scheduled Meetings</h3>
                </div>

                <div className="space-y-2">
                  {studentMeetings.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                          {m.meetingMode}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{m.meetingDate}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">{m.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardView;
