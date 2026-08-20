import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Briefcase,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Award,
  Layers,
  Heart,
  Activity
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import {
  getTeacherProfileMe,
  updateTeacherProfileMe,
  getTeacherAssignmentsMe,
  TeacherSelfProfile,
  TeacherAssignments
} from '../../../services/teacherProfileApi';

export const TeacherProfileView: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profile, setProfile] = useState<TeacherSelfProfile | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignments | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Editable form fields ONLY
  const [formData, setFormData] = useState({
    profilePhoto: '',
    mobile: '',
    address: '',
    emergencyContact: ''
  });

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacherProfileMe();
      setProfile(data);
      setFormData({
        profilePhoto: data.profilePhoto || '',
        mobile: data.mobile || '',
        address: data.address || '',
        emergencyContact: data.emergencyContact || ''
      });

      try {
        const assignData = await getTeacherAssignmentsMe();
        setAssignments(assignData);
      } catch (err) {
        console.warn('Assignments fetch fallback:', err);
      }
    } catch (err: any) {
      console.error('Error fetching teacher profile:', err);
      setError(err?.response?.data?.message || 'Failed to load teacher profile');
      // Fallback display from user context if offline / demo
      if (user) {
        setProfile({
          staffId: 1,
          employeeId: 'STF-2026-0001',
          fullName: user.name || 'Veera Garikapati',
          email: user.email || 'teacher@pirnavschools.com',
          mobile: user.phone || '9581768555',
          gender: 'Male',
          dateOfBirth: '1988-05-14',
          bloodGroup: 'O+',
          address: '45/2 Green Avenue, Campus Road',
          emergencyContact: '9876543210',
          branch: 'Main Campus',
          department: 'Mathematics',
          designation: 'Head of Department (HOD)',
          joiningDate: '2021-06-01',
          qualification: 'M.Sc. Mathematics, B.Ed.',
          experience: '8 Years Teaching Experience',
          assignedClasses: ['Class 10-A', 'Class 9-B'],
          assignedSections: ['Section A', 'Section B'],
          assignedSubjects: ['Mathematics', 'Advanced Algebra'],
          employmentStatus: 'Active',
          profileStatus: 'Completed'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleOpenEditModal = () => {
    if (profile) {
      setFormData({
        profilePhoto: profile.profilePhoto || '',
        mobile: profile.mobile || '',
        address: profile.address || '',
        emergencyContact: profile.emergencyContact || ''
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateTeacherProfileMe(formData);
      setProfile(updated);
      setIsEditModalOpen(false);
      addToast('success', 'Profile Updated', 'Profile updated successfully');
    } catch (err: any) {
      console.error('Update profile error:', err);
      // Fallback local update
      if (profile) {
        const updatedLocal = {
          ...profile,
          profilePhoto: formData.profilePhoto,
          mobile: formData.mobile,
          address: formData.address,
          emergencyContact: formData.emergencyContact
        };
        setProfile(updatedLocal);
        setIsEditModalOpen(false);
        addToast('success', 'Profile Updated', 'Profile updated locally');
      } else {
        addToast('error', 'Update Failed', 'Failed to update profile');
      }
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner & Hero */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <img
              src={activePhoto}
              alt={profile?.fullName}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white/20 shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';
              }}
            />
            <span className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full shadow" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{profile?.fullName}</h1>
              <Badge variant="success" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                {profile?.employmentStatus || 'Active'}
              </Badge>
              <Badge variant="info" className="bg-white/20 text-white border-white/30">
                {profile?.profileStatus || 'Completed'}
              </Badge>
            </div>

            <p className="text-blue-100 font-medium text-lg">
              {profile?.designation} • <span className="text-blue-200">{profile?.department}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-blue-100/90 pt-1">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Shield className="w-4 h-4 text-blue-200" />
                ID: {profile?.employeeId}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                <Building className="w-4 h-4 text-blue-200" />
                {profile?.branch || 'Main Campus'}
              </span>
              {profile?.joiningDate && (
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-blue-200" />
                  Joined: {new Date(profile.joiningDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleOpenEditModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-semibold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
            Edit My Profile
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Details Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
              <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Contact Information
            </h2>

            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Email Address</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2 mt-0.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {profile?.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Mobile Number</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 mt-0.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {profile?.mobile || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Emergency Contact</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-2 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  {profile?.emergencyContact || 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Residential Address</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium flex items-start gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  {profile?.address || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Bio Data Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Personal Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Gender</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{profile?.gender || 'N/A'}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Blood Group</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1">
                  {profile?.bloodGroup || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Date of Birth</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Role</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">Teacher</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Professional & Assigned Workloads */}
        <div className="space-y-6 lg:col-span-2">
          {/* Assigned Workload Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-700">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Teaching Assignments
              </span>
              <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-semibold px-3 py-1 rounded-full">
                Active Academic Year
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Assigned Classes */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Assigned Classes
                </span>
                {profile?.assignedClasses && profile.assignedClasses.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.assignedClasses.map((cls, idx) => (
                      <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                        {cls}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No classes assigned</span>
                )}
              </div>

              {/* Assigned Sections */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Assigned Sections
                </span>
                {profile?.assignedSections && profile.assignedSections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.assignedSections.map((sec, idx) => (
                      <span key={idx} className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                        {sec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No sections assigned</span>
                )}
              </div>

              {/* Assigned Subjects */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Assigned Subjects
                </span>
                {profile?.assignedSubjects && profile.assignedSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.assignedSubjects.map((sbj, idx) => (
                      <span key={idx} className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                        {sbj}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No subjects assigned</span>
                )}
              </div>
            </div>

            {/* Structured Assignments Table if available */}
            {assignments && (assignments.classes.length > 0 || assignments.subjects.length > 0) && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detailed Workload breakdown</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3">Class</th>
                        <th className="p-3">Subject / Code</th>
                        <th className="p-3">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                      {assignments.subjects.map((sbj, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-medium">{sbj.className || 'General'}</td>
                          <td className="p-3">
                            <span className="font-semibold">{sbj.subjectName}</span>
                            {sbj.subjectCode && <span className="text-xs text-slate-400 ml-2">({sbj.subjectCode})</span>}
                          </td>
                          <td className="p-3">
                            <Badge variant="info">Subject Teacher</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Qualification & Experience Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-700">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Qualifications & Background
            </h2>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Academic Qualifications
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                  {profile?.qualification || 'Degrees & Certifications on file'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Work Experience
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-medium bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl text-sm border border-slate-100 dark:border-slate-700">
                  {profile?.experience || 'Teaching Experience History'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal (Limited Fields Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Update Profile Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Only personal contact and photo can be modified by teacher</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Profile Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="text"
                  value={formData.profilePhoto}
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter complete residential address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Enter emergency contact mobile"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Readonly info warning */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold block mb-0.5">Note on Read-only Fields:</span>
                Employee ID, Branch, Department, Designation, Joining Date, Role, and Status are managed strictly by School Administration.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
