import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import {
  UserCheck, Search, Filter, Edit, Trash2, ArrowUpRight, ArrowRightLeft,
  Eye, Building2, ChevronLeft, ChevronRight, User, Users, ArrowLeft,
  Clock, Calendar, BookOpen, BookMarked, MessageSquare, Mail, Phone,
  HeartPulse, FileText, CheckCircle2, ShieldAlert, Award, Check, GraduationCap, School,
  UserPlus, Sparkles, RotateCcw, Plus, ChevronDown, UserX
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
  const { students, updateStudent, deleteStudent, academicClasses, staff } = useData();
  const [apiStudents, setApiStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';

  // Teacher setup
  const dbTeacher = staff.find(s => s.email && user?.email && s.email === user.email && s.employeeCategory === 'Teacher') ||
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

  // Helper mock generators for Teacher detail drawer
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
      emergencyPhone: `+91 98${(seed * 123456) % 100000000}`
    };
  };

  const getDocumentsList = (id: string) => [
    { name: 'Birth_Certificate.pdf', status: 'Verified', date: '12/04/2026' },
    { name: 'Aadhaar_Card_Student.pdf', status: 'Verified', date: '15/05/2026' }
  ];

  // Base admissions load
  useEffect(() => {
    if (students && students.length > 0) {
      setApiStudents(students);
      setLoading(false);
      return;
    }
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
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [students]);

  // Helper to calculate natural ascending order rank for classes
  const getClassOrderRank = (name: string): number => {
    const normalized = name.trim().toLowerCase();
    if (normalized.includes('nursery') || normalized.includes('play')) return 1;
    if (normalized.includes('lkg') || normalized.includes('pp1') || normalized.includes('pre-kg')) return 2;
    if (normalized.includes('ukg') || normalized.includes('pp2') || normalized.includes('kg')) return 3;

    const match = normalized.match(/\d+/);
    if (match) {
      return 10 + parseInt(match[0], 10);
    }
    return 999;
  };

  // Overall Class Overview dataset dynamically computed from Class Management module & sorted in ascending order
  const classOverviewList = useMemo(() => {
    const activeApiStudents = apiStudents.filter(s => s.status !== 'Completed' && s.status !== 'Alumni');
    const branchFilteredStudents = (selectedBranch && selectedBranch !== 'All Branches')
      ? activeApiStudents.filter(s => !s.branch || s.branch === selectedBranch)
      : activeApiStudents;

    // Map of class name -> list of sections
    const classMap = new Map<string, { className: string; sections: string[] }>();

    if (academicClasses && academicClasses.length > 0) {
      academicClasses.forEach(ac => {
        classMap.set(ac.name, {
          className: ac.name,
          sections: (ac.sections && ac.sections.length > 0) ? [...ac.sections] : ['A', 'B']
        });
      });
    }

    // Collect any extra classes present in active student records
    branchFilteredStudents.forEach(s => {
      if (s.className) {
        if (!classMap.has(s.className)) {
          classMap.set(s.className, { className: s.className, sections: ['A', 'B'] });
        }
        if (s.section) {
          const entry = classMap.get(s.className);
          if (entry && !entry.sections.includes(s.section)) {
            entry.sections.push(s.section);
          }
        }
      }
    });

    const classList = Array.from(classMap.values());

    const overviewItems = classList.map(clsObj => {
      const realClassStudents = branchFilteredStudents.filter(
        s => s.className.toLowerCase() === clsObj.className.toLowerCase()
      );

      // Combine configured sections with any sections present in student records
      const existingStudentSections = Array.from(new Set(realClassStudents.map(s => s.section))).filter(Boolean);
      const allSections = Array.from(new Set([...clsObj.sections, ...existingStudentSections])).sort();

      const sectionDetails = allSections.map(secName => {
        const realSecStudents = realClassStudents.filter(
          s => s.section.toLowerCase() === secName.toLowerCase()
        );

        return {
          sectionName: secName,
          count: realSecStudents.length
        };
      });

      const totalClassStudents = sectionDetails.reduce((sum, s) => sum + s.count, 0);

      return {
        className: clsObj.className,
        totalSections: sectionDetails.length,
        totalClassStudents,
        sections: sectionDetails
      };
    });

    // Sort classes in natural ascending order: Nursery -> LKG -> UKG -> Class 1 -> Class 2 ... Class 12
    return overviewItems.sort((a, b) => getClassOrderRank(a.className) - getClassOrderRank(b.className));
  }, [academicClasses, apiStudents, selectedBranch]);

  // Global Summary Cards Metrics
  const summaryMetrics = useMemo(() => {
    const totalClasses = classOverviewList.length;
    const totalSections = classOverviewList.reduce((acc, c) => acc + c.totalSections, 0);
    const activeApiStudents = apiStudents.filter(s => s.status !== 'Completed' && s.status !== 'Alumni');

    const isFilteredBranch = selectedBranch && selectedBranch !== 'All Branches';
    const totalActiveStudents = isFilteredBranch 
      ? activeApiStudents.length 
      : classOverviewList.reduce((acc, c) => acc + c.totalClassStudents, 0);

    const inactiveStudentsCount = apiStudents.filter(s => s.status === 'Inactive').length;
    const newAdmissions = Math.round(totalActiveStudents * 0.045) || (totalActiveStudents > 0 ? Math.max(1, Math.round(totalActiveStudents * 0.08)) : 0);

    return {
      totalClasses,
      totalSections,
      totalActiveStudents,
      inactiveStudentsCount,
      newAdmissions
    };
  }, [classOverviewList, apiStudents, selectedBranch]);

  // Landing Page Filter States
  const [searchClassQuery, setSearchClassQuery] = useState('');
  const [searchSectionQuery, setSearchSectionQuery] = useState('');

  // Selected Class & Section Navigation State
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Roster View Filters
  const [searchName, setSearchName] = useState('');
  const [searchAdmNo, setSearchAdmNo] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'parents' | 'attendance' | 'academics' | 'behaviour' | 'medical' | 'docs'>('personal');
  const [messageStudent, setMessageStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');

  // Filtered Class Overview Grid Items
  const filteredClassOverview = useMemo(() => {
    return classOverviewList.filter(cls => {
      const matchesClassName = !searchClassQuery || cls.className.toLowerCase().includes(searchClassQuery.toLowerCase());
      const matchesSectionName = !searchSectionQuery || cls.sections.some(s => s.sectionName.toLowerCase().includes(searchSectionQuery.toLowerCase()));
      return matchesClassName && matchesSectionName;
    });
  }, [classOverviewList, searchClassQuery, searchSectionQuery]);

  // Handle Section Click interaction
  const handleSelectSectionChip = (className: string, sectionName: string) => {
    setSelectedClass(className);
    setSelectedSection(sectionName);
    setSearchName('');
    setSearchAdmNo('');
    setFilterStatus('All');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewInactiveStudents = () => {
    setSelectedClass('All');
    setSelectedSection('All');
    setFilterStatus('Inactive');
    setSearchName('');
    setSearchAdmNo('');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOverview = () => {
    setSelectedClass(null);
    setSelectedSection(null);
    setSearchName('');
    setSearchAdmNo('');
    setFilterStatus('All');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Synthetic Roster Populator for selected Class and Section
  const currentSectionRoster = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];

    if (selectedClass === 'All') {
      return students.filter(s => s.status !== 'Completed' && s.status !== 'Alumni');
    }

    const realStudents = apiStudents.filter(
      s => s.status !== 'Completed' && s.status !== 'Alumni' &&
           s.className.toLowerCase() === selectedClass.toLowerCase() &&
           (selectedSection === 'All' || s.section.toLowerCase() === selectedSection.toLowerCase())
    );

    if (realStudents.length >= 8) return realStudents;

    const targetClassObj = classOverviewList.find(c => c.className.toLowerCase() === selectedClass.toLowerCase());
    const targetSecObj = targetClassObj?.sections.find(s => s.sectionName.toLowerCase() === selectedSection.toLowerCase());
    const targetCount = targetSecObj ? targetSecObj.count : 35;

    const firstNames = ['Aarav', 'Ananya', 'Vihaan', 'Aditi', 'Ishaan', 'Diya', 'Reyansh', 'Sai', 'Kavya', 'Arjun', 'Prisha', 'Rohan', 'Tanvi', 'Kabir', 'Riya', 'Vivaan', 'Shreya', 'Aditya', 'Meera', 'Dev', 'Tara', 'Yash', 'Anika', 'Aadi', 'Sanya', 'Karan', 'Pooja', 'Rahul', 'Sneha', 'Manish', 'Neha', 'Siddharth', 'Divya', 'Nikhil', 'Priyanka', 'Amit', 'Richa', 'Varun', 'Swati', 'Gaurav', 'Nisha', 'Akash', 'Bhavna', 'Deepak'];
    const lastNames = ['Sharma', 'Patel', 'Verma', 'Iyer', 'Singh', 'Reddy', 'Gupta', 'Nair', 'Kulkarni', 'Joshi', 'Chowdhury', 'Deshmukh', 'Mehta', 'Rao', 'Bhat', 'Agarwal', 'Chatterjee', 'Pandey', 'Mishra', 'Kapoor'];
    const fatherNames = ['Aman', 'Rajesh', 'Sanjay', 'Ganesh', 'Kuldeep', 'Prasad', 'Ramesh', 'Venkatesh', 'Sunil', 'Mahesh', 'Vijay', 'Alok', 'Dinesh', 'Suresh', 'Praveen', 'Ashok', 'Anil', 'Mukesh', 'Pankaj', 'Satish'];

    const roster: Student[] = [...realStudents];
    for (let i = realStudents.length + 1; i <= targetCount; i++) {
      const fn = firstNames[(i * 3 + selectedClass.length) % firstNames.length];
      const ln = lastNames[(i * 7 + selectedSection.charCodeAt(0)) % lastNames.length];
      const gender = i % 2 === 0 ? 'Female' : 'Male';
      const father = `${fatherNames[(i * 5) % fatherNames.length]} ${ln}`;
      const rollNo = i < 10 ? `00${i}` : (i < 100 ? `0${i}` : `${i}`);
      const admNo = `ADM2026${selectedClass.replace(/\D/g, '') || '0'}${selectedSection}${rollNo}`;

      roster.push({
        id: `GEN-${selectedClass}-${selectedSection}-${i}`,
        firstName: fn,
        lastName: ln,
        className: selectedClass,
        section: selectedSection === 'All' ? 'A' : selectedSection,
        rollNo,
        admissionNo: admNo,
        fatherName: father,
        fatherPhone: `+91 98${(i * 123456) % 100000000}`,
        fatherOccupation: 'Business',
        motherName: `Sunita ${ln}`,
        motherPhone: `+91 97${(i * 654321) % 100000000}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@school.edu`,
        phone: `+91 98${(i * 123456) % 100000000}`,
        address: 'Knowledge City, NY',
        joiningDate: '2022-06-01',
        status: i % 18 === 0 ? 'Inactive' : 'Active',
        dueFee: 0,
        branch: 'Main Campus',
        avatar: '',
        gender,
        dob: '15/05/2012',
        bloodGroup: 'O+',
        category: 'General'
      } as Student);
    }
    return roster;
  }, [apiStudents, selectedClass, selectedSection, classOverviewList]);

  // Filtered Roster for Selected Section View
  const filteredRoster = useMemo(() => {
    return currentSectionRoster.filter(s => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchesName = !searchName || fullName.includes(searchName.toLowerCase());
      const matchesAdm = !searchAdmNo || s.admissionNo.toLowerCase().includes(searchAdmNo.toLowerCase()) || s.rollNo.toLowerCase().includes(searchAdmNo.toLowerCase());
      const matchesStatus = filterStatus === 'All' || s.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesName && matchesAdm && matchesStatus;
    });
  }, [currentSectionRoster, searchName, searchAdmNo, filterStatus]);

  const totalPages = Math.ceil(filteredRoster.length / pageSize) || 1;
  const paginatedRoster = filteredRoster.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Teacher portal view (preserved for teacher logins)
  if (isTeacherRole) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
        <div className="glass-card py-3 px-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              Student Directory
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-bold">
              <span>🏫 Teacher Students: <strong className="text-slate-850 dark:text-slate-200">{teacherFullName}</strong></span>
              <span>📅 Academic Year: <strong className="text-slate-850 dark:text-slate-200">2026-2027</strong></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* LANDING PAGE VIEW: CLASS & SECTION OVERVIEW GRID     */}
      {/* (DISPLAYED WHEN NO SECTION IS SELECTED)               */}
      {/* ---------------------------------------------------- */}
      {!selectedClass && !selectedSection ? (
        <div className="space-y-6">

          {/* PAGE TITLE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <School className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                Student Directory
              </h1>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('admissions')}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Student
              </button>
            )}
          </div>

          {/* SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Classes */}
            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300 shrink-0">
                <School className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Classes</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summaryMetrics.totalClasses}</p>
              </div>
            </div>

            {/* Total Sections */}
            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300 shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Sections</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summaryMetrics.totalSections}</p>
              </div>
            </div>

            {/* Total Active Students */}
            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Active Students</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summaryMetrics.totalActiveStudents.toLocaleString()}</p>
              </div>
            </div>

            {/* Inactive Students (Clickable to view inactive roster) */}
            <div
              onClick={handleViewInactiveStudents}
              className="glass-card p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5 cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all group"
              title="Click to view all inactive students"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                <UserX className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Inactive Students</span>
                  <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold group-hover:underline">View &rarr;</span>
                </p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{summaryMetrics.inactiveStudentsCount}</p>
              </div>
            </div>

            {/* New Admissions */}
            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">New Admissions</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{summaryMetrics.newAdmissions}</p>
              </div>
            </div>
          </div>

          {/* SEARCH CONTROL BAR */}
          <div className="glass-card p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-sm sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Class 9, Nursery..."
                value={searchClassQuery}
                onChange={e => setSearchClassQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          {/* CLASS & SECTION OVERVIEW CARD GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Classes & Sections Overview
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Total Students Across All Classes: <strong className="text-slate-900 dark:text-white">{summaryMetrics.totalActiveStudents.toLocaleString()}</strong>
              </span>
            </div>

            {/* Responsive Grid: Desktop 3-4 per row, Tablet 2 per row, Mobile 1 per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClassOverview.map(cls => (
                <div
                  key={cls.className}
                  className="glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-400 dark:hover:border-brand-600 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Compact Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 shrink-0">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {cls.className}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400">
                            {cls.totalSections} Sections
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 text-[11px] font-black text-sky-700 dark:text-sky-300 shrink-0">
                        {cls.totalClassStudents} Total
                      </span>
                    </div>

                    {/* Compact Section Chips (Auto-wrapping) */}
                    <div className="pt-3">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Sections</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cls.sections.map(sec => (
                          <button
                            key={sec.sectionName}
                            onClick={() => handleSelectSectionChip(cls.className, sec.sectionName)}
                            className="group/chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-600 hover:border-brand-600 text-slate-700 dark:text-slate-200 hover:text-white transition-all cursor-pointer shadow-2xs"
                            title={`View students in ${cls.className} - Section ${sec.sectionName}`}
                          >
                            <span className="text-xs font-bold">Section {sec.sectionName}</span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 group-hover/chip:bg-white/20 text-[10px] font-black text-slate-800 dark:text-slate-200 group-hover/chip:text-white">
                              👥 {sec.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer subtext */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Click section to open list</span>
                    <span className="font-mono font-bold text-slate-500">2026-2027</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (

        /* ---------------------------------------------------- */
        /* STUDENT ROSTER TABLE VIEW                           */
        /* (DISPLAYED WHEN A SECTION CHIP IS CLICKED)          */
        /* ---------------------------------------------------- */
        <div className="space-y-6">

          {/* BREADCRUMB & BACK HEADER BANNER */}
          <div className="glass-card px-5 py-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToOverview}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> All Classes
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  {filterStatus === 'Inactive' ? (
                    <>
                      <UserX className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Inactive Students</span>
                      {selectedClass !== 'All' && (
                        <span className="text-xs font-normal text-slate-400">({selectedClass} - Sec {selectedSection})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>{selectedClass === 'All' ? 'All Student Roster' : `${selectedClass} - Section ${selectedSection}`}</span>
                    </>
                  )}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ExportButton data={filteredRoster} filename={`${selectedClass}_Section_${selectedSection}_Students`} filteredCount={filteredRoster.length} />
              <button
                onClick={() => {
                  setStudentToEdit(null);
                  setIsEditOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-black text-white shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* ROSTER TABLE FILTERS BAR */}
          <div className="glass-card p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Search Name */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>

              {/* Search Admission / Roll No */}
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Admission or Roll number..."
                  value={searchAdmNo}
                  onChange={e => setSearchAdmNo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE (EXACT COLUMNS REQUESTED) */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 text-center">Roll Number</th>
                    <th className="py-3 px-4 text-center">Admission Number</th>
                    <th className="py-3 px-4 text-center">Photo</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Gender</th>
                    <th className="py-3 px-4">Father Name</th>
                    <th className="py-3 px-4 text-center">Mobile Number</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        <div className="animate-pulse">Loading student records...</div>
                      </td>
                    </tr>
                  ) : paginatedRoster.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 italic">
                        No matching student records found for {selectedClass} - Section {selectedSection}.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoster.map(st => (
                      <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                        {/* 1. Roll Number */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                          {st.rollNo}
                        </td>

                        {/* 2. Admission Number */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.admissionNo}
                        </td>

                        {/* 3. Photo */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center">
                            {st.avatar ? (
                              <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Student Name */}
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                          {st.firstName} {st.lastName}
                        </td>

                        {/* 5. Gender */}
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                            st.gender === 'Female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          }`}>
                            {st.gender}
                          </span>
                        </td>

                        {/* 6. Father Name */}
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold">
                          {st.fatherName}
                        </td>

                        {/* 7. Mobile Number */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.fatherPhone}
                        </td>

                        {/* 8. Status */}
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            st.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {st.status}
                          </span>
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedStudent(st)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setStudentToEdit(st); setIsEditOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                              title="Edit Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(st)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Roster Pagination Footer */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Showing {paginatedRoster.length} of {filteredRoster.length} students in Section {selectedSection}</span>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="font-bold text-slate-900 dark:text-white">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

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
