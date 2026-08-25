import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import {
  BasicStaffFormState,
  branchOptions,
  staffTypeOptions,
  getDepartmentOptions,
  getDepartmentSelectOptions,
  getDesignationOptions,
  getEmployeeCategoryLabel,
  normalizeStaffType,
  StaffType,
  StaffQualificationItem,
  StaffExperienceItem,
  StaffUploadedDocItem,
  calculateExperienceYearsMonths
} from './staffFlowOptions';
import {
  User, Briefcase, GraduationCap, Award, Upload, Plus, Trash2, Edit2, CheckCircle2,
  FileText, Eye, Download, RefreshCw, X, ShieldCheck, MapPin, Building2, Check, UploadCloud, ChevronDown, AlertCircle, Search
} from 'lucide-react';

import { DateInput } from '../../common/DateInput';
import { SearchableSelect } from '../../common/SearchableSelect';
import { lookupPostalCode, getOfflinePostalInfo } from '../../../utils/postalLookup';

interface BasicStaffFormFieldsProps {
  value: BasicStaffFormState;
  errors?: Record<string, string>;
  onChange: (field: keyof BasicStaffFormState, value: any) => void;
  onCategoryChange: (value: StaffType | string) => void;
  employeeIdReadOnly?: boolean;
  compact?: boolean;
  isSubmitting?: boolean;
  onCancel?: () => void;
  staffToEdit?: any;
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium';

export const BasicStaffFormFields: React.FC<BasicStaffFormFieldsProps> = ({
  value,
  errors: parentErrors = {},
  onChange: parentOnChange,
  onCategoryChange,
  employeeIdReadOnly = true,
  compact = false,
  isSubmitting = false,
  onCancel,
  staffToEdit
}) => {
  const { departments = [], designations = [], staff = [], academicClasses = [], subjects = [] } = useData();
  const normalizedCategory = normalizeStaffType(value.employeeCategory);

  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const errors = { ...parentErrors, ...localErrors };

  const onChange = (field: keyof BasicStaffFormState, val: any) => {
    parentOnChange(field, val);
    setLocalErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};
    const require = (key: string, condition: boolean, message: string) => {
      if (!condition) stepErrors[key] = message;
    };

    if (step === 1) {
      require("employeeCategory", !!value.employeeCategory, "Staff Type is required.");
      require("firstName", !!value.firstName.trim(), "First name is required.");
      require("lastName", !!value.lastName.trim(), "Last name is required.");
      require("gender", !!value.gender, "Gender is required.");
      require("dob", !!value.dob.trim(), "Date of Birth is required.");
      require("bloodGroup", !!value.bloodGroup, "Blood Group is required.");
      require("mobileNumber", !!value.mobileNumber.trim(), "Mobile number is required.");
      if (value.mobileNumber.trim()) {
        const localPart = value.mobileNumber.split("-").pop() || "";
        if (!/^\d{10}$/.test(localPart.replace(/[^\d]/g, ""))) {
          stepErrors.mobileNumber = "Mobile number must be exactly 10 digits.";
        }
      }
      require("presentAddress", !!value.presentAddress.trim(), "Present Address is required.");
      if (!value.sameAsPresentAddress) {
        require("permanentAddress", !!value.permanentAddress.trim(), "Permanent Address is required.");
      }
      require("city", !!value.city.trim(), "City is required.");
      require("state", !!value.state.trim(), "State is required.");
      require("pinCode", !!value.pinCode.trim(), "PIN Code is required.");
      require("country", !!value.country.trim(), "Country is required.");
      if (value.pinCode.trim() && !/^\d{6}$/.test(value.pinCode.trim())) {
        stepErrors.pinCode = "PIN Code must be exactly 6 digits.";
      }
      require("aadhaarNumber", !!value.aadhaarNumber?.trim(), "Aadhaar Number is required.");
      if (value.aadhaarNumber?.trim() && !/^\d{12}$/.test(value.aadhaarNumber.trim())) {
        stepErrors.aadhaarNumber = "Aadhaar Number must be exactly 12 digits.";
      }
      require("panNumber", !!value.panNumber?.trim(), "PAN Number is required.");
      if (value.panNumber?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.panNumber.trim().toUpperCase())) {
        stepErrors.panNumber = "Invalid PAN Number format (e.g. ABCDE1234F).";
      }
      require("email", !!value.email.trim(), "Email address is required.");
      if (value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
        stepErrors.email = "Invalid email format.";
      }
    } else if (step === 2) {
      require("branch", !!value.branch.trim(), "Branch is required.");
      require("department", !!value.department.trim(), "Department is required.");
      require("designation", !!value.designation.trim(), "Designation is required.");
      require("joiningDate", !!value.joiningDate.trim(), "Joining date is required.");
      require("employmentType", !!value.employmentType.trim(), "Employment type is required.");
      require("status", !!value.status.trim(), "Status is required.");
    }

    setLocalErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const parsePhone = (phoneStr: string = '') => {
    const clean = phoneStr.trim();
    const codes = ['+91', '+971', '+44', '+61', '+1'];
    for (const code of codes) {
      if (clean.startsWith(code)) {
        let local = clean.slice(code.length);
        if (local.startsWith('-')) local = local.slice(1);
        return { countryCode: code, localNumber: local.replace(/[^0-9]/g, '').slice(0, 10) };
      }
    }
    return { countryCode: '+91', localNumber: clean.replace(/[^0-9]/g, '').slice(0, 10) };
  };

  const { countryCode: primaryCc, localNumber: primaryLocal } = parsePhone(value.mobileNumber);
  const { countryCode: altCc, localNumber: altLocal } = parsePhone(value.alternateMobileNumber || '');

  const handleMobileChange = (field: 'mobileNumber' | 'alternateMobileNumber', val: string) => {
    const numericVal = val.replace(/[^0-9]/g, '').slice(0, 10);
    const cc = field === 'mobileNumber' ? primaryCc : altCc;
    onChange(field, `${cc}-${numericVal}`);
  };

  const handlePinCodeChange = async (val: string) => {
    const cleanPin = val.replace(/[^0-9]/g, '').slice(0, 6);
    onChange('pinCode', cleanPin);

    if (cleanPin.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (response.ok) {
          const resData = await response.json();
          if (resData && resData[0] && resData[0].Status === "Success") {
            const postOffice = resData[0].PostOffice[0];
            if (postOffice) {
              onChange('city', postOffice.District || postOffice.Name || '');
              onChange('state', postOffice.State || '');
            }
          }
        }
      } catch (err) {
        console.error("Error fetching PIN code details:", err);
      }
    }
  };

  const allClassSectionOptions = React.useMemo(() => {
    return academicClasses.flatMap(cls => 
      (cls.sections || []).map(sec => `${cls.name}-${sec}`)
    );
  }, [academicClasses]);

  const allSubjectOptions = React.useMemo(() => {
    let filtered = subjects;
    if (value.department) {
      filtered = subjects.filter(s => 
        s.department?.trim().toLowerCase() === value.department.trim().toLowerCase()
      );
    }
    const names = filtered.map(s => s.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [subjects, value.department]);

  const duplicateTeacher = React.useMemo(() => {
    if (normalizedCategory !== 'Teaching Staff' || !value.designation || !value.assignedSubjects || value.assignedSubjects.length === 0) {
      return null;
    }
    
    const match = (staff || []).find(s => {
      if (s.id === staffToEdit?.id) return false;
      const category = s.employeeCategory || s.role || '';
      const isTeachingStaff = category === 'Teacher' || category === 'Teaching Staff';
      if (!isTeachingStaff) return false;
      
      if (s.designation?.trim().toLowerCase() !== value.designation.trim().toLowerCase()) return false;
      
      const otherSubjects = s.assignedSubjects || [];
      const hasCommonSubject = (value.assignedSubjects || []).some((subj: string) => 
        otherSubjects.some((os: string) => os.trim().toLowerCase() === subj.trim().toLowerCase())
      );
      
      return hasCommonSubject;
    });

    if (match) {
      const commonSubjects = (value.assignedSubjects || []).filter((subj: string) =>
        (match.assignedSubjects || []).some((os: string) => os.trim().toLowerCase() === subj.trim().toLowerCase())
      );
      return {
        teacherName: match.name || `${match.firstName} ${match.lastName}`,
        designation: match.designation,
        subjects: commonSubjects
      };
    }
    
    return null;
  }, [staff, value.designation, value.assignedSubjects, staffToEdit, normalizedCategory]);

  const [classSearch, setClassSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  const filteredClassSectionOptions = React.useMemo(() => {
    return allClassSectionOptions.filter(clsSec => 
      clsSec.toLowerCase().includes(classSearch.toLowerCase())
    );
  }, [allClassSectionOptions, classSearch]);

  const filteredSubjectOptions = React.useMemo(() => {
    return allSubjectOptions.filter(subj => 
      subj.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [allSubjectOptions, subjectSearch]);

  // Stepper state (Step 1 to Step 5)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Qualification inline form state
  const [isAddingQual, setIsAddingQual] = useState(false);
  const [editingQualId, setEditingQualId] = useState<string | null>(null);
  const [qualForm, setQualForm] = useState<StaffQualificationItem>({
    id: '',
    qualification: '',
    specialization: '',
    institution: '',
    boardUniversity: '',
    passingYear: '',
    percentageCgpa: ''
  });

  // Experience inline form state
  const [isAddingExp, setIsAddingExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<StaffExperienceItem>({
    id: '',
    previousOrganization: '',
    designation: '',
    fromDate: '',
    toDate: '',
    totalExperience: '0 Years 0 Months',
    reasonForLeaving: ''
  });

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<StaffUploadedDocItem | null>(null);

  const departmentSelectOptions = React.useMemo(() => {
    return getDepartmentSelectOptions(normalizedCategory, departments);
  }, [normalizedCategory, departments]);

  const designationOptions = React.useMemo(() => {
    return getDesignationOptions(normalizedCategory, value.department, designations);
  }, [normalizedCategory, value.department, designations]);

  // Dynamic Department change handler
  const handleDepartmentChange = (dept: string) => {
    onChange('department', dept);
    const validDesignations = getDesignationOptions(normalizedCategory, dept, designations);
    if (value.designation && !validDesignations.includes(value.designation)) {
      onChange('designation', '');
    }
  };

  // Dynamic Staff Type change handler
  const handleStaffTypeSelect = (staffType: string) => {
    onCategoryChange(staffType);
  };

  // Same as Present Address handler
  const handleSameAddressToggle = (checked: boolean) => {
    onChange('sameAsPresentAddress', checked);
    if (checked) {
      onChange('permanentAddress', value.presentAddress);
    }
  };

  // Qualification Handlers
  const handleSaveQualification = () => {
    if (!qualForm.qualification.trim()) return;
    const newQual: StaffQualificationItem = {
      ...qualForm,
      id: editingQualId || `QUAL-${Date.now()}`
    };

    let updatedList: StaffQualificationItem[];
    if (editingQualId) {
      updatedList = value.qualifications.map(q => (q.id === editingQualId ? newQual : q));
    } else {
      updatedList = [...value.qualifications, newQual];
    }

    onChange('qualifications', updatedList);
    setIsAddingQual(false);
    setEditingQualId(null);
    setQualForm({
      id: '',
      qualification: '',
      specialization: '',
      institution: '',
      boardUniversity: '',
      passingYear: '',
      percentageCgpa: ''
    });
  };

  const handleDeleteQualification = (id: string) => {
    onChange('qualifications', value.qualifications.filter(q => q.id !== id));
  };

  // Experience Handlers
  const handleSaveExperience = () => {
    if (!expForm.previousOrganization.trim()) return;
    const computedExp = calculateExperienceYearsMonths(expForm.fromDate, expForm.toDate);
    const newExp: StaffExperienceItem = {
      ...expForm,
      totalExperience: computedExp,
      id: editingExpId || `EXP-${Date.now()}`
    };

    let updatedList: StaffExperienceItem[];
    if (editingExpId) {
      updatedList = value.experiences.map(e => (e.id === editingExpId ? newExp : e));
    } else {
      updatedList = [...value.experiences, newExp];
    }

    onChange('experiences', updatedList);
    setIsAddingExp(false);
    setEditingExpId(null);
    setExpForm({
      id: '',
      previousOrganization: '',
      designation: '',
      fromDate: '',
      toDate: '',
      totalExperience: '0 Years 0 Months',
      reasonForLeaving: ''
    });
  };

  const handleDeleteExperience = (id: string) => {
    onChange('experiences', value.experiences.filter(e => e.id !== id));
  };

  // Document Upload Handler
  const handleDocumentFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc: StaffUploadedDocItem = {
        id: `DOC-${Date.now()}`,
        docType,
        fileName: file.name,
        fileUrl: reader.result as string,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString()
      };

      // Remove existing doc of same type if present
      const filteredDocs = value.documents.filter(d => d.docType !== docType);
      onChange('documents', [...filteredDocs, newDoc]);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (docId: string) => {
    onChange('documents', value.documents.filter(d => d.id !== docId));
  };

  // Default Standard Document Slots
  const STANDARD_DOC_TYPES = [
    'Passport Size Photo',
    'Aadhaar Card',
    'PAN Card',
    'Educational Certificates',
    'Experience Certificates',
    'Resume',
    'Appointment Letter',
    'Joining Letter',
    'Signature'
  ];

  const steps = [
    { number: 1, title: '1. Basic Information', icon: User },
    { number: 2, title: '2. Employment Details', icon: Briefcase },
    { number: 3, title: '3. Qualification', icon: GraduationCap },
    { number: 4, title: '4. Experience', icon: Award },
    { number: 5, title: '5. Upload Documents', icon: Upload }
  ];

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200 text-xs">
      
      {/* ----------------- STEPPER NAVIGATION TABS ----------------- */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {steps.map(step => {
            const Icon = step.icon;
            const isActive = activeStep === step.number;
            const isCompleted = activeStep > step.number;
            return (
              <button
                type="button"
                key={step.number}
                onClick={() => {
                  if (step.number < activeStep) {
                    setActiveStep(step.number);
                  } else {
                    let isValid = true;
                    for (let s = activeStep; s < step.number; s++) {
                      if (!validateStep(s)) {
                        isValid = false;
                        break;
                      }
                    }
                    if (isValid) {
                      setActiveStep(step.number);
                    }
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate text-[11px]">{step.title}</span>
                {isCompleted && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: BASIC INFORMATION                         */}
      {/* ---------------------------------------------------- */}
      {activeStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Personal Information Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <User className="w-4 h-4 text-brand-600" />
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Staff Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={value.employeeCategory || ''}
                    onChange={e => handleStaffTypeSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10"
                  >
                    <option value="Teaching Staff">Teaching Staff</option>
                    <option value="Non-Teaching Staff">Non-Teaching Staff</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.employeeCategory && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.employeeCategory}</p>}
              </div>

              {/* First Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.firstName}
                  onChange={e => onChange('firstName', e.target.value)}
                  className={fieldClass}
                />
                {errors.firstName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.lastName}
                  onChange={e => onChange('lastName', e.target.value)}
                  className={fieldClass}
                />
                {errors.lastName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.lastName}</p>}
              </div>

              {/* Middle Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Middle Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={value.middleName || ''}
                  onChange={e => onChange('middleName', e.target.value)}
                  className={fieldClass}
                />
              </div>

              {/* Staff ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff ID <span className="text-slate-400 text-[10px]">(Auto Generated)</span>
                </label>
                <input
                  type="text"
                  value={value.empId}
                  readOnly={employeeIdReadOnly}
                  className={`${fieldClass} bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono font-bold cursor-not-allowed`}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={value.gender || ''}
                    onChange={e => onChange('gender', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.gender && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.gender}</p>}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <DateInput value={value.dob || ''} onChange={e => onChange('dob', e.target.value)} className={fieldClass} />
                {errors.dob && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.dob}</p>}
              </div>

              {/* Blood Group */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Blood Group <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={value.bloodGroup || ''}
                    onChange={e => onChange('bloodGroup', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.bloodGroup && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.bloodGroup}</p>}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative shrink-0 w-24">
                    <select
                      value={primaryCc}
                      onChange={e => onChange('mobileNumber', `${e.target.value}-${primaryLocal}`)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-3.5 pr-8 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    value={primaryLocal}
                    onChange={e => handleMobileChange('mobileNumber', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium"
                    placeholder="10-digit number"
                  />
                </div>
                {errors.mobileNumber && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.mobileNumber}</p>}
              </div>

              {/* Alternate Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alternate Mobile Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative shrink-0 w-24">
                    <select
                      value={altCc}
                      onChange={e => onChange('alternateMobileNumber', `${e.target.value}-${altLocal}`)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-3.5 pr-8 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    value={altLocal}
                    onChange={e => handleMobileChange('alternateMobileNumber', e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium"
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={value.email}
                  onChange={e => onChange('email', e.target.value)}
                  className={fieldClass}
                />
                {errors.email && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.email}</p>}
              </div>

              {/* Staff Photo Upload */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Profile Photo</label>
                <div className="relative">
                  {value.photoUrl ? (
                    <div className="flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <img
                          src={value.photoUrl}
                          alt="Staff Preview"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Photo selected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange('photoUrl', '')}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                      <span>Choose File</span>
                      <Upload className="w-4 h-4 text-slate-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              onChange('photoUrl', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Details Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Identity Details</h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Aadhaar Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.aadhaarNumber || ''}
                  onChange={e => onChange('aadhaarNumber', e.target.value)}
                  className={`${fieldClass} font-mono`}
                  placeholder="Enter 12-digit Aadhaar"
                />
                {errors.aadhaarNumber && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.aadhaarNumber}</p>}
              </div>

              {/* PAN Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  PAN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.panNumber || ''}
                  onChange={e => onChange('panNumber', e.target.value.toUpperCase())}
                  className={`${fieldClass} font-mono uppercase`}
                  placeholder="Enter 10-char PAN"
                />
                {errors.panNumber && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.panNumber}</p>}
              </div>
            </div>
          </div>

          {/* Address Details Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Address Details</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-brand-600">
                <input
                  type="checkbox"
                  checked={value.sameAsPresentAddress || false}
                  onChange={e => handleSameAddressToggle(e.target.checked)}
                  className="rounded text-brand-600"
                />
                Same as Present Address
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Present Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={value.presentAddress || ''}
                  onChange={e => onChange('presentAddress', e.target.value)}
                  className={fieldClass}
                  placeholder="Enter present address"
                />
                {errors.presentAddress && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.presentAddress}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Permanent Address {!value.sameAsPresentAddress && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={value.permanentAddress || ''}
                  onChange={e => onChange('permanentAddress', e.target.value)}
                  className={fieldClass}
                  disabled={value.sameAsPresentAddress}
                  placeholder="Enter permanent address"
                />
                {errors.permanentAddress && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.permanentAddress}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.state || ''}
                  onChange={e => onChange('state', e.target.value)}
                  className={fieldClass}
                  placeholder="Enter state"
                />
                {errors.state && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.state}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.city || ''}
                  onChange={e => onChange('city', e.target.value)}
                  className={fieldClass}
                  placeholder="Enter city"
                />
                {errors.city && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.city}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">PIN Code</label>
                <input
                  type="text"
                  placeholder="e.g. 560001"
                  value={value.pinCode || ''}
                  onChange={e => {
                    const pin = e.target.value;
                    onChange('pinCode', pin);
                    if (!pin.trim()) {
                      onChange('city', '');
                      onChange('state', '');
                      return;
                    }
                    const offline = getOfflinePostalInfo(pin);
                    if (offline) {
                      onChange('city', offline.city);
                      onChange('state', offline.state);
                    }
                    if (pin.replace(/\D/g, '').length >= 4) {
                      lookupPostalCode(pin).then(info => {
                        if (info) {
                          onChange('city', info.city);
                          onChange('state', info.state);
                        }
                      });
                    }
                  }}
                  className={`${fieldClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Country <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={value.country || ''}
                    onChange={e => onChange('country', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10"
                  >
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Australia">Australia</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.country && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.country}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: EMPLOYMENT DETAILS                        */}
      {/* ---------------------------------------------------- */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Briefcase className="w-4 h-4 text-brand-600" />
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Employment Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Branch / Campus */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Branch / Campus <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select value={value.branch} onChange={e => onChange('branch', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10">
                    {branchOptions.map(branch => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.branch && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.branch}</p>}
              </div>

              {/* Department (Dynamic Searchable Dropdown with Code & 5 Visible Items) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Department <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={departmentSelectOptions}
                    value={value.department}
                    onChange={handleDepartmentChange}
                    placeholder={value.employeeCategory ? `Select ${value.employeeCategory} Department` : 'Select Staff Type First'}
                    searchPlaceholder="Search department or code..."
                    disabled={!value.employeeCategory}
                    error={errors.department}
                  />
                </div>
              </div>

              {/* Designation (Dynamic Searchable Dropdown with 5 Visible Items) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={designationOptions}
                    value={value.designation}
                    onChange={val => onChange('designation', val)}
                    placeholder={
                      !value.employeeCategory
                        ? 'Select Staff Type First'
                        : !value.department
                        ? 'Select Department First'
                        : `Select Designation for ${value.department}`
                    }
                    searchPlaceholder="Search designation..."
                    disabled={!value.employeeCategory || !value.department}
                    error={errors.designation}
                  />
                </div>
              </div>

              {/* Employment Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select value={value.employmentType || ''} onChange={e => onChange('employmentType', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10">
                    <option value="">Select Employment Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.employmentType && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.employmentType}</p>}
              </div>

              {/* Date of Joining */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date of Joining <span className="text-rose-500">*</span>
                </label>
                <DateInput value={value.joiningDate || ''} onChange={e => onChange('joiningDate', e.target.value)} className={fieldClass} />
                {errors.joiningDate && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.joiningDate}</p>}
              </div>

              {/* Reporting Manager */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reporting Manager <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={value.reportingManager || ''}
                  onChange={e => onChange('reportingManager', e.target.value)}
                  className={fieldClass}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <select value={value.status || ''} onChange={e => onChange('status', e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer pr-10">
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Retired">Retired</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.status && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.status}</p>}
              </div>
            </div>

            {normalizedCategory === 'Teaching Staff' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <h4 className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-wider mb-3">
                  Academic Allocations
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assigned Classes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Assigned Classes <span className="text-slate-400 font-normal">(Select all that apply)</span>
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search class sections..."
                        value={classSearch}
                        onChange={e => setClassSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 text-[11px] font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
                      />
                      {classSearch && (
                        <button
                          type="button"
                          onClick={() => setClassSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2">
                      {filteredClassSectionOptions.length === 0 ? (
                        <p className="text-slate-400 italic text-[11px] text-center py-4">No matching classes found.</p>
                      ) : (
                        filteredClassSectionOptions.map(clsSec => {
                          const isChecked = (value.assignedClasses || []).includes(clsSec);
                          return (
                            <label key={clsSec} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const current = value.assignedClasses || [];
                                  const next = e.target.checked
                                    ? [...current, clsSec]
                                    : current.filter(c => c !== clsSec);
                                  onChange('assignedClasses', next);
                                }}
                                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              {clsSec}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Assigned Subjects */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Assigned Subjects <span className="text-slate-400 font-normal">(Select all that apply)</span>
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search subjects..."
                        value={subjectSearch}
                        onChange={e => setSubjectSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 text-[11px] font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 transition-colors"
                      />
                      {subjectSearch && (
                        <button
                          type="button"
                          onClick={() => setSubjectSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2">
                      {filteredSubjectOptions.length === 0 ? (
                        <p className="text-slate-400 italic text-[11px] text-center py-4">No matching subjects found.</p>
                      ) : (
                        filteredSubjectOptions.map(subj => {
                          const isChecked = (value.assignedSubjects || []).includes(subj);
                          const matchingSubject = subjects.find(s => s.name === subj);
                          const subjectCode = matchingSubject?.code;
                          const displayLabel = subjectCode ? `${subj} (${subjectCode})` : subj;
                          return (
                            <label key={subj} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const current = value.assignedSubjects || [];
                                  const next = e.target.checked
                                    ? [...current, subj]
                                    : current.filter(s => s !== subj);
                                  onChange('assignedSubjects', next);
                                }}
                                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="select-none">{displayLabel}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {duplicateTeacher && (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-[11px]">Potential Workload Conflict</p>
                      <p className="text-[10px] mt-0.5 leading-relaxed">
                        <strong>{duplicateTeacher.teacherName}</strong> is already registered with the designation <strong>"{duplicateTeacher.designation}"</strong> and teaches <strong>{duplicateTeacher.subjects.join(', ')}</strong>. You can proceed with registration, but this might conflict in timetable auto-generation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: QUALIFICATION                             */}
      {/* ---------------------------------------------------- */}
      {activeStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Academic & Professional Qualifications</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingQualId(null);
                  setQualForm({
                    id: '',
                    qualification: '',
                    specialization: '',
                    institution: '',
                    boardUniversity: '',
                    passingYear: '',
                    percentageCgpa: ''
                  });
                  setIsAddingQual(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Qualification
              </button>
            </div>

            {/* Added Qualifications Table / Cards */}
            {value.qualifications.length === 0 && !isAddingQual ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No qualifications added yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Qualification" to record degrees and certifications.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {value.qualifications.map(q => (
                  <div key={q.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white text-xs">
                        {q.qualification} <span className="font-normal text-slate-500">({q.specialization || 'General'})</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {q.institution} • {q.boardUniversity} • Passed: {q.passingYear} • Score: {q.percentageCgpa || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQualId(q.id);
                          setQualForm(q);
                          setIsAddingQual(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQualification(q.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add / Edit Qualification Form */}
            {isAddingQual && (
              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20 space-y-3 mt-3">
                {editingQualId && (
                  <h4 className="font-black text-slate-900 dark:text-white text-xs mb-1.5">
                    Edit Qualification
                  </h4>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qualification Degree</label>
                    <input
                      type="text"
                      value={qualForm.qualification}
                      onChange={e => setQualForm(prev => ({ ...prev, qualification: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Specialization / Subject</label>
                    <input
                      type="text"
                      value={qualForm.specialization}
                      onChange={e => setQualForm(prev => ({ ...prev, specialization: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Institution / College</label>
                    <input
                      type="text"
                      value={qualForm.institution}
                      onChange={e => setQualForm(prev => ({ ...prev, institution: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Board / University</label>
                    <input
                      type="text"
                      value={qualForm.boardUniversity}
                      onChange={e => setQualForm(prev => ({ ...prev, boardUniversity: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Passing Year</label>
                    <input
                      type="text"
                      value={qualForm.passingYear}
                      onChange={e => setQualForm(prev => ({ ...prev, passingYear: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Percentage / CGPA</label>
                    <input
                      type="text"
                      value={qualForm.percentageCgpa}
                      onChange={e => setQualForm(prev => ({ ...prev, percentageCgpa: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingQual(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQualification}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: EXPERIENCE                                */}
      {/* ---------------------------------------------------- */}
      {activeStep === 4 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Work Experience History</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingExpId(null);
                  setExpForm({
                    id: '',
                    previousOrganization: '',
                    designation: '',
                    fromDate: '',
                    toDate: '',
                    totalExperience: '0 Years 0 Months',
                    reasonForLeaving: ''
                  });
                  setIsAddingExp(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {/* Added Experiences List */}
            {value.experiences.length === 0 && !isAddingExp ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                <Award className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold">No experience records added yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Experience" to record prior employment details.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {value.experiences.map(e => (
                  <div key={e.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white text-xs">
                        {e.designation} <span className="font-normal text-slate-500">at {e.previousOrganization}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {e.fromDate} to {e.toDate} • Total: <strong className="text-brand-600">{e.totalExperience}</strong> • Reason: {e.reasonForLeaving || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpId(e.id);
                          setExpForm(e);
                          setIsAddingExp(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(e.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline Add / Edit Experience Form */}
            {isAddingExp && (
              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20 space-y-3 mt-3">
                {editingExpId && (
                  <h4 className="font-black text-slate-900 dark:text-white text-xs mb-1.5">
                    Edit Experience Record
                  </h4>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Previous Organization</label>
                    <input
                      type="text"
                      value={expForm.previousOrganization}
                      onChange={e => setExpForm(prev => ({ ...prev, previousOrganization: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation Held</label>
                    <input
                      type="text"
                      value={expForm.designation}
                      onChange={e => setExpForm(prev => ({ ...prev, designation: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From Date</label>
                    <input
                      type="date"
                      value={expForm.fromDate}
                      onChange={e => {
                        const from = e.target.value;
                        const computed = calculateExperienceYearsMonths(from, expForm.toDate);
                        setExpForm(prev => ({ ...prev, fromDate: from, totalExperience: computed }));
                      }}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To Date</label>
                    <input
                      type="date"
                      value={expForm.toDate}
                      onChange={e => {
                        const to = e.target.value;
                        const computed = calculateExperienceYearsMonths(expForm.fromDate, to);
                        setExpForm(prev => ({ ...prev, toDate: to, totalExperience: computed }));
                      }}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Experience</label>
                    <input
                      type="text"
                      value={calculateExperienceYearsMonths(expForm.fromDate, expForm.toDate)}
                      readOnly
                      className={`${fieldClass} bg-slate-100 dark:bg-slate-900 font-bold text-brand-600 cursor-not-allowed`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Reason for Leaving</label>
                    <input
                      type="text"
                      value={expForm.reasonForLeaving}
                      onChange={e => setExpForm(prev => ({ ...prev, reasonForLeaving: e.target.value }))}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingExp(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExperience}
                    className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: UPLOAD DOCUMENTS                          */}
      {/* ---------------------------------------------------- */}
      {activeStep === 5 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-brand-600" />
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Upload Documents</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                {value.documents.length} File(s) Uploaded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {STANDARD_DOC_TYPES.map(docType => {
                const uploaded = value.documents.find(d => d.docType === docType);
                return (
                  <div key={docType} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{docType}</span>
                      {uploaded ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ Uploaded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                          Pending
                        </span>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-200">{uploaded.fileName}</p>
                          <p className="text-[10px] text-slate-400">{uploaded.fileSize} • {uploaded.uploadedAt}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(uploaded)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={uploaded.fileUrl}
                            download={uploaded.fileName}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(uploaded.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-brand-50/50 cursor-pointer transition text-slate-500 text-xs font-bold">
                        <Upload className="w-3.5 h-3.5 text-brand-600" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          onChange={e => handleDocumentFileUpload(e, docType)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- STEPPER NAVIGATION FOOTER ----------------- */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs disabled:opacity-40"
        >
          Previous Step
        </button>

        <span className="text-[11px] font-bold text-slate-400">
          Step {activeStep} of 5
        </span>

        {activeStep === 5 ? (
          <button
            key="submit-staff-btn"
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-xs disabled:opacity-40"
          >
            {isSubmitting
              ? 'Saving...'
              : staffToEdit
                ? 'Save Changes'
                : 'Create Employee Record'}
          </button>
        ) : (
          <button
            key="next-staff-btn"
            type="button"
            onClick={() => {
              if (validateStep(activeStep)) {
                setActiveStep(prev => Math.min(5, prev + 1));
              }
            }}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-xs"
          >
            Next Step
          </button>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-5 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2.5">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{previewDoc.docType} Preview</h3>
                <p className="text-[10px] text-slate-400">{previewDoc.fileName}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold">✕</button>
            </div>
            <div className="p-4 bg-slate-101 dark:bg-slate-950 rounded-xl flex items-center justify-center min-h-[220px] max-h-[380px] overflow-auto">
              {previewDoc.fileUrl && (
                previewDoc.fileUrl.startsWith('data:image/') ||
                /\.(png|jpe?g|gif|webp|bmp)$/i.test(previewDoc.fileUrl) ||
                previewDoc.fileName.match(/\.(png|jpe?g|gif|webp|bmp)$/i)
              ) ? (
                <img 
                  src={previewDoc.fileUrl} 
                  alt={previewDoc.fileName} 
                  className="max-w-full max-h-[340px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <p className="text-slate-550 font-bold text-xs text-center">
                  Document preview for <strong>{previewDoc.fileName}</strong> is ready.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <a
                href={previewDoc.fileUrl}
                download={previewDoc.fileName}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
              >
                Download Document
              </a>
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
