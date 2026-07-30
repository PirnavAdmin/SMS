import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import {
  BasicStaffFormState,
  buildBasicStaffCreatePayload,
  defaultBasicStaffFormState,
  getEmployeeCategoryLabel,
  getNextEmployeeId
} from './staffFlowOptions';
import { BasicStaffFormFields } from './BasicStaffFormFields';

interface StaffRegistrationPageProps {
  onNavigate: (module: string) => void;
}

const getInitialCategory = (): BasicStaffFormState['employeeCategory'] => {
  try {
    const saved = sessionStorage.getItem('staff-registration-category');
    if (saved === 'Teacher' || saved === 'Staff') return saved;
  } catch {
    // Ignore storage access issues.
  }
  return 'Teacher';
};

export const StaffRegistrationPage: React.FC<StaffRegistrationPageProps> = ({ onNavigate }) => {
  const { staff, addStaff } = useData();
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

  const handleChange = (field: keyof BasicStaffFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCategoryChange = (value: BasicStaffFormState['employeeCategory']) => {
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

    require('employeeCategory', !!form.employeeCategory, 'Employee category is required.');
    require('firstName', !!form.firstName.trim(), 'First name is required.');
    require('lastName', !!form.lastName.trim(), 'Last name is required.');
    require('email', !!form.email.trim(), 'Email is required.');
    require('mobileNumber', !!form.mobileNumber.trim(), 'Mobile number is required.');
    require('branch', !!form.branch.trim(), 'Branch is required.');
    require('department', !!form.department.trim(), 'Department is required.');
    require('designation', !!form.designation.trim(), 'Designation is required.');
    require('joiningDate', !!form.joiningDate.trim(), 'Joining date is required.');
    require('employmentType', !!form.employmentType.trim(), 'Employment type is required.');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      addToast('warning', 'Please complete the form', 'Required basic employee fields are missing.');
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
      `${added.firstName} ${added.lastName} has been added. Profile status is Incomplete until the employee finishes the wizard.`
    );
    setSubmitting(false);
    onNavigate('staff-directory');
  };

  const summaryCategory = form.employeeCategory ? getEmployeeCategoryLabel(form.employeeCategory) : 'Select category';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="sm">Faculty & Staff</Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Staff Directory / Add Staff</span>
              </div>
              <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Add Staff</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Create the basic employee record only. The employee will complete the rest of the profile after logging in.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('staff-directory')}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-600/20 disabled:opacity-70"
              >
                <CheckCircle2 className="h-4 w-4" /> {submitting ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_360px] sm:px-6">
          <SectionCard title="Basic Information" subtitle="Enter only the core staff details required to create the employee record.">
            <BasicStaffFormFields
              value={form}
              errors={errors}
              onChange={handleChange}
              onCategoryChange={handleCategoryChange}
              employeeIdReadOnly
            />
          </SectionCard>

          <aside className="space-y-6">
            <SectionCard title="Registration Snapshot" subtitle="A quick preview of the employee record being created.">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
                  <Users className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-900 dark:text-white">
                    {form.firstName || 'First Name'} {form.lastName || 'Last Name'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {summaryCategory} | {form.designation || 'Designation'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Employee ID</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{form.empId}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Branch</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{form.branch || 'Not selected'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Department</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{form.department || 'Not selected'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Profile Status</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Incomplete</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                The employee can log in and complete personal, address, education, bank, and document details later.
              </div>
            </SectionCard>

            <SectionCard title="What Happens Next" subtitle="The system flow after you create the record.">
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <FlowLine step="1" text="Employee record is created." />
                <FlowLine step="2" text="Login account is available using the employee email." />
                <FlowLine step="3" text="Profile status stays Incomplete until the employee submits their profile." />
                <FlowLine step="4" text="Payroll and attendance modules can use the employee record after profile completion." />
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
    <div className="border-b border-slate-100 dark:border-slate-800 px-5 py-4">
      <h2 className="text-sm font-black text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const FlowLine: React.FC<{ step: string; text: string }> = ({ step, text }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
      {step}
    </div>
    <p>{text}</p>
  </div>
);

export default StaffRegistrationPage;
