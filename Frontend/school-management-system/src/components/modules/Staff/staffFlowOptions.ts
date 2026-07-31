import { Staff, StaffDocType } from '../../../types';

export type EmployeeCategory = 'Teacher' | 'Staff';
export type EmploymentType = 'Full Time' | 'Contract' | 'Part Time';

export const employeeCategoryLabelMap: Record<EmployeeCategory, string> = {
  Teacher: 'Teaching Staff',
  Staff: 'Non-Teaching Staff'
};

export const employeeCategoryOptions: { value: EmployeeCategory; label: string }[] = [
  { value: 'Teacher', label: 'Teaching Staff' },
  { value: 'Staff', label: 'Non-Teaching Staff' }
];

export const employmentTypeOptions: EmploymentType[] = ['Full Time', 'Contract', 'Part Time'];

export const branchOptions = ['Main Campus', 'North Campus', 'South Campus', 'West Campus', 'City Center'];

export const teachingDepartments = [
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
  'Pre-Primary',
  'Special Education',
  'Library'
];

export const nonTeachingDepartments = [
  'Administration',
  'Finance & Accounts',
  'Human Resources',
  'Transport',
  'Hostel Management',
  'Library',
  'Information Technology',
  'Maintenance',
  'Security',
  'Medical',
  'Housekeeping',
  'Stores & Inventory',
  'Admissions',
  'Facilities Management'
];


export interface DocumentRequirementSlot {
  label: string;
  required: boolean;
  type: StaffDocType | 'Other';
}

export const teachingDocumentRequirements: DocumentRequirementSlot[] = [
  { label: 'Passport Photo', required: true, type: 'Other' },
  { label: 'Aadhaar Card', required: true, type: 'Aadhaar Card' },
  { label: 'PAN Card', required: true, type: 'PAN Card' },
  { label: 'Degree Certificate', required: true, type: 'Degree Certificate' },
  { label: 'B.Ed./M.Ed. (if applicable)', required: false, type: 'B.Ed.' },
  { label: 'Experience Certificate', required: true, type: 'Experience Letter' },
  { label: 'Joining Letter', required: true, type: 'Offer Letter' },
  { label: 'Bank Passbook', required: true, type: 'Bank Passbook' }
];

export const nonTeachingDocumentRequirements: DocumentRequirementSlot[] = [
  { label: 'Passport Photo', required: true, type: 'Other' },
  { label: 'Aadhaar Card', required: true, type: 'Aadhaar Card' },
  { label: 'PAN Card', required: true, type: 'PAN Card' },
  { label: 'Qualification Certificate', required: true, type: 'Educational Certificates' },
  { label: 'Experience Certificate (optional)', required: false, type: 'Experience Letter' },
  { label: 'Bank Passbook', required: true, type: 'Bank Passbook' },
  { label: 'Joining Letter', required: true, type: 'Offer Letter' }
];

export interface BasicStaffFormState {
  employeeCategory: EmployeeCategory | '';
  empId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  branch: string;
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: EmploymentType | '';
  status: 'Active' | 'Inactive';
}

export const defaultBasicStaffFormState = (employeeCategory: EmployeeCategory | '' = 'Teacher'): BasicStaffFormState => ({
  employeeCategory,
  empId: '',
  firstName: '',
  lastName: '',
  email: '',
  mobileNumber: '',
  branch: '',
  department: '',
  designation: '',
  joiningDate: new Date().toISOString().split('T')[0],
  employmentType: '',
  status: 'Active'
});

export function getEmployeeCategoryLabel(category?: EmployeeCategory | '') {
  if (!category) return '';
  return employeeCategoryLabelMap[category];
}

export function getEmployeeCategoryFromLabel(label: string): EmployeeCategory | '' {
  if (label === employeeCategoryLabelMap.Teacher) return 'Teacher';
  if (label === employeeCategoryLabelMap.Staff) return 'Staff';
  return '';
}

export function getDepartmentOptions(category: EmployeeCategory | '') {
  return category === 'Teacher' ? teachingDepartments : category === 'Staff' ? nonTeachingDepartments : [];
}


export function getDocumentRequirements(category: EmployeeCategory | '') {
  return category === 'Teacher' ? teachingDocumentRequirements : category === 'Staff' ? nonTeachingDocumentRequirements : [];
}

export function getNextEmployeeId(staff: Staff[]) {
  const numbers = staff
    .map(item => {
      const match = (item.empId || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((value): value is number => Number.isFinite(value) && value > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `EMP${String(next).padStart(3, '0')}`;
}

export function buildBasicStaffCreatePayload(form: BasicStaffFormState): Omit<Staff, 'id'> {
  const employeeCategory = form.employeeCategory || 'Staff';
  return {
    empId: form.empId,
    employeeCategory,
    branch: form.branch,
    name: `${form.firstName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    designation: form.designation.trim(),
    department: form.department.trim(),
    role: employeeCategory === 'Teacher' ? 'Teacher' : 'Staff',
    email: form.email.trim(),
    phone: form.mobileNumber.trim(),
    gender: 'Male',
    dob: '',
    joiningDate: form.joiningDate,
    qualification: '',
    experienceYears: 0,
    salary: 0,
    status: form.status,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    address: '',
    assignedClasses: [],
    assignedSubjects: [],
    documents: [],
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: '',
      upiId: ''
    },
    leaveBalance: {
      casual: 0,
      sick: 0,
      paid: 0
    },
    profileStatus: 'Incomplete',
    employmentType: form.employmentType || 'Full Time'
  } as Omit<Staff, 'id'>;
}

export function buildBasicStaffUpdatePayload(form: BasicStaffFormState): Partial<Staff> {
  const employeeCategory = form.employeeCategory || 'Staff';
  return {
    empId: form.empId,
    employeeCategory,
    branch: form.branch,
    name: `${form.firstName} ${form.lastName}`.replace(/\s+/g, ' ').trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    designation: form.designation.trim(),
    department: form.department.trim(),
    role: employeeCategory === 'Teacher' ? 'Teacher' : 'Staff',
    email: form.email.trim(),
    phone: form.mobileNumber.trim(),
    joiningDate: form.joiningDate,
    status: form.status,
    employmentType: form.employmentType || 'Full Time'
  };
}
