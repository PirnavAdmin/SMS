import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Sparkles, Cake, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, FileText, Download, Printer, Bell, CheckCircle2, AlertTriangle,
  X, Eye, Edit, Trash2, Tag, BookOpen, GraduationCap, Briefcase, UserCheck, Share2,
  Paperclip, Send, Layers, LayoutGrid, List, HelpCircle, Shield, Award, Megaphone
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  Holiday, SchoolEvent, UnifiedCalendarEvent, UnifiedEventType, HolidayType, EventCategory, Student, Staff
} from '../../../types';

export const EventsView: React.FC = () => {
  const {
    holidays, addHoliday, updateHoliday, deleteHoliday,
    schoolEvents, addSchoolEvent, updateSchoolEvent, deleteSchoolEvent,
    birthdays, students, staff, exams, examSchedules, meetings, admissions, homework
  } = useData();

  const { addToast } = useToast();

  // Active Sub-Tab: 'dashboard' | 'calendar' | 'holidays' | 'school-events' | 'birthdays'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'holidays' | 'school-events' | 'birthdays'>('calendar');

  // Calendar View Mode: 'month' | 'week' | 'day' | 'agenda'
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Calendar Navigation Date State (defaults to current date)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 28)); // July 28, 2026

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals State
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<UnifiedCalendarEvent | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [eventToNotify, setEventToNotify] = useState<UnifiedCalendarEvent | null>(null);

  // Birthday Filter View Mode
  const [birthdayFilterView, setBirthdayFilterView] = useState<'today' | 'tomorrow' | '7days' | '30days' | 'all'>('today');

  // Add Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Sports Day' as EventCategory,
    description: '',
    organizer: '',
    venue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    participants: 'All Students & Staff',
    applicableClasses: ['All Classes'],
    status: 'Published' as const,
    attachmentName: ''
  });

  // Add Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    type: 'National' as HolidayType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    branch: 'Main Campus',
    description: '',
    status: 'Active' as const
  });

  // Notification Config Form State
  const [notifyForm, setNotifyForm] = useState({
    channels: { inApp: true, email: true, sms: false },
    recipientType: 'All',
    customMessage: '',
    reminderTiming: '1 Day Before'
  });

  // ==========================================
  // UNIFIED CALENDAR EVENT RESOLUTION ENGINE
  // ==========================================
  const unifiedEvents: UnifiedCalendarEvent[] = useMemo(() => {
    const eventsList: UnifiedCalendarEvent[] = [];

    // 1. School Events (Blue)
    (schoolEvents || []).forEach(evt => {
      eventsList.push({
        id: `SE-${evt.id}`,
        title: evt.title,
        date: evt.startDate,
        endDate: evt.endDate,
        time: `${evt.startTime || ''} ${evt.endTime ? `- ${evt.endTime}` : ''}`.trim(),
        type: 'School Event',
        category: evt.category,
        venue: evt.venue,
        organizer: evt.organizer,
        description: evt.description,
        color: 'blue',
        sourceModule: 'School Events Module',
        branch: evt.branch,
        applicableClasses: evt.applicableClasses,
        rawItem: evt
      });
    });

    // 2. Holidays (Green)
    (holidays || []).forEach(hol => {
      eventsList.push({
        id: `HOL-${hol.id}`,
        title: `${hol.name} (${hol.type} Holiday)`,
        date: hol.startDate,
        endDate: hol.endDate,
        type: 'Holiday',
        category: hol.type,
        description: hol.description || 'Official School Holiday',
        color: 'green',
        sourceModule: 'Holiday Management',
        branch: hol.branch,
        rawItem: hol
      });
    });

    // 3. Examinations (Red)
    (exams || []).forEach(ex => {
      eventsList.push({
        id: `EXM-${ex.id}`,
        title: `Exam: ${ex.name} (${ex.className || 'All Classes'})`,
        date: ex.startDate || '2026-09-10',
        endDate: ex.endDate || '2026-09-20',
        type: 'Examination',
        category: ex.examType,
        venue: 'Examination Halls',
        description: `Academic Examination schedule for ${ex.className}`,
        color: 'red',
        sourceModule: 'Examination Module',
        branch: ex.branch,
        rawItem: ex
      });
    });

    (examSchedules || []).forEach(sch => {
      eventsList.push({
        id: `SCH-${sch.id}`,
        title: `${sch.subject} Exam (${sch.className}-${sch.section})`,
        date: sch.date,
        time: `${sch.startTime} - ${sch.endTime}`,
        type: 'Examination',
        category: 'Subject Exam',
        venue: sch.room,
        description: `Invigilator: ${sch.invigilatorName}`,
        color: 'red',
        sourceModule: 'Exam Schedule',
        branch: sch.branch,
        rawItem: sch
      });
    });

    // 4. Meetings (Purple / Orange)
    (meetings || []).forEach(m => {
      const isPTM = (m.title || '').toLowerCase().includes('ptm') || (m.title || '').toLowerCase().includes('parent');
      eventsList.push({
        id: `MTG-${m.id}`,
        title: m.title,
        date: m.meetingDate || '2026-07-28',
        time: `${m.startTime} - ${m.endTime}`,
        type: isPTM ? 'Parent Teacher Meeting' : 'Staff Meeting',
        category: m.participantType || 'Meeting',
        venue: m.roomVenue || m.building || 'Conference Hall',
        organizer: m.organizerName,
        description: m.description || m.targetGroupDescription || 'Official School Meeting',
        color: isPTM ? 'orange' : 'purple',
        sourceModule: 'Meeting Management',
        branch: m.branch,
        rawItem: m
      });
    });

    // 5. Admissions Schedule (Teal)
    (admissions || []).forEach(adm => {
      const dateStr = adm.submissionDate || '2026-07-28';
      eventsList.push({
        id: `ADM-${adm.id}`,
        title: `Admission Application: ${adm.applicantName || `${adm.firstName || ''} ${adm.lastName || ''}`} (${adm.appliedClass || 'Class 1'})`,
        date: dateStr,
        type: 'Admission Event',
        category: 'Admission Review',
        description: `Status: ${adm.status}. Parent: ${adm.parentName}`,
        color: 'teal',
        sourceModule: 'Admissions Module',
        branch: adm.branch || 'Main Campus',
        rawItem: adm
      });
    });

    // 6. Student & Staff Birthdays (Yellow)
    (students || []).forEach(st => {
      if (st.dob) {
        const dateStr = `2026-${st.dob.slice(5)}`; // Map to 2026
        eventsList.push({
          id: `STU-BD-${st.id}`,
          title: `🎂 Birthday: ${st.firstName} ${st.lastName} (${st.className})`,
          date: dateStr,
          type: 'Birthday',
          category: 'Student Birthday',
          description: `Student in ${st.className}-${st.section || 'A'}`,
          color: 'yellow',
          sourceModule: 'Student Management',
          branch: st.branch,
          rawItem: st
        });
      }
    });

    (staff || []).forEach(stf => {
      if (stf.dob) {
        const dateStr = `2026-${stf.dob.slice(5)}`;
        eventsList.push({
          id: `STF-BD-${stf.id}`,
          title: `🎂 Birthday: ${stf.firstName} ${stf.lastName} (${stf.designation || 'Staff'})`,
          date: dateStr,
          type: 'Birthday',
          category: 'Staff Birthday',
          description: `Department: ${stf.department}`,
          color: 'yellow',
          sourceModule: 'Faculty & Staff',
          branch: stf.branch,
          rawItem: stf
        });
      }
    });

    return eventsList;
  }, [schoolEvents, holidays, exams, examSchedules, meetings, admissions, students, staff]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter(evt => {
      const matchesSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.venue || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = branchFilter === 'All' || !evt.branch || evt.branch === branchFilter || evt.branch === 'All Branches';
      const matchesType = eventTypeFilter === 'All' || evt.type === eventTypeFilter;
      const matchesCategory = categoryFilter === 'All' || evt.category === categoryFilter;

      return matchesSearch && matchesBranch && matchesType && matchesCategory;
    });
  }, [unifiedEvents, searchQuery, branchFilter, eventTypeFilter, categoryFilter]);

  // ==========================================
  // CALENDAR GRID COMPUTATION (Month View)
  // ==========================================
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{ dayNumber: number; dateString: string; isCurrentMonth: boolean; events: UnifiedCalendarEvent[] }> = [];

    // Previous Month Fillers
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateString, isCurrentMonth: false, events: [] });
    }

    // Current Month Days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => e.date === dateString);
      days.push({ dayNumber: d, dateString, isCurrentMonth: true, events: dayEvents });
    }

    // Next Month Fillers
    const remainingSlots = 42 - days.length; // 6 rows of 7 days
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateString, isCurrentMonth: false, events: [] });
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents]);

  // Handlers for Month Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 6, 28)); // Reset to July 2026
  };

  // Submit Handlers
  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startDate) {
      addToast('warning', 'Validation Error', 'Please enter event title and start date.');
      return;
    }

    const newEvt = addSchoolEvent({
      title: eventForm.title.trim(),
      category: eventForm.category,
      description: eventForm.description,
      organizer: eventForm.organizer || 'School Administration',
      venue: eventForm.venue || 'Main Auditorium',
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      branch: eventForm.branch,
      academicYear: eventForm.academicYear,
      participants: eventForm.participants,
      applicableClasses: eventForm.applicableClasses,
      status: eventForm.status,
      attachments: eventForm.attachmentName ? [{ id: 'ATT-NEW', name: eventForm.attachmentName, url: '#', type: 'PDF' }] : []
    });

    addToast('success', 'Event Published', `School event '${newEvt.title}' added to Academic Calendar.`);
    setIsAddEventModalOpen(false);
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.startDate) return;

    addHoliday({
      name: holidayForm.name.trim(),
      type: holidayForm.type,
      startDate: holidayForm.startDate,
      endDate: holidayForm.endDate,
      branch: holidayForm.branch,
      description: holidayForm.description,
      status: holidayForm.status
    });

    addToast('success', 'Holiday Added', `Official holiday '${holidayForm.name}' recorded.`);
    setIsAddHolidayModalOpen(false);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventToNotify) return;

    addToast('success', 'Notifications Dispatched', `Reminders sent for '${eventToNotify.title}' via In-App & Email.`);
    setIsNotifyModalOpen(false);
    setEventToNotify(null);
  };

  // CSV Export
  const handleExportEventsCSV = () => {
    const headers = ['Title,Date,Time,Event Type,Category,Venue,Organizer,Branch,Source Module'];
    const rows = filteredEvents.map(e =>
      `"${e.title}","${e.date}","${e.time || ''}","${e.type}","${e.category || ''}","${e.venue || ''}","${e.organizer || ''}","${e.branch || 'Main Campus'}","${e.sourceModule}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Academic_Calendar_Events_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Exported Academic Calendar to CSV.');
  };

  // Color Helper for Badge Pills
  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'green':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'red':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'orange':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'teal':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-500" />
            Academic Calendar & Events
          </h2>
          <p className="text-xs text-slate-500">
            Centralized school event schedules, gazetted holidays, exams, meetings, and birthday celebrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportEventsCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </button>

          <button
            onClick={() => setIsAddHolidayModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> + Add Holiday
          </button>

          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> + Add School Event
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-2xl border border-slate-200/60 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Dashboard
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Interactive Calendar
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'holidays'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Holidays ({holidays.length})
        </button>

        <button
          onClick={() => setActiveTab('school-events')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'school-events'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-sky-500" /> School Events ({schoolEvents.length})
        </button>

        <button
          onClick={() => setActiveTab('birthdays')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'birthdays'
              ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-rose-500" /> Birthdays ({birthdays.length})
        </button>
      </div>

      {/* SUB-TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('calendar')}
              className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900/40 shadow-xs hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Total Academic Events</span>
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{unifiedEvents.length}</p>
              <p className="text-[11px] text-slate-500">Across all ERP integrated modules</p>
            </div>

            <div
              onClick={() => setActiveTab('holidays')}
              className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-950/30 dark:to-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Gazetted & School Holidays</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{holidays.length}</p>
              <p className="text-[11px] text-slate-500">Official Gazetted & School Holidays</p>
            </div>

            <div
              onClick={() => setActiveTab('school-events')}
              className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-slate-50 dark:from-sky-950/30 dark:to-slate-900 border border-sky-200 dark:border-sky-900/40 shadow-xs hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Published School Events</span>
                <Award className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{schoolEvents.length}</p>
              <p className="text-[11px] text-slate-500">Sports, Cultural & Science Fests</p>
            </div>

            <div
              onClick={() => setActiveTab('birthdays')}
              className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-slate-50 dark:from-rose-950/30 dark:to-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-xs hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Birthday Radar</span>
                <Cake className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{birthdays.length}</p>
              <p className="text-[11px] text-slate-500">Students, Teachers & Staff</p>
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gazetted & School Holidays Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Gazetted & Official Holidays
                </h3>
                <button onClick={() => setActiveTab('holidays')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
              </div>

              <div className="space-y-2.5">
                {holidays.map(h => (
                  <div key={h.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{h.name}</p>
                      <p className="text-[10px] text-slate-500">{h.type} Holiday • {h.branch || 'Main Campus'}</p>
                    </div>
                    <span className="font-extrabold px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[11px]">
                      {h.startDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Birthdays Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Cake className="w-4 h-4 text-rose-500" /> Upcoming Birthdays Radar
                </h3>
                <button onClick={() => setActiveTab('birthdays')} className="text-xs font-bold text-rose-600 hover:underline">Birthday Center</button>
              </div>

              <div className="space-y-2.5">
                {birthdays.map(b => (
                  <div key={b.id} className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={b.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-[10px] text-slate-500">{b.role} • {b.className || b.department || 'Main'}</p>
                      </div>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-1 rounded-full text-[10px]">
                      {b.dob}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE CALENDAR (MAIN SCREEN FILLED) */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          
          {/* Calendar Header & View Controls Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Month & Year Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {monthNames[currentMonth]} {currentYear}
              </h3>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Filter Legend Indicators */}
            <div className="hidden xl:flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-sky-600"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Event</span>
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Holiday</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Exam</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> PTM</span>
              <span className="flex items-center gap-1 text-purple-600"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Meeting</span>
              <span className="flex items-center gap-1 text-yellow-600"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Birthday</span>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                onClick={() => setCalendarViewMode('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  calendarViewMode === 'month' ? 'bg-white dark:bg-slate-950 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  calendarViewMode === 'agenda' ? 'bg-white dark:bg-slate-950 text-indigo-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                Agenda List
              </button>
            </div>
          </div>

          {/* MONTH VIEW GRID (replaces empty space!) */}
          {calendarViewMode === 'month' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4">
              
              {/* Day Headers (Sun-Sat) */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-400">
                <div className="py-2 text-rose-500">Sun</div>
                <div className="py-2">Mon</div>
                <div className="py-2">Tue</div>
                <div className="py-2">Wed</div>
                <div className="py-2">Thu</div>
                <div className="py-2">Fri</div>
                <div className="py-2">Sat</div>
              </div>

              {/* 42-Day Month Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarGridDays.map((cell, idx) => {
                  const isToday = cell.dateString === '2026-07-28';
                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                        cell.isCurrentMonth
                          ? isToday
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-slate-100/30 dark:bg-slate-900/20 border-transparent opacity-40'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                          isToday ? 'bg-indigo-600 text-white' : cell.isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                        }`}>
                          {cell.dayNumber}
                        </span>
                        {cell.events.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400">{cell.events.length} evt</span>
                        )}
                      </div>

                      {/* Day Event Badges */}
                      <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5 no-scrollbar">
                        {cell.events.map(evt => (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventForDetail(evt)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold truncate cursor-pointer hover:scale-[1.02] transition-transform ${getBadgeStyle(evt.color)}`}
                            title={`${evt.title} - ${evt.time || ''}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* AGENDA LIST VIEW */}
          {calendarViewMode === 'agenda' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-4 h-4 text-indigo-600" />
                Comprehensive Academic Calendar Agenda ({filteredEvents.length} Events)
              </h3>

              <div className="space-y-3">
                {filteredEvents.map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForDetail(evt)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-2xl border shrink-0 ${getBadgeStyle(evt.color)}`}>
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getBadgeStyle(evt.color)}`}>
                            {evt.type}
                          </span>
                          <span className="text-[10px] text-slate-400">Source: {evt.sourceModule}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{evt.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{evt.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 block">{evt.date}</span>
                      {evt.time && <span className="text-[11px] text-slate-400">{evt.time}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 3: HOLIDAYS MANAGEMENT */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Holiday Management Master
              </h3>
              <p className="text-[11px] text-slate-400">Manage Gazetted, National, State, and School Holidays</p>
            </div>
            <button
              onClick={() => setIsAddHolidayModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Holiday
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map(h => (
              <div key={h.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    {h.type} Holiday
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => deleteHoliday(h.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{h.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{h.description || 'No specific notes.'}</p>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{h.startDate}</span>
                  <span className="text-[10px] font-bold text-slate-400">{h.branch || 'Main Campus'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SCHOOL EVENTS MANAGEMENT */}
      {activeTab === 'school-events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-500" />
                School Events Catalog & Publication
              </h3>
              <p className="text-[11px] text-slate-400">Sports Days, Science Fests, Cultural Meets, Seminars</p>
            </div>
            <button
              onClick={() => setIsAddEventModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schoolEvents.map(evt => (
              <div key={evt.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-200">
                    {evt.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEventToNotify({
                          id: `SE-${evt.id}`,
                          title: evt.title,
                          date: evt.startDate,
                          type: 'School Event',
                          color: 'blue',
                          sourceModule: 'School Events',
                          rawItem: evt
                        });
                        setIsNotifyModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                      title="Send Reminders"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSchoolEvent(evt.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{evt.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{evt.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t">
                  <span>📅 <strong>Date:</strong> {evt.startDate}</span>
                  <span>⏰ <strong>Time:</strong> {evt.startTime || 'All Day'}</span>
                  <span>📍 <strong>Venue:</strong> {evt.venue}</span>
                  <span>👤 <strong>Organizer:</strong> {evt.organizer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: BIRTHDAYS RADAR */}
      {activeTab === 'birthdays' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Cake className="w-4 h-4 text-rose-500" />
                Student & Staff Birthday Radar
              </h3>
              <p className="text-[11px] text-slate-400">Automated birthday tracking & greeting system</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {birthdays.map(b => (
              <div key={b.id} className="p-5 rounded-3xl bg-gradient-to-br from-rose-50/70 to-slate-50 dark:from-rose-950/20 dark:to-slate-900 border border-rose-100 dark:border-rose-900/40 shadow-xs flex items-center gap-4">
                <img src={b.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-rose-300 shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-700">
                    {b.role}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{b.name}</h4>
                  <p className="text-xs text-slate-500">{b.className || b.department || 'Campus Member'}</p>
                  <button
                    onClick={() => addToast('success', 'Birthday Wishes Sent', `Sent birthday greeting to ${b.name}!`)}
                    className="mt-2 px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                  >
                    <Send className="w-3 h-3" /> Send Wishes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getBadgeStyle(selectedEventForDetail.color)}`}>
                {selectedEventForDetail.type}
              </span>
              <button onClick={() => setSelectedEventForDetail(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedEventForDetail.title}</h3>
              <p className="text-slate-500 mt-1">{selectedEventForDetail.description}</p>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border text-slate-700 dark:text-slate-300">
              <div className="flex justify-between"><span>📅 <strong>Date:</strong></span><span>{selectedEventForDetail.date}</span></div>
              {selectedEventForDetail.time && <div className="flex justify-between"><span>⏰ <strong>Time:</strong></span><span>{selectedEventForDetail.time}</span></div>}
              {selectedEventForDetail.venue && <div className="flex justify-between"><span>📍 <strong>Venue:</strong></span><span>{selectedEventForDetail.venue}</span></div>}
              {selectedEventForDetail.organizer && <div className="flex justify-between"><span>👤 <strong>Organizer:</strong></span><span>{selectedEventForDetail.organizer}</span></div>}
              <div className="flex justify-between"><span>🏢 <strong>Branch:</strong></span><span>{selectedEventForDetail.branch || 'Main Campus'}</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setSelectedEventForDetail(null)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SCHOOL EVENT MODAL */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Create School Event</h3>
              <button onClick={() => setIsAddEventModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <label className="block font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cultural Extravaganza 2026"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Event Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={e => setEventForm({ ...eventForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    <option value="Sports Day">Sports Day</option>
                    <option value="Annual Day">Annual Day</option>
                    <option value="Science Exhibition">Science Exhibition</option>
                    <option value="Cultural Fest">Cultural Fest</option>
                    <option value="Parent Teacher Meeting">Parent Teacher Meeting</option>
                    <option value="Workshop & Seminar">Workshop & Seminar</option>
                    <option value="School Tour">School Tour</option>
                    <option value="Custom Event">Custom Event</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium"
                    value={eventForm.venue}
                    onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter event agenda, rules or overview..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Publish to Calendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE HOLIDAY MODAL */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Add Official Holiday</h3>
              <button onClick={() => setIsAddHolidayModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddHolidaySubmit} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Holiday Name *</label>
                <input type="text" required placeholder="e.g. Independence Day" value={holidayForm.name} onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block font-bold mb-1">Type *</label>
                <select value={holidayForm.type} onChange={e => setHolidayForm({ ...holidayForm, type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="National">National</option>
                  <option value="State">State</option>
                  <option value="School">School</option>
                  <option value="Gazetted">Gazetted</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Start Date *</label>
                  <input type="date" required value={holidayForm.startDate} onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
                <div>
                  <label className="block font-bold mb-1">End Date *</label>
                  <input type="date" required value={holidayForm.endDate} onChange={e => setHolidayForm({ ...holidayForm, endDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddHolidayModalOpen(false)} className="px-3 py-1.5 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-xl shadow-md">Record Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFY REMINDER MODAL */}
      {isNotifyModalOpen && eventToNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-indigo-600 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Send Event Reminder: {eventToNotify.title}
              </h3>
              <button onClick={() => setIsNotifyModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Notification Channels</label>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-1 font-semibold"><input type="checkbox" defaultChecked /> In-App</label>
                  <label className="flex items-center gap-1 font-semibold"><input type="checkbox" defaultChecked /> Email</label>
                  <label className="flex items-center gap-1 font-semibold"><input type="checkbox" /> SMS</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsNotifyModalOpen(false)} className="px-3 py-1.5 bg-slate-200 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md">Dispatch Reminders</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default EventsView;
