import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
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
import { validate10DigitPhone } from '../../../utils/validation';

interface StaffRegistrationPageProps {
  onNavigate: (module: string) => void;
}

export const StaffRegistrationPage: React.FC<StaffRegistrationPageProps> = ({ onNavigate }) => {
  const { staff, addStaff, departments, designations, branches } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Clear any legacy session/window category storage on mount
  useEffect(() => {
    try {
      sessionStorage.removeItem('staff-registration-category');
    } catch {}
    try {
      delete (window as any).staffRegistrationCategory;
    } catch {}
  }, []);

  const [form, setForm] = useState<BasicStaffFormState>(() => {
    try {
      sessionStorage.removeItem('staff-registration-category');
    } catch {}
    try {
      delete (window as any).staffRegistrationCategory;
    } catch {}

    return {
      ...defaultBasicStaffFormState(''),
      employeeCategory: '',
      branch: '',
      empId: ''
    };
  });

  useEffect(() => {
    if (!form.employeeCategory) return;
    setForm(prev => {
      if (!prev.employeeCategory) return prev;
      const trimmed = (prev.empId || '').toLowerCase().trim();
      const isColliding = trimmed && staff.some(s => String(s.empId || (s as any).employeeId || '').toLowerCase().trim() === trimmed);
      if (!prev.empId || isColliding) {
        return { ...prev, empId: getNextEmployeeId(staff, prev.employeeCategory) };
      }
      return prev;
    });
  }, [staff, form.employeeCategory]);

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
      designation: '',
      empId: value ? getNextEmployeeId(staff, value) : ''
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
      const parts = form.mobileNumber.split('-');
      const cc = parts.length > 1 ? parts[0] : '+91';
      const localPart = (parts.length > 1 ? parts.slice(1).join('') : parts[0]).replace(/\D/g, '');
      if (cc === '+91') {
        const phoneRes = validate10DigitPhone(localPart);
        if (!phoneRes.isValid && phoneRes.error) {
          nextErrors.mobileNumber = phoneRes.error;
        }
      } else {
        if (localPart.length < 6 || localPart.length > 15) {
          nextErrors.mobileNumber = 'Enter a valid mobile number (6 to 15 digits).';
        }
      }
    }

    if (form.alternateMobileNumber?.trim()) {
      const parts = form.alternateMobileNumber.split('-');
      const cc = parts.length > 1 ? parts[0] : '+91';
      const localPart = (parts.length > 1 ? parts.slice(1).join('') : parts[0]).replace(/\D/g, '');
      if (localPart) {
        if (cc === '+91') {
          const phoneRes = validate10DigitPhone(localPart);
          if (!phoneRes.isValid && phoneRes.error) {
            nextErrors.alternateMobileNumber = phoneRes.error;
          }
        } else {
          if (localPart.length < 6 || localPart.length > 15) {
            nextErrors.alternateMobileNumber = 'Enter a valid alternate mobile number (6 to 15 digits).';
          }
        }
      }
    }
    require('branch', !!form.branch.trim(), 'Branch is required.');
    require('department', !!form.department.trim(), 'Department is required.');
    require('designation', !!form.designation.trim(), 'Designation is required.');
    require('joiningDate', !!form.joiningDate.trim(), 'Date of Joining is required.');
    require('employmentType', !!form.employmentType.trim(), 'Employment Type is required.');
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

    // Duplicate Employee ID Check
    require('empId', !!form.empId?.trim(), 'Employee ID is required.');
    if (form.empId?.trim()) {
      const trimmedEmpId = form.empId.trim().toLowerCase();
      const isDuplicate = staff.some(s => {
        const sEmpId = String(s.empId || (s as any).employeeId || '').toLowerCase().trim();
        return sEmpId === trimmedEmpId;
      });
      if (isDuplicate) {
        nextErrors.empId = 'Employee ID already exists. Please use a unique Employee ID.';
      }
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

    console.log("Full Submission Validation Errors:", nextErrors);
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validationErrors = validate();
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      const firstErrorMsg = validationErrors[errorKeys[0]];
      addToast('warning', 'Please complete required fields', firstErrorMsg || 'Check missing or invalid entries.');
      return;
    }

    setSubmitting(true);

    const isTeaching = normalizeStaffType(form.employeeCategory) === 'Teaching Staff';
    let duplicateConflict: any = null;
    if (isTeaching && form.designation && form.assignedSubjects && form.assignedSubjects.length > 0 && form.assignedClasses && form.assignedClasses.length > 0) {
      duplicateConflict = staff.find(s => {
        const category = s.employeeCategory || s.role || '';
        const isTeachingStaff = category === 'Teacher' || category === 'Teaching Staff';
        if (!isTeachingStaff) return false;
        if (s.designation?.trim().toLowerCase() !== form.designation.trim().toLowerCase()) return false;
        
        const otherSubjects = s.assignedSubjects || [];
        const hasCommonSubject = (form.assignedSubjects || []).some(subj => 
          otherSubjects.some(os => os.trim().toLowerCase() === subj.trim().toLowerCase())
        );
        if (!hasCommonSubject) return false;

        const otherClasses = s.assignedClasses || [];
        return (form.assignedClasses || []).some(cls =>
          otherClasses.some(oc => oc.trim().toLowerCase() === cls.trim().toLowerCase())
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
          employeeIdReadOnly={false}
          isSubmitting={submitting}
        />
      </form>
    </div>
  );
};
