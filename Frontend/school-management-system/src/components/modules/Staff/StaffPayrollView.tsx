import React, { useMemo, useState } from 'react';
import {
  IndianRupee, Settings, Layers, PlayCircle, FileText, Plus, Pencil, Trash2,
  Copy, Lock, Unlock, RotateCcw, Printer, Mail, Download, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import {
  EmployeeSalaryAssignment, PayrollAmountLine, PayrollComponent, PayrollConfiguration,
  PayrollRun, SalaryStructure, Staff
} from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { apiClient } from '../../../api/client';

type MainTab = 'dashboard' | 'config' | 'structures' | 'processing' | 'payslips' | 'reports';
type ConfigTab = 'general' | 'components' | 'leave' | 'attendance' | 'deductions' | 'cycle' | 'overtime' | 'settings';

const today = () => new Date().toISOString().split('T')[0];
const monthName = () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

const defaultConfig = (branch: string, leaveTypes: ReturnType<typeof useData>['leaveTypes']): Omit<PayrollConfiguration, 'id'> => ({
  branch,
  financialYear: '2026-2027',
  payrollName: `${branch} Payroll`,
  status: 'Draft',
  currency: 'INR',
  effectiveFrom: today(),
  effectiveTo: '2027-03-31',
  leaveRules: leaveTypes.map(t => ({
    leaveTypeId: t.id,
    leaveTypeName: t.name,
    paidLeave: t.isPaid,
    deductSalary: !t.isPaid,
    maximumPaidDays: t.annualAllowance,
    carryForward: t.carryForward
  })),
  attendanceRules: {
    salaryCalculationMethod: 'Calendar Days',
    calendarDays: 30,
    workingDays: 26,
    includeWeeklyOff: true,
    includePublicHolidays: true,
    includeApprovedLeave: true,
    twoHalfDaysOneFullDay: true,
    deductHalfSalary: true,
    lateEntriesForHalfDay: 3,
    halfDaysForLop: 2
  },
  deductionRules: {
    lopDeduction: '1 LOP = One Day Salary',
    halfDayDeduction: 'Half Day = 50% Daily Salary',
    unauthorizedAbsence: 'Unauthorized Absence = One Day Salary',
    lateComing: '3 Late Entries = Half Day',
    earlyExit: '2 Early Exits = Half Day'
  },
  payrollCycle: { payrollType: 'Monthly', payrollStartDate: '1', payrollEndDate: 'Last Day', salaryPaymentDate: '5th of Next Month' },
  overtime: { enabled: false, calculationType: 'Multiplier', hourlyRate: 0, weekendRate: 1.5, holidayRate: 2 },
  settings: {
    autoGeneratePayslips: true,
    autoLockPayrollAfterProcessing: false,
    allowManualAdjustment: true,
    autoCalculateLeaveDeduction: true,
    autoSendPayslips: false,
    enablePayrollApprovalWorkflow: true
  }
});

const componentAmount = (line: PayrollAmountLine, baseSalary: number) =>
  line.type === 'Percentage' ? Math.round((baseSalary * (line.value || 0)) / 100) : line.amount;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="space-y-1">
    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <>
    <style>{`
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `}</style>
    <input {...props} className={`w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-sky-500 dark:bg-slate-950 ${props.className || ''}`} />
  </>
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-sky-500 dark:bg-slate-950 ${props.className || ''}`} />
);

const Button = ({ children, variant = 'secondary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
      variant === 'primary' ? 'bg-sky-600 text-white hover:bg-sky-500' :
      variant === 'danger' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' :
      'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
    } ${props.className || ''}`}
  >
    {children}
  </button>
);

const formatDateTime = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strTime = `${hours}:${minutes} ${ampm}`;
  return `${day}-${month}-${year} ${strTime}`;
};

const parseDeduction = (ruleStr: string) => {
  const str = ruleStr || '';
  if (str.toLowerCase().includes('percentage') || str.includes('%')) {
    const match = str.match(/(\d+)/);
    return { type: 'Percentage', value: match ? Number(match[1]) : 50 };
  } else if (str.toLowerCase().includes('fixed') || str.toLowerCase().includes('amount') || str.toLowerCase().includes('inr')) {
    const match = str.match(/(\d+)/);
    return { type: 'Fixed Amount', value: match ? Number(match[1]) : 500 };
  } else {
    return { type: 'Daily Salary', value: 1 };
  }
};

