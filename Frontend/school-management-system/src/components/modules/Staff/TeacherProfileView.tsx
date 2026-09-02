import React, { useState, useMemo } from 'react';
import {
  User, Mail, Phone, Building, GraduationCap, Briefcase, MapPin, Calendar, 
  Shield, Edit2, X, Check, AlertCircle, BookOpen, Heart, Save, Camera, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';

export const TeacherProfileView: React.FC = () => {
  const { user } = useAuth();
  const { staff = [], teacherAssignments = [], timetable = [], updateStaff } = useData();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find logged in teacher from DataContext staff list matching email, name, or ID
  const dbTeacher = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    // Filter staff to teaching & academic faculty ONLY (exclude drivers, peons, conductors, security guards)
    const teachingStaff = staff.filter(s => {
      const desig = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      if (desig.includes('driver') || desig.includes('conductor') || desig.includes('peon') || desig.includes('cleaner') || desig.includes('guard') || dept.includes('transport')) {
        return false;
      }
      return true;
    });

    if (userEmail) {
      const byEmail = teachingStaff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    const userId = (user?.id || (user as any)?.empId || '').trim();
    if (userId) {
      const byId = teachingStaff.find(s => s.id === userId || s.empId === userId);
      if (byId) return byId;
    }

    if (userName && !userName.includes('admin') && !userName.includes('driver')) {
      const byName = teachingStaff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        const uFirst = userName.split(' ')[0];
        return (sFullName && sFullName === userName) || (sName && sName === userName) || (uFirst.length > 2 && sFullName.includes(uFirst));
      });
      if (byName) return byName;
    }

    const firstStaff = teachingStaff[0];
    const rawName = user?.name || (firstStaff ? `${firstStaff.firstName} ${firstStaff.lastName}` : 'Faculty Member');
    const nameParts = rawName.split(' ');
    return firstStaff || {
      id: user?.id || (user as any)?.empId || 'STF-001',
      empId: (user as any)?.empId || user?.id || 'STF-001',
      firstName: nameParts[0] || 'Faculty',
      lastName: nameParts.slice(1).join(' ') || 'Member',
      assignedClasses: [],
      assignedSections: [],
      assignedSubjects: [],
      department: (user as any)?.department || 'Academics',
      designation: (user as any)?.designation || 'Teacher',
      qualification: (user as any)?.qualification || 'Academic Qualification Completed',
      experience: (user as any)?.experience || 'Teaching Experience'
    };
  }, [user, staff]);

  // Dynamically compute Class Teacher assignment details
  const classTeacherInfo = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    const tFirstName = (dbTeacher?.firstName || '').toLowerCase().trim();
    const tId = dbTeacher?.id || dbTeacher?.empId;

    // Check teacherAssignments for role === 'Class Teacher' or isClassTeacher === true
    const ctAssignment = teacherAssignments.find(ta => {
      if (!ta) return false;
      const taName = (ta.teacherName || '').toLowerCase();
      const matchName = (teacherName && taName.includes(teacherName.toLowerCase())) || (tFirstName && taName.includes(tFirstName));
      const matchId = tId && (String(ta.teacherId) === String(tId));
      const isCT = ta.role === 'Class Teacher' || ta.isClassTeacher === true || ta.designation?.includes('Class Teacher');
      return (matchName || matchId) && isCT;
    });

    if (ctAssignment) {
      const clsName = ctAssignment.className ? (ctAssignment.className.startsWith('Class ') ? ctAssignment.className : `Class ${ctAssignment.className}`) : '';
      return { isClassTeacher: true, className: clsName, section: ctAssignment.section || '' };
    }

    // Check staff record fields (isClassTeacher, classTeacherFor, designation)
    const isStaffCT = dbTeacher?.isClassTeacher === true || (dbTeacher?.designation || '').toLowerCase().includes('class teacher');
    if (isStaffCT) {
      const assignedCls = (dbTeacher?.assignedClasses && dbTeacher.assignedClasses[0]) ? dbTeacher.assignedClasses[0] : '';
      const parts = assignedCls.split('-');
      return { isClassTeacher: true, className: assignedCls ? (assignedCls.startsWith('Class ') ? assignedCls : `Class ${assignedCls}`) : '', section: parts[1] || '' };
    }

    return { isClassTeacher: false, className: '', section: '' };
  }, [dbTeacher, user, teacherAssignments]);

  // Dynamically compute assigned classes (clean class name without section suffix)
  const dynamicAssignedClasses = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    const tFirstName = (dbTeacher?.firstName || '').toLowerCase().trim();

    const fromAssignments = teacherAssignments
      .filter(ta => {
        const taName = (ta.teacherName || '').toLowerCase();
        return (teacherName && taName.includes(teacherName.toLowerCase())) || (tFirstName && taName.includes(tFirstName));
      })
      .map(ta => ta.className ? (ta.className.startsWith('Class ') ? ta.className.split('-')[0].trim() : `Class ${ta.className.split('-')[0].trim()}`) : null);

    const fromTimetable = timetable
      .filter(t => {
        const tName = (t.teacherName || '').toLowerCase();
        return (teacherName && tName.includes(teacherName.toLowerCase())) || (tFirstName && tName.includes(tFirstName));
      })
      .map(t => t.className ? (t.className.startsWith('Class ') ? t.className.split('-')[0].trim() : `Class ${t.className.split('-')[0].trim()}`) : null);

    const fromStaff = (dbTeacher?.assignedClasses || []).map(ac => {
      const cls = ac.split('-')[0].trim();
      return cls.startsWith('Class ') ? cls : `Class ${cls}`;
    });

    return Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean).filter((c: any) => !c.toLowerCase().includes('nursery') && !c.toLowerCase().includes('lkg') && !c.toLowerCase().includes('ukg')) as string[];
  }, [dbTeacher, user, teacherAssignments, timetable]);

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

    const fromStaff = dbTeacher?.assignedSubjects || [];

    const merged = Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean) as string[];

    if (fromStaff.length > 0) {
      return fromStaff;
    }

    const defaultSub = dbTeacher?.department || (dbTeacher as any)?.primarySubject || 'Mathematics';
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

  // Reactive teacher profile construction merging Admin master data & teacher edits
  const profile = useMemo(() => {
    const dbFullName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : '';
    const nameParts = (user?.name || 'Faculty Member').split(' ');
    const defaultFullName = dbFullName || `${nameParts[0] || 'Faculty'} ${nameParts.slice(1).join(' ') || 'Member'}`.trim();
    const fallbackDept = dbTeacher?.department || (dbTeacher as any)?.primarySubject || 'Mathematics';

    return {
      staffId: dbTeacher?.id || (user as any)?.empId || user?.id || 'STF-2026-0009',
      employeeId: dbTeacher?.empId || dbTeacher?.employeeId || dbTeacher?.id || 'STF-2026-0009',
      fullName: localEdit?.fullName || defaultFullName,
      email: localEdit?.email || dbTeacher?.email || user?.email || 'suryatejakola12@gmail.com',
      mobile: localEdit?.mobile || dbTeacher?.phone || '98765432197',
      gender: localEdit?.gender || dbTeacher?.gender || 'Male',
      dateOfBirth: localEdit?.dateOfBirth || dbTeacher?.dob || '2002-09-12',
      bloodGroup: localEdit?.bloodGroup || dbTeacher?.bloodGroup || 'A+',
      address: localEdit?.address || dbTeacher?.address || '128-23-12, Gokul nagar, shankar colony',
      emergencyContact: localEdit?.emergencyContact || (dbTeacher as any)?.emergencyContact || '9876543210',
      branch: dbTeacher?.branch || 'Main Campus',
      department: fallbackDept,
      designation: dbTeacher?.designation || 'Teacher',
      joiningDate: dbTeacher?.joiningDate || '2026-08-26',
      qualification: localEdit?.qualification || (dbTeacher as any)?.qualification || dbTeacher?.highestQualification || 'Academic Qualification Completed',
      experience: localEdit?.experience || (dbTeacher as any)?.experience || '8 Years Teaching Experience',
      assignedClasses: dynamicAssignedClasses,
      assignedSections: dynamicAssignedSections,
      assignedSubjects: dynamicAssignedSubjects,
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
                <span className="text-slate-900 dark:text-white font-bold">Teacher</span>
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

        {/* Card 3: Teaching Assignments */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-sky-200 dark:border-slate-700/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Teaching Assignments
              </h2>
              <span className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                Active Academic Year
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Assigned Classes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  ASSIGNED CLASSES
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {profile.assignedClasses.map((cls, idx) => (
                    <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                      {cls.split('-')[0].trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Sections */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  ASSIGNED SECTIONS
                </span>
                <div className="flex flex-wrap justify-center items-center gap-1.5 w-full">
                  {profile.assignedSections.map((sec, idx) => (
                    <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 text-center">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Subjects */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-sky-200/70 dark:border-slate-700 space-y-2 flex flex-col items-center text-center h-full">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center w-full">
                  ASSIGNED SUBJECTS
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
                  <Edit2 className="w-4 h-4 text-sky-600" /> Edit Teacher Profile
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Update personal details, contact info, qualifications, and profile picture</p>
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
