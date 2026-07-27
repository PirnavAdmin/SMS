import React, { useState } from 'react';
import { 
  Users, User, Calendar, Clock, MapPin, Video, Plus, X, Search, CheckCircle2, 
  AlertCircle, ShieldAlert, Check, XCircle, Lock, Edit, Trash2, Link as LinkIcon, Building2,
  UserX, Filter, Save, Bookmark, Repeat, AlertTriangle, ShieldCheck, Layers, BadgeCheck, CheckSquare, Square
} from 'lucide-react';
import { 
  SchoolMeeting, MeetingAudience, MeetingParticipantType, MeetingMode, 
  MeetingStatus, MeetingParticipantInfo 
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

export const MeetingsView: React.FC = () => {
  const { meetings, staff, students, departments, schoolProfile, addMeeting, updateMeeting, cancelMeeting, deleteMeeting } = useData();
  const { addToast } = useToast();
  const { user, role } = useAuth();

  const isAdminOrPrincipal = role === 'Super Admin' || role === 'Admin' || role === 'Principal' || role === 'HR';
  const isTeacher = role === 'Teacher';
  const canManageMeetings = isAdminOrPrincipal || isTeacher;

  // Filter States
  const [filterAudience, setFilterAudience] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<SchoolMeeting | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<SchoolMeeting | null>(null);
  const [cancellingMeeting, setCancellingMeeting] = useState<SchoolMeeting | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Form State - Individual Meetings (Preserved & Untouched)
  const [meetingAudience, setMeetingAudience] = useState<MeetingAudience>('Individual');
  const [participantType, setParticipantType] = useState<MeetingParticipantType>('Parent');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [participantSearch, setParticipantSearch] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Form State - Enterprise Multi-Participant Group Meetings Workflow
  const [selectedGroupParticipantTypes, setSelectedGroupParticipantTypes] = useState<MeetingParticipantType[]>([
    'Teaching Staff', 'Parent'
  ]);

  // Teaching Staff Filters
  const [teachingGroupType, setTeachingGroupType] = useState<string>('All Teaching Staff');
  const [teachingTargetDept, setTeachingTargetDept] = useState<string>('Mathematics');
  const [teachingTargetDesignation, setTeachingTargetDesignation] = useState<string>('Subject Teacher');
  const [teachingTargetSubject, setTeachingTargetSubject] = useState<string>('Mathematics');
  const [teachingTargetClass, setTeachingTargetClass] = useState<string>('10');
  const [teachingTargetSection, setTeachingTargetSection] = useState<string>('A');
  const [teachingTargetExp, setTeachingTargetExp] = useState<string>('3–5 Years');
  const [teachingTargetEmpType, setTeachingTargetEmpType] = useState<string>('Full-Time');
  const [teachingSelectedIds, setTeachingSelectedIds] = useState<string[]>([]);
  const [teachingSearchQuery, setTeachingSearchQuery] = useState<string>('');

  // Non-Teaching Staff Filters
  const [nonTeachingGroupType, setNonTeachingGroupType] = useState<string>('All Non-Teaching Staff');
  const [nonTeachingTargetDept, setNonTeachingTargetDept] = useState<string>('Administration');
  const [nonTeachingTargetDesignation, setNonTeachingTargetDesignation] = useState<string>('Office Administrator');
  const [nonTeachingTargetExp, setNonTeachingTargetExp] = useState<string>('3–5 Years');
  const [nonTeachingTargetEmpType, setNonTeachingTargetEmpType] = useState<string>('Full-Time');
  const [nonTeachingSelectedIds, setNonTeachingSelectedIds] = useState<string[]>([]);
  const [nonTeachingSearchQuery, setNonTeachingSearchQuery] = useState<string>('');

  // Student Filters
  const [studentGroupType, setStudentGroupType] = useState<string>('All Students');
  const [studentTargetClass, setStudentTargetClass] = useState<string>('10');
  const [studentTargetSection, setStudentTargetSection] = useState<string>('A');
  const [studentTargetHouse, setStudentTargetHouse] = useState<string>('Red House');
  const [studentTargetRoute, setStudentTargetRoute] = useState<string>('Route 1 - Main City');
  const [studentTargetClub, setStudentTargetClub] = useState<string>('Science Club');
  const [studentTargetSports, setStudentTargetSports] = useState<string>('Basketball');
  const [studentSelectedIds, setStudentSelectedIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Parent Filters
  const [parentGroupType, setParentGroupType] = useState<string>('All Parents');
  const [parentTargetClass, setParentTargetClass] = useState<string>('10');
  const [parentTargetSection, setParentTargetSection] = useState<string>('A');
  const [parentSelectedIds, setParentSelectedIds] = useState<string[]>([]);
  const [parentSearchQuery, setParentSearchQuery] = useState<string>('');

  // Exclude Specific Participants State
  const [excludedParticipantIds, setExcludedParticipantIds] = useState<string[]>([]);
  const [excludeSearchQuery, setExcludeSearchQuery] = useState<string>('');

  // Enterprise ERP Meeting Parameters
  const [meetingPriority, setMeetingPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');
  const [attendanceRequired, setAttendanceRequired] = useState<'Mandatory' | 'Optional'>('Mandatory');
  const [recurrence, setRecurrence] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly'>('None');

  // Audience Template State
  const [savedTemplates, setSavedTemplates] = useState<Array<{ name: string; types: MeetingParticipantType[]; desc: string }>>([
    { name: 'Grade 10 Parents & Teachers Body', types: ['Teaching Staff', 'Parent'], desc: 'Grade 10 Teachers & Parents' },
    { name: 'School Administrative Committee', types: ['Teaching Staff', 'Non-Teaching Staff'], desc: 'All HODs & Office Staff' },
    { name: 'Complete Institution Convocation', types: ['Teaching Staff', 'Non-Teaching Staff', 'Student', 'Parent'], desc: 'All Stakeholders' }
  ]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    meetingMode: MeetingMode;
    building: string;
    floor: string;
    roomVenue: string;
    roomCapacity: number;
    onlineMeetingUrl: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    status: MeetingStatus;
  }>({
    title: '',
    description: '',
    meetingMode: 'In-Person',
    building: 'Academic Wing A',
    floor: '1st Floor',
    roomVenue: 'Conference Room 102',
    roomCapacity: 15,
    onlineMeetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:30',
    status: 'Scheduled'
  });

  // Dynamic Options for Participant Type (Individual)
  const teachingStaffOptions = staff.filter(s => s.employeeCategory === 'Teacher' && s.status === 'Active');
  const nonTeachingStaffOptions = staff.filter(s => s.employeeCategory !== 'Teacher' && s.status === 'Active');
  const studentOptions = students.filter(s => s.status === 'Active');

  // Pre-formatted Parent options with full Parent + Student data linkage
  const parentOptions = students.filter(s => s.status === 'Active').map(s => {
    const parentName = s.fatherName || s.motherName || 'Parent';
    const studentName = `${s.firstName} ${s.lastName}`;
    const admNo = s.admissionNo || `ADM-${s.id}`;
    const cleanClass = s.className ? s.className.replace(/^class\s+/i, '') : '-';
    const className = `${cleanClass}-${s.section}`;
    const phone = s.fatherPhone || s.motherPhone || (s as any).contactPhone || '9876543210';
    const email = s.guardianEmail || (s as any).contactEmail || 'parent@school.edu';

    return {
      id: `PAR-${s.id}`,
      studentId: s.id,
      studentName,
      admissionNo: admNo,
      className,
      fatherName: parentName,
      phone,
      email,
      name: `${parentName} (Parent of ${studentName})`,
      type: 'Parent' as MeetingParticipantType,
      details: `Parent: ${parentName} • Ward: ${studentName} (Adm No: ${admNo}, Class ${className})`
    };
  });

  // Search filter logic for Individual Meeting Participant Selection
  const filteredTeachingStaff = teachingStaffOptions.filter(t => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase().trim();
    return (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      (t.empId || '').toLowerCase().includes(q) ||
      (t.department || '').toLowerCase().includes(q) ||
      (t.designation || '').toLowerCase().includes(q)
    );
  });

  const filteredNonTeachingStaff = nonTeachingStaffOptions.filter(s => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase().trim();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.empId || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q)
    );
  });

  const filteredStudents = studentOptions.filter(s => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase().trim();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.admissionNo || '').toLowerCase().includes(q) ||
      `adm-${s.admissionNo || s.id}`.toLowerCase().includes(q) ||
      `${s.className}-${s.section}`.toLowerCase().includes(q)
    );
  });

  const filteredParents = parentOptions.filter(p => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q) ||
      p.admissionNo.toLowerCase().includes(q) ||
      p.fatherName.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.className.toLowerCase().includes(q)
    );
  });

  // Merged Recipient Processing & De-duplication Breakdown for Multi-Participant Group Meetings
  const resolvedGroupParticipantsBreakdown = React.useMemo(() => {
    let teachingList: MeetingParticipantInfo[] = [];
    let nonTeachingList: MeetingParticipantInfo[] = [];
    let studentList: MeetingParticipantInfo[] = [];
    let parentList: MeetingParticipantInfo[] = [];

    // 1. TEACHING STAFF FILTERS
    if (selectedGroupParticipantTypes.includes('Teaching Staff')) {
      const activeTeachers = staff.filter(s => s.employeeCategory === 'Teacher' && s.status === 'Active');

      if (teachingGroupType === 'All Teaching Staff') {
        teachingList = activeTeachers.map(t => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.department || 'Academics'} • ${t.designation || 'Teacher'}`,
          email: t.email,
          phone: t.phone
        }));
      } else if (teachingGroupType === 'Department') {
        teachingList = activeTeachers.filter(t => (t.department || '').toLowerCase() === teachingTargetDept.toLowerCase()).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.department} Dept • ${t.designation || 'Teacher'}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Designation') {
        teachingList = activeTeachers.filter(t => (t.designation || '').toLowerCase().includes(teachingTargetDesignation.toLowerCase())).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.designation}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Subject') {
        teachingList = activeTeachers.filter(t => (t.primarySubject || '').toLowerCase() === teachingTargetSubject.toLowerCase() || (t.assignedSubjects || []).includes(teachingTargetSubject)).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Subject: ${teachingTargetSubject}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Class Teacher') {
        teachingList = activeTeachers.filter(t => t.isClassTeacherEligible || (t.designation || '').includes('Class Teacher')).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Class Teacher`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Subject Teacher') {
        teachingList = activeTeachers.filter(t => (t.designation || '').includes('Subject Teacher') || (t.assignedSubjects || []).length > 0).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Subject Teacher`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Assigned Class') {
        teachingList = activeTeachers.filter(t => (t.assignedClasses || []).some(c => c.toLowerCase().includes(teachingTargetClass.toLowerCase()))).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Assigned Class ${teachingTargetClass}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Assigned Section') {
        teachingList = activeTeachers.filter(t => (t.assignedClasses || []).some(c => c.toLowerCase().endsWith(`-${teachingTargetSection.toLowerCase()}`))).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Section ${teachingTargetSection}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Assigned Class & Section') {
        const targetPattern = `${teachingTargetClass}-${teachingTargetSection}`.toLowerCase();
        teachingList = activeTeachers.filter(t => (t.assignedClasses || []).some(c => c.toLowerCase().includes(targetPattern))).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • Class ${teachingTargetClass}-${teachingTargetSection}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Head of Department (HOD)') {
        teachingList = activeTeachers.filter(t => (t.designation || '').toLowerCase().includes('hod') || (t.designation || '').toLowerCase().includes('head')).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • HOD ${t.department || ''}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Academic Coordinator') {
        teachingList = activeTeachers.filter(t => (t.designation || '').toLowerCase().includes('coordinator') || (t.designation || '').toLowerCase().includes('principal')).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.designation}`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Experience Range') {
        teachingList = activeTeachers.filter(t => {
          const exp = t.experienceYears || 0;
          if (teachingTargetExp === '0–2 Years') return exp <= 2;
          if (teachingTargetExp === '3–5 Years') return exp >= 3 && exp <= 5;
          if (teachingTargetExp === '6–10 Years') return exp >= 6 && exp <= 10;
          if (teachingTargetExp === '10+ Years') return exp > 10;
          return true;
        }).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.experienceYears || 0} Yrs Exp`, email: t.email, phone: t.phone
        }));
      } else if (teachingGroupType === 'Selected Teachers') {
        teachingList = activeTeachers.filter(t => teachingSelectedIds.includes(t.id)).map(t => ({
          id: t.id, name: `${t.firstName} ${t.lastName}`, type: 'Teaching Staff',
          details: `${t.empId || t.id} • ${t.department || 'Academics'}`, email: t.email, phone: t.phone
        }));
      }
    }

    // 2. NON-TEACHING STAFF FILTERS
    if (selectedGroupParticipantTypes.includes('Non-Teaching Staff')) {
      const activeStaff = staff.filter(s => s.employeeCategory !== 'Teacher' && s.status === 'Active');

      if (nonTeachingGroupType === 'All Non-Teaching Staff') {
        nonTeachingList = activeStaff.map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Non-Teaching Staff',
          details: `${s.empId || s.id} • ${s.department || 'Operations'} • ${s.designation || 'Staff'}`, email: s.email, phone: s.phone
        }));
      } else if (nonTeachingGroupType === 'Department') {
        nonTeachingList = activeStaff.filter(s => (s.department || '').toLowerCase().includes(nonTeachingTargetDept.toLowerCase())).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Non-Teaching Staff',
          details: `${s.empId || s.id} • ${s.department} Dept`, email: s.email, phone: s.phone
        }));
      } else if (nonTeachingGroupType === 'Designation') {
        nonTeachingList = activeStaff.filter(s => (s.designation || '').toLowerCase().includes(nonTeachingTargetDesignation.toLowerCase())).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Non-Teaching Staff',
          details: `${s.empId || s.id} • ${s.designation}`, email: s.email, phone: s.phone
        }));
      } else if (nonTeachingGroupType === 'Selected Staff') {
        nonTeachingList = activeStaff.filter(s => nonTeachingSelectedIds.includes(s.id)).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Non-Teaching Staff',
          details: `${s.empId || s.id} • ${s.department || 'Operations'}`, email: s.email, phone: s.phone
        }));
      }
    }

    // 3. STUDENT FILTERS
    if (selectedGroupParticipantTypes.includes('Student')) {
      const activeStudents = students.filter(s => s.status === 'Active');

      if (studentGroupType === 'All Students') {
        studentList = activeStudents.map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Class ${s.className.replace(/^class\s+/i, '')}-${s.section}`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Class') {
        studentList = activeStudents.filter(s => s.className.replace(/^class\s+/i, '').toLowerCase() === studentTargetClass.toLowerCase()).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Class ${studentTargetClass}-${s.section}`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Section') {
        studentList = activeStudents.filter(s => (s.section || '').toLowerCase() === studentTargetSection.toLowerCase()).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Class ${s.className}-${studentTargetSection}`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Class & Section') {
        studentList = activeStudents.filter(s => 
          s.className.replace(/^class\s+/i, '').toLowerCase() === studentTargetClass.toLowerCase() &&
          (s.section || '').toLowerCase() === studentTargetSection.toLowerCase()
        ).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Class ${studentTargetClass}-${studentTargetSection}`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Hostel Students') {
        studentList = activeStudents.filter(s => s.studentType === 'Hosteller').map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Hosteller (${s.hostelRoom || 'Block A'})`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Day Scholars') {
        studentList = activeStudents.filter(s => s.studentType === 'Day Scholar' || !s.studentType).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Day Scholar`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      } else if (studentGroupType === 'Selected Students') {
        studentList = activeStudents.filter(s => studentSelectedIds.includes(s.id)).map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, type: 'Student',
          details: `ADM-${s.admissionNo || s.id} • Class ${s.className.replace(/^class\s+/i, '')}-${s.section}`, email: s.guardianEmail, phone: s.fatherPhone
        }));
      }
    }

    // 4. PARENT FILTERS
    if (selectedGroupParticipantTypes.includes('Parent')) {
      if (parentGroupType === 'All Parents') {
        parentList = parentOptions;
      } else if (parentGroupType === 'Parents of Class') {
        parentList = parentOptions.filter(p => {
          const st = students.find(s => s.id === p.studentId);
          return st && st.className.replace(/^class\s+/i, '').toLowerCase() === parentTargetClass.toLowerCase();
        });
      } else if (parentGroupType === 'Parents of Class & Section') {
        parentList = parentOptions.filter(p => {
          const st = students.find(s => s.id === p.studentId);
          return st && 
            st.className.replace(/^class\s+/i, '').toLowerCase() === parentTargetClass.toLowerCase() &&
            (st.section || '').toLowerCase() === parentTargetSection.toLowerCase();
        });
      } else if (parentGroupType === 'Selected Parents') {
        parentList = parentOptions.filter(p => parentSelectedIds.includes(p.id));
      }
    }

    // Combined Raw Array
    const rawCombined = [...teachingList, ...nonTeachingList, ...studentList, ...parentList];

    // De-duplication by participant ID
    const uniqueMap = new Map<string, MeetingParticipantInfo>();
    rawCombined.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    // Apply Exclude Specific Participants Filter
    const finalFiltered = Array.from(uniqueMap.values()).filter(item => !excludedParticipantIds.includes(item.id));

    return {
      teachingCount: teachingList.length,
      nonTeachingCount: nonTeachingList.length,
      studentCount: studentList.length,
      parentCount: parentList.length,
      totalBeforeExclusion: uniqueMap.size,
      totalRecipients: finalFiltered.length,
      finalParticipants: finalFiltered
    };
  }, [
    selectedGroupParticipantTypes, staff, students, parentOptions,
    teachingGroupType, teachingTargetDept, teachingTargetDesignation, teachingTargetSubject, teachingTargetClass, teachingTargetSection, teachingTargetExp, teachingSelectedIds,
    nonTeachingGroupType, nonTeachingTargetDept, nonTeachingTargetDesignation, nonTeachingSelectedIds,
    studentGroupType, studentTargetClass, studentTargetSection, studentSelectedIds,
    parentGroupType, parentTargetClass, parentTargetSection, parentSelectedIds,
    excludedParticipantIds
  ]);

  // Conflict Detection for overlapping scheduled meetings
  const conflictingParticipants = React.useMemo(() => {
    if (!formData.meetingDate || !formData.startTime || !formData.endTime) return [];
    
    const overlappingMeetings = meetings.filter(m => 
      m.id !== editingMeeting?.id &&
      m.status === 'Scheduled' &&
      m.meetingDate === formData.meetingDate &&
      ((formData.startTime >= m.startTime && formData.startTime < m.endTime) ||
       (formData.endTime > m.startTime && formData.endTime <= m.endTime) ||
       (formData.startTime <= m.startTime && formData.endTime >= m.endTime))
    );

    if (overlappingMeetings.length === 0) return [];

    const busyIds = new Set<string>();
    overlappingMeetings.forEach(m => {
      (m.participants || []).forEach(p => busyIds.add(p.id));
    });

    return resolvedGroupParticipantsBreakdown.finalParticipants.filter(p => busyIds.has(p.id));
  }, [formData.meetingDate, formData.startTime, formData.endTime, meetings, editingMeeting, resolvedGroupParticipantsBreakdown]);

  // Computed Human-Readable Group Title
  const computedGroupTitle = React.useMemo(() => {
    const typesStr = selectedGroupParticipantTypes.join(', ');
    return `Multi-Target Group (${typesStr}) - ${resolvedGroupParticipantsBreakdown.totalRecipients} Recipients`;
  }, [selectedGroupParticipantTypes, resolvedGroupParticipantsBreakdown.totalRecipients]);

  const handleOpenAddModal = () => {
    setEditingMeeting(null);
    setMeetingAudience('Individual');
    setParticipantType('Parent');
    setSelectedParticipantId(parentOptions[0]?.id || '');
    setFormData({
      title: '',
      description: '',
      meetingMode: 'In-Person',
      building: 'Academic Block A',
      floor: '1st Floor',
      roomVenue: 'Conference Room 102',
      roomCapacity: 15,
      onlineMeetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '10:30',
      status: 'Scheduled'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (meeting: SchoolMeeting) => {
    if (meeting.status === 'Completed' || meeting.status === 'Cancelled') {
      addToast('warning', 'Action Restricted', `Completed or Cancelled meetings are read-only.`);
      return;
    }
    setEditingMeeting(meeting);
    setMeetingAudience(meeting.meetingAudience);
    setParticipantType(meeting.participantType || 'Parent');
    setSelectedGroupParticipantTypes([meeting.participantType || 'Teaching Staff']);
    setSelectedParticipantId(meeting.participants[0]?.id || '');
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      meetingMode: meeting.meetingMode,
      building: meeting.building || 'Academic Block A',
      floor: meeting.floor || '1st Floor',
      roomVenue: meeting.roomVenue || 'Conference Room 102',
      roomCapacity: meeting.roomCapacity || 15,
      onlineMeetingUrl: meeting.onlineMeetingUrl || '',
      meetingDate: meeting.meetingDate,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status
    });
    setIsModalOpen(true);
  };

  // Submit Handler with Validations
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { title, meetingMode, roomVenue, meetingDate, startTime, endTime, status } = formData;

    if (!title.trim() || !meetingDate || !startTime || !endTime) {
      addToast('warning', 'Validation Warning', 'Please complete mandatory fields (Title, Date, Start & End Time).');
      return;
    }

    // 1. Time validation
    if (startTime >= endTime) {
      addToast('error', 'Time Error', 'Start Time must be strictly before End Time.');
      return;
    }

    // 2. Room / Venue Conflict Validation for In-Person or Hybrid mode
    if (meetingMode === 'In-Person' || meetingMode === 'Hybrid') {
      if (!roomVenue.trim()) {
        addToast('warning', 'Venue Warning', 'Please specify a Meeting Room / Venue for In-Person/Hybrid mode.');
        return;
      }

      const venueConflict = meetings.find(m => 
        m.id !== editingMeeting?.id &&
        m.status !== 'Cancelled' &&
        (m.meetingMode === 'In-Person' || m.meetingMode === 'Hybrid') &&
        m.roomVenue?.toLowerCase().trim() === roomVenue.toLowerCase().trim() &&
        m.meetingDate === meetingDate &&
        ((startTime >= m.startTime && startTime < m.endTime) ||
         (endTime > m.startTime && endTime <= m.endTime) ||
         (startTime <= m.startTime && endTime >= m.endTime))
      );

      if (venueConflict) {
        addToast('error', 'Venue Conflict Error', `Room '${roomVenue}' is already reserved for '${venueConflict.title}' from ${venueConflict.startTime} to ${venueConflict.endTime} on ${meetingDate}.`);
        return;
      }
    }

    // 3. Participant Assembly
    let participantsList: MeetingParticipantInfo[] = [];

    if (meetingAudience === 'Individual') {
      if (!selectedParticipantId) {
        addToast('warning', 'Participant Required', 'Please select exactly one participant for an Individual meeting.');
        return;
      }

      if (participantType === 'Teaching Staff') {
        const st = staff.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Teaching Staff',
            details: `${st.empId || st.id} • ${st.department || 'Academics'} • ${st.designation || 'Teacher'}`,
            email: st.email,
            phone: st.phone
          }];
        }
      } else if (participantType === 'Non-Teaching Staff') {
        const st = staff.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Non-Teaching Staff',
            details: `${st.empId || st.id} • ${st.department || 'Operations'} • ${st.designation || 'Staff'}`,
            email: st.email,
            phone: st.phone
          }];
        }
      } else if (participantType === 'Student') {
        const st = students.find(s => s.id === selectedParticipantId);
        if (st) {
          participantsList = [{
            id: st.id,
            name: `${st.firstName} ${st.lastName}`,
            type: 'Student',
            details: `ADM-${st.admissionNo || st.id} • Class ${st.className}-${st.section}`,
            email: st.guardianEmail,
            phone: st.fatherPhone
          }];
        }
      } else if (participantType === 'Parent') {
        const pObj = parentOptions.find(p => p.id === selectedParticipantId);
        if (pObj) {
          participantsList = [pObj];
        }
      }
    } else {
      // Enterprise Group Meeting Workflow Validation & Participant Assembly
      if (resolvedGroupParticipantsBreakdown.totalRecipients === 0) {
        addToast('error', 'Audience Member Required', `Cannot schedule meeting: No active participants match the selected filter criteria.`);
        return;
      }
      participantsList = resolvedGroupParticipantsBreakdown.finalParticipants;
    }

    const payload: Omit<SchoolMeeting, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: formData.description,
      academicYear: schoolProfile.academicYear || '2025-2026',
      branch: user?.branch || 'Main Campus',
      meetingAudience,
      participantType: meetingAudience === 'Individual' ? participantType : selectedGroupParticipantTypes[0] || 'Teaching Staff',
      participants: participantsList,
      targetGroupDescription: meetingAudience === 'Group' ? computedGroupTitle : undefined,
      meetingMode,
      building: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.building : undefined,
      floor: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.floor : undefined,
      roomVenue: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.roomVenue : undefined,
      roomCapacity: (meetingMode === 'In-Person' || meetingMode === 'Hybrid') ? formData.roomCapacity : undefined,
      onlineMeetingUrl: (meetingMode === 'Online' || meetingMode === 'Hybrid') ? formData.onlineMeetingUrl : undefined,
      meetingDate,
      startTime,
      endTime,
      status,
      organizerName: user?.name || 'Administrator',
      organizerRole: role || 'Admin',
      priority: meetingPriority,
      attendanceRequired: attendanceRequired,
      recurrence: recurrence,
      excludedParticipantIds: excludedParticipantIds
    };

    if (editingMeeting) {
      updateMeeting(editingMeeting.id, payload);
      addToast('success', 'Meeting Updated', `Successfully updated meeting details for '${title}'.`);
    } else {
      addMeeting(payload);
      if (status === 'Scheduled') {
        const targetName = meetingAudience === 'Individual' ? participantsList[0]?.name || 'the participant' : computedGroupTitle;
        addToast('success', 'Meeting Scheduled', `Dispatched notification exclusively to ${targetName}.`);
      } else {
        addToast('info', 'Draft Saved', `Saved draft meeting '${title}'.`);
      }
    }

    setIsModalOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!cancellingMeeting) return;
    if (!cancellationReason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide a reason for cancelling the meeting.');
      return;
    }

    cancelMeeting(cancellingMeeting.id, cancellationReason);
    const targetName = cancellingMeeting.meetingAudience === 'Individual' ? cancellingMeeting.participants[0]?.name : cancellingMeeting.targetGroupDescription;
    addToast('info', 'Meeting Cancelled', `Cancellation notification sent exclusively to ${targetName}.`);
    setCancellingMeeting(null);
    setCancellationReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Meeting Management</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Schedule & manage Individual in-person meetings, group syncs, venue availability & private alerts</p>
          </div>
        </div>

        {canManageMeetings && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 text-xs transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-3xl grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-semibold">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Audience</label>
          <select
            value={filterAudience}
            onChange={e => setFilterAudience(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Audiences</option>
            <option value="Individual">Individual Meetings</option>
            <option value="Group">Group Meetings</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Mode</label>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Modes</option>
            <option value="In-Person">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Search Meetings</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, venue, participant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Meetings Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(() => {
          const filtered = meetings.filter(m => {
            if (filterAudience && m.meetingAudience !== filterAudience) return false;
            if (filterMode && m.meetingMode !== filterMode) return false;
            if (filterStatus && m.status !== filterStatus) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const pMatch = m.participants.some(p => p.name.toLowerCase().includes(q) || p.details.toLowerCase().includes(q));
              const match = m.title.toLowerCase().includes(q) || (m.roomVenue && m.roomVenue.toLowerCase().includes(q)) || pMatch;
              if (!match) return false;
            }
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="col-span-full p-12 text-center text-slate-400 font-bold glass-card rounded-3xl">
                No meetings found matching your selected criteria.
              </div>
            );
          }

          return filtered.map(meeting => (
            <div key={meeting.id} className="glass-card p-5 rounded-3xl space-y-3.5 flex flex-col justify-between border border-slate-100 dark:border-slate-800 shadow-md">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    meeting.meetingAudience === 'Individual'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200'
                  }`}>
                    {meeting.meetingAudience} Meeting
                  </span>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    meeting.status === 'Scheduled' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200' :
                    meeting.status === 'Draft' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200' :
                    meeting.status === 'Completed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                  }`}>
                    {meeting.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-indigo-600 transition-colors leading-tight">
                  {meeting.title}
                </h3>
                {meeting.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2">{meeting.description}</p>
                )}
              </div>

              <div className="space-y-2 text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Participant Info */}
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    {meeting.meetingAudience === 'Individual' ? (
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {meeting.participants[0]?.name || '1 Participant'}
                        <span className="block text-[10px] text-slate-400 font-normal truncate">{meeting.participants[0]?.details}</span>
                      </span>
                    ) : (
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {meeting.targetGroupDescription || `${meeting.participants.length} Participants`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-xs">{meeting.meetingDate}</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                  <span className="font-mono text-xs">{meeting.startTime} - {meeting.endTime}</span>
                </div>

                {/* Venue / Link */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  {(meeting.meetingMode === 'In-Person' || meeting.meetingMode === 'Hybrid') ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate font-bold text-amber-600 dark:text-amber-400">
                        {meeting.roomVenue} {meeting.building ? `(${meeting.building})` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate text-blue-600 font-mono text-[11px]">{meeting.onlineMeetingUrl || 'Online Video Room'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <button
                  onClick={() => setViewingMeeting(meeting)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors"
                >
                  View Details
                </button>

                {canManageMeetings && (
                  <div className="flex items-center gap-1">
                    {meeting.status === 'Scheduled' && (
                      <>
                        <button
                          onClick={() => {
                            updateMeeting(meeting.id, { status: 'Completed' });
                            addToast('success', 'Meeting Completed', `Marked meeting '${meeting.title}' as Completed.`);
                          }}
                          title="Mark Completed"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCancellingMeeting(meeting)}
                          title="Cancel Meeting"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(meeting.status === 'Scheduled' || meeting.status === 'Draft') && (
                      <button
                        onClick={() => handleOpenEditModal(meeting)}
                        title="Edit Meeting"
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete meeting '${meeting.title}'?`)) {
                          deleteMeeting(meeting.id);
                          addToast('info', 'Deleted', 'Meeting record removed.');
                        }
                      }}
                      title="Delete Record"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Schedule / Edit Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                {editingMeeting ? 'Modify Meeting Details' : 'Schedule New Meeting'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-655 dark:text-slate-350">
              {/* Meeting Audience Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1.5">Meeting Audience *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingAudience('Individual')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      meetingAudience === 'Individual'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Individual Meeting
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingAudience('Group')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      meetingAudience === 'Group'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Group Meeting
                  </button>
                </div>
              </div>

              {/* Individual Participant Picker */}
              {meetingAudience === 'Individual' ? (
                <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">Participant Type *</label>
                    <select
                      value={participantType}
                      onChange={e => {
                        const nextType = e.target.value as MeetingParticipantType;
                        setParticipantType(nextType);
                        setParticipantSearch('');
                        setIsSearchOpen(false);
                        if (nextType === 'Teaching Staff') setSelectedParticipantId(teachingStaffOptions[0]?.id || '');
                        else if (nextType === 'Non-Teaching Staff') setSelectedParticipantId(nonTeachingStaffOptions[0]?.id || '');
                        else if (nextType === 'Student') setSelectedParticipantId(studentOptions[0]?.id || '');
                        else if (nextType === 'Parent') setSelectedParticipantId(parentOptions[0]?.id || '');
                      }}
                      className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                      <option value="Teaching Staff">Teaching Staff</option>
                      <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                      Search & Select Participant ({participantType}) *
                    </label>

                    {/* Search Bar Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input
                        type="text"
                        placeholder={
                          participantType === 'Parent' || participantType === 'Student'
                            ? "Type Student Name, Admission No, Parent Name..."
                            : "Type Staff Name, Employee ID, Department..."
                        }
                        value={participantSearch}
                        onFocus={() => setIsSearchOpen(true)}
                        onChange={e => {
                          setParticipantSearch(e.target.value);
                          setIsSearchOpen(true);
                        }}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                      {participantSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setParticipantSearch('');
                            setIsSearchOpen(false);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Suggestion Dropdown List (Removes / hides on selection) */}
                      {isSearchOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs scrollbar-thin">
                          {participantType === 'Parent' && (
                            filteredParents.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 font-medium">No matching parents found</div>
                            ) : (
                              filteredParents.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedParticipantId(p.id);
                                    setParticipantSearch('');
                                    setIsSearchOpen(false); // REMOVE SUGGEST BOX
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors ${
                                    selectedParticipantId === p.id ? 'bg-purple-50/80 dark:bg-purple-950/60 font-bold' : ''
                                  }`}
                                >
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>Parent: {p.fatherName}</span>
                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">Adm No: {p.admissionNo}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                                    <span>Ward: <strong className="text-slate-700 dark:text-slate-300">{p.studentName}</strong></span>
                                    <span>Class {p.className}</span>
                                  </div>
                                </div>
                              ))
                            )
                          )}

                          {participantType === 'Student' && (
                            filteredStudents.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 font-medium">No matching students found</div>
                            ) : (
                              filteredStudents.map(s => {
                                const cleanClass = s.className ? s.className.replace(/^class\s+/i, '') : '-';
                                return (
                                  <div
                                    key={s.id}
                                    onClick={() => {
                                      setSelectedParticipantId(s.id);
                                      setParticipantSearch('');
                                      setIsSearchOpen(false); // REMOVE SUGGEST BOX
                                    }}
                                    className={`p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors ${
                                      selectedParticipantId === s.id ? 'bg-purple-50/80 dark:bg-purple-950/60 font-bold' : ''
                                    }`}
                                  >
                                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                                      <span>{s.firstName} {s.lastName}</span>
                                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">ADM-{s.admissionNo || s.id}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      Class {cleanClass}-{s.section}
                                    </div>
                                  </div>
                                );
                              })
                            )
                          )}

                          {participantType === 'Teaching Staff' && (
                            filteredTeachingStaff.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 font-medium">No matching teaching staff found</div>
                            ) : (
                              filteredTeachingStaff.map(t => (
                                <div
                                  key={t.id}
                                  onClick={() => {
                                    setSelectedParticipantId(t.id);
                                    setParticipantSearch('');
                                    setIsSearchOpen(false); // REMOVE SUGGEST BOX
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors ${
                                    selectedParticipantId === t.id ? 'bg-purple-50/80 dark:bg-purple-950/60 font-bold' : ''
                                  }`}
                                >
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>{t.firstName} {t.lastName}</span>
                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">{t.empId || t.id}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {t.department || 'Academics'} • {t.designation || 'Teacher'}
                                  </div>
                                </div>
                              ))
                            )
                          )}

                          {participantType === 'Non-Teaching Staff' && (
                            filteredNonTeachingStaff.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 font-medium">No matching non-teaching staff found</div>
                            ) : (
                              filteredNonTeachingStaff.map(st => (
                                <div
                                  key={st.id}
                                  onClick={() => {
                                    setSelectedParticipantId(st.id);
                                    setParticipantSearch('');
                                    setIsSearchOpen(false); // REMOVE SUGGEST BOX
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors ${
                                    selectedParticipantId === st.id ? 'bg-purple-50/80 dark:bg-purple-950/60 font-bold' : ''
                                  }`}
                                >
                                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                                    <span>{st.firstName} {st.lastName}</span>
                                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">{st.empId || st.id}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {st.department || 'Operations'} • {st.designation || 'Staff'}
                                  </div>
                                </div>
                              ))
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* Display Selected Participant Data Card */}
                    {participantType === 'Parent' && (() => {
                      const selectedParent = parentOptions.find(p => p.id === selectedParticipantId);
                      if (!selectedParent) return null;
                      return (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 shadow-sm space-y-2 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between font-black text-purple-950 dark:text-purple-200">
                            <span className="flex items-center gap-1.5 text-sm">
                              👨‍👩‍👧 Parent: <strong className="text-slate-900 dark:text-white font-black">{selectedParent.fatherName}</strong>
                            </span>
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">📞 {selectedParent.phone}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-semibold border-t border-purple-100 dark:border-purple-900/50 pt-2">
                            <span>🎓 Student / Ward: <strong className="text-slate-900 dark:text-white font-bold">{selectedParent.studentName}</strong></span>
                            <span className="font-mono bg-purple-100 dark:bg-purple-950/90 px-2.5 py-1 rounded-lg font-extrabold text-purple-800 dark:text-purple-300">
                              Adm No: {selectedParent.admissionNo} • Class {selectedParent.className}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {participantType === 'Student' && (() => {
                      const selectedStudent = studentOptions.find(s => s.id === selectedParticipantId);
                      if (!selectedStudent) return null;
                      const cleanClass = selectedStudent.className ? selectedStudent.className.replace(/^class\s+/i, '') : '-';
                      return (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 shadow-sm space-y-2 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between font-black text-purple-950 dark:text-purple-200">
                            <span className="flex items-center gap-1.5 text-sm">
                              🎓 Student: <strong className="text-slate-900 dark:text-white font-black">{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                            </span>
                            <span className="font-mono bg-purple-100 dark:bg-purple-950/90 px-2.5 py-1 rounded-lg font-extrabold text-purple-800 dark:text-purple-300">
                              Adm No: ADM-{selectedStudent.admissionNo || selectedStudent.id} • Class {cleanClass}-{selectedStudent.section}
                            </span>
                          </div>
                          {(selectedStudent.fatherName || selectedStudent.fatherPhone) && (
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-semibold border-t border-purple-100 dark:border-purple-900/50 pt-2">
                              <span>👨‍👩‍👧 Parent: <strong className="text-slate-900 dark:text-white font-bold">{selectedStudent.fatherName || 'Parent'}</strong></span>
                              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">📞 {selectedStudent.fatherPhone || '-'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {(participantType === 'Teaching Staff' || participantType === 'Non-Teaching Staff') && (() => {
                      const selectedStaff = staff.find(s => s.id === selectedParticipantId);
                      if (!selectedStaff) return null;
                      return (
                        <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 shadow-sm space-y-2 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between font-black text-purple-950 dark:text-purple-200">
                            <span className="flex items-center gap-1.5 text-sm">
                              👨‍🏫 Staff: <strong className="text-slate-900 dark:text-white font-black">{selectedStaff.firstName} {selectedStaff.lastName}</strong>
                            </span>
                            <span className="font-mono bg-purple-100 dark:bg-purple-950/90 px-2.5 py-1 rounded-lg font-extrabold text-purple-800 dark:text-purple-300">
                              {selectedStaff.empId || selectedStaff.id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs font-semibold border-t border-purple-100 dark:border-purple-900/50 pt-2">
                            <span>💼 Dept: <strong className="text-slate-900 dark:text-white font-bold">{selectedStaff.department || 'Academics'}</strong> ({selectedStaff.designation || 'Staff'})</span>
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">📞 {selectedStaff.phone || '-'}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 font-medium">
                      Note: Only the selected participant will receive this meeting notification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                  {/* Header & Audience Template Controls */}
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                    <h4 className="text-xs font-black uppercase tracking-tight text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Multi-Target Group Audience Configuration
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      {/* Save Template Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const tName = prompt('Enter a name for this Audience Template:', 'Custom ERP Group');
                          if (tName) {
                            setSavedTemplates(prev => [...prev, {
                              name: tName,
                              types: [...selectedGroupParticipantTypes],
                              desc: `${selectedGroupParticipantTypes.join(', ')} Audience`
                            }]);
                            addToast('success', 'Template Saved', `Saved audience template '${tName}'.`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Save className="w-3 h-3 text-indigo-600" />
                        Save Template
                      </button>
                    </div>
                  </div>

                  {/* Saved Templates Loader Dropdown */}
                  {savedTemplates.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" /> Preset Templates:
                      </span>
                      <select
                        onChange={e => {
                          const tmpl = savedTemplates.find(t => t.name === e.target.value);
                          if (tmpl) {
                            setSelectedGroupParticipantTypes(tmpl.types);
                            addToast('info', 'Template Loaded', `Loaded '${tmpl.name}' preset.`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 font-bold text-[11px] text-indigo-900 dark:text-indigo-200"
                      >
                        <option value="">-- Load Saved Audience Template --</option>
                        {savedTemplates.map(t => (
                          <option key={t.name} value={t.name}>{t.name} ({t.types.join(', ')})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 1. Multiple Participant Types Multi-Select Checkboxes */}
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 uppercase tracking-wider">
                      1. Select Participant Types (Multi-Selection Allowed) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Teaching Staff', 'Non-Teaching Staff', 'Student', 'Parent'] as MeetingParticipantType[]).map(pType => {
                        const isChecked = selectedGroupParticipantTypes.includes(pType);
                        return (
                          <button
                            key={pType}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                if (selectedGroupParticipantTypes.length === 1) {
                                  addToast('warning', 'Selection Required', 'At least one participant type must be selected.');
                                  return;
                                }
                                setSelectedGroupParticipantTypes(prev => prev.filter(t => t !== pType));
                              } else {
                                setSelectedGroupParticipantTypes(prev => [...prev, pType]);
                              }
                            }}
                            className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-between ${
                              isChecked
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-indigo-100 dark:border-indigo-900'
                            }`}
                          >
                            <span>{pType}</span>
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-white" /> : <Square className="w-3.5 h-3.5 text-slate-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Dynamic Filter Panel per Selected Participant Type */}
                  
                  {/* TEACHING STAFF FILTER PANEL */}
                  {selectedGroupParticipantTypes.includes('Teaching Staff') && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5 border-indigo-50 dark:border-indigo-950">
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          👨‍🏫 Teaching Staff Target Filters
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-mono">
                          {resolvedGroupParticipantsBreakdown.teachingCount} Teachers
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Group Type *</label>
                          <select
                            value={teachingGroupType}
                            onChange={e => setTeachingGroupType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          >
                            <option value="All Teaching Staff">All Teaching Staff</option>
                            <option value="Department">Department</option>
                            <option value="Designation">Designation</option>
                            <option value="Subject">Subject</option>
                            <option value="Class Teacher">Class Teacher</option>
                            <option value="Subject Teacher">Subject Teacher</option>
                            <option value="Assigned Class">Assigned Class</option>
                            <option value="Assigned Section">Assigned Section</option>
                            <option value="Assigned Class & Section">Assigned Class & Section</option>
                            <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                            <option value="Academic Coordinator">Academic Coordinator</option>
                            <option value="Experience Range">Experience Range</option>
                            <option value="Selected Teachers">Selected Teachers (Multi-Select)</option>
                          </select>
                        </div>

                        {teachingGroupType === 'Department' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Department</label>
                            <select
                              value={teachingTargetDept}
                              onChange={e => setTeachingTargetDept(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {Array.from(new Set(['Mathematics', 'Science', 'English', 'Social Science', 'Languages', 'Computer Science / ICT', 'Commerce', 'Physical Education', ...(departments || []).map(d => d.departmentName)])).map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {teachingGroupType === 'Designation' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Designation</label>
                            <select
                              value={teachingTargetDesignation}
                              onChange={e => setTeachingTargetDesignation(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['Principal', 'Vice Principal', 'Academic Coordinator', 'HOD', 'Subject Teacher', 'Class Teacher', 'Assistant Teacher', 'Librarian', 'Physical Education Teacher', 'Computer Teacher', 'Art Teacher', 'Music Teacher'].map(des => (
                                <option key={des} value={des}>{des}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {teachingGroupType === 'Subject' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Subject</label>
                            <select
                              value={teachingTargetSubject}
                              onChange={e => setTeachingTargetSubject(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science', 'Social Studies', 'Economics', 'History', 'Geography'].map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(teachingGroupType === 'Assigned Class' || teachingGroupType === 'Assigned Class & Section') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Class</label>
                            <select
                              value={teachingTargetClass}
                              onChange={e => setTeachingTargetClass(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map(c => (
                                <option key={c} value={c}>Class {c}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(teachingGroupType === 'Assigned Section' || teachingGroupType === 'Assigned Class & Section') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
                            <select
                              value={teachingTargetSection}
                              onChange={e => setTeachingTargetSection(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['A', 'B', 'C', 'D'].map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {teachingGroupType === 'Experience Range' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Experience Range</label>
                            <select
                              value={teachingTargetExp}
                              onChange={e => setTeachingTargetExp(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['0–2 Years', '3–5 Years', '6–10 Years', '10+ Years'].map(eRange => (
                                <option key={eRange} value={eRange}>{eRange}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Multi-Select for Selected Teachers */}
                      {teachingGroupType === 'Selected Teachers' && (
                        <div className="space-y-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Search teacher by name or emp ID..."
                            value={teachingSearchQuery}
                            onChange={e => setTeachingSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border bg-slate-50 text-xs font-medium"
                          />
                          <div className="max-h-36 overflow-y-auto border rounded-xl p-1 bg-slate-50/50 space-y-1 text-xs">
                            {teachingStaffOptions.filter(t => !teachingSearchQuery || `${t.firstName} ${t.lastName}`.toLowerCase().includes(teachingSearchQuery.toLowerCase())).map(t => (
                              <label key={t.id} className="flex items-center gap-2 p-1 hover:bg-white rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={teachingSelectedIds.includes(t.id)}
                                  onChange={e => {
                                    if (e.target.checked) setTeachingSelectedIds(prev => [...prev, t.id]);
                                    else setTeachingSelectedIds(prev => prev.filter(id => id !== t.id));
                                  }}
                                  className="rounded text-indigo-600"
                                />
                                <span className="font-bold text-slate-800 dark:text-slate-200">{t.firstName} {t.lastName}</span>
                                <span className="text-[10px] text-slate-400 ml-auto">{t.department || 'Academics'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* NON-TEACHING STAFF FILTER PANEL */}
                  {selectedGroupParticipantTypes.includes('Non-Teaching Staff') && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5 border-indigo-50 dark:border-indigo-950">
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          🏢 Non-Teaching Staff Target Filters
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-mono">
                          {resolvedGroupParticipantsBreakdown.nonTeachingCount} Staff
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Group Type *</label>
                          <select
                            value={nonTeachingGroupType}
                            onChange={e => setNonTeachingGroupType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          >
                            <option value="All Non-Teaching Staff">All Non-Teaching Staff</option>
                            <option value="Department">Department</option>
                            <option value="Designation">Designation</option>
                            <option value="Selected Staff">Selected Staff (Multi-Select)</option>
                          </select>
                        </div>

                        {nonTeachingGroupType === 'Department' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Department</label>
                            <select
                              value={nonTeachingTargetDept}
                              onChange={e => setNonTeachingTargetDept(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['Administration', 'HR', 'Finance', 'Transport', 'Hostel', 'IT', 'Maintenance', 'Security', 'Housekeeping'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STUDENT FILTER PANEL */}
                  {selectedGroupParticipantTypes.includes('Student') && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5 border-indigo-50 dark:border-indigo-950">
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          🎓 Student Target Filters
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-mono">
                          {resolvedGroupParticipantsBreakdown.studentCount} Students
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Group Type *</label>
                          <select
                            value={studentGroupType}
                            onChange={e => setStudentGroupType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          >
                            <option value="All Students">All Students</option>
                            <option value="Class">Class</option>
                            <option value="Section">Section</option>
                            <option value="Class & Section">Class & Section</option>
                            <option value="Hostel Students">Hostel Students</option>
                            <option value="Day Scholars">Day Scholars</option>
                            <option value="Selected Students">Selected Students (Multi-Select)</option>
                          </select>
                        </div>

                        {(studentGroupType === 'Class' || studentGroupType === 'Class & Section') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Class</label>
                            <select
                              value={studentTargetClass}
                              onChange={e => setStudentTargetClass(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {(studentGroupType === 'Section' || studentGroupType === 'Class & Section') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Section</label>
                            <select
                              value={studentTargetSection}
                              onChange={e => setStudentTargetSection(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['A', 'B', 'C', 'D'].map(sec => (
                                <option key={sec} value={sec}>Section {sec}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PARENT FILTER PANEL */}
                  {selectedGroupParticipantTypes.includes('Parent') && (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-3">
                      <div className="flex items-center justify-between border-b pb-1.5 border-indigo-50 dark:border-indigo-950">
                        <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          👨‍👩‍👧 Parent Target Filters
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-mono">
                          {resolvedGroupParticipantsBreakdown.parentCount} Parents
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Group Type *</label>
                          <select
                            value={parentGroupType}
                            onChange={e => setParentGroupType(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                          >
                            <option value="All Parents">All Parents</option>
                            <option value="Parents of Class">Parents of Class</option>
                            <option value="Parents of Class & Section">Parents of Class & Section</option>
                            <option value="Selected Parents">Selected Parents (Multi-Select)</option>
                          </select>
                        </div>

                        {(parentGroupType === 'Parents of Class' || parentGroupType === 'Parents of Class & Section') && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Target Class</label>
                            <select
                              value={parentTargetClass}
                              onChange={e => setParentTargetClass(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                            >
                              {['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'].map(cls => (
                                <option key={cls} value={cls}>Class {cls}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. EXCLUDE PARTICIPANTS SECTION */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                        <UserX className="w-4 h-4 text-rose-600" />
                        Exclude Specific Participants ({excludedParticipantIds.length} Excluded)
                      </label>
                      {excludedParticipantIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExcludedParticipantIds([])}
                          className="text-[10px] font-bold text-rose-600 hover:underline"
                        >
                          Clear Exclusions
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Type participant name or ID to exclude from invitation..."
                      value={excludeSearchQuery}
                      onChange={e => setExcludeSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-800 text-xs font-medium"
                    />

                    {excludeSearchQuery.trim() && (
                      <div className="max-h-32 overflow-y-auto border border-rose-200 dark:border-rose-900 rounded-xl p-1 bg-white dark:bg-slate-900 text-xs space-y-1">
                        {resolvedGroupParticipantsBreakdown.finalParticipants
                          .filter(p => p.name.toLowerCase().includes(excludeSearchQuery.toLowerCase().trim()))
                          .map(p => (
                            <div key={p.id} className="flex items-center justify-between p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{p.name} ({p.type})</span>
                              <button
                                type="button"
                                onClick={() => setExcludedParticipantIds(prev => [...prev, p.id])}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]"
                              >
                                Exclude
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 4. ENTERPRISE ERP PARAMETERS (Priority, Attendance, Recurrence) */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">Priority</label>
                      <select
                        value={meetingPriority}
                        onChange={e => setMeetingPriority(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 font-bold text-xs"
                      >
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent 🔥</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">Attendance</label>
                      <select
                        value={attendanceRequired}
                        onChange={e => setAttendanceRequired(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 font-bold text-xs"
                      >
                        <option value="Mandatory">Mandatory</option>
                        <option value="Optional">Optional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">Recurrence</label>
                      <select
                        value={recurrence}
                        onChange={e => setRecurrence(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-800 font-bold text-xs"
                      >
                        <option value="None">None (One-time)</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* Conflict Detection Alert Banner */}
                  {conflictingParticipants.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                      <span className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Conflict Warning: {conflictingParticipants.length} participant(s) have overlapping meetings at this time.
                      </span>
                    </div>
                  )}

                  {/* Recipient Breakdown & Total Live Audience Banner */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                    resolvedGroupParticipantsBreakdown.totalRecipients > 0 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200' 
                      : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-xs">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Merged Recipient Breakdown:</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-mono">
                        Total: {resolvedGroupParticipantsBreakdown.totalRecipients} Recipients
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] font-extrabold pt-1">
                      <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                        Teaching Staff: {resolvedGroupParticipantsBreakdown.teachingCount}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                        Non-Teaching: {resolvedGroupParticipantsBreakdown.nonTeachingCount}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                        Students: {resolvedGroupParticipantsBreakdown.studentCount}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                        Parents: {resolvedGroupParticipantsBreakdown.parentCount}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Notifications & dashboard meeting cards will be dispatched strictly to the {resolvedGroupParticipantsBreakdown.totalRecipients} verified recipient(s).
                  </p>
                </div>
              )}

              {/* Title & Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Performance Review Sync"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Agenda / Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter meeting agenda or discussion topics..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              {/* Meeting Mode */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['In-Person', 'Online', 'Hybrid'] as MeetingMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, meetingMode: mode })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.meetingMode === mode
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue details for In-Person or Hybrid */}
              {(formData.meetingMode === 'In-Person' || formData.meetingMode === 'Hybrid') && (
                <div className="p-4 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                  <h4 className="font-extrabold text-[11px] text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> In-Person Venue Configuration
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Building</label>
                      <input
                        type="text"
                        placeholder="e.g. Academic Wing A"
                        value={formData.building}
                        onChange={e => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Floor</label>
                      <input
                        type="text"
                        placeholder="e.g. 1st Floor"
                        value={formData.floor}
                        onChange={e => setFormData({ ...formData, floor: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Room / Venue *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Conference Room 102"
                        value={formData.roomVenue}
                        onChange={e => setFormData({ ...formData, roomVenue: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 mb-1">Room Capacity (Read-Only Info)</label>
                    <input
                      type="number"
                      readOnly
                      value={formData.roomCapacity}
                      className="w-28 px-3 py-1.5 rounded-xl border bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 ml-2">Seats available in venue</span>
                  </div>
                </div>
              )}

              {/* Online link for Online or Hybrid */}
              {(formData.meetingMode === 'Online' || formData.meetingMode === 'Hybrid') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Online Video URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xyz-pdq-abc"
                    value={formData.onlineMeetingUrl}
                    onChange={e => setFormData({ ...formData, onlineMeetingUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              )}

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.meetingDate}
                    onChange={e => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">Start Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-455 mb-1">End Time (24h) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-455 mb-1">Meeting Status *</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as MeetingStatus })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="Scheduled">Scheduled (Send Notifications Immediately)</option>
                  <option value="Draft">Draft (Do Not Notify)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">
                  {editingMeeting ? 'Save Changes' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Meeting Drawer / Modal */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Meeting Details</h3>
                  <p className="text-[10px] text-slate-400">{viewingMeeting.title}</p>
                </div>
              </div>
              <button onClick={() => setViewingMeeting(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Audience</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{viewingMeeting.meetingAudience} Meeting</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Mode</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{viewingMeeting.meetingMode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Date</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{viewingMeeting.meetingDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Time Window</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{viewingMeeting.startTime} - {viewingMeeting.endTime}</span>
                </div>
              </div>

              {viewingMeeting.description && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Agenda</span>
                  <p className="text-slate-700 dark:text-slate-300">{viewingMeeting.description}</p>
                </div>
              )}

              {(viewingMeeting.meetingMode === 'In-Person' || viewingMeeting.meetingMode === 'Hybrid') && (
                <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">Venue Details</span>
                  <p className="font-bold text-slate-900 dark:text-white">{viewingMeeting.roomVenue} ({viewingMeeting.building}, {viewingMeeting.floor})</p>
                  <p className="text-[10px] text-slate-500 font-mono">Room Capacity: {viewingMeeting.roomCapacity || 15} Seats</p>
                </div>
              )}

              {viewingMeeting.participants && viewingMeeting.participants.length > 0 && (
                <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Invited Participant(s)</span>
                  {viewingMeeting.participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-extrabold text-slate-900 dark:text-white">{p.name} ({p.type})</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.details}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewingMeeting.cancellationReason && (
                <div className="p-3 rounded-2xl border border-rose-200 bg-rose-50/30 text-rose-700 text-xs font-medium">
                  <strong>Cancellation Reason:</strong> {viewingMeeting.cancellationReason}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t text-[10px] text-slate-400 font-medium">
                <span>Organized by: <strong className="text-slate-600 dark:text-slate-300">{viewingMeeting.organizerName} ({viewingMeeting.organizerRole})</strong></span>
                <span>Created: <strong className="font-mono text-slate-600 dark:text-slate-300">{viewingMeeting.createdAt}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Meeting Confirmation Modal */}
      {cancellingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Cancel Scheduled Meeting</h3>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Are you sure you want to cancel <strong>{cancellingMeeting.title}</strong>? A cancellation alert will be dispatched to invited participants.
            </p>

            <div>
              <label className="block text-[10px] font-bold text-slate-455 mb-1">Reason for Cancellation *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Principal unavailable due to urgent board meeting..."
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setCancellingMeeting(null)} className="px-4 py-2 font-bold bg-slate-100 hover:bg-slate-50 rounded-xl text-xs">
                Keep Scheduled
              </button>
              <button onClick={handleConfirmCancel} className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md text-xs">
                Cancel Meeting & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
