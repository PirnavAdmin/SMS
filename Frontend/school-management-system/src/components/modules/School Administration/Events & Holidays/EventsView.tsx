import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Sparkles, Cake, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Clock, MapPin, Users, FileText, Download, Printer, Bell, CheckCircle2, AlertTriangle,
  X, Eye, Edit, Trash2, Tag, BookOpen, GraduationCap, Briefcase, UserCheck, Share2,
  Paperclip, Send, Layers, LayoutGrid, List, HelpCircle, Shield, Award, Megaphone,
  Landmark, Sun, PartyPopper, Check, CalendarDays, Settings2
} from 'lucide-react';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import {
  Holiday, SchoolEvent, UnifiedCalendarEvent, UnifiedEventType, HolidayType, EventCategory, Student, Staff
} from '../../../../types';
import { fetchHolidaysApi, fetchSchoolEventsApi } from '../../../../api/events';

export const EventsView: React.FC = () => {
  const {
    holidays, addHoliday, updateHoliday, deleteHoliday,
    schoolEvents, addSchoolEvent, updateSchoolEvent, deleteSchoolEvent,
    birthdays, students, staff, exams, examSchedules, meetings, admissions, homework,
    announcements
  } = useData();

  // Comprehensive Realistic Official Holidays List for Academic Year 2026-2027
  const REALISTIC_HOLIDAYS_2026_2027: Holiday[] = useMemo(() => [
    { id: 'HOL-2026-01', name: 'Independence Day', type: 'National', startDate: '2026-08-15', endDate: '2026-08-15', branch: 'Main Campus', description: 'National Holiday celebrating Indian Independence Day', status: 'Active' },
    { id: 'HOL-2026-02', name: 'Raksha Bandhan', type: 'Festival', startDate: '2026-08-28', endDate: '2026-08-28', branch: 'Main Campus', description: 'Traditional Festival Holiday', status: 'Active' },
    { id: 'HOL-2026-03', name: 'Sri Krishna Janmashtami', type: 'Festival', startDate: '2026-09-04', endDate: '2026-09-04', branch: 'Main Campus', description: 'Lord Krishna Jayanti Festival', status: 'Active' },
    { id: 'HOL-2026-04', name: 'Ganesh Chaturthi', type: 'Festival', startDate: '2026-09-14', endDate: '2026-09-14', branch: 'Main Campus', description: 'Ganesh Chaturthi Celebration', status: 'Active' },
    { id: 'HOL-2026-05', name: 'Mahatma Gandhi Jayanti', type: 'National', startDate: '2026-10-02', endDate: '2026-10-02', branch: 'Main Campus', description: 'Father of the Nation Birthday National Holiday', status: 'Active' },
    { id: 'HOL-2026-06', name: 'Dussehra / Vijayadashami Break', type: 'Vacation', startDate: '2026-10-18', endDate: '2026-10-22', branch: 'Main Campus', description: '5-Day Term Break for Dussehra Celebrations', status: 'Active' },
    { id: 'HOL-2026-07', name: 'Diwali / Deepavali Vacation', type: 'Festival', startDate: '2026-11-08', endDate: '2026-11-12', branch: 'Main Campus', description: '5-Day Festival Break for Diwali Lights Celebration', status: 'Active' },
    { id: 'HOL-2026-08', name: 'Guru Nanak Jayanti', type: 'Gazetted', startDate: '2026-11-24', endDate: '2026-11-24', branch: 'Main Campus', description: 'Guru Nanak Dev Ji Prakash Purab', status: 'Active' },
    { id: 'HOL-2026-09', name: 'Christmas & Winter Vacation', type: 'Vacation', startDate: '2026-12-24', endDate: '2027-01-01', branch: 'Main Campus', description: 'Official 9-Day Winter Vacation Break', status: 'Active' },
    { id: 'HOL-2027-10', name: 'Makar Sankranti / Pongal', type: 'Festival', startDate: '2027-01-14', endDate: '2027-01-15', branch: 'Main Campus', description: 'Harvest Festival Holiday', status: 'Active' },
    { id: 'HOL-2027-11', name: 'Republic Day', type: 'National', startDate: '2027-01-26', endDate: '2027-01-26', branch: 'Main Campus', description: 'Indian Constitution & Republic Day Flag Hoisting', status: 'Active' },
    { id: 'HOL-2027-12', name: 'Maha Shivratri', type: 'Festival', startDate: '2027-03-06', endDate: '2027-03-06', branch: 'Main Campus', description: 'Maha Shivratri Observance', status: 'Active' },
    { id: 'HOL-2027-13', name: 'Holi Festival of Colors', type: 'Festival', startDate: '2027-03-22', endDate: '2027-03-22', branch: 'Main Campus', description: 'Holi Festival Holiday', status: 'Active' },
    { id: 'HOL-2027-14', name: 'Id-ul-Fitr (Ramzan Eid)', type: 'Gazetted', startDate: '2027-04-09', endDate: '2027-04-09', branch: 'Main Campus', description: 'Gazetted Festival Holiday for Id-ul-Fitr', status: 'Active' },
    { id: 'HOL-2027-15', name: 'Annual Summer Vacation Break', type: 'Vacation', startDate: '2027-05-01', endDate: '2027-06-05', branch: 'Main Campus', description: '5-Week Annual Summer Vacation for Students & Academic Staff', status: 'Active' }
  ], []);

  // Fetch backend holidays & events from API on mount
  React.useEffect(() => {
    const loadBackendEventsData = async () => {
      try {
        const [hRes, eRes]: any[] = await Promise.all([
          fetchHolidaysApi(),
          fetchSchoolEventsApi()
        ]);
        if (hRes?.success && Array.isArray(hRes.data) && hRes.data.length > 0) {
          localStorage.setItem('edu_db_holidays', JSON.stringify(hRes.data));
        }
        if (eRes?.success && Array.isArray(eRes.data) && eRes.data.length > 0) {
          localStorage.setItem('edu_db_school_events', JSON.stringify(eRes.data));
        }
      } catch (err) {
        console.warn("Events & Holidays API load notice:", err);
      }
    };
    loadBackendEventsData();
  }, []);

  // Ensure default realistic holidays are populated into DataContext if initial count is small
  React.useEffect(() => {
    if (holidays && holidays.length > 0 && holidays.length < 15) {
      const existingNames = new Set(holidays.map(h => h.name.toLowerCase()));
      REALISTIC_HOLIDAYS_2026_2027.forEach(rh => {
        if (!existingNames.has(rh.name.toLowerCase())) {
          addHoliday(rh);
        }
      });
    }
  }, [holidays, REALISTIC_HOLIDAYS_2026_2027, addHoliday]);

  const displayHolidays = useMemo(() => {
    const rawList = (holidays && holidays.length > 0) ? holidays : REALISTIC_HOLIDAYS_2026_2027;
    return rawList.map(h => {
      let normType: HolidayType = h.type;
      const t = (h.type || '').toString().trim().toUpperCase();
      if (t === 'NATIONAL') normType = 'National';
      else if (t === 'GAZETTED') normType = 'Gazetted';
      else if (t === 'FESTIVAL') normType = 'Festival';
      else if (t === 'VACATION') normType = 'Vacation';
      else if (t === 'RESTRICTED' || t === 'OPTIONAL') normType = 'Optional';
      return {
        ...h,
        type: normType
      };
    });
  }, [holidays, REALISTIC_HOLIDAYS_2026_2027]);

  const { role } = useAuth();
  const userRoleStr = (role || '').toLowerCase();
  const isLibrarianRole = userRoleStr.includes('librarian') || userRoleStr.includes('library');
  const isWardenRole = userRoleStr.includes('warden') || userRoleStr.includes('hostel');
  const canManageEvents = role !== 'Student' && role !== 'Parent' && !isLibrarianRole && !isWardenRole;

  const { addToast } = useToast();

  // Active Sub-Tab: 'calendar' | 'holidays' | 'school-events'
  const [activeTab, setActiveTab] = useState<'calendar' | 'holidays' | 'school-events'>('calendar');

  // Calendar View Mode: 'month' | 'agenda'
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'agenda'>('month');

  // Calendar Navigation Date State (defaults to current real-time date)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Holiday Tab Filters & Pagination
  const [holidayTypeFilter, setHolidayTypeFilter] = useState<string>('All');
  const [holidayApplicableToFilter, setHolidayApplicableToFilter] = useState<string>('AllTargets');
  const [holidaySearchQuery, setHolidaySearchQuery] = useState<string>('');
  const [holidayPage, setHolidayPage] = useState<number>(1);
  const holidayPageSize = 25;

  // General Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [agendaDateFilter, setAgendaDateFilter] = useState('');
  const [agendaPage, setAgendaPage] = useState<number>(1);
  const agendaPageSize = 25;

  // Modals State
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<UnifiedCalendarEvent | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
  const [isWeekendModalOpen, setIsWeekendModalOpen] = useState(false);
  const [weekendDays, setWeekendDays] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('edu_db_weekend_days');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [0]; // default: Sunday
  });

  const handleSaveWeekendSettings = () => {
    localStorage.setItem('edu_db_weekend_days', JSON.stringify(weekendDays));
    addToast('success', 'Weekend Settings Saved', 'Weekly off configurations updated successfully.');
    setIsWeekendModalOpen(false);
  };

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [eventToNotify, setEventToNotify] = useState<UnifiedCalendarEvent | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);

  const handleEditHolidayClick = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      type: h.type,
      startDate: h.startDate,
      endDate: h.endDate || h.startDate,
      branch: h.branch || 'Main Campus',
      description: h.description || '',
      status: h.status || 'Active',
      applicableTo: h.applicableTo || 'All'
    });
    setIsAddHolidayModalOpen(true);
  };

  const handleEditEventClick = (evt: SchoolEvent) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      category: evt.category || 'Sports Day',
      description: evt.description || '',
      organizer: evt.organizer || '',
      venue: evt.venue || '',
      startDate: evt.startDate,
      endDate: evt.endDate || evt.startDate,
      startTime: evt.startTime || '09:00 AM',
      endTime: evt.endTime || '04:00 PM',
      branch: evt.branch || 'Main Campus',
      academicYear: evt.academicYear || '2026-2027',
      participants: evt.participants || 'All Students & Staff',
      applicableClasses: evt.applicableClasses || ['All Classes'],
      status: evt.status || 'Published',
      attachmentName: evt.attachments?.[0]?.name || '',
      targetClass: evt.targetClass || 'Class 10',
      targetSection: evt.targetSection || 'A'
    });
    setIsAddEventModalOpen(true);
  };

  const handleCloseHolidayModal = () => {
    setIsAddHolidayModalOpen(false);
    setEditingHoliday(null);
    setHolidayForm({
      name: '',
      type: 'National',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      branch: 'Main Campus',
      description: '',
      status: 'Active',
      applicableTo: 'All'
    });
  };

  const handleCloseEventModal = () => {
    setIsAddEventModalOpen(false);
    setEditingEvent(null);
    setEventForm({
      title: '',
      category: 'Sports Day',
      description: '',
      organizer: '',
      venue: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      branch: 'Main Campus',
      academicYear: '2026-2027',
      participants: 'All Students & Staff',
      applicableClasses: ['All Classes'],
      status: 'Published',
      attachmentName: '',
      targetClass: 'Class 10',
      targetSection: 'A'
    });
  };

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
    academicYear: '2026-2027',
    participants: 'All Students & Staff',
    applicableClasses: ['All Classes'],
    status: 'Published' as 'Completed' | 'Cancelled' | 'Draft' | 'Published',
    attachmentName: '',
    targetClass: 'Class 10',
    targetSection: 'A'
  });

  // Add Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    type: 'National' as HolidayType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    branch: 'Main Campus',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    applicableTo: 'All' as 'All' | 'Students' | 'Teaching Staff' | 'Non-Teaching Staff'
  });

  // Today's formatted ISO date string
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

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
        endDate: evt.endDate || evt.startDate,
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
        targetClass: evt.targetClass,
        targetSection: evt.targetSection,
        rawItem: evt
      });
    });

    // 2. Government & School Holidays (Green / Emerald)
    (displayHolidays || []).forEach(hol => {
      eventsList.push({
        id: `HOL-${hol.id}`,
        title: `${hol.name} (${hol.type})`,
        date: hol.startDate,
        endDate: hol.endDate || hol.startDate,
        type: 'Holiday',
        category: hol.type,
        description: hol.description || 'Official Government / School Holiday',
        color: 'green',
        sourceModule: 'Holiday Management',
        branch: hol.branch,
        rawItem: hol
      });
    });

    // 3. Examinations (Rose / Red)
    (exams || []).forEach(ex => {
      eventsList.push({
        id: `EXM-${ex.id}`,
        title: `Exam: ${ex.name} (${ex.className || 'All Classes'})`,
        date: ex.startDate || '2026-09-10',
        endDate: ex.endDate || ex.startDate || '2026-09-20',
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
        endDate: sch.date,
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

    // 4. Meetings & PTMs (Orange / Indigo)
    (meetings || []).forEach(m => {
      const isPTM = (m.title || '').toLowerCase().includes('ptm') || (m.title || '').toLowerCase().includes('parent');
      eventsList.push({
        id: `MTG-${m.id}`,
        title: m.title,
        date: m.meetingDate || '2026-08-10',
        endDate: m.meetingDate || '2026-08-10',
        time: `${m.startTime} - ${m.endTime}`,
        type: isPTM ? 'Parent Teacher Meeting' : 'Staff Meeting',
        category: m.participantType || 'Meeting',
        venue: m.roomVenue || m.building || 'Conference Hall',
        organizer: m.organizerName,
        description: m.description || m.targetGroupDescription || 'Official School Meeting',
        color: isPTM ? 'orange' : 'blue',
        sourceModule: 'Meeting Management',
        branch: m.branch,
        rawItem: m
      });
    });

    // 5. Admissions Schedule (Teal)
    (admissions || []).forEach(adm => {
      const dateStr = adm.submissionDate || '2026-08-10';
      eventsList.push({
        id: `ADM-${adm.id}`,
        title: `Admission Review: ${adm.applicantName || `${adm.firstName || ''} ${adm.lastName || ''}`} (${adm.appliedClass || 'Class 1'})`,
        date: dateStr,
        endDate: dateStr,
        type: 'Admission Event',
        category: 'Admission Review',
        description: `Status: ${adm.status}. Parent: ${adm.parentName}`,
        color: 'teal',
        sourceModule: 'Admissions Module',
        branch: adm.branch || 'Main Campus',
        rawItem: adm
      });
    });

    // 6. Communication Hub Broadcast Announcements (Purple)
    (announcements || []).forEach(ann => {
      const dateStr = ann.date || (ann as any).createdAt || '2026-08-17';
      eventsList.push({
        id: `ANN-${ann.id}`,
        title: `📢 Circular: ${ann.title}`,
        date: dateStr,
        endDate: dateStr,
        type: 'Broadcast Circular' as any,
        category: ann.category || 'General',
        description: ann.content || 'Official Communication Hub Broadcast Circular',
        color: 'purple',
        sourceModule: 'Communication Hub',
        branch: 'Main Campus',
        rawItem: ann
      });
    });

    // 7. Student & Staff Birthdays (Yellow)
    const currentYr = currentDate.getFullYear();
    (students || []).forEach(st => {
      if (st.dob && st.dob.includes('-')) {
        const dateStr = `${currentYr}-${st.dob.slice(5)}`;
        eventsList.push({
          id: `STU-BD-${st.id}`,
          title: `🎂 Birthday: ${st.firstName} ${st.lastName} (${st.className})`,
          date: dateStr,
          endDate: dateStr,
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
      if (stf.dob && stf.dob.includes('-')) {
        const dateStr = `${currentYr}-${stf.dob.slice(5)}`;
        eventsList.push({
          id: `STF-BD-${stf.id}`,
          title: `🎂 Birthday: ${stf.firstName} ${stf.lastName} (${stf.designation || 'Staff'})`,
          date: dateStr,
          endDate: dateStr,
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
  }, [schoolEvents, displayHolidays, exams, examSchedules, meetings, admissions, announcements, students, staff, currentDate]);

  // Filtered Events for Calendar & Agenda
  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter(evt => {
      const matchesSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.venue || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = eventTypeFilter === 'All' || evt.type === eventTypeFilter;
      const matchesCategory = categoryFilter === 'All' || evt.category === categoryFilter;
      const matchesAgendaDate = !agendaDateFilter || evt.date === agendaDateFilter || (evt.endDate && agendaDateFilter >= evt.date && agendaDateFilter <= evt.endDate);

      return matchesSearch && matchesType && matchesCategory && matchesAgendaDate;
    });
  }, [unifiedEvents, searchQuery, eventTypeFilter, categoryFilter, agendaDateFilter]);

  // Reset agenda page when filters change
  React.useEffect(() => {
    setAgendaPage(1);
  }, [searchQuery, eventTypeFilter, categoryFilter, agendaDateFilter]);

  const totalAgendaPages = Math.max(1, Math.ceil(filteredEvents.length / agendaPageSize));
  const paginatedAgendaEvents = useMemo(() => {
    const start = (agendaPage - 1) * agendaPageSize;
    return filteredEvents.slice(start, start + agendaPageSize);
  }, [filteredEvents, agendaPage, agendaPageSize]);

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

    const normDateStr = (d?: string) => {
      if (!d) return '';
      const str = String(d).trim().replace(/\//g, '-');
      const parts = str.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return str;
    };

    // Current Month Days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = filteredEvents.filter(e => {
        const eStart = normDateStr(e.date);
        const eEnd = normDateStr(e.endDate || e.date);
        if (eEnd && eEnd !== eStart) {
          return dateString >= eStart && dateString <= eEnd;
        }
        return eStart === dateString;
      });
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
    setCurrentDate(new Date());
  };

  // Submit Handlers
  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.startDate) {
      addToast('warning', 'Validation Error', 'Please enter event title and start date.');
      return;
    }

    if (editingEvent) {
      updateSchoolEvent(editingEvent.id, {
        title: eventForm.title.trim(),
        category: eventForm.category,
        description: eventForm.description,
        organizer: eventForm.organizer || (role === 'Teacher' ? 'Teacher' : 'School Administration'),
        venue: eventForm.venue || 'Main Auditorium',
        startDate: eventForm.startDate,
        endDate: eventForm.endDate || eventForm.startDate,
        branch: eventForm.branch,
        academicYear: eventForm.academicYear,
        participants: eventForm.participants,
        applicableClasses: eventForm.applicableClasses,
        status: eventForm.status,
        targetClass: role === 'Teacher' ? eventForm.targetClass : undefined,
        targetSection: role === 'Teacher' ? eventForm.targetSection : undefined,
        attachments: eventForm.attachmentName ? [{ id: 'ATT-NEW', name: eventForm.attachmentName, url: '#', type: 'PDF' }] : editingEvent.attachments
      });
      addToast('success', 'Event Updated', 'School event updated successfully.');
      setEditingEvent(null);
    } else {
      addSchoolEvent({
        title: eventForm.title.trim(),
        category: eventForm.category,
        description: eventForm.description,
        organizer: eventForm.organizer || (role === 'Teacher' ? 'Teacher' : 'School Administration'),
        venue: eventForm.venue || 'Main Auditorium',
        startDate: eventForm.startDate,
        endDate: eventForm.endDate || eventForm.startDate,
        branch: eventForm.branch,
        academicYear: eventForm.academicYear,
        participants: eventForm.participants,
        applicableClasses: eventForm.applicableClasses,
        status: eventForm.status,
        targetClass: role === 'Teacher' ? eventForm.targetClass : undefined,
        targetSection: role === 'Teacher' ? eventForm.targetSection : undefined,
        attachments: eventForm.attachmentName ? [{ id: 'ATT-NEW', name: eventForm.attachmentName, url: '#', type: 'PDF' }] : []
      });
      addToast('success', 'Event Created', 'School event published to academic calendar successfully.');
    }

    setIsAddEventModalOpen(false);
    setEventForm({
      title: '',
      category: 'Sports Day',
      description: '',
      organizer: '',
      venue: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      branch: 'Main Campus',
      academicYear: '2026-2027',
      participants: 'All Students & Staff',
      applicableClasses: ['All Classes'],
      status: 'Published',
      attachmentName: '',
      targetClass: 'Class 10',
      targetSection: 'A'
    });
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.startDate) {
      addToast('warning', 'Validation Error', 'Please provide holiday name and start date.');
      return;
    }

    if (editingHoliday) {
      updateHoliday(editingHoliday.id, {
        name: holidayForm.name.trim(),
        type: holidayForm.type,
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate || holidayForm.startDate,
        description: holidayForm.description,
        status: holidayForm.status,
        applicableTo: holidayForm.applicableTo
      });
      addToast('success', 'Holiday Updated', 'Official holiday details updated successfully.');
      setEditingHoliday(null);
    } else {
      addHoliday({
        name: holidayForm.name.trim(),
        type: holidayForm.type,
        startDate: holidayForm.startDate,
        endDate: holidayForm.endDate || holidayForm.startDate,
        branch: holidayForm.branch,
        description: holidayForm.description,
        status: holidayForm.status,
        applicableTo: holidayForm.applicableTo
      });
      addToast('success', 'Holiday Added', 'Official holiday recorded in the academic master.');
    }

    setIsAddHolidayModalOpen(false);
    setHolidayForm({
      name: '',
      type: 'National',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      branch: 'Main Campus',
      description: '',
      status: 'Active',
      applicableTo: 'All'
    });
  };

  // Filtered Holidays List
  const filteredHolidays = useMemo(() => {
    return displayHolidays.filter(h => {
      const matchesSearch =
        h.name.toLowerCase().includes(holidaySearchQuery.toLowerCase()) ||
        (h.description || '').toLowerCase().includes(holidaySearchQuery.toLowerCase());

      const tUpper = (h.type || '').toString().toUpperCase();
      const filterUpper = holidayTypeFilter.toUpperCase();

      const matchesType =
        holidayTypeFilter === 'All' ||
        tUpper === filterUpper ||
        (holidayTypeFilter === 'Optional' && (tUpper === 'OPTIONAL' || tUpper === 'RESTRICTED'));

      const matchesApplicableTo =
        holidayApplicableToFilter === 'AllTargets' ||
        (holidayApplicableToFilter === 'All' && (!h.applicableTo || h.applicableTo === 'All')) ||
        h.applicableTo === holidayApplicableToFilter;

      return matchesSearch && matchesType && matchesApplicableTo;
    });
  }, [displayHolidays, holidaySearchQuery, holidayTypeFilter, holidayApplicableToFilter]);

  // Reset holiday page when filters change
  React.useEffect(() => {
    setHolidayPage(1);
  }, [holidaySearchQuery, holidayTypeFilter, holidayApplicableToFilter]);

  const totalHolidayPages = Math.max(1, Math.ceil(filteredHolidays.length / holidayPageSize));
  const paginatedHolidays = useMemo(() => {
    const start = (holidayPage - 1) * holidayPageSize;
    return filteredHolidays.slice(start, start + holidayPageSize);
  }, [filteredHolidays, holidayPage, holidayPageSize]);

  // Holiday Stats
  const holidayStats = useMemo(() => {
    const total = displayHolidays.length;
    const national = displayHolidays.filter(h => (h.type || '').toString().toUpperCase() === 'NATIONAL').length;
    const gazetted = displayHolidays.filter(h => (h.type || '').toString().toUpperCase() === 'GAZETTED').length;
    const festival = displayHolidays.filter(h => {
      const t = (h.type || '').toString().toUpperCase();
      return t === 'FESTIVAL' || t === 'VACATION';
    }).length;
    return { total, national, gazetted, festival };
  }, [displayHolidays]);

  // Color Helper for Badge Pills
  const getBadgeStyle = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'blue':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'red':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'orange':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'yellow':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'teal':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getHolidayTypeBadge = (type: HolidayType) => {
    switch (type) {
      case 'National':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Gazetted':
        return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300';
      case 'Festival':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'Vacation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Restricted':
      case 'Optional':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const calculateDaysDuration = (start: string, end?: string) => {
    if (!start) return '1 Day';
    if (!end || start === end) return '1 Day';
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} Days`;
  };

  return (
    <div className="space-y-6 animate-in fade-in text-left">
      
      {/* Top Header Banner matching Dashboard Aesthetics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200/80 dark:border-sky-900/50 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Events & Holidays
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canManageEvents && (
            <>
              {activeTab === 'holidays' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWeekendModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-200 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition cursor-pointer h-[34px] border border-slate-200/60 dark:border-slate-700"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Weekend Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddHolidayModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600  hover:bg-sky-500 text-white text-xs font-extrabold shadow-sm shadow-sky-600/30 flex items-center gap-1.5 transition cursor-pointer h-[34px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Holiday
                  </button>
                </div>
              )}

              {activeTab === 'school-events' && (
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold shadow-sm shadow-sky-600/30 flex items-center gap-1.5 transition cursor-pointer h-[34px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add School Event
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`py-2 px-5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" /> Academic Calendar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`py-2 px-5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'holidays'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" /> Holiday List
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('school-events')}
          className={`py-2 px-5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'school-events'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> School Events
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACADEMIC CALENDAR (Month Grid & Agenda) */}
      {/* ========================================================================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          
          {/* Calendar Navigation & Mode Switcher Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Month & Year Navigation with Fast Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{monthNames[currentMonth]} {currentYear}</span>
              </h3>

              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-bold text-xs hover:bg-sky-100 border border-sky-200/80 dark:border-sky-900/60 transition cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Filter Legend Indicators */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Holiday</span>
              <span className="flex items-center gap-1.5 text-sky-600"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Event</span>
              <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Exam</span>
              <span className="flex items-center gap-1.5 text-amber-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> PTM / Meeting</span>
              <span className="flex items-center gap-1.5 text-purple-600"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Circular</span>
              <span className="flex items-center gap-1.5 text-yellow-600"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Birthday</span>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCalendarViewMode('month')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  calendarViewMode === 'month' ? 'bg-white dark:bg-slate-950 text-sky-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('agenda')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  calendarViewMode === 'agenda' ? 'bg-white dark:bg-slate-950 text-sky-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Upcoming Schedules
              </button>
            </div>
          </div>

          {/* Category Filter Pills Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'All', label: 'All Schedules', icon: CalendarIcon },
              { id: 'Holiday', label: '🏛️ Govt & Public Holidays', icon: Landmark },
              { id: 'School Event', label: '🎉 School Events', icon: Award },
              { id: 'Examination', label: '📝 Exams & Assessments', icon: BookOpen },
              { id: 'Parent Teacher Meeting', label: '🤝 PTMs & Meetings', icon: Users },
              { id: 'Broadcast Circular', label: '📢 Broadcast Circulars', icon: Megaphone }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setEventTypeFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  eventTypeFilter === cat.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* MONTH VIEW GRID */}
          {calendarViewMode === 'month' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-400 dark:border-sky-500 shadow-sm overflow-hidden p-4 space-y-2">
              
              {/* Day Headers (Sun - Sat) */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
                <div className="py-2 text-rose-500 font-black">SUN</div>
                <div className="py-2">MON</div>
                <div className="py-2">TUE</div>
                <div className="py-2">WED</div>
                <div className="py-2">THU</div>
                <div className="py-2">FRI</div>
                <div className="py-2 text-sky-600 font-black">SAT</div>
              </div>

              {/* 42-Day Month Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarGridDays.map((cell, idx) => {
                  const isToday = cell.dateString === todayDateStr;
                  const isSunday = idx % 7 === 0;
                  const govtHolidayEvent = cell.events.find(e => e.type === 'Holiday');
                  const isGovtHoliday = Boolean(govtHolidayEvent);

                  return (
                    <div
                      key={idx}
                      className={`min-h-[115px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                        cell.isCurrentMonth
                          ? isToday
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/30'
                            : isGovtHoliday
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-400/40'
                            : isSunday
                            ? 'bg-rose-50/20 dark:bg-rose-950/10 border-slate-200/60 dark:border-slate-800'
                            : 'bg-slate-50/40 dark:bg-slate-850/40 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                          : 'bg-slate-100/20 dark:bg-slate-900/20 border-transparent opacity-35'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-black rounded-lg px-2 py-0.5 ${
                            isToday
                              ? 'bg-sky-600 text-white shadow-xs'
                              : isGovtHoliday
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : cell.isCurrentMonth
                              ? isSunday ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}>
                            {cell.dayNumber}
                          </span>
                          {isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-sky-600 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded-md">
                              Today
                            </span>
                          )}
                          {isGovtHoliday && !isToday && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Landmark className="w-2.5 h-2.5 shrink-0" /> Govt Holiday
                            </span>
                          )}
                        </div>

                        {cell.events.length > 0 && (
                          <span className="text-[9px] font-bold text-slate-400 font-mono">
                            {cell.events.length} {cell.events.length === 1 ? 'evt' : 'evts'}
                          </span>
                        )}
                      </div>

                      {/* Day Event Badges */}
                      <div className="space-y-1 overflow-y-auto max-h-[80px] pr-0.5 no-scrollbar">
                        {cell.events.map(evt => {
                          const isHol = evt.type === 'Holiday';
                          return (
                            <div
                              key={evt.id}
                              onClick={() => setSelectedEventForDetail(evt)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold truncate cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-1 ${
                                isHol
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-100 dark:border-emerald-700'
                                  : getBadgeStyle(evt.color)
                              }`}
                              title={`${evt.title} - ${evt.time || evt.category || ''}`}
                            >
                              {isHol && <Landmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 inline" />}
                              <span className="truncate">{evt.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* AGENDA LIST VIEW */}
          {calendarViewMode === 'agenda' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-sky-400 dark:border-sky-500 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <List className="w-4 h-4 text-sky-600" />
                  Academic Calendar Schedule ({filteredEvents.length} Events)
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs focus:ring-2 focus:ring-sky-500/20 outline-none h-[34px]"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={agendaDateFilter}
                      onChange={e => setAgendaDateFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer h-[34px]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredEvents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold">
                    No academic events or holidays matching the search filter.
                  </div>
                ) : (
                  paginatedAgendaEvents.map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventForDetail(evt)}
                      className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${getBadgeStyle(evt.color)} shrink-0`}>
                          {evt.type === 'Holiday' ? <Landmark className="w-4 h-4" /> : evt.type === 'Examination' ? <BookOpen className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{evt.title}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${getBadgeStyle(evt.color)}`}>
                              {evt.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {evt.description} {evt.venue && `• Venue: ${evt.venue}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                          {evt.date} {evt.endDate && evt.endDate !== evt.date && `to ${evt.endDate}`}
                        </span>
                        {evt.time && <span className="text-[10px] text-slate-400 font-medium">{evt.time}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 25 Entries Pagination Bar */}
              {filteredEvents.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <strong className="text-slate-800 dark:text-slate-200">{(agendaPage - 1) * agendaPageSize + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{Math.min(agendaPage * agendaPageSize, filteredEvents.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredEvents.length}</strong> entries
                  </span>

                  {totalAgendaPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={agendaPage === 1}
                        onClick={() => setAgendaPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Prev
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalAgendaPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setAgendaPage(page)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                              agendaPage === page
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={agendaPage === totalAgendaPages}
                        onClick={() => setAgendaPage(p => Math.min(totalAgendaPages, p + 1))}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOVERNMENT & SCHOOL HOLIDAYS (Master List) */}
      {/* ========================================================================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-5">
          
          {/* Summary KPI Cards for Holidays */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total Holidays</span>
              <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{holidayStats.total}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
              <span className="text-[9px] font-black uppercase text-emerald-600 block tracking-wider">National Holidays</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">{holidayStats.national}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
              <span className="text-[9px] font-black uppercase text-sky-600 block tracking-wider">Gazetted Holidays</span>
              <span className="text-xl font-black text-sky-600 mt-1 block">{holidayStats.gazetted}</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-2xl shadow-xs text-left">
              <span className="text-[9px] font-black uppercase text-amber-600 block tracking-wider">Festivals & Breaks</span>
              <span className="text-xl font-black text-amber-600 mt-1 block">{holidayStats.festival}</span>
            </div>
          </div>

          {/* Search & Filter Pills */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search holiday name or description..."
                value={holidaySearchQuery}
                onChange={e => setHolidaySearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-sky-500 transition h-[36px]"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              {/* Holiday Type Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="font-bold text-slate-500 text-[10px] uppercase whitespace-nowrap">Type:</span>
                <select
                  value={holidayTypeFilter}
                  onChange={e => setHolidayTypeFilter(e.target.value)}
                  className="w-full sm:w-40 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-sky-500 transition h-[36px] cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="National">National Holiday</option>
                  <option value="Gazetted">Gazetted Holiday</option>
                  <option value="Festival">Festival Holiday</option>
                  <option value="Vacation">School Vacation Break</option>
                  <option value="Optional">Optional / Restricted</option>
                </select>
              </div>

              {/* Target Audience Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="font-bold text-slate-500 text-[10px] uppercase whitespace-nowrap">For:</span>
                <select
                  value={holidayApplicableToFilter}
                  onChange={e => setHolidayApplicableToFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none focus:border-sky-500 transition h-[36px] cursor-pointer"
                >
                  <option value="AllTargets">All Targets</option>
                  <option value="All">All Students & Staff</option>
                  <option value="Students">Students (Enrolled)</option>
                  <option value="Teaching Staff">Teaching Staff</option>
                  <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE VIEW WITH 25-ENTRY PAGINATION */}
          <div className="rounded-3xl border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="px-4 py-3.5">Holiday Name</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Applicable To</th>
                    <th className="px-4 py-3.5">Start Date</th>
                    <th className="px-4 py-3.5">End Date</th>
                    <th className="px-4 py-3.5">Duration</th>
                    <th className="px-4 py-3.5">Description</th>
                    {canManageEvents && <th className="px-4 py-3.5 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-bold">
                        No holidays found matching the current search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedHolidays.map((h, idx) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{h.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${getHolidayTypeBadge(h.type)}`}>
                            {((h.type as string) === 'Restricted' || (h.type as string) === 'Optional') ? 'Optional' : h.type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wider border ${
                            h.applicableTo === 'Students'
                              ? 'text-sky-700 bg-sky-50 dark:bg-sky-950/20 border-sky-200/50'
                              : h.applicableTo === 'Teaching Staff'
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50'
                              : h.applicableTo === 'Non-Teaching Staff'
                              ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50'
                              : 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800'
                          }`}>
                            {h.applicableTo === 'All' || !h.applicableTo ? 'All Students & Staff' : h.applicableTo}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {h.startDate}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {h.endDate || h.startDate}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-sky-600">
                          {calculateDaysDuration(h.startDate, h.endDate)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 max-w-[240px] truncate">
                          {h.description || 'Government gazetted holiday'}
                        </td>
                        {canManageEvents && (
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditHolidayClick(h)}
                                className="p-1.5 rounded-xl text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition cursor-pointer"
                                title="Edit Holiday"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setHolidayToDelete(h)}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                title="Delete Holiday"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 25 Entries Holiday Pagination Controls */}
            {filteredHolidays.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-800 dark:text-slate-200">{(holidayPage - 1) * holidayPageSize + 1}</strong> - <strong className="text-slate-800 dark:text-slate-200">{Math.min(holidayPage * holidayPageSize, filteredHolidays.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredHolidays.length}</strong> entries
                </span>

                {totalHolidayPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={holidayPage === 1}
                      onClick={() => setHolidayPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalHolidayPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setHolidayPage(page)}
                          className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                            holidayPage === page
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={holidayPage === totalHolidayPages}
                      onClick={() => setHolidayPage(p => Math.min(totalHolidayPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHOOL EVENTS CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'school-events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold">
            {schoolEvents.map(evt => (
              <div key={evt.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 shadow-sm space-y-3.5 hover:border-sky-500 dark:hover:border-sky-400 transition">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {evt.category}
                  </span>
                  {canManageEvents && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditEventClick(evt)}
                        className="p-1.5 rounded-xl text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteSchoolEvent(evt.id);
                          addToast('info', 'Event Deleted', 'School event removed from schedule.');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{evt.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{evt.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800 font-medium">
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

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* EVENT DETAIL MODAL */}
      {selectedEventForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-left relative">
            <button
              type="button"
              onClick={() => setSelectedEventForDetail(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getBadgeStyle(selectedEventForDetail.color)}`}>
                {selectedEventForDetail.type}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {selectedEventForDetail.title}
              </h3>
              <p className="text-slate-500 mt-1 text-xs">{selectedEventForDetail.description}</p>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <div className="flex justify-between">
                <span>📅 <strong>Scheduled Date:</strong></span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedEventForDetail.date} {selectedEventForDetail.endDate && selectedEventForDetail.endDate !== selectedEventForDetail.date && `to ${selectedEventForDetail.endDate}`}
                </span>
              </div>
              {selectedEventForDetail.time && (
                <div className="flex justify-between">
                  <span>⏰ <strong>Timing:</strong></span>
                  <span>{selectedEventForDetail.time}</span>
                </div>
              )}
              {selectedEventForDetail.venue && (
                <div className="flex justify-between">
                  <span>📍 <strong>Venue:</strong></span>
                  <span>{selectedEventForDetail.venue}</span>
                </div>
              )}
              {selectedEventForDetail.organizer && (
                <div className="flex justify-between">
                  <span>👤 <strong>Organizer:</strong></span>
                  <span>{selectedEventForDetail.organizer}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>🏢 <strong>Branch:</strong></span>
                <span>{selectedEventForDetail.branch || 'Main Campus'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEventForDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SCHOOL EVENT MODAL */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 rounded-xl">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">{editingEvent ? 'Edit School Event' : 'Add School Event'}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEventModal}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Event Title <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Cultural Extravaganza 2026"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Event Category <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <select
                    value={eventForm.category}
                    onChange={e => setEventForm({ ...eventForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none"
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
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Venue <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium"
                    value={eventForm.venue}
                    onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Start Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    required
                    value={eventForm.startDate}
                    onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">End Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    required
                    value={eventForm.endDate}
                    onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Event Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter event agenda, rules, or instructions..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEventModal}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingEvent ? 'Save Changes' : 'Publish to Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE HOLIDAY MODAL */}
      {isAddHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">{editingHoliday ? 'Edit Official Holiday' : 'Add Official Holiday'}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseHolidayModal}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHolidaySubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Holiday Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={holidayForm.name}
                  onChange={e => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Holiday Type <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={holidayForm.type}
                  onChange={e => setHolidayForm({ ...holidayForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none"
                >
                  <option value="National">National Holiday</option>
                  <option value="Gazetted">Gazetted Holiday</option>
                  <option value="Festival">Festival Holiday</option>
                  <option value="Vacation">School Vacation Break</option>
                  <option value="Restricted">Optional</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Applicable To <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={holidayForm.applicableTo || 'All'}
                  onChange={e => setHolidayForm({ ...holidayForm, applicableTo: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none"
                >
                  <option value="All">All Students & Staff</option>
                  <option value="Students">Students (Enrolled)</option>
                  <option value="Teaching Staff">Teaching Staff</option>
                  <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Start Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    required
                    value={holidayForm.startDate}
                    onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">End Date <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="date"
                    required
                    value={holidayForm.endDate}
                    onChange={e => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Celebrations and official school closure"
                  value={holidayForm.description}
                  onChange={e => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseHolidayModal}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingHoliday ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {holidayToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Delete Holiday</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Are you sure you want to remove <strong>{holidayToDelete.name}</strong> from holidays?</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setHolidayToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteHoliday(holidayToDelete.id);
                  setHolidayToDelete(null);
                  addToast('info', 'Holiday Deleted', 'Holiday entry removed.');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION DISPATCH MODAL */}
      {isNotifyModalOpen && eventToNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sky-600 font-extrabold">
                <Bell className="w-4 h-4" />
                <span>Send Event Circular: {eventToNotify.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Dispatch Channels</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-sky-600" /> In-App Alert
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded accent-sky-600" /> Email Notice
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" className="rounded accent-sky-600" /> SMS Broadcast
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Recipients</label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold outline-none">
                  <option value="All">All Students, Staff & Parents</option>
                  <option value="Students">All Students</option>
                  <option value="Staff">All Faculty & Staff</option>
                  <option value="Parents">Parents Only</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNotifyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifyModalOpen(false);
                    addToast('success', 'Circular Dispatched', `Broadcast reminder sent for ${eventToNotify.title}.`);
                  }}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Broadcast Circular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEEKEND SETTINGS MODAL */}
      {isWeekendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-sky-400 dark:border-sky-500 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl">
                  <Settings2 className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Weekend Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWeekendModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-slate-500 font-medium">
                Select the days of the week to designate as default weekends (weekly offs) in the attendance register:
              </p>

              <div className="space-y-2 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 bg-slate-50/50 dark:bg-slate-950/20">
                {[
                  { label: "Sunday", val: 0 },
                  { label: "Monday", val: 1 },
                  { label: "Tuesday", val: 2 },
                  { label: "Wednesday", val: 3 },
                  { label: "Thursday", val: 4 },
                  { label: "Friday", val: 5 },
                  { label: "Saturday", val: 6 },
                ].map((d) => {
                  const isChecked = weekendDays.includes(d.val);
                  return (
                    <label
                      key={d.val}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setWeekendDays(weekendDays.filter((x) => x !== d.val));
                          } else {
                            setWeekendDays([...weekendDays, d.val]);
                          }
                        }}
                        className="w-4 h-4 text-sky-600 border-slate-300 dark:border-slate-700 rounded focus:ring-sky-500 cursor-pointer"
                      />
                      <span>{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsWeekendModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWeekendSettings}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EventsView;
