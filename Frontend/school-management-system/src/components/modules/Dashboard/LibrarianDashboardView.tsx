import React, { useMemo } from 'react';
import { 
  Calendar, Clock, UserCheck, Megaphone, Sparkles, BookOpen, 
  ArrowRight, CheckCircle2, AlertCircle, Bell, Bookmark, ArrowUpRight,
  ShieldCheck, Layers
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import * as LibraryAPI from '../../../api/library';

import { deriveAttendanceStatus, calculateWorkedHours } from '../Library/LibrarianAttendanceView';

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
    schoolEvents = [],
    attendance = [],
    timetable = []
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
      if (moduleName === 'librarian-attendance') {
        onNavigate('staff-attendance');
      } else {
        onNavigate(moduleName);
      }
    }
  };

  const [attVersion, setAttVersion] = React.useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setAttVersion(v => v + 1);
    window.addEventListener('librarian_attendance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('librarian_attendance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute Today's Shift & Attendance Status dynamically
  const todayAttendance = useMemo(() => {
    const loggedName = (user?.name || '').trim();
    const loggedFirstName = loggedName ? loggedName.split(' ')[0].toLowerCase() : '';
    const loggedEmpId = (user as any)?.empId || '';

    const map = new Map<string, any>();

    const processRecord = (r: any) => {
      const isStaff = !r.entityType || String(r.entityType).toLowerCase() === 'staff';
      const rDate = String(r.date || '').split('T')[0];
      if (!isStaff || rDate !== todayStr) return;

      const recStaffId = String(r.staffId || r.empId || r.entityId || loggedEmpId).trim();
      const recStaffName = String(r.staffName || r.employeeName || r.name || loggedName).trim();
      const recStaffNameLower = recStaffName.toLowerCase();
      const isLibrarian = String(r.designation || r.department || r.role || '').toLowerCase().includes('librar');
      const isUserMatch = (loggedEmpId && recStaffId === loggedEmpId) || (loggedFirstName && recStaffNameLower.includes(loggedFirstName)) || isLibrarian;

      if (!isUserMatch) return;

      const nameKey = recStaffNameLower.replace(/\s+/g, '') || loggedFirstName;
      const key = `${rDate}_${nameKey}`;

      const inTime = r.checkInTime || r.inTime || r.timeIn || r.time;
      const outTime = r.checkOutTime || r.outTime || r.timeOut;
      const status = r.status;
      const hours = r.workingHours;
      const statusVal = deriveAttendanceStatus(inTime, status);

      map.set(key, {
        id: String(r.id || `ATT-LIB-${rDate}`),
        staffId: recStaffId || loggedEmpId,
        staffName: recStaffName || loggedName,
        role: 'Librarian',
        date: rDate,
        checkInTime: inTime,
        checkOutTime: outTime,
        workingHours: hours,
        shift: r.shift || 'Morning Shift (08:30 - 17:00)',
        status: statusVal,
        remarks: r.remarks || ''
      });
    };

    // 1. DataContext attendance records (Primary Source)
    (attendance || []).forEach(processRecord);

    // 2. localStorage edu_db_attendance
    if (typeof window !== 'undefined') {
      try {
        const storedAtt = localStorage.getItem('edu_db_attendance') || localStorage.getItem('attendance');
        if (storedAtt) {
          const parsed = JSON.parse(storedAtt);
          if (Array.isArray(parsed)) parsed.forEach(processRecord);
        }
      } catch (e) {}
    }

    // 3. Merge localStorage edu_db_librarian_attendance (Latest Librarian punches take precedence)
    if (typeof window !== 'undefined') {
      try {
        const s = localStorage.getItem('edu_db_librarian_attendance');
        if (s) {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            parsed.forEach((r: any) => {
              const rDate = String(r.date || '').split('T')[0];
              if (rDate !== todayStr) return;

              const recStaffName = String(r.staffName || r.name || r.employeeName || loggedName).trim();
              const recStaffNameLower = recStaffName.toLowerCase();
              const nameKey = recStaffNameLower.replace(/\s+/g, '') || loggedFirstName;
              const key = `${rDate}_${nameKey}`;
              const existing = map.get(key);

              const inTime = r.checkInTime || r.inTime || r.timeIn || r.time;
              const outTime = r.checkOutTime || r.outTime || r.timeOut;
              const statusVal = deriveAttendanceStatus(inTime, r.status);

              const rawOut = outTime !== undefined ? outTime : existing?.checkOutTime;
              const finalOut = rawOut === '05:00 PM' && !r.checkOutTime ? undefined : rawOut;

              map.set(key, {
                ...existing,
                ...r,
                date: rDate,
                staffId: r.staffId || loggedEmpId,
                staffName: recStaffName,
                checkInTime: inTime || existing?.checkInTime,
                checkOutTime: finalOut,
                status: statusVal,
                workingHours: r.workingHours && r.workingHours !== '23.2 Hours' ? r.workingHours : (inTime && finalOut ? calculateWorkedHours(inTime, finalOut) : '--')
              });
            });
          }
        }
      } catch (e) {}
    }

    const matched = Array.from(map.values()).find(r => 
      loggedFirstName ? String(r.staffName || '').toLowerCase().includes(loggedFirstName) : true
    );

    return matched || Array.from(map.values())[0] || null;
  }, [attendance, user?.name, (user as any)?.empId, todayStr, attVersion]);

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

  const todayDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return today === 'Sunday' ? 'Monday' : today;
  }, []);

  // Today's reading periods dynamic preview from timetable
  const todayReadingPeriods = useMemo(() => {
    const periods = (timetable || []).filter((s: any) => {
      const isToday = (s.day || s.dayName || '').toLowerCase() === todayDayName.toLowerCase();
      const subj = (s.subject || '').toLowerCase();
      const room = (s.roomNo || '').toLowerCase();
      const tName = (s.teacherName || '').toLowerCase();
      return isToday && (subj.includes('library') || subj.includes('reading') || subj.includes('reference') || room.includes('library') || tName.includes('librar'));
    });

    if (periods.length === 0) {
      return [];
    }

    return periods.slice(0, 3).map((p: any, idx: number) => ({
      period: p.period ? `Period ${p.period}` : `Slot ${idx + 1}`,
      time: p.time || p.periodTime || (idx === 0 ? '09:15 AM - 10:00 AM' : idx === 1 ? '11:00 AM - 11:45 AM' : '01:15 PM - 02:00 PM'),
      className: p.className || p.class || '',
      teacher: p.teacherName || p.teacher || 'Subject Teacher',
      topic: p.subject || 'Library Reading Session'
    }));
  }, [timetable, todayDayName]);

  // Latest School Announcements
  const recentNotices = useMemo(() => {
    return announcements.slice(0, 3);
  }, [announcements]);

  // Upcoming School Events
  const upcomingEvents = useMemo(() => {
    const eventsList = (schoolEvents || []).map(e => ({ ...e, title: e.title, date: e.startDate }));
    const hols = (holidays || []).map(h => ({ ...h, title: h.name, date: h.startDate }));
    const all = [...eventsList, ...hols];
    const seen = new Set<string>();
    return all.filter(item => {
      const key = `${(item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')}_${item.date || item.startDate || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
  }, [schoolEvents, holidays]);

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in pb-6">
      
      {/* 1. Header Banner matching Admin Dashboard - Sleek Transparent Layout */}
      <div className="relative flex items-center justify-between text-slate-900 dark:text-white">
        <div className="relative z-10 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{greeting}, {user?.name || 'Librarian'}!</span>
              <span className="text-base inline-block hover:rotate-12 transition-transform select-none" role="img" aria-label="wave">👋</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-sky-200/80 dark:border-sky-800 shadow-xs shrink-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="text-left font-mono shrink-0">
            <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-none">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Books */}
        <div 
          onClick={() => handleNavigate('library-books')}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Total Books
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {totalBooksCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 border border-sky-200 dark:border-sky-800 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Available */}
        <div 
          onClick={() => handleNavigate('library-books')}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Available
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {availableCopiesCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Issued Books */}
        <div 
          onClick={() => handleNavigate('library-issue')}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Issued Books
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {activeLoansCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Overdue Returns */}
        <div 
          onClick={() => handleNavigate('library-return')}
          className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 hover:-translate-y-0.5 transition-all duration-300 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between cursor-pointer group"
        >
          <div className="space-y-1 text-left min-w-0 pr-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Overdue Returns
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {overdueCount}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 border border-rose-200 dark:border-rose-800 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Shift & Timetable Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        
        {/* Left: Librarian Daily Shift & Desk Duty */}
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between h-full space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" /> Daily Shift & Attendance Status
              </h3>
              {todayAttendance?.checkInTime && todayAttendance?.checkOutTime ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Shift Completed
                </span>
              ) : todayAttendance?.checkInTime ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Shift
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Not Checked In
                </span>
              )}
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500 font-medium">Logged-in Account:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.name || 'Staff'}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500 font-medium">Shift Timmings:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{todayAttendance?.shift || '08:30 AM - 05:00 PM'}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                <span className="text-slate-500 font-medium">Check-in:</span>
                {todayAttendance?.checkInTime ? (
                  <div className="flex items-center gap-1.5">
                    {todayAttendance.status === 'Late' && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Late
                      </span>
                    )}
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {todayAttendance.checkInTime}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Not Checked In Yet</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Check-out:</span>
                {todayAttendance?.checkOutTime ? (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {todayAttendance.checkOutTime}
                  </span>
                ) : (
                  <span className="font-mono font-bold text-slate-400 dark:text-slate-500">Not Checked Out Yet</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleNavigate('staff-attendance')}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 mt-auto"
          >
            <span>Open Librarian Attendance & Shift Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Today's Master Reading Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between h-full space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-500" /> Today's Class Schedule
              </h3>
              <button
                onClick={() => handleNavigate('library-timetable')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                Full Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {todayReadingPeriods.map((slot, idx) => (
                <div key={idx} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
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

      {/* 4. Bottom Grid: School Circulars & Upcoming School Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
        
        {/* School Circulars / Announcements */}
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between h-full space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" /> Official School Notices
              </h3>
              <button
                onClick={() => handleNavigate('communication')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                Communication Hub <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {recentNotices.length === 0 ? (
                <div className="p-4 sm:p-5 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No official circulars published.
                </div>
              ) : recentNotices.map((n: any) => (
                <div key={n.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
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
        <div className="bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800 shadow-xs p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between h-full space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" /> Upcoming School Events & Holidays
              </h3>
              <button
                onClick={() => handleNavigate('events')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                Events Calendar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="p-4 sm:p-5 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 min-h-[120px] flex items-center justify-center">
                  No upcoming events or holidays scheduled.
                </div>
              ) : upcomingEvents.map((e: any) => (
                <div key={e.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
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
