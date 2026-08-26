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

    const isTeachingStaff = (s: any) => {
      if (!s) return false;
      const cat = (s.employeeCategory || s.category || '').toLowerCase();
      const des = (s.designation || '').toLowerCase();
      const dept = (s.department || '').toLowerCase();
      if (
        dept.includes('transport') || 
        dept.includes('hostel') || 
        dept.includes('security') || 
        dept.includes('maintenance') ||
        des.includes('driver') || 
        des.includes('attendant') || 
        des.includes('warden') || 
        des.includes('security') || 
        des.includes('peon') || 
        des.includes('sweeper') ||
        cat.includes('non-teaching')
      ) {
        return false;
      }
      return true;
    };

    const teachingStaff = staff.filter(isTeachingStaff);

    if (userEmail) {
      const byEmail = teachingStaff.find(s => s.email && s.email.toLowerCase().trim() === userEmail);
      if (byEmail) return byEmail;
    }

    if (userName) {
      const byName = teachingStaff.find(s => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        if (sFullName === userName || sName === userName) return true;
        if (userName.length > 5 && sFullName && sFullName.includes(userName)) return true;
        return false;
      });
      if (byName) return byName;
    }

    if (user?.id) {
      const byId = teachingStaff.find(s => s.id === user.id || s.empId === user.id);
      if (byId) return byId;
    }

    return teachingStaff[0] || null;
  }, [user, staff]);

  // Dynamically compute assigned classes (clean class name without section suffix)
  const dynamicAssignedClasses = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');
    
    // 1. From teacherAssignments (Admin side assignments)
    const fromAssignments = teacherAssignments
      .filter(ta => ta.teacherName?.toLowerCase().includes(teacherName.toLowerCase()) || (dbTeacher?.firstName && ta.teacherName?.toLowerCase().includes(dbTeacher.firstName.toLowerCase())))
      .map(ta => ta.className ? ta.className.split('-')[0].trim() : null);

    // 2. From timetable slots (Admin timetable published)
    const fromTimetable = timetable
      .filter(t => t.teacherName?.toLowerCase().includes(teacherName.toLowerCase()))
      .map(t => t.className ? t.className.split('-')[0].trim() : null);

    // 3. From staff record directly
    const fromStaff = (dbTeacher?.assignedClasses || []).map(ac => ac.split('-')[0].trim());

    const merged = Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean) as string[];
    return merged.length > 0 ? merged : ['Class 10', 'Class 9'];
  }, [dbTeacher, user, teacherAssignments, timetable]);

  // Dynamically compute assigned sections from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSections = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');

    const fromAssignments = teacherAssignments
      .filter(ta => ta.teacherName?.toLowerCase().includes(teacherName.toLowerCase()))
      .map(ta => ta.section ? (ta.section.startsWith('Section ') ? ta.section : `Section ${ta.section}`) : null);

    const fromTimetable = timetable
      .filter(t => t.teacherName?.toLowerCase().includes(teacherName.toLowerCase()))
      .map(t => t.section ? (t.section.startsWith('Section ') ? t.section : `Section ${t.section}`) : null);

    const merged = Array.from(new Set([...fromAssignments, ...fromTimetable])).filter(Boolean) as string[];
    return merged.length > 0 ? merged : ['Section A', 'Section B'];
  }, [dbTeacher, user, teacherAssignments, timetable]);

  // Dynamically compute assigned subjects from Admin teacherAssignments, timetable, and staff record
  const dynamicAssignedSubjects = useMemo(() => {
    const teacherName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : (user?.name || '');

    const fromAssignments = teacherAssignments
      .filter(ta => ta.teacherName?.toLowerCase().includes(teacherName.toLowerCase()))
      .map(ta => ta.subject);

    const fromTimetable = timetable
      .filter(t => t.teacherName?.toLowerCase().includes(teacherName.toLowerCase()))
      .map(t => t.subject);

    const fromStaff = dbTeacher?.assignedSubjects || [];

    const merged = Array.from(new Set([...fromStaff, ...fromAssignments, ...fromTimetable])).filter(Boolean);
    return merged.length > 0 ? merged : ['Mathematics', 'Advanced Algebra'];
  }, [dbTeacher, user, teacherAssignments, timetable]);

  // Local Storage state for Teacher self-edits
  const [localEdit, setLocalEdit] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('teacher_self_profile_edits');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // Reactive teacher profile construction merging Admin master data & teacher edits
  const profile = useMemo(() => {
    const dbFullName = dbTeacher ? `${dbTeacher.firstName || ''} ${dbTeacher.lastName || ''}`.trim() : '';
    const nameParts = (user?.name || 'Robert Teacher').split(' ');
    const defaultFullName = dbFullName || `${nameParts[0] || 'Robert'} ${nameParts.slice(1).join(' ') || 'Teacher'}`.trim();

    return {
      staffId: dbTeacher?.id || 'STF-2026-0001',
      employeeId: dbTeacher?.empId || dbTeacher?.employeeId || dbTeacher?.id || 'STF-2026-0001',
      fullName: localEdit?.fullName || defaultFullName,
      email: localEdit?.email || dbTeacher?.email || user?.email || 'teacher@pirnavschools.com',
      mobile: localEdit?.mobile || dbTeacher?.phone || '7987987998',
      gender: localEdit?.gender || dbTeacher?.gender || 'Male',
      dateOfBirth: localEdit?.dateOfBirth || dbTeacher?.dob || '1988-05-14',
      bloodGroup: localEdit?.bloodGroup || dbTeacher?.bloodGroup || 'O+',
      address: localEdit?.address || dbTeacher?.address || '45/2 Green Avenue, Campus Road',
      emergencyContact: localEdit?.emergencyContact || (dbTeacher as any)?.emergencyContact || '9876543210',
      branch: dbTeacher?.branch || 'Main Campus',
      department: dbTeacher?.department || 'Mathematics',
      designation: dbTeacher?.designation || 'PGT Teacher',
      joiningDate: dbTeacher?.joiningDate || '2026-08-19',
      qualification: localEdit?.qualification || (dbTeacher as any)?.qualification || dbTeacher?.highestQualification || 'M.Sc. Mathematics, B.Ed.',
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
      localStorage.setItem('teacher_self_profile_edits', JSON.stringify(updatedEdits));

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
      
      {/* Header Banner & Hero Card - Vibrant Pirnav Brand Sky Blue Theme */}
      <div className="relative bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/25 overflow-hidden border border-sky-400/30">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group shrink-0">
            <img
              src={activePhoto}
              alt={profile.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white/20 shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
              }}
            />
            <span className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profile.fullName}</h1>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-black uppercase border border-emerald-400/30 backdrop-blur-sm">
                {profile.employmentStatus || 'ACTIVE'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase border border-white/30 backdrop-blur-sm">
                {profile.profileStatus || 'COMPLETED'}
              </span>
            </div>

            <p className="text-sky-100 font-extrabold text-base sm:text-lg">
              {profile.designation} • <span className="text-white font-bold">{profile.department}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-sky-100/90 pt-1 font-semibold">
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xs">
                <Shield className="w-4 h-4 text-sky-200" />
                ID: {profile.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xs">
                <Building className="w-4 h-4 text-sky-200" />
                {profile.branch || 'Main Campus'}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3.5 py-1.5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xs">
                <Calendar className="w-4 h-4 text-sky-200" />
                Joined: {profile.joiningDate}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-sky-800 font-black rounded-2xl shadow-lg hover:shadow-xl transition transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Edit2 className="w-4 h-4 text-sky-600" />
            Edit My Profile
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal & Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <Phone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Contact Information
            </h2>

            <div className="space-y-3.5 text-xs">
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

          {/* Personal Details Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Personal Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
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
            </div>
          </div>
        </div>

        {/* Right Column: Professional & Assigned Workloads */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Teaching Assignments Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Teaching Assignments
              </h2>
              <span className="text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-extrabold px-3 py-1 rounded-full border border-sky-100 dark:border-sky-800">
                Active Academic Year
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Assigned Classes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  ASSIGNED CLASSES
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.assignedClasses.map((cls, idx) => (
                    <span key={idx} className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-extrabold px-3 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
                      {cls.split('-')[0].trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Sections */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  ASSIGNED SECTIONS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.assignedSections.map((sec, idx) => (
                    <span key={idx} className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-xs font-extrabold px-3 py-1 rounded-xl border border-purple-200 dark:border-purple-800">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assigned Subjects */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  ASSIGNED SUBJECTS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.assignedSubjects.map((sbj, idx) => (
                    <span key={idx} className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      {sbj}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Qualification & Experience Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              Qualifications & Background
            </h2>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  ACADEMIC QUALIFICATIONS
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs sm:text-sm border border-slate-200/60 dark:border-slate-800">
                  {profile.qualification}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                  WORK EXPERIENCE
                </span>
                <p className="text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-xs sm:text-sm border border-slate-200/60 dark:border-slate-800">
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
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Full Name <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Email Address <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-medium outline-none"
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