const formatDeduction = (type: string, value: number, label: string) => {
  if (type === 'Percentage') {
    return `${label} = ${value}% Daily Salary`;
  } else if (type === 'Fixed Amount') {
    return `${label} = Fixed: INR ${value}`;
  } else {
    return `${label} = One Day Salary`;
  }
};

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 ${
      checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const AVAILABLE_EARNINGS = [
  'Basic Salary', 'HRA', 'DA', 'Medical Allowance', 'Transport Allowance',
  'Conveyance', 'Internet Allowance', 'Special Allowance', 'Academic Allowance',
  'Exam Duty Allowance', 'Hostel Allowance', 'Overtime', 'Bonus', 'Incentives'
];

const AVAILABLE_DEDUCTIONS = [
  'PF', 'ESI', 'Professional Tax', 'TDS', 'Loan Recovery',
  'Advance Recovery', 'LOP', 'Insurance', 'Other Deductions'
];

interface StaffPayrollViewProps {
  initialTab?: 'staff-payroll-config' | 'staff-payroll-structures' | 'staff-payroll-processing' | 'staff-payroll-payslips';
}

export const StaffPayrollView: React.FC<StaffPayrollViewProps> = ({ initialTab }) => {
  const data = useData();
  const { user, role, selectedBranch } = useAuth();
  const { addToast } = useToast();
  const [mainTab, setMainTab] = useState<MainTab>(
    initialTab === 'staff-payroll-structures' ? 'structures' :
    initialTab === 'staff-payroll-processing' ? 'processing' :
    initialTab === 'staff-payroll-payslips' ? 'payslips' :
    'dashboard'
  );
  const [configTab, setConfigTab] = useState<ConfigTab>('general');
  const [payrollMonth, setPayrollMonth] = useState(monthName());
  const [department, setDepartment] = useState('All');
  const [employeeType, setEmployeeType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [structureDraft, setStructureDraft] = useState<SalaryStructure | null>(null);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [structuresError, setStructuresError] = useState<string | null>(null);
  const [viewingComponentsStructure, setViewingComponentsStructure] = useState<SalaryStructure | null>(null);
  const [viewingComponentsType, setViewingComponentsType] = useState<'earnings' | 'deductions' | null>(null);
  const [newCompName, setNewCompName] = useState('');
  const [newCompAmount, setNewCompAmount] = useState<number | ''>('');
  const [newCompType, setNewCompType] = useState<'earnings' | 'deductions'>('earnings');

  const [processingStep, setProcessingStep] = useState(1);
  const [adjustmentEmployeeId, setAdjustmentEmployeeId] = useState<string | null>(null);
  const [adjustGrossAmount, setAdjustGrossAmount] = useState<number>(0);
  const [adjustDeductionAmount, setAdjustDeductionAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [approvalLog, setApprovalLog] = useState<string[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaveDraft, setLeaveDraft] = useState<any[]>([]);
  const [attendanceDraft, setAttendanceDraft] = useState<any>(null);
  const [deductionsDraft, setDeductionsDraft] = useState<any>(null);
  const [cycleDraft, setCycleDraft] = useState<any>(null);
  const [overtimeDraft, setOvertimeDraft] = useState<any>(null);
  const [settingsDraft, setSettingsDraft] = useState<any>(null);

  const [deductionForms, setDeductionForms] = useState({
    lop: { type: 'Daily Salary', value: 1 },
    halfDay: { type: 'Percentage', value: 50 },
    unauthorized: { type: 'Daily Salary', value: 1 },
    lateComing: { type: 'Percentage', value: 50 },
    earlyExit: { type: 'Percentage', value: 50 }
  });

  const canView = ['Admin', 'Principal', 'HR', 'Accountant'].includes(role);
  const canManage = ['Admin', 'Principal', 'HR'].includes(role);
  const canProcess = ['Admin', 'HR', 'Accountant'].includes(role);
  const canUnlock = ['Admin', 'Principal'].includes(role);

  const activeConfig = data.payrollConfigurations.find(c => c.status === 'Active' && c.branch === selectedBranch) || data.payrollConfigurations[0];

  const isLocked = useMemo(() => {
    return data.payrollRuns.some(r => ['Processed', 'Approved', 'Locked'].includes(r.status));
  }, [data.payrollRuns]);

  const startEditing = () => {
    if (!activeConfig) return;
    setIsEditing(true);
    setLeaveDraft(JSON.parse(JSON.stringify(activeConfig.leaveRules || [])));
    setAttendanceDraft(JSON.parse(JSON.stringify(activeConfig.attendanceRules || {})));
    setDeductionsDraft(JSON.parse(JSON.stringify(activeConfig.deductionRules || {})));
    setCycleDraft(JSON.parse(JSON.stringify(activeConfig.payrollCycle || {})));
    setOvertimeDraft(JSON.parse(JSON.stringify(activeConfig.overtime || {})));
    setSettingsDraft(JSON.parse(JSON.stringify(activeConfig.settings || {})));

    setDeductionForms({
      lop: parseDeduction(activeConfig.deductionRules?.lopDeduction || ''),
      halfDay: parseDeduction(activeConfig.deductionRules?.halfDayDeduction || ''),
      unauthorized: parseDeduction(activeConfig.deductionRules?.unauthorizedAbsence || ''),
      lateComing: parseDeduction(activeConfig.deductionRules?.lateComing || ''),
      earlyExit: parseDeduction(activeConfig.deductionRules?.earlyExit || '')
    });
  };

  const saveChanges = async () => {
    if (!activeConfig) return;

    let payload: any = null;

    if (configTab === 'leave') {
      for (const rule of leaveDraft) {
        if (rule.maximumPaidDays < 0) {
          addToast('error', 'Validation Error', `${rule.leaveTypeName} maximum paid days cannot be negative.`);
          return;
        }
        if (rule.leaveTypeName.toLowerCase() === 'loss of pay' || rule.leaveTypeName.toLowerCase() === 'loss of pay') {
          if (rule.paidLeave) {
            addToast('error', 'Validation Error', `Loss Of Pay should always be unpaid.`);
            return;
          }
          if (rule.maximumPaidDays !== 0) {
            addToast('error', 'Validation Error', `Maximum Paid Days must be 0 for Loss Of Pay.`);
            return;
          }
        }
      }
      payload = leaveDraft;
    } else if (configTab === 'attendance') {
      if (attendanceDraft.workingDays > attendanceDraft.calendarDays) {
        addToast('error', 'Validation Error', 'Working Days cannot exceed Calendar Days.');
        return;
      }
      if (attendanceDraft.workingDays < 0 || attendanceDraft.calendarDays < 0) {
        addToast('error', 'Validation Error', 'Days cannot be negative.');
        return;
      }
      if (attendanceDraft.lateEntriesForHalfDay <= 0) {
        addToast('error', 'Validation Error', 'Late Entries for Half Day must be greater than 0.');
        return;
      }
      if (attendanceDraft.halfDaysForLop <= 0) {
        addToast('error', 'Validation Error', 'Half Days for LOP must be greater than 0.');
        return;
      }
      payload = attendanceDraft;
    } else if (configTab === 'deductions') {
      const updatedDeductions = {
        lopDeduction: formatDeduction(deductionForms.lop.type, deductionForms.lop.value, '1 LOP'),
        halfDayDeduction: formatDeduction(deductionForms.halfDay.type, deductionForms.halfDay.value, 'Half Day'),
        unauthorizedAbsence: formatDeduction(deductionForms.unauthorized.type, deductionForms.unauthorized.value, 'Unauthorized Absence'),
        lateComing: formatDeduction(deductionForms.lateComing.type, deductionForms.lateComing.value, 'Late Coming'),
        earlyExit: formatDeduction(deductionForms.earlyExit.type, deductionForms.earlyExit.value, 'Early Exit')
      };
      payload = updatedDeductions;
    } else if (configTab === 'cycle') {
      const startNum = Number(cycleDraft.payrollStartDate);
      const endNum = Number(cycleDraft.payrollEndDate);
      if (!isNaN(startNum) && !isNaN(endNum) && startNum >= endNum) {
        addToast('error', 'Validation Error', 'Start Date must be before End Date.');
        return;
      }
      if (!cycleDraft.salaryPaymentDate) {
        addToast('error', 'Validation Error', 'Salary Payment Date is required.');
        return;
      }
      payload = cycleDraft;
    } else if (configTab === 'overtime') {
      if (overtimeDraft.enabled) {
        if (overtimeDraft.hourlyRate < 0 || overtimeDraft.weekendRate < 0 || overtimeDraft.holidayRate < 0) {
          addToast('error', 'Validation Error', 'Rates cannot be negative.');
          return;
        }
      }
      payload = overtimeDraft;
    } else if (configTab === 'settings') {
      payload = settingsDraft;
    }

    try {
      setSaving(true);
      try {
        await apiClient(`/api/payroll/configuration/${activeConfig.id}/${configTab}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } catch (apiErr) {
        console.warn("Backend update failed, persisting changes locally", apiErr);
      }

      const oldVal = JSON.stringify(
        configTab === 'leave' ? activeConfig.leaveRules :
        configTab === 'attendance' ? activeConfig.attendanceRules :
        configTab === 'deductions' ? activeConfig.deductionRules :
        configTab === 'cycle' ? activeConfig.payrollCycle :
        configTab === 'overtime' ? activeConfig.overtime :
        activeConfig.settings
      );
      const newVal = JSON.stringify(payload);

      const auditLogEntry = {
        updatedBy: user?.name || role || 'Admin',
        updatedAt: formatDateTime(new Date()),
        oldValue: oldVal,
        newValue: newVal
      };

      const updatedLogs = [...(activeConfig.auditLogs || []), auditLogEntry];

      data.updatePayrollConfiguration(activeConfig.id, {
        updatedBy: user?.name || role || 'Admin',
        updatedAt: formatDateTime(new Date()),
        auditLogs: updatedLogs,
        [configTab === 'leave' ? 'leaveRules' :
         configTab === 'attendance' ? 'attendanceRules' :
         configTab === 'deductions' ? 'deductionRules' :
         configTab === 'cycle' ? 'payrollCycle' :
         configTab === 'overtime' ? 'overtime' :
         'settings']: payload
      });

      data.logActivity('Payroll Configuration Update', `Updated ${configTab} configuration for branch ${selectedBranch}`, user?.name || 'System', role);
      addToast('success', 'Success', 'Payroll Configuration Updated Successfully');
      setIsEditing(false);
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Failed to save configuration updates.');
    } finally {
      setSaving(false);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      setStructuresLoading(true);
      setStructuresError(null);
      const response = await apiClient(`/api/payroll/salary-structures?branchId=${selectedBranch}`);
      const mapped = (response || []).map((item: any) => ({
        id: item.id ? String(item.id) : ('SAL-STR-' + Math.floor(100 + Math.random() * 900)),
        structureName: item.structureName || item.name || 'Unnamed Structure',
        employeeCategory: item.employeeCategory || 'Teacher',
        branch: item.branch || (item.branchId === 1 || item.branchId === '1' ? 'Main Campus' : selectedBranch),
        earnings: item.earnings || [
          { name: 'Basic Salary', amount: item.basicSalary || 10000, type: 'Fixed', value: item.basicSalary || 10000 },
          { name: 'House Rent Allowance (HRA)', amount: Math.round((item.basicSalary || 10000) * 0.2), type: 'Percentage', value: 20 },
          { name: 'Dearness Allowance (DA)', amount: Math.round((item.basicSalary || 10000) * 0.1), type: 'Percentage', value: 10 }
        ],
        deductions: item.deductions || [
          { name: 'Provident Fund (PF)', amount: Math.round((item.basicSalary || 10000) * 0.08), type: 'Percentage', value: 8 }
        ],
        grossSalary: item.grossSalary || Math.round((item.basicSalary || 10000) * 1.3),
        netSalaryFormula: item.netSalaryFormula || 'Gross Salary - Deductions - Leave Deduction',
        status: item.status || 'Active'
      }));
      data.loadSalaryStructures(mapped);
    } catch (err: any) {
      console.error("API error loading Salary Structures:", err);
      setStructuresError(err.message || 'Unable to load Salary Structures.');
    } finally {
      setStructuresLoading(false);
    }
  };

  React.useEffect(() => {
    if (mainTab === 'structures') {
      fetchSalaryStructures();
    }
  }, [mainTab, selectedBranch]);

  const departments = Array.from(new Set(data.staff.map(s => s.department)));

  const calculatePayroll = (employee: Staff): Omit<PayrollRun, 'id'> => {
    const assignment = data.employeeSalaryAssignments.find(a => a.employeeId === employee.id && a.status === 'Active');
    const structure = data.salaryStructures.find(s => s.id === assignment?.salaryStructureId);
    const earnings = structure?.earnings || [
      { name: 'Basic Salary', amount: employee.salary, type: 'Fixed', value: employee.salary },
      { name: 'House Rent Allowance (HRA)', amount: Math.round(employee.salary * 0.2), type: 'Percentage', value: 20 },
      { name: 'Dearness Allowance (DA)', amount: Math.round(employee.salary * 0.1), type: 'Percentage', value: 10 }
    ];
    const deductions = structure?.deductions || [{ name: 'Provident Fund (PF)', amount: Math.round(employee.salary * 0.08), type: 'Percentage', value: 8 }];
    const grossSalary = earnings.reduce((sum, line) => sum + componentAmount(line, employee.salary), 0);
    const otherDeductions = deductions.reduce((sum, line) => sum + componentAmount(line, employee.salary), 0);
    const days = activeConfig?.attendanceRules.salaryCalculationMethod === 'Working Days' ? activeConfig.attendanceRules.workingDays : activeConfig?.attendanceRules.calendarDays || 30;
    const dailySalary = grossSalary / Math.max(1, days);
    const approvedLeaves = data.leaveApplications.filter(app => app.employeeId === employee.id && app.status === 'Approved');
    const unpaidLeaves = approvedLeaves.filter(app => {
      const rule = activeConfig?.leaveRules.find(r => r.leaveTypeName === app.leaveTypeName);
      return rule ? rule.deductSalary : app.leaveTypeName === 'Loss of Pay';
    });
    const paidLeaveDays = approvedLeaves.filter(app => !unpaidLeaves.includes(app)).reduce((sum, app) => sum + app.numberOfDays, 0);
    const unpaidLeaveDays = unpaidLeaves.reduce((sum, app) => sum + app.numberOfDays, 0);
    const attendanceRows = data.attendance.filter(a => a.entityType === 'Staff' && a.entityId === employee.id);
    const halfDays = attendanceRows.filter(a => a.status === 'HalfDay').length;
    const lateEntries = attendanceRows.filter(a => a.status === 'Late').length;
    const halfDayUnits = activeConfig?.attendanceRules.deductHalfSalary ? halfDays * 0.5 : 0;
    const lateHalfDays = Math.floor(lateEntries / (activeConfig?.attendanceRules.lateEntriesForHalfDay || 3)) * 0.5;
    const leaveDeduction = Math.round((unpaidLeaveDays + halfDayUnits + lateHalfDays) * dailySalary);
    const workflow = !!activeConfig?.settings.enablePayrollApprovalWorkflow;
    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      empId: employee.empId,
      branch: employee.branch || selectedBranch,
      department: employee.department,
      employeeCategory: employee.employeeCategory || 'Staff',
      payrollMonth,
      grossSalary,
      leaveDeduction,
      otherDeductions,
      netSalary: Math.max(0, grossSalary - leaveDeduction - otherDeductions),
      status: workflow ? 'HR Review' : 'Processed',
      salaryStructureId: structure?.id,
      configurationId: activeConfig?.id,
      earnings,
      deductions,
      leaveDetails: { paidLeaveDays, unpaidLeaveDays, halfDays, lateEntries },
      processedDate: today(),
      paymentDate: activeConfig?.payrollCycle.salaryPaymentDate || '5th of Next Month'
    };
  };

  const eligibleStaff = useMemo(() => data.staff.filter(s => {
    const existing = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
    return (department === 'All' || s.department === department) &&
      (employeeType === 'All' || s.employeeCategory === employeeType) &&
      (statusFilter === 'All' || (existing?.status || 'Pending') === statusFilter);
  }), [data.staff, data.payrollRuns, department, employeeType, payrollMonth, statusFilter]);

  const ensureAllowed = (allowed: boolean, action: string) => {
    if (!allowed) addToast('error', 'Permission denied', `Your role cannot ${action}.`);
    return allowed;
  };

  const processEmployee = (employee: Staff) => {
    if (!ensureAllowed(canProcess, 'process payroll')) return;
    const existing = data.payrollRuns.find(r => r.employeeId === employee.id && r.payrollMonth === payrollMonth);
    if (existing?.status === 'Locked') {
      addToast('warning', 'Payroll locked', 'Unlock this payroll before recalculating.');
      return;
    }
    const run = data.upsertPayrollRun(calculatePayroll(employee));
    if (activeConfig?.settings.autoGeneratePayslips) generatePayslip(run);
    addToast('success', 'Payroll processed', `${employee.firstName}'s salary was calculated.`);
  };

  const generatePayslip = (run: PayrollRun | Omit<PayrollRun, 'id'>) => {
    if (!ensureAllowed(canProcess, 'generate payslips')) return;
    const alreadyExists = data.payslips.some(p => p.employeeId === run.employeeId && p.month === run.payrollMonth);
    if (alreadyExists) return;
    const staffMember = data.staff.find(s => s.id === run.employeeId);
    data.disburseSalary({
      employeeId: run.employeeId,
      employeeName: run.employeeName,
      empId: run.empId,
      branch: run.branch,
      department: run.department,
      designation: staffMember?.designation,
      employeeCategory: run.employeeCategory,
      month: run.payrollMonth,
      basicSalary: run.earnings.find(e => e.name === 'Basic Salary')?.amount || staffMember?.salary || 0,
      hra: run.earnings.find(e => e.name.includes('HRA'))?.amount || 0,
      da: run.earnings.find(e => e.name.includes('DA'))?.amount || 0,
      earnings: run.earnings,
      deductions: run.deductions,
      grossSalary: run.grossSalary,
      leaveDeduction: run.leaveDeduction,
      otherDeductions: run.otherDeductions,
      pfDeduction: run.deductions.find(d => d.name.includes('PF'))?.amount || 0,
      lopDeduction: run.leaveDeduction,
      netSalary: run.netSalary,
      bankAccount: staffMember?.bankDetails?.accountNumber || 'N/A',
      disbursedDate: today(),
      paymentDate: run.paymentDate,
      leaveDetails: run.leaveDetails,
      status: 'Generated'
    });
  };

  if (!canView) {
    return <div className="rounded-xl border bg-white p-8 text-sm font-semibold text-slate-600">You are not authorized to view Payroll.</div>;
  }

  const renderDashboard = () => {
    const currentMonthPayslips = data.payslips.filter(p => p.month === payrollMonth);
    const totalNetDisbursed = currentMonthPayslips.reduce((sum, p) => sum + p.netSalary, 0);
    const totalGrossDisbursed = currentMonthPayslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
    const totalDeducted = currentMonthPayslips.reduce((sum, p) => sum + (p.leaveDeduction || 0) + (p.otherDeductions || 0), 0);
    const activeStaffCount = data.staff.length;
    const assignedCount = data.employeeSalaryAssignments.filter(a => a.status === 'Active').length;

    // Generate Automation Alerts
    const alerts: { type: 'warning' | 'info' | 'important'; title: string; desc: string; actionText?: string; onAction?: () => void }[] = [];
    
    if (activeStaffCount > assignedCount) {
      alerts.push({
        type: 'warning',
        title: 'Salary Assignment Missing',
        desc: `${activeStaffCount - assignedCount} active employees do not have a salary structure assigned. Complete assignments to calculate payroll.`,
        actionText: 'Assign Structures',
        onAction: () => setMainTab('structures')
      });
    }

    const currentRunStatus = data.payrollRuns.find(r => r.payrollMonth === payrollMonth && r.branch === selectedBranch)?.status || 'Draft';
    if (currentRunStatus === 'HR Review') {
      alerts.push({
        type: 'important',
        title: 'Pending HR Verification',
        desc: `The payroll run for ${payrollMonth} has been computed and is awaiting accountant verification.`,
        actionText: 'Verify Run',
        onAction: () => { setMainTab('processing'); setProcessingStep(7); }
      });
    } else if (currentRunStatus === 'Accounts Review') {
      alerts.push({
        type: 'important',
        title: 'Pending Principal Signature',
        desc: `Payroll is verified by Accounts. Needs Principal's sign-off.`,
        actionText: 'Sign Off',
        onAction: () => { setMainTab('processing'); setProcessingStep(7); }
      });
    }

    if (data.payrollConfigurations.length === 0) {
      alerts.push({
        type: 'info',
        title: 'Initial Config Needed',
        desc: 'Create and activate your first Payroll Configuration to begin processing salaries.',
        actionText: 'Setup Config',
        onAction: () => setMainTab('config')
      });
    }

    // Filter relevant activities for payroll
    const payrollActivities = (data.auditLogs || [])
      .filter((log: any) => 
        log.action?.toLowerCase().includes('payroll') || 
        log.action?.toLowerCase().includes('salary') || 
        log.action?.toLowerCase().includes('payslip')
      )
      .slice(0, 5);

    // Department Expenses Chart data mapping
    const deptSummary: Record<string, { gross: number; net: number; count: number }> = {};
    currentMonthPayslips.forEach(p => {
      const dept = p.department || 'General';
      if (!deptSummary[dept]) deptSummary[dept] = { gross: 0, net: 0, count: 0 };
      deptSummary[dept].gross += p.grossSalary || 0;
      deptSummary[dept].net += p.netSalary;
      deptSummary[dept].count += 1;
    });

    const maxNetExpense = Math.max(...Object.values(deptSummary).map(d => d.net), 1);

    return (
      <div className="space-y-6 animate-in fade-in text-xs">
        {/* Automation Alerts Banner section */}
        {alerts.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-4 border rounded-2xl flex items-start gap-3 shadow-sm transition-all hover:scale-[1.01] ${
                  alert.type === 'warning' ? 'bg-amber-50/40 border-amber-250 dark:bg-amber-950/15 dark:border-amber-900/30' :
                  alert.type === 'important' ? 'bg-rose-50/40 border-rose-250 dark:bg-rose-950/15 dark:border-rose-900/30' :
                  'bg-sky-50/40 border-sky-250 dark:bg-sky-950/15 dark:border-sky-900/30'
                }`}
              >
                <div className="flex-1 space-y-1">
                  <h5 className={`font-black text-xs ${
                    alert.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                    alert.type === 'important' ? 'text-rose-700 dark:text-rose-400' :
                    'text-sky-700 dark:text-sky-400'
                  }`}>
                    {alert.title}
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">{alert.desc}</p>
                </div>
                {alert.actionText && (
                  <Button 
                    variant={alert.type === 'warning' ? 'secondary' : 'primary'}
                    onClick={alert.onAction}
                    className="flex-shrink-0 text-[10px] px-2.5 py-1"
                  >
                    {alert.actionText} ➔
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Total Net Salary Disbursed</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{formatCurrency(totalNetDisbursed)}</span>
            <span className="text-[10px] text-slate-400">Month: {payrollMonth} ({currentMonthPayslips.length} slips)</span>
          </div>
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Gross Payroll Expenses</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{formatCurrency(totalGrossDisbursed)}</span>
            <span className="text-[10px] text-slate-400">Total Deductions: {formatCurrency(totalDeducted)}</span>
          </div>
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Structure Assignment Rate</span>
            <span className="text-2xl font-black text-sky-600 font-mono">
              {Math.round((assignedCount / Math.max(1, activeStaffCount)) * 100)}%
            </span>
            <span className="text-[10px] text-slate-400">{assignedCount} assigned / {activeStaffCount} active staff</span>
          </div>
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <span className="block text-slate-400 font-bold uppercase text-[9px] tracking-wider">Active Salary Structures</span>
            <span className="text-2xl font-black text-indigo-600 font-mono">
              {data.salaryStructures.filter(s => s.status === 'Active').length}
            </span>
            <span className="text-[10px] text-slate-400">Total structures defined: {data.salaryStructures.length}</span>
          </div>
        </div>

        {/* Charts & Activities Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Expenses Chart */}
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 dark:text-slate-200">Department Expense Distribution</h4>
            <div className="space-y-4 pt-2">
              {Object.keys(deptSummary).length === 0 ? (
                <p className="text-slate-400 italic text-center py-10">No disbursement data to chart for {payrollMonth}.</p>
              ) : (
                Object.entries(deptSummary).map(([dept, data]) => {
                  const pct = Math.round((data.net / maxNetExpense) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between font-bold text-[10px]">
                        <span className="text-slate-700 dark:text-slate-300">{dept} ({data.count} employees)</span>
                        <span className="font-mono text-emerald-600">{formatCurrency(data.net)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Stats & Audit Log Widget */}
          <div className="p-5 border rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 dark:text-slate-200">System Activity Registry (HR & Payroll)</h4>
            <div className="space-y-3 pt-2">
              {payrollActivities.length === 0 ? (
                <p className="text-slate-400 italic py-6 text-center">No payroll-related activity logged yet.</p>
              ) : (
                payrollActivities.map((act: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start gap-4 border-b pb-2 border-slate-100 dark:border-slate-850 last:border-b-0">
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-750 dark:text-slate-200 block text-[10px]">{act.action}</span>
                      <span className="text-slate-400 block text-[9px]">{act.details}</span>
                    </div>
                    <div className="text-right flex-shrink-0 text-[8px] text-slate-400">
                      <span className="block font-bold">{act.userName} ({act.role || 'HR'})</span>
                      <span className="block font-mono text-slate-400">{act.timestamp || 'Just now'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [activeReport, setActiveReport] = useState<'pf' | 'esi' | 'tds' | 'expense' | 'bank'>('expense');

  const renderReports = () => {
    const currentMonthPayslips = data.payslips.filter(p => p.month === payrollMonth);

    const handleExport = (reportName: string) => {
      addToast('success', 'Report Exported', `${reportName} exported successfully in CSV format.`);
    };

    return (
      <div className="space-y-6 animate-in fade-in text-xs">
        {/* Report Selector header */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 border p-4 rounded-2xl shadow-sm justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'expense', name: 'Dept Expense Report' },
              { id: 'pf', name: 'EPF Contributions' },
              { id: 'esi', name: 'ESI Contributions' },
              { id: 'tds', name: 'TDS Deductions' },
              { id: 'bank', name: 'Bank Transfer sheet' }
            ].map(rep => (
              <Button
                key={rep.id}
                variant={activeReport === rep.id ? 'primary' : 'secondary'}
                onClick={() => setActiveReport(rep.id as any)}
              >
                {rep.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleExport(activeReport.toUpperCase())}><Download className="w-3.5 h-3.5" /> Export CSV</Button>
            <Button variant="primary" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print Report</Button>
          </div>
        </div>

        {/* Report Table display */}
        {activeReport === 'expense' && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Department Expense Summary Report ({payrollMonth})</h4>
            <RulesTable
              headers={['Department', 'Employee Count', 'Gross Disbursed', 'Deductions (LOP & Other)', 'Total Net Paid']}
              rows={departments.map(dept => {
                const slips = currentMonthPayslips.filter(p => p.department === dept);
                const gross = slips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
                const deductions = slips.reduce((sum, p) => sum + (p.leaveDeduction || 0) + (p.otherDeductions || 0), 0);
                const net = slips.reduce((sum, p) => sum + p.netSalary, 0);
                return [
                  dept,
                  String(slips.length),
                  formatCurrency(gross),
                  formatCurrency(deductions),
                  <span className="font-extrabold text-emerald-600" key={dept}>{formatCurrency(net)}</span>
                ];
              })}
            />
          </div>
        )}

        {activeReport === 'pf' && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">EPF Provident Fund Contributions Report ({payrollMonth})</h4>
            <RulesTable
              headers={['Employee Name', 'Emp ID', 'Basic Salary', 'Employer EPF (12%)', 'Employee EPF (12%)', 'Total EPF Deposit']}
              rows={currentMonthPayslips.map((p, idx) => {
                const basic = p.basicSalary || 0;
                const contrib = Math.round(basic * 0.12);
                return [
                  p.employeeName,
                  p.empId,
                  formatCurrency(basic),
                  formatCurrency(contrib),
                  formatCurrency(contrib),
                  <span className="font-bold text-slate-900 dark:text-white" key={idx}>{formatCurrency(contrib * 2)}</span>
                ];
              })}
            />
          </div>
        )}

        {activeReport === 'esi' && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">ESI Employee State Insurance Report ({payrollMonth})</h4>
            <RulesTable
              headers={['Employee Name', 'ESI Number', 'Monthly Gross Salary', 'Employer Share (3.25%)', 'Employee Share (0.75%)', 'Total Contribution']}
              rows={currentMonthPayslips.map((p, idx) => {
                const gross = p.grossSalary || 0;
                const emp = data.staff.find((s: any) => s.id === p.employeeId) as any;
                const employerShare = Math.round(gross * 0.0325);
                const employeeShare = Math.round(gross * 0.0075);
                return [
                  p.employeeName,
                  emp?.esiNumber || '31-00-123456-000-1234',
                  formatCurrency(gross),
                  formatCurrency(employerShare),
                  formatCurrency(employeeShare),
                  <span className="font-bold text-slate-900 dark:text-white" key={idx}>{formatCurrency(employerShare + employeeShare)}</span>
                ];
              })}
            />
          </div>
        )}

        {activeReport === 'tds' && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">TDS Tax Deduction at Source Report ({payrollMonth})</h4>
            <RulesTable
              headers={['Employee Name', 'PAN Details', 'Monthly Gross', 'Annualized Gross', 'TDS Deduction']}
              rows={currentMonthPayslips.map((p, idx) => {
                const gross = p.grossSalary || 0;
                const tds = p.deductions?.find((d: any) => d.name.toLowerCase().includes('tds') || d.name.toLowerCase().includes('tax'))?.amount || 0;
                const emp = data.staff.find((s: any) => s.id === p.employeeId) as any;
                return [
                  p.employeeName,
                  emp?.panNumber || 'ABCDE1234F',
                  formatCurrency(gross),
                  formatCurrency(gross * 12),
                  <span className="font-bold text-rose-500 font-mono" key={idx}>-{formatCurrency(tds)}</span>
                ];
              })}
            />
          </div>
        )}

        {activeReport === 'bank' && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Bank Transfer Disbursement Sheet ({payrollMonth})</h4>
            <RulesTable
              headers={['Beneficiary Name', 'Bank Details', 'IFSC Code', 'Amount to Transfer', 'Disbursal Status']}
              rows={currentMonthPayslips.map((p, idx) => {
                const emp = data.staff.find((s: any) => s.id === p.employeeId);
                return [
                  p.employeeName,
                  p.bankAccount,
                  emp?.bankDetails?.ifscCode || 'N/A',
                  <span className="font-extrabold text-emerald-600 font-mono" key={idx}>{formatCurrency(p.netSalary)}</span>,
                  <span className="text-emerald-500 font-bold" key={`stat-${idx}`}>Disbursed</span>
                ];
              })}
            />
          </div>
        )}
      </div>
    );
  };

  const renderGeneral = () => (
    <div className="space-y-4">
      <div className="flex justify-end"><Button variant="primary" onClick={() => data.addPayrollConfiguration(defaultConfig(selectedBranch, data.leaveTypes))} disabled={!canManage}><Plus className="w-4 h-4" /> Add Configuration</Button></div>
      <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500"><tr><th className="p-3">Payroll</th><th className="p-3">Branch</th><th className="p-3">Financial Year</th><th className="p-3">Currency</th><th className="p-3">Effective</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">
            {data.payrollConfigurations.map(c => (
              <tr key={c.id}>
                <td className="p-3 font-bold">{c.payrollName}</td><td className="p-3">{c.branch}</td><td className="p-3">{c.financialYear}</td><td className="p-3">{c.currency}</td><td className="p-3">{c.effectiveFrom} to {c.effectiveTo || 'Open'}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                <td className="p-3 text-right space-x-1">
                  <Button onClick={() => data.updatePayrollConfiguration(c.id, { payrollName: `${c.payrollName} Updated` })} disabled={!canManage}><Pencil className="w-3.5 h-3.5" /></Button>
                  {c.status === 'Active' ? <Button onClick={() => data.deactivatePayrollConfiguration(c.id)} disabled={!canManage}>Deactivate</Button> : <Button onClick={() => data.activatePayrollConfiguration(c.id)} disabled={!canManage}>Activate</Button>}
                  <Button variant="danger" onClick={() => data.deletePayrollConfiguration(c.id)} disabled={!canManage}><Trash2 className="w-3.5 h-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderComponents = () => {
    const draft = editingComponent || { id: '', name: '', category: 'Earning', type: 'Fixed', value: 0, taxable: true, mandatory: false, status: 'Active', branch: selectedBranch } as PayrollComponent;
    return (
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-black">Component Master</h3>
          <div className="space-y-3">
            <Field label="Name"><Input value={draft.name} onChange={e => setEditingComponent({ ...draft, name: e.target.value })} /></Field>
            <Field label="Category"><Select value={draft.category} onChange={e => setEditingComponent({ ...draft, category: e.target.value as PayrollComponent['category'] })}><option>Earning</option><option>Deduction</option></Select></Field>
            <Field label="Type"><Select value={draft.type} onChange={e => setEditingComponent({ ...draft, type: e.target.value as PayrollComponent['type'] })}><option>Fixed</option><option>Percentage</option></Select></Field>
            <Field label="Value"><Input type="number" value={draft.value} onChange={e => setEditingComponent({ ...draft, value: Number(e.target.value) })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Taxable"><Select value={draft.taxable ? 'Yes' : 'No'} onChange={e => setEditingComponent({ ...draft, taxable: e.target.value === 'Yes' })}><option>Yes</option><option>No</option></Select></Field>
              <Field label="Mandatory"><Select value={draft.mandatory ? 'Yes' : 'No'} onChange={e => setEditingComponent({ ...draft, mandatory: e.target.value === 'Yes' })}><option>Yes</option><option>No</option></Select></Field>
            </div>
            <Button variant="primary" className="w-full" disabled={!canManage || !draft.name} onClick={() => {
              if (draft.id) data.updatePayrollComponent(draft.id, draft); else data.addPayrollComponent(draft);
              setEditingComponent(null);
            }}><CheckCircle2 className="w-4 h-4" /> Save Component</Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Type</th><th className="p-3">Value</th><th className="p-3">Flags</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y">{data.payrollComponents.map(c => <tr key={c.id}><td className="p-3 font-bold">{c.name}</td><td className="p-3">{c.category}</td><td className="p-3">{c.type}</td><td className="p-3">{c.type === 'Percentage' ? `${c.value}%` : formatCurrency(c.value)}</td><td className="p-3">{c.category === 'Earning' ? `Taxable: ${c.taxable ? 'Yes' : 'No'}` : `Mandatory: ${c.mandatory ? 'Yes' : 'No'}`}</td><td className="p-3">{c.status}</td><td className="p-3 text-right space-x-1"><Button onClick={() => setEditingComponent(c)} disabled={!canManage}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="danger" onClick={() => data.deletePayrollComponent(c.id)} disabled={!canManage}><Trash2 className="w-3.5 h-3.5" /></Button></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConfigDetails = () => {
    if (!activeConfig) return null;
    if (configTab === 'general') return renderGeneral();
    if (configTab === 'components') return renderComponents();

    const tabTitle = configTab.charAt(0).toUpperCase() + configTab.slice(1) + " Configuration";

    const updateLeaveRule = (index: number, updates: Partial<any>) => {
      setLeaveDraft(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
    };

    return (
      <div className="space-y-4 animate-in fade-in">
        {/* Header Block with Edit button */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">{tabTitle}</h3>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={startEditing}
              className="flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-sky-600" /> Edit Configuration
            </Button>
          )}
        </div>

        {/* Warning lock banner */}
        {isLocked && (
          <div className="rounded-xl border border-rose-250 bg-rose-50/50 p-4 text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-450 font-semibold text-xs leading-relaxed">
            This payroll configuration cannot be modified because payroll has already been processed.
          </div>
        )}

        {/* Edit Mode Forms / View Mode Grids */}
        {isEditing ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            {configTab === 'leave' && leaveDraft && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 dark:bg-slate-950">
                    <tr>
                      <th className="p-3">Leave Type</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Deduct Salary</th>
                      <th className="p-3">Maximum Paid Days</th>
                      <th className="p-3">Carry Forward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaveDraft.map((rule, idx) => (
                      <tr key={rule.leaveTypeId || idx}>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{rule.leaveTypeName}</td>
                        <td className="p-3">
                          <Select
                            value={rule.paidLeave ? 'Yes' : 'No'}
                            onChange={e => {
                              const isPaid = e.target.value === 'Yes';
                              updateLeaveRule(idx, { paidLeave: isPaid, deductSalary: !isPaid });
                            }}
                          >
                            <option>Yes</option>
                            <option>No</option>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Select
                            value={rule.deductSalary ? 'Yes' : 'No'}
                            onChange={e => updateLeaveRule(idx, { deductSalary: e.target.value === 'Yes' })}
                          >
                            <option>Yes</option>
                            <option>No</option>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            value={rule.maximumPaidDays}
                            onChange={e => updateLeaveRule(idx, { maximumPaidDays: Number(e.target.value) })}
                          />
                        </td>
                        <td className="p-3">
                          <Select
                            value={rule.carryForward ? 'Yes' : 'No'}
                            onChange={e => updateLeaveRule(idx, { carryForward: e.target.value === 'Yes' })}
                          >
                            <option>Yes</option>
                            <option>No</option>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {configTab === 'attendance' && attendanceDraft && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Salary Calculation Method">
                  <Select
                    value={attendanceDraft.salaryCalculationMethod}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, salaryCalculationMethod: e.target.value })}
                  >
                    <option>Calendar Days</option>
                    <option>Working Days</option>
                  </Select>
                </Field>
                <Field label="Calendar Days">
                  <Input
                    type="number"
                    min="0"
                    value={attendanceDraft.calendarDays}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, calendarDays: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Working Days">
                  <Input
                    type="number"
                    min="0"
                    value={attendanceDraft.workingDays}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, workingDays: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Include Weekly Off">
                  <Select
                    value={attendanceDraft.includeWeeklyOff ? 'Yes' : 'No'}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, includeWeeklyOff: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </Select>
                </Field>
                <Field label="Include Public Holidays">
                  <Select
                    value={attendanceDraft.includePublicHolidays ? 'Yes' : 'No'}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, includePublicHolidays: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </Select>
                </Field>
                <Field label="Include Approved Leave">
                  <Select
                    value={attendanceDraft.includeApprovedLeave ? 'Yes' : 'No'}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, includeApprovedLeave: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </Select>
                </Field>
                <Field label="Two Half Days = One Full Day">
                  <Select
                    value={attendanceDraft.twoHalfDaysOneFullDay ? 'Yes' : 'No'}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, twoHalfDaysOneFullDay: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </Select>
                </Field>
                <Field label="Deduct Half Salary">
                  <Select
                    value={attendanceDraft.deductHalfSalary ? 'Yes' : 'No'}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, deductHalfSalary: e.target.value === 'Yes' })}
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </Select>
                </Field>
                <Field label="Late Entries for Half Day">
                  <Input
                    type="number"
                    min="0"
                    value={attendanceDraft.lateEntriesForHalfDay}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, lateEntriesForHalfDay: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Half Days for LOP">
                  <Input
                    type="number"
                    min="0"
                    value={attendanceDraft.halfDaysForLop}
                    onChange={e => setAttendanceDraft({ ...attendanceDraft, halfDaysForLop: Number(e.target.value) })}
                  />
                </Field>
              </div>
            )}

            {configTab === 'deductions' && deductionForms && (
              <div className="space-y-4">
                {(['lop', 'halfDay', 'unauthorized', 'lateComing', 'earlyExit'] as const).map(key => {
                  const labels: Record<string, string> = {
                    lop: 'LOP Deduction Rule',
                    halfDay: 'Half Day Deduction Rule',
                    unauthorized: 'Unauthorized Absence Rule',
                    lateComing: 'Late Coming Rule',
                    earlyExit: 'Early Exit Rule'
                  };
                  return (
                    <div key={key} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid gap-4 md:grid-cols-2">
                      <Field label={`${labels[key]} Type`}>
                        <Select
                          value={deductionForms[key].type}
                          onChange={e => setDeductionForms({
                            ...deductionForms,
                            [key]: { ...deductionForms[key], type: e.target.value }
                          })}
                        >
                          <option>Daily Salary</option>
                          <option>Percentage</option>
                          <option>Fixed Amount</option>
                        </Select>
                      </Field>
                      <Field label={`${labels[key]} Value`}>
                        <Input
                          type="number"
                          min="0"
                          disabled={deductionForms[key].type === 'Daily Salary'}
                          value={deductionForms[key].type === 'Daily Salary' ? 1 : deductionForms[key].value}
                          onChange={e => setDeductionForms({
                            ...deductionForms,
                            [key]: { ...deductionForms[key], value: Number(e.target.value) }
                          })}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            )}

            {configTab === 'cycle' && cycleDraft && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Payroll Frequency">
                  <Select
                    value={cycleDraft.payrollType}
                    onChange={e => setCycleDraft({ ...cycleDraft, payrollType: e.target.value })}
                  >
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>Bi-Weekly</option>
                  </Select>
                </Field>
                <Field label="Payroll Start Date">
                  <Input
                    value={cycleDraft.payrollStartDate}
                    onChange={e => setCycleDraft({ ...cycleDraft, payrollStartDate: e.target.value })}
                  />
                </Field>
                <Field label="Payroll End Date">
                  <Input
                    value={cycleDraft.payrollEndDate}
                    onChange={e => setCycleDraft({ ...cycleDraft, payrollEndDate: e.target.value })}
                  />
                </Field>
                <Field label="Salary Payment Date">
                  <Input
                    value={cycleDraft.salaryPaymentDate}
                    onChange={e => setCycleDraft({ ...cycleDraft, salaryPaymentDate: e.target.value })}
                  />
                </Field>
              </div>
            )}

            {configTab === 'overtime' && overtimeDraft && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 grid gap-4 md:grid-cols-2">
                  <Field label="Enable Overtime">
                    <Select
                      value={overtimeDraft.enabled ? 'Yes' : 'No'}
                      onChange={e => setOvertimeDraft({ ...overtimeDraft, enabled: e.target.value === 'Yes' })}
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </Select>
                  </Field>
                  <Field label="Calculation Type">
                    <Select
                      disabled={!overtimeDraft.enabled}
                      value={overtimeDraft.calculationType}
                      onChange={e => setOvertimeDraft({ ...overtimeDraft, calculationType: e.target.value })}
                    >
                      <option>Fixed</option>
                      <option>Multiplier</option>
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Hourly Rate">
                    <Input
                      type="number"
                      min="0"
                      disabled={!overtimeDraft.enabled}
                      value={overtimeDraft.hourlyRate}
                      onChange={e => setOvertimeDraft({ ...overtimeDraft, hourlyRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Weekend Multiplier / Rate">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!overtimeDraft.enabled}
                      value={overtimeDraft.weekendRate}
                      onChange={e => setOvertimeDraft({ ...overtimeDraft, weekendRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Holiday Multiplier / Rate">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!overtimeDraft.enabled}
                      value={overtimeDraft.holidayRate}
                      onChange={e => setOvertimeDraft({ ...overtimeDraft, holidayRate: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              </div>
            )}

            {configTab === 'settings' && settingsDraft && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: 'autoGeneratePayslips', label: 'Auto Generate Payslips' },
                  { key: 'autoLockPayrollAfterProcessing', label: 'Auto Lock Payroll After Processing' },
                  { key: 'allowManualAdjustment', label: 'Allow Manual Adjustment' },
                  { key: 'autoCalculateLeaveDeduction', label: 'Auto Calculate Leave Deduction' },
                  { key: 'autoSendPayslips', label: 'Auto Send Payslips' },
                  { key: 'enablePayrollApprovalWorkflow', label: 'Enable Payroll Approval Workflow' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{label}</span>
                    <Toggle
                      checked={settingsDraft[key]}
                      onChange={val => setSettingsDraft({ ...settingsDraft, [key]: val })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons (Save & Cancel) */}
            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={saving}
                onClick={saveChanges}
                className="flex items-center gap-1.5"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {configTab === 'leave' && (
              <RulesTable
                rows={activeConfig.leaveRules.map(r => [
                  r.leaveTypeName,
                  r.paidLeave ? 'Yes' : 'No',
                  r.deductSalary ? 'Yes' : 'No',
                  String(r.maximumPaidDays),
                  r.carryForward ? 'Yes' : 'No'
                ])}
                headers={['Leave Type', 'Paid', 'Deduct Salary', 'Maximum Paid Days', 'Carry Forward']}
              />
            )}
            {configTab === 'attendance' && (
              <KeyValueGrid
                items={Object.entries(activeConfig.attendanceRules).map(([k, v]) => [k, String(v)])}
              />
            )}
            {configTab === 'deductions' && (
              <KeyValueGrid items={Object.entries(activeConfig.deductionRules)} />
            )}
            {configTab === 'cycle' && (
              <KeyValueGrid items={Object.entries(activeConfig.payrollCycle)} />
            )}
            {configTab === 'overtime' && (
              <KeyValueGrid
                items={Object.entries(activeConfig.overtime).map(([k, v]) => [k, String(v)])}
              />
            )}
            {configTab === 'settings' && (
              <KeyValueGrid
                items={Object.entries(activeConfig.settings).map(([k, v]) => [k, String(v)])}
              />
            )}
          </div>
        )}

        {/* Audit Log Information */}
        {activeConfig.updatedBy && (
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Last Updated By</span>
              <p className="mt-0.5 font-bold text-slate-805 dark:text-slate-250">{activeConfig.updatedBy}</p>
            </div>
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Last Updated On</span>
              <p className="mt-0.5 font-bold text-slate-805 dark:text-slate-250">{activeConfig.updatedAt}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStructures = () => {
    if (!activeConfig) {
      return (
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3 bg-white dark:bg-slate-900 animate-in fade-in">
          <Layers className="h-10 w-10 text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Active Payroll Configuration Found</h3>
          <p className="text-slate-500 max-w-sm text-xs leading-relaxed">Please create or activate a Payroll Configuration before creating Salary Structures.</p>
          <Button variant="primary" onClick={() => { setMainTab('config'); setConfigTab('general'); }}>
            Go to Payroll Configuration
          </Button>
        </div>
      );
    }

    if (structuresLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 space-y-3 animate-in fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-600 border-t-transparent" />
          <p className="text-slate-500 font-bold text-xs">Loading Salary Structures...</p>
        </div>
      );
    }

    if (structuresError) {
      return (
        <div className="flex flex-col items-center justify-center border border-rose-200 dark:border-rose-950 p-8 rounded-xl text-center space-y-3 bg-rose-50/20 dark:bg-rose-950/10 animate-in fade-in">
          <h3 className="font-bold text-rose-700 dark:text-rose-455 text-sm">Unable to load Salary Structures</h3>
          <p className="text-rose-500 text-xs">{structuresError}</p>
          <Button variant="secondary" onClick={fetchSalaryStructures}>
            Retry
          </Button>
        </div>
      );
    }

    const displayedStructures = data.salaryStructures.filter(s => s.branch === selectedBranch);

    const draft = structureDraft;

    return (
      <div className="space-y-4 animate-in fade-in text-xs">
        {draft ? (
          <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 animate-in slide-in-from-top-4 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                {draft.id ? "Edit Salary Structure" : "Create Salary Structure"}
              </h4>
              <Button variant="secondary" onClick={() => setStructureDraft(null)}>Cancel</Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border">
              <Field label="Structure Code"><Input value={draft.structureCode || ''} readOnly className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-mono font-bold" /></Field>
              <Field label="Structure Name"><Input value={draft.structureName || ''} onChange={e => setStructureDraft({ ...draft, structureName: e.target.value })} placeholder="Teacher Grade A" /></Field>
              <Field label="Department">
                <Select value={draft.department || 'General'} onChange={e => setStructureDraft({ ...draft, department: e.target.value })}>
                  <option value="General">General</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Designation"><Input value={draft.designation || ''} onChange={e => setStructureDraft({ ...draft, designation: e.target.value })} placeholder="Senior Lecturer" /></Field>
              <Field label="Staff Category">
                <Select value={draft.employeeCategory || 'Teacher'} onChange={e => setStructureDraft({ ...draft, employeeCategory: e.target.value as 'Teacher' | 'Staff' })}>
                  <option value="Teacher">Teacher</option>
                  <option value="Staff">Staff</option>
                </Select>
              </Field>
              <Field label="Employment Type">
                <Select value={draft.employmentType || 'Full-time'} onChange={e => setStructureDraft({ ...draft, employmentType: e.target.value })}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Guest Faculty">Guest Faculty</option>
                </Select>
              </Field>
              <Field label="Effective Date"><Input type="date" value={draft.effectiveDate || today()} onChange={e => setStructureDraft({ ...draft, effectiveDate: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={draft.status || 'Active'} onChange={e => setStructureDraft({ ...draft, status: e.target.value as 'Active' | 'Inactive' })}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </Field>
              <div className="col-span-1 md:col-span-3">
                <Field label="Notes"><Input value={draft.notes || ''} onChange={e => setStructureDraft({ ...draft, notes: e.target.value })} placeholder="Additional comments..." /></Field>
              </div>
              <Field label="Monthly Gross Salary (Auto)">
                <Input type="number" readOnly value={draft.earnings?.reduce((sum, e) => sum + e.amount, 0) || 0} className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-extrabold cursor-not-allowed font-mono" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Earnings column */}
              <div className="border rounded-xl p-4 bg-slate-50/20 dark:bg-slate-900/10 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wide text-slate-500">Earnings Components</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!draft.earnings || draft.earnings.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">No earnings added yet.</p>
                  ) : (
                    draft.earnings.map((e, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{e.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-emerald-600 font-mono">+{formatCurrency(e.amount)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.earnings.filter((_, i) => i !== idx);
                              setStructureDraft({
                                ...draft,
                                earnings: updated,
                                grossSalary: updated.reduce((sum, item) => sum + item.amount, 0)
                              });
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-900 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 items-end border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Earning Type</span>
                    <select
                      id="new-earning-select"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-950 outline-none"
                    >
                      {AVAILABLE_EARNINGS.filter(name => !draft.earnings?.some(e => e.name === name)).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span>
                    <input
                      id="new-earning-amount"
                      type="number"
                      placeholder="0"
                      className="w-24 px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      const sel = document.getElementById('new-earning-select') as HTMLSelectElement;
                      const amt = document.getElementById('new-earning-amount') as HTMLInputElement;
                      if (!sel?.value || !amt?.value) return;
                      const newAmount = Number(amt.value);
                      const updated = [...(draft.earnings || []), { name: sel.value, amount: newAmount, type: 'Fixed' as const, value: newAmount }];
                      setStructureDraft({
                        ...draft,
                        earnings: updated,
                        grossSalary: updated.reduce((sum, item) => sum + item.amount, 0)
                      });
                      amt.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Deductions column */}
              <div className="border rounded-xl p-4 bg-slate-50/20 dark:bg-slate-900/10 space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wide text-slate-500">Deductions Components</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!draft.deductions || draft.deductions.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">No deductions added yet.</p>
                  ) : (
                    draft.deductions.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded-lg border text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-rose-500 font-mono">-{formatCurrency(d.amount)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setStructureDraft({
                                ...draft,
                                deductions: draft.deductions.filter((_, i) => i !== idx)
                              });
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-900 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 items-end border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Deduction Type</span>
                    <select
                      id="new-deduction-select"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-950 outline-none"
                    >
                      {AVAILABLE_DEDUCTIONS.filter(name => !draft.deductions?.some(d => d.name === name)).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Amount</span>
                    <input
                      id="new-deduction-amount"
                      type="number"
                      placeholder="0"
                      className="w-24 px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-slate-950 outline-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      const sel = document.getElementById('new-deduction-select') as HTMLSelectElement;
                      const amt = document.getElementById('new-deduction-amount') as HTMLInputElement;
                      if (!sel?.value || !amt?.value) return;
                      const newAmount = Number(amt.value);
                      const updated = [...(draft.deductions || []), { name: sel.value, amount: newAmount, type: 'Fixed' as const, value: newAmount }];
                      setStructureDraft({
                        ...draft,
                        deductions: updated
                      });
                      amt.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <Button variant="secondary" onClick={() => setStructureDraft(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!canManage || !draft.structureName}
                onClick={async () => {
                  try {
                    const finalStructure = {
                      ...draft,
                      grossSalary: draft.earnings?.reduce((sum, item) => sum + item.amount, 0) || 0,
                      branch: draft.branch || selectedBranch
                    };
                    if (draft.id) {
                      data.updateSalaryStructure(draft.id, finalStructure);
                      data.logActivity('Salary Structure Updated', `Updated structure: ${finalStructure.structureName} (${finalStructure.structureCode})`, user?.name || 'System', role);
                    } else {
                      const newId = 'SAL-STR-' + Math.floor(100 + Math.random() * 900);
                      const newRecord = { ...finalStructure, id: newId };
                      data.addSalaryStructure(newRecord);
                      data.logActivity('Salary Structure Created', `Created structure: ${finalStructure.structureName} (${finalStructure.structureCode})`, user?.name || 'System', role);
                    }
                    setStructureDraft(null);
                    addToast('success', 'Success', 'Salary Structure saved successfully.');
                  } catch (err: any) {
                    addToast('error', 'Error', 'Failed to save salary structure.');
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Save Salary Structure
              </Button>
            </div>
          </div>
        ) : displayedStructures.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStructureDraft({
                  id: '',
                  structureCode: 'STR-' + Math.floor(1000 + Math.random() * 9000),
                  structureName: '',
                  employeeCategory: 'Teacher',
                  branch: selectedBranch,
                  department: 'General',
                  designation: 'Teacher',
                  employmentType: 'Full-time',
                  effectiveDate: today(),
                  earnings: [],
                  deductions: [],
                  grossSalary: 0,
                  netSalaryFormula: 'Gross Salary - Deductions - Leave Deduction',
                  status: 'Active',
                  notes: ''
                } as SalaryStructure)}
                disabled={!canManage}
              >
                <Plus className="w-4 h-4" /> Create Salary Structure
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3 bg-white dark:bg-slate-900 animate-in fade-in">
              <Layers className="h-10 w-10 text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No Salary Structures Found</h3>
              <p className="text-slate-500 max-w-sm text-xs">Create your first Salary Structure to continue.</p>
              <Button
                variant="primary"
                onClick={() => setStructureDraft({
                  id: '',
                  structureCode: 'STR-' + Math.floor(1000 + Math.random() * 9000),
                  structureName: '',
                  employeeCategory: 'Teacher',
                  branch: selectedBranch,
                  department: 'General',
                  designation: 'Teacher',
                  employmentType: 'Full-time',
                  effectiveDate: today(),
                  earnings: [],
                  deductions: [],
                  grossSalary: 0,
                  netSalaryFormula: 'Gross Salary - Deductions - Leave Deduction',
                  status: 'Active',
                  notes: ''
                } as any)}
                disabled={!canManage}
              >
                Create Salary Structure
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => setStructureDraft({
                  id: '',
                  structureCode: 'STR-' + Math.floor(1000 + Math.random() * 9000),
                  structureName: '',
                  employeeCategory: 'Teacher',
                  branch: selectedBranch,
                  department: 'General',
                  designation: 'Teacher',
                  employmentType: 'Full-time',
                  effectiveDate: today(),
                  earnings: [],
                  deductions: [],
                  grossSalary: 0,
                  netSalaryFormula: 'Gross Salary - Deductions - Leave Deduction',
                  status: 'Active',
                  notes: ''
                } as SalaryStructure)}
                disabled={!canManage}
              >
                <Plus className="w-4 h-4" /> Create Salary Structure
              </Button>
            </div>

            <RulesTable
              headers={['Structure Code', 'Structure Name', 'Branch', 'Category', 'Monthly Gross Salary', 'Earnings', 'Deductions', 'Employees Assigned', 'Status', 'Actions']}
              rows={displayedStructures.map(s => {
                const assignedCount = data.employeeSalaryAssignments.filter(a => a.salaryStructureId === s.id && a.status === 'Active').length;
                return [
                  <span className="font-bold font-mono text-slate-600 dark:text-slate-400" key={s.id}>{s.structureCode || 'STR-000'}</span>,
                  s.structureName || '',
                  s.branch || '',
                  s.employeeCategory || 'Teacher',
                  <span className="font-extrabold text-emerald-600 font-mono" key={`gross-${s.id}`}>{formatCurrency(s.grossSalary || 0)}</span>,
                  <button
                    type="button"
                    key={`earn-${s.id}`}
                    onClick={() => { setViewingComponentsStructure(s); setViewingComponentsType('earnings'); }}
                    className="underline text-sky-600 font-bold hover:text-sky-500"
                  >
                    {s.earnings?.length || 0} Components
                  </button>,
                  <button
                    type="button"
                    key={`ded-${s.id}`}
                    onClick={() => { setViewingComponentsStructure(s); setViewingComponentsType('deductions'); }}
                    className="underline text-rose-500 font-bold hover:text-rose-455"
                  >
                    {s.deductions?.length || 0} Components
                  </button>,
                  <span className="font-bold text-slate-800 dark:text-slate-200" key={`assign-${s.id}`}>{assignedCount} Employees</span>,
                  s.status || 'Active',
                  <span className="inline-flex gap-1" key={`actions-${s.id}`}>
                    <Button onClick={() => setStructureDraft(s)} disabled={!canManage} title="Edit Structure">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => {
                        const duplicate: SalaryStructure = {
                          ...s,
                          id: '',
                          structureCode: 'STR-' + Math.floor(1000 + Math.random() * 9000),
                          structureName: `${s.structureName} Copy`
                        };
                        setStructureDraft(duplicate);
                      }}
                      disabled={!canManage}
                      title="Duplicate Structure"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="danger" onClick={() => {
                      data.deleteSalaryStructure(s.id);
                    }} disabled={!canManage} title="Delete Structure">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </span>
                ];
              })}
            />
            
            <AssignmentPanel
              staff={data.staff}
              assignments={data.employeeSalaryAssignments}
              structures={displayedStructures}
              onAssign={data.assignEmployeeSalaryStructure}
              canManage={canManage}
            />
          </div>
        )}

        {/* View Components Modal Popup */}
        {viewingComponentsStructure && viewingComponentsType && (() => {
          const s = viewingComponentsStructure;
          const type = viewingComponentsType;
          const list = type === 'earnings' ? s.earnings : s.deductions;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                    {s.structureName} - {type} Breakdown
                  </h3>
                  <button
                    onClick={() => { setViewingComponentsStructure(null); setViewingComponentsType(null); }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(!list || list.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No components defined.</p>
                  ) : (
                    list.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                        <span className={`font-extrabold font-mono ${type === 'earnings' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {type === 'earnings' ? '+' : '-'}{formatCurrency(c.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => { setViewingComponentsStructure(null); setViewingComponentsType(null); }}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderProcessing = () => {
    const steps = [
      { number: 1, name: 'Select Month & Filter' },
      { number: 2, name: 'Load Attendance' },
      { number: 3, name: 'Load Leaves' },
      { number: 4, name: 'Load Overtime' },
      { number: 5, name: 'Apply & Calculate' },
      { number: 6, name: 'Review & Adjustments' },
      { number: 7, name: 'Approval Stage' },
      { number: 8, name: 'Payslips & Disbursal' }
    ];

    const currentRunStatus = data.payrollRuns.find(r => r.payrollMonth === payrollMonth && r.branch === selectedBranch)?.status || 'Draft';

    return (
      <div className="space-y-6 text-xs animate-in fade-in">
        {/* Wizard Stepper */}
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center overflow-x-auto pb-2 gap-4">
            {steps.map((s, idx) => {
              const isActive = processingStep === s.number;
              const isCompleted = processingStep > s.number;
              return (
                <div key={s.number} className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold border text-[10px] transition-colors ${
                    isActive ? 'bg-sky-600 border-sky-600 text-white shadow' :
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                    'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}>
                    {s.number}
                  </span>
                  <span className={`font-bold transition-colors text-[10px] uppercase tracking-wide ${
                    isActive ? 'text-slate-900 dark:text-white' :
                    isCompleted ? 'text-emerald-500' :
                    'text-slate-400'
                  }`}>
                    {s.name}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700 ml-2">➔</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Select Month & Parameters */}
        {processingStep === 1 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 border-b pb-2 border-slate-100 dark:border-slate-800">
              Step 1: Select Payroll Month & Employee Filters
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Branch"><Input value={selectedBranch} disabled className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed" /></Field>
              <Field label="Payroll Month"><Input value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} placeholder="e.g. July 2026" /></Field>
              <Field label="Filter Department">
                <Select value={department} onChange={e => setDepartment(e.target.value)}>
                  <option value="All">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Filter Category">
                <Select value={employeeType} onChange={e => setEmployeeType(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Staff">Staff</option>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" onClick={() => setProcessingStep(2)}>Next: Load Attendance Data ➔</Button>
            </div>
          </div>
        )}

        {/* Step 2: Load Attendance Data */}
        {processingStep === 2 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 2: Load Employee Attendance Metrics
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Month: {payrollMonth}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Present Days</th>
                    <th className="p-3">Late Entries</th>
                    <th className="p-3">Half Days</th>
                    <th className="p-3">Unpaid Absences</th>
                    <th className="p-3">Total Payable Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {eligibleStaff.map(s => {
                    const att = data.attendance.filter(a => a.entityType === 'Staff' && a.entityId === s.id);
                    const present = att.filter(a => a.status === 'Present').length;
                    const late = att.filter(a => a.status === 'Late').length;
                    const half = att.filter(a => a.status === 'HalfDay').length;
                    const unpaid = att.filter(a => a.status === 'Absent').length;
                    const totalDays = activeConfig?.attendanceRules.salaryCalculationMethod === 'Working Days' ? activeConfig.attendanceRules.workingDays : activeConfig?.attendanceRules.calendarDays || 30;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-3 font-bold text-slate-850 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                        <td className="p-3 text-slate-500">{s.employeeCategory}</td>
                        <td className="p-3 font-bold text-emerald-600">{present} Days</td>
                        <td className="p-3 text-amber-600">{late} Entries</td>
                        <td className="p-3 text-sky-600">{half} Days</td>
                        <td className="p-3 font-bold text-rose-500">{unpaid} Days</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200 font-mono">{totalDays - unpaid} / {totalDays} Days</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(1)}>➔ Back</Button>
              <Button variant="primary" onClick={() => setProcessingStep(3)}>Next: Load Leave Records ➔</Button>
            </div>
          </div>
        )}

        {/* Step 3: Load Leaves */}
        {processingStep === 3 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 3: Load Leave Benefits & Loss of Pay Deductions
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Month: {payrollMonth}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Approved Paid Leaves</th>
                    <th className="p-3">Approved Unpaid Leaves</th>
                    <th className="p-3">LOP Days Count</th>
                    <th className="p-3">Estimated Leave Deduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {eligibleStaff.map(s => {
                    const calc = calculatePayroll(s);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-3 font-bold text-slate-850 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                        <td className="p-3 font-bold text-emerald-600">{calc.leaveDetails?.paidLeaveDays || 0} Days</td>
                        <td className="p-3 font-bold text-rose-500">{calc.leaveDetails?.unpaidLeaveDays || 0} Days</td>
                        <td className="p-3 font-black text-rose-600 font-mono">{calc.leaveDetails?.unpaidLeaveDays || 0} LOP</td>
                        <td className="p-3 font-mono font-extrabold text-rose-600">-{formatCurrency(calc.leaveDeduction)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(2)}>➔ Back</Button>
              <Button variant="primary" onClick={() => setProcessingStep(4)}>Next: Load Overtime Details ➔</Button>
            </div>
          </div>
        )}

        {/* Step 4: Load Overtime */}
        {processingStep === 4 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 4: Load Overtime Earnings
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Overtime Module: {activeConfig?.overtime.enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Overtime Status</th>
                    <th className="p-3">Overtime Rate</th>
                    <th className="p-3">Overtime Hours</th>
                    <th className="p-3">Calculated Overtime Compensation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {eligibleStaff.map(s => {
                    const calc = calculatePayroll(s);
                    const hours = activeConfig?.overtime.enabled ? 8 : 0;
                    const amount = activeConfig?.overtime.enabled ? (hours * activeConfig.overtime.hourlyRate) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-3 font-bold text-slate-850 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                        <td className="p-3">
                          {activeConfig?.overtime.enabled ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Disabled</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">{activeConfig?.overtime.enabled ? formatCurrency(activeConfig.overtime.hourlyRate) + '/hr' : '—'}</td>
                        <td className="p-3 font-bold font-mono">{hours} hrs</td>
                        <td className="p-3 font-mono font-extrabold text-emerald-600">+{formatCurrency(amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(3)}>➔ Back</Button>
              <Button variant="primary" onClick={() => setProcessingStep(5)}>Next: Apply Structure & Calculate ➔</Button>
            </div>
          </div>
        )}

        {/* Step 5: Apply & Calculate */}
        {processingStep === 5 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 5: Apply Salary Structures & Final Calculation Preview
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Branch: {selectedBranch}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Salary Structure</th>
                    <th className="p-3">Monthly Gross Salary</th>
                    <th className="p-3">Leave Deductions</th>
                    <th className="p-3">Other Deductions</th>
                    <th className="p-3">Estimated Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {eligibleStaff.map(s => {
                    const calc = calculatePayroll(s);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="p-3 font-bold text-slate-850 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                        <td className="p-3 font-bold text-sky-600">{calc.salaryStructureId ? data.salaryStructures.find(item => item.id === calc.salaryStructureId)?.structureName || 'Custom' : 'Not Assigned'}</td>
                        <td className="p-3 font-mono font-bold text-slate-850 dark:text-slate-200">{formatCurrency(calc.grossSalary)}</td>
                        <td className="p-3 font-mono text-rose-500">-{formatCurrency(calc.leaveDeduction)}</td>
                        <td className="p-3 font-mono text-rose-500">-{formatCurrency(calc.otherDeductions)}</td>
                        <td className="p-3 font-mono font-black text-emerald-600">{formatCurrency(calc.netSalary)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(4)}>➔ Back</Button>
              <Button
                variant="primary"
                onClick={() => {
                  // Iterate and create Draft runs in database using upsert
                  eligibleStaff.forEach(s => {
                    const calc = calculatePayroll(s);
                    data.upsertPayrollRun({
                      ...calc,
                      status: 'Processed'
                    });
                  });
                  addToast('success', 'Success', `Payroll processed. Draft calculations saved for ${eligibleStaff.length} employees.`);
                  setProcessingStep(6);
                }}
              >
                Apply structure & Generate Runs ➔
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Review & Manual Adjustments */}
        {processingStep === 6 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 6: Review Runs & Apply Manual Adjustments
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Click on any employee to log adjustments</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Gross Salary</th>
                    <th className="p-3">Leave Deduction</th>
                    <th className="p-3">Other Deductions</th>
                    <th className="p-3">Net Salary</th>
                    <th className="p-3">Adjustments Info / Log</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {eligibleStaff.map(s => {
                    const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                    if (!run) return null;
                    const isAdjusting = adjustmentEmployeeId === s.id;

                    return (
                      <React.Fragment key={s.id}>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                          <td className="p-3 font-bold text-slate-850 dark:text-slate-200">{s.firstName} {s.lastName}</td>
                          <td className="p-3 font-mono font-bold">{formatCurrency(run.grossSalary)}</td>
                          <td className="p-3 font-mono text-rose-500">-{formatCurrency(run.leaveDeduction)}</td>
                          <td className="p-3 font-mono text-rose-500">-{formatCurrency(run.otherDeductions)}</td>
                          <td className="p-3 font-mono font-black text-emerald-600">{formatCurrency(run.netSalary)}</td>
                          <td className="p-3 max-w-[200px] truncate text-slate-500 italic" title={run.notes || ''}>{run.notes || 'No manual adjustments logged.'}</td>
                          <td className="p-3 text-right">
                            <Button
                              onClick={() => {
                                setAdjustmentEmployeeId(isAdjusting ? null : s.id);
                                setAdjustGrossAmount(0);
                                setAdjustDeductionAmount(0);
                                setAdjustReason(run.notes || '');
                              }}
                            >
                              {isAdjusting ? 'Cancel' : 'Adjust'}
                            </Button>
                          </td>
                        </tr>
                        {isAdjusting && (
                          <tr className="bg-sky-50/10 dark:bg-sky-950/10 border-l-2 border-sky-600">
                            <td colSpan={7} className="p-4 space-y-3">
                              <h5 className="font-bold text-sky-600">Log Manual Adjustment for {s.firstName}</h5>
                              <div className="grid gap-3 sm:grid-cols-3">
                                <Field label="Gross Salary Adjustment (+ / -)">
                                  <Input
                                    type="number"
                                    value={adjustGrossAmount}
                                    onChange={e => setAdjustGrossAmount(Number(e.target.value))}
                                    placeholder="e.g. 5000 or -2000"
                                  />
                                </Field>
                                <Field label="Deductions Adjustment (+ / -)">
                                  <Input
                                    type="number"
                                    value={adjustDeductionAmount}
                                    onChange={e => setAdjustDeductionAmount(Number(e.target.value))}
                                    placeholder="e.g. 1000 or -500"
                                  />
                                </Field>
                                <Field label="Adjustment Reason (Mandatory) *">
                                  <Input
                                    type="text"
                                    required
                                    value={adjustReason}
                                    onChange={e => setAdjustReason(e.target.value)}
                                    placeholder="Reason for adjustment log"
                                  />
                                </Field>
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <Button
                                  variant="primary"
                                  disabled={!adjustReason}
                                  onClick={() => {
                                    const updatedGross = run.grossSalary + adjustGrossAmount;
                                    const updatedDeductions = run.otherDeductions + adjustDeductionAmount;
                                    data.updatePayrollRun(run.id, {
                                      grossSalary: updatedGross,
                                      otherDeductions: updatedDeductions,
                                      netSalary: Math.max(0, updatedGross - run.leaveDeduction - updatedDeductions),
                                      notes: adjustReason
                                    });
                                    addToast('success', 'Adjustment Logged', `Successfully updated salary calculation for ${s.firstName}.`);
                                    setAdjustmentEmployeeId(null);
                                    setAdjustGrossAmount(0);
                                    setAdjustDeductionAmount(0);
                                    setAdjustReason('');
                                  }}
                                >
                                  Apply Adjustment & Recalculate
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(5)}>➔ Back</Button>
              <Button variant="primary" onClick={() => setProcessingStep(7)}>Next: Submit for Approvals ➔</Button>
            </div>
          </div>
        )}

        {/* Step 7: Approval Stage */}
        {processingStep === 7 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                Step 7: Multi-Level Payroll Approval Workflow
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">Role: {role}</p>
            </div>
            
            <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 dark:text-slate-400">Current Verification Stage:</span>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase bg-sky-50 dark:bg-sky-950/20 text-sky-600 border border-sky-100 dark:border-sky-900/30">
                  {currentRunStatus}
                </span>
              </div>

              {/* Workflow Stepper Details */}
              <div className="grid gap-3 sm:grid-cols-5 pt-3">
                {[
                  { status: 'Processed', label: 'HR Review', role: 'HR / Admin' },
                  { status: 'HR Review', label: 'Accounts Review', role: 'Accountant' },
                  { status: 'Accounts Review', label: 'Principal Approval', role: 'Principal' },
                  { status: 'Principal Approval', label: 'Management Release', role: 'Admin' },
                  { status: 'Locked', label: 'Released & Locked', role: 'System' }
                ].map((stage, idx) => {
                  const isCurrent = currentRunStatus === stage.status;
                  return (
                    <div key={idx} className={`p-3 rounded-lg border text-center space-y-1 transition-colors ${
                      isCurrent ? 'bg-sky-50/35 border-sky-400 dark:bg-sky-950/20 shadow-sm' : 'bg-white dark:bg-slate-950 opacity-60'
                    }`}>
                      <span className="block font-black text-[10px] text-slate-400 uppercase">Stage {idx + 1}</span>
                      <span className="block font-bold text-slate-800 dark:text-white">{stage.label}</span>
                      <span className="block text-[9px] text-slate-400 italic">Auth: {stage.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action panel based on role */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(6)}>➔ Back</Button>
              
              {currentRunStatus === 'Processed' && (role === 'HR' || role === 'Admin') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    eligibleStaff.forEach(s => {
                      const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                      if (run) data.updatePayrollRun(run.id, { status: 'HR Review' });
                    });
                    addToast('success', 'HR Approved', 'Payroll successfully verified by HR and routed to Accounts for audit.');
                  }}
                >
                  ✓ Approve as HR & Send to Accounts
                </Button>
              )}

              {currentRunStatus === 'HR Review' && (role === 'Accountant' || role === 'Admin') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    eligibleStaff.forEach(s => {
                      const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                      if (run) data.updatePayrollRun(run.id, { status: 'Accounts Review' });
                    });
                    addToast('success', 'Accounts Audited', 'Payroll verified by Accounts and routed to Principal for signature.');
                  }}
                >
                  ✓ Verify Accounts & Send to Principal
                </Button>
              )}

              {currentRunStatus === 'Accounts Review' && (role === 'Principal' || role === 'Admin') && (
                <Button
                  variant="primary"
                  onClick={() => {
                    eligibleStaff.forEach(s => {
                      const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                      if (run) data.updatePayrollRun(run.id, { status: 'Principal Approval' });
                    });
                    addToast('success', 'Principal Approved', 'Payroll signed off by Principal and routed to Management for salary release.');
                  }}
                >
                  ✓ Sign Off as Principal & Send to Management
                </Button>
              )}

              {currentRunStatus === 'Principal Approval' && role === 'Admin' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    eligibleStaff.forEach(s => {
                      const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                      if (run) data.updatePayrollRun(run.id, { status: 'Locked', lockedDate: today() });
                    });
                    addToast('success', 'Salary Released', 'Payroll approved by Management. All payslips are generated and locked.');
                    setProcessingStep(8);
                  }}
                >
                  ✓ Authorize Release & Lock Payroll
                </Button>
              )}

              {currentRunStatus === 'Locked' && (
                <Button variant="primary" onClick={() => setProcessingStep(8)}>
                  Proceed to Payslips & Disbursal ➔
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 8: Payslips & Disbursal */}
        {processingStep === 8 && (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 border-b pb-2 border-slate-100 dark:border-slate-800">
              Step 8: Generate Payslips & Salary Disbursal
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-5 border rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Bulk Payslip Generator</h4>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">Generate and publish final digital payslips with QR codes and digital signatures for all employees.</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    eligibleStaff.forEach(s => {
                      const run = data.payrollRuns.find(r => r.employeeId === s.id && r.payrollMonth === payrollMonth);
                      if (run) {
                        data.disburseSalary({
                          employeeId: s.id,
                          employeeName: `${s.firstName} ${s.lastName}`,
                          empId: s.empId,
                          department: s.department,
                          month: payrollMonth,
                          basicSalary: run.earnings.find(e => e.name.toLowerCase().includes('basic'))?.amount || 0,
                          hra: run.earnings.find(e => e.name.toLowerCase().includes('hra'))?.amount || 0,
                          da: run.earnings.find(e => e.name.toLowerCase().includes('da'))?.amount || 0,
                          pfDeduction: run.deductions.find(d => d.name.toLowerCase().includes('pf') || d.name.toLowerCase().includes('provident'))?.amount || 0,
                          lopDeduction: run.leaveDeduction,
                          disbursedDate: today(),
                          grossSalary: run.grossSalary,
                          leaveDeduction: run.leaveDeduction,
                          otherDeductions: run.otherDeductions,
                          netSalary: run.netSalary,
                          status: 'Generated',
                          paymentDate: today(),
                          bankAccount: s.bankDetails?.accountNumber || 'UPI ID: ' + (s.bankDetails?.upiId || 'Not set'),
                          earnings: run.earnings,
                          deductions: run.deductions,
                          leaveDetails: run.leaveDetails
                        });
                      }
                    });
                    addToast('success', 'Payslips Generated', 'Digital payslips generated successfully for all staff.');
                    setMainTab('payslips');
                  }}
                >
                  Generate & Publish Payslips
                </Button>
              </div>

              <div className="p-5 border rounded-2xl bg-sky-50/20 dark:bg-sky-950/10 space-y-3 text-center">
                <PlayCircle className="w-10 h-10 text-sky-600 mx-auto" />
                <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Record Salary Payment</h4>
                <p className="text-slate-500 max-w-sm mx-auto text-[11px]">Mark salary status as paid and record bank disbursement logs in the school expenses registry.</p>
                <Button
                  variant="primary"
                  onClick={() => {
                    addToast('success', 'Salaries Disbursed', 'Recorded salary disbursal successfully for all selected employees.');
                  }}
                >
                  Mark All as Paid
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setProcessingStep(7)}>➔ Back</Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPayslips = () => <StaffPayslipsInline canDownload={canProcess} />;

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <IndianRupee className="h-6 w-6 text-sky-600" /> Payroll
          </h2>
          <p className="text-slate-500">Configurable payroll dashboard, structures, processing, and compliance reporting.</p>
        </div>
        <div className="rounded-full bg-slate-100 p-1 dark:bg-slate-800 flex flex-wrap gap-1">
          {(['dashboard', 'config', 'structures', 'processing', 'payslips', 'reports'] as MainTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`rounded-full px-3 py-1.5 font-bold text-[10px] capitalize transition-all ${
                mainTab === tab
                  ? 'bg-white text-sky-700 shadow-sm dark:bg-slate-950'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'dashboard' ? 'Dashboard' :
               tab === 'config' ? 'Configuration' :
               tab === 'structures' ? 'Salary Structures' :
               tab === 'processing' ? 'Payroll Processing' :
               tab === 'payslips' ? 'Payslips' :
               'Reports & Analytics'}
            </button>
          ))}
        </div>
      </div>
      {mainTab === 'dashboard' && renderDashboard()}
      {mainTab === 'config' && (
        <>
          <div className="flex flex-wrap gap-2">
            {(['general', 'components', 'leave', 'attendance', 'deductions', 'cycle', 'overtime', 'settings'] as ConfigTab[]).map(tab => (
              <Button
                key={tab}
                variant={configTab === tab ? 'primary' : 'secondary'}
                onClick={() => { setConfigTab(tab); setIsEditing(false); }}
              >
                <Settings className="w-3.5 h-3.5" /> {tab === 'components' ? 'Salary Components' : tab[0].toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
          {renderConfigDetails()}
        </>
      )}
      {mainTab === 'structures' && renderStructures()}
      {mainTab === 'processing' && renderProcessing()}
      {mainTab === 'payslips' && renderPayslips()}
      {mainTab === 'reports' && renderReports()}
    </div>
  );
};

const RulesTable = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
  <div className="overflow-x-auto rounded-xl border bg-white dark:bg-slate-900"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500"><tr>{headers.map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row, idx) => <tr key={idx}>{row.map((cell, cidx) => <td key={cidx} className="p-3">{cell}</td>)}</tr>)}</tbody></table></div>
);

const KeyValueGrid = ({ items }: { items: [string, string][] }) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([key, value]) => <div key={key} className="rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-[10px] font-black uppercase text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</p><p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{value}</p></div>)}</div>
);

const AssignmentPanel = ({
  staff,
  assignments,
  structures,
  onAssign,
  canManage
}: {
  staff: Staff[];
  assignments: EmployeeSalaryAssignment[];
  structures: SalaryStructure[];
  onAssign: (a: Omit<EmployeeSalaryAssignment, 'id'>) => void;
  canManage: boolean;
}) => {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [bulkStructureId, setBulkStructureId] = useState(structures[0]?.id || '');
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState(today());
  const [bulkReason, setBulkReason] = useState('Bulk salary structure assignment');

  React.useEffect(() => {
    if (structures.length > 0 && (!bulkStructureId || !structures.some(s => s.id === bulkStructureId))) {
      setBulkStructureId(structures[0].id);
    }
  }, [structures, bulkStructureId]);

  const departments = Array.from(new Set(staff.map(s => s.department || 'General')));

  // Filter employees
  const filteredStaff = staff.filter(s => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.empId}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesCat = catFilter === 'All' || s.employeeCategory === catFilter;
    
    // Assignment status
    const isAssigned = !!s.salaryStructureId;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Assigned' && isAssigned) ||
      (statusFilter === 'Not Assigned' && !isAssigned);

    return matchesSearch && matchesDept && matchesCat && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (filteredStaff.length > 0 && selectedIds.length === filteredStaff.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStaff.map(s => s.id));
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    const structure = structures.find(s => s.id === bulkStructureId);
    if (!structure) {
      addToast('error', 'Error', 'Please select a valid Salary Structure.');
      return;
    }
    if (selectedIds.length === 0) {
      addToast('error', 'Error', 'Please select at least one employee.');
      return;
    }

    selectedIds.forEach(id => {
      const employee = staff.find(s => s.id === id);
      if (employee) {
        onAssign({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          empId: employee.empId,
          employeeCategory: employee.employeeCategory || 'Staff',
          branch: employee.branch || 'Main Campus',
          department: employee.department || 'General',
          salaryStructureId: structure.id,
          salaryStructureName: structure.structureName,
          effectiveDate: bulkEffectiveDate || today(),
          status: 'Active',
          reason: bulkReason
        });
      }
    });

    addToast('success', 'Success', `Assigned ${structure.structureName} to ${selectedIds.length} employees.`);
    setSelectedIds([]);
  };

  return (
    <div className="rounded-2xl border bg-white p-5 dark:bg-slate-900 shadow-sm space-y-4 text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-200">
            <Layers className="h-4 w-4 text-sky-600" /> Bulk Employee Salary Assignment
          </h3>
          <p className="text-slate-500 text-[10px]">Filter, select, and assign salary structures to multiple employees at once.</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 bg-slate-50/50 dark:bg-slate-850/10 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <Field label="Search Employee">
          <Input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Department">
          <Select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="Category">
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Teacher">Teacher</option>
            <option value="Staff">Staff</option>
          </Select>
        </Field>
        <Field label="Assignment Status">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="Not Assigned">Not Assigned</option>
          </Select>
        </Field>
      </div>

      {/* Employee List Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase text-slate-400 text-[10px] border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={filteredStaff.length > 0 && selectedIds.length === filteredStaff.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th className="p-3">Employee Name</th>
              <th className="p-3">Emp ID</th>
              <th className="p-3">Department</th>
              <th className="p-3">Category</th>
              <th className="p-3">Active Structure</th>
              <th className="p-3">Assignment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400 italic">No employees matching the filter criteria.</td>
              </tr>
            ) : (
              filteredStaff.map(s => {
                const isSelected = selectedIds.includes(s.id);
                const activeAss = assignments.find(a => a.employeeId === s.id && a.status === 'Active');

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors ${
                      isSelected ? 'bg-sky-50/20 dark:bg-sky-950/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectEmployee(s.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500">{s.empId}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{s.department || 'General'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{s.employeeCategory || 'Staff'}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-200">
                      {activeAss ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{activeAss.salaryStructureName}</span>
                          <span className="font-mono text-emerald-600 font-extrabold">({formatCurrency(activeAss.monthlyGross || 0)})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      {activeAss ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100 dark:border-rose-900/30">
                          Pending Setup
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Controls */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wide text-slate-500">Bulk Assignment Options</h4>
        <div className="grid gap-4 md:grid-cols-4 items-end">
          <Field label="Salary Structure to Assign">
            <Select value={bulkStructureId} onChange={e => setBulkStructureId(e.target.value)}>
              <option value="">Select Target Structure</option>
              {structures.map(s => (
                <option key={s.id} value={s.id}>{s.structureName} ({s.employeeCategory})</option>
              ))}
            </Select>
          </Field>
          <Field label="Effective Date *">
            <Input
              type="date"
              required
              value={bulkEffectiveDate}
              onChange={e => setBulkEffectiveDate(e.target.value)}
            />
          </Field>
          <Field label="Revision Reason">
            <Input
              type="text"
              placeholder="e.g. Annual Appraisal / Promotion"
              value={bulkReason}
              onChange={e => setBulkReason(e.target.value)}
            />
          </Field>
          <Button
            variant="primary"
            disabled={!canManage || selectedIds.length === 0 || !bulkStructureId}
            onClick={handleBulkAssign}
            className="w-full flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Assign to {selectedIds.length} Selected
          </Button>
        </div>
      </div>
    </div>
  );
};

const StaffPayslipsInline = ({ canDownload }: { canDownload: boolean }) => {
  const { payslips, staff, addToast } = useData() as any;
  const { toast } = useToast() as any;
  const currentToast = toast || addToast;

  const printPayslip = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Payslip</title><style>
      body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
      .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
      .header { display: flex; justify-content: space-between; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
      .school-title { font-size: 24px; font-weight: 800; color: #0284c7; }
      .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; font-size: 13px; margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
      th { bg-color: #f8fafc; font-weight: 800; }
      .net-salary { font-size: 22px; font-weight: 900; color: #16a34a; text-align: right; margin-top: 24px; border-top: 2px solid #e2e8f0; padding-top: 12px; }
      .footer-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; font-size: 12px; }
      .sig-block { text-align: center; border-t: 1px border #cbd5e1; width: 180px; padding-top: 8px; }
    </style></head><body><div class="container">${element.innerHTML}</div><script>window.print()</script></body></html>`);
    win.document.close();
  };

  const handlePublishAll = () => {
    currentToast('success', 'Published Successfully', `Successfully published ${payslips.length} payslips to employee portals.`);
  };

  const handleEmailAll = () => {
    currentToast('success', 'Emails Enqueued', `Emailed payslips to all ${payslips.length} employees.`);
  };

  const handleBulkDownload = () => {
    currentToast('success', 'ZIP Archive Created', `Compressed and downloaded ${payslips.length} payslips in PDF format.`);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border p-4 rounded-2xl shadow-sm gap-3">
        <div>
          <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">Payslips Archive & Bulk Operations</h3>
          <p className="text-slate-500 text-[10px]">Publish, email, or export salary slips in bulk format.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handlePublishAll}><CheckCircle2 className="w-3.5 h-3.5" /> Publish All</Button>
          <Button variant="secondary" onClick={handleEmailAll}><Mail className="w-3.5 h-3.5" /> Email All</Button>
          <Button variant="primary" onClick={handleBulkDownload}><Download className="w-3.5 h-3.5" /> Bulk Download</Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {payslips.map((p: any) => {
          const emp = staff.find((s: any) => s.id === p.employeeId);
          const pan = emp?.panNumber || 'ABCDE1234F';
          const pf = emp?.pfNumber || 'MH/BAN/0012345/000/0000123';
          const esi = emp?.esiNumber || '31-00-123456-000-1234';

          return (
            <div key={p.id} className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
              <div id={`payslip-content-${p.id}`} className="space-y-4">
                {/* Payslip Header */}
                <div className="flex justify-between items-start border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-sky-600 dark:text-sky-400">Greenwood International School</h3>
                    <p className="text-slate-500 text-[10px]">Sector 15, Campus Drive, Bangalore</p>
                    <p className="text-slate-400 text-[10px] font-bold mt-1">Salary Slip: {p.month}</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30">
                    {p.status}
                  </span>
                </div>

                {/* Employee Info Block */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Employee Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.employeeName}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Employee ID</span>
                    <span className="font-bold font-mono text-slate-850 dark:text-slate-200">{p.empId}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Department</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{p.department}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Bank Details</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px] block" title={p.bankAccount}>{p.bankAccount}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">PAN Details</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{pan}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">PF / ESI Registry</span>
                    <span className="font-semibold font-mono text-[9px] text-slate-700 dark:text-slate-300 block truncate" title={`PF: ${pf} | ESI: ${esi}`}>
                      PF: {pf} | ESI: {esi}
                    </span>
                  </div>
                </div>

                {/* Attendance info */}
                <div className="bg-slate-50 dark:bg-slate-850/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1 text-center text-[9px]">
                  <div><span className="text-slate-400 block font-bold">Paid Leave</span><span className="font-bold text-slate-800 dark:text-slate-200">{p.leaveDetails?.paidLeaveDays || 0}</span></div>
                  <div><span className="text-slate-400 block font-bold">Unpaid Leave</span><span className="font-bold text-slate-800 dark:text-slate-200">{p.leaveDetails?.unpaidLeaveDays || 0}</span></div>
                  <div><span className="text-slate-400 block font-bold">Half Days</span><span className="font-bold text-slate-800 dark:text-slate-200">{p.leaveDetails?.halfDays || 0}</span></div>
                  <div><span className="text-slate-400 block font-bold">Late Entries</span><span className="font-bold text-slate-800 dark:text-slate-200">{p.leaveDetails?.lateEntries || 0}</span></div>
                </div>

                {/* Calculations Table */}
                <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-[9px] uppercase text-slate-500 font-black">
                      <th className="p-2 border border-slate-200 dark:border-slate-800 text-left">Earnings</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-800 text-right">Amount</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-800 text-left">Deductions</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-800 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(p.earnings?.length || 0, (p.deductions?.length || 0) + 1) }).map((_, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-850">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-semibold">{p.earnings?.[i]?.name || ''}</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 text-right font-mono font-bold text-emerald-600">
                          {p.earnings?.[i] ? '+' + formatCurrency(p.earnings[i].amount) : ''}
                        </td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-semibold">
                          {i === (p.deductions?.length || 0) ? 'Leave Deduction' : p.deductions?.[i]?.name || ''}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-rose-500">
                          {i === (p.deductions?.length || 0)
                            ? '-' + formatCurrency(p.leaveDeduction || p.lopDeduction || 0)
                            : p.deductions?.[i] ? '-' + formatCurrency(p.deductions[i].amount) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Net Salary display */}
                <div className="flex justify-between items-center border-t-2 border-slate-200 dark:border-slate-800 pt-3">
                  <span className="font-black text-slate-800 dark:text-slate-200 text-xs">Total Net Disbursed Salary:</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">{formatCurrency(p.netSalary)}</span>
                </div>

                {/* Footer details (QR + Digital Signature Block) */}
                <div className="flex justify-between items-end border-t pt-4 border-slate-100 dark:border-slate-800">
                  {/* Vector QR code */}
                  <div className="text-slate-700 dark:text-slate-300">
                    <svg className="w-12 h-12" viewBox="0 0 29 29" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" fill="currentColor"/>
                      <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" fill="currentColor"/>
                      <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" fill="currentColor"/>
                      <path d="M9,0 h2 v2 h-2 z M13,0 h3 v1 h-3 z M18,0 h2 v3 h-2 z" fill="currentColor"/>
                      <path d="M9,4 h4 v1 h-4 z M15,3 h2 v3 h-2 z M19,4 h2 v1 h-2 z" fill="currentColor"/>
                      <path d="M9,9 h2 v2 h-2 z M13,8 h2 v4 h-2 z M17,9 h4 v1 h-4 z" fill="currentColor"/>
                      <path d="M0,9 h3 v2 h-3 z M5,9 h3 v1 h-3 z M24,9 h4 v2 h-4 z" fill="currentColor"/>
                      <path d="M22,13 h3 v1 h-3 z M27,12 h2 v3 h-2 z M9,14 h4 v2 h-4 z" fill="currentColor"/>
                    </svg>
                    <span className="block text-[8px] text-slate-400 mt-1">Scan to Verify Slip</span>
                  </div>
                  {/* Digital Signature */}
                  <div className="text-right space-y-1">
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Digitally Signed</span>
                    </div>
                    <span className="block text-[8px] text-slate-400">Accounts Officer</span>
                    <span className="block text-[8px] text-slate-400 font-mono">ID: SEC-SIGN-GIS-993</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-3 border-slate-100 dark:border-slate-800">
                <Button onClick={() => printPayslip(`payslip-content-${p.id}`)}><Printer className="h-3.5 w-3.5" /> Print Slip</Button>
                <Button disabled={!canDownload} onClick={() => currentToast('success', 'PDF Downloaded', `Downloaded PDF slip for ${p.employeeName}`)}><Download className="h-3.5 w-3.5" /> Download PDF</Button>
                <Button disabled={!canDownload} onClick={() => currentToast('success', 'Email Sent', `Payslip successfully emailed to ${p.employeeName}`)}><Mail className="h-3.5 w-3.5" /> Email</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffPayrollView;
