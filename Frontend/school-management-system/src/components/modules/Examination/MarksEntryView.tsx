import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, Save, Printer, FileSpreadsheet, Send, CheckCircle, AlertCircle, 
  HelpCircle, User, RefreshCw, ChevronRight, BookOpen, Clock, Download, Eye, X
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Student } from '../../../types';

export const MarksEntryView: React.FC = () => {
  const { students, staff, academicClasses, subjects, schoolProfile } = useData();
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';

  // Load teacher details
  const dbTeacher = staff.find(s => s.email && user?.email && s.email === user.email && s.employeeCategory === 'Teacher') || 
                     staff.find(s => s.employeeCategory === 'Teacher');

  const teacher = dbTeacher || {
    id: 'STF-002',
    firstName: user?.name || 'Jonathan',
    lastName: 'Miller',
    assignedClasses: ['Class 10-A', 'Class 9-B'],
    assignedSubjects: ['Mathematics', 'Science'],
  };

  const assignedClasses = teacher.assignedClasses || ['Class 10-A', 'Class 9-B'];
  const teacherClassNames = Array.from(new Set(assignedClasses.map(c => c.split('-')[0])));
  
  const classOptions = useMemo(() => {
    if (isTeacherRole) return teacherClassNames;
    return academicClasses.map(c => c.name);
  }, [academicClasses, isTeacherRole, teacherClassNames]);

  // Filters State
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [term, setTerm] = useState('Term 1');
  const [selectedExam, setSelectedExam] = useState('FA1 (Formative Assessment 1)');
  const [selectedAssessment, setSelectedAssessment] = useState('Unit Test 1');
  const [selectedClass, setSelectedClass] = useState(classOptions[0] || 'Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState(teacher.assignedSubjects?.[0] || 'Mathematics');
  const [maxMarks, setMaxMarks] = useState<number>(50);

  // Preview Modals State
  const [isLedgerPreviewOpen, setIsLedgerPreviewOpen] = useState(false);
  const [selectedStudentForPreview, setSelectedStudentForPreview] = useState<Student | null>(null);

  // Status State: 'Draft' | 'Submitted' | 'Published'
  const [publishStatus, setPublishStatus] = useState<Record<string, 'Draft' | 'Submitted' | 'Published'>>(() => {
    try {
      const saved = localStorage.getItem('marks_publish_status');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Local storage marks store
  const [marksState, setMarksState] = useState<Record<string, { marksObtained: string; remarks: string }>>(() => {
    try {
      const saved = localStorage.getItem('student_marks_entries');
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

  const cleanClassName = (cls: string) => {
    if (!cls) return '';
    return cls.replace('Class ', '').replace('Grade ', '').trim();
  };

  // Student Fallback dataset to ensure populated rosters
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

  // Active roster list
  const activeStudents = useMemo(() => {
    return enrolledStudents.filter(s =>
      cleanClassName(s.className) === cleanClassName(selectedClass) &&
      s.section === selectedSection
    );
  }, [enrolledStudents, selectedClass, selectedSection]);

  // Unique status/marks keys
  const configKey = `${academicYear}_${term}_${selectedExam.split(' ')[0]}_${selectedAssessment}_${selectedClass}_${selectedSection}_${selectedSubject}`;

  const currentStatus = publishStatus[configKey] || 'Draft';

  // Marks Entry handlers
  const handleMarkChange = (studentId: string, value: string, field: 'marksObtained' | 'remarks') => {
    if (currentStatus === 'Published') {
      addToast('warning', 'Marks Published', 'This sheet is published and locked. To change marks, revert status to Draft first.');
      return;
    }

    if (field === 'marksObtained') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > maxMarks) {
        addToast('error', 'Limit Exceeded', `Marks obtained cannot exceed max marks (${maxMarks})`);
        return;
      }
    }

    const key = `${configKey}_${studentId}`;
    const updated = {
      ...marksState,
      [key]: {
        ...marksState[key],
        [field]: value
      }
    };
    setMarksState(updated);
    localStorage.setItem('student_marks_entries', JSON.stringify(updated));
  };

  const getStudentMark = (studentId: string) => {
    const key = `${configKey}_${studentId}`;
    return marksState[key] || { marksObtained: '', remarks: '' };
  };

  // Status updates
  const updateStatus = (newStatus: 'Draft' | 'Submitted' | 'Published') => {
    const updated = { ...publishStatus, [configKey]: newStatus };
    setPublishStatus(updated);
    localStorage.setItem('marks_publish_status', JSON.stringify(updated));
    addToast('success', `Status Updated: ${newStatus}`, `Marks sheet status has been set to ${newStatus}`);
  };

  // Calculated Statistics Summary
  const marksSummary = useMemo(() => {
    const total = activeStudents.length;
    let entered = 0;
    let highest = -1;
    let lowest = 99999;
    let sum = 0;

    activeStudents.forEach(s => {
      const entry = getStudentMark(s.id);
      if (entry.marksObtained !== '') {
        const val = parseFloat(entry.marksObtained);
        if (!isNaN(val)) {
          entered++;
          sum += val;
          if (val > highest) highest = val;
          if (val < lowest) lowest = val;
        }
      }
    });

    const pending = total - entered;
    const avg = entered > 0 ? Math.round((sum / entered) * 10) / 10 : 0;
    return {
      total,
      entered,
      pending,
      highest: highest === -1 ? 0 : highest,
      lowest: lowest === 99999 ? 0 : lowest,
      average: avg
    };
  }, [activeStudents, marksState, configKey, maxMarks]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeStudents.length === 0) {
      addToast('warning', 'Export Blocked', 'Roster list is empty.');
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Roll No,Student Name,Max Marks,Marks Obtained,Remarks\n`;
    activeStudents.forEach(s => {
      const entry = getStudentMark(s.id);
      csvContent += `${s.rollNo},"${s.firstName} ${s.lastName}",${maxMarks},${entry.marksObtained || 0},"${(entry.remarks || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MarksSheet_${selectedClass}_${selectedSection}_${selectedSubject}_${selectedAssessment}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Marks list has been downloaded.');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
      
      {/* Header card */}
      <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
            Marks Entry & Publish
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
            <span>🏫 Class: <strong className="text-slate-855 dark:text-slate-200">{selectedClass}-{selectedSection}</strong></span>
            <span>📖 Subject: <strong className="text-slate-855 dark:text-slate-200">{selectedSubject}</strong></span>
            <span>📝 Exam: <strong className="text-slate-855 dark:text-slate-200">{selectedExam.split(' ')[0]}</strong></span>
            <span>🎯 Assessment: <strong className="text-slate-855 dark:text-slate-200">{selectedAssessment}</strong></span>
          </div>
        </div>

        <span className={`px-3.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
          currentStatus === 'Published' 
            ? 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/40 dark:text-emerald-300' 
            : currentStatus === 'Submitted'
            ? 'bg-blue-105 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-300'
        }`}>
          {currentStatus === 'Published' ? '📢 Published' : currentStatus === 'Submitted' ? '⏳ Submitted for Review' : '📝 Draft Mode'}
        </span>
      </div>

      {/* Roster Filters Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Academic Year</label>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Term</label>
            <select
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Exam Type</label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="FA1 (Formative Assessment 1)">FA1</option>
              <option value="FA2 (Formative Assessment 2)">FA2</option>
              <option value="SA1 (Summative Assessment 1)">SA1</option>
              <option value="SA2 (Summative Assessment 2)">SA2</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400">Assessment</label>
            <select
              value={selectedAssessment}
              onChange={e => setSelectedAssessment(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="Unit Test 1">Unit Test 1</option>
              <option value="Unit Test 2">Unit Test 2</option>
              <option value="Class Quiz">Class Quiz</option>
              <option value="Written Assignment">Written Assignment</option>
            </select>
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
            <label className="text-[10px] font-black uppercase text-slate-400">Max Marks</label>
            <input
              type="number"
              value={maxMarks}
              onChange={e => setMaxMarks(Math.max(1, parseInt(e.target.value) || 50))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="w-full space-y-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          
          {/* Table Header actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-105 dark:border-slate-850">
            <span className="font-extrabold text-sm text-slate-855 dark:text-slate-200">
              Students Marks Sheet ({activeStudents.length} Students)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateStatus('Draft')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                  currentStatus === 'Draft'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 hover:bg-slate-100'
                }`}
              >
                Revert to Draft
              </button>
              <button
                onClick={() => updateStatus('Submitted')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-350 font-bold transition-colors"
              >
                Submit for Approval
              </button>
              <button
                onClick={() => updateStatus('Published')}
                className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-[10.5px] font-black"
              >
                <CheckCircle className="w-4 h-4" /> Publish Marks
              </button>
            </div>
          </div>

          {/* Marks Entry Table Roster */}
          <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-x-scroll shadow-xs">
            <table className="w-full min-w-[850px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-550 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 w-24">Roll No</th>
                  <th className="py-3 px-4 w-60">Student</th>
                  <th className="py-3 px-4 text-center w-36">Max Marks</th>
                  <th className="py-3 px-4 text-center w-40">Marks Obtained</th>
                  <th className="py-3 px-4">Remarks / Evaluation Feedback</th>
                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {activeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">No students found matching filters.</td>
                  </tr>
                ) : (
                  activeStudents.map(st => {
                    const record = getStudentMark(st.id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 text-slate-855 dark:text-slate-200">
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
                        <td className="py-3 px-4 text-center font-bold text-slate-450">{maxMarks}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            placeholder="Enter score"
                            value={record.marksObtained}
                            disabled={currentStatus === 'Published'}
                            onChange={e => handleMarkChange(st.id, e.target.value, 'marksObtained')}
                            className="w-28 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="e.g. Excellent progress, Needs practice in Algebra..."
                            value={record.remarks}
                            disabled={currentStatus === 'Published'}
                            onChange={e => handleMarkChange(st.id, e.target.value, 'remarks')}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-800 outline-none focus:border-brand-500 font-medium"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedStudentForPreview(st)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-450 hover:text-brand-600 transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                          >
                            <Eye className="w-3 h-3 text-brand-650" /> Preview
                          </button>
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

      {/* Bottom Summary & Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Marks Summary Card */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <Award className="w-5 h-5 text-brand-500" />
            Marks Summary
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Students</span>
              <span className="text-lg font-black text-slate-855 dark:text-white mt-0.5">{marksSummary.total}</span>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/60 flex flex-col justify-center">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Entered</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-455 mt-0.5">{marksSummary.entered}</span>
            </div>

            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100/60 flex flex-col justify-center">
              <span className="text-[10px] text-rose-600 dark:text-rose-455 font-bold uppercase">Pending</span>
              <span className="text-lg font-black text-rose-700 dark:text-rose-450 mt-0.5">{marksSummary.pending}</span>
            </div>

            <div className="p-3 bg-brand-50/50 dark:bg-brand-950/20 rounded-2xl border border-brand-100/60 flex flex-col justify-center">
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">Average Mark</span>
              <span className="text-lg font-black text-brand-700 dark:text-brand-450 mt-0.5">{marksSummary.average}</span>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/60 flex flex-col justify-center">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">Highest Score</span>
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-455 mt-0.5">{marksSummary.highest}</span>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/60 flex flex-col justify-center">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">Lowest Score</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-455 mt-0.5">{marksSummary.lowest}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
            <Clock className="w-5 h-5 text-brand-500" />
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={() => setIsLedgerPreviewOpen(true)}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
            >
              <Eye className="w-4 h-4 text-brand-600" />
              <span>Preview Class Marks Sheet</span>
            </button>

            <button
              onClick={() => {
                addToast('success', 'Draft Saved Successfully', 'All marks scores have been locally cached.');
              }}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
            >
              <Save className="w-4 h-4 text-emerald-600" />
              <span>Save Marks Draft</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
            >
              <Printer className="w-4 h-4 text-amber-600" />
              <span>Print Marks Sheet</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border rounded-xl font-bold flex items-center gap-2 text-left"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>Export Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Publish Status Card */}
        <div className="glass-card p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 border-b pb-2">
              <CheckCircle className="w-5 h-5 text-brand-500" />
              Publish Status
            </h3>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Draft Status</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                  currentStatus === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
                }`}>Active Draft</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Review Approval</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                  currentStatus === 'Submitted' ? 'bg-blue-105 text-blue-800' : 'bg-slate-100 text-slate-400'
                }`}>Submitted</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Public Release</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase ${
                  currentStatus === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                }`}>Published</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-tight">
              Publishing marks registers them on student portals & report cards instantly.
            </p>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL: 1. Individual Student Report Mock Preview ----------------- */}
      {selectedStudentForPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={() => setSelectedStudentForPreview(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col my-auto"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Top controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between border-b shrink-0">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-500" /> Student Scorecard Preview
              </h3>
              <button onClick={() => setSelectedStudentForPreview(null)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scorecard Preview Sheet */}
            <div className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
              <div className="text-center space-y-1 border-b pb-3">
                <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white">{schoolProfile.name}</h4>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{selectedExam} &bull; {selectedAssessment}</p>
              </div>

              {/* Student details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-slate-700 flex items-center justify-center text-sky-700 font-extrabold text-sm shrink-0">
                  {selectedStudentForPreview.firstName[0]}{selectedStudentForPreview.lastName[0]}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs">{selectedStudentForPreview.firstName} {selectedStudentForPreview.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Roll No: {selectedStudentForPreview.rollNo} &bull; Adm No: {selectedStudentForPreview.admissionNo}</p>
                </div>
              </div>

              {/* Result Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold border-b pb-1">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Evaluation Subject</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{selectedSubject}</span>
                </div>
                <div className="flex justify-between font-bold border-b pb-1">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Maximum Marks</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{maxMarks}</span>
                </div>
                <div className="flex justify-between font-bold border-b pb-1">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Marks Obtained</span>
                  <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                    {getStudentMark(selectedStudentForPreview.id).marksObtained || '0'}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-b pb-1">
                  <span className="text-slate-400 uppercase text-[9px] tracking-wider">Grade Result</span>
                  <span className="font-black text-emerald-600">
                    {parseFloat(getStudentMark(selectedStudentForPreview.id).marksObtained) >= (maxMarks * 0.35) ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Progress Bar visual indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Score Weightage Rate</span>
                  <span>
                    {Math.round((parseFloat(getStudentMark(selectedStudentForPreview.id).marksObtained || '0') / maxMarks) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((parseFloat(getStudentMark(selectedStudentForPreview.id).marksObtained || '0') / maxMarks) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed text-[10.5px]">
                <span className="block font-bold text-[9.5px] uppercase text-slate-400 mb-0.5">Evaluator Feedback Remarks</span>
                <p className="italic text-slate-700 dark:text-slate-350">
                  "{getStudentMark(selectedStudentForPreview.id).remarks || 'No feedback logged.'}"
                </p>
              </div>

              <button
                onClick={() => setSelectedStudentForPreview(null)}
                className="w-full py-2 bg-brand-650 hover:bg-brand-600 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: 2. Class Marks Ledger Preview ----------------- */}
      {isLedgerPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={() => setIsLedgerPreviewOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Top controls */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between border-b shrink-0">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-500" /> Class Marks Ledger Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Ledger
                </button>
                <button onClick={() => setIsLedgerPreviewOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Register Document style */}
            <div className="p-8 space-y-6 overflow-y-auto text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900 relative text-xs">
              
              {/* Draft Watermark */}
              {currentStatus !== 'Published' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] overflow-hidden">
                  <div className="text-amber-600 font-black text-6xl uppercase tracking-widest rotate-[25deg] border-8 border-amber-600 px-6 py-3 whitespace-nowrap">
                    UNPUBLISHED DRAFT REGISTER
                  </div>
                </div>
              )}

              {/* School Header */}
              <div className="text-center space-y-1.5 border-b pb-4">
                <h1 className="text-lg font-black tracking-tight uppercase">{schoolProfile.name}</h1>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Official Assessment Ledger Sheet</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10.5px] font-bold text-slate-500 text-left max-w-xl mx-auto">
                  <span>Class: {selectedClass}-{selectedSection}</span>
                  <span>Subject: {selectedSubject}</span>
                  <span>Exam: {selectedExam.split(' ')[0]}</span>
                  <span>Assessment: {selectedAssessment}</span>
                </div>
              </div>

              {/* Roster table */}
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/60 text-slate-600 dark:text-slate-300 font-bold uppercase border-b">
                    <th className="p-2 border border-slate-200 dark:border-slate-800">Roll No</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800">Student Name</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-center">Score Obtained</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-center">Out Of</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800 text-center">Percentage</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-800">Remarks / Evaluation Feedback</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 dark:text-slate-350">
                  {activeStudents.map(st => {
                    const mark = getStudentMark(st.id);
                    const pct = maxMarks > 0 ? Math.round((parseFloat(mark.marksObtained || '0') / maxMarks) * 100) : 0;
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/20">
                        <td className="p-2 border border-slate-200 dark:border-slate-800 font-mono font-bold text-sky-650">{st.rollNo}</td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 font-extrabold">{st.firstName} {st.lastName}</td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-black">{mark.marksObtained || '0'}</td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-normal">{maxMarks}</td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 text-center text-emerald-600 font-bold">{pct}%</td>
                        <td className="p-2 border border-slate-200 dark:border-slate-800 font-normal text-[10px] text-slate-500">{mark.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Statistics block */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed text-center font-bold text-[10.5px]">
                <div>
                  <span className="block text-[8px] uppercase text-slate-400">Total Evaluated</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{marksSummary.entered} Students</p>
                </div>
                <div>
                  <span className="block text-[8px] uppercase text-slate-400">Class Average</span>
                  <p className="text-brand-500 mt-0.5">{marksSummary.average} / {maxMarks}</p>
                </div>
                <div>
                  <span className="block text-[8px] uppercase text-slate-400">Highest Score</span>
                  <p className="text-emerald-600 mt-0.5">{marksSummary.highest}</p>
                </div>
                <div>
                  <span className="block text-[8px] uppercase text-slate-400">Lowest Score</span>
                  <p className="text-rose-600 mt-0.5">{marksSummary.lowest}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 items-center pt-8 max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-32 mx-auto border-t border-slate-300 dark:border-slate-700 pt-2 text-[8.5px] font-bold text-slate-400 uppercase">
                    Class Teacher Signature
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-32 mx-auto border-t border-slate-300 dark:border-slate-700 pt-2 text-[8.5px] font-bold text-slate-400 uppercase">
                    Principal Stamp & Approval
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
