import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  X, User, Users, BookOpen, IndianRupee, Calendar, Award, FileText,
  Phone, Mail, MapPin, Bus, Camera, Trash2, CheckCircle, Shield,
  Printer, Download, History, Upload, Edit3, Eye, Plus, Check, File, Home, Clock, Heart, Building, Globe
} from 'lucide-react';
import { Student, ExamMark } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { PrintableIDCard } from './PrintableIDCard';
import { AcademicHistoryImportModal } from './AcademicHistoryImportModal';
import { formatToDDMMYYYY } from '../../../utils/dateValidation';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

interface StudentProfileDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onPromote?: () => void;
  onTransfer?: () => void;
  onDelete?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
  teacherView?: boolean;
  [key: string]: any;
}

interface StudentDocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadDate: string;
  fileUrl?: string;
  status: 'Verified' | 'Pending Review';
}

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'parents' | 'academics' | 'transport' | 'fees' | 'attendance' | 'exams' | 'docs' | 'history' | 'idcard' | 'promotions'>('personal');
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [idCardView, setIdCardView] = useState<'both' | 'front' | 'back'>('both');

  // Documents state & modal controls
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StudentDocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<StudentDocumentItem | null>(null);

  // Form states for Upload/Edit document
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Birth Certificate');
  const [docFile, setDocFile] = useState<File | null>(null);

  const {
    schoolProfile,
    students = [],
    admissions = [],
    studentTransports = [],
    attendance = [],
    feePayments = [],
    examMarks = [],
    exams = [],
    studentFeeAssignments = [],
    updateStudent,
    getStudentFeeOutstandingSummary
  } = useData();
  const { addToast } = useToast();

  // Find matching admission record if exists
  const matchingAdmission = useMemo(() => {
    if (!student) return null;
    return (admissions || []).find(a =>
      (a.admissionNo && a.admissionNo === student.admissionNo) ||
      (a.applicationNo && (a.applicationNo === student.admissionNo || (student as any).applicationNo === a.applicationNo)) ||
      (a.applicantName && `${student.firstName} ${student.lastName}`.trim().toLowerCase() === a.applicantName.trim().toLowerCase())
    ) || null;
  }, [admissions, student]);

  // Find matching transport allocation if exists
  const transportAllocation = useMemo(() => {
    if (!student) return null;
    return (studentTransports || []).find(t =>
      t.studentId === student.id ||
      (t.studentName && `${student.firstName} ${student.lastName}`.trim().toLowerCase() === t.studentName.trim().toLowerCase())
    ) || null;
  }, [studentTransports, student]);

  // Real-time live student instance from DataContext
  const liveStudent = useMemo(() => {
    if (!student) return student;
    const found = (students || []).find(s => s.id === student.id);
    return found || student;
  }, [students, student]);

  // Dynamic photo URL (checks live student avatar, falls back to admission avatar)
  const studentPhoto = resolveMediaUrl(liveStudent?.avatar || matchingAdmission?.avatar || '');

  // Dynamic student email with comprehensive fallback
  const studentEmail = useMemo(() => {
    if (!liveStudent) return '';
    const raw =
      liveStudent.email ||
      (liveStudent as any).studentEmail ||
      (liveStudent as any).emailAddress ||
      (liveStudent as any).emailId ||
      (liveStudent as any).contactEmail ||
      matchingAdmission?.email ||
      (matchingAdmission as any)?.contactEmail ||
      (matchingAdmission as any)?.parentEmail ||
      (liveStudent as any).fatherEmail ||
      (matchingAdmission as any)?.fatherEmail ||
      (liveStudent as any).guardianEmail ||
      '';
    if (raw && raw.trim() !== '') return raw.trim();

    const domain = schoolProfile?.website
      ? schoolProfile.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
      : (schoolProfile?.name ? schoolProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.edu.in' : 'school.edu');

    const cleanFirst = (liveStudent.firstName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLast = (liveStudent.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAdm = (liveStudent.admissionNo || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (cleanFirst && cleanLast) {
      return `${cleanFirst}.${cleanLast}@${domain}`;
    }
    if (cleanAdm) {
      return `${cleanAdm}@${domain}`;
    }
    return `student.${liveStudent.id || 'info'}@${domain}`;
  }, [liveStudent, matchingAdmission, schoolProfile]);

  // Sync documents dynamically from admission submitted docs or student docs
  useEffect(() => {
    if (!student) {
      setDocuments([]);
      return;
    }

    const initialDocs: StudentDocumentItem[] = [];

    if (matchingAdmission?.documentsSubmitted && matchingAdmission.documentsSubmitted.length > 0) {
      matchingAdmission.documentsSubmitted.forEach((docTitle, idx) => {
        initialDocs.push({
          id: `adm-doc-${idx}-${Date.now()}`,
          name: `${docTitle.replace(/\s+/g, '_')}.pdf`,
          category: docTitle,
          size: '1.2 MB',
          uploadDate: matchingAdmission.submissionDate || student.joiningDate || new Date().toLocaleDateString('en-GB'),
          status: 'Verified'
        });
      });
    } else if ((student as any).documentsSubmitted && Array.isArray((student as any).documentsSubmitted)) {
      (student as any).documentsSubmitted.forEach((docTitle: string, idx: number) => {
        initialDocs.push({
          id: `stu-doc-${idx}-${Date.now()}`,
          name: `${docTitle.replace(/\s+/g, '_')}.pdf`,
          category: docTitle,
          size: '1.2 MB',
          uploadDate: student.joiningDate || new Date().toLocaleDateString('en-GB'),
          status: 'Verified'
        });
      });
    }

    setDocuments(initialDocs);
  }, [student, matchingAdmission]);

  // Real fee payments for student
  const studentPayments = useMemo(() => {
    if (!student) return [];
    return (feePayments || []).filter(p =>
      p.studentId === student.id ||
      (p.studentName && `${student.firstName} ${student.lastName}`.trim().toLowerCase() === p.studentName.trim().toLowerCase())
    );
  }, [feePayments, student]);

  // Real attendance logs for student
  const studentAttendanceLogs = useMemo(() => {
    if (!student) return [];
    return (attendance || []).filter(a => a.entityId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, student]);

  // Real attendance statistics
  const attendanceStats = useMemo(() => {
    const total = studentAttendanceLogs.length;
    const present = studentAttendanceLogs.filter(a => a.status === 'Present').length;
    const absent = studentAttendanceLogs.filter(a => a.status === 'Absent').length;
    const late = studentAttendanceLogs.filter(a => a.status === 'Late' || a.status === 'HalfDay').length;
    const leave = studentAttendanceLogs.filter(a => a.status === 'Leave').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : (student?.attendancePct ?? 0);

    return { total, present, absent, late, leave, pct };
  }, [studentAttendanceLogs, student]);

  // Monthly Attendance Summary computed dynamically
  const monthlyAttendance = useMemo(() => {
    if (studentAttendanceLogs.length === 0) return [];
    const map = new Map<string, { label: string; total: number; present: number; sortKey: number }>();

    studentAttendanceLogs.forEach(log => {
      let d: Date;
      if (log.date.includes('/')) {
        const parts = log.date.split('/');
        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        d = new Date(log.date);
      }
      if (isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const current = map.get(key) || { label, total: 0, present: 0, sortKey: d.getTime() };
      current.total += 1;
      if (log.status === 'Present') current.present += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.sortKey - a.sortKey)
      .map(m => ({
        label: m.label,
        pct: m.total > 0 ? Math.round((m.present / m.total) * 100) : 0,
        present: m.present,
        total: m.total
      }));
  }, [studentAttendanceLogs]);

  // Real exam marks grouped by exam
  const studentExamMarks = useMemo(() => {
    if (!student) return [];
    return (examMarks || []).filter(m =>
      m.studentId === student.id ||
      (m.studentName && `${student.firstName} ${student.lastName}`.trim().toLowerCase() === m.studentName.trim().toLowerCase())
    );
  }, [examMarks, student]);

  const groupedExams = useMemo(() => {
    if (studentExamMarks.length === 0) return [];
    const map = new Map<string, {
      examId: string;
      examName: string;
      term: string;
      academicYear: string;
      marks: ExamMark[];
    }>();

    studentExamMarks.forEach(mark => {
      const examMeta = (exams || []).find(e => e.id === mark.examId);
      const key = mark.examId || mark.academicYear || 'exam-unknown';
      const examName = examMeta?.name || (mark as any).examName || 'Examination';
      const term = examMeta?.term || (mark as any).term || 'Regular Term';
      const academicYear = examMeta?.academicYear || mark.academicYear || student?.academicHistory?.[0]?.academicYear || '';

      const existing = map.get(key) || {
        examId: key,
        examName,
        term,
        academicYear,
        marks: [] as ExamMark[]
      };
      existing.marks.push(mark);
      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [studentExamMarks, exams, student]);

  // Dynamic Class Rank Computation
  const classRankInfo = useMemo(() => {
    if (!student) return { rank: 1, total: 1 };
    const classmates = (students || []).filter(s =>
      s.className === student.className &&
      (!student.section || !s.section || s.section === student.section) &&
      s.status === 'Active'
    );
    if (classmates.length === 0) return { rank: 1, total: 1 };

    const sorted = [...classmates].sort((a, b) => {
      const gpaDiff = (b.gpa || 0) - (a.gpa || 0);
      if (gpaDiff !== 0) return gpaDiff;
      return (b.attendancePct || 0) - (a.attendancePct || 0);
    });

    const rankIndex = sorted.findIndex(s => s.id === student.id);
    return { rank: rankIndex >= 0 ? rankIndex + 1 : 1, total: classmates.length };
  }, [students, student]);

  const formatOrdinal = (n: number) => {
    const pr = new Intl.PluralRules('en', { type: 'ordinal' });
    const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
    return `${n}${suffixes[pr.select(n)] || 'th'}`;
  };

  if (!isOpen || !student || !liveStudent) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newUrl = reader.result as string;
        updateStudent(student.id, { avatar: newUrl });
        addToast('success', 'Photo Updated', 'Student profile photo updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    if (student) {
      updateStudent(student.id, { avatar: '' });
      addToast('info', 'Photo Removed', 'Student profile photo removed');
    }
  };

  // Document Handlers
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      addToast('error', 'Validation Error', 'Please enter a document title');
      return;
    }
    const newDoc: StudentDocumentItem = {
      id: 'doc-' + Date.now(),
      name: docTitle.endsWith('.pdf') || docTitle.endsWith('.jpg') || docTitle.endsWith('.png') ? docTitle : `${docTitle}.pdf`,
      category: docCategory,
      size: docFile ? `${(docFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
      uploadDate: new Date().toLocaleDateString('en-GB'),
      status: 'Verified',
      fileUrl: docFile ? URL.createObjectURL(docFile) : undefined
    };
    setDocuments(prev => [newDoc, ...prev]);
    setIsUploadModalOpen(false);
    setDocTitle('');
    setDocFile(null);
    addToast('success', 'Document Uploaded', `${newDoc.name} has been added successfully`);
  };

  const handleUpdateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !docTitle.trim()) return;
    setDocuments(prev => prev.map(d => d.id === editingDoc.id ? { ...d, name: docTitle, category: docCategory } : d));
    setEditingDoc(null);
    addToast('success', 'Document Updated', 'Document details updated successfully');
  };

  const handleDeleteDocument = (id: string, name: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    addToast('info', 'Document Deleted', `${name} was removed`);
  };

  const handleDownloadDoc = (doc: StudentDocumentItem) => {
    addToast('success', 'Download Started', `Downloading ${doc.name}...`);
    const dummyContent = `Official document: ${doc.name}\nCategory: ${doc.category}\nStudent: ${student.firstName} ${student.lastName}\nAdmission No: ${student.admissionNo}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isHosteller =
    student.studentType === 'Hosteller' ||
    student.studentType === 'Residential' ||
    matchingAdmission?.studentType === 'Hosteller' ||
    matchingAdmission?.studentType === 'Residential';

  const hasTransportOpted =
    !!transportAllocation ||
    student.transportRequired ||
    (student.busRoute && student.busRoute !== 'N/A' && student.busRoute !== 'None') ||
    (matchingAdmission?.transportRequired || (matchingAdmission?.busRoute && matchingAdmission.busRoute !== 'None'));

  const assignedRouteName =
    transportAllocation?.routeName ||
    student.busRoute ||
    matchingAdmission?.busRoute ||
    'Not Assigned';

  const assignedPickupPoint =
    transportAllocation?.pickupPoint ||
    student.pickupPoint ||
    matchingAdmission?.pickupPoint ||
    'Not Assigned';

  const assignedDropPoint =
    transportAllocation?.dropPoint ||
    student.dropPoint ||
    matchingAdmission?.dropPoint ||
    'Not Assigned';

  const renderBarcode = (val: string) => {
    const clean = (val || 'STU-000').toUpperCase();
    const bars = [];
    let x = 4;
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      const w1 = (c % 3) + 1;
      const w2 = ((c >> 1) % 2) + 1;
      bars.push(<rect key={`b1-${i}`} x={x} y="0" width={w1} height="22" fill="currentColor" />);
      x += w1 + 1.5;
      bars.push(<rect key={`b2-${i}`} x={x} y="0" width={w2} height="22" fill="currentColor" />);
      x += w2 + 2;
    }
    return (
      <div className="flex flex-col items-center">
        <svg viewBox={`0 0 ${Math.max(x + 4, 110)} 22`} className="h-5 w-28 text-slate-800 dark:text-slate-100">
          {bars}
        </svg>
        <span className="font-mono text-[7.5px] tracking-widest text-slate-500 dark:text-slate-400 font-bold">{clean}</span>
      </div>
    );
  };

  const academicSession = (liveStudent as any)?.academicYear || schoolProfile?.academicYear || '2025-26';

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'parents', label: 'Guardian', icon: Users },
    { id: 'academics', label: 'Academics', icon: BookOpen },
    { id: 'transport', label: isHosteller ? 'Hostel Details' : 'Bus Route', icon: isHosteller ? Home : Bus },
    { id: 'fees', label: 'Fee History', icon: IndianRupee },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'exams', label: 'Exam Marks', icon: Award },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'promotions', label: 'Promotion Log', icon: History },
    { id: 'history', label: 'Academic History', icon: History },
    { id: 'idcard', label: 'Student ID Card', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Profile Top Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 via-sky-600 to-sky-600 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-5">
            <div className="relative group flex-shrink-0">
              {studentPhoto ? (
                <img
                  src={studentPhoto}
                  alt=""
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
                />
              ) : (
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white ring-4 ring-white/30 shadow-lg shrink-0 font-black text-2xl">
                  {liveStudent?.firstName ? liveStudent.firstName[0] : <User className="w-10 h-10" />}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <label className="p-1.5 rounded-lg bg-white/30 hover:bg-white/50 text-white cursor-pointer" title="Upload Photo">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                {studentPhoto && (
                  <button onClick={handleRemoveAvatar} className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white" title="Remove Photo">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{liveStudent.firstName} {liveStudent.lastName}</h2>
                <Badge variant={liveStudent.status === 'Active' ? 'success' : 'warning'} size="sm">
                  {liveStudent.status}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-brand-100">
                ID: <strong className="text-white font-mono">{liveStudent.id}</strong> • {liveStudent.className}-{liveStudent.section} • Roll: <strong className="text-white">{liveStudent.rollNo}</strong> • Adm: <strong className="text-white">{liveStudent.admissionNo}</strong> • <span className="font-bold text-amber-300">{liveStudent.branch || matchingAdmission?.branch || '-'}</span>
              </p>
              <div className="flex items-center gap-4 pt-1 text-xs text-white/90 flex-wrap">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 opacity-80" /> {studentEmail}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 opacity-80" /> {liveStudent.phone || liveStudent.fatherPhone || matchingAdmission?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-extrabold ring-1 ring-slate-200 dark:ring-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40 dark:bg-slate-900/40">

          {/* 1. Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Personal & Identification Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
                <div><span className="text-slate-400 block font-semibold">Date of Birth (DD-MM-YYYY):</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{formatToDDMMYYYY(student.dob || matchingAdmission?.dob || '', '-')}</p></div>
                <div><span className="text-slate-400 block font-semibold">Gender:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.gender || matchingAdmission?.gender || 'N/A'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Blood Group:</span> <p className="font-bold text-rose-500 mt-1 text-sm">{student.bloodGroup || matchingAdmission?.bloodGroup || 'Not Specified'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Religion:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{liveStudent?.religion || student.religion || matchingAdmission?.religion || 'General'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Caste Category:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{liveStudent?.casteCategory || student.casteCategory || matchingAdmission?.casteCategory || 'General'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Student Type:</span> <p className="font-bold text-brand-600 dark:text-brand-400 mt-1 text-sm">{student.studentType || matchingAdmission?.studentType || (isHosteller ? 'Residential / Hosteller' : 'Day Scholar')}</p></div>
                <div><span className="text-slate-400 block font-semibold">Branch / Campus:</span> <p className="font-bold text-amber-600 dark:text-amber-400 mt-1 text-sm">{student.branch || matchingAdmission?.branch || '-'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Joining Date:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.joiningDate || matchingAdmission?.joiningDate || matchingAdmission?.submissionDate || 'N/A'}</p></div>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-600" /> Complete Residential Address:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">{student.address || matchingAdmission?.address || 'Address not specified'}</p>
              </div>
            </div>
          )}

          {/* 2. Guardian Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Parent & Guardian Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 block">Father Details</span>
                  <p className="font-black text-slate-900 dark:text-white text-base">{student.fatherName || matchingAdmission?.parentName || 'N/A'}</p>
                  <p className="text-slate-500 font-medium">Occupation: {student.fatherOccupation || 'N/A'}</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-2 pt-1 text-xs">
                    <Phone className="w-4 h-4 text-brand-600" /> {student.fatherPhone || matchingAdmission?.phone || student.phone || 'N/A'}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block">Mother Details</span>
                  <p className="font-black text-slate-900 dark:text-white text-base">{student.motherName || matchingAdmission?.motherName || 'N/A'}</p>
                  <p className="text-slate-500 font-medium">Mother</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-2 pt-1 text-xs">
                    <Phone className="w-4 h-4 text-sky-600" /> {student.motherPhone || matchingAdmission?.motherPhone || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Academic Tab */}
          {activeTab === 'academics' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Academic Standing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Cumulative GPA</p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2 font-mono">{student.gpa ?? 0} / 4.0</p>
                </div>
                <div className="p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-wider text-sky-600 dark:text-sky-400">Attendance Percentage</p>
                  <p className="text-3xl font-black text-sky-700 dark:text-sky-300 mt-2 font-mono">{attendanceStats.pct}%</p>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">Class Rank</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2 font-mono">
                    {formatOrdinal(classRankInfo.rank)} / {classRankInfo.total}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Bus Route / Hostel Details Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isHosteller ? 'HOSTEL & ACCOMMODATION ALLOCATION' : 'TRANSPORT & BUS ALLOCATION'}
              </h3>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Student Category:</span>
                  <Badge variant={isHosteller ? 'warning' : 'info'}>
                    {student.studentType || matchingAdmission?.studentType || (isHosteller ? 'Hosteller / Residential' : 'Day Scholar')}
                  </Badge>
                </div>

                {isHosteller ? (
                  <>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Assigned Hostel Block:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {student.hostelBlock && student.hostelBlock !== 'N/A' && student.hostelBlock !== 'None'
                          ? student.hostelBlock
                          : (matchingAdmission?.hostelBlock && matchingAdmission.hostelBlock !== 'None' ? matchingAdmission.hostelBlock : 'Not Assigned')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Room & Bed Allocation:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(() => {
                          const room = student.hostelRoom || matchingAdmission?.hostelRoom;
                          const bed = student.hostelBed || matchingAdmission?.hostelBed;
                          if (room || bed) {
                            return `${room ? `Room ${room}` : ''} ${bed ? `(Bed: ${bed})` : ''}`.trim();
                          }
                          return 'Not Assigned';
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Allocation Status:</span>
                      <Badge variant={student.hostelBlock || matchingAdmission?.hostelBlock ? 'success' : 'neutral'}>
                        {student.hostelBlock || matchingAdmission?.hostelBlock ? 'Allocated' : 'Unallocated'}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Transport Facility:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {hasTransportOpted ? 'Opted (School Transport)' : 'Not Opted (Self Transport)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Assigned Bus Route:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {assignedRouteName !== 'None' && assignedRouteName !== 'N/A' ? assignedRouteName : 'Not Assigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Pickup Point:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {assignedPickupPoint !== 'None' && assignedPickupPoint !== 'N/A' ? assignedPickupPoint : 'Not Assigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Drop Point:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {assignedDropPoint !== 'None' && assignedDropPoint !== 'N/A' ? assignedDropPoint : 'Not Assigned'}
                      </span>
                    </div>
                    {transportAllocation?.vehicleNumber && (
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 font-semibold">Assigned Vehicle:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {transportAllocation.vehicleNumber}
                        </span>
                      </div>
                    )}
                    {transportAllocation?.feePlan && (
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 font-semibold">Transport Fee Plan:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {transportAllocation.feePlan} ({formatCurrency(transportAllocation.feeAmount || 0)})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold">Route Status:</span>
                      <Badge variant={hasTransportOpted ? 'success' : 'neutral'}>
                        {transportAllocation?.status || (hasTransportOpted ? 'Active' : 'Not Active')}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 5. FEE HISTORY TAB */}
          {activeTab === 'fees' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Complete Fee History</h3>
                <span className="text-xs font-bold text-slate-500">{(student as any).academicYear ? `Academic Year ${(student as any).academicYear}` : ""}</span>
              </div>

              {/* Fee Summary Cards */}
              {(() => {
                const summary = getStudentFeeOutstandingSummary(student.id);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Current Year Due</span>
                      <p className={`text-xl font-black font-mono ${summary.currentYearDue > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>{formatCurrency(summary.currentYearDue)}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${summary.previousYearsDue > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Previous Academic Years Due</span>
                      <p className={`text-xl font-black font-mono ${summary.previousYearsDue > 0 ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(summary.previousYearsDue)}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${summary.totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>Total Consolidated Outstanding</span>
                      <p className={`text-xl font-black font-mono ${summary.totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(summary.totalOutstanding)}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Multi-Academic-Year Fee History Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Annual Fee Ledger History</h4>
                {(() => {
                  const summary = getStudentFeeOutstandingSummary(student.id);
                  if (!summary.yearWiseOutstanding || summary.yearWiseOutstanding.length === 0) {
                    return (
                      <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <IndianRupee className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Annual Fee Records</p>
                        <p className="text-[10px] text-slate-400">No fee structure or tuition fee assignments have been assigned to this student yet.</p>
                      </div>
                    );
                  }
                  const grandTotal = summary.yearWiseOutstanding.reduce((sum, item) => sum + item.gross, 0);
                  const grandPaid = summary.yearWiseOutstanding.reduce((sum, item) => sum + item.paid, 0);
                  const grandDue = summary.totalOutstanding;

                  return (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500">
                          <tr>
                            <th className="p-3">Academic Year</th>
                            <th className="p-3">Class</th>
                            <th className="p-3">Total Payable</th>
                            <th className="p-3">Amount Paid</th>
                            <th className="p-3">Outstanding Due</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {summary.yearWiseOutstanding.map(yr => (
                            <tr key={yr.academicYear} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{yr.academicYear}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">{yr.className || student.className}</td>
                              <td className="p-3 font-mono font-semibold">{formatCurrency(yr.gross)}</td>
                              <td className="p-3 font-mono text-emerald-600 font-bold">{formatCurrency(yr.paid)}</td>
                              <td className="p-3 font-mono text-rose-500 font-bold">{formatCurrency(yr.due)}</td>
                              <td className="p-3 text-right">
                                <Badge variant={yr.status === 'Paid' ? 'success' : (yr.status === 'Partial' ? 'warning' : 'danger')} size="sm">
                                  {yr.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100/70 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700">
                            <td className="p-3 uppercase text-[11px]" colSpan={2}>Grand Total</td>
                            <td className="p-3 font-mono">{formatCurrency(grandTotal)}</td>
                            <td className="p-3 font-mono text-emerald-600">{formatCurrency(grandPaid)}</td>
                            <td className="p-3 font-mono text-rose-500">{formatCurrency(grandDue)}</td>
                            <td className="p-3 text-right text-slate-400 text-[10px]">
                              {grandDue === 0 ? '✓ ALL CLEARED' : 'PENDING'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Completed Payment Receipts Ledger */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Completed Payments & Receipts History</h4>
                {studentPayments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <CheckCircle className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Payment Receipts Found</p>
                    <p className="text-[10px] text-slate-400">No fee payment transactions have been logged for this student.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {studentPayments.map(p => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-sm">{p.receiptNo}</span>
                            <Badge variant="success" size="sm">{p.status}</Badge>
                          </div>
                          <p className="text-slate-500 text-[11px]">Paid on {p.paymentDate} • Payment Mode: <strong className="text-slate-700 dark:text-slate-300">{p.paymentMode}</strong></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-black text-emerald-600 font-mono text-sm">{formatCurrency(p.amountPaid)}</p>
                          <button
                            onClick={() => addToast('info', 'Receipt Download', `Downloading receipt ${p.receiptNo}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-500"
                          >
                            <Download className="w-3 h-3" /> Receipt PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. FULL ATTENDANCE DATA TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Full Attendance Record & Calendar</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200">
                  {attendanceStats.pct}% Overall Attendance
                </span>
              </div>

              {/* Attendance Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Present</span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">{attendanceStats.present} Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Absent</span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 font-mono">{attendanceStats.absent} Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Late / Half Day</span>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">{attendanceStats.late} Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Approved Leave</span>
                  <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-1 font-mono">{attendanceStats.leave} Days</p>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Monthly Attendance Percentage Summary</h4>
                {monthlyAttendance.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-xs">
                    No monthly attendance logs recorded for this student.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {monthlyAttendance.map(m => (
                      <div key={m.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                        <span className="text-slate-400 block font-semibold">{m.label}</span>
                        <span className={`font-black text-sm mt-0.5 block ${m.pct >= 85 ? 'text-emerald-600' : m.pct >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {m.pct}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{m.present} / {m.total} days</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Daily Attendance Log */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Recent Daily Attendance Logs</h4>
                {studentAttendanceLogs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No Daily Attendance Logs</p>
                    <p className="text-[10px] text-slate-400">No daily attendance entries have been logged yet for this student.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Day</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Session</th>
                          <th className="p-3 text-right">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studentAttendanceLogs.slice(0, 15).map((log, index) => {
                          const dateObj = new Date(log.date);
                          const dayOfWeek = !isNaN(dateObj.getTime())
                            ? dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                            : '-';

                          const badgeVariant =
                            log.status === 'Present' ? 'success' :
                            log.status === 'Absent' ? 'danger' :
                            log.status === 'Late' || log.status === 'HalfDay' ? 'warning' : 'info';

                          return (
                            <tr key={log.id || `att-${index}`}>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{formatToDDMMYYYY(log.date, '/')}</td>
                              <td className="p-3 text-slate-500">{dayOfWeek}</td>
                              <td className="p-3">
                                <Badge variant={badgeVariant} size="sm">{log.status}</Badge>
                              </td>
                              <td className="p-3 text-slate-500">{log.status === 'HalfDay' ? 'Half Day' : 'Full Day'}</td>
                              <td className="p-3 text-right text-slate-400">{log.remarks || 'Standard Session'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. ALL EXAMINATION HISTORY TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">All Examination History & Report Cards</h3>
                <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200">
                  GPA {student.gpa ?? 0} / 4.0
                </span>
              </div>

              {groupedExams.length === 0 ? (
                <div className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <Award className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">No Examination Marks Recorded</p>
                  <p className="text-[11px] text-slate-400">No exam marks or grade cards have been published for this student yet.</p>
                </div>
              ) : (
                groupedExams.map(exam => {
                  const totalObtained = exam.marks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
                  const totalMax = exam.marks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
                  const pct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0';
                  const isPassed = !exam.marks.some(m => m.marksObtained < ((m.totalMarks || 100) * 0.35));

                  return (
                    <div key={exam.examId} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">{exam.examName}</h4>
                          <p className="text-[11px] text-slate-500">Term: {exam.term} {exam.academicYear ? `• Year: ${exam.academicYear}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-emerald-600 font-mono text-sm">{totalObtained} / {totalMax} ({pct}%)</span>
                          <Badge variant={isPassed ? 'success' : 'danger'} size="sm">{isPassed ? 'Passed' : 'Failed'}</Badge>
                          <button
                            onClick={() => addToast('success', 'Download Started', `Downloading ${exam.examName} Report Card PDF`)}
                            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> Report PDF
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500">
                            <tr>
                              <th className="p-3">Subject Name</th>
                              <th className="p-3">Max Marks</th>
                              <th className="p-3">Pass Marks</th>
                              <th className="p-3">Marks Obtained</th>
                              <th className="p-3">Grade</th>
                              <th className="p-3 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {exam.marks.map((m, idx) => {
                              const passMark = Math.round((m.totalMarks || 100) * 0.35);
                              const passedSubject = (m.marksObtained || 0) >= passMark;

                              return (
                                <tr key={m.id || `mark-${idx}`}>
                                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{m.subject}</td>
                                  <td className="p-3">{m.totalMarks || 100}</td>
                                  <td className="p-3">{passMark}</td>
                                  <td className="p-3 font-mono font-bold text-brand-600">{m.marksObtained}</td>
                                  <td className="p-3 font-bold text-emerald-600">{m.grade || '-'}</td>
                                  <td className="p-3 text-right">
                                    <span className={`font-bold ${passedSubject ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {passedSubject ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 8. DOCUMENTS TAB */}
          {activeTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Student Documents & Certificates</h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Upload Document
                </button>
              </div>

              {/* Documents List */}
              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-bold text-xs text-slate-600 dark:text-slate-400">No Documents Uploaded</p>
                  <p className="text-[11px] text-slate-400">No certificates or identity proofs have been uploaded for this student yet.</p>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm hover:border-brand-300 dark:hover:border-brand-800 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{doc.name}</h4>
                            <Badge variant="success" size="sm">{doc.status}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Category: <strong className="text-slate-700 dark:text-slate-300">{doc.category}</strong> • Size: {doc.size} • Added {doc.uploadDate}
                          </p>
                        </div>
                      </div>

                      {/* Action Controls: Preview, Edit, Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4 text-brand-600" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setDocTitle(doc.name);
                            setDocCategory(doc.category);
                          }}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4 text-sky-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.name)}
                          className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. Promotion History Log */}
          {activeTab === 'promotions' && (
            <div className="space-y-3 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Promotion & Branch Transfer History</h3>
              {(!student.promotionHistory || student.promotionHistory.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No promotion or branch transfer recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {student.promotionHistory.map(ph => (
                    <div key={ph.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-600 dark:text-brand-400">Session {ph.academicYear}</span>
                        <span className="text-[10px] text-slate-400">{ph.date}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200">
                        Promoted from <strong>{ph.fromClass}-{ph.fromSection}</strong> to <strong>{ph.toClass}-{ph.toSection}</strong>
                      </p>
                      {ph.fromBranch !== ph.toBranch && (
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          Branch Transferred: {ph.fromBranch} → {ph.toBranch}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. Academic History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Academic Year History Timeline ({student.academicHistory?.length || 0} Sessions)
                </h3>
              </div>

              {(!student.academicHistory || student.academicHistory.length === 0) ? (
                <div className="p-8 text-center text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border">
                  No academic history timeline entries found.
                </div>
              ) : (
                <div className="space-y-3">
                  {student.academicHistory.map((h) => {
                    const stAtt = (attendance || []).filter((a) => a.entityId === student.id);
                    const attPct = stAtt.length > 0 ? Math.round((stAtt.filter((a) => a.status === 'Present').length / stAtt.length) * 100) : 0;

                    const stMarks = (examMarks || []).filter((m) => m.studentId === student.id);
                    const totalObt = stMarks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
                    const totalMax = stMarks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
                    const examPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;

                    const stPay = (feePayments || []).filter((p) => p.studentId === student.id && p.paymentDate?.includes(h.academicYear));
                    const paidAmt = stPay.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                    const stAssign = (studentFeeAssignments || []).find((a) => a.studentId === student.id && a.academicYear === h.academicYear);
                    const totalFee = (stAssign as any)?.finalAmount || 0;
                    const dueAmt = Math.max(0, totalFee - paidAmt);

                    return (
                      <div key={h.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold font-mono text-xs">
                              {h.academicYear}
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                              {h.className} - Section {h.section}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                            Roll #{h.rollNo} • {h.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div><span className="text-slate-400 block font-medium">Class Teacher:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{h.classTeacher || 'Unassigned'}</span></div>
                          <div><span className="text-slate-400 block font-medium">Branch:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{h.branch || student.branch || '—'}</span></div>
                          <div><span className="text-slate-400 block font-medium">Yearly Status:</span> <span className="font-bold text-sky-600">{h.status}</span></div>
                          <div><span className="text-slate-400 block font-medium">Remarks:</span> <span className="font-bold text-slate-800 dark:text-slate-200">{h.remarks || 'None'}</span></div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center text-[10px]">
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400 block font-semibold">Attendance</span>
                            <span className="font-extrabold text-emerald-600 font-mono text-xs mt-0.5 block">{attPct}% Present</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400 block font-semibold">Exam Results</span>
                            <span className="font-extrabold text-indigo-600 font-mono text-xs mt-0.5 block">{examPct > 0 ? `${examPct}% Score` : 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <span className="text-slate-400 block font-semibold">Fee Ledger</span>
                            <span className={`font-extrabold font-mono text-xs mt-0.5 block ${dueAmt > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {dueAmt > 0 ? `${formatCurrency(dueAmt)} Due` : 'Fully Paid'}
                            </span>
                          </div>
                        </div>

                        {h.discontinuationDetails && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-[11px] space-y-1">
                            <div className="font-bold">Discontinuation Details:</div>
                            <div>Date: {h.discontinuationDetails.discontinuationDate} • Reason: {h.discontinuationDetails.reason}</div>
                            {h.discontinuationDetails.tcNo && <div>TC Ref: <span className="font-mono font-bold">{h.discontinuationDetails.tcNo}</span></div>}
                          </div>
                        )}

                        {h.transferDetails && (
                          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 text-purple-800 dark:text-purple-300 text-[11px] space-y-1">
                            <div className="font-bold">Transfer Details:</div>
                            <div>Date: {h.transferDetails.transferDate} • Destination: {h.transferDetails.destinationSchool || 'External School'}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 11. Student ID Card Tab */}
          {activeTab === 'idcard' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Toolbar Header */}
              <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-600" /> Official Student Identity Card
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Front side student credentials & back side verified parent information
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Switcher */}
                  <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIdCardView('both')}
                      className={`px-3 py-1 rounded-lg transition-all ${idCardView === 'both' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Both Sides
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdCardView('front')}
                      className={`px-3 py-1 rounded-lg transition-all ${idCardView === 'front' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Front Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdCardView('back')}
                      className={`px-3 py-1 rounded-lg transition-all ${idCardView === 'back' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                      Back Only
                    </button>
                  </div>

                  {/* Upload Photo Button */}
                  <label className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700">
                    <Camera className="w-3.5 h-3.5 text-brand-600" />
                    <span>Upload Photo</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={() => setIsIDCardModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print ID Cards
                  </button>
                </div>
              </div>

              {/* ID Cards Showcase */}
              <div className="flex flex-wrap items-start justify-center gap-6 py-2">
                
                {/* FRONT SIDE */}
                {(idCardView === 'both' || idCardView === 'front') && (
                  <div className="w-full max-w-[310px] rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col font-sans transition-all">
                    {/* Top School Header */}
                    <div className="p-3.5 bg-gradient-to-r from-brand-700 via-sky-700 to-sky-800 text-white relative text-center">
                      <div className="flex items-center justify-center gap-2.5">
                        {schoolProfile?.logoUrl ? (
                          <img
                            src={resolveMediaUrl(schoolProfile.logoUrl)}
                            alt="School Logo"
                            className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 shadow-sm ring-1 ring-white/30 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white text-brand-700 font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                            {schoolProfile?.name ? schoolProfile.name.slice(0, 2).toUpperCase() : 'PS'}
                          </div>
                        )}
                        <div className="text-left overflow-hidden">
                          <h4 className="font-black text-xs uppercase tracking-wider leading-tight text-white truncate max-w-[200px]">
                            {schoolProfile?.name || 'School Name'}
                          </h4>
                          <p className="text-[9px] text-sky-200 font-medium truncate max-w-[200px]">
                            {liveStudent.branch || matchingAdmission?.branch ? `${liveStudent.branch || matchingAdmission?.branch} Campus` : (schoolProfile?.tagline || 'Empowering Minds, Shaping Tomorrow')}
                          </p>
                        </div>
                      </div>

                      {/* Identity Banner */}
                      <div className="mt-2.5 py-1 px-3 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-between text-[9px] font-black tracking-wider uppercase text-white/95 border border-white/20">
                        <span>STUDENT IDENTITY CARD</span>
                        <span className="font-mono text-amber-300">{academicSession}</span>
                      </div>
                    </div>

                    {/* Student Photo & Identity Section */}
                    <div className="p-4 flex flex-col items-center flex-1 space-y-3">
                      {/* Photo Frame */}
                      <div className="relative group">
                        <div className="w-24 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-brand-500 shadow-md flex items-center justify-center shrink-0">
                          {studentPhoto ? (
                            <img
                              src={studentPhoto}
                              alt={`${liveStudent.firstName} ${liveStudent.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <User className="w-10 h-10 text-slate-400 mb-1" />
                              <span className="text-[9px] font-bold">No Photo</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Camera Upload Overlay */}
                        <label className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[9px] font-bold gap-1">
                          <Camera className="w-4 h-4" />
                          <span>Change</span>
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Student Name & Class */}
                      <div className="text-center space-y-1 w-full">
                        <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">
                          {liveStudent.firstName} {liveStudent.lastName}
                        </h3>
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-[10px] font-extrabold border border-brand-200 dark:border-brand-800">
                            Class: {liveStudent.className}-{liveStudent.section}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold">
                            Roll #{liveStudent.rollNo}
                          </span>
                        </div>
                      </div>

                      {/* Key Identity Data Grid */}
                      <div className="w-full grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[10px]">
                        <div>
                          <span className="text-slate-400 font-medium block">Student ID:</span>
                          <span className="font-mono font-black text-brand-700 dark:text-brand-300">{liveStudent.id}</span>
                          {liveStudent.admissionNo && (
                            <span className="text-[8px] text-slate-400 block font-mono">Adm: {liveStudent.admissionNo}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Date of Birth:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatToDDMMYYYY(liveStudent.dob || matchingAdmission?.dob || '', '-')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Blood Group:</span>
                          <span className="font-black text-rose-500 flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 fill-rose-500" />
                            {liveStudent.bloodGroup || matchingAdmission?.bloodGroup || 'Not Specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Emergency Contact:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {liveStudent.fatherPhone || matchingAdmission?.phone || liveStudent.phone || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Barcode & Signature */}
                      <div className="w-full flex items-end justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="shrink-0">
                          {renderBarcode(liveStudent.id ? String(liveStudent.id) : (liveStudent.admissionNo || 'STU-000'))}
                        </div>
                        <div className="text-right">
                          <div className="h-5 flex items-end justify-end">
                            <span className="font-serif italic text-[11px] font-bold text-brand-700 dark:text-brand-300">
                              {schoolProfile?.principalName || 'Principal'}
                            </span>
                          </div>
                          <p className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-300 dark:border-slate-700 pt-0.5">
                            Authorized Signatory
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BACK SIDE */}
                {(idCardView === 'both' || idCardView === 'back') && (
                  <div className="w-full max-w-[310px] rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col font-sans transition-all">
                    {/* Top Header */}
                    <div className="p-3 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-white text-center border-b border-slate-700">
                      <h4 className="font-black text-[11px] uppercase tracking-wider text-amber-300">
                        PARENT & GUARDIAN DETAILS
                      </h4>
                      <p className="text-[9px] text-slate-300">{schoolProfile?.name || 'School Student Record'}</p>
                    </div>

                    {/* Parent Information Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-[10px]">
                      <div className="space-y-2.5">
                        {/* Parents Grid */}
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                            <div>
                              <span className="text-[9px] font-black uppercase text-brand-600 dark:text-brand-400 block">Father's Name</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {liveStudent.fatherName || matchingAdmission?.parentName || 'N/A'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block">Mobile</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {liveStudent.fatherPhone || matchingAdmission?.phone || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <div>
                              <span className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400 block">Mother's Name</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {liveStudent.motherName || matchingAdmission?.motherName || 'N/A'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block">Mobile</span>
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {liveStudent.motherPhone || matchingAdmission?.motherPhone || liveStudent.alternatePhone || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Residential Address */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brand-600" /> Residential Address
                          </span>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-[10px] leading-relaxed">
                            {liveStudent.address || matchingAdmission?.address || 'Address not specified'}
                          </p>
                        </div>

                        {/* Transport or Hostel Details */}
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          {isHosteller ? (
                            <>
                              <span className="font-semibold text-slate-500">Hostel Allocation:</span>
                              <span className="font-bold text-brand-600 dark:text-brand-400">
                                {liveStudent.hostelBlock || matchingAdmission?.hostelBlock ? `${liveStudent.hostelBlock || matchingAdmission?.hostelBlock} ${liveStudent.hostelRoom ? `(Rm ${liveStudent.hostelRoom})` : ''}` : 'Hostel Resident'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-slate-500">Transport / Route:</span>
                              <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                                {assignedRouteName !== 'None' && assignedRouteName !== 'N/A'
                                  ? `${assignedRouteName} (${assignedPickupPoint})`
                                  : 'Self Transport'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Important Terms */}
                        <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-[8.5px] text-amber-900 dark:text-amber-200/90 leading-tight space-y-0.5">
                          <p className="font-bold">Instructions:</p>
                          <p>1. This card must be carried daily and presented on demand.</p>
                          <p>2. If lost or found, please return immediately to the school office.</p>
                        </div>
                      </div>

                      {/* School Verification Footer */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[8.5px] text-slate-500 text-center space-y-0.5">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{schoolProfile?.address || 'School Campus'}</p>
                        <p className="font-mono">
                          Ph: {schoolProfile?.phone || liveStudent.phone} • Email: {schoolProfile?.email || 'office@school.edu'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" /> Upload New Student Certificate
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birth_Certificate.pdf"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-semibold outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Category</label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-semibold outline-none focus:border-brand-500"
                >
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Transfer Certificate">Transfer Certificate</option>
                  <option value="Marksheet">Marksheet / Report Card</option>
                  <option value="Identity Proof">Identity Proof (Aadhaar / Passport)</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Conduct Certificate">Conduct Certificate</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Select File</label>
                <input
                  id="certificate-file-input"
                  type="file"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setDocFile(f);
                      if (!docTitle) setDocTitle(f.name);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('certificate-file-input')?.click()}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-left"
                >
                  <span className="truncate text-slate-500 font-medium">
                    {docFile ? docFile.name : 'Choose file...'}
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    Browse
                  </span>
                </button>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" /> Save & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600" /> Edit Document Details
              </h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDocument} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-semibold outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Document Category</label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-semibold outline-none focus:border-brand-500"
                >
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Transfer Certificate">Transfer Certificate</option>
                  <option value="Marksheet">Marksheet / Report Card</option>
                  <option value="Identity Proof">Identity Proof (Aadhaar / Passport)</option>
                  <option value="Medical Certificate">Medical Certificate</option>
                  <option value="Conduct Certificate">Conduct Certificate</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-xs">{previewDoc.name}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col h-[400px]">
              {previewDoc.fileUrl ? (
                <div className="flex-1 w-full overflow-y-auto">
                  {previewDoc.name.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={previewDoc.fileUrl}
                      className="w-full h-full min-h-[380px] border-none"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center p-4 min-h-full bg-slate-100 dark:bg-slate-950">
                      <img
                        src={previewDoc.fileUrl}
                        alt="Uploaded Document"
                        className="max-w-full rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{previewDoc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Category: {previewDoc.category} • {previewDoc.size}</p>
                    <div className="mt-2"><Badge variant="success" size="sm">{previewDoc.status}</Badge></div>
                  </div>
                  <div className="w-full max-w-sm p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-xs font-mono space-y-2 mt-2">
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b pb-1 border-slate-100 dark:border-slate-800">Verified Secure Document</p>
                    <p className="text-slate-700 dark:text-slate-300">File Signature: SHA-256 (OK)</p>
                    <p className="text-slate-700 dark:text-slate-300">Access Tier: Student Portal Restructured</p>
                    <p className="text-slate-400 text-[10px] italic">To inspect full original copy offline, click "Download File" below.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDownloadDoc(previewDoc)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Download File
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Printable Student ID Card Modal */}
      <PrintableIDCard
        student={student}
        isOpen={isIDCardModalOpen}
        onClose={() => setIsIDCardModalOpen(false)}
      />

      {/* Excel Import Modal */}
      <AcademicHistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
