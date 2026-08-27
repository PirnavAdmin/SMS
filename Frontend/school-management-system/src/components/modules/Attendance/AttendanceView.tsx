import React, { useState, useEffect } from 'react';
import {
  Check, X, AlertCircle, Save, FileSpreadsheet,
  Search, Filter, ChevronDown, Clock, CalendarCheck, User, Plus, Edit2, FileText, Loader2
} from 'lucide-react';
 
// Types
type AttendanceStatus = 'Present' | 'Absent' | 'HalfDay' | 'Late' | null;
 
interface Student {
  id: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  className: string;
  section: string;
  admissionNo: string;
}
 
interface AttendanceState {
  [studentId: string]: AttendanceStatus;
}
 
interface RemarksState {
  [key: string]: string;
}
 
const mockStudents: Student[] = Array.from({ length: 65 }, (_, i) => ({
  id: `${i + 1}`,
  rollNo: `20${(i + 1).toString().padStart(2, '0')}`,
  firstName: ['shiva', 'Rahul', 'Alexander', 'Gokul', 'venkat', 'Aisha', 'Rohan', 'Sneha', 'Liam', 'Emma'][i % 10],
  lastName: ['sai', 'Sharma', 'Wright', 'Raj', 'javvadi', 'Khan', 'Verma', 'Patel', 'Smith', 'Johnson'][i % 10],
  className: `Class ${(i % 3) + 1}`,
  section: ['A', 'B', 'C'][i % 3],
  admissionNo: `ADM${(i + 1).toString().padStart(3, '0')}`,
  avatar: `https://i.pravatar.cc/150?u=${i + 1}`
}));
 
const mockTeacher = {
  id: 'T001',
  firstName: 'Jonathan',
  lastName: 'Miller',
  assignedClasses: [{ class: 'Class 1', section: 'A' }, { class: 'Class 2', section: 'B' }],
  assignedSubjects: ['Mathematics', 'Science']
};
 
const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const monthVal = String(d.getMonth() + 1).padStart(2, '0');
  const dayVal = String(d.getDate()).padStart(2, '0');
  return `${year}-${monthVal}-${dayVal}`;
};
 
