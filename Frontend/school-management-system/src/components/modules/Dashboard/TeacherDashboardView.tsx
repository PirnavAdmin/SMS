import React from 'react';
import { BookOpen, Calendar, Clock, Award, FileText, CheckCircle2, User, Users } from 'lucide-react';
import { StatCard } from '../../common/StatCard';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

export const TeacherDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { staff, students, timetable, homework, attendance, meetings } = useData();

  // Find logged-in teacher
  const dbTeacher = staff.find(s => s.email === user?.email && s.employeeCategory === 'Teacher') || staff.find(s => s.employeeCategory === 'Teacher');

  // Fallback to static mock data if no teacher profile is found during testing/integration
  const teacher = dbTeacher || {
    firstName: user?.name || 'Sarah',
    lastName: 'Jenkins',
    assignedClasses: ['10-A', '9-B'],
    assignedSubjects: ['Mathematics', 'Physics']
  };

  // Get assigned classes (e.g., ["10-A", "9-B"])
  const assignedClasses = teacher.assignedClasses || [];

  // Calculate metrics
  const teacherStudents = students.filter(s => assignedClasses.includes(`${s.className}-${s.section}`));
  const totalStudents = teacherStudents.length;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()] as any;
  
  // Todays Schedule
  const todaysSchedule = timetable
    .filter(t => t.teacherName === `${teacher.firstName} ${teacher.lastName}` && t.day === todayName)
    .sort((a,b) => (a.startTime || a.timeSlot || '').localeCompare(b.startTime || b.timeSlot || ''));

  const pendingHomework = homework.filter(h => h.teacherName === `${teacher.firstName} ${teacher.lastName}` && new Date(h.dueDate) >= new Date()).length;

  // Next Class
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nextClass = todaysSchedule.find(c => (c.startTime || c.timeSlot || '') >= now) || todaysSchedule[0];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Teacher Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {teacher.firstName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mt-2">
              You have {todaysSchedule.length} classes scheduled for today. {nextClass ? `Your next class is ${nextClass.subject} in ${nextClass.className}-${nextClass.section}.` : ''}
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-blue-600">
              {teacher.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-blue-100 font-medium">Assigned Classes</p>
              <p className="font-bold text-sm">{assignedClasses.length} Classes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Schedule" value={todaysSchedule.length} subtitle="Classes today" change="View timetable" isPositive={true} icon={Clock} color="sky" />
        <StatCard title="Total Students" value={totalStudents} subtitle="Across assigned classes" change="Manage students" isPositive={true} icon={Users} color="emerald" />
        <StatCard title="Pending Homework" value={pendingHomework} subtitle="Assignments to review" change={pendingHomework > 0 ? "Action required" : "All clear"} isPositive={pendingHomework === 0} icon={BookOpen} color="amber" />
        <StatCard title="Assigned Subjects" value={teacher.assignedSubjects?.length || 0} subtitle="Syllabus tracking" change="View modules" isPositive={true} icon={FileText} color="sky" />
      </div>

      {/* Timetable Widget */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Schedule</h3>
        </div>

        <div className="space-y-3">
          {todaysSchedule.length > 0 ? todaysSchedule.map((cls, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-mono text-xs font-bold">
                  {cls.startTime || cls.timeSlot} {cls.endTime ? `- ${cls.endTime}` : ''}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{cls.subject}</p>
                  <p className="text-xs text-slate-500 font-medium">{cls.className}-{cls.section}</p>
                </div>
              </div>
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Scheduled
                </span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-slate-500">No classes scheduled for today.</p>
          )}
        </div>
      </div>

      {/* My Scheduled Meetings Widget */}
      {(() => {
        const teacherName = `${teacher.firstName} ${teacher.lastName}`;
        const myMeetings = meetings.filter(m => 
          m.status === 'Scheduled' &&
          (m.organizerName === teacherName || m.participants.some(p => p.id === dbTeacher?.id || p.name.toLowerCase().includes(teacher.firstName.toLowerCase())))
        );

        if (myMeetings.length === 0) return null;

        return (
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">My Scheduled Meetings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myMeetings.map(m => (
                <div key={m.id} className="p-4 rounded-2xl border border-sky-100 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                      {m.meetingAudience} ({m.meetingMode})
                    </span>
                    <span className="font-mono text-xs text-slate-500 font-bold">{m.meetingDate}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{m.title}</h4>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-sky-100/60 dark:border-sky-900/30">
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
  );
};
