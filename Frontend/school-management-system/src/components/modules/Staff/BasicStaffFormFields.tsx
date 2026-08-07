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
  FileText, Eye, Download, RefreshCw, X, ShieldCheck, MapPin, Building2, Check, UploadCloud
} from 'lucide-react';

import { DateInput } from '../../common/DateInput';
import { SearchableSelect } from '../../common/SearchableSelect';

interface BasicStaffFormFieldsProps {
  value: BasicStaffFormState;
  errors?: Record<string, string>;
  onChange: (field: keyof BasicStaffFormState, value: any) => void;
  onCategoryChange: (value: StaffType | string) => void;
  employeeIdReadOnly?: boolean;
  compact?: boolean;
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs outline-none transition focus:border-brand-500 text-slate-900 dark:text-white font-medium';

export const BasicStaffFormFields: React.FC<BasicStaffFormFieldsProps> = ({
  value,
  errors = {},
  onChange,
  onCategoryChange,
  employeeIdReadOnly = true,
  compact = false
}) => {
  const { departments = [], designations = [] } = useData();

  // Stepper state (Step 1 to Step 5)
  const [activeStep, setActiveStep] = useState<number>(1);

  // Qualification inline form state
  const [isAddingQual, setIsAddingQual] = useState(false);
  const [editingQualId, setEditingQualId] = useState<string | null>(null);
  const [qualForm, setQualForm] = useState<StaffQualificationItem>({
    id: '',
    qualification: 'B.Ed',
    specialization: '',
    institution: '',
    boardUniversity: '',
    passingYear: '2020',
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

  const normalizedCategory = normalizeStaffType(value.employeeCategory);
  const departmentSelectOptions = getDepartmentSelectOptions(normalizedCategory, departments);
  const designationOptions = getDesignationOptions(normalizedCategory, value.department, designations);

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
      qualification: 'B.Ed',
      specialization: '',
      institution: '',
      boardUniversity: '',
      passingYear: '2020',
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

    const fakeUrl = URL.createObjectURL(file);
    const newDoc: StaffUploadedDocItem = {
      id: `DOC-${Date.now()}`,
      docType,
      fileName: file.name,
      fileUrl: fakeUrl,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleDateString()
    };

    // Remove existing doc of same type if present
    const filteredDocs = value.documents.filter(d => d.docType !== docType);
    onChange('documents', [...filteredDocs, newDoc]);
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
                onClick={() => setActiveStep(step.number)}
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
              {/* First Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={value.firstName}
                  onChange={e => onChange('firstName', e.target.value)}
                  placeholder="First Name"
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
                  placeholder="Last Name"
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
                  placeholder="Middle Name"
                  className={fieldClass}
                />
              </div>

              {/* Staff Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Staff Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={value.employeeCategory}
                  onChange={e => handleStaffTypeSelect(e.target.value)}
                  className={fieldClass}
                >
                  {staffTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.employeeCategory && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.employeeCategory}</p>}
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gender</label>
                <select value={value.gender || 'Male'} onChange={e => onChange('gender', e.target.value)} className={fieldClass}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth</label>
                <DateInput value={value.dob || ''} onChange={e => onChange('dob', e.target.value)} className={fieldClass} />
              </div>

              {/* Blood Group */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Group</label>
                <select value={value.bloodGroup || 'O+'} onChange={e => onChange('bloodGroup', e.target.value)} className={fieldClass}>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={value.mobileNumber}
                  onChange={e => onChange('mobileNumber', e.target.value)}
                  placeholder="+91 9876543210"
                  className={fieldClass}
                />
                {errors.mobileNumber && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.mobileNumber}</p>}
              </div>

              {/* Alternate Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alternate Mobile Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="tel"
                  value={value.alternateMobileNumber || ''}
                  onChange={e => onChange('alternateMobileNumber', e.target.value)}
                  placeholder="Alternate Phone"
                  className={fieldClass}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={value.email}
                  onChange={e => onChange('email', e.target.value)}
                  placeholder="employee@school.edu"
                  className={fieldClass}
                />
                {errors.email && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.email}</p>}
              </div>

              {/* Staff Photo Upload */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) onChange('photoUrl', URL.createObjectURL(file));
                  }}
                  className={fieldClass}
                />
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Aadhaar Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={value.aadhaarNumber || ''}
                  onChange={e => onChange('aadhaarNumber', e.target.value)}
                  placeholder="12-digit Aadhaar Number"
                  className={`${fieldClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">PAN Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={value.panNumber || ''}
                  onChange={e => onChange('panNumber', e.target.value.toUpperCase())}
                  placeholder="10-digit PAN Number"
                  className={`${fieldClass} font-mono uppercase`}
                />
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Present Address</label>
                <textarea
                  rows={2}
                  value={value.presentAddress || ''}
                  onChange={e => onChange('presentAddress', e.target.value)}
                  placeholder="House / Flat No, Street, Landmark"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Permanent Address</label>
                <textarea
                  rows={2}
                  value={value.permanentAddress || ''}
                  onChange={e => onChange('permanentAddress', e.target.value)}
                  placeholder="Permanent Address"
                  className={fieldClass}
                  disabled={value.sameAsPresentAddress}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</label>
                <input type="text" value={value.city || ''} onChange={e => onChange('city', e.target.value)} placeholder="City" className={fieldClass} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
                <input type="text" value={value.state || ''} onChange={e => onChange('state', e.target.value)} placeholder="State" className={fieldClass} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">PIN Code</label>
                <input type="text" value={value.pinCode || ''} onChange={e => onChange('pinCode', e.target.value)} placeholder="6-digit PIN Code" className={`${fieldClass} font-mono`} />
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
                <select value={value.branch} onChange={e => onChange('branch', e.target.value)} className={fieldClass}>
                  {branchOptions.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
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
                <select value={value.employmentType || 'Full-Time'} onChange={e => onChange('employmentType', e.target.value)} className={fieldClass}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
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
                  placeholder="Manager / Principal Name"
                  className={fieldClass}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select value={value.status || 'Active'} onChange={e => onChange('status', e.target.value)} className={fieldClass}>
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Retired">Retired</option>
                </select>
                {errors.status && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.status}</p>}
              </div>
            </div>
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
                    qualification: 'B.Ed',
                    specialization: '',
                    institution: '',
                    boardUniversity: '',
                    passingYear: '2020',
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
                <h4 className="font-black text-slate-900 dark:text-white text-xs">
                  {editingQualId ? 'Edit Qualification' : 'New Qualification Record'}
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Qualification Degree</label>
                    <input
                      type="text"
                      value={qualForm.qualification}
                      onChange={e => setQualForm(prev => ({ ...prev, qualification: e.target.value }))}
                      placeholder="e.g. B.Ed, M.Sc, Ph.D, B.Tech"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Specialization / Subject</label>
                    <input
                      type="text"
                      value={qualForm.specialization}
                      onChange={e => setQualForm(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="e.g. Mathematics, Organic Chemistry"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Institution / College</label>
                    <input
                      type="text"
                      value={qualForm.institution}
                      onChange={e => setQualForm(prev => ({ ...prev, institution: e.target.value }))}
                      placeholder="College or School Name"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Board / University</label>
                    <input
                      type="text"
                      value={qualForm.boardUniversity}
                      onChange={e => setQualForm(prev => ({ ...prev, boardUniversity: e.target.value }))}
                      placeholder="e.g. CBSE / Delhi University"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Passing Year</label>
                    <input
                      type="text"
                      value={qualForm.passingYear}
                      onChange={e => setQualForm(prev => ({ ...prev, passingYear: e.target.value }))}
                      placeholder="e.g. 2020"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Percentage / CGPA</label>
                    <input
                      type="text"
                      value={qualForm.percentageCgpa}
                      onChange={e => setQualForm(prev => ({ ...prev, percentageCgpa: e.target.value }))}
                      placeholder="e.g. 88.5% or 8.9 CGPA"
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
                    Save Qualification
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
                <h4 className="font-black text-slate-900 dark:text-white text-xs">
                  {editingExpId ? 'Edit Experience Record' : 'New Experience Entry'}
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Previous Organization</label>
                    <input
                      type="text"
                      value={expForm.previousOrganization}
                      onChange={e => setExpForm(prev => ({ ...prev, previousOrganization: e.target.value }))}
                      placeholder="School / Company Name"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation Held</label>
                    <input
                      type="text"
                      value={expForm.designation}
                      onChange={e => setExpForm(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="e.g. Senior Teacher"
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Experience (Auto)</label>
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
                      placeholder="e.g. Relocation"
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
                    Save Experience
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

        <button
          type="button"
          disabled={activeStep === 5}
          onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs disabled:opacity-40 shadow-xs"
        >
          Next Step
        </button>
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
