import React from 'react';
import { BookOpen, Calendar, Clock, Award, Flame, Target, Home, MapPin, User, Megaphone, AlertCircle, Users } from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

interface StudentDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { students, attendance, homework, announcements, holidays, studentHostels, hostelMasters, roomMasters, timetable, subjects, staff, studentFeeLedgers, meetings } = useData();
  
  // Since we are mocking auth, map to first active student
  const currentWard = students.find(s => s.status === 'Active') || students[0];

  if (!currentWard) {
    return <div className="p-8 text-center">No student record found.</div>;
  }

  // Attendance
  const wardAttendance = attendance.filter(a => a.entityType === 'Student' && a.entityId === currentWard.id);
  const presentDays = wardAttendance.filter(a => a.status === 'Present').length;
  const attPercentage = wardAttendance.length > 0 ? Math.round((presentDays / wardAttendance.length) * 100) : 100;

  // Homework (Pending tasks)
  const pendingHomework = homework.filter(h => h.className === currentWard.className && h.section === currentWard.section);
  
  // Timetable
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()] as any;
  const todaysSchedule = timetable
    .filter(t => t.className === currentWard.className && t.section === currentWard.section && t.day === todayName)
    .sort((a,b) => (a.startTime || a.timeSlot || '').localeCompare(b.startTime || b.timeSlot || ''));

  const getSubjectName = (id?: string) => id ? (subjects.find(s => s.id === id)?.name || id) : 'Subject';
  const getTeacherName = (id?: string) => {
    if (!id) return 'Teacher';
    const found = staff.find(s => s.id === id || s.empId === id);
    return found ? `${found.firstName} ${found.lastName}` : id;
  };

  // Hostel
  const wardHostel = studentHostels.find(sh => sh.studentId === currentWard.id && (sh.status === 'Active' || sh.status === 'Occupied'));
  const hostelDetails = wardHostel ? hostelMasters.find(h => h.id === wardHostel.hostelId || (h as any).name === wardHostel.hostelName) : null;
  const roomDetails = wardHostel ? roomMasters.find(r => r.id === wardHostel.roomId || r.roomNumber === wardHostel.roomNo) : null;

  // Fee Dues
  const wardLedger = studentFeeLedgers.find(l => l.studentId === currentWard.id);
  const dueBalance = wardLedger ? wardLedger.dueBalance : 0;
  const isFeeCleared = dueBalance <= 0;

  // Notices
  const recentNotices = [
    ...(announcements || []).map(a => ({ date: a.date, title: a.title, desc: (a as any).description || a.content, type: 'notice' })),
    ...(holidays || []).map(h => ({ date: h.startDate, title: h.name, desc: h.type + ' Holiday', type: 'holiday' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 p-4 sm:p-5 text-white shadow-md shadow-indigo-500/20">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              Hi, {currentWard.firstName} {currentWard.lastName} 👋
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 opacity-80" />
                {currentWard.className}-{currentWard.section}
              </div>
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <span className="opacity-80">Adm No:</span>
                {currentWard.admissionNo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Attendance" value={`${attPercentage}%`} icon={Target} color="emerald" onClick={() => onNavigate?.('attendance')} />
        <StatCard title="Homework" value={pendingHomework.length} icon={BookOpen} color="amber" onClick={() => onNavigate?.('homework')} />
        <StatCard title="Fee Due" value={`₹${dueBalance.toLocaleString()}`} icon={AlertCircle} color="sky" onClick={() => onNavigate?.('parent-fee-dues')} />
      </div>

      {/* Hostel Boarding Widget */}
      {wardHostel && hostelDetails && roomDetails && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-5 h-5 text-fuchsia-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">Boarding Details</h3>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{hostelDetails.hostelName || (hostelDetails as any).name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">RM</div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Room {roomDetails.roomNumber || (roomDetails as any).roomNo} ({roomDetails.roomTypeName || (roomDetails as any).roomType || 'Standard'})</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {/* Circulars, Notices, & Events */}
        <div className="glass-card p-4 rounded-xl space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Circulars & Events</h3>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
            {recentNotices.length > 0 ? recentNotices.map((item, i) => (
              <div key={i} className="relative flex items-center group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 text-slate-500 shadow shrink-0 z-10">
                  <div className={`w-3 h-3 rounded-full ${item.type === 'notice' ? 'bg-sky-500' : item.type === 'event' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
                </div>
                <div className="ml-4 w-[calc(100%-3rem)] p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
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

        {/* To-Do List */}
        <div className="glass-card p-4 rounded-xl space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">To-Do List</h3>
          </div>
          
          <div className="space-y-3">
            {pendingHomework.length > 0 ? pendingHomework.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-slate-300 cursor-pointer" />
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">{getSubjectName(item.subjectId || item.subject)}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Due: {item.dueDate}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 font-medium">No pending homework.</p>
            )}
          </div>
        </div>

        {/* My Scheduled Meetings */}
        {(() => {
          const studentMeetings = meetings.filter(m => 
            m.status === 'Scheduled' &&
            m.participants.some(p => p.id === currentWard.id || p.name.toLowerCase().includes(currentWard.firstName.toLowerCase()))
          );

          if (studentMeetings.length === 0) return null;

          return (
            <div className="glass-card p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">My Scheduled Meetings</h3>
              </div>

              <div className="space-y-3">
                {studentMeetings.map(m => (
                  <div key={m.id} className="p-3 rounded-lg border border-sky-100 dark:border-sky-900/40 bg-sky-50/20 dark:bg-sky-950/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                        {m.meetingAudience} ({m.meetingMode})
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{m.meetingDate}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{m.title}</h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-sky-100/60 dark:border-sky-900/30">
                      <span>{m.meetingMode === 'In-Person' ? `📍 ${m.roomVenue}` : `🔗 ${m.onlineMeetingUrl}`}</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{m.startTime} - {m.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
