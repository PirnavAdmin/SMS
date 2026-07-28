import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  X, User, Users, BookOpen, IndianRupee, Calendar, Award, FileText,
  Phone, Mail, MapPin, Bus, Camera, Trash2, CheckCircle, Shield,
  Printer, Download, History, Upload, Edit3, Eye, Plus, Check, File
} from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { PrintableIDCard } from './PrintableIDCard';

interface StudentProfileDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
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
  const [activeTab, setActiveTab] = useState<'personal' | 'parents' | 'academics' | 'transport' | 'fees' | 'attendance' | 'exams' | 'docs' | 'idcard' | 'promotions'>('personal');
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

  // Documents state & modal controls
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([
    { id: 'doc-1', name: 'Birth_Certificate_Official.pdf', category: 'Birth Certificate', size: '1.2 MB', uploadDate: '12/04/2026', status: 'Verified' },
    { id: 'doc-2', name: 'Previous_School_TC.pdf', category: 'Transfer Certificate', size: '850 KB', uploadDate: '15/05/2026', status: 'Verified' },
    { id: 'doc-3', name: 'Aadhaar_Card_Student.pdf', category: 'Identity Proof', size: '450 KB', uploadDate: '20/06/2026', status: 'Verified' },
    { id: 'doc-4', name: 'Class_9_Marksheet_Final.pdf', category: 'Marksheet', size: '2.1 MB', uploadDate: '10/07/2026', status: 'Verified' }
  ]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StudentDocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<StudentDocumentItem | null>(null);

  // Form states for Upload/Edit document
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Birth Certificate');
  const [docFile, setDocFile] = useState<File | null>(null);

  const { feePayments, examMarks, updateStudent } = useData();
  const { addToast } = useToast();

  if (!isOpen || !student) return null;

  const studentPayments = feePayments.filter(p => p.studentId === student.id);

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
    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    updateStudent(student.id, { avatar: defaultAvatar });
    addToast('info', 'Photo Removed', 'Reset to default student avatar');
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
      status: 'Verified'
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
    const dummyContent = `Sample document content for ${doc.name} (Category: ${doc.category})`;
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

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'parents', label: 'Guardian', icon: Users },
    { id: 'academics', label: 'Academic', icon: BookOpen },
    { id: 'transport', label: 'Bus Route', icon: Bus },
    { id: 'fees', label: 'Fee History', icon: IndianRupee },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'exams', label: 'Exam Marks', icon: Award },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'promotions', label: 'Promotion Log', icon: History },
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
              <img
                src={student.avatar}
                alt=""
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <label className="p-1.5 rounded-lg bg-white/30 hover:bg-white/50 text-white cursor-pointer" title="Replace Photo">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <button onClick={handleRemoveAvatar} className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white" title="Remove Photo">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">{student.firstName} {student.lastName}</h2>
                <Badge variant={student.status === 'Active' ? 'success' : 'warning'} size="sm">
                  {student.status}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-brand-100">
                Class {student.className}-{student.section} • Roll: <strong className="text-white">{student.rollNo}</strong> • Adm: <strong className="text-white">{student.admissionNo}</strong> • <span className="font-bold text-amber-300">{student.branch || 'Main Campus'}</span>
              </p>
              <div className="flex items-center gap-4 pt-1 text-xs text-white/90 flex-wrap">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 opacity-80" /> {student.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 opacity-80" /> {student.phone}</span>
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
                <div><span className="text-slate-400 block font-semibold">Date of Birth (DD/MM/YYYY):</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.dob}</p></div>
                <div><span className="text-slate-400 block font-semibold">Gender:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.gender}</p></div>
                <div><span className="text-slate-400 block font-semibold">Blood Group:</span> <p className="font-bold text-rose-500 mt-1 text-sm">{student.bloodGroup}</p></div>
                <div><span className="text-slate-400 block font-semibold">Religion:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.religion || 'General'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Caste Category:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.casteCategory || 'General'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Student Type:</span> <p className="font-bold text-brand-600 dark:text-brand-400 mt-1 text-sm">{student.studentType || 'Day Scholar'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Branch / Campus:</span> <p className="font-bold text-amber-600 dark:text-amber-400 mt-1 text-sm">{student.branch || 'Main Campus'}</p></div>
                <div><span className="text-slate-400 block font-semibold">Joining Date:</span> <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{student.joiningDate}</p></div>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-600" /> Complete Residential Address:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm leading-relaxed">{student.address}</p>
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
                  <p className="font-black text-slate-900 dark:text-white text-base">{student.fatherName}</p>
                  <p className="text-slate-500 font-medium">Occupation: {student.fatherOccupation}</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-2 pt-1 text-xs">
                    <Phone className="w-4 h-4 text-brand-600" /> {student.fatherPhone}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block">Mother Details</span>
                  <p className="font-black text-slate-900 dark:text-white text-base">{student.motherName}</p>
                  <p className="text-slate-500 font-medium">Mother</p>
                  <p className="text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-2 pt-1 text-xs">
                    <Phone className="w-4 h-4 text-sky-600" /> {student.motherPhone}
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
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2 font-mono">{student.gpa} / 4.0</p>
                </div>
                <div className="p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-wider text-sky-600 dark:text-sky-400">Attendance Percentage</p>
                  <p className="text-3xl font-black text-sky-700 dark:text-sky-300 mt-2 font-mono">{student.attendancePct}%</p>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">Class Rank</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2 font-mono">3rd / 42</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Bus Route Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Transport & Bus Allocation</h3>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Student Category:</span>
                  <Badge variant={student.studentType === 'Hosteller' ? 'warning' : 'info'}>{student.studentType || 'Day Scholar'}</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Assigned Bus Route:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{student.busRoute || 'Route 4 - Central City Express'}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-semibold">Pickup Point:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.pickupPoint || 'Main Campus Stop A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Drop Point:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.dropPoint || 'Greenwood Circle Stop B'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. FEE HISTORY TAB (INR Rupee Symbol, Structure, Payments Ledger) */}
          {activeTab === 'fees' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Complete Fee History & Payment Ledger</h3>
                <span className="text-xs font-bold text-slate-500">Academic Year 2026-2027</span>
              </div>

              {/* Fee Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fee Assigned</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{formatCurrency(student.totalFee || 45000)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total Payments Completed</span>
                  <p className="text-xl font-black text-emerald-600 font-mono">{formatCurrency(student.paidFee || ((student.totalFee || 45000) - (student.dueFee || 10000)))}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Outstanding Balance Due</span>
                  <p className="text-xl font-black text-rose-500 font-mono">{formatCurrency(student.dueFee || 10000)}</p>
                </div>
              </div>

              {/* Assigned Fee Structure Breakdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Assigned Fee Structure Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Fee Component</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Total Amount</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Balance Due</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Tuition Fee</td>
                        <td className="p-3 text-slate-500">Annual</td>
                        <td className="p-3 font-mono font-semibold">{formatCurrency(30000)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{formatCurrency(25000)}</td>
                        <td className="p-3 font-mono text-rose-500 font-bold">{formatCurrency(5000)}</td>
                        <td className="p-3 text-right"><Badge variant="warning" size="sm">Partial</Badge></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Development & Activity Fee</td>
                        <td className="p-3 text-slate-500">Annual</td>
                        <td className="p-3 font-mono font-semibold">{formatCurrency(5000)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{formatCurrency(5000)}</td>
                        <td className="p-3 font-mono text-slate-400">{formatCurrency(0)}</td>
                        <td className="p-3 text-right"><Badge variant="success" size="sm">Paid</Badge></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Library & Computer Lab Fee</td>
                        <td className="p-3 text-slate-500">Annual</td>
                        <td className="p-3 font-mono font-semibold">{formatCurrency(3000)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{formatCurrency(3000)}</td>
                        <td className="p-3 font-mono text-slate-400">{formatCurrency(0)}</td>
                        <td className="p-3 text-right"><Badge variant="success" size="sm">Paid</Badge></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Examination Fee</td>
                        <td className="p-3 text-slate-500">Per Term</td>
                        <td className="p-3 font-mono font-semibold">{formatCurrency(2000)}</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">{formatCurrency(2000)}</td>
                        <td className="p-3 font-mono text-slate-400">{formatCurrency(0)}</td>
                        <td className="p-3 text-right"><Badge variant="success" size="sm">Paid</Badge></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Transport / Bus Fee</td>
                        <td className="p-3 text-slate-500">Annual</td>
                        <td className="p-3 font-mono font-semibold">{formatCurrency(5000)}</td>
                        <td className="p-3 font-mono text-slate-400">{formatCurrency(0)}</td>
                        <td className="p-3 font-mono text-rose-500 font-bold">{formatCurrency(5000)}</td>
                        <td className="p-3 text-right"><Badge variant="danger" size="sm">Pending</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Completed Payment Receipts Ledger */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Completed Payments & Receipts History</h4>
                <div className="space-y-2.5">
                  {(studentPayments.length > 0 ? studentPayments : [
                    { id: 'pay-1', receiptNo: 'REC-2026-104', paymentDate: '10/04/2026', amountPaid: 20000, paymentMode: 'UPI / Online', status: 'Paid' },
                    { id: 'pay-2', receiptNo: 'REC-2026-218', paymentDate: '15/07/2026', amountPaid: 15000, paymentMode: 'Net Banking', status: 'Paid' }
                  ]).map(p => (
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
              </div>
            </div>
          )}

          {/* 6. FULL ATTENDANCE DATA TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Full Attendance Record & Calendar</h3>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200">
                  {student.attendancePct}% Overall Attendance
                </span>
              </div>

              {/* Attendance Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Present</span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">165 Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Absent</span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 font-mono">8 Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Late / Half Day</span>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">4 Days</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Approved Leave</span>
                  <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-1 font-mono">3 Days</p>
                </div>
              </div>

              {/* Monthly Breakdown Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Monthly Attendance Percentage Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                    <span className="text-slate-400 block font-semibold">April 2026</span>
                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">95.2%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                    <span className="text-slate-400 block font-semibold">May 2026</span>
                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">98.0%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                    <span className="text-slate-400 block font-semibold">June 2026</span>
                    <span className="font-black text-amber-600 text-sm mt-0.5 block">92.5%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-center">
                    <span className="text-slate-400 block font-semibold">July 2026</span>
                    <span className="font-black text-emerald-600 text-sm mt-0.5 block">96.4%</span>
                  </div>
                </div>
              </div>

              {/* Recent Daily Attendance Log */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Recent Daily Attendance Logs</h4>
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
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">27/07/2026</td>
                        <td className="p-3 text-slate-500">Monday</td>
                        <td className="p-3"><Badge variant="success" size="sm">Present</Badge></td>
                        <td className="p-3 text-slate-500">Full Day</td>
                        <td className="p-3 text-right text-slate-400">On Time</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">24/07/2026</td>
                        <td className="p-3 text-slate-500">Friday</td>
                        <td className="p-3"><Badge variant="success" size="sm">Present</Badge></td>
                        <td className="p-3 text-slate-500">Full Day</td>
                        <td className="p-3 text-right text-slate-400">On Time</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">23/07/2026</td>
                        <td className="p-3 text-slate-500">Thursday</td>
                        <td className="p-3"><Badge variant="warning" size="sm">Late Entry</Badge></td>
                        <td className="p-3 text-slate-500">First Half</td>
                        <td className="p-3 text-right text-amber-600 font-semibold">Bus Delay (15 min)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">22/07/2026</td>
                        <td className="p-3 text-slate-500">Wednesday</td>
                        <td className="p-3"><Badge variant="success" size="sm">Present</Badge></td>
                        <td className="p-3 text-slate-500">Full Day</td>
                        <td className="p-3 text-right text-slate-400">On Time</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">21/07/2026</td>
                        <td className="p-3 text-slate-500">Tuesday</td>
                        <td className="p-3"><Badge variant="info" size="sm">Approved Leave</Badge></td>
                        <td className="p-3 text-slate-500">Full Day</td>
                        <td className="p-3 text-right text-sky-600 font-semibold">Medical Leave Approved</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. ALL EXAMINATION HISTORY TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">All Examination History & Report Cards</h3>
                <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200">
                  GPA {student.gpa} / 4.0
                </span>
              </div>

              {/* Exam 1: Annual Examination */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Annual Examination 2025-2026</h4>
                    <p className="text-[11px] text-slate-500">Academic Term: Final Term • Result Date: 28/03/2026</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-600 font-mono text-sm">547 / 600 (91.17%)</span>
                    <Badge variant="success" size="sm">Passed (A+)</Badge>
                    <button
                      onClick={() => addToast('success', 'Download Started', 'Downloading Annual Examination Report Card PDF')}
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
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Mathematics</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">92</td>
                        <td className="p-3 font-bold text-emerald-600">A+</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Science & Technology</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">88</td>
                        <td className="p-3 font-bold text-emerald-600">A</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">English Language & Literature</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">95</td>
                        <td className="p-3 font-bold text-emerald-600">A+</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Social Studies</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">84</td>
                        <td className="p-3 font-bold text-emerald-600">A</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Computer Applications</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">98</td>
                        <td className="p-3 font-bold text-emerald-600">A+</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam 2: Mid-Term Examination */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">Mid-Term Examination 2026</h4>
                    <p className="text-[11px] text-slate-500">Academic Term: Term 1 • Result Date: 15/10/2025</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-600 font-mono text-sm">530 / 600 (88.33%)</span>
                    <Badge variant="success" size="sm">Passed (A)</Badge>
                    <button
                      onClick={() => addToast('success', 'Download Started', 'Downloading Mid-Term Examination Report Card PDF')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 shadow-sm"
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
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Mathematics</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">90</td>
                        <td className="p-3 font-bold text-emerald-600">A+</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">Science</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">85</td>
                        <td className="p-3 font-bold text-emerald-600">A</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">English</td>
                        <td className="p-3">100</td>
                        <td className="p-3">35</td>
                        <td className="p-3 font-mono font-bold text-brand-600">92</td>
                        <td className="p-3 font-bold text-emerald-600">A+</td>
                        <td className="p-3 text-right"><span className="text-emerald-600 font-bold">Pass</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. DOCUMENTS TAB (Upload, Edit, Preview, View, Download) */}
          {activeTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Student Documents & Certificates</h3>
                  <p className="text-[11px] text-slate-500">Manage, preview, edit, or download student certificates and identification files.</p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Upload Document
                </button>
              </div>

              {/* Documents List */}
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

                    {/* Action Controls: Preview, Edit, Download, Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-600" /> View
                      </button>
                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setDocTitle(doc.name);
                          setDocCategory(doc.category);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-600" /> Edit
                      </button>
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

          {/* 10. Student ID Card Tab */}
          {activeTab === 'idcard' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Official Student Identity Card</h3>
                <button
                  onClick={() => setIsIDCardModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Full-Screen Print & PDF
                </button>
              </div>

              {/* ID Card Card Preview */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4 max-w-sm mx-auto font-sans">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-sm">ST</div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-white">St. Xavier's International</h4>
                    <p className="text-[9px] text-brand-300">Empowering Minds, Shaping Tomorrow</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <img src={student.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm">{student.firstName} {student.lastName}</h3>
                    <p className="text-[10px] text-slate-300">Class: <strong className="text-white">{student.className}-{student.section}</strong></p>
                    <p className="text-[10px] font-mono text-slate-400">Adm: {student.admissionNo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-800/80 text-[10px]">
                  <div><span className="text-slate-400 block">DOB:</span><span className="font-bold">{student.dob}</span></div>
                  <div><span className="text-slate-400 block">Blood:</span><span className="font-bold text-rose-400">{student.bloodGroup}</span></div>
                  <div><span className="text-slate-400 block">Father Mobile:</span><span className="font-bold text-emerald-400">{student.fatherPhone}</span></div>
                  <div><span className="text-slate-400 block">Branch:</span><span className="font-bold text-amber-300">{student.branch || 'Main Campus'}</span></div>
                </div>

                <div className="text-[9px] text-center text-slate-400 border-t border-slate-800 pt-2">
                  742 Evergreen Terrace, Knowledge City, NY 10001 • Ph: +1 (555) 019-2834
                </div>
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
                  placeholder="e.g. Birth_Certificate_2026.pdf"
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
                  type="file"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setDocFile(f);
                      if (!docTitle) setDocTitle(f.name);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                />
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
            <div className="p-8 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{previewDoc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Category: {previewDoc.category} • {previewDoc.size}</p>
                <div className="mt-2"><Badge variant="success" size="sm">{previewDoc.status}</Badge></div>
              </div>
              <p className="text-[11px] text-slate-400 italic">Document is verified and securely stored in student repository.</p>
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
    </div>
  );
};
