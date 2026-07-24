import React, { useState, useEffect } from 'react';
import { X, Users, User, Briefcase, GraduationCap, CreditCard, FileText, Plus, Trash2 } from 'lucide-react';
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
  const { staff, addStaff, updateStaff, customRoles, subjects, academicClasses } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'academic' | 'payroll' | 'documents'>('personal');

  const defaultRoles = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist'
  ];
  const allRoles = Array.from(new Set([...defaultRoles, ...(customRoles || []).map(r => r.name)]));

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
        setFormData({
          empId: generateNextEmpId(),
          employeeCategory: defaultCategory,
          firstName: '',
          lastName: '',
          designation: defaultCategory === 'Teacher' ? 'Subject Teacher' : 'Administrative Officer',
          department: defaultCategory === 'Teacher' ? 'Academics' : 'General',
          role: defaultCategory === 'Teacher' ? 'Teacher' : 'Staff',
          email: '',
          phone: '',
          gender: 'Male',
          dob: '15/05/1988',
          joiningDate: new Date().toISOString().split('T')[0],
          qualification: defaultCategory === 'Teacher' ? 'M.Sc. Mathematics, B.Ed.' : 'Bachelor of Commerce',
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
      designation: cat === 'Teacher' ? 'Subject Teacher' : 'Administrative Officer',
      department: cat === 'Teacher' ? 'Academics' : 'General'
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
                    <option value="Teacher">Teacher (Teaching Staff)</option>
                    <option value="Staff">Staff (Support / General / Admin)</option>
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
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science HOD, Receptionist"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Administration"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  />
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

          {/* ACADEMIC INFO TAB (Only for Teachers) */}
          {activeTab === 'academic' && isTeacher && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider mb-2">Assigned Academic Classes & Sections</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                  {academicClasses.map(cls => (
                    <div key={cls.id} className="space-y-1">
                      <p className="font-bold text-[10px] text-slate-400 uppercase">{cls.name}</p>
                      <div className="flex flex-col gap-1.5">
                        {cls.sections.map(sec => {
                          const classSec = `${cls.name}-${sec}`;
                          const checked = (formData.assignedClasses || []).includes(classSec);
                          return (
                            <label key={sec} className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleClassCheckbox(classSec)}
                                className="rounded text-emerald-600 cursor-pointer"
                              />
                              <span>Section {sec}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider mb-2">Assigned Teaching Subjects</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                  {subjects.map(sub => {
                    const checked = (formData.assignedSubjects || []).includes(sub.name);
                    return (
                      <label key={sub.id} className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleSubjectCheckbox(sub.name)}
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                        <span>{sub.name}</span>
                      </label>
                    );
                  })}
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
