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

interface ParentDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { students, attendance, homework, announcements, holidays, studentHostels, hostelMasters, roomMasters, studentFeeLedgers, meetings, schoolEvents } = useData();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Unconditional calculations to determine currentWard
  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
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

    return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  }, [schoolEvents, announcements, holidays]);

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
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 py-2.5 px-4 text-slate-900 dark:text-white border border-brand-200 dark:border-slate-800 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-100/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-brand-900 dark:text-white flex items-center gap-2">
              <span>Welcome, {user?.name || 'Parent'}</span>
              <span className="text-lg inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-xs font-black text-slate-855 dark:text-slate-100 leading-none">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider leading-none mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
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
        <div className="flex p-1 bg-slate-100/80 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-2xl w-max">
          {parentWards.map((ward, idx) => (
            <button
              key={ward.id}
              onClick={() => setSelectedChildIdx(idx)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                selectedChildIdx === idx
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/40 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
              }`}
            >
              {ward.firstName} <span className="text-[10px] font-bold opacity-60 ml-1">({ward.className}-{ward.section})</span>
            </button>
          ))}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Attendance Card */}
        <div onClick={() => onNavigate?.('attendance')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-emerald-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-slate-700 transition-colors">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Attendance</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{attPercentage}%</p>
        </div>

        {/* Fee Due Card */}
        <div onClick={() => onNavigate?.('parent-fee-dues')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-rose-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-slate-700 transition-colors">
              <IndianRupee className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Fee Due</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">₹{dueBalance.toLocaleString()}</p>
        </div>

        {/* Homework Card */}
        <div onClick={() => onNavigate?.('homework')} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 border-0 border-l-4 border-l-amber-500 p-4 rounded-xl flex flex-col gap-2 cursor-pointer group">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-slate-800 group-hover:bg-amber-100 dark:group-hover:bg-slate-700 transition-colors">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Homework</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingHomework.toString()}</p>
        </div>
      </div>

      {/* Dynamic Alerts / Widgets (Hostel details and meetings, full width) */}
      {((isResidential && wardHostel && hostelDetails && roomDetails) || meetings.filter(m => m.status === 'Scheduled' && m.participants.some(p => p.id?.includes(currentWard.id) || p.name?.toLowerCase().includes(currentWard.firstName.toLowerCase()))).length > 0) && (
        <div className="space-y-6">
          {/* Hostel Boarding Widget */}
          {isResidential && wardHostel && hostelDetails && roomDetails && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
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
                    <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-500 shrink-0">RM</div>
                    <span className="font-bold text-slate-700 dark:text-slate-355">Room {roomDetails.roomNumber || (roomDetails as any).roomNo} ({roomDetails.roomTypeName || (roomDetails as any).roomType || 'Standard'})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-355">Warden: {hostelDetails.wardenName}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-250/20">Occupied</span>
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
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Scheduled Parent-Teacher Meetings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parentMeetings.map(m => (
                    <div key={m.id} className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-305">
                          {m.meetingAudience} ({m.meetingMode})
                        </span>
                        <span className="font-mono text-slate-550 dark:text-slate-455 font-bold">{m.meetingDate}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight">{m.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-650 dark:text-slate-355 font-bold pt-2 border-t border-indigo-100/60 dark:border-indigo-900/35">
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
        <div onClick={() => onNavigate?.('attendance')} className="bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 shadow-sm p-6 rounded-2xl space-y-4 cursor-pointer hover:border-brand-400 transition-colors flex flex-col h-[320px]">
          <div className="flex items-start justify-between gap-2 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Student Attendance</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Overall attendance record</p>
            </div>
            <div className="shrink-0">
              <Badge variant="info">Total: {wardAttendanceStats.total}</Badge>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center pt-2">
            <div 
              className="w-36 h-36 rounded-full shrink-0 relative flex items-center justify-center group/chart cursor-pointer"
              style={{
                background: `conic-gradient(
                  #4ade80 0% ${wardAttendanceStats.pEnd}%, 
                  #facc15 ${wardAttendanceStats.pEnd}% ${wardAttendanceStats.lEnd}%, 
                  #fb923c ${wardAttendanceStats.lEnd}% ${wardAttendanceStats.hdEnd}%, 
                  #f87171 ${wardAttendanceStats.hdEnd}% 100%
                )`
              }}
            >
              {/* Inner Donut Circle (Normal state) */}
              <div className="w-22 h-22 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner group-hover/chart:scale-95 transition-transform duration-200">
                <span className="text-base font-black text-slate-900 dark:text-white">{wardAttendanceStats.presentPct}%</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
              </div>

              {/* Tooltip Overlay displayed inside the circle on hover */}
              <div className="absolute inset-0 bg-slate-950/95 dark:bg-slate-900/95 text-white rounded-full opacity-0 group-hover/chart:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center shadow-lg border border-slate-700/50">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-700 w-24 pb-0.5">Details</p>
                <div className="text-[9px] font-bold space-y-0.5 text-left">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
                    <span>Present: {wardAttendanceStats.present} ({wardAttendanceStats.presentPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#facc15' }} />
                    <span>Late: {wardAttendanceStats.late} ({wardAttendanceStats.latePct}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#fb923c' }} />
                    <span>Half: {wardAttendanceStats.halfDay} ({wardAttendanceStats.halfDayPct}%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                    <span>Absent: {wardAttendanceStats.absent} ({wardAttendanceStats.absentPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ward Information Summary */}
        <div className="bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 hover:border-brand-400 transition-colors rounded-2xl p-6 shadow-xs space-y-4 flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 shrink-0">
            <ClipboardList className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Student Information</h3>
          </div>
          
          <div className="space-y-2 text-xs flex-1 overflow-y-auto pr-1">
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Admission Number</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{currentWard.admissionNo}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Date of Birth</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.dob}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Blood Group</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.bloodGroup || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Board Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.boardType || 'CBSE'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Student Type</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.studentType || 'Day Scholar'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-850">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Joining Date</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.joiningDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-550 dark:text-slate-455 font-bold">Caste Category</span>
              <span className="font-bold text-slate-800 dark:text-slate-250">{currentWard.casteCategory || 'General'}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events & Holidays */}
        <div onClick={() => onNavigate?.('events')} className="bg-white dark:bg-slate-900 border border-brand-400 dark:border-brand-800/40 hover:border-brand-400 transition-colors rounded-2xl p-6 shadow-xs space-y-4 flex flex-col h-[320px] cursor-pointer">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-5 h-5 text-brand-650 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">Upcoming Events & Holidays</h3>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {upcomingEventsAndHolidays.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center font-medium">No upcoming events or holidays.</p>
            ) : upcomingEventsAndHolidays.map(e => (
              <div key={e.id} className={`flex items-center justify-between p-3 rounded-xl text-xs border ${e.type === 'Holiday' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'}`}>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{e.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{e.category}</p>
                </div>
                <span className={`font-semibold px-2 py-1 rounded-lg text-[10px] shrink-0 ml-2 ${e.type === 'Holiday' ? 'bg-amber-100 text-amber-700 dark:bg-amber-855 dark:text-amber-100' : 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'}`}>
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
