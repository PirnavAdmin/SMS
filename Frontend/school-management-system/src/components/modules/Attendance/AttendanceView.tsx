import React, { useState, useEffect } from 'react';
import { 
  Check, X, AlertCircle, Save, FileSpreadsheet, 
  Search, Filter, ChevronDown, Clock, CalendarCheck, User, Plus, Edit2, FileText
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

const mockStudents: Student[] = [
  { id: '1', rollNo: '2067', firstName: 'shiva', lastName: 'sai', className: 'Class 1', section: 'A', admissionNo: 'ADM001', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', rollNo: '2029', firstName: 'Rahul', lastName: 'Sharma', className: 'Class 1', section: 'A', admissionNo: 'ADM002', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', rollNo: '2041', firstName: 'Alexander', lastName: 'Wright', className: 'Class 1', section: 'A', admissionNo: 'ADM003', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: '4', rollNo: '2085', firstName: 'Gokul', lastName: 'Raj', className: 'Class 1', section: 'A', admissionNo: 'ADM004', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: '5', rollNo: '2098', firstName: 'javvadi', lastName: 'venkat', className: 'Class 1', section: 'A', admissionNo: 'ADM005', avatar: 'https://i.pravatar.cc/150?u=5' }
];

const mockTeacher = {
  id: 'T001',
  firstName: 'Jonathan',
  lastName: 'Miller',
  assignedClasses: [{ class: 'Class 1', section: 'A' }, { class: 'Class 2', section: 'B' }],
  assignedSubjects: ['Mathematics', 'Science']
};

export const AttendanceView = () => {
  // Global View State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [teacher] = useState(mockTeacher);
  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
  
  // Context Selection State
  const [selectedClass, setSelectedClass] = useState(teacher.assignedClasses?.[0]?.class || 'Class 1');
  const [selectedSection, setSelectedSection] = useState(teacher.assignedClasses?.[0]?.section || 'A');
  const [selectedSubject, setSelectedSubject] = useState(teacher.assignedSubjects?.[0] || 'Mathematics');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 AM - 09:45 AM)');
  
  const [isEditable, setIsEditable] = useState(false);
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
  
  const classStudents = mockStudents.filter(s => s.className === selectedClass && s.section === selectedSection);
  
  // Unique key for the current register
  const registerKey = `${selectedClass}_${selectedSection}_${selectedSubject}_${date}`;
  
  const currentAttendance: AttendanceState = attendanceRegistry[registerKey] || {};

  // Status computation for UI rendering
  const getAttendanceStatus = (studentId: string): AttendanceStatus => currentAttendance[studentId] || null;

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
    classStudents.forEach(s => {
      const status = currentAttendance[s.id];
      if (status === 'Present') present++;
      if (status === 'Absent') absent++;
      if (status === 'HalfDay') halfDay++;
      if (status === 'Late') late++;
    });
    const markedCount = present + absent + halfDay + late;
    const percentage = classStudents.length ? Math.round(((present + late + (halfDay * 0.5)) / classStudents.length) * 100) : 0;
    
    return {
      total: classStudents.length,
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
    if (classStudents.length === 0) {
      addToast('warning', 'Export Blocked', 'Roster list is empty.');
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll No,Student Name,Status,Remarks\n";
    classStudents.forEach(s => {
      const status = getAttendanceStatus(s.id);
      const remark = remarksState[`${date}_${s.id}`] || "";
      csvContent += `${s.rollNo},"${s.firstName} ${s.lastName}",${status},"${remark.replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${selectedClass}_${selectedSection}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Attendance roster has been downloaded.');
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
            <span>🏫 Class: <strong className="text-slate-855 dark:text-slate-200">{selectedClass}-{selectedSection}</strong></span>
            <span>📖 Subject: <strong className="text-slate-855 dark:text-slate-200">{selectedSubject}</strong></span>
            <span>⏰ Period: <strong className="text-slate-855 dark:text-slate-200">{selectedPeriod.split(' ')[0]}</strong></span>
            <span>👤 Class Teacher: <strong className="text-slate-855 dark:text-slate-200">{teacherFullName}</strong></span>
          </div>
        </div>

        <button 
          onClick={() => {
            setIsEditable(!isEditable);
            if (!isEditable) addToast('info', 'Edit Mode Active', 'You can now change records for the selected date.');
          }}
          className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer hover:opacity-80 ${
          isEditable 
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300' 
            : 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-300'
        }`}>
          {isEditable ? '✏️ Edit Mode Active' : '🔒 Locked / Click to Edit'}
        </button>
      </div>

      {/* Control Filters Row */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
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
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              {teacher.assignedSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Period Block</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition-colors"
            >
              <option value="Period 1 (09:00 AM - 09:45 AM)">Period 1 (09:00 AM)</option>
              <option value="Period 2 (09:45 AM - 10:30 AM)">Period 2 (09:45 AM)</option>
              <option value="Period 3 (10:45 AM - 11:30 AM)">Period 3 (10:45 AM)</option>
              <option value="Period 4 (11:30 AM - 12:15 PM)">Period 4 (11:30 AM)</option>
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
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <span className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
                Attendance Sheet ({classStudents.length} Students)
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
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-350 font-bold transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition-colors py-1.5 px-4 flex items-center gap-1.5 text-[10.5px] font-black"
                >
                  <Save className="w-4 h-4" /> Save Attendance
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="rounded-2xl overflow-x-scroll">
              <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-4 w-20">Roll No</th>
                    <th className="py-3 px-4 w-48">Student Name</th>
                    <th className="py-3 px-4 text-center w-72">Attendance Status</th>
                    <th className="py-3 px-4 w-64">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">No students found in Class {selectedClass}-{selectedSection}.</td>
                    </tr>
                  ) : (
                    classStudents.map((st, idx) => {
                      const status = getAttendanceStatus(st.id);
                      return (
                        <tr key={st.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 text-slate-850 dark:text-slate-200 border-b border-slate-100/50 dark:border-slate-800/50 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                          <td className="py-3 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{st.rollNo}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {st.avatar ? (
                                <img src={st.avatar} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                  <User className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <span className="font-extrabold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSingleMark(st.id, 'Present')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all border whitespace-nowrap ${
                                  status === 'Present'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-600/70 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'Absent')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all border whitespace-nowrap ${
                                  status === 'Absent'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-rose-50/30 dark:bg-rose-950/20 text-rose-600/70 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'HalfDay')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all border whitespace-nowrap ${
                                  status === 'HalfDay'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-blue-50/30 dark:bg-blue-950/20 text-blue-600/70 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                }`}
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'Late')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all border whitespace-nowrap ${
                                  status === 'Late'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                    : 'bg-amber-50/30 dark:bg-amber-950/20 text-amber-600/70 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {remarksState[`${date}_${st.id}`] ? (
                              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold truncate max-w-[120px]">{remarksState[`${date}_${st.id}`]}</span>
                                <button
                                  onClick={() => {
                                    setRemarkModalStudent(st);
                                    setTempRemark(remarksState[`${date}_${st.id}`] || '');
                                  }}
                                  disabled={!isEditable}
                                  className="text-amber-600 hover:text-amber-800 disabled:opacity-50"
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
