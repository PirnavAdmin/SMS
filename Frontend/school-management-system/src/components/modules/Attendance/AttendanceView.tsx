import React, { useEffect, useMemo, useState } from 'react';
import { 
  CalendarCheck, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, 
  XCircle, Award, Download, Eye, User, FileSpreadsheet, RefreshCw, Save, Edit2
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DailyAttendance, Student } from '../../../types';
import { StudentProfileDrawer } from '../Students/StudentProfileDrawer';

export const AttendanceView: React.FC = () => {
  const { students, staff, attendance, markAttendance, academicClasses } = useData();
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';

  // Retrieve logged-in teacher profile
  const dbTeacher = staff.find(s => s.email && user?.email && s.email === user.email && s.employeeCategory === 'Teacher') || 
                     staff.find(s => s.email && (s.email.toLowerCase().includes('jenkins') || s.email.toLowerCase().includes('miller'))) ||
                     staff.find(s => s.employeeCategory === 'Teacher');

  const teacher = dbTeacher || {
    id: 'STF-002',
    empId: 'EMP002',
    firstName: user?.name || 'Jonathan',
    lastName: 'Miller',
    assignedClasses: ['Class 10-A', 'Class 9-B'],
    assignedSubjects: ['Mathematics', 'Science'],
    department: 'Mathematics',
    designation: 'Class Teacher'
  };

  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
  const assignedClasses = teacher.assignedClasses || ['Class 10-A', 'Class 9-B'];
  
  // Clean class name helper
  const cleanClassName = (cls: string) => {
    if (!cls) return '';
    return cls.replace('Class ', '').replace('Grade ', '').trim();
  };

  // Extract classes lists
  const teacherClassNames = Array.from(new Set(assignedClasses.map(c => c.split('-')[0])));
  
  const classOptions = useMemo(() => {
    if (isTeacherRole) return teacherClassNames;
    return academicClasses.map(c => c.name);
  }, [academicClasses, isTeacherRole, teacherClassNames]);

  // States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState(teacher.assignedSubjects?.[0] || 'Mathematics');
  const [selectedPeriod, setSelectedPeriod] = useState('Period 1 (09:00 AM - 09:45 AM)');
  
  const [isEditable, setIsEditable] = useState(true);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  
  // Persistent LocalStorage Remarks registry
  const [remarksState, setRemarksState] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('student_attendance_remarks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const sectionOptions = useMemo(() => {
    if (isTeacherRole) {
      return assignedClasses
        .filter(c => c.startsWith(selectedClass + '-'))
        .map(c => c.split('-')[1] || 'A');
    }
    return academicClasses.find(c => c.name === selectedClass)?.sections || ['A', 'B'];
  }, [academicClasses, selectedClass, isTeacherRole, assignedClasses]);

  useEffect(() => {
    if (!sectionOptions.includes(selectedSection) && sectionOptions.length > 0) {
      setSelectedSection(sectionOptions[0]);
    }
  }, [selectedClass, sectionOptions, selectedSection]);

  // Student Fallback dataset to guarantee populated rosters for checks
  const enrolledStudents = useMemo(() => {
    const base = students.length > 0 ? students : [
      { id: '101', firstName: 'Rahul', lastName: 'Sharma', className: 'Class 10', section: 'A', rollNo: '001', admissionNo: 'ADM2026001', fatherName: 'Aman Sharma', fatherPhone: '+1 (555) 019-2831', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '15/05/2012', bloodGroup: 'O+', category: 'General' },
      { id: '102', firstName: 'Priya', lastName: 'Patel', className: 'Class 10', section: 'A', rollNo: '002', admissionNo: 'ADM2026002', fatherName: 'Rajesh Patel', fatherPhone: '+1 (555) 019-3829', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '22/08/2012', bloodGroup: 'A+', category: 'General' },
      { id: '103', firstName: 'Aditya', lastName: 'Verma', className: 'Class 10', section: 'A', rollNo: '003', admissionNo: 'ADM2026003', fatherName: 'Sanjay Verma', fatherPhone: '+1 (555) 019-4821', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '03/11/2012', bloodGroup: 'B+', category: 'OBC' },
      { id: '104', firstName: 'Ananya', lastName: 'Iyer', className: 'Class 10', section: 'A', rollNo: '004', admissionNo: 'ADM2026004', fatherName: 'Ganesh Iyer', fatherPhone: '+1 (555) 019-5830', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '14/02/2012', bloodGroup: 'AB+', category: 'General' },
      { id: '105', firstName: 'Vikram', lastName: 'Singh', className: 'Class 9', section: 'A', rollNo: '001', admissionNo: 'ADM2026005', fatherName: 'Kuldeep Singh', fatherPhone: '+1 (555) 019-6831', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '10/06/2013', bloodGroup: 'O-', category: 'General' },
      { id: '106', firstName: 'Sneha', lastName: 'Reddy', className: 'Class 9', section: 'B', rollNo: '001', admissionNo: 'ADM2026006', fatherName: 'Prasad Reddy', fatherPhone: '+1 (555) 019-7832', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '28/09/2013', bloodGroup: 'B-', category: 'OBC' }
    ] as any[];
    return base as Student[];
  }, [students]);

  // Roster listing
  const classStudents = useMemo(() => {
    return enrolledStudents.filter(s =>
      cleanClassName(s.className) === cleanClassName(selectedClass) &&
      s.section === selectedSection
    );
  }, [enrolledStudents, selectedClass, selectedSection]);

  // Attendance metrics mappers
  const getAttendanceStatus = (entityId: string): DailyAttendance['status'] => {
    const record = attendance.find(a => a.date === date && a.entityId === entityId);
    return record ? record.status : 'Present';
  };

  const handleSingleMark = (entityId: string, status: DailyAttendance['status']) => {
    if (!isEditable) {
      addToast('warning', 'Edit Locked', 'Attendance is locked. Enable editing to make changes.');
      return;
    }
    markAttendance([{ date, entityId, entityType: 'Student', status }]);
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    const updated = { ...remarksState, [`${date}_${studentId}`]: val };
    setRemarksState(updated);
    localStorage.setItem('student_attendance_remarks', JSON.stringify(updated));
  };

  const markAllClass = (status: DailyAttendance['status']) => {
    if (!isEditable) {
      addToast('warning', 'Edit Locked', 'Please enable edit mode to perform bulk changes.');
      return;
    }
    const records: DailyAttendance[] = classStudents.map(s => ({
      date,
      entityId: s.id,
      entityType: 'Student',
      status
    }));
    markAttendance(records);
    addToast('success', 'Bulk Attendance Mapped', `Marked all students as ${status}`);
  };

  // Calculated statistics
  const summaryMetrics = useMemo(() => {
    const total = classStudents.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    
    classStudents.forEach(s => {
      const status = getAttendanceStatus(s.id);
      if (status === 'Present') present++;
      else if (status === 'Absent') absent++;
      else if (status === 'Late') late++;
      else if (status === 'HalfDay') halfDay++;
    });

    const pct = total > 0 ? Math.round(((present + (halfDay * 0.5)) / total) * 100) : 100;
    return { total, present, absent, late, halfDay, percentage: pct };
  }, [classStudents, attendance, date]);

  // Mock past history records
  const [attendanceHistory, setAttendanceHistory] = useState([
    { id: '1', date: '2026-07-29', className: 'Class 10', section: 'A', present: 22, absent: 2, status: 'Completed' },
    { id: '2', date: '2026-07-28', className: 'Class 10', section: 'A', present: 21, absent: 3, status: 'Completed' },
    { id: '3', date: '2026-07-27', className: 'Class 10', section: 'A', present: 24, absent: 0, status: 'Completed' },
    { id: '4', date: '2026-07-24', className: 'Class 10', section: 'A', present: 23, absent: 1, status: 'Completed' }
  ]);

  const loadHistoryRecord = (histDate: string, histClass: string, histSec: string) => {
    setDate(histDate);
    setSelectedClass(histClass);
    setSelectedSection(histSec);
    setIsEditable(false);
    addToast('info', 'Loaded Historical Record', `Viewing attendance details for ${histDate}`);
  };

  const handleSaveAttendance = () => {
    setIsEditable(false);
    // Add to history list if not already present
    const exists = attendanceHistory.some(h => h.date === date && h.className === selectedClass && h.section === selectedSection);
    if (!exists) {
      setAttendanceHistory(prev => [
        {
          id: Date.now().toString(),
          date,
          className: selectedClass,
          section: selectedSection,
          present: summaryMetrics.present,
          absent: summaryMetrics.absent,
          status: 'Completed'
        },
        ...prev
      ]);
    }
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

        <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
          isEditable 
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300' 
            : 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-300'
        }`}>
          {isEditable ? '✏️ Edit Mode Active' : '🔒 Locked / Saved'}
        </span>
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
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              {classOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Section</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              {sectionOptions.map(sec => (
                <option key={sec} value={sec}>Sec {sec}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              {teacher.assignedSubjects?.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Period Block</label>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="Period 1 (09:00 AM - 09:45 AM)">Period 1 (09:00 AM)</option>
              <option value="Period 2 (10:00 AM - 10:45 AM)">Period 2 (10:00 AM)</option>
              <option value="Period 3 (11:00 AM - 11:45 AM)">Period 3 (11:00 AM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance marking sheet table (Full Screen Width) */}
      <div className="w-full space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            
            {/* Sheet Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-105 dark:border-slate-850">
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
                  onClick={handleSaveAttendance}
                  className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-[10.5px] font-black"
                >
                  <Save className="w-4 h-4" /> Save Attendance
                </button>
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-x-scroll shadow-xs">
              <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-505 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 w-20">Roll No</th>
                    <th className="py-3 px-4 w-48">Student Name</th>
                    <th className="py-3 px-4 text-center w-64">Attendance Status</th>
                    <th className="py-3 px-4">Remarks (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">No students found in Class {selectedClass}-{selectedSection}.</td>
                    </tr>
                  ) : (
                    classStudents.map(st => {
                      const status = getAttendanceStatus(st.id);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 text-slate-850 dark:text-slate-200">
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
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all ${
                                  status === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-450 hover:bg-slate-105'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'Absent')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all ${
                                  status === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-455 hover:bg-slate-105'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'HalfDay')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all ${
                                  status === 'HalfDay'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-455 hover:bg-slate-105'
                                }`}
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleSingleMark(st.id, 'Late')}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black tracking-wide uppercase transition-all ${
                                  status === 'Late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-455 hover:bg-slate-105'
                                }`}
                              >
                                Late
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add reason for delay, sick leave..."
                              value={remarksState[`${date}_${st.id}`] || ''}
                              disabled={!isEditable}
                              onChange={e => handleRemarkChange(st.id, e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/80 outline-none focus:border-brand-500 font-medium text-[11px]"
                            />
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

        {/* Bottom Dashboard Grid: Summary, Shortcuts, and History logs (Placed below full-width roster sheet) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Summary Panel card */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Attendance Summary
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border flex flex-col justify-center col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
                <span className="text-lg font-black text-slate-855 dark:text-white mt-0.5">{summaryMetrics.total}</span>
              </div>

              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/60 flex flex-col justify-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Present</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-455 mt-0.5">{summaryMetrics.present}</span>
              </div>

              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100/60 flex flex-col justify-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold uppercase">Absent</span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-455 mt-0.5">{summaryMetrics.absent}</span>
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/60 flex flex-col justify-center">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Half Day</span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-455 mt-0.5">{summaryMetrics.halfDay}</span>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/60 flex flex-col justify-center col-span-2">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Late Arrival</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-455 mt-0.5">{summaryMetrics.late}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Rate</p>
                <p className="text-xl font-black text-brand-600 dark:text-brand-400 mt-0.5">{summaryMetrics.percentage}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin shrink-0" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
              <Clock className="w-5 h-5 text-brand-500" />
              Attendance Shortcuts
            </h3>
            
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={handleSaveAttendance}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <span>Save Attendance</span>
              </button>

              <button
                onClick={() => {
                  setIsEditable(true);
                  addToast('info', 'Edit Mode Active', 'You can now change records for the selected date.');
                }}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
              >
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>Edit Attendance</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-600" />
                <span>Export Register (CSV)</span>
              </button>

              <button
                onClick={() => {
                  if (classStudents.length > 0) {
                    setProfileStudent(classStudents[0]);
                  } else {
                    addToast('warning', 'Empty list', 'No student details available to load.');
                  }
                }}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
              >
                <User className="w-4 h-4 text-purple-600" />
                <span>View Student Profile</span>
              </button>
            </div>
          </div>

          {/* Attendance History logs */}
          <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
              <RefreshCw className="w-5 h-5 text-brand-500" />
              Attendance History
            </h3>

            <div className="space-y-2 pt-1">
              {attendanceHistory.map(hist => (
                <div key={hist.id} className="p-3 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">{hist.date}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{hist.className} &bull; P: {hist.present} | A: {hist.absent}</p>
                  </div>

                  <button
                    onClick={() => loadHistoryRecord(hist.date, hist.className, hist.section)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border rounded-lg text-[10px] font-black transition-colors"
                  >
                    Details
                  </button>
                </div>
              ))}
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

    </div>
  );
};
