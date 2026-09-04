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
  const { students, attendance, homework, announcements, holidays, studentHostels, hostelMasters, roomMasters, studentFeeLedgers, meetings, schoolEvents, exams } = useData();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiChildren, setApiChildren] = useState<ParentChild[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadBackendChildren = async () => {
      try {
        const children = await getParentChildren(user?.email);
        if (isMounted && children && children.length > 0) {
          setApiChildren(children);
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

  // Combined parent wards: prioritize backend API children, then local student matches, then defaults
  let parentWards: any[] = [];
  let hasMatchedWards = false;

  if (apiChildren.length > 0) {
    hasMatchedWards = true;
    parentWards = apiChildren.map(c => ({
      id: String(c.studentId),
      studentId: c.studentId,
      admissionNo: c.admissionNumber,
      rollNo: c.rollNumber,
      firstName: c.firstName || c.studentName.split(' ')[0],
      lastName: c.lastName || '',
      studentName: c.studentName,
      className: c.className || 'Class 6',
      section: c.sectionName || 'A',
      gender: c.gender || 'Male',
      dob: c.dateOfBirth || '2014-05-15',
      status: 'Active'
    }));
  } else {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const localMatches = students.filter(s => 
      s.status === 'Active' && 
      (
        (userEmail && (
          s.guardianEmail?.toLowerCase() === userEmail || 
          s.guardianPhone?.toLowerCase() === userEmail || 
          s.contactEmail?.toLowerCase() === userEmail || 
          s.contactPhone?.toLowerCase() === userEmail ||
          s.fatherPhone?.toLowerCase() === userEmail ||
          s.motherPhone?.toLowerCase() === userEmail
        )) ||
        (userName && (
          s.fatherName?.toLowerCase() === userName ||
          s.motherName?.toLowerCase() === userName ||
          s.guardianName?.toLowerCase() === userName
        ))
      )
    );
    if (localMatches.length > 0) {
      hasMatchedWards = true;
      parentWards = localMatches;
    } else {
      parentWards = students.filter(s => s.status === 'Active').slice(0, 1);
    }
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

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
    const wardAtt = attendance.filter(a => a.entityType === 'Student' && a.entityId === currentWard.id);
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
  }, [attendance, currentWard?.id]);

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

    if (upcoming.length > 0) {
      return upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
    }

    return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  }, [schoolEvents, announcements, holidays, exams]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

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

  const pendingHomework = homework.filter(h => currentWard && h.className === currentWard.className && h.section === currentWard.section && new Date(h.dueDate) >= new Date()).length;

  // Real data for notices
  const recentNotices = [
    ...(announcements || []).map(a => ({ date: a.date, title: a.title, desc: (a as any).description || a.content, type: 'notice' })),
    ...(holidays || []).map(h => ({ date: h.startDate, title: h.name, desc: h.type + ' Holiday', type: 'holiday' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const wardHostel = studentHostels.find(sh => sh.studentId === currentWard.id && (sh.status === 'Active' || sh.status === 'Occupied'));
  const hostelDetails = wardHostel ? hostelMasters.find(h => h.id === wardHostel.hostelId || (h as any).name === wardHostel.hostelName) : null;
  const roomDetails = wardHostel ? roomMasters.find(r => r.id === wardHostel.roomId || r.roomNumber === wardHostel.roomNo) : null;

  // Fee Dues
  const wardLedger = studentFeeLedgers.find(l => l.studentId === currentWard.id);
  const dueBalance = wardLedger ? wardLedger.dueBalance : 0;
  const isFeeCleared = dueBalance <= 0;
  const isResidential = currentWard.studentType && ['hosteller', 'residential'].includes(currentWard.studentType.toLowerCase());

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in">
      {/* Welcome Banner with School Illustration (Transparent / No Background) */}
      <div className="relative flex items-center justify-between text-slate-900 dark:text-white -mb-1">
        {/* Left side: Greeting */}
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {user?.name || 'Parent'}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
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

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div onClick={() => onNavigate?.('attendance')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Attendance</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{attPercentage}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-200 dark:border-emerald-800">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Fee Due Card */}
        <div onClick={() => onNavigate?.('parent-fee-dues')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Fee Due</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{dueBalance.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 border border-rose-200 dark:border-rose-800">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Homework Card */}
        <div onClick={() => onNavigate?.('homework')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Homework</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingHomework}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Enrolled Class Card */}
        <div onClick={() => onNavigate?.('academics')} className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-1 transition-all duration-300 p-4 rounded-2xl flex items-center justify-between cursor-pointer group">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Enrolled Class</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{currentWard.className}-{currentWard.section}</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-200 dark:border-sky-800">
            <GraduationCap className="w-5 h-5" />
          </div>
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
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.dob}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Blood Group</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.bloodGroup || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Board Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.boardType || 'CBSE'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Student Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.studentType || 'Day Scholar'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100/60 dark:border-sky-900/30">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Joining Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.joiningDate}</span>
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
