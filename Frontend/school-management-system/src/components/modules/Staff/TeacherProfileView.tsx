// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Mail, Phone, Building, GraduationCap, Briefcase, MapPin, Calendar, 
  Shield, Edit2, X, Check, AlertCircle, BookOpen, Heart, Save, Camera, CheckCircle2, Upload, Trash2,
  FileText, Download, Eye, Award, ExternalLink, Send, Clock, Loader2, UploadCloud
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { Staff } from '../../../types';
import { getSortOrderForClass } from '../../../utils/classSorter';
import { StaffLetterModal } from './Letters/StaffLetterModal';
import { StaffFormModal } from './StaffFormModal';
import { getLettersForStaff, refreshStaffLettersFromApi } from '../../../utils/staffLetterTemplates';
import { StaffLetterType, GeneratedStaffLetterRecord, StaffLetterRequest } from '../../../types/staffLetter';
import { fetchStaffLetterRequestsApi, createStaffLetterRequestApi } from '../../../api/staffLetters';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import {
  validate10DigitPhone,
  validatePhoneNumber,
  sanitizePhoneInput,
  validateAddress,
} from '../../../utils/validation';
import {
  getTeacherProfileMe,
  updateTeacherProfileMe,
  getTeacherAssignmentsMe,
  TeacherSelfProfile
} from '../../../services/teacherProfileApi';

export const formatDisplayDate = (d?: string | Date) => {
  if (!d) return 'Not Specified';
  try {
    const raw = String(d).trim();
    if (!raw || raw.toLowerCase() === 'not specified' || raw.toLowerCase() === 'null') return 'Not Specified';
    const cleanDate = raw.split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      const [y, m, day] = cleanDate.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(m, 10) - 1;
      return `${parseInt(day, 10)} ${monthNames[mIdx] || m} ${y}`;
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return cleanDate;
  } catch {}
  return String(d);
};

const DEFAULT_WARDEN_DUTIES = [
  'Hostel Discipline & Student Supervision',
  'Accommodation & Room Allocation Management',
  'Student Welfare, Health & Safety Oversight',
  'Outpass & Night Attendance Reconciliation'
];

const DEFAULT_ACCOUNTANT_DUTIES = [
  'Fee Ledger Maintenance & Reconciliation',
  'Student Fee Collection & Invoicing',
  'Payroll Processing & Disbursements',
  'Financial Auditing & Compliance'
];

const DEFAULT_LIBRARIAN_DUTIES = [
  'Library Cataloging & Book Acquisition Management',
  'Circulation Desk Oversight (Issue, Return & Renewals)',
  'Digital Library & Reading Hall Administration',
  'Library Member Registrations & Fine Reconciliation'
];

const DEFAULT_DRIVER_DUTIES = [
  'Safe Student Transit & Fleet Operation',
  'Daily Vehicle Inspection & Maintenance Logging',
  'Route Punctuality & Pickup Schedule Adherence',
  'Student Safety & Transport Discipline Supervision'
];

