import React, { useState, useEffect } from 'react';
import { X, Users, User, Briefcase, GraduationCap, CreditCard, FileText, Plus, Trash2, Info } from 'lucide-react';
import { Staff, StaffDocument, StaffDocType } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
  defaultCategory?: 'Teacher' | 'Staff';
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  defaultCategory = 'Teacher'
}) => {
  const { staff, addStaff, updateStaff, customRoles, subjects, academicClasses, departments } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'academic' | 'payroll' | 'documents'>('personal');

  const defaultRoles = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];
  const allRoles = Array.from(new Set([...defaultRoles, ...(customRoles || []).map(r => r.name)]));

  const teachingDesignations = [
    'Principal', 'Vice Principal', 'Academic Coordinator', 'Head of Department (HOD)',
    'Teacher', 'Class Teacher', 'Subject Teacher', 'Assistant Teacher',
    'Physical Education Teacher', 'Art Teacher', 'Music Teacher', 'Dance Teacher',
    'Computer Teacher', 'Librarian'
  ];

  const nonTeachingDesignations = [
    'Accountant', 'HR Executive', 'Office Administrator', 'Receptionist',
    'Transport Manager', 'Driver', 'Conductor / Bus Attendant', 'Hostel Warden',
    'Lab Assistant', 'IT Administrator', 'Security Guard', 'Office Assistant',
    'Housekeeping', 'Maintenance Staff', 'Store Keeper'
  ];

  // Department data called back from Subject Management module
  const activeDeptsFromSubjectMgmt = (departments || [])
    .filter(d => d.status === 'Active')
    .map(d => d.departmentName);

  const teachingDepartments = activeDeptsFromSubjectMgmt.length > 0
    ? Array.from(new Set(activeDeptsFromSubjectMgmt))
    : [
        'Mathematics', 'Science', 'English', 'Social Science', 'Languages',
        'Computer Science / ICT', 'Commerce', 'Humanities', 'Fine Arts', 'Performing Arts',
        'Physical Education', 'Library', 'Special Education', 'Pre-Primary'
      ];

  const nonTeachingDepartments = Array.from(new Set([
    'Administration', 'Finance', 'Human Resources', 'Transport',
    'Hostel', 'Information Technology (IT)', 'Library', 'Maintenance', 'Security',
    ...activeDeptsFromSubjectMgmt
  ]));

  const generateNextEmpId = () => {
    const empNumbers = staff
      .map(s => {
        const match = (s.empId || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const maxNum = empNumbers.length > 0 ? Math.max(...empNumbers) : 0;
    const nextNum = maxNum + 1;
    return `EMP${String(nextNum).padStart(3, '0')}`;
  };

  const [formData, setFormData] = useState<Partial<Staff>>({
    empId: '',
    employeeCategory: defaultCategory,
    firstName: '',
    lastName: '',
    designation: '',
    department: 'General',
    role: 'Teacher',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '15/05/1988',
    joiningDate: new Date().toISOString().split('T')[0],
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experienceYears: 5,
    salary: 6500,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    address: 'Faculty Quarters, NY',
    assignedClasses: [],
    assignedSubjects: [],
    documents: [],
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: 'Chase Bank',
      branch: 'Main City',
      ifscCode: 'CHAS001'
    },
    leaveBalance: { casual: 10, sick: 10, paid: 15 }
  });
  


  // State for adding a new document inline
  const [newDoc, setNewDoc] = useState<{ title: string; type: StaffDocType; fileUrl: string }>({
    title: '',
    type: 'Educational Certificates',
    fileUrl: '#'
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab('personal');
      if (staffToEdit) {
        setFormData({
          ...staffToEdit,
          employeeCategory: staffToEdit.employeeCategory || (staffToEdit.role === 'Teacher' ? 'Teacher' : 'Staff')
        });
      } else {
        const initialDept = defaultCategory === 'Teacher' ? (teachingDepartments[0] || 'Mathematics') : 'Administration';
        const deptMatchingSubs = subjects.filter(s => (s.department || '').trim().toLowerCase() === initialDept.toLowerCase());
        const initialPrimarySubject = deptMatchingSubs.length > 0 ? deptMatchingSubs[0].name : (subjects[0]?.name || 'Mathematics');

        setFormData({
          empId: generateNextEmpId(),
          employeeCategory: defaultCategory,
          firstName: '',
          lastName: '',
          designation: defaultCategory === 'Teacher' ? 'Subject Teacher' : 'Office Administrator',
          department: initialDept,
          role: defaultCategory === 'Teacher' ? 'Teacher' : 'Staff',
          email: '',
          phone: '',
          gender: 'Male',
          dob: '15/05/1988',
          joiningDate: new Date().toISOString().split('T')[0],
          qualification: defaultCategory === 'Teacher' ? 'M.Sc. Mathematics, B.Ed.' : 'Bachelor of Commerce',
          highestQualification: defaultCategory === 'Teacher' ? 'M.Sc. Mathematics, B.Ed.' : 'Bachelor of Commerce',
          specialization: defaultCategory === 'Teacher' ? 'Algebra & Calculus' : 'Finance & Accounting',
          primarySubject: defaultCategory === 'Teacher' ? initialPrimarySubject : undefined,
          secondarySubject: '', // Defaults to Select Subject
          isClassTeacherEligible: true,
          dailyWorkloadLimit: 5,
          weeklyWorkloadLimit: 24,
          experienceYears: 5,
          salary: defaultCategory === 'Teacher' ? 7000 : 5500,
          status: 'Active',
          avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
          address: 'Faculty Quarters, NY',
          assignedClasses: [],
          assignedSubjects: [],
          documents: [],
          bankDetails: {
            accountHolderName: '',
            accountNumber: '',
            bankName: 'Chase Bank',
            branch: 'Main City',
            ifscCode: 'CHAS001'
          },
          leaveBalance: { casual: 10, sick: 10, paid: 15 }
        });
      }
    }
  }, [isOpen, staffToEdit, staff, defaultCategory]);

  if (!isOpen) return null;

  const isTeacher = formData.employeeCategory === 'Teacher';

  const handleCategoryChange = (cat: 'Teacher' | 'Staff') => {
    setFormData(prev => ({
      ...prev,
      employeeCategory: cat,
      role: cat === 'Teacher' ? 'Teacher' : 'Staff',
      designation: cat === 'Teacher' ? 'Subject Teacher' : 'Accountant',
      department: cat === 'Teacher' ? 'Mathematics' : 'Administration'
    }));
  };

  const handleAddDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newDoc.title) {
      addToast('warning', 'Missing Title', 'Please enter a document title.');
      return;
    }
    const doc: StaffDocument = {
      id: 'DOC-' + Math.floor(100 + Math.random() * 900),
      title: newDoc.title,
      type: newDoc.type,
      fileUrl: newDoc.fileUrl || '#',
      uploadedDate: new Date().toISOString().split('T')[0]
    };
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), doc]
    }));
    setNewDoc({ title: '', type: 'Educational Certificates', fileUrl: '#' });
    addToast('success', 'Document Appended', 'Document successfully added to list.');
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== docId)
    }));
  };

  const handleClassCheckbox = (classSection: string) => {
    const current = formData.assignedClasses || [];
    if (current.includes(classSection)) {
      setFormData({
        ...formData,
        assignedClasses: current.filter(x => x !== classSection)
      });
    } else {
      setFormData({
        ...formData,
        assignedClasses: [...current, classSection]
      });
    }
  };

  const handleSubjectCheckbox = (subjName: string) => {
    const current = formData.assignedSubjects || [];
    if (current.includes(subjName)) {
      setFormData({
        ...formData,
        assignedSubjects: current.filter(x => x !== subjName)
      });
    } else {
      setFormData({
        ...formData,
        assignedSubjects: [...current, subjName]
      });
    }
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      addToast('warning', 'Missing Fields', 'First name, last name, and email are required.');
      return;
    }

    if (staffToEdit) {
      updateStaff(staffToEdit.id, formData);
      addToast('success', 'Profile Updated', `Updated record for ${formData.firstName} ${formData.lastName}`);
    } else {
      addStaff(formData as Omit<Staff, 'id'>);
      addToast('success', 'Employee Registered', `Hired ${formData.firstName} ${formData.lastName} (${formData.empId})`);
    }
    onClose();
  };

  // Derived subject options for Primary Subject (filtered by selected department in Professional Info)
  const currentDeptName = (formData.department || '').trim();
  const departmentSubjects = subjects.filter(s => 
    (s.department || '').trim().toLowerCase() === currentDeptName.toLowerCase()
  );
  const primarySubjectOptions = departmentSubjects.length > 0 ? departmentSubjects : subjects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {staffToEdit ? `Edit Profile: ${formData.firstName} ${formData.lastName}` : `Register New ${formData.employeeCategory}`}
              </h3>
              <p className="text-[11px] text-slate-500">Employee Contract Management & Profile Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800 py-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'personal'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Personal Info
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('professional')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'professional'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> {isTeacher ? 'Professional Info' : 'Employment Info'}
          </button>

          {isTeacher && (
            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeTab === 'academic'
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Academic Info
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'payroll'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payroll
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              activeTab === 'documents'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Documents ({formData.documents?.length || 0})
          </button>
        </div>

        {/* Tab Form Scroll Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 text-xs scrollbar-thin">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee Category *</label>
                  <select
                    value={formData.employeeCategory}
                    onChange={e => handleCategoryChange(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold text-emerald-600"
                  >
                    <option value="Teacher">Teaching Staff</option>
                    <option value="Staff">Non-Teaching Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee ID (Auto-Generated) *</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.empId}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border text-slate-500 font-mono font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name *</label>
                  <input type="text" required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input type="text" required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Mobile Phone *</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date of Birth *</label>
                  <input type="text" placeholder="e.g. 15/05/1988" required value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Avatar Image Link</label>
                  <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono text-[11px]" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Permanent Home Address</label>
                  <textarea value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border h-16 resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* PROFESSIONAL / EMPLOYMENT TAB */}
          {activeTab === 'professional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Job Title / Designation *</label>
                  <select
                    required
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
                  >
                    {(isTeacher ? teachingDesignations : nonTeachingDesignations).map(desig => (
                      <option key={desig} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={e => {
                      const newDept = e.target.value;
                      const deptMatchingSubs = subjects.filter(s => (s.department || '').trim().toLowerCase() === newDept.trim().toLowerCase());
                      const defaultPrimary = deptMatchingSubs.length > 0 ? deptMatchingSubs[0].name : (subjects[0]?.name || '');

                      setFormData(prev => {
                        const isCurrentPrimaryValid = deptMatchingSubs.some(s => s.name === prev.primarySubject);
                        return {
                          ...prev,
                          department: newDept,
                          primarySubject: isCurrentPrimaryValid ? prev.primarySubject : defaultPrimary
                        };
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
                  >
                    {(isTeacher ? teachingDepartments : nonTeachingDepartments).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">System Role Profile *</label>
                  <select
                    value={formData.role || 'Staff'}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    {allRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contract Joining Date *</label>
                  <input type="date" required value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Highest Qualifications *</label>
                  <input type="text" required value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Previous Experience (Years) *</label>
                  <input type="number" required min={0} value={formData.experienceYears || ''} onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">HR Status *</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TEACHING PROFILE TAB (Only for Teachers) */}
          {activeTab === 'academic' && isTeacher && (
            <div className="space-y-4">
              {/* Informational Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold text-xs">Permanent Teaching Profile & Capacity</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                    Class, Section, and Subject assignments are managed per Academic Year under <span className="font-extrabold underline">Academics → Class Management → Teacher Assignment</span>.
                  </p>
                </div>
              </div>

              {/* Qualifications & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Highest Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M.Sc. Mathematics, B.Ed."
                    value={formData.highestQualification || formData.qualification || ''}
                    onChange={e => setFormData({ ...formData, highestQualification: e.target.value, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Specialization / Expertise</label>
                  <input
                    type="text"
                    placeholder="e.g. Algebra & Calculus, Organic Chemistry"
                    value={formData.specialization || ''}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              {/* Teaching Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Primary Subject *</span>
                    {formData.department && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        {formData.department} Dept
                      </span>
                    )}
                  </label>
                  <select
                    required
                    value={formData.primarySubject || (primarySubjectOptions[0]?.name || '')}
                    onChange={e => setFormData({ ...formData, primarySubject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    {primarySubjectOptions.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {departmentSubjects.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                      No specific subjects created under '{formData.department}'. Displaying all subjects.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Secondary Subject</label>
                  <select
                    value={formData.secondarySubject || ''}
                    onChange={e => setFormData({ ...formData, secondarySubject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Class Teacher Eligible</label>
                  <select
                    value={formData.isClassTeacherEligible !== false ? 'Yes' : 'No'}
                    onChange={e => setFormData({ ...formData, isClassTeacherEligible: e.target.value === 'Yes' })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold"
                  >
                    <option value="Yes">Yes (Eligible)</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              {/* Workload Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border space-y-3">
                <h4 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">Workload Capacity Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Periods Per Day *</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={formData.dailyWorkloadLimit || 5}
                      onChange={e => setFormData({ ...formData, dailyWorkloadLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Periods Per Week *</label>
                    <input
                      type="number"
                      min={1}
                      max={45}
                      value={formData.weeklyWorkloadLimit || 24}
                      onChange={e => setFormData({ ...formData, weeklyWorkloadLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYROLL TAB */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contract Annual Salary (₹) *</label>
                  <input type="number" required value={formData.salary ? formData.salary * 12 : ''} onChange={e => setFormData({ ...formData, salary: Math.round(Number(e.target.value) / 12) })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountHolderName || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), accountHolderName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.bankName || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.accountNumber || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), accountNumber: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank Branch</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.branch || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), branch: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Bank IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.ifscCode || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), ifscCode: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">UPI ID / VPA</label>
                  <input
                    type="text"
                    placeholder="e.g. element@upi"
                    value={formData.bankDetails?.upiId || ''}
                    onChange={e => setFormData({
                      ...formData,
                      bankDetails: { ...(formData.bankDetails as any), upiId: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Document List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(formData.documents || []).length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No credentials or certificates uploaded.</p>
                ) : (
                  (formData.documents || []).map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">{doc.type} • Uploaded {doc.uploadedDate}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Inline Form to Add Document */}
              <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3.5 bg-slate-50/40">
                <h4 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">Add Credentials / Document</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Doc Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Master Degree Certificate"
                      value={newDoc.title}
                      onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Doc Category *</label>
                    <select
                      value={newDoc.type}
                      onChange={e => setNewDoc({ ...newDoc, type: e.target.value as StaffDocType })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer"
                    >
                      <option value="Educational Certificates">Educational Certificates</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Resume">Resume</option>
                      <option value="Experience Letter">Experience Letter</option>
                      <option value="Offer Letter">Offer Letter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center gap-1.5 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Attach Document
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls inside Form */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[10px] text-slate-400 italic">Tabs check: complete all sections before saving</span>
            <div className="flex gap-2.5">
              <button type="button" onClick={onClose} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">
                {staffToEdit ? 'Save Changes' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
export default StaffFormModal;
