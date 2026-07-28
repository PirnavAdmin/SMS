import React, { useState, useEffect, useRef } from 'react';
import { X, Users, User, Briefcase, GraduationCap, CreditCard, FileText, Plus, Trash2, Info, Upload, FileCheck, Eye, Paperclip, Building2, ShieldCheck, Tag, Download, ExternalLink, Shield } from 'lucide-react';
import { Staff, StaffDocument, StaffDocType } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { DocumentRequirementMasterModal } from './DocumentRequirementMasterModal';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
  defaultCategory?: 'Teacher' | 'Staff';
}

const initialDepartmentDesignations: Record<string, { name: string; defaultRole: string }[]> = {
  'Administration': [
    { name: 'Principal', defaultRole: 'Principal' },
    { name: 'Vice Principal', defaultRole: 'Admin' },
    { name: 'Office Administrator', defaultRole: 'Staff' },
    { name: 'Receptionist', defaultRole: 'Receptionist' },
    { name: 'Office Assistant', defaultRole: 'Staff' }
  ],
  'Finance & Accounts': [
    { name: 'Chief Accountant', defaultRole: 'Accountant' },
    { name: 'Accountant', defaultRole: 'Accountant' },
    { name: 'Billing Executive', defaultRole: 'Accountant' },
    { name: 'Cashier', defaultRole: 'Accountant' }
  ],
  'Finance': [
    { name: 'Chief Accountant', defaultRole: 'Accountant' },
    { name: 'Accountant', defaultRole: 'Accountant' },
    { name: 'Billing Executive', defaultRole: 'Accountant' }
  ],
  'Human Resources': [
    { name: 'HR Manager', defaultRole: 'HR' },
    { name: 'HR Executive', defaultRole: 'HR' },
    { name: 'Recruiter', defaultRole: 'HR' }
  ],
  'Transport': [
    { name: 'Transport Manager', defaultRole: 'Transport Manager' },
    { name: 'Driver', defaultRole: 'Driver' },
    { name: 'Bus Attendant', defaultRole: 'Bus Attendant' },
    { name: 'Mechanic', defaultRole: 'Staff' }
  ],
  'Hostel Management': [
    { name: 'Chief Warden', defaultRole: 'Hostel Warden' },
    { name: 'Hostel Warden', defaultRole: 'Hostel Warden' },
    { name: 'Assistant Warden', defaultRole: 'Hostel Warden' },
    { name: 'Hostel Supervisor', defaultRole: 'Staff' }
  ],
  'Hostel': [
    { name: 'Chief Warden', defaultRole: 'Hostel Warden' },
    { name: 'Hostel Warden', defaultRole: 'Hostel Warden' },
    { name: 'Assistant Warden', defaultRole: 'Hostel Warden' },
    { name: 'Hostel Supervisor', defaultRole: 'Staff' }
  ],
  'Library': [
    { name: 'Chief Librarian', defaultRole: 'Librarian' },
    { name: 'Librarian', defaultRole: 'Librarian' },
    { name: 'Assistant Librarian', defaultRole: 'Librarian' },
    { name: 'Library Attendant', defaultRole: 'Staff' }
  ],
  'Information Technology': [
    { name: 'IT Administrator', defaultRole: 'Admin' },
    { name: 'System Analyst', defaultRole: 'Staff' },
    { name: 'Network Engineer', defaultRole: 'Staff' },
    { name: 'Lab Technician', defaultRole: 'Staff' }
  ],
  'Mathematics': [
    { name: 'Head of Department (Mathematics)', defaultRole: 'Teacher' },
    { name: 'Senior Mathematics Teacher', defaultRole: 'Teacher' },
    { name: 'Mathematics Teacher', defaultRole: 'Teacher' },
    { name: 'Assistant Teacher', defaultRole: 'Teacher' }
  ],
  'Science': [
    { name: 'Head of Department (Science)', defaultRole: 'Teacher' },
    { name: 'Physics Teacher', defaultRole: 'Teacher' },
    { name: 'Chemistry Teacher', defaultRole: 'Teacher' },
    { name: 'Biology Teacher', defaultRole: 'Teacher' },
    { name: 'Lab Assistant', defaultRole: 'Staff' }
  ],
  'English': [
    { name: 'Head of Department (English)', defaultRole: 'Teacher' },
    { name: 'Senior English Teacher', defaultRole: 'Teacher' },
    { name: 'English Teacher', defaultRole: 'Teacher' }
  ],
  'Social Science': [
    { name: 'History Teacher', defaultRole: 'Teacher' },
    { name: 'Geography Teacher', defaultRole: 'Teacher' },
    { name: 'Civics Teacher', defaultRole: 'Teacher' }
  ],
  'Languages': [
    { name: 'Hindi Teacher', defaultRole: 'Teacher' },
    { name: 'Sanskrit Teacher', defaultRole: 'Teacher' },
    { name: 'Regional Language Teacher', defaultRole: 'Teacher' }
  ],
  'Computer Science / ICT': [
    { name: 'Computer Teacher', defaultRole: 'Teacher' },
    { name: 'ICT Instructor', defaultRole: 'Teacher' }
  ],
  'Commerce': [
    { name: 'Accountancy Teacher', defaultRole: 'Teacher' },
    { name: 'Business Studies Teacher', defaultRole: 'Teacher' },
    { name: 'Economics Teacher', defaultRole: 'Teacher' }
  ],
  'Humanities': [
    { name: 'Psychology Teacher', defaultRole: 'Teacher' },
    { name: 'Sociology Teacher', defaultRole: 'Teacher' },
    { name: 'Political Science Teacher', defaultRole: 'Teacher' }
  ],
  'Fine Arts': [
    { name: 'Art Teacher', defaultRole: 'Teacher' },
    { name: 'Craft Instructor', defaultRole: 'Teacher' }
  ],
  'Performing Arts': [
    { name: 'Music Teacher', defaultRole: 'Teacher' },
    { name: 'Dance Teacher', defaultRole: 'Teacher' }
  ],
  'Physical Education': [
    { name: 'Physical Education Teacher', defaultRole: 'Teacher' }
  ],
  'Pre-Primary': [
    { name: 'Pre-Primary Teacher', defaultRole: 'Teacher' }
  ]
};

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  defaultCategory = 'Teacher'
}) => {
  const { staff, addStaff, updateStaff, customRoles, subjects, academicClasses, departments, addDepartment, getRequiredDocuments } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'payroll' | 'documents'>('personal');

  const defaultRoles = [
    'Super Admin', 'Admin', 'Principal', 'HR', 'Accountant',
    'Teacher', 'Librarian', 'Transport Manager', 'Hostel Warden', 'Receptionist', 'Driver', 'Bus Attendant', 'Staff'
  ];
  const allRoles = Array.from(new Set([...defaultRoles, ...(customRoles || []).map(r => r.name)]));

  // Department & Designation Dynamic Master State
  const [deptDesignations, setDeptDesignations] = useState(initialDepartmentDesignations);
  const [customDepts, setCustomDepts] = useState<string[]>([]);

  // Sub-Modal State for + Add Department & + Add Designation
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isAddDesigModalOpen, setIsAddDesigModalOpen] = useState(false);
  const [isRuleMasterOpen, setIsRuleMasterOpen] = useState(false);

  const [newDeptForm, setNewDeptForm] = useState({ name: '', code: '', description: '', status: 'Active' as 'Active' | 'Inactive' });
  const [newDesigForm, setNewDesigForm] = useState({ name: '', code: '', description: '', defaultRole: 'Staff', status: 'Active' as 'Active' | 'Inactive' });

  // Additional Document Upload State
  const [isAddAdditionalOpen, setIsAddAdditionalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<StaffDocType>('Other');
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Postview Document Preview Modal State
  const [postviewDoc, setPostviewDoc] = useState<StaffDocument | null>(null);

  // File Input Refs for required documents
  const formFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Standard Departments List
  const baseDepartmentList = [
    'Administration', 'Finance & Accounts', 'Human Resources', 'Transport',
    'Hostel Management', 'Library', 'Information Technology', 'Laboratory', 'Maintenance',
    'Security', 'Medical', 'Housekeeping', 'Stores & Inventory', 'Admissions',
    'Facilities Management', 'Mathematics', 'Science', 'English', 'Social Science',
    'Languages', 'Computer Science / ICT', 'Commerce', 'Humanities', 'Fine Arts',
    'Performing Arts', 'Physical Education', 'Pre-Primary'
  ];

  const allAvailableDepartments = Array.from(new Set([
    ...baseDepartmentList,
    ...(departments || []).map(d => d.departmentName),
    ...customDepts
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
    department: '',
    role: 'Staff',
    email: '',
    phone: '',
    gender: 'Male',
    dob: '15/05/1988',
    joiningDate: new Date().toISOString().split('T')[0],
    qualification: 'Bachelor Degree',
    experienceYears: 3,
    salary: 6000,
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    address: 'Faculty Quarters',
    assignedClasses: [],
    assignedSubjects: [],
    documents: [],
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: 'City Bank',
      branch: 'Main Branch',
      ifscCode: 'CITI0001234',
      upiId: ''
    }
  });

  // Handle Department Change
  const handleDepartmentChange = (newDept: string) => {
    const desigList = deptDesignations[newDept] || [{ name: newDept + ' Staff', defaultRole: 'Staff' }];
    const firstDesig = desigList[0];
    const autoRole = firstDesig ? firstDesig.defaultRole : (formData.employeeCategory === 'Teacher' ? 'Teacher' : 'Staff');

    setFormData(prev => ({
      ...prev,
      department: newDept,
      designation: firstDesig ? firstDesig.name : '',
      role: autoRole
    }));
  };

  // Handle Designation Change
  const handleDesignationChange = (newDesigName: string) => {
    const desigList = formData.department ? deptDesignations[formData.department] || [] : [];
    const foundDesig = desigList.find(d => d.name === newDesigName);
    const autoRole = foundDesig ? foundDesig.defaultRole : (formData.employeeCategory === 'Teacher' ? 'Teacher' : 'Staff');

    setFormData(prev => ({
      ...prev,
      designation: newDesigName,
      role: autoRole
    }));
  };

  // Handle Add Department Modal Submission
  const handleSaveNewDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptForm.name.trim()) return;

    const deptName = newDeptForm.name.trim();
    addDepartment({
      departmentName: deptName,
      departmentCode: newDeptForm.code || deptName.toUpperCase().slice(0, 6),
      description: newDeptForm.description,
      status: newDeptForm.status
    });

    setCustomDepts(prev => [...prev, deptName]);
    const defaultDesigName = deptName + ' Executive';
    setDeptDesignations(prev => ({
      ...prev,
      [deptName]: [{ name: defaultDesigName, defaultRole: 'Staff' }]
    }));

    setFormData(prev => ({
      ...prev,
      department: deptName,
      designation: defaultDesigName,
      role: 'Staff'
    }));

    addToast('success', 'Department Created', `Department '${deptName}' created and auto-selected.`);
    setIsAddDeptModalOpen(false);
    setNewDeptForm({ name: '', code: '', description: '', status: 'Active' });
  };

  // Handle Add Designation Modal Submission
  const handleSaveNewDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    const currentDept = formData.department;
    if (!currentDept || !newDesigForm.name.trim()) return;

    const desigName = newDesigForm.name.trim();
    const defaultRole = newDesigForm.defaultRole || 'Staff';

    setDeptDesignations(prev => {
      const existing = prev[currentDept] || [];
      return {
        ...prev,
        [currentDept]: [...existing, { name: desigName, defaultRole }]
      };
    });

    setFormData(prev => ({
      ...prev,
      designation: desigName,
      role: defaultRole
    }));

    addToast('success', 'Designation Created', `Designation '${desigName}' created and auto-selected for ${currentDept}.`);
    setIsAddDesigModalOpen(false);
    setNewDesigForm({ name: '', code: '', description: '', defaultRole: 'Staff', status: 'Active' });
  };

  // Ref to prevent re-initializing form state while modal is open
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setActiveTab('personal');
      if (staffToEdit) {
        setFormData({
          ...staffToEdit,
          employeeCategory: staffToEdit.employeeCategory || (staffToEdit.role === 'Teacher' ? 'Teacher' : 'Staff')
        });
      } else {
        const initialDept = defaultCategory === 'Teacher' ? 'Mathematics' : 'Administration';
        const desigs = initialDepartmentDesignations[initialDept] || [{ name: 'Staff', defaultRole: 'Staff' }];
        const defaultDesig = desigs[0];

        setFormData({
          empId: generateNextEmpId(),
          employeeCategory: defaultCategory,
          firstName: '',
          lastName: '',
          department: initialDept,
          designation: defaultDesig ? defaultDesig.name : '',
          role: defaultDesig ? defaultDesig.defaultRole : (defaultCategory === 'Teacher' ? 'Teacher' : 'Staff'),
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
          address: 'Faculty Quarters',
          assignedClasses: [],
          assignedSubjects: [],
          documents: [],
          bankDetails: {
            accountHolderName: '',
            accountNumber: '',
            bankName: 'City Bank',
            branch: 'Main Branch',
            ifscCode: 'CITI0001234',
            upiId: ''
          }
        });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, staffToEdit, defaultCategory]);

  if (!isOpen) return null;

  // Direct File Selection for Required Document Checklist in Form
  const handleFormRequiredUpload = (docType: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const newDoc: StaffDocument = {
        id: 'DOC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: docType,
        type: docType as StaffDocType,
        fileUrl: fileUrl,
        uploadedDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'HR Admin',
        verificationStatus: 'Pending Verification',
        isRequired: true
      };
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []).filter(d => (d.type || d.title).toLowerCase() !== docType.toLowerCase()), newDoc]
      }));
      addToast('success', 'Document Attached', `'${docType}' attached successfully.`);
    };
    reader.readAsDataURL(file);
  };

  // Attach Custom Additional Document
  const handleAttachCustomDoc = () => {
    if (!customFile) {
      addToast('warning', 'File Required', 'Please select a document file.');
      return;
    }
    const titleToUse = customTitle.trim() || customFile.name;
    const reader = new FileReader();
    reader.onload = () => {
      const fileUrl = reader.result as string;
      const newDoc: StaffDocument = {
        id: 'DOC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: titleToUse,
        type: customCategory,
        fileUrl: fileUrl,
        uploadedDate: new Date().toISOString().split('T')[0],
        uploadedBy: 'HR Admin',
        verificationStatus: 'Pending Verification',
        isRequired: false
      };
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));
      addToast('success', 'Additional Document Attached', `'${titleToUse}' added to draft.`);
      setIsAddAdditionalOpen(false);
      setCustomTitle('');
      setCustomFile(null);
    };
    reader.readAsDataURL(customFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.department || !formData.designation) {
      addToast('warning', 'Missing Fields', 'Please complete all required employee details.');
      return;
    }

    const payload = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      role: formData.role || (formData.employeeCategory === 'Teacher' ? 'Teacher' : 'Staff')
    } as Omit<Staff, 'id'>;

    if (staffToEdit) {
      updateStaff(staffToEdit.id, payload);
      addToast('success', 'Staff Record Updated', `Saved changes for ${payload.firstName} ${payload.lastName}`);
    } else {
      addStaff(payload);
      addToast('success', 'Staff Registered', `Enrolled ${payload.firstName} ${payload.lastName} into Master ERP database.`);
    }

    onClose();
  };

  // Compute Required Documents checklist for chosen Department & Designation
  const formRequiredDocTypeList = getRequiredDocuments(formData.department, formData.designation);

  const additionalDocsInForm = (formData.documents || []).filter(d => 
    !formRequiredDocTypeList.some(req => (d.type || d.title).toLowerCase().includes(req.toLowerCase()))
  );

  const currentAvailableDesignations = formData.department
    ? deptDesignations[formData.department] || [{ name: formData.department + ' Staff', defaultRole: 'Staff' }]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              {staffToEdit ? 'Edit Staff Record' : 'Staff Registration'}
            </h3>
            <p className="text-xs text-slate-500">Single Source of Truth: Central staff entry point for all ERP modules</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'personal' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('professional')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'professional' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Employment Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'payroll' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payroll
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'documents' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Documents ({formData.documents?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2 pr-1 space-y-4 text-xs scrollbar-thin">
          
          {/* PERSONAL TAB */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee Category *</label>
                  <select
                    value={formData.employeeCategory}
                    onChange={e => setFormData({ ...formData, employeeCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border cursor-pointer font-bold text-sky-600"
                  >
                    <option value="Teacher">Teaching Staff</option>
                    <option value="Staff">Non-Teaching Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Employee ID (Auto-Generated Unique) *</label>
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
                  <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
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

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Residential Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter full residential address (House No., Street, City, Pincode)"
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>
            </div>
          )}

          {/* REDESIGNED EMPLOYMENT INFORMATION TAB */}
          {activeTab === 'professional' && (
            <div className="space-y-4">
              
              {/* STEP 1: DEPARTMENT WITH + ADD DEPARTMENT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-900 dark:text-white">Step 1: Department *</label>
                  <button
                    type="button"
                    onClick={() => setIsAddDeptModalOpen(true)}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Department
                  </button>
                </div>
                <select
                  required
                  value={formData.department || ''}
                  onChange={e => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sky-600 text-xs"
                >
                  <option value="">-- Select Department --</option>
                  {allAvailableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* STEP 2: DESIGNATION (DYNAMIC FILTERED BY DEPARTMENT) WITH + ADD DESIGNATION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-900 dark:text-white">
                    Step 2: Designation (Job Title) *
                  </label>
                  {formData.department && (
                    <button
                      type="button"
                      onClick={() => setIsAddDesigModalOpen(true)}
                      className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Designation
                    </button>
                  )}
                </div>
                <select
                  required
                  disabled={!formData.department}
                  value={formData.designation || ''}
                  onChange={e => handleDesignationChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs disabled:opacity-50 cursor-pointer"
                >
                  <option value="">-- Choose Designation --</option>
                  {currentAvailableDesignations.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* STEP 3: SYSTEM ROLE (AUTO SUGGESTED) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-900 dark:text-white">
                    Step 3: System Role (Auto Suggested) *
                  </label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Auto Suggested based on designation
                  </span>
                </div>
                <select
                  required
                  value={formData.role || 'Staff'}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-300 dark:border-sky-800/60 font-black text-sky-700 dark:text-sky-300 text-xs"
                >
                  {allRoles.map(roleName => (
                    <option key={roleName} value={roleName}>{roleName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Joining Date *</label>
                  <input type="date" required value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Qualification *</label>
                  <input type="text" required value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
                </div>
              </div>
            </div>
          )}

          {/* PAYROLL & BANK DETAILS TAB */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                    <CreditCard className="w-4 h-4 text-sky-600" /> Bank Account & Disbursement Information
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Used for direct salary credit & electronic transfers</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      placeholder="Full Name as on Bank Account"
                      value={formData.bankDetails?.accountHolderName || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: e.target.value,
                          accountNumber: formData.bankDetails?.accountNumber || '',
                          bankName: formData.bankDetails?.bankName || '',
                          branch: formData.bankDetails?.branch || '',
                          ifscCode: formData.bankDetails?.ifscCode || '',
                          upiId: formData.bankDetails?.upiId || ''
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210123"
                      value={formData.bankDetails?.accountNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: formData.bankDetails?.accountHolderName || '',
                          accountNumber: e.target.value,
                          bankName: formData.bankDetails?.bankName || '',
                          branch: formData.bankDetails?.branch || '',
                          ifscCode: formData.bankDetails?.ifscCode || '',
                          upiId: formData.bankDetails?.upiId || ''
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India, HDFC"
                      value={formData.bankDetails?.bankName || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: formData.bankDetails?.accountHolderName || '',
                          accountNumber: formData.bankDetails?.accountNumber || '',
                          bankName: e.target.value,
                          branch: formData.bankDetails?.branch || '',
                          ifscCode: formData.bankDetails?.ifscCode || '',
                          upiId: formData.bankDetails?.upiId || ''
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Branch, City Center"
                      value={formData.bankDetails?.branch || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: formData.bankDetails?.accountHolderName || '',
                          accountNumber: formData.bankDetails?.accountNumber || '',
                          bankName: formData.bankDetails?.bankName || '',
                          branch: e.target.value,
                          ifscCode: formData.bankDetails?.ifscCode || '',
                          upiId: formData.bankDetails?.upiId || ''
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={formData.bankDetails?.ifscCode || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: formData.bankDetails?.accountHolderName || '',
                          accountNumber: formData.bankDetails?.accountNumber || '',
                          bankName: formData.bankDetails?.bankName || '',
                          branch: formData.bankDetails?.branch || '',
                          ifscCode: e.target.value.toUpperCase(),
                          upiId: formData.bankDetails?.upiId || ''
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-mono text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. employee@upi"
                      value={formData.bankDetails?.upiId || ''}
                      onChange={e => setFormData({
                        ...formData,
                        bankDetails: {
                          accountHolderName: formData.bankDetails?.accountHolderName || '',
                          accountNumber: formData.bankDetails?.accountNumber || '',
                          bankName: formData.bankDetails?.bankName || '',
                          branch: formData.bankDetails?.branch || '',
                          ifscCode: formData.bankDetails?.ifscCode || '',
                          upiId: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC DOCUMENT UPLOAD TAB FOR EMPLOYEE REGISTRATION / EDIT */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              
              {/* Compliance Summary Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-slate-50 dark:from-sky-950/20 dark:to-slate-800/50 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Document Compliance Checklist
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Requirements dynamically generated for <strong className="text-slate-900 dark:text-white">{formData.department || 'Selected Department'}</strong> → <strong className="text-slate-900 dark:text-white">{formData.designation || 'Selected Designation'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-center">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Required Checklist</span>
                    <span className="font-black text-xs text-sky-600 dark:text-sky-400">
                      {formRequiredDocTypeList.filter(req => (formData.documents || []).some(d => (d.type || d.title).toLowerCase().includes(req.toLowerCase()))).length} / {formRequiredDocTypeList.length} Attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRuleMasterOpen(true)}
                    className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-xs"
                    title="Configure Document Rules Master"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DYNAMIC REQUIRED DOCUMENTS CHECKLIST CARDS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-sky-600" />
                    Required Credentials Checklist ({formRequiredDocTypeList.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Upload mandatory documents for this designation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formRequiredDocTypeList.map(reqType => {
                    const uploadedDoc = (formData.documents || []).find(d => 
                      (d.type || '').toLowerCase() === reqType.toLowerCase() || 
                      (d.title || '').toLowerCase() === reqType.toLowerCase() ||
                      (d.title || '').toLowerCase().includes(reqType.toLowerCase())
                    );

                    return (
                      <div key={reqType} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">{reqType}</h5>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">Required</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {uploadedDoc ? `Attached on ${uploadedDoc.uploadedDate}` : 'Mandatory credential file'}
                            </p>
                          </div>
                          {uploadedDoc ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200">
                              ✓ Attached
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                              Missing
                            </span>
                          )}
                        </div>

                        {uploadedDoc ? (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{uploadedDoc.title}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPostviewDoc(uploadedDoc)}
                                className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== uploadedDoc.id) }))}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                                title="Remove Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <input
                              type="file"
                              ref={el => { formFileInputRefs.current[reqType] = el; }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFormRequiredUpload(reqType, file);
                              }}
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => formFileInputRefs.current[reqType]?.click()}
                              className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" /> Upload {reqType}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ADDITIONAL DOCUMENTS SECTION */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold uppercase text-slate-500 text-[11px] tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-sky-600" />
                    Additional Documents (Optional)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddAdditionalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Additional Document
                  </button>
                </div>

                {isAddAdditionalOpen && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border space-y-3 animate-in fade-in">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">Attach Custom / Extra Document</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1">Document Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Police Clearance, Certificate of Merit"
                          value={customTitle}
                          onChange={e => setCustomTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Category</label>
                        <select
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value as StaffDocType)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold"
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Medical Certificate">Medical Certificate</option>
                          <option value="Police Verification">Police Verification</option>
                          <option value="Bank Passbook">Bank Passbook</option>
                          <option value="Degree Certificate">Degree Certificate</option>
                          <option value="Experience Letter">Experience Letter</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <input
                        type="file"
                        onChange={e => setCustomFile(e.target.files?.[0] || null)}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setIsAddAdditionalOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 font-semibold text-xs">Cancel</button>
                        <button type="button" onClick={handleAttachCustomDoc} className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md">Attach Document</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Attached List */}
                <div className="space-y-2">
                  {additionalDocsInForm.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed text-xs">
                      No extra non-required documents attached.
                    </div>
                  ) : (
                    additionalDocsInForm.map(doc => (
                      <div key={doc.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                            <p className="text-[10px] text-slate-400">{doc.type} • Uploaded {doc.uploadedDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={() => setPostviewDoc(doc)} className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50" title="Preview"><Eye className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== doc.id) }))} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <span className="text-[10px] text-slate-400 italic">Master Repository Entry</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-600/20 flex items-center gap-1">
                {staffToEdit ? 'Update Employee Record' : 'Complete Registration'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Inline Sub-Modal: + Add Department */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                Add New Department
              </h3>
              <button type="button" onClick={() => setIsAddDeptModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveNewDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics & AI, Hostel Management"
                  value={newDeptForm.name}
                  onChange={e => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Department Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. DEPT-ROB"
                  value={newDeptForm.code}
                  onChange={e => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddDeptModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-md">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Sub-Modal: + Add Designation */}
      {isAddDesigModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-sky-600" />
                Add Designation for {formData.department}
              </h3>
              <button type="button" onClick={() => setIsAddDesigModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveNewDesignation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Designation Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Warden, AI Instructor"
                  value={newDesigForm.name}
                  onChange={e => setNewDesigForm({ ...newDesigForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Default System Role *</label>
                <select
                  value={newDesigForm.defaultRole}
                  onChange={e => setNewDesigForm({ ...newDesigForm, defaultRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                >
                  {allRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddDesigModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-md">Create Designation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POSTVIEW PREVIEW MODAL FOR FORM */}
      {postviewDoc && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                {postviewDoc.title}
              </h3>
              <button type="button" onClick={() => setPostviewDoc(null)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[350px] flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border">
              {postviewDoc.fileUrl && postviewDoc.fileUrl.startsWith('data:image') ? (
                <img src={postviewDoc.fileUrl} alt={postviewDoc.title} className="max-h-[450px] object-contain rounded-lg shadow-md" />
              ) : postviewDoc.fileUrl && postviewDoc.fileUrl !== '#' ? (
                <iframe src={postviewDoc.fileUrl} title={postviewDoc.title} className="w-full h-[450px] rounded-lg border-0" />
              ) : (
                <div className="text-center py-12 text-slate-400">No preview stream available.</div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button type="button" onClick={() => setPostviewDoc(null)} className="px-4 py-2 font-bold bg-slate-800 text-white rounded-xl text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER DOCUMENT REQUIREMENT RULES MODAL */}
      <DocumentRequirementMasterModal
        isOpen={isRuleMasterOpen}
        onClose={() => setIsRuleMasterOpen(false)}
      />

    </div>
  );
};
export default StaffFormModal;
