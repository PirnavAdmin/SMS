import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  BasicStaffFormState,
  buildBasicStaffCreatePayload,
  defaultBasicStaffFormState,
  getNextEmployeeId,
  getDepartmentOptions,
  getDesignationOptions,
  normalizeStaffType
} from './staffFlowOptions';
import { BasicStaffFormFields } from './BasicStaffFormFields';

interface StaffRegistrationPageProps {
  onNavigate: (module: string) => void;
}

const getInitialCategory = (): string => {
  try {
    const globalVal = (window as any).staffRegistrationCategory;
    if (globalVal) return normalizeStaffType(globalVal);
  } catch {
    // Ignore
  }
  try {
    const saved = sessionStorage.getItem('staff-registration-category');
    if (saved) return normalizeStaffType(saved);
  } catch {
    // Ignore storage access issues.
  }
  return 'Teaching Staff';
};

export const StaffRegistrationPage: React.FC<StaffRegistrationPageProps> = ({ onNavigate }) => {
  const { staff, addStaff, departments, designations } = useData();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<BasicStaffFormState>(() => ({
    ...defaultBasicStaffFormState(getInitialCategory()),
    empId: getNextEmployeeId(staff)
  }));

  useEffect(() => {
    setForm(prev => (prev.empId ? prev : { ...prev, empId: getNextEmployeeId(staff) }));
  }, [staff]);

  const handleChange = (field: keyof BasicStaffFormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCategoryChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      employeeCategory: value,
      department: '',
      designation: ''
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const require = (key: string, condition: boolean, message: string) => {
      if (!condition) nextErrors[key] = message;
    };

    require('employeeCategory', !!form.employeeCategory, 'Staff Type is required.');
    require('firstName', !!form.firstName.trim(), 'First Name is required.');
    require('lastName', !!form.lastName.trim(), 'Last Name is required.');
    require('gender', !!form.gender, 'Gender is required.');
    require('dob', !!form.dob.trim(), 'Date of Birth is required.');
    require('bloodGroup', !!form.bloodGroup, 'Blood Group is required.');
    require('mobileNumber', !!form.mobileNumber.trim(), 'Mobile Number is required.');
    if (form.mobileNumber.trim()) {
      const localPart = form.mobileNumber.split('-').pop() || '';
      if (!/^\d{10}$/.test(localPart.replace(/[^\d]/g, ''))) {
        nextErrors.mobileNumber = 'Mobile number must be exactly 10 digits.';
      }
    }
    require('branch', !!form.branch.trim(), 'Branch is required.');
    require('department', !!form.department.trim(), 'Department is required.');
    require('designation', !!form.designation.trim(), 'Designation is required.');
    require('joiningDate', !!form.joiningDate.trim(), 'Date of Joining is required.');
    require('employmentType', !!form.employmentType.trim(), 'Employment Type is required.');
    require('status', !!form.status.trim(), 'Status is required.');
    require('presentAddress', !!form.presentAddress.trim(), 'Present Address is required.');
    if (!form.sameAsPresentAddress) {
      require('permanentAddress', !!form.permanentAddress.trim(), 'Permanent Address is required.');
    }
    require('city', !!form.city.trim(), 'City is required.');
    require('state', !!form.state.trim(), 'State is required.');
    require('pinCode', !!form.pinCode.trim(), 'PIN Code is required.');
    require('country', !!form.country.trim(), 'Country is required.');

    if (form.pinCode.trim() && !/^\d{6}$/.test(form.pinCode.trim())) {
      nextErrors.pinCode = 'PIN Code must be exactly 6 digits.';
    }

    require('aadhaarNumber', !!form.aadhaarNumber?.trim(), 'Aadhaar Number is required.');
    if (form.aadhaarNumber?.trim() && !/^\d{12}$/.test(form.aadhaarNumber.trim())) {
      nextErrors.aadhaarNumber = 'Aadhaar Number must be exactly 12 digits.';
    }

    require('panNumber', !!form.panNumber?.trim(), 'PAN Number is required.');
    if (form.panNumber?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.trim().toUpperCase())) {
      nextErrors.panNumber = 'Invalid PAN Number format (e.g. ABCDE1234F).';
    }

    // Email format check
    require('email', !!form.email.trim(), 'Email address is required.');
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Invalid email format.';
    }

    // Duplicate Staff ID Check
    if (form.empId && staff.some(s => s.empId && s.empId.toLowerCase() === form.empId.toLowerCase())) {
      nextErrors.empId = 'Staff ID already exists.';
    }

    // Duplicate Email Check
    if (form.email.trim() && staff.some(s => s.email && s.email.toLowerCase() === form.email.trim().toLowerCase())) {
      nextErrors.email = 'Email address is already registered.';
    }

    // Duplicate Mobile Check
    const cleanMobile = form.mobileNumber.replace(/\D/g, '');
    if (cleanMobile && staff.some(s => s.phone && s.phone.replace(/\D/g, '') === cleanMobile)) {
      nextErrors.mobileNumber = 'Mobile number is already registered.';
    }

    // Validate department & designation against staff type & department
    const allowedDepts = getDepartmentOptions(form.employeeCategory, departments);
    const allowedDesignations = getDesignationOptions(form.employeeCategory, form.department, designations);

    if (form.department && !allowedDepts.includes(form.department)) {
      nextErrors.department = `"${form.department}" is not a valid department for ${form.employeeCategory}.`;
    }

    if (form.designation && !allowedDesignations.includes(form.designation)) {
      nextErrors.designation = `"${form.designation}" is not a valid designation for ${form.department || form.employeeCategory}.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      addToast('warning', 'Please complete required fields', 'Check missing or invalid entries.');
      return;
    }

    setSubmitting(true);

    const isTeaching = normalizeStaffType(form.employeeCategory) === 'Teaching Staff';
    let duplicateConflict: any = null;
    if (isTeaching && form.designation && form.assignedSubjects && form.assignedSubjects.length > 0) {
      duplicateConflict = staff.find(s => {
        const category = s.employeeCategory || s.role || '';
        const isTeachingStaff = category === 'Teacher' || category === 'Teaching Staff';
        if (!isTeachingStaff) return false;
        if (s.designation?.trim().toLowerCase() !== form.designation.trim().toLowerCase()) return false;
        
        const otherSubjects = s.assignedSubjects || [];
        return (form.assignedSubjects || []).some(subj => 
          otherSubjects.some(os => os.trim().toLowerCase() === subj.trim().toLowerCase())
        );
      });
    }

    const payload = buildBasicStaffCreatePayload(form);
    const added = addStaff(payload);

    try {
      sessionStorage.removeItem('staff-registration-category');
    } catch {
      // Ignore session storage errors.
    }
    try {
      delete (window as any).staffRegistrationCategory;
    } catch {
      // Ignore
    }

    addToast(
      'success',
      'Employee created',
      `${added.firstName} ${added.lastName} has been added to the directory.`
    );

    if (duplicateConflict) {
      addToast(
        'warning',
        'Workload Conflict Detected',
        `${duplicateConflict.name || `${duplicateConflict.firstName} ${duplicateConflict.lastName}`} also teaches this subject as a ${duplicateConflict.designation}.`
      );
    }

    setSubmitting(false);
    onNavigate(isTeaching ? 'staff-directory' : 'staff-non-teaching');
  };

  return (
    <div className="space-y-3 animate-in fade-in pb-10 max-w-5xl mx-auto w-full text-xs">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate(normalizeStaffType(form.employeeCategory) === 'Teaching Staff' ? 'staff-directory' : 'staff-non-teaching')}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Add Staff</h1>
          </div>
        </div>
      </div>
 
      {/* Main 5-Section Stepper Form */}
      <form onSubmit={handleSubmit}>
        <BasicStaffFormFields
          value={form}
          errors={errors}
          onChange={handleChange}
          onCategoryChange={handleCategoryChange}
          employeeIdReadOnly
          isSubmitting={submitting}
        />
      </form>
    </div>
  );
};
