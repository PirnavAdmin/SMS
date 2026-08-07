import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  School, Calendar, Presentation, Layers, BookOpen, 
  Users, UserPlus, Clock, ShieldCheck, Plus, Edit, 
  Trash2, Search, X, Check, ChevronRight, AlertCircle, ChevronDown,
  BarChart2, CheckSquare, Copy, Archive, CheckCircle2, RefreshCw,
  ArrowLeft, Activity, Settings, Clipboard, Download, Lock, CheckSquare as CheckSquareIcon, ArrowRightLeft, BookOpen as BookOpenIcon, UserCheck, Play
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useData, AcademicClass } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Badge } from '../../common/Badge';
import { StatCard } from '../../common/StatCard';
import { TimetableSlot, SubjectItem, TeacherAssignment } from '../../../types';
import { 
  addSectionApi, 
  updateSectionApi, 
  deleteSectionApi,
  mapSubjectApi, 
  removeSubjectApi, 
  assignTeacherApi,
  fetchClassStudentsApi, 
  allocateStudentApi, 
  autoAllocateApi 
} from '../../../api/academic';

const CAMPUSES = ['Main Campus', 'Winga Campus', 'South Campus', 'North Campus', 'East Campus'];
const CLASS_NAMES = [
  'Nursery', 'LKG', 'UKG', 
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12', 'Other'
];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const isNameEquivalent = (n1: string, n2: string): boolean => {
  const norm = (s: string) => s
    .toLowerCase()
    .replace(/\b(grade|class)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return norm(n1) === norm(n2);
};

interface ClassManagementWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  classWorkspaceTab: 'overview' | 'sections' | 'subjects' | 'teachers' | 'students' | 'timetable' | 'settings' | 'future';
  setClassWorkspaceTab: (tab: any) => void;
  autoOpenClassModal?: boolean;
  setAutoOpenClassModal?: (open: boolean) => void;
}

