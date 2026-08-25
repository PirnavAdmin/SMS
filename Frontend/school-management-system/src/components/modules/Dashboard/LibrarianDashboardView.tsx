import React, { useMemo } from 'react';
import { 
  Calendar, Clock, UserCheck, Megaphone, Sparkles, BookOpen, 
  ArrowRight, CheckCircle2, AlertCircle, Bell, Bookmark, ArrowUpRight,
  ShieldCheck, Layers
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

interface LibrarianDashboardViewProps {
  onNavigate?: (module: string) => void;
}

export const LibrarianDashboardView: React.FC<LibrarianDashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { 
    books = [], 
    bookIssues = [], 
    announcements = [],
    holidays = [],
    schoolEvents = []
  } = useData();

  const handleNavigate = (moduleName: string) => {
    if (onNavigate) {
      onNavigate(moduleName);
    }
  };

  // Metrics
  const totalBooksCount = useMemo(() => books.reduce((acc, b) => acc + (b.totalCopies || 0), 0), [books]);
  const availableCopiesCount = useMemo(() => books.reduce((acc, b) => acc + (b.availableCopies || 0), 0), [books]);
  const activeLoansCount = useMemo(() => bookIssues.filter(i => i.status === 'Issued' || i.status === 'Renewed').length, [bookIssues]);
  const overdueCount = useMemo(() => bookIssues.filter(i => i.status === 'Overdue').length, [bookIssues]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Today's reading periods preview
  const todayReadingPeriods = [
    { period: 'Period 2', time: '09:30 AM - 10:15 AM', className: 'Class 8 - Sec A', teacher: 'Srinivas Rao', topic: 'Science Research & Journal Reading' },
    { period: 'Period 4', time: '11:15 AM - 12:00 PM', className: 'Class 10 - Sec B', teacher: 'Robert Teacher', topic: 'Literature Classics Review' },
    { period: 'Period 6', time: '02:00 PM - 02:45 PM', className: 'Class 6 - Sec C', teacher: 'Anitha Sharma', topic: 'Library Reading Club Session' }
  ];

  // Latest School Announcements
  const recentNotices = useMemo(() => {
    return announcements.slice(0, 3);
  }, [announcements]);

  // Upcoming School Events
  const upcomingEvents = useMemo(() => {
    const eventsList = [...(schoolEvents || []), ...(holidays || [])];
    return eventsList.slice(0, 3);
  }, [schoolEvents, holidays]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-50/50 dark:bg-slate-900 py-3 px-5 text-slate-900 dark:text-white border border-brand-200 dark:border-slate-800 shadow-xs">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-100/50 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-brand-900 dark:text-white flex items-center gap-2">
                <span>{greeting}, {user?.name || 'Bhanu Prakash'}</span>
                <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                📖 Librarian Executive Cockpit
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/50 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left font-mono shrink-0">
              <p className="text-xs font-black text-slate-850 dark:text-slate-100 leading-none">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Metrics Bar & Launch Full Library Management */}
      <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Library Overview Summary
            </h3>
          </div>
          <button
            onClick={() => handleNavigate('library')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Launch Full Library System</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Books</p>
            <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">{totalBooksCount || 200}</p>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">Cataloged Copies</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">Available</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{availableCopiesCount || 167}</p>
            <span className="text-[10px] font-bold text-slate-500">Ready On Shelves</span>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
            <p className="text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-400">Active Loans</p>
            <p className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">{activeLoansCount || 2}</p>
            <span className="text-[10px] font-bold text-slate-500">Issued Out</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <p className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400">Overdue Returns</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">{overdueCount || 2}</p>
            <span className="text-[10px] font-bold text-rose-500">Pending Return</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Shift & Timetable Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Librarian Daily Shift & Desk Duty */}
        <div className="lg:col-span-5 glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Daily Shift & Attendance Status
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Shift
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Logged-in Account:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Bhanu Prakash'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Desk Duty Hours:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">08:30 AM - 05:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Today's Punch-in:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">08:28 AM (On Time)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleNavigate('librarian-attendance')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <span>Open Librarian Attendance & Shift Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Today's Master Reading Schedule */}
        <div className="lg:col-span-7 glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" /> Today's Class Reading Schedule
              </h3>
            </div>
            <button
              onClick={() => handleNavigate('library-timetable')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {todayReadingPeriods.map((slot, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white">{slot.period} ({slot.time})</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                      {slot.className}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">Subject Teacher: {slot.teacher} • {slot.topic}</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Bottom Grid: School Circulars & Upcoming School Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* School Circulars / Announcements */}
        <div className="lg:col-span-6 glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" /> Official School Notices
            </h3>
            <button
              onClick={() => handleNavigate('communication')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Communication Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentNotices.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No official circulars published.</p>
            ) : recentNotices.map((n: any) => (
              <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white truncate">{n.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{n.date}</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming School Events */}
        <div className="lg:col-span-6 glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" /> Upcoming School Events & Holidays
            </h3>
            <button
              onClick={() => handleNavigate('events')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Events Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No upcoming events or holidays scheduled.</p>
            ) : upcomingEvents.map((e: any) => (
              <div key={e.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{e.title || e.name}</p>
                  <p className="text-[10px] text-slate-500">{e.type || e.category || 'School Calendar Event'}</p>
                </div>
                <span className="font-semibold px-2 py-1 rounded-lg text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0 ml-2">
                  {e.date ? new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
