import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Edit3,
  CheckCircle2,
  Circle,
  UserRound,
  Briefcase,
  GraduationCap,
  BookOpen,
  WalletCards,
  FileText,
  CalendarDays,
  Building2,
  Landmark,
  FileCheck2,
  ShieldCheck,
  BadgeIndianRupee,
  Clock3,
  Users,
  School2,
  Eye,
  AlertTriangle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Staff, StaffDocType, StaffDocument } from '../../../types';

type EmployeeCategory = 'Teacher' | 'Staff';
type EmployeeCategorySelection = EmployeeCategory | '';
type EmploymentStatus = 'Active' | 'Probation' | 'Confirmed' | 'On Leave' | 'Inactive';
type AttachmentStatus = 'Uploaded' | 'Pending Verification' | 'Verified';

interface AttachmentSnapshot {
  fileName: string;
  fileSize: string;
  uploadedDate: string;
  status: AttachmentStatus;
  fileUrl: string;
}

interface QualificationRow {
  id: string;
  degree: string;
  university: string;
  year: string;
  percentage: string;
  certificate: AttachmentSnapshot | null;
}

interface DocumentSlot {
  id: string;
  label: string;
  type: StaffDocType | 'Other';
  required: boolean;
  file: AttachmentSnapshot | null;
}

interface RegistrationForm {
  employeeCategory: EmployeeCategorySelection;
  empId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: string;
  aadhaarNumber: string;
  panNumber: string;
  mobileNumber: string;
  alternateMobile: string;
  email: string;
  fatherName: string;
  motherName: string;
  maritalStatus: string;
  nationality: string;
  religion: string;
  casteCategory: string;
  residentialAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  district: string;
  pinCode: string;
  photo: AttachmentSnapshot | null;

  branch: string;
  department: string;
  designation: string;
  employeeType: string;
  joiningDate: string;
  confirmationDate: string;
  reportingManager: string;
  employmentStatus: EmploymentStatus;
  experienceYears: string;
  workShift: string;
  weeklyOff: string;
  attendanceType: string;
  biometricId: string;
  employeeCode: string;
  staffRole: string;

  qualifications: QualificationRow[];

  primarySubject: string;
  secondarySubject: string;
  classTeacher: boolean;
  multipleClasses: string[];
  section: string;
  academicYear: string;
  timetableAssignment: string;
  workloadHours: string;
  subjectsHandled: string[];
  classIncharge: string;
  maxPeriods: string;
  labAssigned: string;
  houseAssigned: string;
  clubAssignment: string;
  mentorStudents: boolean;

  salaryStructure: string;
  grossSalary: string;
  basicSalary: string;
  hra: string;
  da: string;
  specialAllowance: string;
  medicalAllowance: string;
  travelAllowance: string;
  foodAllowance: string;
  conveyance: string;
  performanceAllowance: string;
  otherAllowances: string;
  employerPF: string;
  employeePF: string;
  esi: string;
  professionalTax: string;
  incomeTax: string;
  loanDeduction: string;
  otherDeduction: string;
  bankAccountHolderName: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  upiId: string;
  salaryCreditDate: string;
  paymentMode: string;
  pfApplicable: boolean;
  esiApplicable: boolean;
  professionalTaxApplicable: boolean;
  tdsApplicable: boolean;
  payrollFrequency: string;
  payrollStatus: string;
  salaryOverride: boolean;
  salaryEffectiveDate: string;
  salaryRevisionDate: string;

  documents: DocumentSlot[];
  notes: string;
}

interface StaffRegistrationPageProps {
  onNavigate: (module: string) => void;
}

const draftStorageKey = 'pirnav_staff_registration_draft';
const defaultAvatar =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80';

const stepMeta = [
  { id: 'personal', label: 'Personal', icon: UserRound },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'qualification', label: 'Qualification', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'review', label: 'Review', icon: CheckCircle2 }
] as const;

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
const casteCategories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
const genders = ['Male', 'Female', 'Other'];
const employeeTypes = ['Permanent', 'Contract', 'Part-Time', 'Guest', 'Temporary'];
const workShifts = ['Morning', 'Day', 'Evening', 'Rotational'];
const weeklyOffs = ['Sunday', 'Saturday', 'Sunday & Holiday', 'Alternate Sunday'];
const attendanceTypes = ['Biometric', 'Manual', 'RFID', 'Mobile App'];
const paymentModes = ['Bank Transfer', 'NEFT/RTGS', 'UPI', 'Cheque'];
const payrollFrequencies = ['Monthly', 'Bi-Weekly', 'Weekly'];
const employmentStatuses: EmploymentStatus[] = ['Active', 'Probation', 'Confirmed', 'On Leave', 'Inactive'];
const branches = ['Main Campus', 'North Campus', 'South Campus', 'West Campus', 'City Center'];
const defaultTeacherDepartments = [
  'Mathematics',
  'Science',
  'English',
  'Social Science',
  'Languages',
  'Computer Science / ICT',
  'Commerce',
  'Humanities',
  'Fine Arts',
  'Performing Arts',
  'Physical Education',
  'Pre-Primary'
];
const defaultStaffDepartments = [
  'Administration',
  'Finance & Accounts',
  'Human Resources',
  'Transport',
  'Hostel Management',
  'Library',
  'Information Technology',
  'Maintenance',
  'Security',
  'Medical'
];

const employeeCategoryOptions: EmployeeCategory[] = ['Teacher', 'Staff'];
const employeeCategoryLabelMap: Record<EmployeeCategory, string> = {
  Teacher: 'Teaching Staff',
  Staff: 'Non-Teaching Staff'
};

type SalaryPreset = {
  grossSalary: string;
  basicSalary: string;
  hra: string;
  da: string;
  specialAllowance: string;
  medicalAllowance: string;
  travelAllowance: string;
  foodAllowance: string;
  conveyance: string;
  performanceAllowance: string;
  otherAllowances: string;
  employerPF: string;
  employeePF: string;
  esi: string;
  professionalTax: string;
  incomeTax: string;
  loanDeduction: string;
  otherDeduction: string;
};