export const ClassManagementWorkspace: React.FC<ClassManagementWorkspaceProps> = ({
  initialTab,
  onTabChange,
  selectedClassId,
  setSelectedClassId,
  classWorkspaceTab,
  setClassWorkspaceTab,
  autoOpenClassModal,
  setAutoOpenClassModal
}) => {
  const { 
    academicYears, addAcademicYear, updateAcademicYear, deleteAcademicYear,
    academicClasses, addAcademicClass, updateAcademicClass, deleteAcademicClass,
    students, updateStudent, staff, timetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
    teacherAssignments, addTeacherAssignment, updateTeacherAssignment, deleteTeacherAssignment,
    subjects, addSubject, updateSubject, deleteSubject
  } = useData();

  const { addToast } = useToast();
  const { selectedAcademicYear, setSelectedAcademicYear, selectedBranch, setSelectedBranch } = useAuth();

  // Selected class & section state inside Workspace Cockpit
  const activeClass = academicClasses.find(c => c.id === selectedClassId);
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState<string>('A');

  useEffect(() => {
    if (activeClass && !activeClass.sections.includes(activeWorkspaceSection)) {
      setActiveWorkspaceSection(activeClass.sections[0] || 'A');
    }
  }, [activeClass, activeWorkspaceSection]);

  // Search & Filters state for Class Setup list
  const [filterCampus, setFilterCampus] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchClassName, setSearchClassName] = useState('');

  // Sync local campus filter with global selectedBranch from header
  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses') {
      setFilterCampus(selectedBranch);
    } else {
      setFilterCampus('');
    }
  }, [selectedBranch]);

  // Sync local academic year filter with global selectedAcademicYear from header
  useEffect(() => {
    if (selectedAcademicYear) {
      setFilterYear(selectedAcademicYear);
    } else {
      setFilterYear('');
    }
  }, [selectedAcademicYear]);

  const [customClassName, setCustomClassName] = useState('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Section List specific search & filters
  const [sectionSearchText, setSectionSearchText] = useState('');
  const [sectionFilterStatus, setSectionFilterStatus] = useState('');
  const [sectionFilterCapacity, setSectionFilterCapacity] = useState('');

  // Modals controllers
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);

  // Section Setup controllers
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);

  // Bulk Setup actions
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkAddSectionsList, setBulkAddSectionsList] = useState('A, B, C');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [copyClassSourceId, setCopyClassSourceId] = useState('');

  // Dependency alert modal state
  const [dependencyModalData, setDependencyModalData] = useState<{ title: string; reasons: string[] } | null>(null);
  const [classToDelete, setClassToDelete] = useState<AcademicClass | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form inputs state
  const [classForm, setClassForm] = useState({
    campus: 'Main Campus',
    academicYear: '',
    name: 'Grade 1',
    displayName: '',
    status: 'Active' as 'Active' | 'Inactive',
    remarks: '',
    displayOrder: ''
  });

  const [sectionForm, setSectionForm] = useState({
    name: 'A',
    capacity: 40,
    status: 'Active' as 'Active' | 'Inactive' | 'Archived',
    remarks: ''
  });

  // Track async creation redirection
  const prevClassesLength = useRef(academicClasses.length);
  const newlyCreatedClassRef = useRef<{ name: string; campus: string; academicYear: string } | null>(null);

  useEffect(() => {
    if (academicClasses.length > prevClassesLength.current && newlyCreatedClassRef.current) {
      const match = academicClasses.find(c => 
        c.name === newlyCreatedClassRef.current?.name &&
        ((c as any).campus === newlyCreatedClassRef.current?.campus || (c as any).branch === newlyCreatedClassRef.current?.campus) &&
        ((c as any).academicYear === newlyCreatedClassRef.current?.academicYear)
      );
      if (match) {
        setSelectedClassId(match.id);
        setClassWorkspaceTab('sections');
        addToast('success', 'Class created successfully', 'Continue by configuring Sections.');
        newlyCreatedClassRef.current = null;
      }
    }
    prevClassesLength.current = academicClasses.length;
  }, [academicClasses]);

  // General Filtered Lists local variables
  const activeClassStudents = useMemo(() => {
    if (!activeClass) return [];
    return students.filter(s => s.className === activeClass.name);
  }, [students, activeClass]);

  const activeSectionStudents = useMemo(() => {
    if (!activeClass || !activeWorkspaceSection) return [];
    return activeClassStudents.filter(s => s.section === activeWorkspaceSection);
  }, [activeClassStudents, activeWorkspaceSection]);

  const unassignedStudentsInClass = useMemo(() => {
    if (!activeClass) return [];
    return activeClassStudents.filter(s => !s.section);
  }, [activeClassStudents]);

  // Teachers (Staff list with Designation or role containing Teacher)
  const teachersList = useMemo(() => {
    return staff.filter(s => 
      s.role === 'Teacher' || 
      (s as any).designation?.toLowerCase().includes('teacher') || 
      (s as any).department?.toLowerCase().includes('academic') ||
      true
    );
  }, [staff]);

  // Helper function to identify if a teacher teaches a specific subject
  const isTeacherForSubject = (t: any, subName: string): boolean => {
    const subjectsStr = [
      t.primarySubject,
      t.secondarySubject,
      ...(t.assignedSubjects || [])
    ].filter(Boolean);
    
    const offeredSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'History', 'Geography', 'Social Studies', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies'];
    const matchedOffered = offeredSubjects.filter(sub => 
      (t.designation || '').toLowerCase().includes(sub.toLowerCase()) ||
      (t.department || '').toLowerCase().includes(sub.toLowerCase())
    );
    const allTeacherSubjects = Array.from(new Set([...subjectsStr, ...matchedOffered])).map(s => s.toLowerCase());
    const target = subName.toLowerCase();
    return allTeacherSubjects.some(s => s.includes(target) || target.includes(s));
  };

  // Student list search & filter parameters
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterGender, setStudentFilterGender] = useState('');
  const [selectedStudentsForAllocation, setSelectedStudentsForAllocation] = useState<string[]>([]);

  const filteredUnassignedStudents = useMemo(() => {
    return unassignedStudentsInClass.filter(s => {
      const nameStr = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchesSearch = !studentSearchQuery || nameStr.includes(studentSearchQuery.toLowerCase()) || s.id.includes(studentSearchQuery);
      const matchesGender = !studentFilterGender || s.gender === studentFilterGender;
      return matchesSearch && matchesGender;
    });
  }, [unassignedStudentsInClass, studentSearchQuery, studentFilterGender]);

  // Helper function to calculate class metrics & setup health dynamically
  const classesProgress = useMemo(() => {
    return academicClasses.map(cl => {
      const clStudents = students.filter(s => s.className === cl.name);
      const unassignedCount = clStudents.filter(s => !s.section).length;

      const details = (cl as any).sectionDetails || {};
      let totalCapacity = 0;
      cl.sections.forEach(sec => {
        totalCapacity += (details[sec]?.capacity ?? 40);
      });
      if (totalCapacity === 0) totalCapacity = cl.sections.length * 40;

      // Milestone calculations
      const hasSections = cl.sections.length > 0;
      const hasSubjects = (cl.subjects || []).length > 0;

      let hasAllClassTeachers = hasSections;
      if (hasSections) {
        cl.sections.forEach(sec => {
          const warden = ((cl as any).sectionTeachers || {})[sec];
          if (!warden) hasAllClassTeachers = false;
        });
      }

      let hasAllSubjectTeachers = hasSubjects && hasSections;
      if (hasSubjects && hasSections) {
        cl.sections.forEach(sec => {
          cl.subjects.forEach(sub => {
            const assignment = teacherAssignments.find(ta => 
              ta.className === cl.name && 
              ta.section === sec && 
              ta.subject === sub
            );
            if (!assignment) hasAllSubjectTeachers = false;
          });
        });
      }

      const allStudentsAllocated = clStudents.length > 0 && unassignedCount === 0;

      // 20 points per completed milestone
      let score = 20; // 20 pts for class created
      if (hasSections) score += 20;
      if (hasAllClassTeachers) score += 20;
      if (hasAllSubjectTeachers) score += 20;
      if (allStudentsAllocated) score += 20;

      let status: 'Ready' | 'Almost Ready' | 'In Progress' | 'Needs Configuration' = 'Needs Configuration';
      let message = 'Requires Setup Actions';
      
      if (score === 100) {
        status = 'Ready';
        message = 'Excellent - Ready for Timetable';
      } else if (score >= 80) {
        status = 'Almost Ready';
        message = 'Good - Ready for Student Placement';
      } else if (score >= 50) {
        status = 'In Progress';
        message = 'Setup In Progress';
      }

      return {
        class: cl,
        score,
        status,
        message,
        totalCapacity,
        studentsCount: clStudents.length,
        unassignedCount,
        hasSections,
        hasSubjects,
        hasAllClassTeachers,
        hasAllSubjectTeachers,
        allStudentsAllocated
      };
    });
  }, [academicClasses, students, teacherAssignments]);

  const activeClassProgress = useMemo(() => {
    if (!activeClass) return null;
    return classesProgress.find(c => c.class.id === activeClass.id) || null;
  }, [classesProgress, activeClass]);

  // CONFIGURATION LOCK VERIFICATION GUARD
  const verifySafetyLock = (action: () => void) => {
    if (activeClassProgress && activeClassProgress.score === 100) {
      if (confirm("This class has already been configured and may have attendance, homework, or examination records. Continue?")) {
        action();
      }
    } else {
      action();
    }
  };

  // Class setup KPI cards calculations
  const classKPIs = useMemo(() => {
    const filteredForKPIs = academicClasses.filter(c => {
      const campus = (c as any).campus || (c as any).branch || 'Main Campus';
      const year = (c as any).academicYear || '2026-2027';
      const matchesCampus = !selectedBranch || selectedBranch === 'All Branches' || selectedBranch === 'All Campuses' || campus === selectedBranch;
      const matchesYear = !selectedAcademicYear || year === selectedAcademicYear;
      return matchesCampus && matchesYear;
    });

    const total = filteredForKPIs.length;
    const active = filteredForKPIs.filter(c => (c as any).status === 'Active' || !(c as any).status).length;
    const archived = filteredForKPIs.filter(c => (c as any).status === 'Archived').length;

    let totalCapacity = 0;
    let occupiedSeats = 0;

    filteredForKPIs.forEach(cl => {
      const details = (cl as any).sectionDetails || {};
      let clCapacity = 0;
      if (cl.sections && cl.sections.length > 0) {
        cl.sections.forEach(sec => {
          clCapacity += (details[sec]?.capacity ?? 40);
        });
      } else {
        clCapacity = 40;
      }
      totalCapacity += clCapacity;

      const clStudentsCount = students.filter(s => s.className === cl.name).length;
      occupiedSeats += clStudentsCount;
    });

    const remainingSeats = Math.max(0, totalCapacity - occupiedSeats);

    return {
      total,
      active,
      archived,
      totalCapacity,
      occupiedSeats,
      remainingSeats
    };
  }, [academicClasses, students, selectedBranch, selectedAcademicYear]);

  // Section details calculation inside cockpit
  const sectionKPIs = useMemo(() => {
    if (!activeClass) return null;
    const cl = activeClass;
    const clStudents = students.filter(s => s.className === cl.name);
    const assignedCount = clStudents.filter(s => !!s.section).length;
    const waitingCount = clStudents.filter(s => !s.section).length;

    const details = (cl as any).sectionDetails || {};
    let totalCap = 0;
    let activeSecsCount = 0;
    let inactiveSecsCount = 0;

    cl.sections.forEach(sec => {
      const secDetail = details[sec] || {};
      const status = secDetail.status || 'Active';
      if (status === 'Active') {
        activeSecsCount++;
        totalCap += (secDetail.capacity ?? 40);
      } else {
        inactiveSecsCount++;
      }
    });

    const freeSeats = Math.max(0, totalCap - assignedCount);
    const avgOccupancy = totalCap > 0 ? Math.round((assignedCount / totalCap) * 100) : 0;

    return {
      totalSections: cl.sections.length,
      activeSections: activeSecsCount,
      inactiveSections: inactiveSecsCount,
      totalCapacity: totalCap,
      occupiedSeats: assignedCount,
      remainingSeats: freeSeats,
      averageOccupancy: avgOccupancy,
      studentsWaiting: waitingCount
    };
  }, [activeClass, students]);

  // Section Checklist Validation
  const sectionChecklist = useMemo(() => {
    if (!activeClass) return [];
    const details = (activeClass as any).sectionDetails || {};

    return [
      { id: 1, name: 'At least one section exists', passed: activeClass.sections.length > 0 },
      { id: 2, name: 'Every section has a unique name letter', passed: new Set(activeClass.sections).size === activeClass.sections.length },
      { id: 3, name: 'All capacities configured (> 0)', passed: activeClass.sections.every(sec => (details[sec]?.capacity ?? 0) > 0) },
    ] as Array<{ id: number; name: string; passed: boolean; isWarning?: boolean }>;
  }, [activeClass]);

  const isSectionsSetupValid = useMemo(() => {
    return sectionChecklist.filter(c => !c.isWarning).every(c => c.passed);
  }, [sectionChecklist]);

  const handleOpenAddClass = () => {
    setEditingClass(null);
    const activeAY = academicYears.find(ay => ay.status === 'Active');
    setClassForm({
      campus: selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses' ? selectedBranch : 'Main Campus',
      academicYear: selectedAcademicYear || (activeAY ? activeAY.academicYear : ''),
      name: CLASS_NAMES[0] || 'Nursery',
      displayName: '',
      status: 'Active',
      remarks: '',
      displayOrder: ''
    });
    setCustomClassName('');
    setIsClassDropdownOpen(false);
    setIsClassModalOpen(true);
  };

  useEffect(() => {
    if (autoOpenClassModal) {
      handleOpenAddClass();
      if (setAutoOpenClassModal) {
        setAutoOpenClassModal(false);
      }
    }
  }, [autoOpenClassModal]);

  const handleOpenEditClass = (c: AcademicClass) => {
    setEditingClass(c);
    const isPredefined = CLASS_NAMES.includes(c.name);
    setClassForm({
      campus: (c as any).campus || (c as any).branch || 'Main Campus',
      academicYear: (c as any).academicYear || selectedAcademicYear || '2026-2027',
      name: isPredefined ? c.name : 'Other',
      displayName: (c as any).displayName || c.name,
      status: ((c as any).status === 'Archived' ? 'Active' : (c as any).status || 'Active') as any,
      remarks: (c as any).remarks || '',
      displayOrder: (c as any).displayOrder !== undefined ? String((c as any).displayOrder) : ''
    });
    setCustomClassName(isPredefined ? '' : c.name);
    setIsClassDropdownOpen(false);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { name, campus, academicYear, displayName, status, remarks, displayOrder } = classForm;
    const finalName = name === 'Other' ? customClassName : name;
    if (!finalName || !campus || !academicYear) {
      addToast('warning', 'Validation Error', 'Campus, Academic Year, and Class Name are required.');
      return;
    }

    const isDuplicate = academicClasses.some(c => 
      isNameEquivalent(c.name, finalName) && 
      ((c as any).campus === campus || (c as any).branch === campus) &&
      (c as any).academicYear === academicYear
    );

    if (isDuplicate) {
      addToast('warning', 'Duplicate Entry', 'This class setup already exists in the selected campus and academic year.');
      return;
    }

    const campusConflict = academicClasses.some(c => 
      isNameEquivalent(c.name, finalName) && 
      ((c as any).campus === campus || (c as any).branch === campus)
    );

    if (campusConflict) {
      addToast('warning', 'Campus Conflict', 'This class already exists in the selected campus.');
      return;
    }

    const ayObj = academicYears.find(ay => ay.academicYear === academicYear && ay.status === 'Active');
    if (!ayObj) {
      addToast('warning', 'Academic Year Inactive', 'Please select an active academic year session.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API request submission
    setTimeout(() => {
      const cleanName = finalName.trim();
      const newClassData = {
        name: cleanName,
        branch: campus,
        campus,
        academicYear,
        displayName: cleanName,
        status,
        remarks,
        displayOrder: displayOrder !== '' ? parseInt(displayOrder) : undefined,
        createdDate: new Date().toLocaleDateString(),
        lastUpdated: new Date().toLocaleDateString(),
        sections: [],
        subjects: [],
        teacher: '',
        sectionTeachers: {},
        sectionDetails: {}
      };

      // Update active top bar branch/year filters in global auth context
      setSelectedBranch(campus);
      setSelectedAcademicYear(academicYear);

      // Reset local views filters
      setFilterCampus('');
      setFilterYear('');
      setFilterStatus('');
      setSearchClassName('');

      newlyCreatedClassRef.current = {
        name: cleanName,
        campus,
        academicYear
      };

      addAcademicClass(newClassData as any);
      setIsClassModalOpen(false);
      setIsSubmitting(false);

      // Form reset only on successful creation
      setClassForm({
        campus: selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses' ? selectedBranch : 'Main Campus',
        academicYear: ayObj ? ayObj.academicYear : '',
        name: CLASS_NAMES[0] || 'Nursery',
        displayName: '',
        status: 'Active',
        remarks: '',
        displayOrder: ''
      });
      setCustomClassName('');
    }, 400);
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    verifySafetyLock(() => {
      updateAcademicClass(editingClass.id, {
        displayName: classForm.displayName,
        status: classForm.status,
        remarks: classForm.remarks,
        displayOrder: classForm.displayOrder !== '' ? parseInt(classForm.displayOrder) : undefined,
        lastUpdated: new Date().toLocaleDateString()
      } as any);

      addToast('success', 'Class setup updated', `Updated class ${editingClass.name} parameters.`);
      setIsClassModalOpen(false);
      setEditingClass(null);
    });
  };

  // Delete Class Validation Checks
  const triggerDeleteCheck = (cls: AcademicClass) => {
    const reasons: string[] = [];

    // Check Sections
    if (cls.sections && cls.sections.length > 0) {
      reasons.push(`Sections exist (${cls.sections.join(', ')})`);
    }

    // Check Students
    const clStudents = students.filter(s => s.className === cls.name && s.section);
    if (clStudents.length > 0) {
      reasons.push(`${clStudents.length} students are allocated to sections in this class`);
    }

    // Check Timetable
    const hasTimetable = timetable.some(t => t.className === cls.name);
    if (hasTimetable) {
      reasons.push('Weekly period timetable slots exist');
    }

    // Check Subject Mappings
    if (cls.subjects && cls.subjects.length > 0) {
      reasons.push(`${cls.subjects.length} course subjects are mapped`);
    }

    if (reasons.length > 0) {
      setDependencyModalData({
        title: `Cannot Delete ${cls.name}`,
        reasons
      });
    } else {
      verifySafetyLock(() => {
        setClassToDelete(cls);
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!classToDelete) return;
    deleteAcademicClass(classToDelete.id);
    addToast('success', 'Class Removed', `Deleted class setup ${classToDelete.name}`);
    setClassToDelete(null);
  };

  // Archive Class
  const handleArchiveClass = (cls: AcademicClass) => {
    verifySafetyLock(() => {
      updateAcademicClass(cls.id, { status: 'Archived' } as any);
      addToast('info', 'Class Archived', `${cls.name} has been archived.`);
    });
  };

  const handleRestoreClass = (cls: AcademicClass) => {
    updateAcademicClass(cls.id, { status: 'Active' } as any);
    addToast('success', 'Class Restored', `${cls.name} is now active.`);
  };

  // Section CRUD Actions
  const handleOpenAddSection = () => {
    if (!activeClass) return;
    setEditingSectionName(null);
    const nextLetter = ALPHABET.find(l => !activeClass.sections.includes(l)) || 'A';
    setSectionForm({
      name: nextLetter,
      capacity: 40,
      status: 'Active',
      remarks: ''
    } as any);
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (secName: string) => {
    if (!activeClass) return;
    const detail = (activeClass as any).sectionDetails?.[secName] || {};
    setEditingSectionName(secName);
    setSectionForm({
      name: secName,
      capacity: detail.capacity ?? 40,
      status: detail.status || 'Active',
      remarks: detail.remarks || ''
    } as any);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    const { name, capacity, status, remarks } = sectionForm as any;

    if (capacity <= 0 || capacity > 60) {
      addToast('warning', 'Invalid Capacity', 'Section seat capacity must be between 1 and 60.');
      return;
    }

    const currentSections = [...activeClass.sections];
    const details = { ...((activeClass as any).sectionDetails || {}) };

    if (editingSectionName) {
      const assignedCount = students.filter(s => s.className === activeClass.name && s.section === editingSectionName).length;
      if (capacity < assignedCount) {
        addToast('warning', 'Capacity Violation', 'Capacity cannot be less than the number of assigned students.');
        return;
      }

      verifySafetyLock(() => {
        updateSectionApi(activeClass.id, editingSectionName, { capacity, status, remarks })
          .then(res => {
            if (res && res.success) {
              details[editingSectionName] = { capacity, status, remarks };
              updateAcademicClass(activeClass.id, {
                sections: currentSections,
                sectionDetails: details
              } as any);
              addToast('success', 'Section configuration saved', `Saved Section ${name}`);
              setIsSectionModalOpen(false);
            } else {
              addToast('error', 'Error', res?.message || 'Failed to update section.');
            }
          })
          .catch(err => {
            console.error(err);
            // offline fallback
            details[editingSectionName] = { capacity, status, remarks };
            updateAcademicClass(activeClass.id, {
              sections: currentSections,
              sectionDetails: details
            } as any);
            addToast('success', 'Section configuration saved', `Saved Section ${name} (offline)`);
            setIsSectionModalOpen(false);
          });
      });
    } else {
      if (currentSections.includes(name)) {
        addToast('warning', 'Duplicate Section', `Section ${name} already exists in this class setup.`);
        return;
      }
      addSectionApi(activeClass.id, { section_letter: name, capacity, status, remarks })
        .then(res => {
          if (res && res.success) {
            currentSections.push(name);
            details[name] = { capacity, status, remarks };
            updateAcademicClass(activeClass.id, {
              sections: currentSections,
              sectionDetails: details
            } as any);
            addToast('success', 'Section configuration saved', `Saved Section ${name}`);
            setIsSectionModalOpen(false);
          } else {
            addToast('error', 'Error', res?.message || 'Failed to create section.');
          }
        })
        .catch(err => {
          console.error(err);
          // offline fallback
          currentSections.push(name);
          details[name] = { capacity, status, remarks };
          updateAcademicClass(activeClass.id, {
            sections: currentSections,
            sectionDetails: details
          } as any);
          addToast('success', 'Section configuration saved', `Saved Section ${name} (offline)`);
          setIsSectionModalOpen(false);
        });
    }
  };

  // Section Deletion checks
  const triggerDeleteSectionCheck = (secName: string) => {
    if (!activeClass) return;
    const reasons: string[] = [];

    const clStudents = students.filter(s => s.className === activeClass.name && s.section === secName);
    if (clStudents.length > 0) {
      reasons.push(`${clStudents.length} students are allocated to Section ${secName}`);
    }

    const hasTimetable = timetable.some(t => t.className === activeClass.name && t.section === secName);
    if (hasTimetable) {
      reasons.push('A weekly timetable period schedule is mapped');
    }

    if (reasons.length > 0) {
      setDependencyModalData({
        title: `Cannot Delete Section ${secName}`,
        reasons
      });
    } else {
      verifySafetyLock(() => {
        setSectionToDelete(secName);
      });
    }
  };

  const handleConfirmDeleteSection = () => {
    if (!activeClass || !sectionToDelete) return;
    const currentSections = activeClass.sections.filter(s => s !== sectionToDelete);
    const details = { ...((activeClass as any).sectionDetails || {}) };
    delete details[sectionToDelete];

    deleteSectionApi(activeClass.id, sectionToDelete)
      .then(res => {
        if (res && res.success) {
          updateAcademicClass(activeClass.id, {
            sections: currentSections,
            sectionDetails: details
          } as any);
          addToast('success', 'Section Removed', `Deleted Section ${sectionToDelete}`);
        } else {
          addToast('error', 'Error', res?.message || 'Failed to delete section.');
        }
      })
      .catch(err => {
        console.error(err);
        // offline fallback
        updateAcademicClass(activeClass.id, {
          sections: currentSections,
          sectionDetails: details
        } as any);
        addToast('success', 'Section Removed', `Deleted Section ${sectionToDelete} (offline)`);
      })
      .finally(() => {
        setSectionToDelete(null);
        setSelectedSections(selectedSections.filter(s => s !== sectionToDelete));
      });
  };

  // Archive Section
  const handleArchiveSection = (secName: string) => {
    if (!activeClass) return;
    verifySafetyLock(() => {
      const details = { ...((activeClass as any).sectionDetails || {}) };
      if (details[secName]) {
        details[secName].status = 'Archived';
        updateAcademicClass(activeClass.id, { sectionDetails: details } as any);
        addToast('info', 'Section Archived', `Section ${secName} moved to archive.`);
      }
    });
  };

  const handleRestoreSection = (secName: string) => {
    if (!activeClass) return;
    const details = { ...((activeClass as any).sectionDetails || {}) };
    if (details[secName]) {
      details[secName].status = 'Active';
      updateAcademicClass(activeClass.id, { sectionDetails: details } as any);
      addToast('success', 'Section Restored', `Section ${secName} is now active.`);
    }
  };

  // Bulk operations
  const handleBulkAddSections = () => {
    if (!activeClass) return;
    const letters = bulkAddSectionsList.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (letters.length === 0) return;

    const currentSections = [...activeClass.sections];
    const details = { ...((activeClass as any).sectionDetails || {}) };

    let addedCount = 0;
    letters.forEach(letter => {
      if (!currentSections.includes(letter)) {
        currentSections.push(letter);
        details[letter] = {
          capacity: 40,
          status: 'Active',
          remarks: 'Added via bulk config wizard'
        };
        addedCount++;
      }
    });

    updateAcademicClass(activeClass.id, {
      sections: currentSections,
      sectionDetails: details
    } as any);

    addToast('success', 'Bulk Actions complete', `Successfully created ${addedCount} sections.`);
    setShowBulkAddModal(false);
  };

  const handleBulkDelete = () => {
    if (!activeClass || selectedSections.length === 0) return;
    verifySafetyLock(() => {
      const blocked: string[] = [];
      const clearSections = selectedSections.filter(sec => {
        const hasStudents = students.some(s => s.className === activeClass.name && s.section === sec);
        const hasTimetable = timetable.some(t => t.className === activeClass.name && t.section === sec);
        if (hasStudents || hasTimetable) {
          blocked.push(sec);
          return false;
        }
        return true;
      });

      if (blocked.length > 0) {
        addToast('warning', 'Bulk action blocked', `Sections ${blocked.join(', ')} contain students or timetables.`);
      }

      if (clearSections.length > 0) {
        const currentSections = activeClass.sections.filter(s => !clearSections.includes(s));
        const details = { ...((activeClass as any).sectionDetails || {}) };
        clearSections.forEach(s => delete details[s]);

        updateAcademicClass(activeClass.id, {
          sections: currentSections,
          sectionDetails: details
        } as any);

        addToast('success', 'Bulk delete successful', `Removed ${clearSections.length} sections.`);
        setSelectedSections([]);
      }
    });
  };

  const handleBulkArchive = () => {
    if (!activeClass || selectedSections.length === 0) return;
    verifySafetyLock(() => {
      const details = { ...((activeClass as any).sectionDetails || {}) };
      selectedSections.forEach(sec => {
        if (details[sec]) details[sec].status = 'Archived';
      });
      updateAcademicClass(activeClass.id, { sectionDetails: details } as any);
      addToast('success', 'Bulk archive completed', `Archived ${selectedSections.length} sections.`);
      setSelectedSections([]);
    });
  };


  const handleBulkUpdateCapacity = (capacity: number) => {
    if (!activeClass || selectedSections.length === 0) return;
    const details = { ...((activeClass as any).sectionDetails || {}) };
    selectedSections.forEach(sec => {
      if (details[sec]) details[sec].capacity = capacity;
    });
    updateAcademicClass(activeClass.id, { sectionDetails: details } as any);
    addToast('success', 'Capacity Updated', `Capacity updated for ${selectedSections.length} sections.`);
    setSelectedSections([]);
  };

  // Complete step and redirect
  const handleSaveAndContinue = () => {
    if (!isSectionsSetupValid) {
      addToast('warning', 'Validation Pending', 'Please complete required checklist details first.');
      return;
    }
    setActiveWorkspaceSection(activeClass?.sections[0] || 'A');
    addToast('success', 'Sections configured successfully.');
    setClassWorkspaceTab('subjects');
  };

  // Filter sections lists
  const filteredSectionsList = useMemo(() => {
    if (!activeClass) return [];
    const details = (activeClass as any).sectionDetails || {};
    return activeClass.sections.filter(sec => {
      const detail = details[sec] || {};
      const status = detail.status || 'Active';
      const cap = detail.capacity ?? 40;

      const matchesSearch = !sectionSearchText || sec.toLowerCase().includes(sectionSearchText.toLowerCase());
      const matchesStatus = !sectionFilterStatus || status === sectionFilterStatus;
      
      let matchesCapacity = true;
      if (sectionFilterCapacity === 'small') matchesCapacity = cap <= 30;
      else if (sectionFilterCapacity === 'medium') matchesCapacity = cap > 30 && cap <= 45;
      else if (sectionFilterCapacity === 'large') matchesCapacity = cap > 45;

      return matchesSearch && matchesStatus && matchesCapacity;
    });
  }, [activeClass, sectionSearchText, sectionFilterStatus, sectionFilterCapacity]);

  // Sort classes logically by displayOrder or ref index
  const filteredClasses = useMemo(() => {
    const rawFiltered = academicClasses.filter(c => {
      const campus = (c as any).campus || (c as any).branch || 'Main Campus';
      const year = (c as any).academicYear || '2026-2027';
      const status = (c as any).status || 'Active';
      const name = c.name.toLowerCase();
      const disp = ((c as any).displayName || '').toLowerCase();

      const matchesCampus = !filterCampus || campus === filterCampus;
      const matchesYear = !filterYear || year === filterYear;
      const matchesStatus = !filterStatus || status === filterStatus;
      const matchesSearch = !searchClassName || name.includes(searchClassName.toLowerCase()) || disp.includes(searchClassName.toLowerCase());

      return matchesCampus && matchesYear && matchesStatus && matchesSearch;
    });

    const getGradeWeight = (name: string) => {
      const normalized = name.toLowerCase().trim();
      if (normalized.includes('nursery')) return 0.1;
      if (normalized.includes('lkg')) return 0.2;
      if (normalized.includes('ukg')) return 0.3;
      
      const match = normalized.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (normalized.includes('intermediate') && normalized.includes('1st')) {
          return 11;
        }
        if (normalized.includes('intermediate') && normalized.includes('2nd')) {
          return 12;
        }
        return num;
      }
      return 99;
    };

    // Custom Sorting by Display Order parameter
    return [...rawFiltered].sort((a, b) => {
      const orderA = (a as any).displayOrder;
      const orderB = (b as any).displayOrder;
      const hasOrderA = orderA !== undefined && orderA !== null && orderA !== '';
      const hasOrderB = orderB !== undefined && orderB !== null && orderB !== '';
      if (hasOrderA && hasOrderB) {
        return parseInt(orderA, 10) - parseInt(orderB, 10);
      }
      if (hasOrderA) return -1;
      if (hasOrderB) return 1;

      const wA = getGradeWeight(a.name);
      const wB = getGradeWeight(b.name);
      if (wA !== wB) return wA - wB;

      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [academicClasses, filterCampus, filterYear, filterStatus, searchClassName]);

  // -------------------------------------------------------------
  // SUBJECT MASTER & MAPPING HANDLERS
  // -------------------------------------------------------------
  const handleToggleSubjectMapping = (subjectName: string) => {
    if (!activeClass) return;
    const currentMapped = activeClass.subjects ? [...activeClass.subjects] : [];
    
    let updated: string[];
    if (currentMapped.includes(subjectName)) {
      // Check if teacher assignments exist for this subject in any section of this class
      const hasTeacher = teacherAssignments.some(ta => ta.className === activeClass.name && ta.subject === subjectName);
      if (hasTeacher) {
        addToast('warning', 'Mapping Locked', `Cannot remove subject ${subjectName} because subject teachers are assigned in sections.`);
        return;
      }
      verifySafetyLock(() => {
        const subObj = subjects.find(s => s.name === subjectName);
        const numericSubId = subObj ? subObj.id.replace(/\D/g, '') : '0';

        removeSubjectApi(activeClass.id, numericSubId)
          .then(res => {
            if (res && res.success) {
              updated = currentMapped.filter(s => s !== subjectName);
              updateAcademicClass(activeClass.id, { subjects: updated } as any);
              addToast('success', 'Subjects mapping updated');
            } else {
              addToast('error', 'Error', res?.message || 'Failed to remove subject mapping.');
            }
          })
          .catch(err => {
            console.error(err);
            // offline fallback
            updated = currentMapped.filter(s => s !== subjectName);
            updateAcademicClass(activeClass.id, { subjects: updated } as any);
            addToast('success', 'Subjects mapping updated (offline)');
          });
      });
    } else {
      mapSubjectApi(activeClass.id, { subject_name: subjectName, weekly_periods: 5 })
        .then(res => {
          if (res && res.success) {
            updated = [...currentMapped, subjectName];
            updateAcademicClass(activeClass.id, { subjects: updated } as any);
            addToast('success', 'Subjects mapping updated');
          } else {
            addToast('error', 'Error', res?.message || 'Failed to map subject.');
          }
        })
        .catch(err => {
          console.error(err);
          // offline fallback
          updated = [...currentMapped, subjectName];
          updateAcademicClass(activeClass.id, { subjects: updated } as any);
          addToast('success', 'Subjects mapping updated (offline)');
        });
    }
  };

  const handleCopySubjectMappings = () => {
    if (!activeClass || !copyClassSourceId) return;
    const source = academicClasses.find(c => c.id === copyClassSourceId);
    if (source) {
      updateAcademicClass(activeClass.id, {
        subjects: [...(source.subjects || [])]
      } as any);
      addToast('success', 'Subjects Mapped', `Copied subject mappings from ${source.name}`);
      setCopyClassSourceId('');
    }
  };

  // -------------------------------------------------------------
  // TEACHER ASSIGNMENTS HANDLERS (CLASS & SUBJECT TEACHER)
  // -------------------------------------------------------------
  const handleAssignClassTeacher = (teacherId: string) => {
    if (!activeClass || !activeWorkspaceSection) return;
    const details = (activeClass as any).sectionTeachers || {};
    const t = teachersList.find(s => s.id === teacherId);
    
    verifySafetyLock(() => {
      const teacherFullName = t ? (t.name || `${t.firstName} ${t.lastName}`) : '';
      const updatedTeachers = {
        ...details,
        [activeWorkspaceSection]: teacherFullName
      };

      assignTeacherApi(activeClass.id, activeWorkspaceSection, {
        teacher_id: teacherId,
        role: "Class Teacher"
      })
        .then(res => {
          if (res && res.success) {
            updateAcademicClass(activeClass.id, { sectionTeachers: updatedTeachers } as any);
            addToast('success', 'Class Teacher Mapped', `Assigned ${teacherFullName || 'Unassigned'} as Class Teacher.`);
          } else {
            addToast('error', 'Error', res?.message || 'Failed to assign class teacher.');
          }
        })
        .catch(err => {
          console.error(err);
          // offline fallback
          updateAcademicClass(activeClass.id, { sectionTeachers: updatedTeachers } as any);
          addToast('success', 'Class Teacher Mapped', `Assigned ${teacherFullName || 'Unassigned'} as Class Teacher (offline).`);
        });

      // Auto-assign subject if class teacher is assigned and has a teaching subject
      if (t) {
        // Collect all potential teaching subjects for this teacher (including department and designation)
        const teacherSubjects = [
          t.primarySubject,
          t.secondarySubject,
          t.department,
          t.designation,
          ...(t.assignedSubjects || [])
        ].filter(Boolean) as string[];

        // Find all subjects offered by the class that have a substring match with teacher subjects
        const targetSubjects = (activeClass.subjects || []).filter(subName => 
          teacherSubjects.some(tSub => 
            subName.toLowerCase().includes(tSub.toLowerCase()) || 
            tSub.toLowerCase().includes(subName.toLowerCase())
          )
        );

        targetSubjects.forEach(targetSubject => {
          // Check if mapping already exists
          const exist = teacherAssignments.find(ta => 
            ta.className === activeClass.name && 
            ta.section === activeWorkspaceSection && 
            ta.subject === targetSubject
          );

          if (exist) {
            updateTeacherAssignment(exist.id, { 
              teacherId: t.id, 
              teacherName: teacherFullName
            });
          } else {
            addTeacherAssignment({
              academicYear: (activeClass as any).academicYear || selectedAcademicYear || '2026-2027',
              branch: (activeClass as any).branch || selectedBranch || 'Main Campus',
              className: activeClass.name,
              section: activeWorkspaceSection,
              subject: targetSubject,
              teacherId: t.id,
              teacherName: teacherFullName,
              status: 'Active'
            });
          }
        });

        if (targetSubjects.length > 0) {
          addToast('success', 'Auto-assigned Subject(s)', `Automatically mapped ${teacherFullName} to teach: ${targetSubjects.join(', ')} in Section ${activeWorkspaceSection}.`);
        }
      }
    });
  };

  const handleAssignSubjectTeacher = (subjectName: string, teacherId: string) => {
    if (!activeClass || !activeWorkspaceSection) return;
    const t = teachersList.find(s => s.id === teacherId);
    if (!t) return;

    // Check if assignment exists
    const exist = teacherAssignments.find(ta => 
      ta.className === activeClass.name && 
      ta.section === activeWorkspaceSection && 
      ta.subject === subjectName
    );

    assignTeacherApi(activeClass.id, activeWorkspaceSection, {
      teacher_id: teacherId,
      role: "Subject Teacher",
      subject_name: subjectName
    })
      .then(res => {
        if (res && res.success) {
          if (exist) {
            updateTeacherAssignment(exist.id, { 
              teacherId: t.id, 
              teacherName: t.name || `${t.firstName} ${t.lastName}`
            });
          } else {
            addTeacherAssignment({
              academicYear: (activeClass as any).academicYear || selectedAcademicYear || '2026-2027',
              branch: (activeClass as any).branch || selectedBranch || 'Main Campus',
              className: activeClass.name,
              section: activeWorkspaceSection,
              subject: subjectName,
              teacherId: t.id,
              teacherName: t.name || `${t.firstName} ${t.lastName}`,
              status: 'Active'
            });
          }
          addToast('success', 'Subject Teacher Mapped', `Mapped ${t.name || `${t.firstName} ${t.lastName}`} to ${subjectName} in Section ${activeWorkspaceSection}`);
        } else {
          addToast('error', 'Error', res?.message || 'Failed to assign subject teacher.');
        }
      })
      .catch(err => {
        console.error(err);
        // offline fallback
        if (exist) {
          updateTeacherAssignment(exist.id, { 
            teacherId: t.id, 
            teacherName: t.name || `${t.firstName} ${t.lastName}`
          });
        } else {
          addTeacherAssignment({
            academicYear: (activeClass as any).academicYear || selectedAcademicYear || '2026-2027',
            branch: (activeClass as any).branch || selectedBranch || 'Main Campus',
            className: activeClass.name,
            section: activeWorkspaceSection,
            subject: subjectName,
            teacherId: t.id,
            teacherName: t.name || `${t.firstName} ${t.lastName}`,
            status: 'Active'
          });
        }
        addToast('success', 'Subject Teacher Mapped', `Mapped ${t.name || `${t.firstName} ${t.lastName}`} to ${subjectName} in Section ${activeWorkspaceSection} (offline)`);
      });
  };

  const handleRemoveSubjectTeacher = (subjectName: string) => {
    if (!activeClass || !activeWorkspaceSection) return;
    verifySafetyLock(() => {
      const exist = teacherAssignments.find(ta => 
        ta.className === activeClass.name && 
        ta.section === activeWorkspaceSection && 
        ta.subject === subjectName
      );

      if (exist) {
        deleteTeacherAssignment(exist.id);
        addToast('info', 'Teacher assignment removed');
      }
    });
  };

  // Calculate teacher workloads dynamically based on assigned class/sections
  const activeTeachersWorkload = useMemo(() => {
    const loads: Record<string, { subjects: string[]; classes: string[]; periods: number }> = {};
    
    teacherAssignments.forEach(ta => {
      const sub = subjects.find(s => s.name === ta.subject);
      const periods = sub?.weeklyPeriodCount || 4;
      const tName = ta.teacherName;
      if (tName) {
        if (!loads[tName]) {
          loads[tName] = { subjects: [], classes: [], periods: 0 };
        }
        if (!loads[tName].subjects.includes(ta.subject)) {
          loads[tName].subjects.push(ta.subject);
        }
        const clSec = `${ta.className} ${ta.section}`;
        if (!loads[tName].classes.includes(clSec)) {
          loads[tName].classes.push(clSec);
        }
        loads[tName].periods += periods;
      }
    });

    return loads;
  }, [teacherAssignments, subjects]);

  // -------------------------------------------------------------
  // STUDENT SECTION ALLOCATION HANDLERS
  // -------------------------------------------------------------
  const handleSelectStudentForAlloc = (studId: string) => {
    if (selectedStudentsForAllocation.includes(studId)) {
      setSelectedStudentsForAllocation(selectedStudentsForAllocation.filter(id => id !== studId));
    } else {
      setSelectedStudentsForAllocation([...selectedStudentsForAllocation, studId]);
    }
  };

  const handleAllocateStudents = () => {
    if (!activeClass || !activeWorkspaceSection || selectedStudentsForAllocation.length === 0) return;
    
    // Check capacity constraints
    const details = (activeClass as any).sectionDetails?.[activeWorkspaceSection] || {};
    const cap = details.capacity ?? 40;
    const currentCount = activeSectionStudents.length;
    
    if (currentCount + selectedStudentsForAllocation.length > cap) {
      addToast('warning', 'Capacity Exceeded', `Cannot allocate ${selectedStudentsForAllocation.length} students. Section seat limit is ${cap}.`);
      return;
    }

    let nextRoll = currentCount + 1;
    const allocationPromises = selectedStudentsForAllocation.map(id => {
      const roll = `R-${nextRoll++}`;
      return allocateStudentApi(id, {
        section_letter: activeWorkspaceSection,
        roll_no: roll
      }).then(res => {
        if (res && res.success) {
          updateStudent(id, {
            section: activeWorkspaceSection,
            rollNo: roll
          } as any);
        }
      });
    });

    Promise.all(allocationPromises)
      .then(() => {
        addToast('success', 'Allocation complete', `Assigned ${selectedStudentsForAllocation.length} students to Section ${activeWorkspaceSection}`);
        setSelectedStudentsForAllocation([]);
      })
      .catch(err => {
        console.error(err);
        // offline fallback
        let offlineRoll = currentCount + 1;
        selectedStudentsForAllocation.forEach(id => {
          updateStudent(id, {
            section: activeWorkspaceSection,
            rollNo: `R-${offlineRoll++}`
          } as any);
        });
        addToast('success', 'Allocation complete', `Assigned ${selectedStudentsForAllocation.length} students to Section ${activeWorkspaceSection} (offline)`);
        setSelectedStudentsForAllocation([]);
      });
  };

  const handleRemoveStudentFromSection = (studId: string) => {
    verifySafetyLock(() => {
      updateStudent(studId, {
        section: '',
        rollNo: ''
      } as any);
      addToast('info', 'Student de-allocated');
    });
  };

  const handleChangeStudentSection = (studId: string, destSec: string) => {
    if (!activeClass) return;
    verifySafetyLock(() => {
      const details = (activeClass as any).sectionDetails?.[destSec] || {};
      const cap = details.capacity ?? 40;
      const destCount = students.filter(s => s.className === activeClass.name && s.section === destSec).length;

      if (destCount >= cap) {
        addToast('warning', 'Section Full', `Cannot transfer student. Section ${destSec} has reached its capacity.`);
        return;
      }

      allocateStudentApi(studId, {
        section_letter: destSec,
        roll_no: `R-${destCount + 1}`
      })
        .then(res => {
          if (res && res.success) {
            updateStudent(studId, {
              section: destSec,
              rollNo: `R-${destCount + 1}`
            } as any);
            addToast('success', 'Student Transferred', `Moved student to Section ${destSec}`);
          } else {
            addToast('error', 'Error', res?.message || 'Failed to transfer student.');
          }
        })
        .catch(err => {
          console.error(err);
          // offline fallback
          updateStudent(studId, {
            section: destSec,
            rollNo: `R-${destCount + 1}`
          } as any);
          addToast('success', 'Student Transferred', `Moved student to Section ${destSec} (offline)`);
        });
    });
  };

  const handleUpdateRollNumber = (studId: string, newRoll: string) => {
    updateStudent(studId, { rollNo: newRoll } as any);
    addToast('success', 'Roll Number Saved');
  };

  // Auto Allocate Students evenly among sections
  const handleAutoAllocate = () => {
    if (!activeClass) return;
    const activeSecs = activeClass.sections;
    if (activeSecs.length === 0) {
      addToast('warning', 'No Sections', 'Please configure class sections first.');
      return;
    }

    const unassigned = unassignedStudentsInClass;
    if (unassigned.length === 0) {
      addToast('info', 'All Allocated', 'There are no unassigned students left.');
      return;
    }

    autoAllocateApi(activeClass.id)
      .then(res => {
        if (res && res.success) {
          let secIdx = 0;
          unassigned.forEach(stud => {
            const targetSec = activeSecs[secIdx % activeSecs.length];
            const details = (activeClass as any).sectionDetails?.[targetSec] || {};
            const cap = details.capacity ?? 40;
            const count = students.filter(s => s.className === activeClass.name && s.section === targetSec).length;
            
            if (count < cap) {
              updateStudent(stud.id, {
                section: targetSec,
                rollNo: `R-${count + 1}`
              } as any);
            }
            secIdx++;
          });
          addToast('success', 'Auto-allocated Students', 'Distributed unallocated students evenly among active sections.');
        } else {
          addToast('error', 'Error', res?.message || 'Failed to auto allocate students.');
        }
      })
      .catch(err => {
        console.error(err);
        // offline fallback
        let secIdx = 0;
        unassigned.forEach(stud => {
          const targetSec = activeSecs[secIdx % activeSecs.length];
          const details = (activeClass as any).sectionDetails?.[targetSec] || {};
          const cap = details.capacity ?? 40;
          const count = students.filter(s => s.className === activeClass.name && s.section === targetSec).length;
          
          if (count < cap) {
            updateStudent(stud.id, {
              section: targetSec,
              rollNo: `R-${count + 1}`
            } as any);
          }
          secIdx++;
        });
        addToast('success', 'Auto-allocated Students', 'Distributed unallocated students evenly among active sections (offline).');
      });
  };

  // Auto Generate Roll Numbers sequentially
  const handleAutoGenerateRolls = () => {
    if (!activeClass || !activeWorkspaceSection) return;
    const roster = activeSectionStudents;
    roster.forEach((stud, idx) => {
      updateStudent(stud.id, {
        rollNo: `R-${idx + 1}`
      } as any);
    });
    addToast('success', 'Roll Numbers Generated', `Sequenced ${roster.length} roll numbers.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12 text-slate-900 dark:text-slate-101 text-left">
      
      <div className="min-h-[65vh]">

        {/* -------------------------------------------------------------
            MODULE: CLASSES DIRECTORY & COCKPIT WORKSPACE
            ------------------------------------------------------------- */}
        <div className="space-y-6">
          {activeClass ? (
            // Selected class cockpit workspace tabs
            <div className="space-y-6 animate-in fade-in">
              
              {/* Cockpit breadcrumb & headers */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-808 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <button onClick={() => setSelectedClassId('')} className="hover:text-sky-600 flex items-center gap-0.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Classes Setup
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-505" />
                    <span className="text-slate-900 dark:text-white font-extrabold">{activeClass.name} Workspace</span>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <h3 className="text-xl font-black text-slate-905 dark:text-white">
                      {activeClass.name} Workspace
                    </h3>
                    <Badge variant={activeClassProgress?.status === 'Ready' ? 'success' : 'warning'}>
                      {activeClassProgress?.status || 'In Progress'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedClassId('')}
                    className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Setup Directory
                  </button>
                </div>
              </div>

              {/* Workspace tab navigation bar */}
              <div className="flex border-b border-slate-200 dark:border-slate-808 gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart2 },
                  { id: 'sections', label: 'Sections', icon: Layers },
                  { id: 'subjects', label: 'Subjects', icon: BookOpen },
                  { id: 'teachers', label: 'Teachers', icon: Users },
                  { id: 'students', label: 'Students', icon: UserPlus }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setClassWorkspaceTab(tab.id as any)}
                      className={`px-4.5 py-3 border-b-2 font-black text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
                        classWorkspaceTab === tab.id 
                          ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-black' 
                          : 'border-transparent text-slate-400 hover:text-slate-905'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* WORKSPACE TAB RENDERING */}
              <div className="min-h-[450px]">
                {classWorkspaceTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in text-left">
                    {/* Six small KPI cards */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Students</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{activeClassStudents.length}</span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Sections</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">{activeClass.sections.length}</span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Teachers</span>
                        <span className="text-xl font-black text-emerald-650">
                          {new Set(teacherAssignments.filter(ta => ta.className === activeClass.name).map(ta => ta.teacherName)).size || 0}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Subjects</span>
                        <span className="text-xl font-black text-indigo-650">{(activeClass.subjects || []).length}</span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Capacity</span>
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {sectionKPIs?.totalCapacity ?? 40}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl">
                        <span className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Health Score</span>
                        <span className="text-xl font-black text-sky-655">{activeClassProgress?.score}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-bold">
                      {/* Class Teacher detail */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl space-y-4">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">Class Teacher</h4>
                        <div className="space-y-2">
                          {activeClass.sections.map(sec => {
                            const classTeacher = ((activeClass as any).sectionTeachers || {})[sec] || 'Not Assigned';
                            return (
                              <div key={sec} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span>Section {sec}:</span>
                                <span className={classTeacher === 'Not Assigned' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>{classTeacher}</span>
                              </div>
                            );
                          })}
                          {activeClass.sections.length === 0 && (
                            <p className="text-slate-400 italic text-xs text-center py-2">No sections configured.</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Panel */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl space-y-4">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button onClick={() => setClassWorkspaceTab('sections')} className="p-2.5 bg-slate-50 hover:bg-slate-100 border text-slate-850 rounded-xl text-center">Add Section</button>
                          <button onClick={() => setClassWorkspaceTab('subjects')} className="p-2.5 bg-slate-50 hover:bg-slate-100 border text-slate-850 rounded-xl text-center">Assign Subject</button>
                          <button onClick={() => setClassWorkspaceTab('teachers')} className="p-2.5 bg-slate-50 hover:bg-slate-100 border text-slate-850 rounded-xl text-center">Assign Teacher</button>
                          <button onClick={() => setClassWorkspaceTab('students')} className="p-2.5 bg-slate-50 hover:bg-slate-100 border text-slate-850 rounded-xl text-center">Allocate Students</button>
                        </div>
                      </div>

                      {/* Configuration Checklist status */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl space-y-4">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">Setup checklist</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center py-1 border-b">
                            <span>Sections created:</span>
                            <span className={activeClass.sections.length > 0 ? 'text-emerald-500' : 'text-rose-500'}>{activeClass.sections.length > 0 ? '✔ Yes' : '✖ No'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span>Subjects mapped:</span>
                            <span className={(activeClass.subjects || []).length > 0 ? 'text-emerald-500' : 'text-rose-500'}>{(activeClass.subjects || []).length > 0 ? '✔ Yes' : '✖ No'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span>Class Teachers:</span>
                            <span className={activeClassProgress?.hasAllClassTeachers ? 'text-emerald-500' : 'text-rose-500'}>{activeClassProgress?.hasAllClassTeachers ? '✔ Assigned' : '✖ Missing'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section listing cards */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider text-slate-400">Sections</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {activeClass.sections.map(sec => {
                          const detail = ((activeClass as any).sectionDetails || {})[sec] || {};
                          const cap = detail.capacity ?? 40;
                          const assigned = students.filter(s => s.className === activeClass.name && s.section === sec).length;

                          return (
                            <div key={sec} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl space-y-3 font-bold text-xs text-left">
                              <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-sm font-black text-slate-900 dark:text-white">Section {sec}</span>
                                <span className="text-slate-400">{assigned} / {cap} Students</span>
                              </div>
                              <div className="flex justify-between text-slate-455">
                                <span>Class Teacher:</span>
                                <span className="text-slate-900 dark:text-white">{((activeClass as any).sectionTeachers || {})[sec] || 'Not Assigned'}</span>
                              </div>
                              <div className="flex justify-between gap-2 pt-2 border-t text-[11px]">
                                <button onClick={() => handleOpenEditSection(sec)} className="text-sky-655 hover:underline">Edit</button>
                                <button onClick={() => triggerDeleteSectionCheck(sec)} className="text-rose-500 hover:underline">Delete</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subjects and Mapped Teachers summaries */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-bold text-xs">
                      {/* Subjects list */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl space-y-3">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">Mapped Subjects</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(activeClass.subjects || []).map(sub => (
                            <span key={sub} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border rounded-xl">{sub}</span>
                          ))}
                          {(activeClass.subjects || []).length === 0 && (
                            <p className="text-slate-400 italic py-2">No subjects mapped to this class.</p>
                          )}
                        </div>
                      </div>

                      {/* Teachers Assignments summaries */}
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl space-y-3 text-left">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-400">Teacher Mappings</h4>
                        <div className="divide-y divide-slate-100 dark:divide-slate-808 space-y-1.5">
                          {teacherAssignments.filter(ta => ta.className === activeClass.name && ta.section === activeWorkspaceSection).map((ta, idx) => (
                            <div key={idx} className="flex justify-between py-1">
                              <span className="text-slate-400">{ta.subject}:</span>
                              <span>{ta.teacherName}</span>
                            </div>
                          ))}
                          {teacherAssignments.filter(ta => ta.className === activeClass.name && ta.section === activeWorkspaceSection).length === 0 && (
                            <p className="text-slate-455 italic text-center py-2">No subject instructors mapped for Section {activeWorkspaceSection}.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COCKPIT TAB: SECTIONS DETAILS */}
                {classWorkspaceTab === 'sections' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Dashboard KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Sections</span>
                        <span className="text-lg font-black text-slate-850 dark:text-white">{sectionKPIs?.totalSections ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Active Sections</span>
                        <span className="text-lg font-black text-emerald-600">{sectionKPIs?.activeSections ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Inactive Sections</span>
                        <span className="text-lg font-black text-rose-600">{sectionKPIs?.inactiveSections ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Capacity</span>
                        <span className="text-lg font-black text-slate-850 dark:text-white">{sectionKPIs?.totalCapacity ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Occupied Seats</span>
                        <span className="text-lg font-black text-sky-600">{sectionKPIs?.occupiedSeats ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Remaining Seats</span>
                        <span className="text-lg font-black text-amber-505">{sectionKPIs?.remainingSeats ?? 0}</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Avg Occupancy</span>
                        <span className="text-lg font-black text-sky-600">{sectionKPIs?.averageOccupancy ?? 0}%</span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-2xl">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Waiting list</span>
                        <span className="text-lg font-black text-purple-650">{sectionKPIs?.studentsWaiting ?? 0}</span>
                      </div>
                    </div>

                    {/* Filter & Search actions bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-808 text-xs font-bold">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search Section..."
                            value={sectionSearchText}
                            onChange={e => setSectionSearchText(e.target.value)}
                            className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs w-40"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowBulkAddModal(true)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-805 hover:bg-slate-202 text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-1 border border-slate-200"
                        >
                          <Clipboard className="w-3.5 h-3.5" /> Bulk Add Sections
                        </button>
                        <button
                          onClick={handleOpenAddSection}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-505 text-white rounded-xl shadow flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Add Section
                        </button>
                      </div>
                    </div>

                    {/* Bulk actions panel */}
                    {selectedSections.length > 0 && (
                      <div className="p-3 bg-sky-50/50 dark:bg-sky-955/20 border border-sky-100 dark:border-sky-900 rounded-2xl flex items-center justify-between text-xs font-bold gap-3">
                        <span>Selected: {selectedSections.length} sections</span>
                        <div className="flex gap-2 items-center flex-wrap">
                          <button onClick={handleBulkDelete} className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-250 transition-colors">Delete Selected</button>
                          <button onClick={handleBulkArchive} className="px-3 py-1 bg-slate-105 hover:bg-slate-200 text-slate-705 dark:text-slate-200 rounded-lg border border-slate-250 transition-colors">Archive Selected</button>
                          <div className="h-4 w-px bg-slate-200 dark:bg-slate-808 mx-1" />

                          <select
                            onChange={e => {
                              if (e.target.value) handleBulkUpdateCapacity(parseInt(e.target.value));
                            }}
                            className="p-1 rounded bg-white dark:bg-slate-808 border border-slate-200 text-[11px]"
                          >
                            <option value="">Bulk Update Capacity...</option>
                            <option value="30">30 Seats</option>
                            <option value="40">40 Seats</option>
                            <option value="50">50 Seats</option>
                            <option value="60">60 Seats</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Sections Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {filteredSectionsList.map(sec => {
                        const detail = ((activeClass as any).sectionDetails || {})[sec] || {};
                        const cap = detail.capacity ?? 40;
                        const assigned = students.filter(s => s.className === activeClass.name && s.section === sec).length;
                        const free = Math.max(0, cap - assigned);
                        const percent = Math.min(100, Math.round((assigned / (cap || 1)) * 100));

                        const isSelected = selectedSections.includes(sec);
                        const status = detail.status || 'Active';
                        const classTeacher = ((activeClass as any).sectionTeachers || {})[sec] || 'Unassigned';

                        return (
                          <div 
                            key={sec} 
                            className={`p-5 rounded-3xl border text-left flex flex-col justify-between space-y-4 relative transition-all ${
                              status === 'Archived' 
                                ? 'opacity-60 bg-slate-50/50 dark:bg-slate-905/30 border-slate-200 dark:border-slate-850'
                                : isSelected 
                                  ? 'border-sky-505 bg-sky-50/20 dark:bg-sky-955/10 shadow-md border-sky-500'
                                  : 'border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 hover:border-sky-500 hover:shadow'
                            }`}
                          >
                            {/* Selection checkbox */}
                            <div className="flex items-center justify-between border-b border-slate-101 dark:border-slate-808 pb-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) setSelectedSections(selectedSections.filter(s => s !== sec));
                                    else setSelectedSections([...selectedSections, sec]);
                                  }}
                                  className="rounded border-slate-300 text-sky-600 dark:bg-slate-855"
                                />
                                <span className="text-base font-black text-slate-850 dark:text-white">Section {sec}</span>
                              </div>
                              <Badge variant={status === 'Active' ? 'success' : status === 'Archived' ? 'danger' : 'warning'}>
                                {status}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-350 font-bold">
                              <div className="flex justify-between"><span className="text-slate-450">Current Enrolled:</span> <span>{assigned} Students</span></div>
                              <div className="flex justify-between"><span className="text-slate-450">Seats Remaining:</span> <span className="text-sky-600">{free} / {cap} Seats</span></div>
                              <div className="flex justify-between"><span className="text-slate-450">Class Teacher:</span> <span className="text-slate-800 dark:text-white">{classTeacher}</span></div>
                            </div>

                            {/* Progress occupancy bar */}
                            <div className="space-y-1 pt-1.5 font-bold">
                              <div className="flex justify-between items-baseline text-[10px] text-slate-450 uppercase font-mono">
                                  <span>Occupancy Rate</span>
                                  <span className={percent > 95 ? 'text-rose-500' : percent > 80 ? 'text-amber-500' : 'text-emerald-500'}>{percent}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 flex">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    percent > 95 ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>

                            {/* Quick actions controls */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-101 dark:border-slate-808 text-xs font-bold">
                              <div className="flex gap-2">
                                {status !== 'Archived' ? (
                                  <>
                                    <button onClick={() => handleOpenEditSection(sec)} className="text-sky-600 hover:underline">Edit Setup</button>
                                    <button onClick={() => handleArchiveSection(sec)} className="text-slate-400 hover:text-amber-600 hover:underline">Archive</button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-slate-400 uppercase">Read Only</span>
                                    <button onClick={() => handleRestoreSection(sec)} className="text-emerald-600 hover:underline">Restore Active</button>
                                  </>
                                )}
                              </div>
                              {status !== 'Archived' && (
                                <button onClick={() => triggerDeleteSectionCheck(sec)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Checklist & Save workflow redirect section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-808 items-start">
                      {/* Checklist */}
                      <div className="md:col-span-2 p-5 bg-white dark:bg-slate-905 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div>
                          <h5 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-4.5 h-4.5 text-sky-505" /> Sections Configuration Checklist
                          </h5>
                          <p className="text-xs text-slate-500">Every grade level requires active sections for timetabling and student registers.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-normal">
                          {sectionChecklist.map(check => (
                            <div 
                              key={check.id} 
                              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                                check.passed 
                                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900 text-slate-700 dark:text-slate-300' 
                                  : check.isWarning
                                    ? 'bg-amber-50/20 dark:bg-amber-955/10 border-amber-100 dark:border-amber-900 text-amber-700'
                                    : 'bg-slate-55 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="font-bold">{check.id}. {check.name}</span>
                              {check.passed ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                              ) : check.isWarning ? (
                                <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Completion card */}
                      <div className="p-5 bg-sky-50/20 dark:bg-sky-955/10 border border-sky-100 dark:border-sky-900 rounded-3xl space-y-4">
                        <h5 className="text-xs font-black uppercase text-sky-600 tracking-wider">Save & Continue</h5>
                        <p className="text-xs text-slate-505 leading-relaxed font-bold">
                          Validates section letters, rooms, and floor configs. Upon successful save, we will proceed immediately to the Subjects Mapping tab.
                        </p>
                        <button
                          onClick={handleSaveAndContinue}
                          disabled={!isSectionsSetupValid}
                          className="w-full py-3 bg-sky-600 hover:bg-sky-505 text-white font-extrabold text-xs rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Save & Continue to Subjects
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* COCKPIT TAB: SUBJECTS MAPPING */}
                {classWorkspaceTab === 'subjects' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-202 dark:border-slate-808 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white">Class Subject Mapping</h4>
                        <p className="text-xs text-slate-500">
                          Map which global course subjects are applicable to {activeClass.name}.{' '}
                          <button
                            onClick={() => onTabChange?.('subjects')}
                            className="text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            Configure Global Subjects &rarr;
                          </button>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {subjects.map(sub => {
                            const isMapped = (activeClass.subjects || []).includes(sub.name);
                            return (
                              <div 
                                key={sub.id} 
                                onClick={() => handleToggleSubjectMapping(sub.name)}
                                className={`p-4 rounded-3xl border text-left cursor-pointer transition-all flex items-center justify-between font-bold ${
                                  isMapped 
                                    ? 'border-sky-505 bg-sky-50/20 dark:bg-sky-955/10' 
                                    : 'border-slate-200 dark:border-slate-808 hover:border-slate-350 bg-white dark:bg-slate-900'
                                }`}
                              >
                                <div>
                                  <p className="text-xs text-slate-900 dark:text-white">{sub.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.code || sub.subjectId} ({sub.weeklyPeriodCount || 4} periods/week)</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isMapped ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                                }`}>
                                  {isMapped && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-5 bg-slate-50 dark:bg-slate-905 border border-slate-202 dark:border-slate-800 rounded-3xl space-y-4 text-xs font-bold leading-normal">
                        <h5 className="font-extrabold text-slate-900 dark:text-white">Subject Setup Validation</h5>
                        <p className="text-slate-505">Toggling subjects maps them immediately to the class profile.</p>
                        <ul className="list-disc list-inside space-y-1 pl-1 text-slate-400 font-medium">
                          <li>Core academic theory courses.</li>
                          <li>Practical labs double workload calculations.</li>
                          <li>Weekly period constraints guide scheduling slots.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* COCKPIT TAB: TEACHERS ASSIGNMENT */}
                {classWorkspaceTab === 'teachers' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Section Selector inside teachers */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-808 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white">Class Teacher & Subject Teacher Mappings</h4>
                        <p className="text-xs text-slate-505">
                          Select class section to configure instructor workload allocations.{' '}
                          <button
                            onClick={() => onTabChange?.('staff')}
                            className="text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            Manage Staff Directory &rarr;
                          </button>
                        </p>
                      </div>
                      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-955 rounded-2xl border border-slate-200/50">
                        {activeClass.sections.map(sec => (
                          <button
                            key={sec}
                            onClick={() => setActiveWorkspaceSection(sec)}
                            className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition-all ${
                              activeWorkspaceSection === sec 
                                ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' 
                                : 'text-slate-455 hover:text-slate-900'
                            }`}
                          >
                            Section {sec}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Class Teacher Allocation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl space-y-4 text-left">
                        <h5 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase text-sky-655 tracking-wider">Class Teacher</h5>
                        <div className="space-y-2">
                          <label className="block text-xs text-slate-400 font-bold">Class Teacher Selection</label>
                          <select
                            value={teachersList.find(t => (t.name || `${t.firstName} ${t.lastName}`) === ((activeClass as any).sectionTeachers || {})[activeWorkspaceSection])?.id || ''}
                            onChange={e => handleAssignClassTeacher(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-888 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-xs"
                          >
                            <option value="">Unassigned</option>
                            {teachersList.map(t => {
                               const fullName = t.name || `${t.firstName} ${t.lastName}`;
                               const empId = t.empId || t.id;
                               const desig = t.designation || 'Teacher';
                               return (
                                 <option key={t.id} value={t.id}>
                                   {fullName} ({empId}) - {desig}
                                 </option>
                               );
                             })}
                          </select>
                        </div>

                        {/* Designation & Subject */}
                        {(() => {
                          const selectedTeacherName = ((activeClass as any).sectionTeachers || {})[activeWorkspaceSection];
                          const selectedTeacher = teachersList.find(t => (t.name || `${t.firstName} ${t.lastName}`) === selectedTeacherName);
                          if (!selectedTeacher) return null;
                          const subjectsStr = [
                            selectedTeacher.primarySubject,
                            selectedTeacher.secondarySubject,
                            ...(selectedTeacher.assignedSubjects || [])
                          ].filter(Boolean);
                          
                          if (subjectsStr.length === 0) {
                            const offeredSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Science', 'English', 'History', 'Geography', 'Social Studies', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies'];
                            const extracted = offeredSubjects.filter(sub => 
                              (selectedTeacher.designation || '').toLowerCase().includes(sub.toLowerCase()) ||
                              (selectedTeacher.department || '').toLowerCase().includes(sub.toLowerCase())
                            );
                            if (extracted.length > 0) {
                              subjectsStr.push(...extracted);
                            }
                          }
                          const uniqueSubjects = Array.from(new Set(subjectsStr)).join(', ');
                          return (
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-808 rounded-2xl space-y-1.5 text-xs font-bold text-slate-655 dark:text-slate-350">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Designation:</span>
                                <span className="text-slate-900 dark:text-white">{selectedTeacher.designation || 'Teacher'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subject:</span>
                                <span className="text-slate-900 dark:text-white truncate max-w-[150px]">{uniqueSubjects || 'General'}</span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 rounded-2xl text-[10px] text-slate-400 font-medium">
                          Only one active Class Teacher can be allocated per section.
                        </div>
                      </div>

                      {/* Subject Teachers Grid */}
                      <div className="md:col-span-2 p-5 bg-white dark:bg-slate-905 border border-slate-202 dark:border-slate-800 rounded-3xl space-y-4">
                        <h5 className="font-extrabold text-slate-905 dark:text-white text-xs uppercase text-indigo-650 tracking-wider">Subject Teachers Mapping</h5>
                        
                        <div className="divide-y divide-slate-100 dark:divide-slate-808 space-y-2.5">
                          {(activeClass.subjects || []).map(subName => {
                            const mapping = teacherAssignments.find(ta => 
                              ta.className === activeClass.name && 
                              ta.section === activeWorkspaceSection && 
                              ta.subject === subName
                            );
                            return (
                              <div key={subName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 text-xs">
                                  <div>
                                    <p className="font-extrabold text-slate-900 dark:text-white">{subName}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const qualifiedTeachers = teachersList.filter(t => isTeacherForSubject(t, subName));
                                      const displayTeachers = qualifiedTeachers.length > 0 ? qualifiedTeachers : teachersList;
                                      return (
                                        <select
                                          value={mapping?.teacherId || ''}
                                          onChange={e => handleAssignSubjectTeacher(subName, e.target.value)}
                                          className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg font-bold text-[11px] max-w-[220px]"
                                        >
                                          <option value="">Unassigned</option>
                                          {displayTeachers.map(t => {
                                            const fullName = t.name || `${t.firstName} ${t.lastName}`;
                                            const empId = t.empId || t.id;
                                            const desig = t.designation || 'Teacher';
                                            return (
                                              <option key={t.id} value={t.id}>
                                                {fullName} ({empId}) - {desig}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      );
                                    })()}
                                    {mapping && (
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveSubjectTeacher(subName)}
                                        className="p-1 text-slate-400 hover:text-rose-605"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                            );
                          })}
                          {(activeClass.subjects || []).length === 0 && (
                            <p className="text-slate-400 py-6 text-center">Please map subjects to this class setup before allocating instructors.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Teacher Workload summaries grid */}
                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl space-y-4">
                      <h5 className="font-extrabold text-slate-850 dark:text-white text-xs uppercase tracking-wider text-slate-400">Instructor Workload Summaries</h5>
                      <div className="overflow-x-auto border rounded-2xl bg-white dark:bg-slate-950 text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 uppercase text-[9px] text-slate-400 font-mono">
                            <tr>
                              <th className="p-3">Instructor</th>
                              <th className="p-3">Assigned Courses</th>
                              <th className="p-3">Assigned Classes</th>
                              <th className="p-3 text-center">Weekly Load (Periods)</th>
                              <th className="p-3 text-right">Allocation Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-808 font-bold">
                            {Object.keys(activeTeachersWorkload).map(tName => {
                              const wl = activeTeachersWorkload[tName];
                              let status = 'Available';
                              let color = 'text-emerald-500';
                              if (wl.periods > 32) {
                                status = 'Overloaded';
                                color = 'text-rose-500';
                              } else if (wl.periods >= 20) {
                                status = 'Fully Mapped';
                                color = 'text-sky-600';
                              }

                              return (
                                <tr key={tName} className="hover:bg-slate-50/50">
                                  <td className="p-3 text-slate-905 dark:text-white">{tName}</td>
                                  <td className="p-3">{wl.subjects.join(', ')}</td>
                                  <td className="p-3 font-mono">{wl.classes.join(', ')}</td>
                                  <td className="p-3 text-center font-mono">{wl.periods}</td>
                                  <td className={`p-3 text-right ${color}`}>{status}</td>
                                </tr>
                              );
                            })}
                            {Object.keys(activeTeachersWorkload).length === 0 && (
                              <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">No assigned instructor workload.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                 {/* COCKPIT TAB: STUDENT SECTION ALLOCATOR */}
                {classWorkspaceTab === 'students' && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Section and Capacity settings */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-202 dark:border-slate-808 pb-3">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white">Student Section Assignment</h4>
                        <p className="text-xs text-slate-550">
                          Total Class strength: <strong>{activeClassStudents.length} Students</strong>.{' '}
                          <button
                            onClick={() => onTabChange?.('student-directory')}
                            className="text-sky-600 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            Open Student Directory &rarr;
                          </button>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAutoAllocate}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-202 text-slate-705 font-extrabold text-[11px] rounded-xl border flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Auto-Allocate Students
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-3 bg-slate-55 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-808 text-xs font-bold">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search student name or ID..."
                          value={studentSearchQuery}
                          onChange={e => setStudentSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-805 border border-slate-200 rounded-xl outline-none text-xs w-48"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-950">
                      <table className="w-full text-xs text-left font-bold">
                        <thead className="bg-slate-55 uppercase text-[9px] text-slate-400 font-mono">
                          <tr>
                            <th className="p-3">Admission No</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Section</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-808">
                          {activeClassStudents
                            .filter(s => {
                              const nameStr = `${s.firstName} ${s.lastName}`.toLowerCase();
                              return !studentSearchQuery || nameStr.includes(studentSearchQuery.toLowerCase()) || s.id.includes(studentSearchQuery);
                            })
                            .map(stud => (
                              <tr key={stud.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="p-3 font-mono text-slate-400">{stud.id || 'REG-1001'}</td>
                                <td className="p-3 text-slate-900 dark:text-white">{stud.firstName} {stud.lastName}</td>
                                <td className="p-3">
                                  {stud.section ? (
                                    <Badge variant="success">Section {stud.section}</Badge>
                                  ) : (
                                    <Badge variant="warning">Unassigned</Badge>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <select
                                    value={stud.section || ''}
                                    onChange={e => handleChangeStudentSection(stud.id, e.target.value)}
                                    className="p-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-[11px]"
                                  >
                                    <option value="">Unassigned</option>
                                    {activeClass.sections.map(sec => (
                                      <option key={sec} value={sec}>Section {sec}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          {activeClassStudents.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                No students admitted to this class.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}


              </div>

            </div>
          ) : (
            // Class list setups directory view (Setup Directory)
            <div className="space-y-6 animate-in fade-in">
              
              {/* Dashboard summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <StatCard title="Total Classes" value={classKPIs.total} icon={Presentation} color="sky" />
                <StatCard title="Active Classes" value={classKPIs.active} icon={CheckCircle2} color="emerald" />
                <StatCard title="Archived Classes" value={classKPIs.archived} icon={Archive} color="rose" />
                <StatCard title="Total Capacity" value={classKPIs.totalCapacity} icon={Layers} color="indigo" />
                <StatCard title="Occupied Seats" value={classKPIs.occupiedSeats} icon={Users} color="purple" />
                <StatCard title="Remaining Seats" value={classKPIs.remainingSeats} icon={ShieldCheck} color="amber" />
              </div>

              {/* Search & Filter settings panel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full py-2">
                {/* Search bar on the left */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by Class Name..."
                    value={searchClassName}
                    onChange={e => setSearchClassName(e.target.value)}
                    className="pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-xs text-slate-900 dark:text-white w-48 sm:w-60 focus:w-72 transition-all font-semibold"
                  />
                </div>

                {/* Filter and Add button on the right */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 uppercase font-mono font-bold">Status</span>
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-xs cursor-pointer text-slate-700 dark:text-slate-200"
                      >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Archived">Archived</option>
                        <option value="Draft">Draft</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <button
                    onClick={handleOpenAddClass}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-505 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Class Grade
                  </button>
                </div>
              </div>

              {/* Class setup cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredClasses.map(cl => {
                  const count = students.filter(s => s.className === cl.name).length;
                  const status = (cl as any).status || 'Active';
                  const campus = (cl as any).campus || (cl as any).branch || 'Main Campus';
                  const ay = (cl as any).academicYear || '2026-2027';

                  const details = (cl as any).sectionDetails || {};
                  let cap = 0;
                  cl.sections.forEach(s => {
                    cap += (details[s]?.capacity ?? 40);
                  });
                  if (cap === 0) cap = cl.sections.length * 40;

                  const seatsLeft = Math.max(0, cap - count);
                  
                  // Setup progression metrics
                  const cp = classesProgress.find(c => c.class.id === cl.id);
                  const pct = cp ? cp.score : 0;

                  return (
                    <div 
                      key={cl.id} 
                      className={`p-5 rounded-xl border shadow-sm transition-all duration-300 space-y-4 hover:-translate-y-1 hover:shadow-md relative text-left bg-white dark:bg-slate-900 ${
                        status === 'Archived' 
                          ? 'border-slate-200 dark:border-slate-800 opacity-60' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-sky-500'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-808 pb-2.5">
                        <div>
                          <span className="text-base font-black text-slate-855 dark:text-white">
                            {cl.name}
                          </span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-808 text-slate-505 px-2 py-0.5 rounded ml-2 font-mono">{(cl as any).displayOrder !== undefined ? `Order: ${(cl as any).displayOrder}` : cl.id}</span>
                        </div>
                        <Badge variant={status === 'Active' ? 'success' : status === 'Archived' ? 'danger' : 'warning'}>
                          {status}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-355 font-bold">
                        <div className="flex justify-between"><span className="text-slate-455">Campus Location:</span> <span className="font-extrabold text-slate-900 dark:text-white">{campus}</span></div>
                        <div className="flex justify-between"><span className="text-slate-455">Session Cycle:</span> <span className="font-bold">{ay}</span></div>
                        <div className="flex justify-between"><span className="text-slate-455">Total Sections:</span> <span className="font-mono">{cl.sections.length} ({cl.sections.join(', ') || 'None'})</span></div>
                        <div className="flex justify-between"><span className="text-slate-455">Capacity Status:</span> <span className="font-bold">{count} / {cap} Seats</span></div>
                        <div className="flex justify-between"><span className="text-slate-455">Seats Remaining:</span> <span className="font-extrabold text-sky-655">{seatsLeft} Seats</span></div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>Setup progress</span>
                          <span className="text-sky-600 font-bold">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.2">
                          <div className="h-full bg-sky-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-101 dark:border-slate-808">
                        <div className="flex gap-2 text-xs font-bold">
                          {status !== 'Archived' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedClassId(cl.id);
                                  if (!['sections', 'subjects', 'teachers', 'students', 'overview'].includes(classWorkspaceTab)) {
                                    setClassWorkspaceTab('sections');
                                  }
                                }}
                                className="text-xs font-black text-sky-600 hover:underline"
                              >
                                Open Workspace
                              </button>
                              <button onClick={() => handleOpenEditClass(cl)} className="text-[10px] text-slate-400 hover:text-sky-655 font-bold hover:underline">Edit</button>
                              <button onClick={() => handleArchiveClass(cl)} className="text-[10px] text-slate-400 hover:text-amber-600 font-bold hover:underline">Archive</button>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] text-slate-400 font-extrabold">READ ONLY</span>
                              <button onClick={() => handleRestoreClass(cl)} className="text-[10px] text-emerald-600 font-bold hover:underline">Restore Active</button>
                            </>
                          )}
                        </div>
                        {status !== 'Archived' && (
                          <button onClick={() => triggerDeleteCheck(cl)} className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredClasses.length === 0 && (
                  <div className="md:col-span-3 p-12 border border-dashed border-slate-300 dark:border-slate-808 rounded-3xl text-center py-20">
                    <Presentation className="w-10 h-10 mx-auto text-slate-350" />
                    <p className="font-extrabold mt-2">No class setup profiles found.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* -------------------------------------------------------------
          MODALS & OVERLAY COMPONENTS
          ------------------------------------------------------------- */}

      {/* DEPENDENCY BLOCKER MODAL */}
      {dependencyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-808 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-655">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-slate-905 dark:text-white">{dependencyModalData.title}</h3>
            </div>
            <p className="text-xs text-slate-500 font-bold">You cannot delete this configuration because active dependencies exist:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold pl-1.5">
              {dependencyModalData.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <div className="flex justify-end pt-2 border-t border-slate-101 dark:border-slate-800">
              <button onClick={() => setDependencyModalData(null)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl">Close Blocker</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (CLASS) */}
      <ConfirmModal
        isOpen={!!classToDelete}
        title="Delete Class Setup"
        message={`Are you sure you want to delete Class ${classToDelete?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setClassToDelete(null)}
      />

      {/* CONFIRM DELETE MODAL (SECTION) */}
      <ConfirmModal
        isOpen={!!sectionToDelete}
        title="Delete Section Setup"
        message={`Are you sure you want to delete Section ${sectionToDelete}?`}
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setSectionToDelete(null)}
      />

      {/* ADD / EDIT CLASS DIALOG */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-222 dark:border-slate-808 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingClass ? 'Edit Class Parameters' : 'Add Class Grade'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="p-1 text-slate-405 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={editingClass ? handleUpdateClass : handleSaveClass} className="space-y-4 text-xs font-bold">
              {!editingClass ? (
                <>
                  <div>
                    <label className="block text-slate-750 dark:text-slate-350 mb-1">Select Class *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-left text-slate-800 dark:text-slate-100 cursor-pointer"
                      >
                        <span>{classForm.name === 'Other' ? (customClassName || 'Other (Custom...)') : (classForm.name || 'Select Class...')}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>

                      {isClassDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsClassDropdownOpen(false)}
                          />
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-20 p-1">
                            {CLASS_NAMES.map(c => {
                              const isSelected = classForm.name === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setClassForm({ ...classForm, name: c });
                                    if (c !== 'Other') {
                                      setCustomClassName('');
                                    }
                                    setIsClassDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                    isSelected 
                                      ? 'bg-sky-500 text-white font-bold' 
                                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {classForm.name === 'Other' && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-slate-750 dark:text-slate-350 mb-1">Custom Class Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Class 11 - Science"
                        value={customClassName}
                        onChange={e => setCustomClassName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-808 space-y-1.5">
                  <p><span className="text-slate-455">Campus:</span> {classForm.campus}</p>
                  <p><span className="text-slate-455">Session Year:</span> {classForm.academicYear}</p>
                  <p><span className="text-slate-455">Class Name:</span> {classForm.name === 'Other' ? customClassName : classForm.name}</p>
                </div>
              )}


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Display Order (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={classForm.displayOrder}
                    onChange={e => setClassForm({ ...classForm, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-707 mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={classForm.status}
                      onChange={e => setClassForm({ ...classForm, status: e.target.value as any })}
                      className="w-full appearance-none px-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none cursor-pointer text-slate-800 dark:text-slate-100"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Remarks / Comments</label>
                <textarea
                  placeholder="Additional remarks..."
                  value={classForm.remarks}
                  onChange={e => setClassForm({ ...classForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-202 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  disabled={isSubmitting} 
                  onClick={() => setIsClassModalOpen(false)} 
                  className="px-4 py-2 text-slate-655 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2 text-white bg-sky-600 hover:bg-sky-505 rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      {editingClass ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editingClass ? 'Save Setup' : 'Create Class'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADD SECTIONS MODAL */}
      {showBulkAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm text-left text-xs font-bold">
          <div className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-808 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-105 pb-2">
              <h3 className="font-extrabold text-slate-905 dark:text-white">Bulk Configure Sections</h3>
              <button onClick={() => setShowBulkAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1">Section names list (Comma Separated)</label>
              <input
                type="text"
                value={bulkAddSectionsList}
                onChange={e => setBulkAddSectionsList(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowBulkAddModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-105 rounded-xl hover:bg-slate-200">Cancel</button>
              <button onClick={handleBulkAddSections} className="px-5 py-2 text-white bg-sky-600 hover:bg-sky-505 rounded-xl shadow-md">Configure Bulk</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SECTION DIALOG */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-808 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-slate-105 font-bold">
            <div className="flex items-center justify-between border-b border-slate-101 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingSectionName ? 'Configure Section Details' : 'Add Section'}</h3>
              <button onClick={() => setIsSectionModalOpen(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveSection} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-707 mb-1">Section Name (A-Z) *</label>
                <select
                  disabled={!!editingSectionName && students.filter(s => s.className === activeClass?.name && s.section === editingSectionName).length > 0}
                  value={sectionForm.name}
                  onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-202 outline-none font-bold"
                >
                  {ALPHABET.map(l => (
                    <option key={l} value={l} disabled={!editingSectionName && activeClass?.sections.includes(l)}>Section {l}</option>
                  ))}
                </select>
              </div>
 
              <div>
                <label className="block text-slate-705 mb-1">Seat Capacity (1-60)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={sectionForm.capacity}
                  onChange={e => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 outline-none"
                />
                {editingSectionName && sectionForm.capacity < students.filter(s => s.className === activeClass?.name && s.section === editingSectionName).length && (
                  <span className="text-[10px] text-rose-500 mt-1 block">Capacity cannot be less than assigned students.</span>
                )}
              </div>



              <div>
                <label className="block text-slate-700 mb-1">Status</label>
                <select
                  value={sectionForm.status}
                  onChange={e => setSectionForm({ ...sectionForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-808">
                <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 text-slate-655 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-5 py-2 text-white bg-sky-600 hover:bg-sky-505 rounded-xl shadow-md">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