export const AttendanceView = () => {
  // Global View State
  const [dateMode, setDateMode] = useState<'Daily' | 'Monthly' | 'Custom Range'>('Daily');
  const [date, setDate] = useState<string>(getLocalDateString(new Date()));
  const [month, setMonth] = useState<string>(getLocalDateString(new Date()).slice(0, 7));
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => getLocalDateString(new Date()));
 
  const [teacher] = useState(mockTeacher);
  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
 
  // Context Selection State
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedSubject, setSelectedSubject] = useState(teacher.assignedSubjects?.[0] || 'Mathematics');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 AM - 09:45 AM)');
 
  const [filterStatus, setFilterStatus] = useState<'All' | AttendanceStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
 
  const isAggregatedView = selectedClass === 'All Classes' || selectedSection === 'All Sections';
  const [isEditable, setIsEditable] = useState(false);
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
 
  useEffect(() => {
    if (isAggregatedView && isEditable) {
      setIsEditable(false);
    }
  }, [isAggregatedView, isEditable]);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSection, filterStatus, dateMode, date, month, startDate, endDate]);
 
  const [remarkModalStudent, setRemarkModalStudent] = useState<Student | null>(null);
  const [tempRemark, setTempRemark] = useState('');
 
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
 
  // Persistent LocalStorage Remarks registry
  const [remarksState, setRemarksState] = useState<RemarksState>(() => {
    const saved = localStorage.getItem('sms_attendance_remarks');
    return saved ? JSON.parse(saved) : {};
  });
 
  // Persistent LocalStorage Attendance registry
  const [attendanceRegistry, setAttendanceRegistry] = useState<Record<string, AttendanceState>>(() => {
    const saved = localStorage.getItem('sms_attendance_registry');
    return saved ? JSON.parse(saved) : {};
  });
 
  const classStudents = React.useMemo(() => {
    return mockStudents.filter(s => {
      const classMatch = selectedClass === 'All Classes' || s.className === selectedClass;
      const sectionMatch = selectedSection === 'All Sections' || s.section === selectedSection;
      return classMatch && sectionMatch;
    });
  }, [selectedClass, selectedSection]);
 
  // Unique key for the current register
  const registerKey = `${selectedClass === 'All Classes' ? 'All' : selectedClass}_${selectedSection === 'All Sections' ? 'All' : selectedSection}_${selectedSubject}_${date}`;
 
  const currentAttendance: AttendanceState = attendanceRegistry[registerKey] || {};
 
  // Status computation for UI rendering (Daily View)
  const getAttendanceStatus = (student: Student): AttendanceStatus => {
    if (selectedClass === 'All Classes' || selectedSection === 'All Sections') {
      const specificKey = `${student.className}_${student.section}_${selectedSubject}_${date}`;
      return attendanceRegistry[specificKey]?.[student.id] || null;
    }
    return currentAttendance[student.id] || null;
  };
 
  // Generate date array for Matrix View
  const matrixDates = React.useMemo(() => {
    if (dateMode === 'Daily') return [];
   
    let start = new Date();
    let end = new Date();
   
    if (dateMode === 'Monthly') {
      const [year, m] = month.split('-');
      start = new Date(parseInt(year), parseInt(m) - 1, 1);
      end = new Date(parseInt(year), parseInt(m), 0);
    } else {
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        start = new Date(y, m - 1, d);
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        end = new Date(y, m - 1, d);
      }
    }
   
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
   
    const dates: string[] = [];
    let current = new Date(start);
    while (current <= end && dates.length < 31) { // Cap at 31 days
      dates.push(getLocalDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [dateMode, month, startDate, endDate]);
 
  const getMatrixStatus = (student: Student, dateStr: string): AttendanceStatus => {
    const specificKey = `${student.className}_${student.section}_${selectedSubject}_${dateStr}`;
    return attendanceRegistry[specificKey]?.[student.id] || null;
  };
 
  const filteredStudents = React.useMemo(() => {
    let result = classStudents;
    if (filterStatus !== 'All') {
      result = result.filter(st => getAttendanceStatus(st) === filterStatus);
    }
    return [...result].sort((a, b) => {
      if (a.className !== b.className) return a.className.localeCompare(b.className);
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.firstName.localeCompare(b.firstName);
    });
  }, [classStudents, currentAttendance, filterStatus]);
 
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);
 
  // Single mark handler
  const handleSingleMark = (studentId: string, status: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendanceRegistry(prev => {
      const updatedRegister = { ...(prev[registerKey] || {}) };
     
      if (updatedRegister[studentId] === status) {
        delete updatedRegister[studentId]; // Toggle off
      } else {
        updatedRegister[studentId] = status;
      }
     
      return { ...prev, [registerKey]: updatedRegister };
    });
  };
 
  // Matrix cell click toggle handler
  const handleMatrixCellClick = (student: Student, dateStr: string) => {
    if (!isEditable) return;
    const currentStatus = getMatrixStatus(student, dateStr);
   
    // Cycle: null -> 'Present' -> 'HalfDay' -> 'Late' -> 'Absent' -> null
    let nextStatus: AttendanceStatus = null;
    if (currentStatus === null) nextStatus = 'Present';
    else if (currentStatus === 'Present') nextStatus = 'HalfDay';
    else if (currentStatus === 'HalfDay') nextStatus = 'Late';
    else if (currentStatus === 'Late') nextStatus = 'Absent';
    else if (currentStatus === 'Absent') nextStatus = null;
   
    const specificKey = `${student.className}_${student.section}_${selectedSubject}_${dateStr}`;
    setAttendanceRegistry(prev => {
      const updatedRegister = { ...(prev[specificKey] || {}) };
      if (nextStatus === null) {
        delete updatedRegister[student.id];
      } else {
        updatedRegister[student.id] = nextStatus;
      }
      return { ...prev, [specificKey]: updatedRegister };
    });
  };
 
  // Mark entire class
  const markAllClass = (status: AttendanceStatus) => {
    if (!isEditable) return;
    setAttendanceRegistry(prev => {
      const updatedRegister = { ...(prev[registerKey] || {}) };
      classStudents.forEach(st => {
        updatedRegister[st.id] = status;
      });
      return { ...prev, [registerKey]: updatedRegister };
    });
  };
 
  const handleRemarkChange = (studentId: string, remark: string) => {
    if (!isEditable) return;
    setRemarksState(prev => ({
      ...prev,
      [`${date}_${studentId}`]: remark
    }));
  };
 
  // Auto-save mechanisms
  useEffect(() => {
    localStorage.setItem('sms_attendance_registry', JSON.stringify(attendanceRegistry));
  }, [attendanceRegistry]);
 
  useEffect(() => {
    localStorage.setItem('sms_attendance_remarks', JSON.stringify(remarksState));
  }, [remarksState]);
 
  // Metrics calculation
  const summaryMetrics = React.useMemo(() => {
    let present = 0, absent = 0, halfDay = 0, late = 0;
    filteredStudents.forEach(s => {
      const status = getAttendanceStatus(s);
      if (status === 'Present') present++;
      if (status === 'Absent') absent++;
      if (status === 'HalfDay') halfDay++;
      if (status === 'Late') late++;
    });
    const markedCount = present + absent + halfDay + late;
    const percentage = filteredStudents.length ? Math.round(((present + late + (halfDay * 0.5)) / filteredStudents.length) * 100) : 0;
   
    return {
      total: filteredStudents.length,
      marked: markedCount,
      present, absent, halfDay, late,
      percentage
    };
  }, [classStudents, currentAttendance]);
 
 
  const [toasts, setToasts] = useState<Array<{id: number, type: 'success' | 'warning' | 'info', title: string, message: string}>>([]);
  const addToast = (type: 'success' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
 
  const handleSaveAttendance = () => {
    setIsEditable(false);
    addToast('success', 'Attendance Register Saved', 'The registers have been written and submitted to the school portal database.');
  };
 
  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      addToast('warning', 'Download Blocked', 'Roster list is empty.');
      return;
    }setIsDownloading(true);
   
    setTimeout(() => {
      let csvContent = "data:text/csv;charset=utf-8,";
     
      if (dateMode === 'Daily') {
        csvContent += "Roll No,Student Name,Class,Section,Status,Remarks\n";
        filteredStudents.forEach(s => {
          const status = getAttendanceStatus(s) || 'Unmarked';
          const remark = remarksState[`${date}_${s.id}`] || "";
          csvContent += `${s.rollNo},"${s.firstName} ${s.lastName}",${s.className},${s.section},${status},"${remark.replace(/"/g, '""')}"\n`;
        });
      } else {
        const dateHeaders = matrixDates.map(d => d.split('-').slice(1).join('/')).join(",");
        csvContent += `Roll No,Student Name,Class,Section,${dateHeaders},Present (P),Half Day (HD),Late (L),Absent (A),Attendance %\n`;
       
        filteredStudents.forEach(s => {
          let pCount = 0;
          let aCount = 0;
          let hdCount = 0;
          let lCount = 0;
         
          const dateCells = matrixDates.map(d => {
            const status = getMatrixStatus(s, d);
            if (status === 'Present') { pCount++; return 'P'; }
            if (status === 'Absent') { aCount++; return 'A'; }
            if (status === 'HalfDay') { hdCount++; return 'HD'; }
            if (status === 'Late') { lCount++; return 'L'; }
            return '-';
          }).join(",");
         
          const pct = matrixDates.length > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / matrixDates.length) * 100) : 0;
          csvContent += `${s.rollNo},"${s.firstName} ${s.lastName}",${s.className},${s.section},${dateCells},${pCount},${hdCount},${lCount},${aCount},${pct}%\n`;
        });
      }
     
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
     
      const filename = dateMode === 'Daily'
        ? `Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_${date}.csv`
        : `Attendance_${selectedClass.replace(/\s+/g, '_')}_${selectedSection.replace(/\s+/g, '_')}_${dateMode === 'Monthly' ? month : `${startDate}_to_${endDate}`}.csv`;
       
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
      addToast('success', 'Download Complete', 'Attendance data has been downloaded.');
    }, 800);
  };
 
  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
     
      {/* Header Cockpit Card - Vertically Compact */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            Student Attendance
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
            <span>🏫 Class: <strong className="text-slate-855 dark:text-slate-200">
              {selectedClass === 'All Classes' ? 'All Classes' : `${selectedClass}-${selectedSection}`}
            </strong></span>
            {selectedClass !== 'All Classes' && selectedSection !== 'All Sections' && (
              <span>👤 Class Teacher: <strong className="text-slate-855 dark:text-slate-200">{teacherFullName}</strong></span>
            )}
          </div>
        </div>
 
        <button
          disabled={isAggregatedView}
          onClick={() => {
            if (isAggregatedView) return;
            setIsEditable(!isEditable);
            if (!isEditable) addToast('info', 'Edit Mode Active', 'You can now change records for the selected date. Hover or check the banner below for instructions.');
          }}
          className={`font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 rounded-full ${
            isAggregatedView
              ? 'px-3 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : isEditable
                ? 'px-4 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300 ring-2 ring-amber-450/30'
                : 'px-2 py-0.5 bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {isAggregatedView ? '🚫 Read Only' : isEditable ? '✏️ Edit Mode Active' : '🔒 Edit'}
        </button>
      </div>
 
      {/* Control Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${dateMode === 'Custom Range' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Date Mode</label>
            <select
              value={dateMode}
              onChange={e => setDateMode(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Month-wise</option>
              <option value="Custom Range">Custom Range</option>
            </select>
          </div>
 
          <div className={`space-y-1 ${dateMode === 'Custom Range' ? 'lg:col-span-2' : ''}`}>
            <label className="text-[10px] font-black uppercase text-slate-400">Date Selection</label>
            {dateMode === 'Daily' && (
              <input type="date" value={date} onChange={e => setDate(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors" />
            )}
            {dateMode === 'Monthly' && (
              <input type="month" value={month} onChange={e => setMonth(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors" />
            )}
            {dateMode === 'Custom Range' && (
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors" />
                <span className="text-slate-400 font-bold">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} onClick={e => e.currentTarget.showPicker?.()} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors" />
              </div>
            )}
          </div>
 
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="All Classes">All Classes</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
            </select>
          </div>
 
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="All Sections">All Sections</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
 
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
            <select
              value={filterStatus || 'All'}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="HalfDay">Half Day</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>
      </div>
 
      {/* Horizontal Summary Strip */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-8 lg:gap-16 pl-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
            <span className="text-lg font-black text-slate-855 dark:text-white">{summaryMetrics.total}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Present</span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-455">{summaryMetrics.present}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold uppercase">Absent</span>
            <span className="text-lg font-black text-rose-700 dark:text-rose-455">{summaryMetrics.absent}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Half Day</span>
            <span className="text-lg font-black text-blue-700 dark:text-blue-455">{summaryMetrics.halfDay}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Late</span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-455">{summaryMetrics.late}</span>
          </div>
        </div>
 
        <div className="flex items-center gap-3 pl-4 lg:border-l border-slate-200 dark:border-slate-800">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Attendance Rate</p>
            <p className="text-xl font-black text-brand-600 dark:text-brand-400">{summaryMetrics.percentage}%</p>
          </div>
        </div>
      </div>
 
      {/* Attendance marking sheet table (Full Screen Width) */}
      <div className="w-full space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
           
            {/* Sheet Actions Header */}
            <div className="flex flex-col gap-3 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
                  Attendance ({classStudents.length} Students)
                </span>
 
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markAllClass('Present')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-350 font-bold transition-colors"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={handleExportCSV}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-955/40 dark:text-sky-350 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-sky-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition-colors py-1.5 px-4 flex items-center gap-1.5 text-[10.5px] font-black"
                  >
                    <Save className="w-4 h-4" /> Save Attendance
                  </button>
                </div>
              </div>
 
              {isAggregatedView ? (
                <div className="p-3 rounded-2xl border text-[11px] font-semibold flex items-start sm:items-center gap-2.5 transition-all bg-indigo-50/50 dark:bg-indigo-955/10 border-indigo-200/50 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    <strong className="font-extrabold text-indigo-900 dark:text-indigo-200">Read-Only View:</strong> Marking attendance is disabled because you are viewing multiple classes/sections. To enable marking, please select a specific <strong>Class</strong> and <strong>Section</strong>.
                  </span>
                </div>
              ) : (
                <div className={`p-3 rounded-2xl border text-[11px] font-semibold flex items-start sm:items-center gap-2.5 transition-all ${
                  isEditable
                    ? 'bg-amber-50/50 dark:bg-amber-955/15 border-amber-250/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-750/50 text-slate-650 dark:text-slate-400'
                }`}>
                  {isEditable ? (
                    <>
                      <Edit2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                      <span>
                        <strong className="font-extrabold text-amber-900 dark:text-amber-200">
                          {dateMode === 'Daily' ? 'Edit Mode Enabled:' : 'Monthly Edit Mode Enabled:'}
                        </strong>{' '}
                        {dateMode === 'Daily' ? (
                          <>
                            Click on{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold text-[9px] uppercase">Present</span>,{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase">Absent</span>,{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-400 text-amber-955 font-bold text-[9px] uppercase">Half Day</span>, or{' '}
                            <span className="mx-1 px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] uppercase">Late</span>{' '}
                            to update any student's record. Click <strong>Save Attendance</strong> at the top right when you are finished.
                          </>
                        ) : (
                          <>
                            Click directly on any cell in the grid to cycle through student attendance statuses (<strong>P</strong> → <strong>HD</strong> → <strong>L</strong> → <strong>A</strong> → <strong>-</strong>). Click <strong>Save Attendance</strong> at the top right when you are finished.
                          </>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5 sm:mt-0" />
                      <span>
                        <strong className="font-extrabold text-slate-700 dark:text-slate-350">Read-Only Mode:</strong> Records are locked to prevent accidental modifications. Click the
                        <span className="mx-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[9px] uppercase">🔒 Edit</span>
                        button in the top header if you need to modify attendance entries.
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
 
            {/* Table View Toggle */}
            {dateMode === 'Daily' ? (
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 w-24">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                      <th className="py-3 px-4">Remarks (Optional)</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 italic">No students found matching your filters.</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((st, idx) => {
                        const status = getAttendanceStatus(st);
                        return (
                          <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-850 dark:text-slate-200 border-b border-slate-100/50 dark:border-slate-800/50 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                            <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{st.rollNo}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                {st.avatar ? (
                                  <img src={st.avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white block">{st.firstName} {st.lastName}</span>
                                  {selectedClass === 'All Classes' && (
                                    <span className="text-[10px] text-slate-400 font-bold block">{st.className}-{st.section}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {(['Present', 'Absent', 'HalfDay', 'Late'] as const).map(stType => {
                                  const isSelected = status === stType;
                                  let activeStyle = '';
                                  if (stType === 'Present') activeStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-inner';
                                  else if (stType === 'Absent') activeStyle = 'bg-rose-600 text-white border-rose-700 shadow-inner';
                                  else if (stType === 'HalfDay' || stType === 'Late') activeStyle = 'bg-amber-400 text-amber-950 border-amber-500 shadow-inner';
                                 
                                  return (
                                    <button
                                      key={stType}
                                      disabled={!isEditable}
                                      onClick={() => handleSingleMark(st.id, stType)}
                                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                        isSelected
                                          ? activeStyle
                                          : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                      } ${!isEditable && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                      {stType === 'HalfDay' ? 'Half Day' : stType}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {remarksState[`${date}_${st.id}`] ? (
                                <div className="flex items-start justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900 max-w-[200px]">
                                  <div className="flex-1 min-w-0">
                                    <span
                                      onClick={() => {
                                        if (remarksState[`${date}_${st.id}`].length > 15) {
                                          setExpandedRemarks(prev => ({ ...prev, [st.id]: !prev[st.id] }));
                                        }
                                      }}
                                      className={`text-[10px] text-amber-700 dark:text-amber-400 font-bold block ${
                                        expandedRemarks[st.id] ? 'whitespace-normal break-words' : 'truncate cursor-pointer'
                                      }`}
                                      title={remarksState[`${date}_${st.id}`].length > 15 && !expandedRemarks[st.id] ? "Click to expand remark" : ""}
                                    >
                                      {remarksState[`${date}_${st.id}`]}
                                    </span>
                                    {remarksState[`${date}_${st.id}`].length > 15 && (
                                      <button
                                        onClick={() => setExpandedRemarks(prev => ({ ...prev, [st.id]: !prev[st.id] }))}
                                        className="text-[9px] text-amber-600 dark:text-amber-500 underline font-black mt-0.5 focus:outline-none block"
                                      >
                                        {expandedRemarks[st.id] ? "Show Less" : "Show More"}
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setRemarkModalStudent(st);
                                      setTempRemark(remarksState[`${date}_${st.id}`] || '');
                                    }}
                                    disabled={!isEditable}
                                    className="text-amber-600 hover:text-amber-800 disabled:opacity-50 mt-0.5 shrink-0"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRemarkModalStudent(st);
                                    setTempRemark('');
                                  }}
                                  disabled={!isEditable}
                                  className="w-full text-left px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800/80 text-slate-400 font-bold text-[10px] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <Plus className="w-3 h-3" /> Add Remark
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden mt-2">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-3 min-w-[150px] sticky left-0 bg-slate-50 dark:bg-slate-800/90 z-10 shadow-sm border-r border-slate-200 dark:border-slate-700">Student Name</th>
                        {matrixDates.map(d => {
                          const dayNum = parseInt(d.split('-')[2], 10);
                          return <th key={d} className="py-3 px-1 text-center min-w-[28px] font-mono" title={d}>{dayNum}</th>;
                        })}
                        <th className="py-3 px-2 text-center text-emerald-600">P</th>
                        <th className="py-3 px-2 text-center text-blue-600">HD</th>
                        <th className="py-3 px-2 text-center text-amber-600">L</th>
                        <th className="py-3 px-2 text-center text-rose-600">A</th>
                        <th className="py-3 px-2 text-center text-sky-600">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={matrixDates.length + 4} className="py-12 text-center text-slate-400 italic">No students found matching your filters.</td>
                        </tr>
                      ) : (
                        paginatedStudents.map((st, idx) => {
                          let pCount = 0;
                          let aCount = 0;
                          let hdCount = 0;
                          let lCount = 0;
                         
                          return (
                            <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-855 dark:text-slate-200 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                              <td className={`py-2 px-3 whitespace-nowrap sticky left-0 z-10 border-r border-slate-200 dark:border-slate-700 shadow-sm ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                <span className="font-extrabold text-slate-900 dark:text-white block">{st.firstName} {st.lastName}</span>
                                <span className="text-[9px] font-mono text-slate-400">{st.rollNo} • {st.className}-{st.section}</span>
                              </td>
                              {matrixDates.map(d => {
                                const status = getMatrixStatus(st, d);
                                let code = '-';
                                let badgeStyle = 'text-slate-400';
                               
                                if (status === 'Present') { code = 'P'; pCount++; badgeStyle = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold'; }
                                else if (status === 'Absent') { code = 'A'; aCount++; badgeStyle = 'text-rose-700 bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 font-black'; }
                                else if (status === 'HalfDay') { code = 'HD'; hdCount++; badgeStyle = 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 font-bold'; }
                                else if (status === 'Late') { code = 'L'; lCount++; badgeStyle = 'text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 font-bold'; }
                               
                                return (
                                  <td key={d} className="py-2 px-0.5 text-center font-mono font-bold text-[10px]">
                                    {isEditable ? (
                                      <button
                                        onClick={() => handleMatrixCellClick(st, d)}
                                        className={`inline-block w-6 py-0.5 rounded transition-all hover:scale-110 active:scale-95 shadow-xs border border-dashed ${
                                          code !== '-'
                                            ? `${badgeStyle} border-transparent`
                                            : 'text-slate-400 bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-slate-450 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                        title="Click to cycle status"
                                      >
                                        {code}
                                      </button>
                                    ) : (
                                      code !== '-' ? (
                                        <span className={`inline-block w-6 py-0.5 rounded ${badgeStyle}`}>{code}</span>
                                      ) : (
                                        <span className={badgeStyle}>{code}</span>
                                      )
                                    )}
                                  </td>
                                );
                              })}
                              <td className="py-2 px-2 text-center font-bold text-emerald-600">{pCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-blue-600">{hdCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-amber-600">{lCount}</td>
                              <td className="py-2 px-2 text-center font-bold text-rose-600">{aCount}</td>
                              <td className="py-2 px-2 text-center font-extrabold text-sky-600 bg-sky-50/30 dark:bg-sky-900/10">
                                {matrixDates.length > 0 ? Math.round(((pCount + lCount + (hdCount * 0.5)) / matrixDates.length) * 100) : 0}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <p className="text-xs text-slate-500 font-bold font-mono">Showing {paginatedStudents.length} of {filteredStudents.length} records</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <span>Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-brand-500 transition-colors"
                    >
                      <option value={10}>10 students</option>
                      <option value={25}>25 students</option>
                      <option value={50}>50 students</option>
                      <option value={100}>100 students</option>
                    </select>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
 
      {/* ----------------- MODAL: Student Profile Detailed Viewer ----------------- */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 my-auto text-slate-800 dark:text-slate-205">
           
            {/* Header profile details */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {profileStudent.avatar ? (
                  <img src={profileStudent.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-650">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{profileStudent.firstName} {profileStudent.lastName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Admission Code: {profileStudent.admissionNo} &bull; Class {profileStudent.className}-{profileStudent.section}</p>
                </div>
              </div>
              <button onClick={() => setProfileStudent(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold">✕</button>
            </div>
 
            {/* Simple Inner modal close view */}
            <div className="p-12 text-center space-y-4">
              <p className="font-extrabold text-sm text-slate-855 dark:text-white">Viewing {profileStudent.firstName}'s full record profile inside Attendance Module.</p>
              <p className="text-slate-450 max-w-md mx-auto">To perform modifications, behaviour logging, or guardian communications, please open the dedicated Student Management module dashboard panel.</p>
              <button
                onClick={() => setProfileStudent(null)}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* ----------------- MODAL: Add/Edit Remark ----------------- */}
      {remarkModalStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Add Remark
              </h3>
              <button onClick={() => setRemarkModalStudent(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
           
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
              Adding attendance remark for <strong className="text-slate-800 dark:text-slate-200">{remarkModalStudent.firstName} {remarkModalStudent.lastName}</strong>
            </p>
 
            <textarea
              value={tempRemark}
              onChange={e => setTempRemark(e.target.value)}
              placeholder="E.g., Doctor's appointment, delayed school bus, sick leave..."
              className="w-full h-32 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-brand-500 text-sm font-medium resize-none"
              autoFocus
            />
 
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRemarkModalStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRemarkChange(remarkModalStudent.id, tempRemark);
                  setRemarkModalStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black shadow-lg shadow-brand-500/20 transition-colors text-sm"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-xl flex items-start gap-3 w-80 animate-in slide-in-from-right-8">
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'}`}>
              {toast.type === 'success' ? <Check className="w-4 h-4" /> : toast.type === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-bold text-sm">{toast.title}</p>
              <p className="text-slate-300 dark:text-slate-600 text-[11px] leading-snug mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
 
 