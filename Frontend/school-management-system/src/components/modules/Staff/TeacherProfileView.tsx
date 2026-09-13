// @ts-nocheck
import React, { useState, useMemo } from 'react';
import {
  User, Mail, Phone, Building, GraduationCap, Briefcase, MapPin, Calendar, 
  Shield, Edit2, X, Check, AlertCircle, BookOpen, Heart, Save, Camera, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { getSortOrderForClass } from '../../../utils/classSorter';

export const TeacherProfileView: React.FC = () => {
  const { user } = useAuth();
  const { staff = [], teacherAssignments = [], timetable = [], academicClasses = [], updateStaff } = useData();
  const { addToast } = useToast();

  const userRoleStr = (user?.role || '').toLowerCase().trim();
  const isWarden = userRoleStr.includes('warden');
  const isAccountant = userRoleStr.includes('accountant') || userRoleStr === 'finance';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchProfileData = () => window.location.reload();

  // Find logged in teacher/warden/staff from DataContext staff list matching email, name, or ID
  const dbTeacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();
    const userId = (user?.id || (user as any)?.empId || '').trim().toLowerCase();
    const userRoleStr = (user?.role || '').toLowerCase().trim();

    const isWarden = userRoleStr.includes('warden');
    const isAccountant = userRoleStr.includes('accountant') || userRoleStr === 'finance';

    // 1. Check exact email match across all staff
    if (userEmail) {
      const byEmail = staff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) {
        const isGenericName = (byEmail.firstName || '').toLowerCase().includes('administrator') || (byEmail.firstName || '').toLowerCase().includes('admin');
        const userFirst = userName ? userName.split(' ')[0] : '';
        const userLast = userName ? userName.split(' ').slice(1).join(' ') : '';
        return {
          ...byEmail,
          firstName: (isGenericName && userFirst) ? userFirst : (byEmail.firstName || userFirst || 'Sardhar'),
          lastName: (isGenericName && userLast) ? userLast : (byEmail.lastName || userLast || 'Karthi'),
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byEmail.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byEmail.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byEmail.role || 'Teacher'),
          empId: (isGenericName || byEmail.empId === '358' || byEmail.id === '358') ? (user?.id || (user as any)?.empId || (isAccountant ? 'ACT-101' : 'STF-001')) : (byEmail.empId || byEmail.employeeId || byEmail.id)
        };
      }
    }

    // 2. Check exact ID or Employee ID match
    if (userId) {
      const byId = staff.find(s =>
        (s.id && String(s.id).toLowerCase().trim() === userId) ||
        (s.empId && String(s.empId).toLowerCase().trim() === userId) ||
        (s.employeeId && String(s.employeeId).toLowerCase().trim() === userId)
      );
      if (byId) {
        return {
          ...byId,
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byId.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byId.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byId.role || 'Teacher')
        };
      }
    }

    // 3. Check name match
    if (userName && !userName.includes('admin')) {
      const byName = staff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        const uFirst = userName.split(' ')[0].toLowerCase();
        return (sFullName && sFullName === userName) || (sName && sName === userName) || (uFirst.length > 2 && sFullName.includes(uFirst));
      });
      if (byName) {
        return {
          ...byName,
          designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byName.designation || 'Teacher'),
          department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : (byName.department || 'Academics'),
          role: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : (byName.role || 'Teacher')
        };
      }
    }

    // 4. Role specific search if accountant or warden
    if (isAccountant) {
      const accountantStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('accountant') ||
        (s.role || '').toLowerCase().includes('accountant') ||
        (s.department || '').toLowerCase().includes('finance')
      );
      if (accountantStaff) return accountantStaff;
    }
    if (isWarden) {
      const wardenStaff = staff.find(s =>
        (s.designation || '').toLowerCase().includes('warden') ||
        (s.role || '').toLowerCase().includes('warden') ||
        (s.department || '').toLowerCase().includes('hostel')
      );
      if (wardenStaff) return wardenStaff;
    }

    // 5. Fallback: Return dynamic profile object from logged in user
    const rawName = user?.name || (isAccountant ? 'Sardhar Karthi' : isWarden ? (user?.name || user?.firstName || 'Hostel Warden') : 'Faculty Member');
    const nameParts = rawName.split(' ');
    return {
      id: user?.id || (user as any)?.empId || (isAccountant ? 'ACT-101' : isWarden ? 'WRD-102' : 'STF-001'),
      empId: (user as any)?.empId || user?.id || (isAccountant ? 'ACT-101' : isWarden ? 'WRD-102' : 'STF-001'),
      firstName: nameParts[0] || 'Faculty',
      lastName: nameParts.slice(1).join(' ') || 'Member',
      email: user?.email || (isAccountant ? 'sardhar@gmail.com' : isWarden ? 'warden@pirnavschools.edu' : 'faculty@pirnavschools.edu'),
      phone: user?.phone || '+91 9985852577',
      assignedClasses: [],
      assignedSections: [],
      assignedSubjects: [],
      department: isAccountant ? 'Finance & Accounts' : isWarden ? 'Hostel Management' : ((user as any)?.department || 'Academics'),
      designation: isAccountant ? 'Accountant' : isWarden ? 'Hostel Warden' : ((user as any)?.designation || 'Teacher'),
      qualification: (user as any)?.qualification || (isAccountant ? 'M.Com, Chartered Accountancy (CA Inter)' : isWarden ? 'Hostel Administration & Student Welfare' : 'Academic Qualification Completed'),
      experience: (user as any)?.experience || (isAccountant ? '7 Years Institutional Accounting & Audit Experience' : isWarden ? '5 Years Hostel Management Experience' : 'Teaching Experience'),
      branch: user?.branch || 'Main Campus',
      avatar: user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
    };
  }, [user, staff]);

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

    return cleaned.length > 0 ? cleaned : ['Class 9-A', 'Class 8-A', 'Class 10-A', 'Class 1-B'];
  }, [dbTeacher, user, teacherAssignments, timetable, academicClasses]);

  // Dynamically compute assigned sections from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSections = useMemo(() => {
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
  }, [dbTeacher, user, teacherAssignments, timetable]);

  // Dynamically compute assigned subjects from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSubjects = useMemo(() => {
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

    const fromStaff = (dbTeacher?.assignedSubjects || []).filter(s => s !== 'Mathematics');

    const merged = Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable]))
      .filter(Boolean)
      .filter(s => s !== 'Mathematics') as string[];

    if (fromStaff.length > 0) {
      return fromStaff;
    }

    const defaultSub = dbTeacher?.department || (dbTeacher as any)?.primarySubject || 'General';
    return merged.length > 0 ? merged : [defaultSub];
  }, [dbTeacher, user, teacherAssignments, timetable]);

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
      : (isAccountant ? 'Sardhar Karthi' : isWarden ? (user?.name || user?.firstName || 'Hostel Warden') : 'Faculty Member');

    const fallbackDept = isAccountant
      ? 'Finance & Accounts'
      : isWarden
      ? 'Hostel Management'
      : (dbTeacher?.department || (dbTeacher as any)?.primarySubject || 'Academics');

    const fallbackDesignation = isAccountant
      ? 'Accountant'
      : isWarden
      ? 'Hostel Warden'
      : (dbTeacher?.designation && !dbTeacher.designation.toLowerCase().includes('administrator') ? dbTeacher.designation : 'Teacher');

    const fallbackRole = isAccountant
      ? 'Accountant'
      : isWarden
      ? 'Hostel Warden'
      : (dbTeacher?.role || fallbackDesignation);

    return {
      staffId: (user as any)?.empId || user?.id || (dbTeacher?.id && String(dbTeacher.id) !== '358' ? dbTeacher.id : (isAccountant ? 'ACT-101' : isWarden ? 'WRD-102' : 'STF-2026-0009')),
      employeeId: (user as any)?.empId || user?.id || (dbTeacher?.empId && String(dbTeacher.empId) !== '358' ? dbTeacher.empId : (isAccountant ? 'ACT-101' : isWarden ? 'WRD-102' : 'STF-2026-0009')),
      fullName: localEdit?.fullName || defaultFullName,
      email: localEdit?.email || user?.email || dbTeacher?.email || (isAccountant ? 'sardhar@gmail.com' : isWarden ? 'warden@pirnavschools.edu' : 'faculty@pirnavschools.edu'),
      mobile: localEdit?.mobile || user?.phone || dbTeacher?.phone || '+91 9985852577',
      gender: localEdit?.gender || dbTeacher?.gender || 'Male',
      dateOfBirth: localEdit?.dateOfBirth || dbTeacher?.dob || '1990-05-15',
      bloodGroup: localEdit?.bloodGroup || dbTeacher?.bloodGroup || 'O+',
      address: localEdit?.address || dbTeacher?.address || 'Kondapur, Main Campus Quarter 4B',
      emergencyContact: localEdit?.emergencyContact || (dbTeacher as any)?.emergencyContact || '+91 9876543210',
      branch: dbTeacher?.branch || user?.branch || 'Main Campus',
      department: fallbackDept,
      designation: fallbackDesignation,
      role: fallbackRole,
      joiningDate: dbTeacher?.joiningDate || '2026-08-26',
      qualification: localEdit?.qualification || (dbTeacher as any)?.qualification || dbTeacher?.highestQualification || (isAccountant ? 'M.Com, Chartered Accountancy (CA Inter)' : isWarden ? 'Post Graduate Diploma in Hostel Administration' : 'Academic Qualification Completed'),
      experience: localEdit?.experience || (dbTeacher as any)?.experience || (isAccountant ? '7 Years Institutional Accounting & Audit Experience' : isWarden ? '5 Years Hostel Management Experience' : '8 Years Teaching Experience'),
      assignedClasses: dynamicAssignedClasses,
      assignedSections: dynamicAssignedSections,
      assignedSubjects: isAccountant ? ['Fee Management', 'Financial Auditing'] : isWarden ? ['Hostel Administration', 'Student Welfare'] : dynamicAssignedSubjects,
      employmentStatus: dbTeacher?.status || 'Active',
      profileStatus: 'Completed',
      profilePhoto: localEdit?.profilePhoto || dbTeacher?.avatar || user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'
    };
  }, [dbTeacher, user, dynamicAssignedClasses, dynamicAssignedSections, dynamicAssignedSubjects, localEdit]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    email: profile.email,
    profilePhoto: profile.profilePhoto,
    mobile: profile.mobile,
    emergencyContact: profile.emergencyContact,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    qualification: profile.qualification,
    experience: profile.experience
  });

  const handleOpenEditModal = () => {
    setFormData({
      fullName: profile.fullName,
      email: profile.email,
      profilePhoto: profile.profilePhoto,
      mobile: profile.mobile,
      emergencyContact: profile.emergencyContact,
      gender: profile.gender,
      bloodGroup: profile.bloodGroup,
      dateOfBirth: profile.dateOfBirth,
      address: profile.address,
      qualification: profile.qualification,
      experience: profile.experience
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updatedEdits = {
        fullName: formData.fullName,
        email: formData.email,
        profilePhoto: formData.profilePhoto,
        mobile: formData.mobile,
        emergencyContact: formData.emergencyContact,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        qualification: formData.qualification,
        experience: formData.experience
      };

      setLocalEdit(updatedEdits);
      localStorage.setItem(userStorageKey, JSON.stringify(updatedEdits));

      // Sync directly to DataContext staff store if staff record exists
      if (dbTeacher && dbTeacher.id && updateStaff) {
        const nameParts = formData.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        updateStaff(dbTeacher.id, {
          firstName: firstName,
          lastName: lastName,
          email: formData.email,
          phone: formData.mobile,
          gender: formData.gender,
          dob: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup,
          address: formData.address,
          avatar: formData.profilePhoto,
          qualification: formData.qualification,
          experience: formData.experience,
          emergencyContact: formData.emergencyContact
        } as any);
      }

      setIsEditModalOpen(false);
      addToast('success', 'Profile Updated', 'Teacher profile details saved and synced with Admin Database!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      addToast('error', 'Update Failed', 'Unable to save profile changes.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const activePhoto = profile?.profilePhoto || user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner & Hero Card - Compact Vibrant Pirnav Brand Sky Blue Theme */}
      <div className="relative bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-sky-500/15 overflow-hidden border border-sky-400/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group shrink-0">
            <img
              src={activePhoto}
              alt={profile.fullName}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-3 border-white/20 shadow-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
              }}
            />
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full shadow" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{profile.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10px] font-black uppercase border border-emerald-400/30 backdrop-blur-sm">
                {profile.employmentStatus || 'ACTIVE'}
              </span>
              {classTeacherInfo.isClassTeacher && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-100 text-[10px] font-black uppercase border border-amber-300/50 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                  🏷️ Class Teacher ({classTeacherInfo.className})
                </span>
              )}
            </div>

            <p className="text-sky-100 font-extrabold text-xs sm:text-sm">
              {profile.designation}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-sky-100/90 pt-0.5 font-semibold">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-sky-200" />
                ID: {profile.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-sky-200" />
                Joined: {profile.joiningDate}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-sky-800 font-black rounded-xl text-xs shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer whitespace-nowrap self-center sm:self-start"
          >
            <Edit2 className="w-3.5 h-3.5 text-sky-600" />
            Edit My Profile
          </button>
        </div>
      </div>

      {/* Main Grid Content: 2x2 Equal-Sized Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Contact Information */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <Phone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Contact Information
            </h2>

            <div className="space-y-3.5 text-xs mt-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Email Address</span>
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  {profile.email}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Mobile Number</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  {profile.mobile}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Emergency Contact</span>
                <span className="text-slate-900 dark:text-white font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {profile.emergencyContact}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Residential Address</span>
                <span className="text-slate-900 dark:text-white font-medium flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  {profile.address}
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
                <span className="text-slate-900 dark:text-white font-bold">{profile.gender}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Blood Group</span>
                <span className="text-slate-900 dark:text-white font-bold">{profile.bloodGroup}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Date of Birth</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{profile.dateOfBirth}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Role</span>
                <span className="text-slate-900 dark:text-white font-bold">{profile.designation}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Employee ID</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{profile.employeeId}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Joined Date</span>
                <span className="text-slate-900 dark:text-white font-bold font-mono">{profile.joiningDate}</span>
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
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' ? 'DEPARTMENT' : 'ASSIGNED CLASSES'}
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' ? (
                    <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                      {profile.department}
                    </span>
                  ) : (
                    profile.assignedClasses.map((cls, idx) => (
                      <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                        {cls}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Assigned Subjects / Duties */}
              <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  {(user?.role || '').toLowerCase().includes('warden') || (user?.role || '').toLowerCase().includes('accountant') || (user?.role || '').toLowerCase() === 'finance' ? 'CORE RESPONSIBILITIES' : 'ASSIGNED SUBJECTS'}
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {profile.assignedSubjects.map((sbj, idx) => (
                    <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                      {sbj}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Qualifications & Background */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Qualifications & Background
            </h2>

            <div className="space-y-3 mt-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  ACADEMIC QUALIFICATIONS
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs sm:text-sm border border-sky-200/70 dark:border-slate-700">
                  {profile.qualification}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  WORK EXPERIENCE
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-xs sm:text-sm border border-sky-200/70 dark:border-slate-700">
                  {profile.experience}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Edit My Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-xl w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-600" /> Edit {isWarden ? 'Warden' : isAccountant ? 'Accountant' : (dbTeacher?.designation || 'Teacher')} Profile
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[10px] text-slate-400 font-semibold">🔒 Official Record</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.fullName}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-slate-400 font-semibold">🔒 Login Identity</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 font-medium outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Profile Photo URL</label>
                <input
                  type="text"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Emergency Contact <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Academic Qualifications</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="M.Sc. Mathematics, B.Ed."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Work Experience</label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="8 Years Teaching Experience"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Residential Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-medium outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