const salaryPresetCatalog: Record<EmployeeCategory, Record<string, SalaryPreset>> = {
  Teacher: {
    'Standard Teacher Scale': {
      grossSalary: '60000',
      basicSalary: '40000',
      hra: '8000',
      da: '2000',
      specialAllowance: '1000',
      medicalAllowance: '500',
      travelAllowance: '0',
      foodAllowance: '0',
      conveyance: '0',
      performanceAllowance: '1000',
      otherAllowances: '0',
      employerPF: '2500',
      employeePF: '2500',
      esi: '0',
      professionalTax: '500',
      incomeTax: '2000',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'Senior Teacher Scale': {
      grossSalary: '72000',
      basicSalary: '48000',
      hra: '9600',
      da: '2600',
      specialAllowance: '1800',
      medicalAllowance: '700',
      travelAllowance: '0',
      foodAllowance: '0',
      conveyance: '300',
      performanceAllowance: '1500',
      otherAllowances: '0',
      employerPF: '3200',
      employeePF: '3200',
      esi: '0',
      professionalTax: '500',
      incomeTax: '2500',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'HOD Scale': {
      grossSalary: '84000',
      basicSalary: '56000',
      hra: '11200',
      da: '3200',
      specialAllowance: '2200',
      medicalAllowance: '800',
      travelAllowance: '500',
      foodAllowance: '0',
      conveyance: '400',
      performanceAllowance: '1800',
      otherAllowances: '0',
      employerPF: '3800',
      employeePF: '3800',
      esi: '0',
      professionalTax: '500',
      incomeTax: '3200',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'Contract Scale': {
      grossSalary: '45000',
      basicSalary: '30000',
      hra: '6000',
      da: '1500',
      specialAllowance: '500',
      medicalAllowance: '500',
      travelAllowance: '0',
      foodAllowance: '0',
      conveyance: '0',
      performanceAllowance: '500',
      otherAllowances: '0',
      employerPF: '1800',
      employeePF: '1800',
      esi: '0',
      professionalTax: '300',
      incomeTax: '1200',
      loanDeduction: '0',
      otherDeduction: '0'
    }
  },
  Staff: {
    'Office & Admin Scale': {
      grossSalary: '42000',
      basicSalary: '26000',
      hra: '6500',
      da: '2200',
      specialAllowance: '1600',
      medicalAllowance: '700',
      travelAllowance: '1200',
      foodAllowance: '0',
      conveyance: '500',
      performanceAllowance: '1200',
      otherAllowances: '0',
      employerPF: '2200',
      employeePF: '2200',
      esi: '0',
      professionalTax: '300',
      incomeTax: '1500',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'Support Staff Scale': {
      grossSalary: '30000',
      basicSalary: '18000',
      hra: '4500',
      da: '1500',
      specialAllowance: '1200',
      medicalAllowance: '500',
      travelAllowance: '800',
      foodAllowance: '0',
      conveyance: '300',
      performanceAllowance: '700',
      otherAllowances: '0',
      employerPF: '1500',
      employeePF: '1500',
      esi: '0',
      professionalTax: '200',
      incomeTax: '1000',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'Technical Staff Scale': {
      grossSalary: '36000',
      basicSalary: '22000',
      hra: '5200',
      da: '1800',
      specialAllowance: '1400',
      medicalAllowance: '600',
      travelAllowance: '1000',
      foodAllowance: '0',
      conveyance: '400',
      performanceAllowance: '900',
      otherAllowances: '0',
      employerPF: '1800',
      employeePF: '1800',
      esi: '0',
      professionalTax: '250',
      incomeTax: '1200',
      loanDeduction: '0',
      otherDeduction: '0'
    },
    'Contract Support Scale': {
      grossSalary: '24000',
      basicSalary: '15000',
      hra: '3500',
      da: '1200',
      specialAllowance: '900',
      medicalAllowance: '400',
      travelAllowance: '500',
      foodAllowance: '0',
      conveyance: '250',
      performanceAllowance: '500',
      otherAllowances: '0',
      employerPF: '1200',
      employeePF: '1200',
      esi: '0',
      professionalTax: '200',
      incomeTax: '800',
      loanDeduction: '0',
      otherDeduction: '0'
    }
  }
};

const blankSalaryPreset: SalaryPreset = {
  grossSalary: '',
  basicSalary: '',
  hra: '',
  da: '',
  specialAllowance: '',
  medicalAllowance: '',
  travelAllowance: '',
  foodAllowance: '',
  conveyance: '',
  performanceAllowance: '',
  otherAllowances: '',
  employerPF: '',
  employeePF: '',
  esi: '',
  professionalTax: '',
  incomeTax: '',
  loanDeduction: '',
  otherDeduction: ''
};

const teachingDesignationOptions = [
  'Principal',
  'Vice Principal',
  'HOD',
  'PGT Teacher',
  'TGT Teacher',
  'PRT Teacher',
  'PET',
  'Art Teacher',
  'Music Teacher',
  'Dance Teacher',
  'Computer Teacher',
  'Librarian',
  'Special Educator'
];

const nonTeachingDesignationOptions = [
  'Administrator',
  'HR Executive',
  'Accountant',
  'Receptionist',
  'Office Assistant',
  'Admission Counselor',
  'IT Support',
  'Lab Assistant',
  'Store Keeper',
  'Transport Manager',
  'Driver',
  'Security Guard',
  'Cleaner',
  'Nurse',
  'Hostel Warden'
];

const teachingDocumentRequirements = [
  { label: 'Aadhaar Card', required: true, type: 'Aadhaar Card' as StaffDocType },
  { label: 'PAN Card', required: true, type: 'PAN Card' as StaffDocType },
  { label: 'Degree Certificate', required: true, type: 'Degree Certificate' as StaffDocType },
  { label: 'B.Ed./M.Ed. (if applicable)', required: false, type: 'B.Ed.' as StaffDocType },
  { label: 'Experience Certificate', required: true, type: 'Experience Letter' as StaffDocType },
  { label: 'Joining Letter', required: true, type: 'Offer Letter' as StaffDocType },
  { label: 'Bank Passbook', required: true, type: 'Bank Passbook' as StaffDocType }
];

const nonTeachingDocumentRequirements = [
  { label: 'Aadhaar Card', required: true, type: 'Aadhaar Card' as StaffDocType },
  { label: 'PAN Card', required: true, type: 'PAN Card' as StaffDocType },
  { label: 'Qualification Certificate', required: true, type: 'Educational Certificates' as StaffDocType },
  { label: 'Experience Certificate (optional)', required: false, type: 'Experience Letter' as StaffDocType },
  { label: 'Bank Passbook', required: true, type: 'Bank Passbook' as StaffDocType },
  { label: 'Joining Letter', required: true, type: 'Offer Letter' as StaffDocType }
];

const salaryBaseGrossByDesignation: Record<EmployeeCategory, Record<string, number>> = {
  Teacher: {
    Principal: 120000,
    'Vice Principal': 95000,
    HOD: 85000,
    'PGT Teacher': 65000,
    'TGT Teacher': 55000,
    'PRT Teacher': 45000,
    PET: 50000,
    'Art Teacher': 48000,
    'Music Teacher': 48000,
    'Dance Teacher': 48000,
    'Computer Teacher': 52000,
    Librarian: 42000,
    'Special Educator': 47000
  },
  Staff: {
    Administrator: 48000,
    'HR Executive': 42000,
    Accountant: 38000,
    Receptionist: 28000,
    'Office Assistant': 26000,
    'Admission Counselor': 34000,
    'IT Support': 36000,
    'Lab Assistant': 30000,
    'Store Keeper': 32000,
    'Transport Manager': 42000,
    Driver: 25000,
    'Security Guard': 24000,
    Cleaner: 18000,
    Nurse: 32000,
    'Hostel Warden': 36000
  }
};

function getEmployeeCategoryLabel(category: EmployeeCategorySelection) {
  if (!category) return '';
  return employeeCategoryLabelMap[category];
}

function getEmployeeCategoryFromLabel(label: string): EmployeeCategorySelection {
  if (label === employeeCategoryLabelMap.Teacher) return 'Teacher';
  if (label === employeeCategoryLabelMap.Staff) return 'Staff';
  return '';
}

function buildSalaryPreset(baseGross: number, variant: 'standard' | 'senior' | 'contract' | 'junior' = 'standard'): SalaryPreset {
  const multiplier = variant === 'senior' ? 1.12 : variant === 'contract' ? 0.78 : variant === 'junior' ? 0.88 : 1;
  const gross = Math.round(baseGross * multiplier);
  const basic = Math.round(gross * 0.6);
  const hra = Math.round(basic * 0.2);
  const da = Math.round(basic * 0.08);
  const specialAllowance = Math.round(gross * 0.05);
  const medicalAllowance = Math.round(gross * 0.02);
  const travelAllowance = Math.round(gross * 0.015);
  const foodAllowance = 0;
  const conveyance = Math.round(gross * 0.01);
  const performanceAllowance = Math.round(gross * 0.03);
  const otherAllowances = 0;
  const employerPF = Math.round(basic * 0.12);
  const employeePF = Math.round(basic * 0.12);
  const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const professionalTax = gross >= 25000 ? 200 : 100;
  const incomeTax = gross >= 75000 ? Math.round(gross * 0.05) : gross >= 50000 ? Math.round(gross * 0.03) : 0;

  return {
    grossSalary: String(gross),
    basicSalary: String(basic),
    hra: String(hra),
    da: String(da),
    specialAllowance: String(specialAllowance),
    medicalAllowance: String(medicalAllowance),
    travelAllowance: String(travelAllowance),
    foodAllowance: String(foodAllowance),
    conveyance: String(conveyance),
    performanceAllowance: String(performanceAllowance),
    otherAllowances: String(otherAllowances),
    employerPF: String(employerPF),
    employeePF: String(employeePF),
    esi: String(esi),
    professionalTax: String(professionalTax),
    incomeTax: String(incomeTax),
    loanDeduction: '0',
    otherDeduction: '0'
  };
}

function buildDesignationOptions(category: EmployeeCategorySelection) {
  if (category === 'Teacher') return teachingDesignationOptions;
  if (category === 'Staff') return nonTeachingDesignationOptions;
  return [];
}

function buildSalaryStructureOptions(category: EmployeeCategorySelection, designation: string) {
  if (!category || !designation) return [];

  if (category === 'Teacher') {
    switch (designation) {
      case 'Principal':
        return ['Principal Leadership Scale', 'Senior Principal Scale', 'Contract Principal Scale'];
      case 'Vice Principal':
        return ['Vice Principal Scale', 'Senior Vice Principal Scale', 'Contract Vice Principal Scale'];
      case 'HOD':
        return ['HOD Scale', 'Senior HOD Scale', 'Contract HOD Scale'];
      case 'PGT Teacher':
        return ['Standard PGT Scale', 'Senior PGT Scale', 'Contract PGT Scale'];
      case 'TGT Teacher':
        return ['Standard TGT Scale', 'Senior TGT Scale', 'Contract TGT Scale'];
      case 'PRT Teacher':
        return ['Standard PRT Scale', 'Senior PRT Scale', 'Contract PRT Scale'];
      case 'PET':
        return ['PET Scale', 'Senior PET Scale', 'Contract PET Scale'];
      case 'Art Teacher':
        return ['Art Teacher Scale', 'Senior Art Teacher Scale', 'Contract Art Teacher Scale'];
      case 'Music Teacher':
        return ['Music Teacher Scale', 'Senior Music Teacher Scale', 'Contract Music Teacher Scale'];
      case 'Dance Teacher':
        return ['Dance Teacher Scale', 'Senior Dance Teacher Scale', 'Contract Dance Teacher Scale'];
      case 'Computer Teacher':
        return ['Computer Teacher Scale', 'Senior Computer Teacher Scale', 'Contract Computer Teacher Scale'];
      case 'Librarian':
        return ['Librarian Scale', 'Senior Librarian Scale', 'Contract Librarian Scale'];
      case 'Special Educator':
        return ['Special Educator Scale', 'Senior Special Educator Scale', 'Contract Special Educator Scale'];
      default:
        return [`Standard ${designation} Scale`, `Senior ${designation} Scale`, `Contract ${designation} Scale`];
    }
  }

  switch (designation) {
    case 'Accountant':
      return ['Junior Accountant Scale', 'Senior Accountant Scale'];
    case 'Administrator':
      return ['Administrator Scale', 'Senior Administrator Scale', 'Contract Administrator Scale'];
    case 'HR Executive':
      return ['HR Executive Scale', 'Senior HR Executive Scale', 'Contract HR Executive Scale'];
    case 'Receptionist':
      return ['Receptionist Scale', 'Senior Receptionist Scale'];
    case 'Office Assistant':
      return ['Office Assistant Scale', 'Senior Office Assistant Scale'];
    case 'Admission Counselor':
      return ['Admission Counselor Scale', 'Senior Admission Counselor Scale', 'Contract Admission Counselor Scale'];
    case 'IT Support':
      return ['IT Support Scale', 'Senior IT Support Scale', 'Contract IT Support Scale'];
    case 'Lab Assistant':
      return ['Lab Assistant Scale', 'Senior Lab Assistant Scale'];
    case 'Store Keeper':
      return ['Store Keeper Scale', 'Senior Store Keeper Scale'];
    case 'Transport Manager':
      return ['Transport Manager Scale', 'Senior Transport Manager Scale', 'Contract Transport Manager Scale'];
    case 'Driver':
      return ['Driver Scale', 'Senior Driver Scale', 'Contract Driver Scale'];
    case 'Security Guard':
      return ['Security Guard Scale', 'Senior Security Guard Scale', 'Contract Security Guard Scale'];
    case 'Cleaner':
      return ['Cleaner Scale', 'Senior Cleaner Scale'];
    case 'Nurse':
      return ['Nurse Scale', 'Senior Nurse Scale', 'Contract Nurse Scale'];
    case 'Hostel Warden':
      return ['Hostel Warden Scale', 'Senior Hostel Warden Scale', 'Contract Hostel Warden Scale'];
    default:
      return [`Standard ${designation} Scale`, `Senior ${designation} Scale`, `Contract ${designation} Scale`];
  }
}

function getSalaryPreset(category: EmployeeCategorySelection, designation: string, structureName: string): SalaryPreset {
  if (!category || !designation || !structureName) return blankSalaryPreset;
  const baseGross = salaryBaseGrossByDesignation[category][designation] || (category === 'Teacher' ? 60000 : 30000);
  const lowerStructure = structureName.toLowerCase();
  const variant = lowerStructure.includes('contract')
    ? 'contract'
    : lowerStructure.includes('senior')
      ? 'senior'
      : lowerStructure.includes('junior')
        ? 'junior'
        : 'standard';
  return buildSalaryPreset(baseGross, variant);
}

function getDocumentRequirements(category: EmployeeCategorySelection) {
  if (category === 'Teacher') return teachingDocumentRequirements;
  if (category === 'Staff') return nonTeachingDocumentRequirements;
  return [];
}

function buildDocumentSlots(category: EmployeeCategorySelection, previousSlots: DocumentSlot[] = []) {
  return getDocumentRequirements(category).map(req => {
    const existing = previousSlots.find(slot => matchesRequiredDoc(slot, req.label));
    return {
      id: existing?.id || `DOC-${normalize(req.label).replace(/\s+/g, '-').toUpperCase()}`,
      label: req.label,
      type: req.type,
      required: req.required,
      file: existing?.file || null
    };
  });
}

const defaultQualificationRows = (): QualificationRow[] => [
  {
    id: `Q-${Date.now()}-1`,
    degree: '',
    university: '',
    year: '',
    percentage: '',
    certificate: null
  }
];

const defaultDocumentSlots = (): DocumentSlot[] => [
  { id: 'DOC-AADHAAR', label: 'Aadhaar Card', type: 'Aadhaar Card', required: true, file: null },
  { id: 'DOC-PAN', label: 'PAN Card', type: 'PAN Card', required: true, file: null },
  { id: 'DOC-PHOTO', label: 'Profile Photo', type: 'Other', required: true, file: null },
  { id: 'DOC-RESUME', label: 'Resume', type: 'Resume', required: true, file: null },
  { id: 'DOC-QUAL', label: 'Qualification Certificates', type: 'Educational Certificates', required: false, file: null },
  { id: 'DOC-DEGREE', label: 'Degree Certificate', type: 'Degree Certificate', required: false, file: null },
  { id: 'DOC-BED', label: 'B.Ed. Certificate', type: 'B.Ed.', required: false, file: null },
  { id: 'DOC-MED', label: 'M.Ed. Certificate', type: 'M.Ed.', required: false, file: null },
  { id: 'DOC-TEACH', label: 'Teaching Eligibility Certificate', type: 'Teaching Eligibility Certificate', required: false, file: null },
  { id: 'DOC-EXP', label: 'Experience Letter', type: 'Experience Letter', required: false, file: null },
  { id: 'DOC-APPT', label: 'Appointment Letter', type: 'Offer Letter', required: false, file: null },
  { id: 'DOC-POLICE', label: 'Police Verification', type: 'Police Verification', required: false, file: null },
  { id: 'DOC-MEDICAL', label: 'Medical Certificate', type: 'Medical Certificate', required: false, file: null },
  { id: 'DOC-BANK', label: 'Bank Passbook', type: 'Bank Passbook', required: false, file: null },
  { id: 'DOC-CHEQUE', label: 'Cancelled Cheque', type: 'Other', required: false, file: null },
  { id: 'DOC-OTHER', label: 'Other Documents', type: 'Other', required: false, file: null }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let current = size;
  let unit = 0;
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024;
    unit += 1;
  }
  return `${current.toFixed(current >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function getUniqueEmpId() {
  try {
    const stored = localStorage.getItem('edu_db_staff');
    const parsed = stored ? JSON.parse(stored) : [];
    const allStaff: Staff[] = Array.isArray(parsed) ? parsed : [];
    const numbers = allStaff
      .map(s => {
        const digits = (s.empId || '').match(/\d+/);
        return digits ? parseInt(digits[0], 10) : 0;
      })
      .filter((n): n is number => Number.isFinite(n) && n > 0);
    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `EMP${String(next).padStart(3, '0')}`;
  } catch {
    return `EMP${String(Date.now()).slice(-3)}`;
  }
}

function buildAddress(form: RegistrationForm) {
  const parts = [
    form.residentialAddress,
    form.permanentAddress,
    form.city,
    form.district,
    form.state,
    form.pinCode
  ]
    .map(v => v.trim())
    .filter(Boolean);
  return parts.join(', ');
}

function mapEmploymentStatus(status: EmploymentStatus): Staff['status'] {
  if (status === 'On Leave') return 'On Leave';
  if (status === 'Inactive') return 'Inactive';
  return 'Active';
}

function buildTeacherDepartmentOptions(category: EmployeeCategorySelection) {
  if (category === 'Teacher') return defaultTeacherDepartments;
  if (category === 'Staff') return defaultStaffDepartments;
  return [];
}

function initialAcademicYear(selectedAcademicYear: string) {
  return selectedAcademicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
}

function createAttachmentSnapshot(file: File, status: AttachmentStatus = 'Uploaded'): Promise<AttachmentSnapshot> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fileName: file.name,
        fileSize: formatBytes(file.size),
        uploadedDate: todayString(),
        status,
        fileUrl: typeof reader.result === 'string' ? reader.result : '#'
      });
    };
    reader.readAsDataURL(file);
  });
}

function matchesRequiredDoc(slot: DocumentSlot, requiredDoc: string) {
  const slotLabel = normalize(slot.label);
  const slotType = normalize(slot.type);
  const req = normalize(requiredDoc);

  if (slotLabel === req || slotType === req) return true;
  if (slotLabel.includes(req) || slotType.includes(req) || req.includes(slotLabel) || req.includes(slotType)) return true;

  if (req.includes('aadhaar') || req.includes('adhar')) return slotLabel.includes('aadhaar') || slotType.includes('aadhaar') || slotLabel.includes('adhar');
  if (req.includes('pan')) return slotLabel.includes('pan') || slotType.includes('pan');
  if (req.includes('photo')) return slotLabel.includes('photo') || slotType.includes('photo');
  if (req.includes('certificate') || req.includes('degree') || req.includes('qualification') || req.includes('educational')) {
    return slotLabel.includes('qualif') || slotLabel.includes('degree') || slotType.includes('certificate') || slotType.includes('education') || slotType.includes('degree') || slotLabel.includes('b ed') || slotLabel.includes('m ed');
  }
  if (req.includes('experience')) return slotLabel.includes('experience') || slotType.includes('experience');
  if (req.includes('appointment') || req.includes('offer letter')) return slotLabel.includes('appointment') || slotLabel.includes('offer') || slotType.includes('offer');
  if (req.includes('police')) return slotLabel.includes('police') || slotType.includes('police');
  if (req.includes('medical')) return slotLabel.includes('medical') || slotType.includes('medical');
  if (req.includes('bank')) return slotLabel.includes('bank') || slotType.includes('bank') || slotLabel.includes('passbook');
  if (req.includes('resume')) return slotLabel.includes('resume') || slotType.includes('resume');
  if (req.includes('cheque')) return slotLabel.includes('cheque') || slotType.includes('cheque');
  if (req.includes('eligibility')) return slotLabel.includes('eligibility') || slotType.includes('eligibility');
  if (req.includes('b ed')) return slotLabel.includes('b ed') || slotType.includes('b ed') || slotLabel.includes('qualification');
  if (req.includes('m ed')) return slotLabel.includes('m ed') || slotType.includes('m ed') || slotLabel.includes('qualification');

  return false;
}

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}> = ({ title, subtitle, action, children, icon: Icon, className = '' }) => (
  <section className={`rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden ${className}`}>
    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
        </div>
        {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

const InfoLine: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-[16px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</p>
    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value || 'Not Provided'}</div>
  </div>
);

const FieldShell: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, error, hint, className = '', children }) => (
  <div className={className}>
    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
      {label}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    {error && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{error}</p>}
  </div>
);

const inputClass =
  'w-full min-h-[52px] rounded-[16px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all disabled:opacity-80 disabled:cursor-not-allowed';

const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}> = ({ label, value, onChange, required, error, hint, type = 'text', placeholder, readOnly, className }) => (
  <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`${inputClass} ${readOnly ? 'bg-slate-100 dark:bg-slate-900/80' : ''}`}
    />
  </FieldShell>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}> = ({ label, value, onChange, required, error, hint, placeholder, rows = 3, className }) => (
  <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputClass} min-h-[108px] resize-y`}
    />
  </FieldShell>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}> = ({ label, value, onChange, options, required, error, hint, className, placeholder, readOnly }) => (
  <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${inputClass} ${readOnly ? 'pointer-events-none bg-slate-100 dark:bg-slate-900/80' : ''}`}
      disabled={readOnly}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </FieldShell>
);

const ToggleField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
  className?: string;
}> = ({ label, checked, onChange, hint, className }) => (
  <div className={`flex items-center gap-3 min-h-[52px] rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 ${className || ''}`}>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mt-0.5 h-6 w-11 rounded-full border transition-all relative ${
        checked
          ? 'bg-brand-600 border-brand-600'
          : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 dark:text-white">{label}</p>
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  </div>
);

const ChipSelect: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}> = ({ label, options, selected, onToggle, error, required, hint }) => (
  <FieldShell label={label} required={required} error={error} hint={hint} className="col-span-full">
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const active = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={`min-h-[42px] px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
              active
                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  </FieldShell>
);

const UploadCard: React.FC<{
  title: string;
  required?: boolean;
  file: AttachmentSnapshot | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  note?: string;
}> = ({ title, required, file, onUpload, onRemove, inputRef, note }) => {
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedInputRef = inputRef || localInputRef;

  return (
  <div className="rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-5 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-slate-900 dark:text-white">{title}</p>
          {required && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-black uppercase">Required</span>}
        </div>
        {note && <p className="text-[10px] text-slate-500 mt-1">{note}</p>}
      </div>
      {file ? (
        <Badge variant="success" size="sm">Uploaded</Badge>
      ) : (
        <Badge variant="warning" size="sm">Missing</Badge>
      )}
    </div>

    {file ? (
      <div className="rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.fileName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {file.fileSize} | Uploaded {file.uploadedDate}
            </p>
          </div>
          <Badge variant={file.status === 'Verified' ? 'success' : 'neutral'} size="sm">{file.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => resolvedInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
        >
          <Upload className="w-3.5 h-3.5" /> Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => resolvedInputRef.current?.click()}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
      >
        <Upload className="w-4 h-4" /> Upload File
      </button>
    )}

    <input
      ref={resolvedInputRef}
      type="file"
      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
      className="hidden"
      onChange={e => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
        e.currentTarget.value = '';
      }}
      />
  </div>
  );
};

export const StaffRegistrationPage: React.FC<StaffRegistrationPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { staff, addStaff, subjects, academicClasses, schoolProfile } = useData();
  const { addToast } = useToast();

  const academicYear = schoolProfile.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const buildDefaultForm = () => {
    const empId = getUniqueEmpId();
    const qualificationDefaults = defaultQualificationRows();

    return {
      employeeCategory: '',
      empId,
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'Male',
      dob: '',
      bloodGroup: '',
      aadhaarNumber: '',
      panNumber: '',
      mobileNumber: '',
      alternateMobile: '',
      email: '',
      fatherName: '',
      motherName: '',
      maritalStatus: '',
      nationality: 'Indian',
      religion: '',
      casteCategory: 'General',
      residentialAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      district: '',
      pinCode: '',
      photo: null,

      branch: '',
      department: '',
      designation: '',
      employeeType: 'Permanent',
      joiningDate: todayString(),
      confirmationDate: '',
      reportingManager: '',
      employmentStatus: 'Active',
      experienceYears: '5',
      workShift: 'Day',
      weeklyOff: 'Sunday',
      attendanceType: 'Biometric',
      biometricId: `BIO-${empId.replace(/\D/g, '')}`,
      employeeCode: `CODE-${empId}`,
      staffRole: '',

      qualifications: qualificationDefaults,

      primarySubject: '',
      secondarySubject: '',
      classTeacher: false,
      multipleClasses: [],
      section: '',
      academicYear,
      timetableAssignment: '',
      workloadHours: '',
      subjectsHandled: [],
      classIncharge: '',
      maxPeriods: '',
      labAssigned: '',
      houseAssigned: '',
      clubAssignment: '',
      mentorStudents: false,

      salaryStructure: '',
      ...blankSalaryPreset,
      bankAccountHolderName: '',
      bankName: '',
      bankBranch: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      upiId: '',
      salaryCreditDate: '01',
      paymentMode: 'Bank Transfer',
      pfApplicable: true,
      esiApplicable: false,
      professionalTaxApplicable: true,
      tdsApplicable: false,
      payrollFrequency: 'Monthly',
      payrollStatus: 'Draft',
      salaryOverride: false,
      salaryEffectiveDate: '',
      salaryRevisionDate: '',

      documents: [],
      notes: ''
    } as RegistrationForm;
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<RegistrationForm>(() => buildDefaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftLoaded, setDraftLoaded] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const qualificationInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (!raw) {
        setDraftLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.form) {
        const base = buildDefaultForm();
        setForm({
          ...base,
          ...parsed.form,
          qualifications: Array.isArray(parsed.form.qualifications) && parsed.form.qualifications.length > 0 ? parsed.form.qualifications : base.qualifications,
          documents: Array.isArray(parsed.form.documents) && parsed.form.documents.length > 0 ? parsed.form.documents : base.documents
        });
      }
      if (typeof parsed?.step === 'number') {
        setCurrentStep(Math.min(stepMeta.length - 1, Math.max(0, parsed.step)));
      }
    } catch {
      // Ignore malformed drafts and fall back to defaults.
    } finally {
      setDraftLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const nextEmpId = getUniqueEmpId();
    setForm(prev => {
      if (prev.empId) return prev;
      return {
        ...prev,
        empId: nextEmpId,
        biometricId: `BIO-${nextEmpId.replace(/\D/g, '')}`,
        employeeCode: `CODE-${nextEmpId}`
      };
    });
  }, [draftLoaded]);

  const departmentOptions = form.employeeCategory ? buildTeacherDepartmentOptions(form.employeeCategory) : [];
  const designationOptions = buildDesignationOptions(form.employeeCategory);
  const classOptions = academicClasses.map((cls: any) => cls.name || cls.className || cls.id).filter(Boolean);
  const subjectOptions = subjects.map(s => s.name).filter(Boolean);
  const reportingManagerOptions = useMemo(() => {
    const managers = Array.from(new Set(staff.map(member => member.name).filter((name): name is string => Boolean(name))));
    return managers.length > 0 ? managers : ['Principal', 'Vice Principal', 'HR Manager'];
  }, [staff]);
  const documentRequirements = useMemo(() => getDocumentRequirements(form.employeeCategory), [form.employeeCategory]);
  const requiredDocTypes = useMemo(() => documentRequirements.filter(item => item.required).map(item => item.label), [documentRequirements]);
  const salaryStructureOptionsForDesignation = useMemo(
    () => buildSalaryStructureOptions(form.employeeCategory, form.designation),
    [form.designation, form.employeeCategory]
  );

  const allowancesTotal = useMemo(() => {
    const values = [
      form.hra,
      form.da,
      form.specialAllowance,
      form.medicalAllowance,
      form.travelAllowance,
      form.foodAllowance,
      form.conveyance,
      form.performanceAllowance,
      form.otherAllowances
    ];
    return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [form]);

  const deductionsTotal = useMemo(() => {
    const values = [
      form.employeePF,
      form.esi,
      form.professionalTax,
      form.incomeTax,
      form.loanDeduction,
      form.otherDeduction
    ];
    return values.reduce((sum, value) => sum + (Number(value) || 0), 0);
  }, [form]);

  const grossSalaryValue = Number(form.grossSalary) || 0;
  const netSalaryValue = grossSalaryValue + allowancesTotal - deductionsTotal;
  const ctcValue = grossSalaryValue + allowancesTotal + (Number(form.employerPF) || 0);

  const currentSalaryPreset = useMemo(() => {
    if (!form.salaryStructure || !form.employeeCategory || !form.designation) return null;
    return getSalaryPreset(form.employeeCategory, form.designation, form.salaryStructure);
  }, [form.designation, form.employeeCategory, form.salaryStructure]);

  const documentChecklist = useMemo(() => {
    return documentRequirements.map(req => {
      const slot = form.documents.find(doc => matchesRequiredDoc(doc, req.label));
      return { req, slot };
    });
  }, [documentRequirements, form.documents]);

  const completedRequiredDocs = documentChecklist.filter(item => item.req.required && item.slot && item.slot.file).length;
  const completedQualifications = form.qualifications.filter(
    row => row.degree.trim() || row.university.trim() || row.year.trim() || row.percentage.trim() || row.certificate
  ).length;
  const totalProgress = Math.min(100, Math.round(((currentStep + 1) / stepMeta.length) * 100));

  const setField = <K extends keyof RegistrationForm,>(key: K, value: RegistrationForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const setQualificationRow = (id: string, updates: Partial<QualificationRow>) => {
    setForm(prev => ({
      ...prev,
      qualifications: prev.qualifications.map(row => (row.id === id ? { ...row, ...updates } : row))
    }));
  };

  const addQualificationRow = () => {
    setForm(prev => ({
      ...prev,
      qualifications: [
        ...prev.qualifications,
        {
          id: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          degree: '',
          university: '',
          year: '',
          percentage: '',
          certificate: null
        }
      ]
    }));
  };

  const removeQualificationRow = (id: string) => {
    setForm(prev => ({
      ...prev,
      qualifications: prev.qualifications.length > 1 ? prev.qualifications.filter(row => row.id !== id) : prev.qualifications
    }));
  };

  const updateDocumentSlot = (id: string, file: AttachmentSnapshot | null) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.map(doc => (doc.id === id ? { ...doc, file } : doc))
    }));
  };

  const updatePhoto = (file: AttachmentSnapshot | null) => {
    setForm(prev => ({ ...prev, photo: file }));
  };

  const applySalaryPreset = (category: EmployeeCategorySelection, designation: string, structureName: string, keepOverride = false) => {
    const preset = getSalaryPreset(category, designation, structureName);
    setForm(prev => ({
      ...prev,
      salaryStructure: structureName,
      salaryEffectiveDate: prev.salaryEffectiveDate || todayString(),
      ...preset,
      salaryOverride: keepOverride ? prev.salaryOverride : false
    }));
  };

  const handleEmployeeCategoryChange = (nextCategory: EmployeeCategorySelection) => {
    setForm(prev => ({
      ...prev,
      employeeCategory: nextCategory,
      department: '',
      designation: '',
      staffRole: nextCategory === 'Teacher' ? 'Teacher' : nextCategory === 'Staff' ? 'Staff' : '',
      primarySubject: nextCategory === 'Teacher' ? prev.primarySubject : '',
      secondarySubject: nextCategory === 'Teacher' ? prev.secondarySubject : '',
      classTeacher: nextCategory === 'Teacher',
      multipleClasses: nextCategory === 'Teacher' ? prev.multipleClasses : [],
      subjectsHandled: nextCategory === 'Teacher' ? prev.subjectsHandled : [],
      classIncharge: nextCategory === 'Teacher' ? prev.classIncharge : '',
      labAssigned: nextCategory === 'Teacher' ? prev.labAssigned : '',
      houseAssigned: nextCategory === 'Teacher' ? prev.houseAssigned : '',
      clubAssignment: nextCategory === 'Teacher' ? prev.clubAssignment : '',
      mentorStudents: nextCategory === 'Teacher' ? prev.mentorStudents : false,
      salaryStructure: '',
      ...blankSalaryPreset,
      salaryOverride: false,
      salaryEffectiveDate: '',
      documents: buildDocumentSlots(nextCategory, prev.documents)
    }));
  };

  const handleSalaryStructureChange = (nextStructure: string) => {
    if (!form.employeeCategory || !form.designation || !nextStructure) {
      setForm(prev => ({
        ...prev,
        salaryStructure: '',
        ...blankSalaryPreset,
        salaryOverride: false,
        salaryEffectiveDate: ''
      }));
      return;
    }
    applySalaryPreset(form.employeeCategory, form.designation, nextStructure, true);
  };

  const handleDepartmentChange = (nextDepartment: string) => {
    setForm(prev => ({
      ...prev,
      department: nextDepartment
    }));
  };

  const handleDesignationChange = (nextDesignation: string) => {
    setForm(prev => ({
      ...prev,
      designation: nextDesignation,
      salaryStructure: '',
      ...blankSalaryPreset,
      salaryOverride: false,
      salaryEffectiveDate: ''
    }));
  };

  const handleMultiToggle = (field: 'multipleClasses' | 'subjectsHandled', value: string) => {
    setForm(prev => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
      return { ...prev, [field]: next } as RegistrationForm;
    });
  };

  const validateStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    const require = (field: string, condition: boolean, message: string) => {
      if (!condition) nextErrors[field] = message;
    };

    if (step === 0 || step === 5) {
      require('employeeCategory', !!form.employeeCategory, 'Employee category is required.');
      require('photo', !!form.photo, 'Profile photo is required.');
      require('firstName', !!form.firstName.trim(), 'First name is required.');
      require('lastName', !!form.lastName.trim(), 'Last name is required.');
      require('mobileNumber', !!form.mobileNumber.trim(), 'Mobile number is required.');
      require('email', !!form.email.trim(), 'Email address is required.');
      require('dob', !!form.dob.trim(), 'Date of birth is required.');
    }

    if (step === 1 || step === 5) {
      require('branch', !!form.branch.trim(), 'Branch is required.');
      require('department', !!form.department.trim(), 'Department is required.');
      require('designation', !!form.designation.trim(), 'Designation is required.');
      require('reportingManager', !!form.reportingManager.trim(), 'Reporting manager is required.');
      require('joiningDate', !!form.joiningDate.trim(), 'Joining date is required.');
      require('employmentStatus', !!form.employmentStatus, 'Employment status is required.');
      require('experienceYears', !!form.experienceYears.trim(), 'Experience is required.');
    }

    if ((step === 2 || step === 5) && form.qualifications.length > 0) {
      const firstQualification = form.qualifications[0];
      require('qualification.degree', !!firstQualification.degree.trim(), 'At least one qualification degree is required.');
      require('qualification.university', !!firstQualification.university.trim(), 'Qualification university is required.');
      require('qualification.year', !!firstQualification.year.trim(), 'Qualification year is required.');
    }

    if ((step === 3 || step === 5) && form.employeeCategory === 'Teacher') {
      require('primarySubject', !!form.primarySubject.trim(), 'Primary subject is required.');
      require('academicYear', !!form.academicYear.trim(), 'Academic year is required.');
      require('multipleClasses', form.multipleClasses.length > 0, 'Select at least one class.');
    }

    if (step === 4 || step === 5) {
      const missingRequired = documentChecklist
        .filter(item => item.req.required && (!item.slot || !item.slot.file))
        .map(item => item.req.label);
      if (missingRequired.length > 0) {
        nextErrors.documents = `Missing required documents: ${missingRequired.slice(0, 3).join(', ')}${missingRequired.length > 3 ? '...' : ''}`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(step => Math.min(step + 1, stepMeta.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('warning', 'Please fix the highlighted fields', 'Some required values are missing before moving forward.');
    }
  };

  const handleBackStep = () => {
    setCurrentStep(step => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDraft = () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({ form, step: currentStep, savedAt: new Date().toISOString() }));
    addToast('info', 'Draft Saved', 'Your staff registration draft has been saved locally.');
  };

  const handleDiscard = () => {
    if (!window.confirm('Discard this staff registration draft?')) return;
    localStorage.removeItem(draftStorageKey);
    setForm(buildDefaultForm());
    setCurrentStep(0);
    setErrors({});
    onNavigate('staff-directory');
  };

  const handleComplete = () => {
    if (!validateStep(stepMeta.length - 1)) {
      addToast('warning', 'Registration incomplete', 'Please complete the highlighted fields before submitting.');
      return;
    }

    const qualificationSummary = form.qualifications
      .map(q => q.degree.trim())
      .filter(Boolean)
      .join(', ') || 'Bachelor Degree';

    const qualificationDocs = form.qualifications
      .filter(q => q.certificate)
      .map((q, idx) => ({
        id: `QDOC-${Date.now()}-${idx}`,
        title: q.degree ? `${q.degree} Certificate` : 'Qualification Certificate',
        type: 'Degree Certificate' as StaffDocType,
        fileUrl: q.certificate!.fileUrl,
        uploadedDate: q.certificate!.uploadedDate,
        uploadedBy: user?.name || 'HR Admin',
        verificationStatus: 'Pending Verification' as const,
        isRequired: true
      }));

    const documentPayload = [
      form.photo
        ? {
            id: `PDOC-${Date.now()}`,
            title: 'Profile Photo',
            type: 'Other' as const,
            fileUrl: form.photo.fileUrl,
            uploadedDate: form.photo.uploadedDate,
            uploadedBy: user?.name || 'HR Admin',
            verificationStatus: 'Pending Verification' as const,
            isRequired: true
          }
        : null,
      ...form.documents
        .filter(doc => doc.file)
        .map((doc, idx) => ({
          id: `DDOC-${Date.now()}-${idx}`,
          title: doc.label,
          type: doc.type,
          fileUrl: doc.file!.fileUrl,
          uploadedDate: doc.file!.uploadedDate,
          uploadedBy: user?.name || 'HR Admin',
          verificationStatus: 'Pending Verification' as const,
          isRequired: doc.required
        }))
    ].filter(Boolean) as StaffDocument[];

    const uniqueAssignedSubjects = Array.from(
      new Set(
        [form.primarySubject, form.secondarySubject, ...form.subjectsHandled]
          .map(value => value.trim())
          .filter(Boolean)
      )
    );

    const payload: Omit<Staff, 'id'> = {
      empId: form.empId,
      employeeCategory: form.employeeCategory,
      branch: form.branch,
      name: `${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      role: form.staffRole.trim() || (form.employeeCategory === 'Teacher' ? 'Teacher' : 'Staff'),
      email: form.email.trim(),
      phone: form.mobileNumber.trim(),
      gender: form.gender,
      dob: form.dob,
      joiningDate: form.joiningDate,
      qualification: qualificationSummary,
      highestQualification: qualificationSummary,
      experienceYears: Number(form.experienceYears) || 0,
      salary: 0,
      status: mapEmploymentStatus(form.employmentStatus),
      avatar: form.photo?.fileUrl || defaultAvatar,
      address: buildAddress(form),
      assignedClasses: form.employeeCategory === 'Teacher' ? form.multipleClasses : [],
      assignedSubjects: form.employeeCategory === 'Teacher' ? uniqueAssignedSubjects : [],
      primarySubject: form.employeeCategory === 'Teacher' ? form.primarySubject : undefined,
      secondarySubject: form.employeeCategory === 'Teacher' ? form.secondarySubject : undefined,
      specialization: form.employeeCategory === 'Teacher' ? uniqueAssignedSubjects.join(', ') || form.designation : form.designation,
      teacherCode: form.employeeCode,
      documents: [...qualificationDocs, ...documentPayload].filter(Boolean),
      bankDetails: {
        accountHolderName: form.bankAccountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankName: form.bankName.trim(),
        branch: form.bankBranch.trim(),
        ifscCode: form.ifscCode.trim(),
        upiId: form.upiId.trim()
      },
      leaveBalance: {
        casual: form.employeeCategory === 'Teacher' ? 10 : 8,
        sick: form.employeeCategory === 'Teacher' ? 10 : 8,
        paid: form.employeeCategory === 'Teacher' ? 15 : 12
      },
      dailyWorkloadLimit: form.employeeCategory === 'Teacher' ? Number(form.maxPeriods) || 6 : undefined,
      weeklyWorkloadLimit: form.employeeCategory === 'Teacher' ? Number(form.workloadHours) || 24 : undefined,
      availableWorkingDays: form.employeeCategory === 'Teacher' ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : undefined,
      isClassTeacherEligible: form.employeeCategory === 'Teacher',
    } as Staff;

    addStaff(payload);
    localStorage.removeItem(draftStorageKey);
    addToast('success', 'Staff Registered Successfully', `${payload.firstName} ${payload.lastName} has been added to the directory.`);
    onNavigate('staff-directory');
  };

  const currentStepMeta = stepMeta[currentStep];
  const StepIcon = currentStepMeta.icon;
  const activePayrollPreview = [
    { label: 'Gross Salary', value: grossSalaryValue },
    { label: 'Allowances', value: allowancesTotal },
    { label: 'Deductions', value: deductionsTotal },
    { label: 'Net Salary', value: netSalaryValue }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            <SectionCard
              title="Identity & Contact"
              subtitle="Capture the employee's identity, contact details, and core personal information."
              icon={UserRound}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Employee Category"
                  value={form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : ''}
                  onChange={value => handleEmployeeCategoryChange(getEmployeeCategoryFromLabel(value))}
                  options={employeeCategoryOptions.map(option => getEmployeeCategoryLabel(option))}
                  placeholder="Select Employee Category"
                  required
                  error={errors.employeeCategory}
                />
                <TextField
                  label="Employee ID"
                  value={form.empId}
                  onChange={value => setField('empId', value)}
                  readOnly
                  hint="Auto-generated from the master staff register."
                />
                <TextField
                  label="First Name"
                  value={form.firstName}
                  onChange={value => setField('firstName', value)}
                  required
                  error={errors.firstName}
                  placeholder="Enter first name"
                />
                <TextField
                  label="Middle Name"
                  value={form.middleName}
                  onChange={value => setField('middleName', value)}
                  placeholder="Optional"
                />
                <TextField
                  label="Last Name"
                  value={form.lastName}
                  onChange={value => setField('lastName', value)}
                  required
                  error={errors.lastName}
                  placeholder="Enter last name"
                />
                <SelectField
                  label="Gender"
                  value={form.gender}
                  onChange={value => setField('gender', value as RegistrationForm['gender'])}
                  options={genders}
                  required
                  error={errors.gender}
                />
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={value => setField('dob', value)}
                  required
                  error={errors.dob}
                />
                <SelectField
                  label="Blood Group"
                  value={form.bloodGroup}
                  onChange={value => setField('bloodGroup', value)}
                  options={bloodGroups}
                  placeholder="Select blood group"
                />
                <TextField
                  label="Aadhaar Number"
                  value={form.aadhaarNumber}
                  onChange={value => setField('aadhaarNumber', value)}
                  placeholder="XXXX XXXX XXXX"
                />
                <TextField
                  label="PAN Number"
                  value={form.panNumber}
                  onChange={value => setField('panNumber', value.toUpperCase())}
                  placeholder="ABCDE1234F"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Family & Contact"
              subtitle="Add the primary and alternate contact details used by HR and school administration."
              icon={Users}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Mobile Number"
                  value={form.mobileNumber}
                  onChange={value => setField('mobileNumber', value)}
                  required
                  error={errors.mobileNumber}
                  placeholder="+91..."
                />
                <TextField
                  label="Alternate Mobile"
                  value={form.alternateMobile}
                  onChange={value => setField('alternateMobile', value)}
                  placeholder="Optional alternate number"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={value => setField('email', value)}
                  required
                  error={errors.email}
                  placeholder="teacher@school.edu"
                />
                <TextField
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={value => setField('fatherName', value)}
                  placeholder="Optional"
                />
                <TextField
                  label="Mother's Name"
                  value={form.motherName}
                  onChange={value => setField('motherName', value)}
                  placeholder="Optional"
                />
                <SelectField
                  label="Marital Status"
                  value={form.maritalStatus}
                  onChange={value => setField('maritalStatus', value)}
                  options={maritalStatuses}
                  placeholder="Select status"
                />
                <SelectField
                  label="Nationality"
                  value={form.nationality}
                  onChange={value => setField('nationality', value)}
                  options={['Indian', 'Other']}
                  placeholder="Select nationality"
                />
                <SelectField
                  label="Religion"
                  value={form.religion}
                  onChange={value => setField('religion', value)}
                  options={religions}
                  placeholder="Select religion"
                />
                <SelectField
                  label="Category"
                  value={form.casteCategory}
                  onChange={value => setField('casteCategory', value)}
                  options={casteCategories}
                  placeholder="Select category"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Address & Photo"
              subtitle="Document the residential and permanent address, then capture the profile photo."
              icon={Building2}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextAreaField
                    label="Residential Address"
                    value={form.residentialAddress}
                    onChange={value => setField('residentialAddress', value)}
                    placeholder="Residential address"
                    rows={4}
                    className="md:col-span-2"
                  />
                  <TextAreaField
                    label="Permanent Address"
                    value={form.permanentAddress}
                    onChange={value => setField('permanentAddress', value)}
                    placeholder="Permanent address"
                    rows={4}
                    className="md:col-span-2"
                  />
                  <TextField
                    label="City"
                    value={form.city}
                    onChange={value => setField('city', value)}
                    placeholder="City"
                  />
                  <TextField
                    label="State"
                    value={form.state}
                    onChange={value => setField('state', value)}
                    placeholder="State"
                  />
                  <TextField
                    label="District"
                    value={form.district}
                    onChange={value => setField('district', value)}
                    placeholder="District"
                  />
                  <TextField
                    label="PIN Code"
                    value={form.pinCode}
                    onChange={value => setField('pinCode', value)}
                    placeholder="PIN Code"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Profile Photo</p>
                      <p className="text-[10px] text-slate-500">Upload a clear professional photo.</p>
                    </div>
                    {form.photo ? <Badge variant="success" size="sm">Uploaded</Badge> : <Badge variant="warning" size="sm">Required</Badge>}
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={form.photo?.fileUrl || defaultAvatar}
                      alt="Profile preview"
                      className="w-28 h-28 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-4 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold inline-flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </button>
                      {form.photo && (
                        <button
                          type="button"
                          onClick={() => updatePhoto(null)}
                          className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        updatePhoto(await createAttachmentSnapshot(file, 'Uploaded'));
                        e.currentTarget.value = '';
                      }}
                    />
                    {form.photo && (
                      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{form.photo.fileName}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {form.photo.fileSize} | {form.photo.uploadedDate}
                            </p>
                          </div>
                          <Badge variant="neutral" size="sm">{form.photo.status}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            <SectionCard
              title="Employment Information"
              subtitle="Configure the branch, department, designation, and employment terms."
              icon={Briefcase}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Branch"
                  value={form.branch}
                  onChange={value => setField('branch', value)}
                  options={branches}
                  placeholder="Select Branch"
                  required
                  error={errors.branch}
                />
                <SelectField
                  label="Department"
                  value={form.department}
                  onChange={handleDepartmentChange}
                  options={departmentOptions}
                  placeholder="Select Department"
                  readOnly={!form.employeeCategory}
                  required
                  error={errors.department}
                />
                <SelectField
                  label="Designation"
                  value={form.designation}
                  onChange={handleDesignationChange}
                  options={designationOptions}
                  placeholder="Select Designation"
                  readOnly={!form.employeeCategory}
                  required
                  error={errors.designation}
                />
                <SelectField
                  label="Employment Type"
                  value={form.employeeType}
                  onChange={value => setField('employeeType', value)}
                  options={employeeTypes}
                />
                <TextField
                  label="Date of Joining"
                  type="date"
                  value={form.joiningDate}
                  onChange={value => setField('joiningDate', value)}
                  required
                  error={errors.joiningDate}
                />
                <TextField
                  label="Confirmation Date"
                  type="date"
                  value={form.confirmationDate}
                  onChange={value => setField('confirmationDate', value)}
                />
                <SelectField
                  label="Reporting Manager"
                  value={form.reportingManager}
                  onChange={value => setField('reportingManager', value)}
                  options={reportingManagerOptions}
                  placeholder="Select Reporting Manager"
                  required
                  error={errors.reportingManager}
                />
                <SelectField
                  label="Status"
                  value={form.employmentStatus}
                  onChange={value => setField('employmentStatus', value as EmploymentStatus)}
                  options={employmentStatuses}
                  required
                  error={errors.employmentStatus}
                />
                <TextField
                  label="Experience"
                  value={form.experienceYears}
                  onChange={value => setField('experienceYears', value)}
                  required
                  error={errors.experienceYears}
                  placeholder="Years of experience"
                />
                <SelectField
                  label="Shift"
                  value={form.workShift}
                  onChange={value => setField('workShift', value)}
                  options={workShifts}
                />
                <SelectField
                  label="Weekly Off"
                  value={form.weeklyOff}
                  onChange={value => setField('weeklyOff', value)}
                  options={weeklyOffs}
                />
                <SelectField
                  label="Attendance Type"
                  value={form.attendanceType}
                  onChange={value => setField('attendanceType', value)}
                  options={attendanceTypes}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Identifiers"
              subtitle="Employee codes are generated automatically for internal tracking."
              icon={School2}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  label="Biometric ID"
                  value={form.biometricId}
                  onChange={value => setField('biometricId', value)}
                  readOnly
                  hint="Auto-generated from the employee ID."
                />
                <TextField
                  label="Employee Code"
                  value={form.employeeCode}
                  onChange={value => setField('employeeCode', value)}
                  readOnly
                  hint="Internal employee code."
                />
                <SelectField
                  label="Staff Role"
                  value={form.staffRole}
                  onChange={value => setField('staffRole', value)}
                  options={form.employeeCategory === 'Teacher'
                    ? ['Teacher', 'Principal', 'Head Teacher', 'Coordinator']
                    : ['Staff', 'Administrator', 'HR', 'Accountant', 'Librarian']}
                />
              </div>
            </SectionCard>

            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Teaching / Non-Teaching</p>
                <p className="text-[11px] text-slate-500">
                  Current category: <span className="font-bold text-slate-900 dark:text-white">{form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Select Category'}</span>
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant={form.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">
                  {form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Select Category'}
                </Badge>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <SectionCard
              title="Qualification Records"
              subtitle="Capture all degrees, institutions, and upload certificates for each qualification."
              icon={GraduationCap}
              action={
                <button
                  type="button"
                  onClick={addQualificationRow}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Qualification
                </button>
              }
            >
              <div className="space-y-4">
                {form.qualifications.map((row, index) => (
                  <div key={row.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Qualification {index + 1}</p>
                        <p className="text-[10px] text-slate-500">Record the degree and proof of completion.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQualificationRow(row.id)}
                        className="px-3 py-2 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 inline-flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField
                        label="Degree"
                        value={row.degree}
                        onChange={value => setQualificationRow(row.id, { degree: value })}
                        required={index === 0}
                        error={index === 0 ? errors['qualification.degree'] : undefined}
                        placeholder="e.g. M.Sc. Mathematics"
                      />
                      <TextField
                        label="University / Board"
                        value={row.university}
                        onChange={value => setQualificationRow(row.id, { university: value })}
                        required={index === 0}
                        error={index === 0 ? errors['qualification.university'] : undefined}
                        placeholder="University or board"
                      />
                      <TextField
                        label="Passing Year"
                        value={row.year}
                        onChange={value => setQualificationRow(row.id, { year: value })}
                        required={index === 0}
                        error={index === 0 ? errors['qualification.year'] : undefined}
                        placeholder="2026"
                      />
                      <TextField
                        label="Percentage"
                        value={row.percentage}
                        onChange={value => setQualificationRow(row.id, { percentage: value })}
                        placeholder="93%"
                      />
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">Certificate Upload</p>
                          <p className="text-[10px] text-slate-500">Attach the qualification certificate or mark sheet.</p>
                        </div>
                        {row.certificate ? <Badge variant="success" size="sm">Uploaded</Badge> : <Badge variant="warning" size="sm">Missing</Badge>}
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
                        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-xs text-slate-500">
                          {row.certificate ? (
                            <div className="space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{row.certificate.fileName}</p>
                              <p>{row.certificate.fileSize} | Uploaded {row.certificate.uploadedDate}</p>
                            </div>
                          ) : (
                            'No certificate uploaded yet.'
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => qualificationInputRefs.current[row.id]?.click()}
                            className="px-4 py-2 rounded-2xl bg-brand-600 text-white text-xs font-bold inline-flex items-center gap-2"
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload
                          </button>
                          {row.certificate && (
                            <button
                              type="button"
                              onClick={() => setQualificationRow(row.id, { certificate: null })}
                              className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-2"
                            >
                              <X className="w-3.5 h-3.5" /> Clear
                            </button>
                          )}
                        </div>
                        <input
                          ref={el => { qualificationInputRefs.current[row.id] = el; }}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setQualificationRow(row.id, { certificate: await createAttachmentSnapshot(file, 'Uploaded') });
                            e.currentTarget.value = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            {form.employeeCategory === 'Teacher' ? (
              <>
                <SectionCard
                  title="Teaching Assignment"
                  subtitle="Map the primary and secondary subjects for the teacher."
                  icon={BookOpen}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Primary Subject"
                      value={form.primarySubject}
                      onChange={value => setField('primarySubject', value)}
                      options={subjectOptions.length > 0 ? subjectOptions : [form.department]}
                      required
                      error={errors.primarySubject}
                    />
                    <SelectField
                      label="Secondary Subject"
                      value={form.secondarySubject}
                      onChange={value => setField('secondarySubject', value)}
                      options={subjectOptions.length > 0 ? subjectOptions : ['']}
                      placeholder="Optional"
                    />
                    <SelectField
                      label="Section"
                      value={form.section}
                      onChange={value => setField('section', value)}
                      options={['A', 'B', 'C', 'D']}
                    />
                    <TextField
                      label="Academic Year"
                      value={form.academicYear}
                      onChange={value => setField('academicYear', value)}
                      required
                      error={errors.academicYear}
                      placeholder="2026-2027"
                    />
                    <SelectField
                      label="Timetable Assignment"
                      value={form.timetableAssignment}
                      onChange={value => setField('timetableAssignment', value)}
                      options={['Auto', 'Manual', 'Fixed']}
                    />
                    <TextField
                      label="Workload Hours"
                      value={form.workloadHours}
                      onChange={value => setField('workloadHours', value)}
                      placeholder="Weekly workload"
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Class Allocation"
                  subtitle="Select the classes, class teacher role, and subject workload."
                  icon={School2}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ChipSelect
                      label="Multiple Classes"
                      options={classOptions.length > 0 ? classOptions : ['Class 1', 'Class 2', 'Class 3', 'Class 4']}
                      selected={form.multipleClasses}
                      onToggle={value => handleMultiToggle('multipleClasses', value)}
                      required
                      error={errors.multipleClasses}
                      hint="Choose all classes taught by this teacher."
                    />
                    <ChipSelect
                      label="Subjects Handled"
                      options={subjectOptions.length > 0 ? subjectOptions : [form.primarySubject]}
                      selected={form.subjectsHandled}
                      onToggle={value => handleMultiToggle('subjectsHandled', value)}
                      hint="Mark every subject this teacher is eligible to handle."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <ToggleField
                      label="Class Teacher"
                      checked={form.classTeacher}
                      onChange={value => setField('classTeacher', value)}
                      hint="Mark if the teacher will own a homeroom class."
                    />
                    <TextField
                      label="Class Incharge"
                      value={form.classIncharge}
                      onChange={value => setField('classIncharge', value)}
                      placeholder="Optional"
                    />
                    <TextField
                      label="Maximum Periods"
                      value={form.maxPeriods}
                      onChange={value => setField('maxPeriods', value)}
                      placeholder="Periods per day"
                    />
                    <TextField
                      label="Lab Assigned"
                      value={form.labAssigned}
                      onChange={value => setField('labAssigned', value)}
                      placeholder="Optional"
                    />
                    <TextField
                      label="House Assigned"
                      value={form.houseAssigned}
                      onChange={value => setField('houseAssigned', value)}
                      placeholder="Optional"
                    />
                    <TextField
                      label="Club Assignment"
                      value={form.clubAssignment}
                      onChange={value => setField('clubAssignment', value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="mt-4">
                    <ToggleField
                      label="Mentor Students"
                      checked={form.mentorStudents}
                      onChange={value => setField('mentorStudents', value)}
                      hint="Assign this teacher as a student mentor."
                    />
                  </div>
                </SectionCard>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-8 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Subject Allocation is not required</h3>
                <p className="text-sm text-slate-500 max-w-2xl mx-auto">
                  This step is reserved for teaching staff. If you switch the employee category to Non-Teaching Staff, the subject allocation section is automatically skipped.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <SectionCard
              title="Documents"
              subtitle="Upload the employee compliance files. Required documents are derived from the selected employee category."
              icon={FileText}
            >
              <div className="space-y-5">
                {documentChecklist.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-8 text-center">
                    <p className="text-sm font-black text-slate-900 dark:text-white">No documents uploaded</p>
                    <p className="mt-2 text-xs text-slate-500">Select an employee category to load the relevant document checklist.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <UploadCard
                      title="Passport Photo"
                      required
                      file={form.photo}
                      onUpload={async file => updatePhoto(await createAttachmentSnapshot(file, 'Uploaded'))}
                      onRemove={() => updatePhoto(null)}
                      inputRef={photoInputRef}
                      note="Captured in Personal Details and reused across the staff profile."
                    />
                    {documentChecklist.map(item => (
                      <UploadCard
                        key={item.req.label}
                        title={item.req.label}
                        required={item.req.required}
                        file={item.slot?.file || null}
                        onUpload={async file => {
                          const slotId = item.slot?.id || `DOC-${normalize(item.req.label).replace(/\s+/g, '-').toUpperCase()}`;
                          const nextFile = await createAttachmentSnapshot(file, 'Pending Verification');
                          if (item.slot) {
                            updateDocumentSlot(slotId, nextFile);
                            return;
                          }
                          setForm(prev => ({
                            ...prev,
                            documents: [
                              ...prev.documents,
                              { id: slotId, label: item.req.label, type: item.req.type, required: item.req.required, file: nextFile }
                            ]
                          }));
                        }}
                        onRemove={() => {
                          if (item.slot) {
                            updateDocumentSlot(item.slot.id, null);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">Document status notes</p>
                    <p className="text-[11px] mt-1">
                      The system marks uploaded files as pending verification. HR can review them later from the staff profile.
                    </p>
                  </div>
                </div>
                {errors.documents && (
                  <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                    {errors.documents}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        );

      case 5:
      case 6:
      default:
        return (
          <div className="space-y-5">
            <SectionCard
              title="Review & Submit"
              subtitle="Verify every section before completing the registration."
              icon={CheckCircle2}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Personal Details',
                    step: 0,
                    lines: [
                      `Employee: ${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
                      `Employee ID: ${form.empId}`,
                      `Mobile: ${form.mobileNumber || 'Not set'}`,
                      `Email: ${form.email || 'Not set'}`
                    ]
                  },
                  {
                    title: 'Employment',
                    step: 1,
                    lines: [
                      `Branch: ${form.branch}`,
                      `Department: ${form.department}`,
                      `Designation: ${form.designation}`,
                      `Status: ${form.employmentStatus}`
                    ]
                  },
                  {
                    title: 'Qualification',
                    step: 2,
                    lines: form.qualifications.map(q => `${q.degree || 'Qualification'} | ${q.university || 'University'} | ${q.year || 'Year'}`)
                  },
                  {
                    title: 'Subjects',
                    step: 3,
                    lines: form.employeeCategory === 'Teacher'
                      ? [
                          `Primary Subject: ${form.primarySubject || 'Not set'}`,
                          `Classes: ${form.multipleClasses.join(', ') || 'None'}`,
                          `Subjects Handled: ${form.subjectsHandled.join(', ') || 'None'}`
                        ]
                      : ['Subject allocation skipped for non-teaching staff.']
                  },
                  {
                    title: 'Documents',
                    step: 4,
                    lines: [
                      `Required docs uploaded: ${completedRequiredDocs} / ${requiredDocTypes.length}`,
                      `Photo: ${form.photo ? 'Uploaded' : 'Missing'}`,
                      `Other docs attached: ${form.documents.filter(doc => doc.file).length}`
                    ]
                  },
                  {
                    title: 'Submission',
                    step: 5,
                    lines: [
                      `Employee category: ${form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Not selected'}`,
                      `Designation: ${form.designation || 'Not set'}`,
                      `Documents ready: ${completedRequiredDocs} / ${requiredDocTypes.length}`
                    ]
                  }
                ].map(section => (
                  <div key={section.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{section.title}</p>
                        <p className="text-[10px] text-slate-500">Step {section.step + 1}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(section.step)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {section.lines.map(line => (
                        <li key={line} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Final Readiness"
              subtitle="A quick readiness check before the profile is added to the staff directory."
              icon={CheckCircle2}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Profile Photo</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{form.photo ? 'Ready' : 'Missing'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Required Docs</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{completedRequiredDocs} / {requiredDocTypes.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                  <p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Designation</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{form.designation || 'Not set'}</p>
                </div>
              </div>
            </SectionCard>
          </div>
        );
    }
  };

  const currentPanelLabel = currentStepMeta.label;
  type StepMetaItem = (typeof stepMeta)[number];

  const renderStepButton = (step: StepMetaItem, index: number) => {
    const StepIcon = step.icon;
    const completed = index < currentStep;
    const active = index === currentStep;

    return (
      <button
        type="button"
        key={step.id}
        onClick={() => setCurrentStep(index)}
        className={`flex h-full min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border px-4 py-4 text-center transition-all ${
          active
            ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20'
            : completed
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : completed ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {completed ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] opacity-75 whitespace-nowrap">
            Step {index + 1}
          </p>
          <p className="mt-1 w-full truncate text-sm font-black">{step.label}</p>
        </div>
      </button>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 space-y-6 animate-in fade-in sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="rounded-[20px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-black/20 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => onNavigate('staff-directory')}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" size="sm">Faculty & Staff</Badge>
                  <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Staff Directory / Add Staff</span>
                </div>
                <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Add Staff</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Register a new staff member into the school management system with a complete ERP-ready profile.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-200 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white shadow-lg shadow-brand-500/20"
              >
                <CheckCircle2 className="h-4 w-4" /> Complete Registration
              </button>
            </div>
          </div>

          <div className="bg-slate-50/80 px-6 py-6 dark:bg-slate-900/50">
            <div className="flex w-full flex-col gap-6">
              <section className="w-full rounded-[20px] border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-950">
                <div className="overflow-x-auto pb-1">
                  <div className="grid min-w-[1120px] grid-cols-7 gap-4">
                    {stepMeta.map((step, index) => renderStepButton(step, index))}
                  </div>
                </div>
              </section>

              <section className="relative w-full flex flex-col gap-5 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Current Step</p>
                    <h2 className="mt-2 text-sm font-black text-slate-900 dark:text-white">{currentPanelLabel}</h2>
                  </div>
                  <Badge variant={form.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">
                    {form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Select Category'}
                  </Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-sky-500" style={{ width: `${totalProgress}%` }} />
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Qualifications</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{completedQualifications}</p>
                  </div>
                  <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Documents</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{completedRequiredDocs}/{requiredDocTypes.length}</p>
                  </div>
                  <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Designation</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{form.designation || 'Not set'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {renderStepContent()}

          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <button
              type="button"
              onClick={handleBackStep}
              disabled={currentStep === 0}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              {currentStep < stepMeta.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Registration
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <SectionCard
            title="Registration Snapshot"
            subtitle="A live preview of the new staff profile."
            icon={Sparkles}
          >
            <div className="flex items-center gap-4">
              <img
                src={form.photo?.fileUrl || defaultAvatar}
                alt="Profile preview"
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {form.firstName || 'First Name'} {form.lastName || 'Last Name'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{form.designation || 'Designation'} | {form.department || 'Department'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={form.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">
                    {form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Select Category'}
                  </Badge>
                  <Badge variant="success" size="sm">{form.empId}</Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Document Status"
            subtitle="Required document completion for the selected employee category."
            icon={ShieldCheck}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Required Uploaded</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">{completedRequiredDocs} / {requiredDocTypes.length}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-brand-600" style={{ width: `${requiredDocTypes.length > 0 ? Math.round((completedRequiredDocs / requiredDocTypes.length) * 100) : 0}%` }} />
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {documentChecklist.map(item => {
                  const required = !!item.slot?.file;
                  return (
                    <div key={item.req.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.req.label}</p>
                        <p className="text-[10px] text-slate-500">{required ? 'Attached' : 'Missing'}</p>
                      </div>
                      <Badge variant={required ? 'success' : 'warning'} size="sm">
                        {required ? 'Done' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notes"
            subtitle="Optional internal remarks."
            icon={FileText}
          >
            <TextAreaField
              label="Registration Notes"
              value={form.notes}
              onChange={value => setField('notes', value)}
              placeholder="Add any internal notes for HR..."
              rows={5}
            />
          </SectionCard>
        </aside>
      </div>
    </div>
  );
};

export default StaffRegistrationPage;
