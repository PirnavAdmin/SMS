import React, { useState } from 'react';
import {
  X, User, Users, BookOpen, DollarSign, Calendar, Award, FileText,
  Phone, Mail, MapPin, Bus, Camera, Trash2, CheckCircle, Shield,
  Printer, Download, History
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

export const StudentProfileDrawer: React.FC<StudentProfileDrawerProps> = ({
  student,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'parents' | 'academics' | 'transport' | 'fees' | 'attendance' | 'exams' | 'docs' | 'idcard' | 'promotions'>('personal');
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const { feePayments, examMarks, updateStudent } = useData();
  const { addToast } = useToast();

  if (!isOpen || !student) return null;

  const studentPayments = feePayments.filter(p => p.studentId === student.id);
  const studentMarks = examMarks.filter(m => m.studentId === student.id);

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

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'parents', label: 'Guardian', icon: Users },
    { id: 'academics', label: 'Academic', icon: BookOpen },
    { id: 'transport', label: 'Bus Route', icon: Bus },
    { id: 'fees', label: 'Fee History', icon: DollarSign },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'exams', label: 'Exam Marks', icon: Award },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'promotions', label: 'Promotion Log', icon: History },
    { id: 'idcard', label: 'Student ID Card', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Profile Top Header */}
        <div className="p-6 bg-gradient-to-r from-brand-600 to-indigo-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={student.avatar}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <label className="p-1.5 rounded-lg bg-white/30 hover:bg-white/50 text-white cursor-pointer" title="Replace Photo">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <button onClick={handleRemoveAvatar} className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white" title="Remove Photo">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold">{student.firstName} {student.lastName}</h2>
                <Badge variant={student.status === 'Active' ? 'success' : 'warning'} size="sm">
                  {student.status}
                </Badge>
              </div>
              <p className="text-xs text-brand-100 mt-0.5">
                {student.className}-{student.section} • Roll: {student.rollNo} • Adm: {student.admissionNo} • <span className="font-bold text-amber-300">{student.branch || 'Main Campus'}</span>
              </p>
              <div className="flex items-center gap-4 mt-2 text-[11px] text-white/90">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal & Identification Details</h3>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div><span className="text-slate-400">Date of Birth (DD/MM/YYYY):</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student.dob}</p></div>
                <div><span className="text-slate-400">Gender:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student.gender}</p></div>
                <div><span className="text-slate-400">Blood Group:</span> <p className="font-bold text-rose-500 mt-0.5">{student.bloodGroup}</p></div>
                <div><span className="text-slate-400">Religion:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student.religion || 'Not specified'}</p></div>
                <div><span className="text-slate-400">Caste Category:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student.casteCategory || 'General'}</p></div>
                <div><span className="text-slate-400">Student Type:</span> <p className="font-bold text-brand-600 dark:text-brand-400 mt-0.5">{student.studentType || 'Day Scholar'}</p></div>
                <div><span className="text-slate-400">Branch / Campus:</span> <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{student.branch || 'Main Campus'}</p></div>
                <div><span className="text-slate-400">Joining Date:</span> <p className="font-bold text-slate-900 dark:text-white mt-0.5">{student.joiningDate}</p></div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Complete Residential Address:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">{student.address}</p>
              </div>
            </div>
          )}

          {/* Student ID Card Tab (Replaces Activity Log) */}
          {activeTab === 'idcard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Student Identity Card</h3>
                <button
                  onClick={() => setIsIDCardModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Full-Screen Print & PDF
                </button>
              </div>

              {/* ID Card Card Preview */}
              <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4 max-w-sm mx-auto font-sans">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black">ST</div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wider text-white">St. Xavier's International</h4>
                    <p className="text-[9px] text-brand-300">Empowering Minds, Shaping Tomorrow</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <img src={student.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm">{student.firstName} {student.lastName}</h3>
                    <p className="text-[10px] text-slate-300">Class: <strong className="text-white">{student.className}-{student.section}</strong></p>
                    <p className="text-[10px] font-mono text-slate-400">Adm: {student.admissionNo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/80 text-[10px]">
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

          {/* Promotion History Log */}
          {activeTab === 'promotions' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Promotion & Branch Transfer History</h3>
              {(!student.promotionHistory || student.promotionHistory.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No promotion or branch transfer recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {student.promotionHistory.map(ph => (
                    <div key={ph.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
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

          {/* Bus Route Tab */}
          {activeTab === 'transport' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transport & Bus Allocation</h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Student Type:</span>
                  <Badge variant={student.studentType === 'Hosteller' ? 'warning' : 'info'}>{student.studentType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Bus Route:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{student.busRoute}</span>
                </div>
                {student.pickupPoint && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pickup Point:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.pickupPoint}</span>
                  </div>
                )}
                {student.dropPoint && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Drop Point:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.dropPoint}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Parents Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Parent & Guardian Information</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{student.fatherName}</p>
                  <p className="text-slate-500">Father • {student.fatherOccupation}</p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1 font-mono font-bold text-brand-600">
                    <Phone className="w-3.5 h-3.5" /> Father Phone: {student.fatherPhone}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{student.motherName}</p>
                  <p className="text-slate-500">Mother</p>
                  <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1"><Phone className="w-3.5 h-3.5 text-brand-600" /> {student.motherPhone}</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Academic Details */}
          {activeTab === 'academics' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Standing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Current Cumulative GPA</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{student.gpa} / 4.0</p>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-sky-600">Attendance Percentage</p>
                  <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-1">{student.attendancePct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Fee History */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Ledger & Receipts</h3>
                <span className="text-xs font-bold text-rose-500">Outstanding Due: INR {student.dueFee}</span>
              </div>
              <div className="space-y-2">
                {studentPayments.map(p => (
                  <div key={p.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.receiptNo}</p>
                      <p className="text-slate-500">{p.paymentDate} • {p.paymentMode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-600">INR {p.amountPaid}</p>
                      <Badge variant="success" size="sm">{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Attendance */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Record</h3>
              <p className="text-xs font-bold text-emerald-600">{student.attendancePct}% Present</p>
            </div>
          )}

          {/* 6. Exams */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Exam Results</h3>
              <div className="space-y-2">
                {studentMarks.map(m => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between text-xs">
                    <div><p className="font-bold text-slate-900 dark:text-white">{m.subject}</p></div>
                    <div className="text-right"><p className="font-black text-brand-600">{m.marksObtained}/100 ({m.grade})</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Documents */}
          {activeTab === 'docs' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Student Certificates</h3>
              <div className="space-y-2">
                {['Birth_Certificate_Official.pdf', 'Previous_School_TC.pdf'].map(doc => (
                  <div key={doc} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <span className="font-medium">{doc}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Printable Student ID Card Modal */}
      <PrintableIDCard
        student={student}
        isOpen={isIDCardModalOpen}
        onClose={() => setIsIDCardModalOpen(false)}
      />
    </div>
  );
};
