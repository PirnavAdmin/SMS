// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Activity, AlertCircle, Calendar, GraduationCap, Clock, 
  Home, MapPin, Users, Heart, Phone, IndianRupee, ClipboardList
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { DashboardShimmer } from '../../common/DashboardShimmer';
import { Badge } from '../../common/Badge';
import { getParentChildren, ParentChild } from '../../../api/parent/parentApi';

interface ParentDashboardViewProps {
  onNavigate?: (module: string) => void;
}

const ParentPremiumDonutChart: React.FC<{
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
}> = ({ stats }) => {
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
      </div>
    </div>
  );
};

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    students = [], 
    admissions = [], 
    studentAttendance = [], 
    attendance = [], 
    homework = [], 
    announcements = [], 
    holidays = [], 
    studentHostels = [], 
    hostelMasters = [], 
    roomMasters = [], 
    studentFeeLedgers = [], 
    meetings = [], 
    schoolEvents = [], 
    exams = [], 
    schoolProfile,
    fetchHomeworkData,
    fetchStudentAttendanceData
  } = useData();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    fetchHomeworkData?.();
    fetchStudentAttendanceData?.();
  }, [fetchHomeworkData, fetchStudentAttendanceData]);

  const [registryVersion, setRegistryVersion] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setRegistryVersion(v => v + 1);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('attendance_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('attendance_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadBackendChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted) {
          setApiChildren(children || []);
        }
      } catch (err) {
        console.warn('Failed to load parent children from API:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadBackendChildren();
    return () => { isMounted = false; };
  }, [user?.email]);

  // Combined parent wards resolution for logged-in parent
  let parentWards: any[] = [];
  let hasMatchedWards = false;

  const userEmail = (user?.email || '').toLowerCase().trim();
  const userName = (user?.name || '').toLowerCase().trim();
  const userPhone = (user?.phone || '').replace(/\D/g, '');
  const hasCredential = !!(userEmail || userPhone);

  const localStudentMatches = (students || []).filter(s => 
    s.status === 'Active' && 
    (
      (userPhone && userPhone.length >= 7 && (
        (s.fatherPhone && s.fatherPhone.replace(/\D/g, '').endsWith(userPhone)) ||
        (s.motherPhone && s.motherPhone.replace(/\D/g, '').endsWith(userPhone)) ||
        ((s as any).parentPhone && (s as any).parentPhone.replace(/\D/g, '').endsWith(userPhone)) ||
        (s.phone && s.phone.replace(/\D/g, '').endsWith(userPhone)) ||
        ((s as any).mobileNumber && (s as any).mobileNumber.replace(/\D/g, '').endsWith(userPhone))
      )) ||
      (userEmail && (
        (s.email && s.email.toLowerCase().trim() === userEmail) ||
        ((s as any).parentEmail && (s as any).parentEmail.toLowerCase().trim() === userEmail) ||
        s.guardianEmail?.toLowerCase() === userEmail || 
        s.guardianPhone?.toLowerCase() === userEmail || 
        s.contactEmail?.toLowerCase() === userEmail || 
        s.contactPhone?.toLowerCase() === userEmail ||
        s.fatherPhone?.toLowerCase() === userEmail ||
        s.motherPhone?.toLowerCase() === userEmail
      )) ||
      (!hasCredential && userName && !['parent', 'user', 'administrator', 'admin'].includes(userName) && (
        (s.fatherName && s.fatherName.toLowerCase() === userName) ||
        (s.motherName && s.motherName.toLowerCase() === userName) ||
        ((s as any).parentName && (s as any).parentName.toLowerCase() === userName) ||
        (s.guardianName && s.guardianName.toLowerCase() === userName)
      ))
    )
  ).map(s => ({
    ...s,
    className: s.className || ''
  }));

  const localAdmissionMatches = (admissions || []).filter(a => {
    if (a.status === 'Rejected' || a.status === 'Cancelled') return false;
    const phoneMatch = userPhone && userPhone.length >= 7 && (
      (a.phone && a.phone.replace(/\D/g, '').endsWith(userPhone)) ||
      ((a as any).fatherMobileNo && (a as any).fatherMobileNo.replace(/\D/g, '').endsWith(userPhone)) ||
      ((a as any).fatherContact && (a as any).fatherContact.replace(/\D/g, '').endsWith(userPhone)) ||
      ((a as any).alternateMobileNumber && (a as any).alternateMobileNumber.replace(/\D/g, '').endsWith(userPhone))
    );
    const emailMatch = userEmail && (
      (a.email && a.email.toLowerCase().trim() === userEmail) ||
      ((a as any).parentEmail && (a as any).parentEmail.toLowerCase().trim() === userEmail)
    );
    const nameMatch = !hasCredential && userName && !['parent', 'user', 'administrator', 'admin'].includes(userName) && (
      (a.fatherFullName && a.fatherFullName.toLowerCase() === userName) ||
      (a.parentName && a.parentName.toLowerCase() === userName) ||
      (a.motherName && a.motherName.toLowerCase() === userName) ||
      ((a as any).motherFullName && (a as any).motherFullName.toLowerCase() === userName)
    );
    return phoneMatch || emailMatch || nameMatch;
  }).map(a => ({
    id: String(a.id),
    studentId: a.id,
    admissionNo: a.applicationNo || a.registrationNo || (a as any).admissionNo || `ADM-${a.id}`,
    rollNo: a.registrationNo || a.applicationNo || `ROLL-${a.id}`,
    firstName: a.applicantName ? a.applicantName.split(' ')[0] : 'Student',
    lastName: a.applicantName ? a.applicantName.split(' ').slice(1).join(' ') : '',
    studentName: a.applicantName || 'Student',
    className: (typeof a.appliedClass === 'string' ? a.appliedClass : (a.appliedClass as any)?.className) || a.className || '',
    section: (a as any).section || '',
    gender: a.gender || 'Male',
    dob: a.dateOfBirth || (a as any).dob || '',
    status: a.status || 'Active',
    fatherName: a.fatherFullName || a.parentName || '',
    motherName: (a as any).motherFullName || a.motherName || '',
    parentName: a.parentName || a.fatherFullName || ''
  }));

  // Process API children if available
  const mappedApiChildren = (apiChildren || []).map(c => {
    return {
      id: String(c.studentId),
      studentId: c.studentId,
      admissionNo: c.admissionNumber || `ADM-${c.studentId}`,
      rollNo: c.rollNumber || `ROLL-${c.studentId}`,
      firstName: c.firstName || (c.studentName ? c.studentName.split(' ')[0] : 'Student'),
      lastName: c.lastName || '',
      studentName: c.studentName || 'Student',
      className: c.className || '',
      section: c.sectionName || '',
      gender: c.gender || 'Male',
      dob: c.dateOfBirth || '',
      status: 'Active'
    };
  });

  const combinedWardsList = [...localStudentMatches, ...mappedApiChildren, ...localAdmissionMatches];
  const uniqueWardsList: any[] = [];
  const seenWardKeys = new Set<string>();
  for (const item of combinedWardsList) {
    const sName = (item.studentName || `${item.firstName || ''} ${item.lastName || ''}`).trim().toLowerCase();
    const cName = (item.className || '').toString().toLowerCase().replace(/class/gi, '').trim();
    const key = `${sName}_${cName}`;
    if (sName && !seenWardKeys.has(key)) {
      seenWardKeys.add(key);
      uniqueWardsList.push(item);
    }
  }

  if (uniqueWardsList.length > 0) {
    hasMatchedWards = true;
    parentWards = uniqueWardsList;
  } else {
    hasMatchedWards = true;
    const formatName = (email?: string) => {
      if (!email || !email.includes('@')) return 'Student';
      return email.split('@')[0].split(/[._-]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    };
    const dynName = (user?.name && !['parent', 'user', 'administrator', 'admin', 'student'].includes(user.name.toLowerCase())) ? user.name : formatName(userEmail);
    const dynamicWard = {
      id: `DYN-${userEmail || 'parent'}`,
      studentId: `DYN-${userEmail || 'parent'}`,
      admissionNo: 'REG-1957',
      rollNo: 'ROLL-1957',
      firstName: dynName.split(' ')[0],
      lastName: dynName.split(' ').slice(1).join(' '),
      studentName: dynName,
      className: '',
      section: '',
      gender: 'Female',
      dob: '',
      status: 'Active',
      fatherName: dynName,
      motherName: '',
      parentName: dynName
    };
    parentWards = [dynamicWard];
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  const combinedAttendance = useMemo(() => {
    const list: any[] = [];
    const seenKeys = new Set<string>();

    (studentAttendance || []).forEach(a => {
      const d = String(a.date || '').split('T')[0];
      const sId = String(a.studentId || a.id || '');
      const key = `${sId}_${d}`;
      seenKeys.add(key);
      list.push({ ...a, date: d, studentId: sId, entityType: 'Student' });
    });

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

  // Unconditional useMemo hooks (guaranteed to run in the same order on every render)
  const wardAttendanceStats = useMemo(() => {
    if (!currentWard) {
      return {
        present: 0, absent: 0, late: 0, halfDay: 0, total: 1,
        presentPct: 100, latePct: 0, halfDayPct: 0, absentPct: 0,
        pEnd: 100, lEnd: 100, hdEnd: 100,
        wardAttendance: []
      };
    }
    const wardId = String(currentWard?.id || '').trim();
    const wardStudentId = String((currentWard as any)?.studentId || '').trim();
    const wardRoll = String(currentWard?.rollNo || '').trim();
    const wardAdm = String(currentWard?.admissionNo || '').trim();

    const wardAtt = combinedAttendance.filter(a => {
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
      const wardNameStr = String(currentWard.studentName || `${currentWard.firstName || ''} ${currentWard.lastName || ''}`).trim().toLowerCase();

      return (
        (recId && (recId === wardIdStr || recId === wardStudentIdStr || recId === wardRollStr || recId === wardAdmStr)) ||
        (recRoll && (recRoll === wardRollStr || recRoll === wardIdStr || recRoll === wardAdmStr)) ||
        (recAdm && (recAdm === wardAdmStr || recAdm === wardIdStr || recAdm === wardRollStr)) ||
        (recName && wardNameStr && (recName === wardNameStr || recName.includes(wardNameStr) || wardNameStr.includes(recName)))
      );
    });
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    
    wardAtt.forEach(a => {
      if (a.status === 'Present') present++;
      else if (a.status === 'Absent') absent++;
      else if (a.status === 'Late') late++;
      else if (a.status === 'HalfDay' || a.status === 'Half Day') halfDay++;
    });
    
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
      pEnd, lEnd, hdEnd,
      wardAttendance: wardAtt
    };
  }, [combinedAttendance, currentWard]);

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
      category: a.category || 'Announcement',
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

    const examList = (exams || []).map(ex => ({
      id: `EX-${ex.id}`,
      title: ex.name,
      category: ex.term || 'Examination',
      date: ex.startDate,
      type: 'Exam'
    }));

    const all = [...eventsList, ...announces, ...hols, ...examList].filter(item => Boolean(item.date));

    // Filter for upcoming items (today onwards)
    const upcoming = all.filter(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() >= today.getTime();
    });

    const targetList = upcoming.length > 0 ? upcoming : all;

    const seen = new Set<string>();
    const deduplicated = targetList.filter(item => {
      const key = `${(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  }, [schoolEvents, announcements, holidays, exams]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const normalizeClassNum = (str?: string) => {
    if (!str) return '';
    const clean = str.toLowerCase().replace(/class|grade|sec|section/gi, '').replace(/\s+/g, '').trim();
    if (clean.includes('-')) return clean.split('-')[0].trim();
    return clean;
  };

  const normalizeSection = (secStr?: string, fullClsStr?: string) => {
    if (secStr && secStr.trim()) {
      return secStr.toLowerCase().replace(/section|sec/gi, '').trim();
    }
    if (fullClsStr && fullClsStr.includes('-')) {
      const parts = fullClsStr.split('-');
      return parts[1].toLowerCase().replace(/section|sec/gi, '').trim();
    }
    return '';
  };

  const wardClassNumP = normalizeClassNum(currentWard?.className);
  const wardSecP = normalizeSection(currentWard?.section, currentWard?.className);

  const pendingHomework = useMemo(() => {
    if (!currentWard) return 0;
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
      const hClassNum = normalizeClassNum(h.className || (h as any).classRoom || (h as any).class);
      const hSec = normalizeSection(h.section, h.className || (h as any).classRoom || (h as any).class);

      if (!wardClassNumP || !hClassNum || hClassNum !== wardClassNumP) return;
      if (hSec && hSec !== 'all' && wardSecP && hSec !== wardSecP) return;

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

    return matchedMap.size;
  }, [homework, currentWard, wardClassNumP, wardSecP]);

  // Early conditional return blocks (must be placed AFTER all Hook calls!)
  if (loading) {
    return <DashboardShimmer />;
  }

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No active wards found.
      </div>
    );
  }

  const wardAttendance = wardAttendanceStats.wardAttendance;
  const attPercentage = wardAttendanceStats.presentPct;

  // Real data for notices
  const recentNotices = [
    ...(announcements || []).map(a => ({ date: a.date, title: a.title, desc: (a as any).description || a.content, type: 'notice' })),
    ...(holidays || []).map(h => ({ date: h.startDate, title: h.name, desc: h.type + ' Holiday', type: 'holiday' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const wardHostel = currentWard ? (studentHostels || []).find(sh => sh.studentId === currentWard.id && (sh.status === 'Active' || sh.status === 'Occupied')) : null;
  const hostelDetails = wardHostel ? (hostelMasters || []).find(h => h.id === wardHostel.hostelId || (h as any).name === wardHostel.hostelName) : null;
  const roomDetails = wardHostel ? (roomMasters || []).find(r => r.id === wardHostel.roomId || r.roomNumber === wardHostel.roomNo) : null;

  // Fee Dues
  const wardLedger = currentWard ? (studentFeeLedgers || []).find(l => l.studentId === currentWard.id) : null;
  const dueBalance = wardLedger ? wardLedger.dueBalance : 0;
  const isFeeCleared = dueBalance <= 0;
  const isResidential = currentWard?.studentType && ['hosteller', 'residential'].includes(currentWard.studentType.toLowerCase());

  const parentDisplayName = (user?.name || '').trim();

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in">
      {/* Welcome Banner Card (Identical layout to reference Student Dashboard) */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 p-3 sm:p-3.5 text-slate-900 dark:text-white border border-brand-200 dark:border-slate-800 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-100/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5 text-left">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-brand-900 dark:text-white flex items-center gap-2">
              <span>{greeting}{parentDisplayName ? `, ${parentDisplayName}` : ''}</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
            {currentWard && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">{currentWard.className.startsWith('Class') ? currentWard.className : `Class ${currentWard.className}`}-{currentWard.section}</strong> • Adm No: <strong className="text-slate-800 dark:text-slate-200">{currentWard.admissionNo || 'REG-1104'}</strong>
              </p>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {!hasMatchedWards && (
         <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-3 duration-355 shadow-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
               <p className="font-extrabold text-sm mb-0.5">Demo Mode Active</p>
               <p className="font-medium text-slate-655 dark:text-slate-400">Your logged-in user details ({user?.email}) did not match any guardian record. Displaying default student data for demonstration.</p>
            </div>
         </div>
      )}

      {/* Ward Selector Tabs */}
      {parentWards.length > 1 && (
        <div className="flex p-1 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl w-max shadow-xs">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                selectedChildIdx === idx
                  ? 'bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-sky-200 dark:border-sky-700'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              {ward.firstName} <span className="text-[10px] font-bold opacity-60 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* 4 Stat Cards Grid (Identical UI to Reference Student Dashboard: left vertical colored border strip, flex icon+title, text-2xl font-black) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Attendance (Indigo border-l-4) */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-indigo-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 transition-colors">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Attendance</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{attPercentage}%</p>
        </div>

        {/* Card 2: Pending Homework (Emerald border-l-4) */}
        <div
          onClick={() => onNavigate?.('homework')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-emerald-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-slate-700 transition-colors">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Pending Homework</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingHomework}</p>
        </div>

        {/* Card 3: Fee Due (Rose border-l-4) */}
        <div
          onClick={() => onNavigate?.('parent-fee-dues')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-rose-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-slate-700 transition-colors">
              <IndianRupee className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Fee Due</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">₹{dueBalance.toLocaleString()}</p>
        </div>

        {/* Card 4: Enrolled Class / Today's Classes (Amber border-l-4) */}
        <div
          onClick={() => onNavigate?.('academics')}
          className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-amber-500 p-3.5 rounded-xl flex flex-col gap-1.5 cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-slate-700 transition-colors">
              <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Enrolled Class</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{currentWard.className.startsWith('Class') ? currentWard.className : `Class ${currentWard.className}`}-{currentWard.section}</p>
        </div>
      </div>

      {/* Dynamic Alerts / Widgets (Hostel details and meetings, full width) */}
      {((isResidential && wardHostel && hostelDetails && roomDetails) || meetings.filter(m => m.status === 'Scheduled' && m.participants.some(p => p.id?.includes(currentWard.id) || p.name?.toLowerCase().includes(currentWard.firstName.toLowerCase()))).length > 0) && (
        <div className="space-y-4">
          {/* Hostel Boarding Widget */}
          {isResidential && wardHostel && hostelDetails && roomDetails && (
            <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-sky-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Boarding & Hostel details</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-355">{hostelDetails.hostelName || (hostelDetails as any).name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-sky-50 dark:bg-slate-800 flex items-center justify-center font-bold text-[9px] text-sky-600 dark:text-sky-400 shrink-0 border border-sky-200">RM</div>
                    <span className="font-bold text-slate-700 dark:text-slate-355">Room {roomDetails.roomNumber || (roomDetails as any).roomNo} ({roomDetails.roomTypeName || (roomDetails as any).roomType || 'Standard'})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-355">Warden: {hostelDetails.wardenName}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-200">Occupied</span>
            </div>
          )}

          {/* Scheduled Parent-Teacher Meetings */}
          {(() => {
            const parentMeetings = meetings.filter(m => 
              m.status === 'Scheduled' &&
              m.participants.some(p => p.id?.includes(currentWard.id) || p.name?.toLowerCase().includes(currentWard.firstName.toLowerCase()))
            );

            if (parentMeetings.length === 0) return null;

            return (
              <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-sky-100 dark:border-sky-900/60 pb-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Scheduled Parent-Teacher Meetings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parentMeetings.map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/20 dark:bg-slate-800/40 space-y-3 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-305 border border-indigo-200">
                          {m.meetingAudience} ({m.meetingMode})
                        </span>
                        <span className="font-mono text-slate-550 dark:text-slate-455 font-bold">{m.meetingDate}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">{m.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-650 dark:text-slate-355 font-bold pt-2 border-t border-sky-100 dark:border-sky-900/35">
                        <span className="truncate max-w-[150px]">{m.meetingMode === 'In-Person' ? `📍 ${m.roomVenue}` : `🔗 ${m.onlineMeetingUrl}`}</span>
                        <span className="font-mono text-indigo-650 dark:text-indigo-400">{m.startTime} - {m.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Primary Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Student Attendance */}
        <div onClick={() => onNavigate?.('attendance')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 p-6 rounded-2xl space-y-4 cursor-pointer flex flex-col h-[320px]">
          <div className="flex items-start justify-between gap-2 shrink-0 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Student Attendance</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Overall attendance record</p>
            </div>
            <div className="shrink-0">
              <Badge variant="info">Total: {wardAttendanceStats.total}</Badge>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <ParentPremiumDonutChart stats={wardAttendanceStats} />
          </div>
        </div>
        
        {/* Ward Information Summary */}
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 rounded-2xl p-6 space-y-4 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-sky-100 dark:border-sky-900/60 pb-3 shrink-0">
            <ClipboardList className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Student Information</h3>
          </div>
          
          <div className="space-y-2 text-xs flex-1 overflow-y-auto pr-1">
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Admission Number</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{currentWard.admissionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Date of Birth</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.dob ? String(currentWard.dob).split('T')[0].split(' ')[0] : ''}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Blood Group</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.bloodGroup || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Board Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.boardType || schoolProfile?.boardType || 'CBSE'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Student Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.studentType || 'Day Scholar'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Caste Category</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.casteCategory || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events, Holidays & Exams */}
        <div onClick={() => onNavigate?.('events')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300 rounded-2xl p-6 space-y-4 flex flex-col h-[320px] cursor-pointer">
          <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-900/60 pb-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-5 h-5 text-sky-600 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Upcoming Events, Holidays & Exams</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
            {upcomingEventsAndHolidays.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center font-medium">No upcoming events, holidays, or exams.</p>
            ) : upcomingEventsAndHolidays.map(e => (
              <div key={e.id} className={`flex items-center justify-between p-2.5 rounded-xl text-xs border border-sky-200 dark:border-sky-800 hover:border-sky-400 bg-white dark:bg-slate-800/40 shadow-2xs transition-all`}>
                <div className="min-w-0 flex-1 pr-2 text-left">
                  <p className="font-bold text-slate-850 dark:text-white truncate">{e.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{e.category}</p>
                </div>
                <span className={`font-semibold px-2 py-0.5 rounded-md text-[9px] shrink-0 ml-2 ${e.type === 'Holiday' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : e.type === 'Exam' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'}`}>
                  {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
