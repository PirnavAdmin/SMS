import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import * as XLSX from 'xlsx';
import {
  UserCheck, Search, Filter, Edit, Trash2, ArrowUpRight, ArrowRightLeft,
  Eye, Building2, ChevronLeft, ChevronRight, User, Users, ArrowLeft,
  Clock, Calendar, BookOpen, BookMarked, MessageSquare, Mail, Phone,
  HeartPulse, FileText, CheckCircle2, ShieldAlert, Award, Check, GraduationCap, School,
  UserPlus, Sparkles, RotateCcw, Plus, ChevronDown, UserX, Upload, Download, FileSpreadsheet, Home
} from 'lucide-react';
import { Student } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import { StudentFormModal } from './StudentFormModal';
import { StudentProfileDrawer } from './StudentProfileDrawer';
import { PromoteStudentModal } from './PromoteStudentModal';
import { TransferStudentModal } from './TransferStudentModal';
import { AcademicHistoryImportModal } from './AcademicHistoryImportModal';
import { fetchAdmissionsApi } from '../../../api/admission';
import { BRANCHES } from '../../../utils/validation';
import { Pagination } from '../../common/Pagination';



export const StudentList: React.FC<{ onNavigate?: (module: string) => void }> = ({ onNavigate }) => {
  const { students, updateStudent, deleteStudent, academicClasses, staff, fetchStudents, applications = [], teacherAssignments = [], timetable = [] } = useData();
  const [apiStudents, setApiStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user, role, selectedBranch, selectedAcademicYear } = useAuth();

  const isTeacherRole = (role as any) === 'Teacher' || (role as any) === 'Class Teacher';
  const isWardenRole = ((user?.role || role || '') as string).toLowerCase().includes('warden');

  // Filter staff to teaching staff ONLY (exclude drivers, peons, conductors)
  const teachingStaff = useMemo(() => {
    return staff.filter(s => {
      const desig = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      return !desig.includes('driver') && !desig.includes('conductor') && !desig.includes('peon') && !dept.includes('transport');
    });
  }, [staff]);

  // Match current logged in teacher staff record
  const teacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    if (userEmail) {
      const byEmail = teachingStaff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    if (userName && !userName.includes('admin') && !userName.includes('driver')) {
      const byName = teachingStaff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        return (sFullName && sFullName === userName) || (sName && sName === userName);
      });
      if (byName) return byName;
    }

    if (user?.id) {
      const byId = teachingStaff.find(s => s.id === user.id);
      if (byId) return byId;
    }

    // Dynamic fallback matching logged-in user context
    const rawName = user?.name || '';
    const nameParts = rawName.trim() ? rawName.trim().split(' ') : [];
    return {
      id: user?.id || (user as any)?.empId || '',
      empId: (user as any)?.empId || user?.id || '',
      firstName: nameParts[0] || (user as any)?.firstName || '',
      lastName: nameParts.slice(1).join(' ') || (user as any)?.lastName || '',
      assignedClasses: (user as any)?.assignedClasses || [],
      assignedSubjects: (user as any)?.assignedSubjects || [],
      department: (user as any)?.department || '',
      designation: (user as any)?.designation || 'Class Teacher'
    };
  }, [user, teachingStaff]);

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

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        await fetchStudents();
      } catch (err: any) {
        console.error('Failed to fetch students:', err);
        addToast('error', 'Fetch Failed', 'Could not retrieve students database directory.');
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  useEffect(() => {
    if (isWardenRole) {
      setApiStudents(students.filter(s =>
        (s as any).studentType === 'Hosteller' ||
        (s as any).studentType === 'Residential' ||
        (s as any).isHosteller ||
        (s as any).studentType !== 'Day Scholar'
      ));
    } else {
      setApiStudents(students);
    }
  }, [students, isWardenRole]);

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

  // Dynamically map student record overlay for selected Academic Year without mutating master profile
  const displayStudents = useMemo(() => {
    // Merge admissions applications from main admin panel into student directory
    const admittedFromApps: Student[] = (applications || [])
      .filter(app => (app.status === 'Approved' || app.status === 'Admitted' || app.status === 'Enrolled'))
      .map(app => ({
        id: app.id || `ADM-${Date.now()}`,
        firstName: app.studentName ? app.studentName.split(' ')[0] : (app.firstName || 'Student'),
        lastName: app.studentName ? app.studentName.split(' ').slice(1).join(' ') : (app.lastName || ''),
        className: app.applyingForClass || app.className || 'Class 1',
        section: app.section || 'A',
        rollNo: app.rollNo || app.applicationNumber?.replace(/\D/g, '').slice(-3) || '01',
        admissionNo: app.applicationNumber || app.admissionNo || `ADM2026-${app.id?.slice(-4) || '001'}`,
        fatherName: app.parentName || app.fatherName || 'Parent / Guardian',
        fatherPhone: app.phone || app.parentPhone || '+91 9876543210',
        email: app.email || '',
        phone: app.phone || '',
        address: app.address || '',
        joiningDate: app.applicationDate || '2026-06-01',
        status: 'Active',
        dueFee: 0,
        branch: app.branch || 'Main Campus',
        gender: app.gender || 'Male',
        dob: app.dob || '2012-01-01',
        bloodGroup: app.bloodGroup || 'O+'
      }));

    const existingIds = new Set(students.map(s => s.id || s.admissionNo));
    const newAdmissions = admittedFromApps.filter(s => !existingIds.has(s.id) && !existingIds.has(s.admissionNo));
    const allCombined = [...students, ...newAdmissions];

    const mapped = allCombined.map((s) => {
      if (!selectedAcademicYear || selectedAcademicYear === 'All') return s;
      const historyItem = s.academicHistory?.find((h) => h.academicYear === selectedAcademicYear);
      if (historyItem) {
        return {
          ...s,
          className: historyItem.className,
          section: historyItem.section,
          rollNo: historyItem.rollNo || s.rollNo,
          status: historyItem.status as any,
        };
      }
      return s;
    });

    if (isWardenRole) {
      return mapped.filter(s =>
        (s as any).studentType === 'Hosteller' ||
        (s as any).studentType === 'Residential' ||
        (s as any).isHosteller ||
        (s as any).studentType !== 'Day Scholar'
      );
    }

    return mapped;
  }, [students, applications, selectedAcademicYear, isWardenRole]);

  // Overall Class Overview dataset dynamically computed from Class Management module & sorted in ascending order
  const classOverviewList = useMemo(() => {
    const activeApiStudents = displayStudents.filter(s => s.status !== 'Completed' && s.status !== 'Alumni');
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

    // Dynamically update section and class lists from student records
    branchFilteredStudents.forEach(s => {
      if (s.className) {
        if (!classMap.has(s.className)) {
          classMap.set(s.className, {
            className: s.className,
            sections: s.section ? [s.section] : ['A']
          });
        } else if (s.section) {
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

  // Teacher Portal Filter States - STRICTLY assigned classes from Admin Staff Database, Assignments & Timetable
  const teacherAssignedClasses = useMemo(() => {
    const tName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.toLowerCase().trim();

    // Admin Academic Assignments (Class-Teacher or Subject-Teacher mappings)
    const fromAssignments = (teacherAssignments || [])
      .filter((ta: any) => {
        const nameMatch = ta.teacherName && (ta.teacherName.toLowerCase().includes(tName) || tName.includes(ta.teacherName.toLowerCase()));
        const idMatch = ta.teacherId && (String(ta.teacherId) === String(teacher.id) || String(ta.teacherId) === String((teacher as any).empId));
        return nameMatch || idMatch;
      })
      .map((ta: any) => {
        const cls = (ta.className || '').trim();
        const sec = (ta.section || '').trim();
        return sec ? `${cls}-${sec}` : cls;
      });

    // Admin Timetable slots assigned to this teacher
    const fromTimetable = (timetable || [])
      .filter((t: any) => t.teacherName && (t.teacherName.toLowerCase().includes(tName) || tName.includes(t.teacherName.toLowerCase())))
      .map((t: any) => {
        const cls = (t.className || '').trim();
        const sec = (t.section || '').trim();
        return sec ? `${cls}-${sec}` : cls;
      });

    let raw = (teacher as any).assignedClasses || (teacher as any).classes || (teacher as any).assignedClass || [];
    if (typeof raw === 'string') raw = [raw];

    const merged = Array.from(new Set([...raw, ...fromAssignments, ...fromTimetable])).filter(Boolean);

    const cleaned = merged.map((c: any) => {
      let str = String(c || '').trim();
      if (!str.toLowerCase().startsWith('class')) str = `Class ${str}`;
      return str;
    }).filter((c: string) => !c.toLowerCase().includes('nursery') && !c.toLowerCase().includes('lkg') && !c.toLowerCase().includes('ukg'));

    return cleaned.length > 0 ? Array.from(new Set(cleaned)) : ['Class 10-A', 'Class 9-B', 'Class 6-A'];
  }, [teacher, teacherAssignments, timetable]);

  const [teacherSelectedClass, setTeacherSelectedClass] = useState('Class 10');
  const [teacherSelectedSection, setTeacherSelectedSection] = useState('A');
  const [teacherHasSearched, setTeacherHasSearched] = useState(false);
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);
  const [teacherPageSize, setTeacherPageSize] = useState(10);

  // Dynamic Class options for Teacher Filter - PURE Class names ONLY for assigned workload
  const teacherClassOptions = useMemo(() => {
    const set = new Set<string>();
    (teacherAssignedClasses || []).forEach(ac => {
      let mainCls = ac.split('-')[0].trim();
      if (mainCls) {
        if (!mainCls.toLowerCase().startsWith('class')) {
          mainCls = `Class ${mainCls}`;
        }
        if (!mainCls.toLowerCase().includes('nursery') && !mainCls.toLowerCase().includes('lkg') && !mainCls.toLowerCase().includes('ukg')) {
          set.add(mainCls);
        }
      }
    });
    const list = Array.from(set).sort((a, b) => getClassOrderRank(a) - getClassOrderRank(b));
    return list.length > 0 ? list : ['Class 10', 'Class 9', 'Class 6'];
  }, [teacherAssignedClasses]);

  // Dynamic Section options for Teacher Filter - STRICTLY assigned sections for selected class
  const teacherSectionOptions = useMemo(() => {
    const sections = new Set<string>();
    (teacherAssignedClasses || []).forEach(ac => {
      const parts = ac.split('-');
      let clsName = parts[0].trim();
      if (!clsName.toLowerCase().startsWith('class')) clsName = `Class ${clsName}`;
      const sec = parts[1] ? parts[1].trim() : 'A';

      const selectedClsNum = teacherSelectedClass.replace(/^class\s*/i, '').trim().toLowerCase();
      const clsNum = clsName.replace(/^class\s*/i, '').trim().toLowerCase();

      if (teacherSelectedClass === 'All Assigned Classes' || selectedClsNum === clsNum) {
        sections.add(sec);
      }
    });

    const list = Array.from(sections).sort();
    return list.length > 0 ? list : ['A'];
  }, [teacherAssignedClasses, teacherSelectedClass]);

  // Auto-sync section selection when class changes to default directly to assigned section
  useEffect(() => {
    if (teacherSectionOptions.length > 0) {
      setTeacherSelectedSection(teacherSectionOptions[0]);
    }
  }, [teacherSelectedClass, teacherSectionOptions]);

  // Roster View Filters
  const [searchName, setSearchName] = useState('');
  const [searchAdmNo, setSearchAdmNo] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToPromote, setStudentToPromote] = useState<Student | null>(null);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);

  // Excel Template Downloader for Student Imports
  const handleDownloadStudentTemplate = () => {
    const data = [
      {
        'Admission No': 'ADM2026-001',
        'First Name': 'Aarav',
        'Last Name': 'Sharma',
        'Class': 'Class 10',
        'Section': 'A',
        'Roll No': '101',
        'Gender': 'Male',
        'Date of Birth': '2012-05-15',
        'Father Name': 'Rajesh Sharma',
        'Father Mobile': '9876543210',
        'Mother Name': 'Sunita Sharma',
        'Email': 'aarav.sharma@gmail.com',
        'Branch': 'Main Campus',
        'Student Type': 'Day Scholar',
        'Status': 'Active'
      },
      {
        'Admission No': 'ADM2026-002',
        'First Name': 'Ananya',
        'Last Name': 'Patel',
        'Class': 'Class 10',
        'Section': 'B',
        'Roll No': '102',
        'Gender': 'Female',
        'Date of Birth': '2012-08-20',
        'Father Name': 'Sanjay Patel',
        'Father Mobile': '9876543211',
        'Mother Name': 'Meena Patel',
        'Email': 'ananya.patel@gmail.com',
        'Branch': 'Main Campus',
        'Student Type': 'Residential',
        'Status': 'Active'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Import_Template');
    XLSX.writeFile(workbook, 'Student_Import_Template.xlsx');
    addToast('info', 'Template Downloaded', 'Sample Excel template downloaded successfully.');
  };
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

  // Dynamic Roster for selected Class and Section
  const currentSectionRoster = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];

    if (selectedClass === 'All') {
      const activeList = apiStudents.filter(s => s.status !== 'Completed' && s.status !== 'Alumni');
      if (isWardenRole) {
        return activeList.filter(s =>
          (s as any).studentType === 'Hosteller' ||
          (s as any).studentType === 'Residential' ||
          (s as any).isHosteller ||
          (s as any).studentType !== 'Day Scholar'
        );
      }
      return activeList;
    }

    return apiStudents.filter(
      s => s.status !== 'Completed' && s.status !== 'Alumni' &&
           s.className.toLowerCase() === selectedClass.toLowerCase() &&
           (selectedSection === 'All' || s.section.toLowerCase() === selectedSection.toLowerCase())
    );
  }, [apiStudents, selectedClass, selectedSection, isWardenRole]);

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

  // Teacher portal view (full interactive student directory)
  if (isTeacherRole) {
    // Filter students for teacher
    const myStudents = (displayStudents || []).filter(s => {
      const q = searchName.toLowerCase().trim();
      const matchesQuery = !q || 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || 
        (s.admissionNo || '').toLowerCase().includes(q) || 
        (s.rollNo || '').toLowerCase().includes(q);

      // STRICT RULE: Student MUST belong to one of the teacher's assigned classes
      const isAssigned = teacherAssignedClasses.some(ac => {
        const cleanAcClass = ac.split('-')[0].replace(/^class\s*/i, '').trim().toLowerCase();
        const sCls = (s.className || '').replace(/^class\s*/i, '').trim().toLowerCase();
        return cleanAcClass === sCls;
      });

      if (!isAssigned) return false;

      // Filter by selected pure class
      let matchesClass = false;
      if (teacherSelectedClass === 'All Assigned Classes') {
        matchesClass = true;
      } else {
        const selectedClsNum = teacherSelectedClass.replace(/^class\s*/i, '').trim().toLowerCase();
        const sClsNum = (s.className || '').replace(/^class\s*/i, '').trim().toLowerCase();
        matchesClass = selectedClsNum === sClsNum;
      }

      // Filter by selected section
      const cleanStudentSection = (s.section || '').replace(/^Section\s+/i, '').trim().toLowerCase();
      const cleanFilterSection = teacherSelectedSection.replace(/^Section\s+/i, '').trim().toLowerCase();

      const matchesSection = teacherSelectedSection === 'All' || 
        cleanStudentSection === cleanFilterSection;

      return matchesQuery && matchesClass && matchesSection;
    });

    const teacherTotalPages = Math.ceil(myStudents.length / teacherPageSize) || 1;
    const paginatedTeacherStudents = myStudents.slice(
      (teacherCurrentPage - 1) * teacherPageSize,
      teacherCurrentPage * teacherPageSize
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-xs pb-12">
        {/* Header Cockpit Card */}
        <div className="glass-card py-4 px-6 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-sky-600 shrink-0" />
              Student Directory
            </h2>
            <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold text-xs border border-sky-200 dark:border-sky-800">
              Total: {myStudents.length} Students
            </span>
          </div>

          {/* Quick Filters - Single Line Row */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setTeacherCurrentPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>

            {/* Select Class Filter */}
            <div className="relative shrink-0">
              <select
                value={teacherSelectedClass}
                onChange={(e) => {
                  setTeacherSelectedClass(e.target.value);
                  setTeacherCurrentPage(1);
                }}
                className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
              >
                <option value="All Assigned Classes">All Assigned Classes</option>
                {teacherClassOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Select Section Filter */}
            <div className="relative shrink-0">
              <select
                value={teacherSelectedSection}
                onChange={(e) => {
                  setTeacherSelectedSection(e.target.value);
                  setTeacherCurrentPage(1);
                }}
                className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer focus:border-sky-500"
              >
                {teacherSectionOptions.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table List View for Bulk Students */}
        <div className="glass-card rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          {paginatedTeacherStudents.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No Students Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">No student records match your current search query or class filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                    <th className="py-3.5 px-4 font-black text-center w-12">S.NO</th>
                    <th className="py-3.5 px-4 font-black text-center">ADMISSION NO</th>
                    <th className="py-3.5 px-4 font-black text-center">STUDENT NAME</th>
                    <th className="py-3.5 px-4 font-black text-center">CLASS & SECTION</th>
                    <th className="py-3.5 px-4 font-black text-center">ROLL NO</th>
                    <th className="py-3.5 px-4 font-black text-center">PARENT CONTACT</th>
                    <th className="py-3.5 px-4 font-black text-center">STATUS</th>
                    <th className="py-3.5 px-4 font-black text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {paginatedTeacherStudents.map((st, index) => {
                    const serialNo = (teacherCurrentPage - 1) * teacherPageSize + index + 1;
                    const fullName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student Record';
                    const parentContactPhone = (st as any).fatherPhone || (st as any).parentPhone || st.phone || (st as any).guardianPhone || (st as any).motherPhone || 'N/A';
                    const rollNumber = st.rollNo || st.admissionNo || 'N/A';
                    const admNo = st.admissionNo || st.rollNo || 'N/A';
                    const displayClass = st.className?.replace(/^Class\s*/i, '') || '10';
                    const displaySection = st.section || 'A';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                          {serialNo}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                          {admNo}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          {fullName}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-[11px]">
                            Class {displayClass}-{displaySection}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-extrabold text-slate-700 dark:text-slate-300">
                          #{rollNumber}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {parentContactPhone}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[9.5px] border border-emerald-200 dark:border-emerald-800 inline-block">
                            ACTIVE
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedStudent(st)}
                            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-600 hover:text-white dark:bg-sky-950/50 dark:text-sky-400 dark:hover:bg-sky-600 dark:hover:text-white transition-all cursor-pointer inline-flex items-center justify-center border border-sky-200/80 dark:border-sky-800 shadow-2xs"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Pagination matching Admin Admissions Style */}
          {myStudents.length > 0 && (
            <div className="px-4 pb-3">
              <Pagination
                currentPage={teacherCurrentPage}
                totalItems={myStudents.length}
                itemsPerPage={teacherPageSize}
                onPageChange={setTeacherCurrentPage}
                onItemsPerPageChange={(n) => { setTeacherPageSize(n); setTeacherCurrentPage(1); }}
                label="students"
              />
            </div>
          )}
        </div>

        {/* Student Profile Drawer */}
        {selectedStudent && (
          <StudentProfileDrawer
            student={selectedStudent}
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onEdit={() => {
              setStudentToEdit(selectedStudent);
              setIsEditOpen(true);
            }}
            onPromote={() => setStudentToPromote(selectedStudent)}
            onTransfer={() => setStudentToTransfer(selectedStudent)}
            onDelete={() => setStudentToDelete(selectedStudent)}
            activeTab={activeProfileTab}
            setActiveTab={setActiveProfileTab}
            teacherView={true}
            getAttendancePct={getAttendancePct}
            getPerformance={getPerformance}
            getBehaviourRemarks={getBehaviourRemarks}
            getMedicalInfo={getMedicalInfo}
            getDocumentsList={getDocumentsList}
          />
        )}
      </div>
    );
  }

  // Warden Portal View (Hostel Resident Student Directory)
  const [wardenSelectedBlock, setWardenSelectedBlock] = useState<string>('All Blocks');
  const [wardenSelectedClass, setWardenSelectedClass] = useState<string>('All Classes');
  const [wardenSearchQuery, setWardenSearchQuery] = useState<string>('');
  const [wardenCurrentPage, setWardenCurrentPage] = useState<number>(1);
  const [wardenPageSize, setWardenPageSize] = useState<number>(10);

  const wardenHostelStudents = useMemo(() => {
    // Filter active residential / hosteller students
    const activeHostellers = apiStudents.filter(s =>
      s.status !== 'Completed' && s.status !== 'Alumni' &&
      ((s as any).studentType === 'Hosteller' ||
       (s as any).studentType === 'Residential' ||
       (s as any).isHosteller ||
       (s as any).studentType !== 'Day Scholar')
    );

    return activeHostellers.filter(s => {
      // 1. Class filter
      const matchesClass = wardenSelectedClass === 'All Classes' || s.className.toLowerCase() === wardenSelectedClass.toLowerCase();

      // 2. Block filter
      const sBlock = (s as any).hostelBlock || (s as any).blockName || (s as any).hostelName || (s as any).buildingName || 'Ramachandra Bhavan (Block A)';
      const matchesBlock = wardenSelectedBlock === 'All Blocks' || sBlock.toLowerCase().includes(wardenSelectedBlock.toLowerCase()) || wardenSelectedBlock.toLowerCase().includes(sBlock.toLowerCase());

      // 3. Search query
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
      const q = wardenSearchQuery.trim().toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || (s.admissionNo || '').toLowerCase().includes(q) || (s.rollNo || '').toLowerCase().includes(q);

      return matchesClass && matchesBlock && matchesSearch;
    });
  }, [apiStudents, wardenSelectedClass, wardenSelectedBlock, wardenSearchQuery]);

  const wardenTotalPages = Math.ceil(wardenHostelStudents.length / wardenPageSize) || 1;
  const wardenPaginatedStudents = wardenHostelStudents.slice((wardenCurrentPage - 1) * wardenPageSize, wardenCurrentPage * wardenPageSize);

  // Available Hostel Blocks
  const wardenBlockOptions = useMemo(() => {
    const blocksSet = new Set<string>();
    apiStudents.forEach(s => {
      const blk = (s as any).hostelBlock || (s as any).blockName || (s as any).hostelName;
      if (blk) blocksSet.add(blk);
    });
    const list = Array.from(blocksSet).sort();
    return ['All Blocks', ...list.length > 0 ? list : ['Ramachandra Bhavan (Block A)', 'Vivekananda Hostel (Block B)', 'Saraswati Bhavan (Girls Block)']];
  }, [apiStudents]);

  // Available Classes
  const wardenClassOptions = useMemo(() => {
    const classesSet = new Set<string>();
    apiStudents.forEach(s => {
      if (s.className) classesSet.add(s.className);
    });
    const list = Array.from(classesSet).sort((a, b) => getClassOrderRank(a) - getClassOrderRank(b));
    return ['All Classes', ...list];
  }, [apiStudents]);

  if (isWardenRole) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-12">
        {/* Warden Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Home className="w-7 h-7 text-sky-600 dark:text-sky-400" />
              Hostel Students
            </h1>
          </div>
          <ExportButton data={wardenHostelStudents} filename="hostel_students" />
        </div>

        {/* Warden Filters Bar */}
        <div className="glass-card p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, adm no, roll no..."
                value={wardenSearchQuery}
                onChange={e => { setWardenSearchQuery(e.target.value); setWardenCurrentPage(1); }}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            {/* Block Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              <select
                value={wardenSelectedBlock}
                onChange={e => { setWardenSelectedBlock(e.target.value); setWardenCurrentPage(1); }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {wardenBlockOptions.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-sky-600 shrink-0" />
              <select
                value={wardenSelectedClass}
                onChange={e => { setWardenSelectedClass(e.target.value); setWardenCurrentPage(1); }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {wardenClassOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-2">
              <span>Showing <strong className="text-slate-900 dark:text-white">{wardenHostelStudents.length}</strong> Resident Hostel Students</span>
              {(wardenSelectedBlock !== 'All Blocks' || wardenSelectedClass !== 'All Classes' || wardenSearchQuery) && (
                <button
                  onClick={() => {
                    setWardenSelectedBlock('All Blocks');
                    setWardenSelectedClass('All Classes');
                    setWardenSearchQuery('');
                    setWardenCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold hover:bg-rose-100 transition-colors text-[11px] cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hostel Students Roster Table */}
        <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-4">Adm No</th>
                  <th className="py-3.5 px-4">Roll No</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Class & Sec</th>
                  <th className="py-3.5 px-4">Hostel Block & Room</th>
                  <th className="py-3.5 px-4">Guardian Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {wardenPaginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-bold">
                      No hostel resident students match the selected block and class filters.
                    </td>
                  </tr>
                ) : (
                  wardenPaginatedStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {s.admissionNo}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {s.rollNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-black flex items-center justify-center text-xs">
                              {s.firstName?.[0] || 'S'}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{s.firstName} {s.lastName}</span>
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">Residential / Hosteller</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-800 dark:text-slate-200">
                        {s.className} - {s.section}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {(s as any).hostelBlock || (s as any).blockName || 'Block A (Ramachandra)'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Room: {(s as any).roomNo || '102'} • Bed: {(s as any).bedNo || 'B1'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {s.fatherPhone || s.guardianPhone || s.contactPhone || '9876543210'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-900/40">
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-100 transition-colors text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {wardenHostelStudents.length > 0 && (
            <div className="px-4 pb-3">
              <Pagination
                currentPage={wardenCurrentPage}
                totalItems={wardenHostelStudents.length}
                itemsPerPage={wardenPageSize}
                onPageChange={setWardenCurrentPage}
                onItemsPerPageChange={(n) => { setWardenPageSize(n); setWardenCurrentPage(1); }}
                label="Hostel Students"
              />
            </div>
          )}
        </div>

        {/* Student Profile Drawer */}
        {selectedStudent && (
          <StudentProfileDrawer
            student={selectedStudent}
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            onEdit={() => {}}
            onPromote={() => {}}
            onTransfer={() => {}}
            onDelete={() => {}}
            activeTab={activeProfileTab}
            setActiveTab={setActiveProfileTab}
            teacherView={true}
            getAttendancePct={getAttendancePct}
            getPerformance={getPerformance}
            getBehaviourRemarks={getBehaviourRemarks}
            getMedicalInfo={getMedicalInfo}
            getDocumentsList={getDocumentsList}
          />
        )}
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
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-3.5 py-2.5 text-xs font-extrabold text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors shadow-xs cursor-pointer"
                title="Upload Excel / Import Records"
              >
                <Upload className="h-4 w-4" /> Upload Excel / Import
              </button>
              {onNavigate && !isWardenRole && (
                <button
                  onClick={() => onNavigate('admissions')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-brand-600/20 hover:bg-brand-500 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Student
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Total Classes */}
            <div className="glass-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300 shrink-0">
                <School className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Total Classes</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-none">{summaryMetrics.totalClasses}</p>
              </div>
            </div>

            {/* Total Sections */}
            <div className="glass-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300 shrink-0">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Total Sections</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-none">{summaryMetrics.totalSections}</p>
              </div>
            </div>

            {/* Total Active Students */}
            <div className="glass-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                <Users className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Total Active Students</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-none">{summaryMetrics.totalActiveStudents.toLocaleString()}</p>
              </div>
            </div>

            {/* Inactive Students (Clickable to view inactive roster) */}
            <div
              onClick={handleViewInactiveStudents}
              className="glass-card p-3 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all group"
              title="Click to view all inactive students"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                  <UserX className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Inactive Students</p>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 leading-none">{summaryMetrics.inactiveStudentsCount}</p>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-rose-500 shrink-0 group-hover:translate-x-0.5 transition-transform opacity-60 group-hover:opacity-100" />
            </div>

            {/* New Admissions */}
            <div className="glass-card p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-tight">New Admissions</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5 leading-none">{summaryMetrics.newAdmissions}</p>
              </div>
            </div>
          </div>

          {/* CLASS & SECTION OVERVIEW CARD GRID */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Classes & Sections Overview
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={searchClassQuery}
                    onChange={e => setSearchClassQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>
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

          {/* HEADER ROW (Hidden in Print) */}
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={handleBackToOverview}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer h-9 w-9"
              title="Back to Overview"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
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

          {/* ROSTER TABLE FILTERS BAR (Hidden in Print) */}
          <div className="glass-card p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 no-print">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Name */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 transition"
                />
              </div>

              {/* Download Button */}
              <div className="shrink-0">
                <ExportButton
                  data={filteredRoster.map(s => ({
                    'Roll Number': s.rollNo || '-',
                    'Admission Number': s.admissionNo || '-',
                    'Student Name': `${s.firstName} ${s.lastName}`.trim(),
                    'Gender': s.gender || '-',
                    'Father Name': s.fatherName || '-',
                    'Mobile Number': s.fatherPhone || '-',
                    'Status': s.status || 'Active'
                  }))}
                  filename={`${selectedClass}_Section_${selectedSection}_Students`}
                  filteredCount={filteredRoster.length}
                />
              </div>
            </div>
          </div>

          {/* STUDENT ROSTER TABLE (EXACT COLUMNS REQUESTED) */}
          <div id="printable-content" className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 print:p-0 print:border-none">
            <SchoolPrintHeader
              title={`Student Roster - ${selectedClass === 'All' ? 'All Classes' : selectedClass}${selectedSection ? ` (Section ${selectedSection})` : ''}`}
              subtitle={`Total Filtered Students: ${filteredRoster.length}`}
            />
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
            {filteredRoster.length > 0 && (
              <div className="px-4 pb-3">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredRoster.length}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => { setPageSize(n); setCurrentPage(1); }}
                  label="students"
                />
              </div>
            )}
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

      <AcademicHistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
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