export const TeacherProfileView: React.FC = () => {
  const { user } = useAuth();
  const { staff = [], driverMasters = [], teacherAssignments = [], timetable = [], academicClasses = [], updateStaff, updateDriverMaster } = useData();
  const { addToast } = useToast();

  const userRoleStr = (user?.role || '').toLowerCase().trim();
  const isWarden = userRoleStr.includes('warden');
  const isAccountant = userRoleStr.includes('accountant') || userRoleStr === 'finance';
  const isLibrarian = userRoleStr.includes('librarian');
  const isDriver = userRoleStr.includes('driver');

  const [apiProfile, setApiProfile] = useState<TeacherSelfProfile | null>(null);
  const [apiAssignments, setApiAssignments] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacherProfileMe();
      if (data) {
        setApiProfile(data);
      }
    } catch (err: any) {
      console.warn('Teacher profile direct load failed, falling back to context staff:', err);
    }

    try {
      const assignData = await getTeacherAssignmentsMe();
      if (assignData) {
        setApiAssignments(assignData);
      }
    } catch (err: any) {
      console.warn('Teacher assignments load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.email, user?.id, (user as any)?.staffId]);

  // Find logged in teacher/warden/staff from direct API or DataContext staff list matching email, phone, name, or ID
  const dbTeacher = useMemo(() => {
    const userRoleStr = (user?.role || '').toLowerCase().trim();
    const isWarden = userRoleStr.includes('warden');
    const isAccountant = userRoleStr.includes('accountant') || userRoleStr === 'finance';

    // 0. Direct API profile loaded from backend is the primary source of truth
    if (apiProfile) {
      return {
        id: String(apiProfile.staffId),
        staffId: apiProfile.staffId,
        empId: apiProfile.employeeId,
        employeeId: apiProfile.employeeId,
        name: apiProfile.fullName,
        firstName: apiProfile.firstName || (apiProfile.fullName || '').split(' ')[0] || '',
        lastName: apiProfile.lastName || (apiProfile.fullName || '').split(' ').slice(1).join(' ') || '',
        email: apiProfile.email || user?.email || '',
        phone: apiProfile.mobile || user?.phone || '',
        gender: apiProfile.gender || 'Not Specified',
        dob: apiProfile.dateOfBirth ? String(apiProfile.dateOfBirth).split('T')[0] : '',
        dateOfBirth: apiProfile.dateOfBirth ? String(apiProfile.dateOfBirth).split('T')[0] : '',
        bloodGroup: apiProfile.bloodGroup || 'Not Specified',
        address: apiProfile.address || apiProfile.permanentAddress || '',
        presentAddress: apiProfile.address || '',
        emergencyContact: apiProfile.emergencyContact || '',
        branch: apiProfile.branch || user?.branch || '',
        department: apiProfile.department || (isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : isLibrarian ? 'Library Administration' : isDriver ? 'Transport Dept' : 'Academics'),
        designation: apiProfile.designation || (isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isLibrarian ? 'Librarian' : isDriver ? 'Driver' : 'Teacher'),
        role: apiProfile.designation || (isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isLibrarian ? 'Librarian' : isDriver ? 'Driver' : 'Teacher'),
        joiningDate: apiProfile.joiningDate ? String(apiProfile.joiningDate).split('T')[0] : '',
        qualification: apiProfile.qualification || '',
        experience: apiProfile.experience || '',
        status: apiProfile.employmentStatus || 'Active',
        avatar: apiProfile.profilePhoto || user?.avatar || '',
        profilePhoto: apiProfile.profilePhoto || user?.avatar || '',
        basicSalary: apiProfile.basicSalary,
        grossSalary: apiProfile.grossSalary,
        netSalary: apiProfile.netSalary,
        bankName: apiProfile.bankName,
        bankAccountNumber: apiProfile.bankAccountNumber,
        ifscCode: apiProfile.ifscCode,
        panNumber: apiProfile.panNumber,
        aadhaarNumber: apiProfile.aadhaarNumber,
        assignedClasses: apiProfile.assignedClasses || [],
        assignedSections: apiProfile.assignedSections || [],
        assignedSubjects: apiProfile.assignedSubjects || []
      };
    }

    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();
    const userPhone = (user?.phone || '').replace(/\D/g, '');
    const userEmpId = ((user as any)?.empId || (user as any)?.employeeId || '').toLowerCase().trim();
    const userStaffId = (user as any)?.staffId ? String((user as any)?.staffId) : '';

    // 1. Check exact staffId or employeeId from user session
    if (userStaffId || userEmpId) {
      const byId = staff.find(s =>
        (userStaffId && String(s.id).toLowerCase() === userStaffId) ||
        (userEmpId && ((s.empId && s.empId.toLowerCase() === userEmpId) || (s.employeeId && s.employeeId.toLowerCase() === userEmpId)))
      );
      if (byId) return byId;
    }

    // 2. Check phone number match
    if (userPhone && userPhone.length >= 7) {
      const byPhone = staff.find(s => {
        const sPhone = (s.phone || (s as any)?.mobile || '').replace(/\D/g, '');
        return sPhone === userPhone || (userPhone.length >= 10 && sPhone.endsWith(userPhone)) || (sPhone.length >= 10 && userPhone.endsWith(sPhone));
      });
      if (byPhone) return byPhone;
    }

    // 3. Check exact email match across all staff
    if (userEmail) {
      const byEmail = staff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    // 4. Check name match
    if (userName && !userName.includes('admin')) {
      const byName = staff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        return (sFullName && sFullName === userName) || (sName && sName === userName);
      });
      if (byName) return byName;
    }

    // 5. Match from driverMasters if driver
    if (isDriver && driverMasters && driverMasters.length > 0) {
      const byMaster = driverMasters.find(d =>
        (userEmail && d.email?.toLowerCase().trim() === userEmail) ||
        (userEmpId && ((d.employeeId && d.employeeId.toLowerCase().trim() === userEmpId) || (d.empId && d.empId.toLowerCase().trim() === userEmpId) || String(d.id).toLowerCase() === userEmpId)) ||
        (userName && (d.driverName?.toLowerCase().trim() === userName || d.name?.toLowerCase().trim() === userName))
      );
      if (byMaster) {
        const dName = byMaster.driverName || byMaster.name || userName || 'Driver';
        const dParts = dName.split(' ');
        return {
          id: String(byMaster.id || byMaster.employeeId || ''),
          staffId: byMaster.id,
          empId: byMaster.employeeId || byMaster.empId || userEmpId || '',
          employeeId: byMaster.employeeId || byMaster.empId || userEmpId || '',
          name: dName,
          firstName: dParts[0],
          lastName: dParts.slice(1).join(' '),
          email: byMaster.email || user?.email || '',
          phone: byMaster.phone || byMaster.contactNumber || user?.phone || '',
          gender: byMaster.gender || 'Not Specified',
          dob: byMaster.dateOfBirth || byMaster.dob || '',
          dateOfBirth: byMaster.dateOfBirth || byMaster.dob || '',
          bloodGroup: byMaster.bloodGroup || 'Not Specified',
          address: byMaster.address || '',
          emergencyContact: byMaster.emergencyContact || '',
          branch: byMaster.branch || user?.branch || '',
          department: 'Transport Dept',
          designation: 'Driver',
          role: 'Driver',
          joiningDate: byMaster.joiningDate || byMaster.licenseIssueDate || '',
          qualification: byMaster.licenseType ? `Commercial Driving License (${byMaster.licenseType})` : (byMaster.qualification || 'Commercial Driving License'),
          experience: byMaster.experience ? (String(byMaster.experience).toLowerCase().includes('year') ? String(byMaster.experience) : `${byMaster.experience} Years`) : (byMaster.experienceYears ? `${byMaster.experienceYears} Years` : ''),
          status: byMaster.status || 'Active',
          avatar: byMaster.photo || byMaster.avatar || user?.avatar || '',
          profilePhoto: byMaster.photo || byMaster.avatar || user?.avatar || '',
        };
      }
    }

    // 6. Fallback: Return dynamic profile object from logged in user (DO NOT use user account id as empId)
    const rawName = user?.name || (isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isLibrarian ? 'Librarian' : isDriver ? 'Driver' : 'Faculty Member');
    const nameParts = rawName.split(' ');
    return {
      id: userEmpId || '',
      empId: userEmpId || '',
      employeeId: userEmpId || '',
      firstName: nameParts[0] || (user?.name || ''),
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: (user as any)?.gender || 'Not Specified',
      bloodGroup: (user as any)?.bloodGroup || 'Not Specified',
      dob: (user as any)?.dob || '',
      dateOfBirth: (user as any)?.dob || (user as any)?.dateOfBirth || '',
      address: (user as any)?.address || '',
      emergencyContact: (user as any)?.emergencyContact || '',
      joiningDate: (user as any)?.joiningDate || '',
      assignedClasses: [],
      assignedSections: [],
      assignedSubjects: [],
      department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : isLibrarian ? 'Library Administration' : isDriver ? 'Transport Dept' : ((user as any)?.department || 'Academics'),
      designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isLibrarian ? 'Librarian' : isDriver ? 'Driver' : ((user as any)?.designation || 'Teacher'),
      qualification: ((user as any)?.qualification || (user as any)?.highestQualification || ''),
      experience: (user as any)?.experience || (user as any)?.workExperience || '',
      branch: user?.branch || '',
      avatar: user?.avatar || ''
    };
  }, [user, staff, apiProfile, driverMasters, isDriver, isWarden, isAccountant, isLibrarian]);

  // Dynamically compute Class Teacher assignment details from all master sources (Class Management, Assignments, Staff DB)
  const classTeacherInfo = useMemo(() => {
    const uNameLower = (user?.name || '').toLowerCase().trim();
    const dbNameLower = (dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : '').toLowerCase();
    const dbSingleNameLower = (dbTeacher?.name || '').toLowerCase().trim();
    const tFirstName = (dbTeacher?.firstName || (user?.name || '').split(' ')[0] || '').toLowerCase().trim();
    const tId = dbTeacher?.id || dbTeacher?.empId || (user as any)?.empId || user?.id;

    const namesToMatch = Array.from(new Set([uNameLower, dbNameLower, dbSingleNameLower])).filter(Boolean);

    const isTeacherNameMatch = (targetName?: string) => {
      if (!targetName) return false;
      const targetLower = targetName.toLowerCase().trim();
      return namesToMatch.some(nm => 
        nm === targetLower || 
        targetLower.includes(nm) || 
        nm.includes(targetLower) || 
        (tFirstName.length > 3 && targetLower.includes(tFirstName))
      );
    };

    // 1. PRIORITIZE Admin Class Management workspace assignments (academicClasses sectionTeachers map)
    const adminConfiguredMatches: string[] = [];
    if (academicClasses && academicClasses.length > 0) {
      for (const cls of academicClasses) {
        const clsNameRaw = cls.name || cls.className || '';
        if (clsNameRaw.toLowerCase().includes('nursery') || clsNameRaw.toLowerCase().includes('lkg') || clsNameRaw.toLowerCase().includes('ukg')) {
          continue;
        }
        let clsName = clsNameRaw.trim();
        if (!clsName.toLowerCase().startsWith('class')) clsName = `Class ${clsName}`;
        const secTeachers = (cls as any).sectionTeachers || {};

        for (const [sec, tName] of Object.entries(secTeachers)) {
          if (typeof tName === 'string' && tName.trim() && isTeacherNameMatch(tName)) {
            adminConfiguredMatches.push(`${clsName}-${sec}`);
          }
        }

        const singleCT = cls.classTeacher || (cls as any).classTeacherName;
        if (typeof singleCT === 'string' && singleCT.trim() && isTeacherNameMatch(singleCT)) {
          adminConfiguredMatches.push(`${clsName}-A`);
        }
      }
    }

    if (adminConfiguredMatches.length > 0) {
      // Sort by class order rank in descending order so assigned grade (Class 9-A) takes top priority
      adminConfiguredMatches.sort((a, b) => getSortOrderForClass(b) - getSortOrderForClass(a));
      const primaryCls = adminConfiguredMatches[0];
      const parts = primaryCls.split('-');
      return { isClassTeacher: true, className: primaryCls, section: parts[1] || 'A' };
    }

    // 2. Check teacherAssignments for role === 'Class Teacher' or isClassTeacher === true
    const ctAssignments = teacherAssignments.filter(ta => {
      if (!ta) return false;
      if (ta.className && (ta.className.toLowerCase().includes('nursery') || ta.className.toLowerCase().includes('lkg') || ta.className.toLowerCase().includes('ukg'))) {
        return false;
      }
      const matchName = isTeacherNameMatch(ta.teacherName);
      const matchId = tId && (String(ta.teacherId) === String(tId));
      const isCT = ta.role === 'Class Teacher' || ta.isClassTeacher === true || ta.designation?.includes('Class Teacher');
      return (matchName || matchId) && isCT;
    });

    if (ctAssignments.length > 0) {
      const formattedList = ctAssignments.map(ta => {
        let clsName = ta.className ? (ta.className.startsWith('Class ') ? ta.className : `Class ${ta.className}`) : '';
        const sec = ta.section || 'A';
        return clsName.includes('-') ? clsName : `${clsName}-${sec}`;
      });
      formattedList.sort((a, b) => getSortOrderForClass(b) - getSortOrderForClass(a));
      const primaryCls = formattedList[0];
      const parts = primaryCls.split('-');
      return { isClassTeacher: true, className: primaryCls, section: parts[1] || 'A' };
    }

    // 3. Check staff record fields (isClassTeacher, classTeacherFor, designation)
    const isStaffCT = dbTeacher?.isClassTeacher === true || (dbTeacher?.designation || '').toLowerCase().includes('class teacher');
    if (isStaffCT) {
      const assignedCls = (dbTeacher?.assignedClasses && dbTeacher.assignedClasses[0]) ? dbTeacher.assignedClasses[0] : '';
      if (!assignedCls.toLowerCase().includes('nursery') && !assignedCls.toLowerCase().includes('lkg') && !assignedCls.toLowerCase().includes('ukg')) {
        const parts = assignedCls.split('-');
        const clsFormatted = assignedCls ? (assignedCls.startsWith('Class ') ? assignedCls : `Class ${assignedCls}`) : '';
        return { isClassTeacher: true, className: clsFormatted.includes('-') ? clsFormatted : `${clsFormatted}-A`, section: parts[1] || 'A' };
      }
    }

    return { isClassTeacher: false, className: '', section: '' };
  }, [dbTeacher, user, teacherAssignments, academicClasses]);

  // Dynamically compute assigned classes with section suffixes (e.g. Class 9-A, Class 8-A)
  const dynamicAssignedClasses = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    const uNameLower = (user?.name || '').toLowerCase().trim();
    const dbNameLower = (dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : '').toLowerCase();
    const tFirstName = (dbTeacher?.firstName || (user?.name || '').split(' ')[0] || '').toLowerCase().trim();

    const namesToMatch = Array.from(new Set([uNameLower, dbNameLower])).filter(Boolean);

    const isTeacherNameMatch = (targetName?: string) => {
      if (!targetName) return false;
      const targetLower = targetName.toLowerCase().trim();
      return namesToMatch.some(nm => 
        nm === targetLower || 
        targetLower.includes(nm) || 
        nm.includes(targetLower) || 
        (tFirstName.length > 3 && targetLower.includes(tFirstName))
      );
    };

    const formatClsSec = (className?: string, section?: string) => {
      if (!className) return null;
      let cls = className.trim();
      if (!cls.toLowerCase().startsWith('class')) cls = `Class ${cls}`;
      if (cls.includes('-')) return cls;
      const sec = (section || 'A').trim().replace(/^(section|sec)\s*/i, '');
      return `${cls}-${sec}`;
    };

    // From Academic Classes (Class Management sectionTeachers in Admin)
    const fromAcademicClasses: string[] = [];
    if (academicClasses && academicClasses.length > 0) {
      academicClasses.forEach(cls => {
        const clsNameRaw = cls.name || cls.className || '';
        const clsName = clsNameRaw.startsWith('Class ') ? clsNameRaw : `Class ${clsNameRaw}`;
        const secTeachers = (cls as any).sectionTeachers || {};
        for (const [sec, tName] of Object.entries(secTeachers)) {
          if (typeof tName === 'string' && tName.trim() && isTeacherNameMatch(tName)) {
            fromAcademicClasses.push(`${clsName}-${sec}`);
          }
        }
      });
    }

    const fromAssignments = teacherAssignments
      .filter(ta => isTeacherNameMatch(ta.teacherName))
      .map(ta => formatClsSec(ta.className, ta.section));

    const fromTimetable = timetable
      .filter(t => isTeacherNameMatch(t.teacherName))
      .map(t => formatClsSec(t.className, t.section));

    const fromStaff = (dbTeacher?.assignedClasses || []).map(ac => {
      let str = ac.trim();
      if (!str.toLowerCase().startsWith('class')) str = `Class ${str}`;
      return str.includes('-') ? str : `${str}-A`;
    });

    const merged = Array.from(new Set([...fromAcademicClasses, ...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean);
    const cleaned = merged.filter((c: any) => !c.toLowerCase().includes('nursery') && !c.toLowerCase().includes('lkg') && !c.toLowerCase().includes('ukg')) as string[];

    if (apiProfile?.assignedClasses && apiProfile.assignedClasses.length > 0) {
      return apiProfile.assignedClasses;
    }
    return cleaned;
  }, [dbTeacher, user, teacherAssignments, timetable, academicClasses, apiProfile]);

  // Dynamically compute assigned sections from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSections = useMemo(() => {
    if (apiProfile?.assignedSections && apiProfile.assignedSections.length > 0) {
      return apiProfile.assignedSections;
    }

    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    const tFirstName = (dbTeacher?.firstName || '').toLowerCase().trim();

    const fromAssignments = teacherAssignments
      .filter(ta => {
        const taName = (ta.teacherName || '').toLowerCase();
        return (teacherName && taName.includes(teacherName.toLowerCase())) || (tFirstName && taName.includes(tFirstName));
      })
      .map(ta => ta.section ? (ta.section.startsWith('Section ') ? ta.section : `Section ${ta.section}`) : null);

    const fromTimetable = timetable
      .filter(t => {
        const tName = (t.teacherName || '').toLowerCase();
        return (teacherName && tName.includes(teacherName.toLowerCase())) || (tFirstName && tName.includes(tFirstName));
      })
      .map(t => t.section ? (t.section.startsWith('Section ') ? t.section : `Section ${t.section}`) : null);

    const fromStaff = (dbTeacher?.assignedClasses || []).map(ac => ac.includes('-') ? `Section ${ac.split('-')[1].trim()}` : null);
    const fromStaffSections = (dbTeacher?.assignedSections || []).map(sec => sec.startsWith('Section ') ? sec : `Section ${sec}`);

    return Array.from(new Set([...fromStaff, ...fromStaffSections, ...fromAssignments, ...fromTimetable])).filter(Boolean) as string[];
  }, [dbTeacher, user, teacherAssignments, timetable, apiProfile]);

  // Dynamically compute assigned subjects from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSubjects = useMemo(() => {
    if (apiProfile?.assignedSubjects && apiProfile.assignedSubjects.length > 0) {
      return apiProfile.assignedSubjects;
    }

    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    const tFirstName = (dbTeacher?.firstName || '').toLowerCase().trim();

    const fromAssignments = teacherAssignments
      .filter(ta => {
        const taName = (ta.teacherName || '').toLowerCase();
        return (teacherName && taName.includes(teacherName.toLowerCase())) || (tFirstName && taName.includes(tFirstName));
      })
      .map(ta => ta.subject);

    const fromTimetable = timetable
      .filter(t => {
        const tName = (t.teacherName || '').toLowerCase();
        return (teacherName && tName.includes(teacherName.toLowerCase())) || (tFirstName && tName.includes(tFirstName));
      })
      .map(t => t.subject);

    const fromStaff = dbTeacher?.assignedSubjects || [];

    const merged = Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean) as string[];

    if (fromStaff.length > 0) {
      return fromStaff;
    }

    const defaultSub = dbTeacher?.department || (dbTeacher as any)?.primarySubject || '';
    return merged.length > 0 ? merged : (defaultSub ? [defaultSub] : []);
  }, [dbTeacher, user, teacherAssignments, timetable, apiProfile]);

  // User-scoped Local Storage key for Teacher self-edits
  const userStorageKey = useMemo(() => {
    const idStr = (user?.email || user?.id || user?.name || 'default').toLowerCase().trim();
    return `teacher_self_profile_edits_${idStr}`;
  }, [user]);

  const [localEdit, setLocalEdit] = useState<any>(() => {
    try {
      const idStr = (user?.email || user?.id || user?.name || 'default').toLowerCase().trim();
      const scopedKey = `teacher_self_profile_edits_${idStr}`;
      const saved = localStorage.getItem(scopedKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Reactive staff profile construction merging Admin master data & user edits
  const profile = useMemo(() => {
    const userRoleStr = (user?.role || '').toLowerCase().trim();
    const isWarden = userRoleStr.includes('warden');
    const isAccountant = userRoleStr.includes('accountant') || userRoleStr === 'finance';

    const dbFullName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : '';
    const isGenericAdminName = dbFullName.toLowerCase().includes('administrator') || dbFullName.toLowerCase().includes('admin');

    const defaultFullName = (user?.name && !user.name.toLowerCase().includes('admin'))
      ? user.name
      : (!isGenericAdminName && dbFullName)
      ? dbFullName
      : (isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : isLibrarian ? 'Librarian' : 'Faculty Member');

    const fallbackDept = isAccountant
      ? 'Finance & Accounts'
      : isWarden
      ? 'Hostel Management'
      : isDriver
      ? 'Transport Dept'
      : (dbTeacher?.department || (dbTeacher as any)?.primarySubject || (user as any)?.department || 'Academics');

    const fallbackDesignation = isAccountant
      ? 'Accountant'
      : isWarden
      ? 'Hostel Warden'
      : isDriver
      ? 'Driver'
      : (dbTeacher?.designation && !dbTeacher.designation.toLowerCase().includes('administrator') ? dbTeacher.designation : ((user as any)?.designation || 'Teacher'));

    const fallbackRole = isAccountant
      ? 'Accountant'
      : isWarden
      ? 'Hostel Warden'
      : isDriver
      ? 'Driver'
      : (dbTeacher?.role || fallbackDesignation);

    const isWardenStaff = isWarden ||
      String(dbTeacher?.designation || '').toLowerCase().includes('warden') ||
      String(dbTeacher?.role || '').toLowerCase().includes('warden') ||
      String(dbTeacher?.department || '').toLowerCase().includes('hostel');

    const isAccountantStaff = isAccountant ||
      String(dbTeacher?.designation || '').toLowerCase().includes('accountant') ||
      String(dbTeacher?.role || '').toLowerCase().includes('accountant') ||
      String(dbTeacher?.department || '').toLowerCase().includes('finance');

    const isLibrarianStaff = isLibrarian ||
      String(dbTeacher?.designation || '').toLowerCase().includes('librarian') ||
      String(dbTeacher?.role || '').toLowerCase().includes('librarian') ||
      String(dbTeacher?.department || '').toLowerCase().includes('library');

    const isDriverStaff = isDriver ||
      String(dbTeacher?.designation || '').toLowerCase().includes('driver') ||
      String(dbTeacher?.role || '').toLowerCase().includes('driver') ||
      String(dbTeacher?.department || '').toLowerCase().includes('transport');

    const effectiveEmergencyContact = localEdit?.emergencyContact ||
      (dbTeacher as any)?.emergencyContact ||
      (dbTeacher as any)?.alternateMobile ||
      (dbTeacher as any)?.guardianPhone ||
      (user as any)?.emergencyContact ||
      '';

    const effectiveQualification = localEdit?.qualification ||
      (dbTeacher as any)?.qualification ||
      dbTeacher?.highestQualification ||
      (user as any)?.qualification ||
      (Array.isArray((dbTeacher as any)?.qualifications) && (dbTeacher as any).qualifications.length > 0
        ? ((dbTeacher as any).qualifications[0]?.qualification || (dbTeacher as any).qualifications[0]?.degree || '')
        : '') ||
      '';

    const effectiveExperience = localEdit?.experience ||
      (dbTeacher as any)?.experience ||
      (user as any)?.experience ||
      (user as any)?.workExperience ||
      '';

    const effectiveAssignedSubjects = isWardenStaff
      ? (Array.isArray(dbTeacher?.assignedSubjects) && dbTeacher.assignedSubjects.length > 0 ? dbTeacher.assignedSubjects : DEFAULT_WARDEN_DUTIES)
      : isAccountantStaff
      ? (Array.isArray(dbTeacher?.assignedSubjects) && dbTeacher.assignedSubjects.length > 0 ? dbTeacher.assignedSubjects : DEFAULT_ACCOUNTANT_DUTIES)
      : isLibrarianStaff
      ? (Array.isArray(dbTeacher?.assignedSubjects) && dbTeacher.assignedSubjects.length > 0 ? dbTeacher.assignedSubjects : DEFAULT_LIBRARIAN_DUTIES)
      : isDriverStaff
      ? (Array.isArray(dbTeacher?.assignedSubjects) && dbTeacher.assignedSubjects.length > 0 ? dbTeacher.assignedSubjects : DEFAULT_DRIVER_DUTIES)
      : (dynamicAssignedSubjects.length > 0 ? dynamicAssignedSubjects : (Array.isArray(dbTeacher?.assignedSubjects) && dbTeacher.assignedSubjects.length > 0 ? dbTeacher.assignedSubjects : []));

    return {
      staffId: dbTeacher?.staffId || dbTeacher?.id || (user as any)?.staffId || '',
      employeeId: dbTeacher?.empId || dbTeacher?.employeeId || (user as any)?.empId || '',
      fullName: localEdit?.fullName || defaultFullName,
      email: localEdit?.email || dbTeacher?.email || user?.email || '',
      mobile: localEdit?.mobile || dbTeacher?.phone || user?.phone || (user as any)?.mobile || '',
      gender: localEdit?.gender || dbTeacher?.gender || (user as any)?.gender || 'Not Specified',
      dateOfBirth: localEdit?.dateOfBirth || dbTeacher?.dob || dbTeacher?.dateOfBirth || (user as any)?.dob || '',
      bloodGroup: localEdit?.bloodGroup || dbTeacher?.bloodGroup || (user as any)?.bloodGroup || 'Not Specified',
      address: localEdit?.address || dbTeacher?.address || (dbTeacher as any)?.presentAddress || (user as any)?.address || '',
      emergencyContact: effectiveEmergencyContact,
      branch: dbTeacher?.branch || user?.branch || '',
      department: fallbackDept,
      designation: fallbackDesignation,
      role: fallbackRole,
      joiningDate: dbTeacher?.joiningDate || (user as any)?.joiningDate || '',
      qualification: effectiveQualification,
      experience: effectiveExperience,
      basicSalary: dbTeacher?.basicSalary,
      grossSalary: dbTeacher?.grossSalary,
      netSalary: dbTeacher?.netSalary,
      bankName: dbTeacher?.bankName,
      bankAccountNumber: dbTeacher?.bankAccountNumber,
      ifscCode: dbTeacher?.ifscCode,
      panNumber: dbTeacher?.panNumber,
      aadhaarNumber: dbTeacher?.aadhaarNumber,
      assignedClasses: dynamicAssignedClasses,
      assignedSections: dynamicAssignedSections,
      assignedSubjects: effectiveAssignedSubjects,
      employmentStatus: dbTeacher?.status || 'Active',
      profileStatus: 'Completed',
      profilePhoto: localEdit?.profilePhoto || dbTeacher?.avatar || user?.avatar || '',
      avatar: localEdit?.profilePhoto || dbTeacher?.avatar || user?.avatar || ''
    };
  }, [dbTeacher, user, dynamicAssignedClasses, dynamicAssignedSections, dynamicAssignedSubjects, localEdit]);

  // Edit Modal State using Staff ERP Full Modal (identical to Admin StaffFormModal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalInitialStep, setEditModalInitialStep] = useState<number>(1);

  const staffMemberForEdit = useMemo<Staff | null>(() => {
    // 1. If we have a staff record matching dbTeacher.id in DataContext staff
    let found = staff.find(s => String(s.id) === String(dbTeacher?.id));
    if (!found && dbTeacher?.empId) {
      found = staff.find(s => (s.empId && s.empId.toLowerCase() === dbTeacher.empId.toLowerCase()) || ((s as any).employeeId && (s as any).employeeId.toLowerCase() === dbTeacher.empId.toLowerCase()));
    }
    if (!found) {
      const uEmpId = ((user as any)?.empId || (user as any)?.employeeId || profile.employeeId || '').toLowerCase().trim();
      const uEmail = (user?.email || '').toLowerCase().trim();
      if (uEmpId || uEmail) {
        found = staff.find(s =>
          (uEmpId && ((s.empId && s.empId.toLowerCase() === uEmpId) || ((s as any).employeeId && (s as any).employeeId.toLowerCase() === uEmpId))) ||
          (uEmail && s.email && s.email.toLowerCase().trim() === uEmail)
        );
      }
    }

    const isTeacherStaff = profile.category === 'Teacher' || profile.category === 'Teaching Staff' || (!isWarden && !isAccountant && !isLibrarian && !isDriver);

    if (found) {
      return {
        ...found,
        id: String(found.id || dbTeacher?.id || user?.id || 'staff-self'),
        empId: found.empId || profile.employeeId || dbTeacher?.empId || '',
        name: found.name || profile.fullName || `${dbTeacher?.firstName || ''} ${dbTeacher?.lastName || ''}`.trim(),
        firstName: found.firstName || dbTeacher?.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : 'Staff'),
        lastName: found.lastName || dbTeacher?.lastName || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : 'Member'),
        employeeCategory: found.employeeCategory || (isTeacherStaff ? 'Teaching Staff' : 'Non-Teaching Staff'),
        branch: found.branch || profile.branch || user?.branch || 'Madhapur Branch',
        department: found.department || profile.department || (isTeacherStaff ? 'Academics' : 'Hostel Management'),
        designation: found.designation || profile.designation || (isTeacherStaff ? 'Teacher' : 'Hostel Warden'),
        email: found.email || profile.email || user?.email || '',
        phone: found.phone || profile.mobile || user?.phone || '',
        gender: found.gender || profile.gender || 'Male',
        dob: found.dob || profile.dateOfBirth || '1990-01-01',
        bloodGroup: found.bloodGroup || profile.bloodGroup || 'O+',
        presentAddress: found.presentAddress || found.address || profile.address || '',
        permanentAddress: found.permanentAddress || found.address || profile.address || '',
        city: found.city || 'Hyderabad',
        state: found.state || 'Telangana',
        pinCode: found.pinCode || '500081',
        country: found.country || 'India',
        aadhaarNumber: found.aadhaarNumber || (dbTeacher as any)?.aadhaarNumber || '',
        panNumber: found.panNumber || (dbTeacher as any)?.panNumber || '',
        joiningDate: found.joiningDate || profile.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: found.employmentType || 'Full-Time',
        status: found.status || 'Active',
        avatar: found.avatar || profile.profilePhoto || user?.avatar || '',
        qualifications: found.qualifications || (dbTeacher as any)?.qualifications || [],
        experienceRecords: found.experienceRecords || (dbTeacher as any)?.experienceRecords || [],
        documents: found.documents || (dbTeacher as any)?.documents || []
      } as Staff;
    }

    // Fallback: construct comprehensive Staff object from dbTeacher/profile
    if (dbTeacher || user) {
      return {
        id: String(dbTeacher?.id || user?.id || 'staff-self'),
        empId: profile.employeeId || dbTeacher?.empId || '',
        name: profile.fullName || `${dbTeacher?.firstName || ''} ${dbTeacher?.lastName || ''}`.trim() || user?.name || 'Staff Member',
        firstName: dbTeacher?.firstName || (profile.fullName ? profile.fullName.split(' ')[0] : 'Staff'),
        lastName: dbTeacher?.lastName || (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : 'Member'),
        employeeCategory: (isTeacherStaff ? 'Teaching Staff' : 'Non-Teaching Staff') as any,
        branch: profile.branch || user?.branch || 'Madhapur Branch',
        department: profile.department || (isTeacherStaff ? 'Academics' : 'Hostel Management'),
        designation: profile.designation || (isTeacherStaff ? 'Teacher' : 'Hostel Warden'),
        role: profile.designation || (isTeacherStaff ? 'Teacher' : 'Staff'),
        email: profile.email || user?.email || '',
        phone: profile.mobile || user?.phone || '',
        gender: profile.gender || 'Male',
        dob: profile.dateOfBirth || '1990-01-01',
        bloodGroup: profile.bloodGroup || 'O+',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500081',
        country: 'India',
        aadhaarNumber: (dbTeacher as any)?.aadhaarNumber || '',
        panNumber: (dbTeacher as any)?.panNumber || '',
        joiningDate: profile.joiningDate || new Date().toISOString().split('T')[0],
        status: 'Active',
        employmentType: 'Full-Time',
        address: profile.address || '',
        presentAddress: profile.address || '',
        permanentAddress: profile.address || '',
        avatar: profile.profilePhoto || user?.avatar || '',
        qualifications: (dbTeacher as any)?.qualifications || [],
        experienceRecords: (dbTeacher as any)?.experienceRecords || [],
        documents: (dbTeacher as any)?.documents || []
      } as Staff;
    }

    return null;
  }, [dbTeacher, staff, user, profile, isWarden, isAccountant, isLibrarian, isDriver]);

  const handleOpenEditModal = (step = 1) => {
    setEditModalInitialStep(typeof step === 'number' ? step : 1);
    setIsEditModalOpen(true);
  };

  // Custom Delete Document Modal State
  const [docToDelete, setDocToDelete] = useState<{ id?: string; index: number; name: string } | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Document Preview Modal State
  const [viewingDoc, setViewingDoc] = useState<{ name: string; type: string; url: string } | null>(null);

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;

    setIsDeletingDoc(true);
    try {
      const currentDocs = staffMemberForEdit?.documents || (dbTeacher as any)?.documents || [];
      const updatedDocs = currentDocs.filter((d: any, idx: number) => {
        if (docToDelete.id && (d.id === docToDelete.id || String(d.id) === String(docToDelete.id))) {
          return false;
        }
        if (idx === docToDelete.index) {
          return false;
        }
        return true;
      });

      const targetId = staffMemberForEdit?.staffId || staffMemberForEdit?.id || dbTeacher?.staffId || dbTeacher?.id || profile.staffId || profile.employeeId;
      if (targetId) {
        await updateStaff(targetId, { documents: updatedDocs });
      }

      addToast('success', 'Document Deleted', `"${docToDelete.name}" has been removed from your profile.`);
      setDocToDelete(null);
      await fetchProfileData();
    } catch (err: any) {
      console.error('Failed to delete document:', err);
      addToast('error', 'Delete Failed', 'Could not delete the document. Please try again.');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  // Staff HR Letters State & Listeners
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState<StaffLetterType>('offer');
  const [selectedLetterRecord, setSelectedLetterRecord] = useState<GeneratedStaffLetterRecord | undefined>(undefined);
  const [staffLetters, setStaffLetters] = useState<GeneratedStaffLetterRecord[]>([]);

  // Staff Letter Requests State
  const [staffRequests, setStaffRequests] = useState<StaffLetterRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalType, setRequestModalType] = useState<'relieving' | 'experience'>('relieving');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestRelievingDate, setRequestRelievingDate] = useState('');
  const [requestComments, setRequestComments] = useState('');

  const refreshStaffLettersAndRequests = async () => {
    const sId = profile.employeeId || dbTeacher?.empId || dbTeacher?.id || (user as any)?.empId || user?.id;
    if (sId) {
      setStaffLetters(getLettersForStaff(sId));
      try {
        await refreshStaffLettersFromApi();
        setStaffLetters(getLettersForStaff(sId));
      } catch {}
      try {
        const res = await fetchStaffLetterRequestsApi({ staffId: String(sId) });
        if (Array.isArray(res?.data)) {
          setStaffRequests(res.data);
        }
      } catch (err) {
        console.warn('Could not load staff requests:', err);
      }
    }
  };

  useEffect(() => {
    refreshStaffLettersAndRequests();
    window.addEventListener('staff_letters_updated', refreshStaffLettersAndRequests);
    window.addEventListener('staff_requests_updated', refreshStaffLettersAndRequests);
    return () => {
      window.removeEventListener('staff_letters_updated', refreshStaffLettersAndRequests);
      window.removeEventListener('staff_requests_updated', refreshStaffLettersAndRequests);
    };
  }, [profile.employeeId, dbTeacher?.id, dbTeacher?.empId, user?.id]);

  const handleOpenRequestModal = (type: 'relieving' | 'experience') => {
    setRequestModalType(type);
    setRequestReason('');
    setRequestRelievingDate('');
    setRequestComments('');
    setIsRequestModalOpen(true);
  };

  const handleSubmitStaffRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestSubmitting) return;

    const sId = profile.employeeId || dbTeacher?.empId || dbTeacher?.id || (user as any)?.empId || user?.id;
    const empId = profile.employeeId || dbTeacher?.empId || (user as any)?.empId || '';
    const staffName = profile.fullName || user?.name || 'Staff Member';

    if (requestModalType === 'relieving' && !requestRelievingDate) {
      addToast('warning', 'Relieving Date Required', 'Please select a proposed relieving date.');
      return;
    }

    if (!requestReason.trim()) {
      addToast('warning', 'Reason Required', `Please provide a ${requestModalType === 'relieving' ? 'reason for relieving' : 'purpose of experience certificate'}.`);
      return;
    }

    try {
      setRequestSubmitting(true);
      const res = await createStaffLetterRequestApi({
        requestType: requestModalType,
        staffId: String(sId || ''),
        staffEmpId: String(empId || ''),
        staffName: staffName,
        designation: profile.designation || 'Staff Member',
        department: profile.department || 'Academics',
        branch: profile.branch || user?.branch || '',
        reason: requestReason.trim(),
        relievingDate: requestModalType === 'relieving' ? requestRelievingDate : undefined,
        comments: requestComments.trim()
      });

      if (res?.success) {
        addToast('success', 'Request Submitted', `${requestModalType === 'relieving' ? 'Relieving letter' : 'Experience certificate'} request submitted to HR/Administration.`);
        setIsRequestModalOpen(false);
        refreshStaffLettersAndRequests();
        window.dispatchEvent(new Event('staff_requests_updated'));
      }
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Request Failed', err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const staffForLetter = useMemo(() => {
    const fullNameStr = profile.fullName || 'Staff Member';
    const parts = fullNameStr.split(' ');
    return {
      id: dbTeacher?.id || String(profile.staffId || user?.id || ''),
      empId: profile.employeeId || dbTeacher?.empId || (user as any)?.empId || '',
      firstName: parts[0] || 'Staff',
      lastName: parts.slice(1).join(' ') || 'Member',
      email: profile.email,
      phone: profile.mobile,
      designation: profile.designation,
      department: profile.department,
      role: profile.role || profile.designation,
      branch: dbTeacher?.branch || user?.branch || '',
      joiningDate: profile.joiningDate,
      dateOfJoining: profile.joiningDate,
      qualification: profile.qualification,
      experience: profile.experience,
      address: profile.address,
      basicSalary: Number(profile.basicSalary ?? (dbTeacher as any)?.basicSalary ?? (dbTeacher as any)?.monthlySalary ?? 0),
      hra: Number((dbTeacher as any)?.hra ?? 0),
      da: Number((dbTeacher as any)?.da ?? 0),
      specialAllowance: Number((dbTeacher as any)?.specialAllowance ?? 0),
      conveyance: Number((dbTeacher as any)?.conveyance ?? 0),
      medicalAllowance: Number((dbTeacher as any)?.medicalAllowance ?? 0),
      grossSalary: Number(profile.grossSalary ?? (dbTeacher as any)?.grossSalary ?? 0),
      netSalary: Number(profile.netSalary ?? (dbTeacher as any)?.netSalary ?? 0),
      bankName: profile.bankName || (dbTeacher as any)?.bankName || '',
      bankAccountNumber: profile.bankAccountNumber || (dbTeacher as any)?.bankAccountNumber || (dbTeacher as any)?.accountNumber || '',
      ifscCode: profile.ifscCode || (dbTeacher as any)?.ifscCode || '',
      panNumber: profile.panNumber || (dbTeacher as any)?.panNumber || '',
      aadhaarNumber: profile.aadhaarNumber || (dbTeacher as any)?.aadhaarNumber || '',
      ...dbTeacher
    };
  }, [dbTeacher, profile, user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full shimmer-block shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded-md shimmer-block" />
              <div className="h-3 w-32 rounded-md shimmer-block" />
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="h-4 w-full rounded-md shimmer-block" />
            <div className="h-4 w-11/12 rounded-md shimmer-block" />
            <div className="h-4 w-2/3 rounded-md shimmer-block" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center text-red-700 dark:text-red-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold mb-2">Profile Error</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchProfileData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner & Hero Card - Compact Clean White Theme */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-sm border border-sky-200 dark:border-slate-700/80">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3.5 sm:gap-4 flex-1">
            <div className="relative shrink-0">
              {profile.profilePhoto || profile.avatar ? (
                <img
                  key={profile.profilePhoto || profile.avatar}
                  src={resolveMediaUrl(profile.profilePhoto || profile.avatar)}
                  alt={profile.fullName || 'Teacher'}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-sm ring-2 ring-sky-500/20"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                    const fb = target.nextElementSibling as HTMLElement | null;
                    if (fb) fb.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                style={{ backgroundColor: 'var(--secondary-color, #f59e0b)' }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-white font-black text-base sm:text-lg items-center justify-center shadow-sm ${
                  profile.profilePhoto || profile.avatar ? 'hidden' : 'flex'
                }`}
              >
                {(() => {
                  const nameParts = (profile.fullName || user?.name || 'Teacher').trim().split(/\s+/);
                  if (nameParts.length >= 2) return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                  return (nameParts[0] || 'T').substring(0, 2).toUpperCase();
                })()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full shadow-sm ${
                  (profile.employmentStatus || 'ACTIVE').toUpperCase() === 'INACTIVE'
                    ? 'bg-amber-500'
                    : (profile.employmentStatus || 'ACTIVE').toUpperCase() === 'RESIGNED'
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                }`}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-lg sm:text-xl font-black text-sky-600 dark:text-sky-400 tracking-tight">{profile.fullName}</h1>
                {(() => {
                  const empStatus = (profile.employmentStatus || 'ACTIVE').toUpperCase();
                  const isInactive = empStatus === 'INACTIVE';
                  const isResigned = empStatus === 'RESIGNED';
                  const colorCls = isInactive
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                    : isResigned
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${colorCls}`}>
                      {empStatus}
                    </span>
                  );
                })()}
                {classTeacherInfo.isClassTeacher && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-200 dark:border-amber-800/50 flex items-center gap-1">
                    🏷️ Class Teacher ({classTeacherInfo.className})
                  </span>
                )}
              </div>

              <p className="text-sky-600 dark:text-sky-400 font-bold text-xs sm:text-sm">
                {profile.designation}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5 font-semibold">
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-sky-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                  <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Emp ID: {profile.employeeId || 'Not Assigned'}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-lg border border-sky-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  Joined: {formatDisplayDate(profile.joiningDate)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenEditModal}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 self-center sm:self-center"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content: 2x2 Equal-Sized Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Contact Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Contact Information
              </h2>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-2.5 py-1 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs mt-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Email Address</span>
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  {profile.email || 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Mobile Number</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {profile.mobile || 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Emergency Contact</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {profile.emergencyContact || (isWarden ? '+91-9876543210' : 'Not Specified')}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Residential Address</span>
                <span className="text-slate-900 dark:text-white font-medium flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  {profile.address || 'Not Specified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Personal Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Personal Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs mt-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Gender</span>
                <span className="text-slate-900 dark:text-white font-bold">{profile.gender || 'Not Specified'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Blood Group</span>
                <span className="text-slate-900 dark:text-white font-bold">{profile.bloodGroup || 'Not Specified'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Date of Birth</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{formatDisplayDate(profile.dateOfBirth)}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Role</span>
                <span className="text-slate-900 dark:text-white font-bold">{profile.designation || profile.role || 'Teacher'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Employee ID</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{profile.employeeId || 'Not Assigned'}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Joined Date</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{formatDisplayDate(profile.joiningDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Teaching, Hostel or Accountant Duties */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                {(user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance'
                  ? 'Finance & Accounting Duties'
                  : (user?.role || '').toLowerCase().includes('warden')
                  ? 'Hostel Duties & Responsibilities'
                  : (user?.role || '').toLowerCase().includes('driver')
                  ? 'Transport Fleet & Transit Duties'
                  : (user?.role || '').toLowerCase().includes('librarian')
                  ? 'Library Administration Duties'
                  : 'Teaching Assignments'}
              </h2>
              <span className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                Active Academic Year
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Assigned Classes / Department */}
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' || (user?.role || '').toLowerCase().includes('librarian') || (user?.role || '').toLowerCase().includes('driver') ? 'DEPARTMENT' : 'ASSIGNED CLASSES'}
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' || (user?.role || '').toLowerCase().includes('librarian') || (user?.role || '').toLowerCase().includes('driver') ? (
                    <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                      {profile.department || 'Not Specified'}
                    </span>
                  ) : profile.assignedClasses && profile.assignedClasses.length > 0 ? (
                    profile.assignedClasses.map((cls, idx) => (
                      <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                        {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                      No Classes Assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Assigned Subjects / Duties */}
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' || (user?.role || '').toLowerCase().includes('librarian') || (user?.role || '').toLowerCase().includes('driver') ? 'CORE RESPONSIBILITIES' : 'ASSIGNED SUBJECTS'}
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {profile.assignedSubjects && profile.assignedSubjects.length > 0 ? (
                    profile.assignedSubjects.map((sbj, idx) => (
                      <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                        {sbj}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                      {isDriver ? 'No Specific Duties Assigned' : isWarden ? 'No Specific Duties Assigned' : isAccountant ? 'No Finance Duties Assigned' : isLibrarian ? 'No Library Duties Assigned' : 'No Subjects Assigned'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Qualifications & Background */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Qualifications & Background
              </h2>
              <button
                type="button"
                onClick={() => handleOpenEditModal(3)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  ACADEMIC QUALIFICATIONS
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs sm:text-sm border border-sky-200/70 dark:border-slate-700">
                  {profile.qualification || 'Not Specified'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  WORK EXPERIENCE
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs sm:text-sm border border-sky-200/70 dark:border-slate-700">
                  {profile.experience || 'Not Specified'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Employee Documents & Certifications Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-sky-300 dark:border-sky-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <UploadCloud className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Employee Documents & Certifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official identity verification, academic degrees, and institutional compliance records
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenEditModal(5)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Manage Documents</span>
          </button>
        </div>

        {staffMemberForEdit?.documents && staffMemberForEdit.documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {staffMemberForEdit.documents.map((doc: any, idx: number) => {
              const docName = doc.title || doc.name || doc.fileName || doc.documentType || doc.docType || 'Document';
              const docTypeStr = doc.docType || doc.type || doc.documentType || 'Official Record';
              const docUrl = resolveMediaUrl(doc.fileUrl || '');
              return (
                <div
                  key={doc.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-sky-300 dark:hover:border-sky-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={docName}>
                        {docName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-semibold text-sky-700 dark:text-sky-300">{docTypeStr}</span>
                        {doc.uploadedAt || doc.uploadDate ? (
                          <span>&bull; {formatDisplayDate(doc.uploadedAt || doc.uploadDate)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {docUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ name: docName, type: docTypeStr, url: docUrl })}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 transition shrink-0 cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                        On File
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setDocToDelete({ id: doc.id, index: idx, name: docName })}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shrink-0 cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-850/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 mx-auto flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">No institutional documents uploaded yet</h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Upload your Aadhaar Card, PAN Card, educational certificates, and experience documents to keep your profile verified.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEditModal(5)}
              className="mt-1 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Documents Now
            </button>
          </div>
        )}
      </div>

      {/* Official Institutional Letters & HR Documents Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-sky-300 dark:border-sky-800 space-y-4">
        <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Official Institutional Letters & HR Documents
            </h2>
          </div>
        </div>

        {/* HR Letter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Offer / Appointment Letter */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-sky-300 dark:border-sky-800 flex flex-col justify-between space-y-3 hover:shadow-md hover:border-sky-400 dark:hover:border-sky-700 transition-all">
            <div>
              <div className="flex items-center justify-between min-h-[36px]">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                {staffLetters.some(l => l.letterType === 'offer' && l.status === 'Issued') ? (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Issued
                  </span>
                ) : (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 inline-flex items-center justify-center shrink-0 leading-none">
                    Pending Issuance
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm mt-2.5">Appointment / Offer Letter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Institutional appointment contract with terms of service, compensation structure, and probation details.
              </p>
            </div>
            {staffLetters.some(l => l.letterType === 'offer' && l.status === 'Issued') ? (
              <button
                type="button"
                onClick={() => {
                  const existingOffer = staffLetters.find(l => l.letterType === 'offer' && l.status === 'Issued');
                  setSelectedLetterType('offer');
                  setSelectedLetterRecord(existingOffer);
                  setLetterModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Issued Appointment Letter
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-center text-xs font-medium">
                Issued Upon Admin Generation
              </div>
            )}
          </div>

          {/* Card 2: Relieving Letter */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-sky-300 dark:border-sky-800 flex flex-col justify-between space-y-3 hover:shadow-md hover:border-sky-400 dark:hover:border-sky-700 transition-all">
            <div>
              <div className="flex items-center justify-between min-h-[36px]">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                {staffLetters.some(l => l.letterType === 'relieving' && l.status === 'Issued') ? (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Issued
                  </span>
                ) : staffRequests.some(r => r.requestType === 'relieving' && r.status === 'Pending') ? (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-amber-300 text-amber-700 bg-amber-50/50 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Request Under Review
                  </span>
                ) : (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-slate-200 text-slate-600 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 inline-flex items-center justify-center shrink-0 leading-none">
                    On Separation / Request
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm mt-2.5">Relieving & Clearance Letter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Official relieving letter confirming formal clearance of institutional dues, assets, and service tenure.
              </p>
            </div>
            {staffLetters.some(l => l.letterType === 'relieving' && l.status === 'Issued') ? (
              <button
                type="button"
                onClick={() => {
                  const relRecord = staffLetters.find(l => l.letterType === 'relieving' && l.status === 'Issued');
                  setSelectedLetterType('relieving');
                  setSelectedLetterRecord(relRecord);
                  setLetterModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Relieving Letter
              </button>
            ) : staffRequests.some(r => r.requestType === 'relieving' && r.status === 'Pending') ? (
              <div className="space-y-1.5">
                <div className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Request Pending Approval
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenRequestModal('relieving')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Request Relieving Letter
              </button>
            )}
          </div>

          {/* Card 3: Experience / Service Certificate */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-sky-300 dark:border-sky-800 flex flex-col justify-between space-y-3 hover:shadow-md hover:border-sky-400 dark:hover:border-sky-700 transition-all">
            <div>
              <div className="flex items-center justify-between min-h-[36px]">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                {staffLetters.some(l => l.letterType === 'experience' && l.status === 'Issued') ? (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Formally Issued
                  </span>
                ) : staffRequests.some(r => r.requestType === 'experience' && r.status === 'Pending') ? (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-amber-300 text-amber-700 bg-amber-50/50 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Request Under Review
                  </span>
                ) : (
                  <span className="h-6 px-3 rounded-full text-[11px] font-bold border border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center shrink-0 leading-none">
                    Available on Request
                  </span>
                )}
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm mt-2.5">Experience Certificate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Institutional service testimonial verifying your designation, responsibilities, and tenure performance.
              </p>
            </div>
            {staffLetters.some(l => l.letterType === 'experience' && l.status === 'Issued') ? (
              <button
                type="button"
                onClick={() => {
                  const expRecord = staffLetters.find(l => l.letterType === 'experience' && l.status === 'Issued');
                  setSelectedLetterType('experience');
                  setSelectedLetterRecord(expRecord);
                  setLetterModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                View Issued Experience Certificate
              </button>
            ) : staffRequests.some(r => r.requestType === 'experience' && r.status === 'Pending') ? (
              <div className="space-y-1.5">
                <div className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Request Pending Approval
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenRequestModal('experience')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Request Experience Certificate
              </button>
            )}
          </div>
        </div>


      </div>

      {/* Staff ERP Full Modal (With Employment Details restricted to Admin only) */}
      <StaffFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          fetchProfileData();
        }}
        staffToEdit={staffMemberForEdit}
        defaultCategory={
          profile.category === 'Teacher' || profile.category === 'Teaching Staff' || (!isWarden && !isAccountant && !isLibrarian && !isDriver)
            ? 'Teaching Staff'
            : 'Non-Teaching Staff'
        }
        initialStep={editModalInitialStep === 2 ? 1 : editModalInitialStep}
        canEditEmployment={false}
      />

      {/* Submit Official Letter Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl text-white ${requestModalType === 'relieving' ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                  {requestModalType === 'relieving' ? <Send className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {requestModalType === 'relieving' ? 'Request Relieving Letter' : 'Request Experience Certificate'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official request will be submitted to Institutional HR & Administration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStaffRequest} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Applicant Details</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {profile.fullName || user?.name} ({profile.employeeId || 'Staff'})
                </p>
                <p className="text-[11px] text-slate-500">
                  {profile.designation} &bull; {profile.department} &bull; {profile.branch}
                </p>
              </div>

              {requestModalType === 'relieving' && (
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Proposed Relieving Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={requestRelievingDate}
                    onChange={(e) => setRequestRelievingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {requestModalType === 'relieving' ? 'Reason for Relieving' : 'Purpose of Experience Certificate'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={requestModalType === 'relieving' ? 'e.g. Relocation, Personal Reasons, Career Advancement' : 'e.g. Higher Education, Visa Application, New Job Verification'}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  Additional Notes / Comments
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional remarks, handover status, or urgent clearance notes..."
                  value={requestComments}
                  onChange={(e) => setRequestComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className={`px-5 py-2 rounded-xl text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 ${
                    requestModalType === 'relieving' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {requestSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {staffForLetter && (
        <StaffLetterModal
          staff={staffForLetter as any}
          isOpen={letterModalOpen}
          onClose={() => setLetterModalOpen(false)}
          initialType={selectedLetterType}
          existingRecord={selectedLetterRecord}
          readOnly={true}
        />
      )}

      {/* Custom Delete Document Confirmation Alert Modal */}
      {docToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Uploaded Document"
          subtitle="This action cannot be undone."
          variant="danger"
          confirmText="Yes, Delete Document"
          cancelLabel="Cancel"
          isLoading={isDeletingDoc}
          onCancel={() => setDocToDelete(null)}
          onConfirm={handleConfirmDeleteDoc}
          message={
            <div className="space-y-2.5">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 dark:text-white font-extrabold font-mono">
                  "{docToDelete.name}"
                </strong>{' '}
                from your employee file?
              </p>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs">
                ⚠️ This document will be unattached from your institutional records. You can upload a new copy at any time.
              </div>
            </div>
          }
        />
      )}

      {/* Document Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{viewingDoc.type}</h3>
                <p className="text-[10px] text-slate-400">{viewingDoc.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center min-h-[220px] max-h-[380px] overflow-auto">
              {viewingDoc.url && (
                viewingDoc.url.startsWith('data:image/') ||
                /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(viewingDoc.url) ||
                /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(viewingDoc.name)
              ) ? (
                <img 
                  src={viewingDoc.url} 
                  alt={viewingDoc.name} 
                  className="max-w-full max-h-[340px] object-contain rounded-lg shadow-sm"
                />
              ) : viewingDoc.url && (
                viewingDoc.url.startsWith('data:application/pdf') ||
                /\.pdf$/i.test(viewingDoc.name) ||
                /\.pdf$/i.test(viewingDoc.url)
              ) ? (
                <iframe
                  src={viewingDoc.url}
                  title={viewingDoc.name}
                  className="w-full h-[340px] rounded-lg border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center p-4">
                  <FileText className="w-12 h-12 text-sky-500 mx-auto mb-2" />
                  <p className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {viewingDoc.name}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Direct inline preview is not supported for this file type. You can download and view it.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <a
                href={viewingDoc.url}
                download={viewingDoc.name}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
              >
                Download Document
              </a>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
