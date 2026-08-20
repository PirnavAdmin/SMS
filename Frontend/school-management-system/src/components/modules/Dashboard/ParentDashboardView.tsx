import React, { useState, useEffect } from 'react';
import { 
  User, Activity, AlertCircle, Calendar, GraduationCap, Clock, 
  Home, Megaphone, MapPin, Users, Heart, Phone, DollarSign, ClipboardList
} from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { DashboardShimmer } from '../../common/DashboardShimmer';

interface ParentDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { students, attendance, homework, announcements, holidays, studentHostels, hostelMasters, roomMasters, studentFeeLedgers, meetings } = useData();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardShimmer />;
  }


  let parentWards = students.filter(s => 
    s.status === 'Active' && 
    (s.guardianEmail === user?.email || s.guardianPhone === user?.email || s.contactEmail === user?.email || s.contactPhone === user?.email)
  );

  const hasMatchedWards = parentWards.length > 0;
  if (!hasMatchedWards) {
    parentWards = students.filter(s => s.status === 'Active').slice(0, 2);
  }

  if (parentWards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        No active wards found.
      </div>
    );
  }

  const currentWard = parentWards[selectedChildIdx] || parentWards[0];

  // Calculations
  const wardAttendance = attendance.filter(a => a.entityType === 'Student' && a.entityId === currentWard.id);
  const presentDays = wardAttendance.filter(a => a.status === 'Present').length;
  const attPercentage = wardAttendance.length > 0 ? Math.round((presentDays / wardAttendance.length) * 100) : 100;

  const pendingHomework = homework.filter(h => h.className === currentWard.className && h.section === currentWard.section && new Date(h.dueDate) >= new Date()).length;

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
          
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-250/60 dark:border-slate-700 shadow-xs flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 select-none">
              {currentWard.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Active Ward</p>
              <p className="font-extrabold text-xs text-slate-855 dark:text-white leading-tight">
                {currentWard.firstName} {currentWard.lastName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Class {currentWard.className}-{currentWard.section} • Roll No: {currentWard.rollNo}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance" value={`${attPercentage}%`} icon={Activity} color="emerald" onClick={() => onNavigate?.('attendance')} />
        <StatCard title="Reports" value="View Cards" icon={GraduationCap} color="sky" onClick={() => onNavigate?.('examination')} />
        <StatCard title="Fee Due" value={`₹${dueBalance.toLocaleString()}`} icon={DollarSign} color="rose" onClick={() => onNavigate?.('parent-fee-dues')} />
        <StatCard title="Homework" value={pendingHomework.toString()} icon={Clock} color="amber" onClick={() => onNavigate?.('homework')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-8 space-y-6">
          
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
                    <span className="font-bold text-slate-700 dark:text-slate-350">{hostelDetails.hostelName || (hostelDetails as any).name}</span>
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

          {/* Recent Attendance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
             <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Attendance Register</h3>
                </div>
             </div>
             
             {wardAttendance.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-[10px] uppercase tracking-wider text-slate-400 font-black border-b border-slate-150/40 dark:border-slate-800">
                       <th className="p-3 pl-4">Date</th>
                       <th className="p-3">Status</th>
                       <th className="p-3 pr-4">Remarks</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                     {wardAttendance.slice(-5).map(att => (
                       <tr key={att.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                         <td className="p-3 pl-4 font-mono font-bold text-slate-850 dark:text-slate-205 text-xs">{att.date}</td>
                         <td className="p-3">
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                             att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50' :
                             att.status === 'Absent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50' :
                             'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50'
                           }`}>
                             {att.status}
                           </span>
                         </td>
                         <td className="p-3 pr-4 text-xs font-medium text-slate-500 dark:text-slate-400">{att.remarks || '-'}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <p className="text-xs text-slate-500 py-2 text-center">No attendance records found.</p>
             )}
          </div>

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

        {/* Right Column (1/3 width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Ward Information Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <ClipboardList className="w-5 h-5 text-sky-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Student Information</h3>
            </div>
            
            <div className="space-y-3 text-xs">
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

          {/* Circulars, Notices, & Events Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Megaphone className="w-5 h-5 text-brand-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Circulars & Announcements</h3>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {recentNotices.length > 0 ? recentNotices.map((item, i) => (
                <div key={i} className="flex gap-3 text-xs leading-normal items-start">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-xs ${item.type === 'notice' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-400 text-[10px]">{item.date}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${item.type === 'notice' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                        {item.type}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-850 dark:text-white">{item.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-550 py-4 text-center">No recent circulars or announcements.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
