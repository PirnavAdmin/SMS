import React, { useState } from 'react';
import { User, Activity, AlertCircle, Calendar, GraduationCap, Clock, Home, Megaphone, MapPin } from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

export const ParentDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance, homework, announcements, holidays, studentHostels, hostelMasters, roomMasters, studentFeeLedgers } = useData();
  const [selectedChildIdx, setSelectedChildIdx] = useState(0);

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
    ...(announcements || []).map(a => ({ date: a.date, title: a.title, desc: a.description, type: 'notice' })),
    ...(holidays || []).map(h => ({ date: h.startDate, title: h.name, desc: h.type + ' Holiday', type: 'holiday' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const wardHostel = studentHostels.find(sh => sh.studentId === currentWard.id && sh.status === 'Occupied');
  const hostelDetails = wardHostel ? hostelMasters.find(h => h.id === wardHostel.hostelId) : null;
  const roomDetails = wardHostel ? roomMasters.find(r => r.id === wardHostel.roomId) : null;

  // Fee Dues
  const wardLedger = studentFeeLedgers.find(l => l.studentId === currentWard.id);
  const dueBalance = wardLedger ? wardLedger.dueBalance : 0;
  const isFeeCleared = dueBalance <= 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2">
              <User className="w-3.5 h-3.5 text-emerald-100" />
              <span>Parent Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Parent'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 max-w-xl mt-2">
              Monitor your ward's academic progress, attendance, and fee details from one central dashboard.
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-emerald-600">
              {currentWard.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-emerald-100 font-medium">Currently viewing Ward</p>
              <p className="font-bold text-sm">
                {currentWard.firstName} {currentWard.lastName} ({currentWard.className}-{currentWard.section})
                <span className="opacity-80 ml-2 font-mono text-[11px] bg-white/20 px-1.5 py-0.5 rounded">Reg No: {currentWard.rollNo}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {!hasMatchedWards && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
               <p className="font-bold">Demo Mode Active</p>
               <p>Your login email/phone ({user?.email}) did not match any guardian records in the database. Showing sample wards for demonstration.</p>
            </div>
         </div>
      )}

      {/* Ward Selector Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-max">
        {parentWards.map((ward, idx) => (
          <button
            key={ward.id}
            onClick={() => setSelectedChildIdx(idx)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selectedChildIdx === idx
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {ward.firstName} <span className="text-[10px] font-medium opacity-70 ml-1">({ward.className}-{ward.section})</span>
          </button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance Register" value={`${attPercentage}%`} subtitle="Academic session" change={attPercentage > 90 ? 'Good standing' : 'Needs attention'} isPositive={attPercentage > 90} icon={Activity} color="emerald" />
        <StatCard title="Reports" value="View" subtitle="Formative Assessment" change="Check updates" isPositive={true} icon={GraduationCap} color="indigo" />
        <StatCard title="Fee Details" value={`₹${dueBalance.toLocaleString()}`} subtitle={isFeeCleared ? "No outstanding dues" : "Outstanding balance"} change={isFeeCleared ? "All cleared" : "Action required"} isPositive={isFeeCleared} icon={AlertCircle} color="sky" />
        <StatCard title="Homework" value={pendingHomework.toString()} subtitle="Pending assignments" change="Action required" isPositive={pendingHomework === 0} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hostel Boarding Widget */}
          {wardHostel && hostelDetails && roomDetails && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Boarding Details</h3>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">{hostelDetails.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">RM</div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Room {roomDetails.roomNumber} ({roomDetails.roomType})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">Warden: {hostelDetails.wardenName}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                 <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold">Occupied</span>
              </div>
            </div>
          )}

          {/* Detailed Attendance Register View */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Attendance Register</h3>
                </div>
             </div>
             
             {wardAttendance.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                       <th className="p-3">Date</th>
                       <th className="p-3">Status</th>
                       <th className="p-3">Remarks</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                     {wardAttendance.slice(-5).map(att => (
                       <tr key={att.id}>
                         <td className="p-3 font-medium text-slate-900 dark:text-white text-sm">{att.date}</td>
                         <td className="p-3">
                           <span className={`px-2 py-1 rounded text-xs font-bold ${
                             att.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                             att.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                             'bg-amber-100 text-amber-700'
                           }`}>
                             {att.status}
                           </span>
                         </td>
                         <td className="p-3 text-sm text-slate-500">{att.remarks || '-'}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               <p className="text-sm text-slate-500">No attendance records found.</p>
             )}
          </div>
        </div>

        {/* Circulars, Notices, & Events */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Circulars & Events</h3>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {recentNotices.length > 0 ? recentNotices.map((item, i) => (
              <div key={i} className="relative flex items-center group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 text-slate-500 shadow shrink-0 z-10">
                  <div className={`w-3 h-3 rounded-full ${item.type === 'notice' ? 'bg-indigo-500' : item.type === 'event' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                </div>
                <div className="ml-4 w-[calc(100%-3rem)] p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.desc}</p>
                </div>
              </div>
            )) : (
              <div className="pl-14 text-sm text-slate-500 py-4">No recent circulars or events.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
