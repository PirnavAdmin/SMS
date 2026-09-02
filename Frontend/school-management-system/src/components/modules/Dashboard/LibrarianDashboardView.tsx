import React, { useMemo } from 'react';
import { 
  Calendar, Clock, UserCheck, Megaphone, Sparkles, BookOpen, 
  ArrowRight, CheckCircle2, AlertCircle, Bell, Bookmark, ArrowUpRight,
  ShieldCheck, Layers
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import * as LibraryAPI from '../../../api/library';

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

  const [liveBooks, setLiveBooks] = React.useState<any[]>(books);
  const [liveIssues, setLiveIssues] = React.useState<any[]>(bookIssues);

  React.useEffect(() => {
    if (books && books.length > 0) setLiveBooks(books);
  }, [books]);

  React.useEffect(() => {
    if (bookIssues && bookIssues.length > 0) setLiveIssues(bookIssues);
  }, [bookIssues]);

  React.useEffect(() => {
    const fetchBackendMetrics = async () => {
      const extractArray = (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.items)) return res.items;
        return [];
      };

      try {
        const [bRes, iRes]: any[] = await Promise.all([
          LibraryAPI.fetchBooksApi(),
          LibraryAPI.fetchIssuedBooksApi()
        ]);

        const fetchedBooks = extractArray(bRes);
        if (fetchedBooks.length > 0) setLiveBooks(fetchedBooks);

        const fetchedIssues = extractArray(iRes);
        if (fetchedIssues.length > 0) setLiveIssues(fetchedIssues);
      } catch (err) {
        console.warn("Librarian dashboard API load notice:", err);
      }
    };
    fetchBackendMetrics();
  }, []);

  const handleNavigate = (moduleName: string) => {
    if (onNavigate) {
      onNavigate(moduleName);
    }
  };

  // Metrics
  const totalBooksCount = useMemo(() => {
    const source = liveBooks.length > 0 ? liveBooks : books;
    return source.reduce((acc, b) => acc + (Number(b.totalCopies) || 0), 0);
  }, [liveBooks, books]);

  const availableCopiesCount = useMemo(() => {
    const source = liveBooks.length > 0 ? liveBooks : books;
    return source.reduce((acc, b) => acc + (Number(b.availableCopies) || 0), 0);
  }, [liveBooks, books]);

  const activeLoansCount = useMemo(() => {
    const source = liveIssues.length > 0 ? liveIssues : bookIssues;
    return source.filter(i => i.status === 'Issued' || i.status === 'Renewed').length;
  }, [liveIssues, bookIssues]);

  const overdueCount = useMemo(() => {
    const source = liveIssues.length > 0 ? liveIssues : bookIssues;
    return source.filter(i => i.status === 'Overdue').length;
  }, [liveIssues, bookIssues]);

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

      {/* 2. Separate Summary Metric Cards (Clickable to Navigate directly to specific data tab) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Books */}
        <div 
          onClick={() => handleNavigate('library-books')}
          className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Books</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalBooksCount}</p>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              In Catalog <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Available */}
        <div 
          onClick={() => handleNavigate('library-books')}
          className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{availableCopiesCount}</p>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              On Shelves <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Issued Books (Borrowed) */}
        <div 
          onClick={() => handleNavigate('library-issue')}
          className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/50 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">Issued Books</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 group-hover:bg-sky-100 transition-colors">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">{activeLoansCount}</p>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Borrowed <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Overdue Returns */}
        <div 
          onClick={() => handleNavigate('library-return')}
          className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Overdue Returns</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{overdueCount}</p>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Late Returns <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Shift & Timetable Schedule (50/50 Equal Width & Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left: Librarian Daily Shift & Desk Duty */}
        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Daily Shift & Attendance Status
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Shift
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500 font-medium">Logged-in Account:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Bhanu Prakash'}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
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
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 mt-auto"
          >
            <span>Open Librarian Attendance & Shift Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Today's Master Reading Schedule */}
        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" /> Today's Class Schedule
              </h3>
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

      </div>

      {/* 4. Bottom Grid: School Circulars & Upcoming School Events (50/50 Equal Width & Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* School Circulars / Announcements */}
        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
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
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No official circulars published.
                </div>
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
        </div>

        {/* Upcoming School Events */}
        <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
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
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[140px] flex items-center justify-center">
                  No upcoming events or holidays scheduled.
                </div>
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

    </div>
  );
};
