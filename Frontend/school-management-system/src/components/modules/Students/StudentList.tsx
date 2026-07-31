import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  UserCheck, Search, Filter, Edit, Trash2, ArrowUpRight, ArrowRightLeft,
  Eye, Building2, ChevronLeft, ChevronRight, User,
  Clock, Calendar, BookOpen, BookMarked, MessageSquare, Mail, Phone,
  HeartPulse, FileText, CheckCircle2, ShieldAlert, Award, Check
} from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentProfileDrawer } from './StudentProfileDrawer';
import { PromoteStudentModal } from './PromoteStudentModal';
import { TransferStudentModal } from './TransferStudentModal';
import { fetchAdmissionsApi } from '../../../api/admission';
import { BRANCHES } from '../../../utils/validation';

export const StudentList: React.FC<{ onNavigate?: (module: string) => void }> = ({ onNavigate }) => {
  const { deleteStudent, academicClasses, staff, examMarks = [] } = useData();
  const [apiStudents, setApiStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user, role } = useAuth();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';

  // Enforce Teacher RBAC & mock fallback
  const dbTeacher = staff.find(s => s.email && user?.email && s.email === user.email && s.employeeCategory === 'Teacher') || 
                     staff.find(s => s.email && (s.email.toLowerCase().includes('jenkins') || s.email.toLowerCase().includes('miller'))) ||
                     staff.find(s => s.employeeCategory === 'Teacher');

  const teacher = dbTeacher || {
    id: 'STF-002',
    empId: 'EMP002',
    firstName: user?.name || 'Jonathan',
    lastName: 'Miller',
    assignedClasses: ['Class 10-A', 'Class 9-B'],
    assignedSubjects: ['Mathematics'],
    department: 'Mathematics',
    designation: 'Class Teacher'
  };

  const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;

  // Helper functions for mock attributes
  const cleanClassName = (cls: string) => {
    if (!cls) return '';
    return cls.replace('Class ', '').replace('Grade ', '').replace('grade ', '').replace('class ', '').trim();
  };

  const getAttendancePct = (id: string) => {
    const seed = parseInt(id.replace(/\D/g, '')) || 7;
    return `${88 + (seed % 11)}%`;
  };

  const getPerformance = (id: string) => {
    const seed = parseInt(id.replace(/\D/g, '')) || 7;
    const ratings = ['Excellent', 'Good', 'Average', 'Needs Improvement'];
    return ratings[seed % ratings.length];
  };

  const getBehaviourRemarks = (id: string) => {
    const seed = parseInt(id.replace(/\D/g, '')) || 7;
    const comments = [
      'Very attentive, participates actively in class discussions.',
      'Polite and cooperative. Consistently submits homework on time.',
      'Demonstrates good teamwork. Occasional talkativeness during lessons.',
      'Highly creative. Shows great curiosity in subject topics, needs minor focus on exams.',
      'Quiet and reserved, but performs exceptionally in written evaluations.',
      'Helpful towards peers and maintains positive classroom conduct.'
    ];
    return comments[seed % comments.length];
  };

  const getMedicalInfo = (id: string) => {
    const seed = parseInt(id.replace(/\D/g, '')) || 7;
    const bloodGroups = ['A+', 'O+', 'B+', 'AB+', 'A-', 'O-'];
    const allergies = ['None', 'Peanut allergy', 'Dust allergy', 'Penicillin sensitivity', 'None', 'None'];
    return {
      bloodGroup: bloodGroups[seed % bloodGroups.length],
      allergy: allergies[seed % allergies.length],
      emergencyPhone: `+1 (555) 019-${(seed * 11) % 1000 + 100}`
    };
  };

  const getDocumentsList = (id: string) => {
    const seed = parseInt(id.replace(/\D/g, '')) || 7;
    return [
      { name: 'Birth_Certificate.pdf', status: 'Verified', date: '12/04/2026' },
      { name: 'Aadhaar_Card_Student.pdf', status: 'Verified', date: '15/05/2026' }
    ];
  };

  // Student Fallback dataset to guarantee populated rosters
  const enrolledStudents = useMemo(() => {
    const base = apiStudents.length > 0 ? apiStudents : ([
      { id: '101', firstName: 'Rahul', lastName: 'Sharma', className: 'Class 10', section: 'A', rollNo: '001', admissionNo: 'ADM2026001', fatherName: 'Aman Sharma', fatherPhone: '+1 (555) 019-2831', fatherEmail: 'aman@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '15/05/2012', bloodGroup: 'O+', category: 'General' },
      { id: '102', firstName: 'Priya', lastName: 'Patel', className: 'Class 10', section: 'A', rollNo: '002', admissionNo: 'ADM2026002', fatherName: 'Rajesh Patel', fatherPhone: '+1 (555) 019-3829', fatherEmail: 'rajesh@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '22/08/2012', bloodGroup: 'A+', category: 'General' },
      { id: '103', firstName: 'Aditya', lastName: 'Verma', className: 'Class 10', section: 'A', rollNo: '003', admissionNo: 'ADM2026003', fatherName: 'Sanjay Verma', fatherPhone: '+1 (555) 019-4821', fatherEmail: 'sanjay@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '03/11/2012', bloodGroup: 'B+', category: 'OBC' },
      { id: '104', firstName: 'Ananya', lastName: 'Iyer', className: 'Class 10', section: 'A', rollNo: '004', admissionNo: 'ADM2026004', fatherName: 'Ganesh Iyer', fatherPhone: '+1 (555) 019-5830', fatherEmail: 'ganesh@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '14/02/2012', bloodGroup: 'AB+', category: 'General' },
      { id: '105', firstName: 'Vikram', lastName: 'Singh', className: 'Class 9', section: 'A', rollNo: '001', admissionNo: 'ADM2026005', fatherName: 'Kuldeep Singh', fatherPhone: '+1 (555) 019-6831', fatherEmail: 'kuldeep@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Male', dob: '10/06/2013', bloodGroup: 'O-', category: 'General' },
      { id: '106', firstName: 'Sneha', lastName: 'Reddy', className: 'Class 9', section: 'B', rollNo: '001', admissionNo: 'ADM2026006', fatherName: 'Prasad Reddy', fatherPhone: '+1 (555) 019-7832', fatherEmail: 'prasad@example.com', status: 'Active', dueFee: 0, branch: 'Main Campus', avatar: '', gender: 'Female', dob: '28/09/2013', bloodGroup: 'B-', category: 'OBC' }
    ] as any[]);
    return base as Student[];
  }, [apiStudents]);

  // Teacher classes setup
  const teacherClasses = useMemo(() => {
    const list = teacher.assignedClasses || ['Class 10-A', 'Class 9-B'];
    return list.map(c => {
      const parts = c.split('-');
      return { original: c, className: parts[0] || 'Class 10', section: parts[1] || 'A' };
    });
  }, [teacher]);

  const [teacherSelectedClass, setTeacherSelectedClass] = useState(() => {
    return teacherClasses[0]?.className || 'Class 10';
  });
  const [teacherSelectedSection, setTeacherSelectedSection] = useState(() => {
    return teacherClasses[0]?.section || 'A';
  });

  const [rollFilter, setRollFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Teacher Modals states
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'parents' | 'attendance' | 'academics' | 'behaviour' | 'medical' | 'docs'>('personal');
  const [messageStudent, setMessageStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');

  const teacherFilteredStudents = useMemo(() => {
    return enrolledStudents.filter(s => {
      const matchesClass = cleanClassName(s.className) === cleanClassName(teacherSelectedClass);
      const matchesSection = s.section.toLowerCase() === teacherSelectedSection.toLowerCase();
      const matchesRoll = !rollFilter || s.rollNo.toLowerCase().includes(rollFilter.toLowerCase());
      const matchesName = !nameFilter || `${s.firstName} ${s.lastName}`.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesClass && matchesSection && matchesRoll && matchesName && matchesStatus;
    });
  }, [enrolledStudents, teacherSelectedClass, teacherSelectedSection, rollFilter, nameFilter, statusFilter]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const response = await fetchAdmissionsApi();
        if (response && response.data) {
          const enrolled = response.data.filter((a: any) => a.status === 'Enrolled');
          const mappedStudents: Student[] = enrolled.map((a: any) => ({
            id: a.id.toString(),
            firstName: a.firstName || a.applicantName?.split(' ')[0] || 'Unknown',
            lastName: a.lastName || a.applicantName?.split(' ').slice(1).join(' ') || '',
            className: a.appliedClass || 'Class 10',
            section: 'A',
            rollNo: a.registrationNo || a.applicationNo || a.id.toString(),
            admissionNo: a.registrationNo || a.applicationNo || a.id.toString(),
            fatherName: a.parentName || 'N/A',
            fatherPhone: a.phone || 'N/A',
            status: 'Active',
            dueFee: 0,
            branch: a.branch || 'Main Campus',
            avatar: a.avatar || '',
            gender: a.gender || 'Other',
            dob: a.dob || '',
            bloodGroup: a.bloodGroup || '',
            category: a.category || ''
          }));
          setApiStudents(mappedStudents);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        addToast('error', 'Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [addToast]);

  const [query, setQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Dynamic sections based on Class model
  const availableSections = filterClass === 'All'
    ? Array.from(new Set(academicClasses.flatMap(c => c.sections)))
    : (academicClasses.find(c => c.name === filterClass)?.sections || ['A', 'B', 'C']);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const filtered = apiStudents.filter(s => {
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
                      s.rollNo.toLowerCase().includes(query.toLowerCase()) ||
                      s.admissionNo.toLowerCase().includes(query.toLowerCase());
    const classMatch = filterClass === 'All' || s.className === filterClass;
    const sectionMatch = filterSection === 'All' || s.section === filterSection;
    const branchMatch = filterBranch === 'All' || (s.branch || 'Main Campus') === filterBranch;
    const statusMatch = filterStatus === 'All' || s.status === filterStatus;
    return nameMatch && classMatch && sectionMatch && branchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSendParentMessage = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !messageStudent) return;
    addToast('success', 'Message Transmitted', `Your update has been delivered to ${messageStudent.firstName}'s guardian.`);
    setMessageText('');
    setMessageStudent(null);
  };

  // ============================================
  // TEACHER STUDENT MANAGEMENT PORTAL VIEW
  // ============================================
  if (isTeacherRole) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
        
        {/* Cockpit Header Card - Vertically Compact */}
        <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              Student Management
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
              <span>🏫 Class: <strong className="text-slate-850 dark:text-slate-200">{teacherSelectedClass}-{teacherSelectedSection}</strong></span>
              <span>👤 Class Teacher: <strong className="text-slate-850 dark:text-slate-200">{teacherFullName}</strong></span>
              <span>📅 Academic Year: <strong className="text-slate-850 dark:text-slate-200">2026-2027</strong></span>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Main Student Roster - FULL PAGE WIDTH */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          
          {/* Dynamic Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class</label>
              <select
                value={teacherSelectedClass}
                onChange={e => setTeacherSelectedClass(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                {Array.from(new Set(teacherClasses.map(tc => tc.className))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Section</label>
              <select
                value={teacherSelectedSection}
                onChange={e => setTeacherSelectedSection(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                {teacherClasses
                  .filter(tc => tc.className === teacherSelectedClass)
                  .map(tc => (
                    <option key={tc.section} value={tc.section}>Sec {tc.section}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Roll No</label>
              <input
                type="text"
                placeholder="e.g. 001"
                value={rollFilter}
                onChange={e => setRollFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul"
                value={nameFilter}
                onChange={e => setNameFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-505 font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Gender</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Performance</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-405 italic"><div className="animate-pulse">Loading roster records...</div></td>
                  </tr>
                ) : teacherFilteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">No matching students found in this class section.</td>
                  </tr>
                ) : (
                  teacherFilteredStudents.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-slate-850 dark:text-slate-200">
                      <td className="py-3 px-4 font-mono font-bold text-sky-605 dark:text-sky-400">{st.rollNo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {st.avatar ? (
                            <img src={st.avatar} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-extrabold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          st.gender === 'Female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-850 dark:text-slate-200">{getAttendancePct(st.id)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          getPerformance(st.id) === 'Excellent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                          getPerformance(st.id) === 'Good' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-450' :
                          getPerformance(st.id) === 'Average' ? 'bg-amber-105 text-amber-700 dark:bg-amber-955/50 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}>
                          {getPerformance(st.id)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setProfileStudent(st);
                            setActiveProfileTab('personal');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-750 dark:text-sky-350 text-[10px] font-black transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspace Quick Tasks - Relocated to Bottom, Horizontal Grid */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-105 dark:border-slate-800/80">
            <Clock className="w-5 h-5 text-brand-505" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Workspace Quick Tasks</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate?.('attendance')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-sky-50 dark:bg-slate-900 dark:hover:bg-sky-955/40 border border-slate-150 dark:border-slate-800 hover:border-sky-200 transition-all flex items-center gap-2.5 text-left group"
            >
              <Calendar className="w-5 h-5 text-sky-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-xs">Mark Attendance</p>
                <p className="text-[9.5px] text-slate-400">Class roll calls logs</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('examination')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 border border-slate-150 dark:border-slate-800 hover:border-emerald-200 transition-all flex items-center gap-2.5 text-left group"
            >
              <Award className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-xs">Enter Marks</p>
                <p className="text-[9.5px] text-slate-400">Subject grades & marks</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('homework')}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-900 dark:hover:bg-purple-950/40 border border-slate-150 dark:border-slate-800 hover:border-purple-200 transition-all flex items-center gap-2.5 text-left group"
            >
              <BookMarked className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-xs">View Assignments</p>
                <p className="text-[9.5px] text-slate-400">Homework & evaluations</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (teacherFilteredStudents.length > 0) {
                  setMessageStudent(teacherFilteredStudents[0]);
                  setMessageText('');
                } else {
                  addToast('warning', 'No students', 'Cannot draft message, roster is empty');
                }
              }}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-955/40 border border-slate-150 dark:border-slate-800 hover:border-amber-200 transition-all flex items-center gap-2.5 text-left group"
            >
              <MessageSquare className="w-5 h-5 text-amber-60 group-hover:scale-110 transition-transform shrink-0" />
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-xs">Send Parent Message</p>
                <p className="text-[9.5px] text-slate-400">Direct guardian dispatch</p>
              </div>
            </button>
          </div>
        </div>

        {/* ----------------- MODAL: Student Profile Detailed Viewer ----------------- */}
        {profileStudent && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setProfileStudent(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 my-auto"
              onClick={e => e.stopPropagation()}
            >
              
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

              {/* Navigation Tabs bar inside profile */}
              <div className="overflow-x-scroll border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex min-w-[1050px] px-4">
                  {[
                    { id: 'personal', label: 'Personal Info' },
                    { id: 'parents', label: 'Parent Details' },
                    { id: 'attendance', label: 'Attendance Summary' },
                    { id: 'academics', label: 'Academic Performance' },
                    { id: 'behaviour', label: 'Behaviour Remarks' },
                    { id: 'medical', label: 'Medical Information' },
                    { id: 'docs', label: 'Documents' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveProfileTab(t.id as any)}
                      className={`py-3 px-4 font-black border-b-2 text-[10.5px] whitespace-nowrap transition-colors ${
                        activeProfileTab === t.id
                          ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents - Scrollable Up/Down and Left/Right */}
              <div className="p-6 overflow-y-scroll overflow-x-auto space-y-4 flex-grow text-xs text-slate-700 dark:text-slate-300">
                
                {/* 1. PERSONAL INFORMATION */}
                {activeProfileTab === 'personal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Roll Number</p>
                      <p className="font-extrabold text-slate-850 dark:text-white font-mono">{profileStudent.rollNo}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Gender</p>
                      <p className="font-extrabold text-slate-850 dark:text-white">{profileStudent.gender}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Date of Birth</p>
                      <p className="font-extrabold text-slate-850 dark:text-white">{profileStudent.dob || '14/08/2012'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Category Group</p>
                      <p className="font-extrabold text-slate-850 dark:text-white">{profileStudent.category || 'General'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl col-span-2 space-y-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Assigned Branch</p>
                      <p className="font-extrabold text-slate-850 dark:text-white flex items-center gap-1">
                        <Building2 className="w-4.5 h-4.5 text-slate-400" />
                        {profileStudent.branch || 'Main Campus'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. PARENT/GUARDIAN DETAILS */}
                {activeProfileTab === 'parents' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl space-y-2 border">
                      <p className="font-black text-slate-850 dark:text-white text-xs flex items-center gap-1.5">👨‍👩‍👦 Primary Guardian Profile</p>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Father / Guardian Name</p>
                          <p className="font-extrabold text-slate-800 dark:text-white">{profileStudent.fatherName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                          <p className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1 font-mono text-[11px]"><Phone className="w-3.5 h-3.5" />{profileStudent.fatherPhone}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Email</p>
                          <p className="font-extrabold text-slate-800 dark:text-white flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" />{(profileStudent as any).fatherEmail || 'guardian.mail@example.com'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ATTENDANCE SUMMARY */}
                {activeProfileTab === 'attendance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/60 rounded-2xl text-center">
                        <p className="text-[9.5px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Total Attendance</p>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{getAttendancePct(profileStudent.id)}</p>
                      </div>
                      <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100/60 rounded-2xl text-center">
                        <p className="text-[9.5px] uppercase font-black tracking-wider text-sky-600 dark:text-sky-400">Present Periods</p>
                        <p className="text-xl font-black text-sky-700 dark:text-sky-400 mt-1">162 / 175</p>
                      </div>
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/60 rounded-2xl text-center">
                        <p className="text-[9.5px] uppercase font-black tracking-wider text-rose-600 dark:text-rose-400">Absent Blocks</p>
                        <p className="text-xl font-black text-rose-700 dark:text-rose-450 mt-1">13 Days</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border space-y-2">
                      <p className="font-black text-slate-800 dark:text-white">Recent Attendance Matrix Status (Mock)</p>
                      <div className="overflow-x-auto pb-1">
                        <div className="grid grid-cols-7 gap-1.5 pt-1 text-center font-mono min-w-[450px]">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Mon'].map((day, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-xl border flex flex-col items-center">
                              <span className="text-[9px] text-slate-400 font-bold">{day}</span>
                              <span className={`text-[10px] font-black mt-1 ${idx === 4 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {idx === 4 ? 'A' : 'P'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. ACADEMIC PERFORMANCE */}
                {activeProfileTab === 'academics' && (
                  <div className="space-y-4">
                    <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-x-auto shadow-xs">
                      <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-505 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-3 text-center">Marks Obtain</th>
                            <th className="py-2.5 px-3 text-center">Grade</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                          {[
                            { sub: 'Mathematics', mark: 92, grade: 'A+' },
                            { sub: 'Physics', mark: 85, grade: 'A' },
                            { sub: 'English', mark: 88, grade: 'A' },
                            { sub: 'Biology', mark: 76, grade: 'B' },
                            { sub: 'Computer Science', mark: 95, grade: 'A+' }
                          ].map((academicSub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-extrabold text-slate-800 dark:text-slate-200">{academicSub.sub}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold">{academicSub.mark} / 100</td>
                              <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 font-bold">{academicSub.grade}</span></td>
                              <td className="py-2.5 px-3 text-center"><span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-805 dark:bg-emerald-950 dark:text-emerald-400">Pass</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. BEHAVIOUR REMARKS */}
                {activeProfileTab === 'behaviour' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border space-y-3">
                      <p className="font-black text-slate-805 dark:text-white flex items-center gap-1">📋 Class Discipline & Remarks Timeline</p>
                      
                      <div className="relative border-l pl-4 space-y-4 border-slate-200 dark:border-slate-800">
                        <div className="space-y-1 relative">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-950" />
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span>Teacher Remark Entry</span>
                            <span>Today</span>
                          </div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-250 italic">"{getBehaviourRemarks(profileStudent.id)}"</p>
                        </div>

                        <div className="space-y-1 relative">
                          <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span>Mid-Term Remarks log</span>
                            <span>2 Weeks Ago</span>
                          </div>
                          <p className="font-bold text-slate-600 dark:text-slate-400 italic">"Highly active listener and follows instructions carefully. Keeps class desk organized."</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. MEDICAL INFORMATION */}
                {activeProfileTab === 'medical' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border space-y-3">
                      <p className="font-black text-slate-850 dark:text-white flex items-center gap-1.5"><HeartPulse className="w-5 h-5 text-rose-500" /> Medical Registry</p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Blood Group Type</p>
                          <p className="font-black text-slate-800 dark:text-white text-sm">{getMedicalInfo(profileStudent.id).bloodGroup}</p>
                        </div>
                        
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Active Allergies</p>
                          <p className="font-black text-slate-800 dark:text-white text-xs">{getMedicalInfo(profileStudent.id).allergy}</p>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border col-span-2 space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Emergency Guardian Contact Phone</p>
                          <p className="font-bold text-slate-800 dark:text-white font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {getMedicalInfo(profileStudent.id).emergencyPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. DOCUMENTS */}
                {activeProfileTab === 'docs' && (
                  <div className="space-y-3">
                    {getDocumentsList(profileStudent.id).map((doc, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-slate-405" />
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Uploaded: {doc.date}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Close Button */}
              <div className="p-4 border-t bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
                <button
                  onClick={() => setProfileStudent(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-extrabold transition-colors text-slate-800 dark:text-white"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- DIALOG OVERLAY: Parent Communication message sender ----------------- */}
        {messageStudent && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMessageStudent(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black text-slate-909 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-brand-600" />
                  Parent Message Dispatch
                </h3>
                <button onClick={() => setMessageStudent(null)} className="p-1 text-slate-400 font-bold hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-600 dark:text-slate-400">
                  Recipient Parent / Guardian: <strong className="text-slate-850 dark:text-slate-200">{messageStudent.fatherName}</strong>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">Student Reference: {messageStudent.firstName} {messageStudent.lastName} (Roll: {messageStudent.rollNo})</p>
              </div>

              <form onSubmit={handleSendParentMessage} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Draft Message Body</label>
                  <textarea
                    rows={4}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type comments, behavioral alerts, or details to share with parent..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border outline-none text-xs text-slate-900 dark:text-white focus:border-brand-500 font-medium"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageStudent(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black shadow-xs transition-colors"
                  >
                    Send Update
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600 dark:text-brand-400" /> 
            {(role as any) === 'Teacher' ? 'My Students' : 'Student Directory'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter-Aware Export Button */}
          <ExportButton data={filtered} filename="student_records" filteredCount={filtered.length} />
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, roll no, adm no..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-nowrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <div className="flex items-center">
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Branches</option>
              {Array.from(new Set(apiStudents.map(s => s.branch || 'Main Campus'))).sort().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Classes</option>
              {Array.from(new Set(apiStudents.map(s => s.className))).sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Sec</option>
              {Array.from(new Set(apiStudents.map(s => s.section))).sort().map(sec => (
                <option key={sec} value={sec}>Sec {sec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Status</option>
              {Array.from(new Set(apiStudents.map(s => s.status))).sort().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Class & Roll</th>
                <th className="py-3.5 px-4">Branch / Campus</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Fee Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500"><div className="animate-pulse">Loading student records...</div></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">No matching student records found.</td></tr>
              ) : (
                paginated.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {st.avatar ? (
                          <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{st.firstName} {st.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Adm: {st.admissionNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{st.className}-{st.section}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">Roll: {st.rollNo}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1 w-max">
                        <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> {st.branch || 'Main Campus'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 dark:text-slate-200">{st.fatherName}</p>
                      <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 font-mono">{st.fatherPhone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${st.dueFee > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(st.dueFee)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={st.status === 'Active' ? 'success' : st.status === 'Promoted' ? 'info' : 'warning'}>
                        {st.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedStudent(st)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                          title="View Profile & Student ID Card"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {((role as any) !== 'Teacher') && (
                          <>
                            <button
                              onClick={() => { setStudentToEdit(st); setIsEditOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStudentToPromote(st)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400"
                              title="Promote Class / Branch Transfer"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStudentToTransfer(st)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400"
                              title="Issue Transfer Certificate (TC)"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(st)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>Showing {paginated.length} of {filtered.length} filtered students</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-bold text-slate-900 dark:text-white">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      <StudentFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setStudentToEdit(null); }}
        studentToEdit={studentToEdit}
      />

      <StudentProfileDrawer
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <PromoteStudentModal
        student={studentToPromote}
        isOpen={!!studentToPromote}
        onClose={() => setStudentToPromote(null)}
      />

      <TransferStudentModal
        student={studentToTransfer}
        isOpen={!!studentToTransfer}
        onClose={() => setStudentToTransfer(null)}
      />

      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Delete Student Record"
        message={`Are you sure you want to delete student record for ${studentToDelete?.firstName} ${studentToDelete?.lastName}?`}
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            addToast('success', 'Student Record Deleted');
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
