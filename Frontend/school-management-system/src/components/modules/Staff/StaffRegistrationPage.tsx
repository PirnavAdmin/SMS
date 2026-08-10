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
    require('mobileNumber', !!form.mobileNumber.trim(), 'Mobile Number is required.');
    require('branch', !!form.branch.trim(), 'Branch is required.');
    require('department', !!form.department.trim(), 'Department is required.');
    require('designation', !!form.designation.trim(), 'Designation is required.');
    require('joiningDate', !!form.joiningDate.trim(), 'Date of Joining is required.');
    require('employmentType', !!form.employmentType.trim(), 'Employment Type is required.');
    require('status', !!form.status.trim(), 'Status is required.');

    // Email format check
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Invalid email format.';
    }

    // Duplicate Staff ID Check
    if (form.empId && staff.some(s => s.empId.toLowerCase() === form.empId.toLowerCase())) {
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
    const payload = buildBasicStaffCreatePayload(form);
    const added = addStaff(payload);

    try {
      sessionStorage.removeItem('staff-registration-category');
    } catch {
      // Ignore session storage errors.
    }

    addToast(
      'success',
      'Employee created',
      `${added.firstName} ${added.lastName} has been added to the directory.`
    );
    setSubmitting(false);
    onNavigate('staff-directory');
  };

  return (
    <div className="space-y-3 animate-in fade-in pb-10 max-w-5xl mx-auto w-full text-xs">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('staff-directory')}
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
