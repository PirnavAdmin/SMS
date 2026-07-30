import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeIndianRupee,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Layers,
  Mail,
  Plus,
  ReceiptText,
  Search,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import {
  EmployeeSalaryAssignment,
  Payslip,
  SalaryStructure,
  Staff
} from '../../../types';
import { PayrollDrawer } from './PayrollDrawer';

type PayrollTabId =
  | 'staff-payroll-employees'
  | 'staff-payroll-structures'
  | 'staff-payroll-payslips'
  | 'staff-payroll-history';

interface PayrollModuleViewProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

type CategoryValue = 'Teacher' | 'Staff';

type StructureDraft = {
  id?: string;
  structureName: string;
  employeeCategory: CategoryValue;
  designation: string;
  status: 'Active' | 'Inactive';
  effectiveDate: string;
  payrollFrequency: 'Monthly';
  salaryPaymentDay: string;
  pfApplicable: boolean;
  pfPercentage: string;
  esiApplicable: boolean;
  esiPercentage: string;
  professionalTaxApplicable: boolean;
  professionalTaxAmount: string;
  roundOffRule: 'No Round Off' | 'Nearest 1' | 'Nearest 10' | 'Nearest 50';
  notes: string;
  basicSalary: string;
  hra: string;
  da: string;
  medicalAllowance: string;
  travelAllowance: string;
  specialAllowance: string;
  performanceAllowance: string;
  otherAllowance: string;
  employeePf: string;
  employerPf: string;
  esi: string;
  professionalTax: string;
  incomeTax: string;
  loanDeduction: string;
  otherDeduction: string;
};

type AssignmentDraft = {
  employeeId: string;
  employeeCategory: CategoryValue | '';
  designation: string;
  salaryStructureId: string;
  salaryOverride: boolean;
  basicSalary: string;
  allowances: string;
  deductions: string;
  effectiveDate: string;
};

const payrollTabs: { id: PayrollTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'staff-payroll-employees', label: 'Employees', icon: Users },
  { id: 'staff-payroll-structures', label: 'Salary Structures', icon: Layers },
  { id: 'staff-payroll-payslips', label: 'Generate Payslips', icon: ReceiptText },
  { id: 'staff-payroll-history', label: 'Payslip History', icon: Clock3 }
];

const teacherDesignationOptions = [
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

const monthOptions = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const currentYear = new Date().getFullYear();
const yearOptions = [String(currentYear), String(currentYear - 1), String(currentYear - 2)];
const roundOffOptions = ['No Round Off', 'Nearest 1', 'Nearest 10', 'Nearest 50'];

const inputClass =
  'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const selectClass = inputClass;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getCategoryLabel = (category?: CategoryValue | null) => (category === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff');

const resolveCategory = (staff: Staff): CategoryValue => {
  if (staff.employeeCategory) return staff.employeeCategory;
  return staff.role === 'Teacher' ? 'Teacher' : 'Staff';
};

const designationOptionsForCategory = (category: CategoryValue | '') => {
  if (category === 'Teacher') return teacherDesignationOptions;
  if (category === 'Staff') return nonTeachingDesignationOptions;
  return [];
};

const roundAmount = (amount: number, rule?: 'No Round Off' | 'Nearest 1' | 'Nearest 10' | 'Nearest 50') => {
  if (!rule || rule === 'No Round Off') return amount;
  if (rule === 'Nearest 1') return Math.round(amount);
  if (rule === 'Nearest 10') return Math.round(amount / 10) * 10;
  if (rule === 'Nearest 50') return Math.round(amount / 50) * 50;
  return amount;
};

const structureEarningFields = [
  { key: 'basicSalary', label: 'Basic Salary' },
  { key: 'hra', label: 'HRA' },
  { key: 'da', label: 'DA' },
  { key: 'medicalAllowance', label: 'Medical Allowance' },
  { key: 'travelAllowance', label: 'Travel Allowance' },
  { key: 'specialAllowance', label: 'Special Allowance' },
  { key: 'performanceAllowance', label: 'Performance Allowance' },
  { key: 'otherAllowance', label: 'Other Allowance' }
] as const;

const structureDeductionFields = [
  { key: 'employeePf', label: 'Employee PF' },
  { key: 'employerPf', label: 'Employer PF' },
  { key: 'esi', label: 'ESI' },
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'incomeTax', label: 'Income Tax' },
  { key: 'loanDeduction', label: 'Loan Deduction' },
  { key: 'otherDeduction', label: 'Other Deduction' }
] as const;

const structureKeywords = (designation: string) => {
  const key = normalize(designation);
  if (key.includes('viceprincipal')) return ['vice-principal', 'vice principal'];
  if (key.includes('principal')) return ['principal'];
  if (key.includes('pgt')) return ['pgt'];
  if (key.includes('tgt')) return ['tgt'];
  if (key.includes('prt')) return ['prt'];
  if (key.includes('pet')) return ['pet'];
  if (key.includes('music')) return ['music'];
  if (key.includes('art')) return ['art'];
  if (key.includes('dance')) return ['dance'];
  if (key.includes('computer')) return ['computer'];
  if (key.includes('librarian')) return ['librarian'];
  if (key.includes('specialeducator')) return ['special-educator', 'special educator'];
  if (key.includes('administrator')) return ['administrator'];
  if (key.includes('hrexecutive')) return ['hr'];
  if (key.includes('accountant')) return ['accountant'];
  if (key.includes('receptionist')) return ['receptionist'];
  if (key.includes('officeassistant')) return ['office-assistant', 'office assistant'];
  if (key.includes('admissioncounselor')) return ['admission'];
  if (key.includes('itsupport')) return ['it'];
  if (key.includes('labassistant')) return ['lab'];
  if (key.includes('storekeeper')) return ['store'];
  if (key.includes('transportmanager')) return ['transport'];
  if (key.includes('driver')) return ['driver'];
  if (key.includes('securityguard')) return ['security'];
  if (key.includes('cleaner')) return ['cleaner'];
  if (key.includes('nurse')) return ['nurse'];
  if (key.includes('hostelwarden')) return ['hostel'];
  return [key];
};

const structureMatches = (structure: SalaryStructure, category: CategoryValue | '', designation: string) => {
  if (category && structure.employeeCategory !== category) return false;
  if (!designation) return true;
  const keywords = structureKeywords(designation);
  const haystack = normalize(`${structure.structureName} ${structure.designation || ''}`);
  return keywords.some(keyword => haystack.includes(normalize(keyword)));
};

const getStructureBreakdown = (structure?: SalaryStructure, override?: Partial<EmployeeSalaryAssignment>) => {
  const basicLine = structure?.earnings.find(line => /basic/i.test(line.name)) || structure?.earnings[0];
  const structureEarnings = structure?.earnings || [];
  const structureDeductions = structure?.deductions || [];
  const basicSalary = Number(override?.overrideBasicSalary ?? basicLine?.amount ?? 0);
  const allowancesBase = Math.max(0, structureEarnings.reduce((sum, line) => sum + line.amount, 0) - (basicLine?.amount ?? 0));
  const deductionsBase = structureDeductions.reduce((sum, line) => sum + (/employer\s*pf/i.test(line.name) ? 0 : line.amount), 0);
  const allowances = Number(override?.overrideAllowances ?? allowancesBase);
  const deductions = Number(override?.overrideDeductions ?? deductionsBase);
  const grossSalary = Number(structure?.grossSalary || basicSalary + allowances);
  const netSalary = Math.max(0, Number(override?.overrideNetSalary ?? (grossSalary - deductions)));
  return { basicSalary, allowances, deductions, grossSalary, netSalary };
};

const splitMonthYear = (monthLabel?: string) => {
  if (!monthLabel) return { month: 'N/A', year: 'N/A' };
  const match = monthLabel.match(/^(.*?)(?:\s+(\d{4}))?$/);
  if (!match) return { month: monthLabel, year: 'N/A' };
  return {
    month: match[1] || monthLabel,
    year: match[2] || 'N/A'
  };
};

const periodLabel = (month: string, year: string) => `${month} ${year}`.trim();

const todayString = () => new Date().toISOString().split('T')[0];

const normalizePayrollTab = (tab?: string): PayrollTabId => {
  switch (tab) {
    case 'staff-payroll-employees':
      return 'staff-payroll-employees';
    case 'staff-payroll-structures':
      return 'staff-payroll-structures';
    case 'staff-payroll-history':
      return 'staff-payroll-history';
    case 'staff-payroll-payslips':
    case 'staff-payslips':
    case 'staff-payroll':
    case 'staff-payroll-assignment':
    case 'staff-payroll-processing':
    case 'staff-payroll-reports':
      return 'staff-payroll-payslips';
    default:
      return 'staff-payroll-employees';
  }
};

const StatCard: React.FC<{
  label: string;
  value: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'brand' | 'emerald' | 'sky' | 'amber' | 'slate';
}> = ({ label, value, helper, icon: Icon, tone = 'brand' }) => {
  const toneStyles: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-950/30 dark:text-brand-300 dark:border-brand-900',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
    sky: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-black">{value}</p>
          {helper && <p className="mt-1 text-[11px] opacity-80">{helper}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-white/10">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ModalShell: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ title, subtitle, onClose, children, maxWidth = 'max-w-5xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
    <div className={`w-full ${maxWidth} overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">{children}</div>
    </div>
  </div>
);

const defaultEffectiveDate = new Date().toISOString().split('T')[0];

const structureDraftDefaults: StructureDraft = {
  structureName: '',
  employeeCategory: 'Teacher',
  designation: '',
  status: 'Active',
  effectiveDate: defaultEffectiveDate,
  payrollFrequency: 'Monthly',
  salaryPaymentDay: '5',
  pfApplicable: true,
  pfPercentage: '12',
  esiApplicable: true,
  esiPercentage: '1.75',
  professionalTaxApplicable: true,
  professionalTaxAmount: '200',
  roundOffRule: 'Nearest 1',
  notes: '',
  basicSalary: '0',
  hra: '0',
  da: '0',
  medicalAllowance: '0',
  travelAllowance: '0',
  specialAllowance: '0',
  performanceAllowance: '0',
  otherAllowance: '0',
  employeePf: '0',
  employerPf: '0',
  esi: '0',
  professionalTax: '0',
  incomeTax: '0',
  loanDeduction: '0',
  otherDeduction: '0'
};

const parseMoney = (value: string) => Number(value) || 0;

const findLineAmount = (lines: { name: string; amount: number }[] = [], keywords: string[]) => {
  const match = lines.find(line => keywords.some(keyword => normalize(line.name).includes(normalize(keyword))));
  return match?.amount ?? 0;
};

const getStructureDraftFromStructure = (structure: SalaryStructure, mode: 'add' | 'edit' | 'duplicate'): StructureDraft => ({
  id: structure.id,
  structureName: mode === 'duplicate' ? `${structure.structureName} Copy` : structure.structureName,
  employeeCategory: structure.employeeCategory,
  designation: structure.designation || '',
  status: mode === 'duplicate' ? 'Inactive' : structure.status,
  effectiveDate: structure.effectiveDate || defaultEffectiveDate,
  payrollFrequency: 'Monthly',
  salaryPaymentDay: structure.salaryPaymentDay || '5',
  pfApplicable: structure.pfApplicable ?? findLineAmount(structure.deductions, ['employee pf', 'employer pf', 'provident fund']) > 0,
  pfPercentage: String(structure.pfPercentage ?? 12),
  esiApplicable: structure.esiApplicable ?? findLineAmount(structure.deductions, ['esi', 'employee state insurance']) > 0,
  esiPercentage: String(structure.esiPercentage ?? 1.75),
  professionalTaxApplicable: structure.professionalTaxApplicable ?? findLineAmount(structure.deductions, ['professional tax']) > 0,
  professionalTaxAmount: String(structure.professionalTaxAmount ?? (findLineAmount(structure.deductions, ['professional tax']) || 200)),
  roundOffRule: structure.roundOffRule || 'Nearest 1',
  notes: structure.notes || '',
  basicSalary: String(findLineAmount(structure.earnings, ['basic salary', 'basic'])),
  hra: String(findLineAmount(structure.earnings, ['hra', 'house rent allowance'])),
  da: String(findLineAmount(structure.earnings, ['da', 'dearness allowance'])),
  medicalAllowance: String(findLineAmount(structure.earnings, ['medical allowance', 'medical'])),
  travelAllowance: String(findLineAmount(structure.earnings, ['travel allowance', 'conveyance', 'transport allowance'])),
  specialAllowance: String(findLineAmount(structure.earnings, ['special allowance'])),
  performanceAllowance: String(findLineAmount(structure.earnings, ['performance allowance', 'incentive'])),
  otherAllowance: String(findLineAmount(structure.earnings, ['other allowance', 'allowances'])),
  employeePf: String(findLineAmount(structure.deductions, ['employee pf', 'provident fund', 'pf'])),
  employerPf: String(findLineAmount(structure.deductions, ['employer pf'])),
  esi: String(findLineAmount(structure.deductions, ['esi', 'employee state insurance'])),
  professionalTax: String(findLineAmount(structure.deductions, ['professional tax'])),
  incomeTax: String(findLineAmount(structure.deductions, ['income tax', 'tds'])),
  loanDeduction: String(findLineAmount(structure.deductions, ['loan deduction', 'loan'])),
  otherDeduction: String(findLineAmount(structure.deductions, ['other deduction', 'deductions']))
});

const getStructureDraftTotals = (draft: StructureDraft) => {
  const totalEarnings =
    parseMoney(draft.basicSalary) +
    parseMoney(draft.hra) +
    parseMoney(draft.da) +
    parseMoney(draft.medicalAllowance) +
    parseMoney(draft.travelAllowance) +
    parseMoney(draft.specialAllowance) +
    parseMoney(draft.performanceAllowance) +
    parseMoney(draft.otherAllowance);

  const pfTotal = draft.pfApplicable ? parseMoney(draft.employeePf) + parseMoney(draft.employerPf) : 0;
  const esiTotal = draft.esiApplicable ? parseMoney(draft.esi) : 0;
  const professionalTaxTotal = draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0;
  const totalDeductions =
    pfTotal +
    esiTotal +
    professionalTaxTotal +
    parseMoney(draft.incomeTax) +
    parseMoney(draft.loanDeduction) +
    parseMoney(draft.otherDeduction);

  return {
    grossSalary: totalEarnings,
    totalEarnings,
    totalDeductions,
    netSalary: roundAmount(Math.max(0, totalEarnings - totalDeductions), draft.roundOffRule)
  };
};

const buildStructurePayload = (draft: StructureDraft): Omit<SalaryStructure, 'id'> => {
  const totals = getStructureDraftTotals(draft);
  return {
    structureName: draft.structureName.trim(),
    employeeCategory: draft.employeeCategory,
    branch: 'Main Campus',
    earnings: [
      { name: 'Basic Salary', amount: parseMoney(draft.basicSalary), type: 'Fixed', value: parseMoney(draft.basicSalary) },
      { name: 'HRA', amount: parseMoney(draft.hra), type: 'Fixed', value: parseMoney(draft.hra) },
      { name: 'DA', amount: parseMoney(draft.da), type: 'Fixed', value: parseMoney(draft.da) },
      { name: 'Medical Allowance', amount: parseMoney(draft.medicalAllowance), type: 'Fixed', value: parseMoney(draft.medicalAllowance) },
      { name: 'Travel Allowance', amount: parseMoney(draft.travelAllowance), type: 'Fixed', value: parseMoney(draft.travelAllowance) },
      { name: 'Special Allowance', amount: parseMoney(draft.specialAllowance), type: 'Fixed', value: parseMoney(draft.specialAllowance) },
      { name: 'Performance Allowance', amount: parseMoney(draft.performanceAllowance), type: 'Fixed', value: parseMoney(draft.performanceAllowance) },
      { name: 'Other Allowance', amount: parseMoney(draft.otherAllowance), type: 'Fixed', value: parseMoney(draft.otherAllowance) }
    ],
    deductions: [
      { name: 'Employee PF', amount: draft.pfApplicable ? parseMoney(draft.employeePf) : 0, type: 'Fixed', value: draft.pfApplicable ? parseMoney(draft.employeePf) : 0 },
      { name: 'Employer PF', amount: draft.pfApplicable ? parseMoney(draft.employerPf) : 0, type: 'Fixed', value: draft.pfApplicable ? parseMoney(draft.employerPf) : 0 },
      { name: 'ESI', amount: draft.esiApplicable ? parseMoney(draft.esi) : 0, type: 'Fixed', value: draft.esiApplicable ? parseMoney(draft.esi) : 0 },
      { name: 'Professional Tax', amount: draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0, type: 'Fixed', value: draft.professionalTaxApplicable ? parseMoney(draft.professionalTax) : 0 },
      { name: 'Income Tax', amount: parseMoney(draft.incomeTax), type: 'Fixed', value: parseMoney(draft.incomeTax) },
      { name: 'Loan Deduction', amount: parseMoney(draft.loanDeduction), type: 'Fixed', value: parseMoney(draft.loanDeduction) },
      { name: 'Other Deduction', amount: parseMoney(draft.otherDeduction), type: 'Fixed', value: parseMoney(draft.otherDeduction) }
    ],
    grossSalary: totals.grossSalary,
    netSalaryFormula: 'Gross Salary - Total Deductions',
    status: draft.status,
    designation: draft.designation.trim(),
    payrollFrequency: draft.payrollFrequency,
    salaryPaymentDay: draft.salaryPaymentDay.trim() || '5',
    pfApplicable: draft.pfApplicable,
    pfPercentage: Number(draft.pfPercentage) || 0,
    esiApplicable: draft.esiApplicable,
    esiPercentage: Number(draft.esiPercentage) || 0,
    professionalTaxApplicable: draft.professionalTaxApplicable,
    professionalTaxAmount: Number(draft.professionalTaxAmount) || 0,
    roundOffRule: draft.roundOffRule,
    notes: draft.notes.trim() || undefined,
    effectiveDate: draft.effectiveDate || defaultEffectiveDate
  };
};

const assignmentDraftDefaults: AssignmentDraft = {
  employeeId: '',
  employeeCategory: '',
  designation: '',
  salaryStructureId: '',
  salaryOverride: false,
  basicSalary: '',
  allowances: '',
  deductions: '',
  effectiveDate: todayString()
};

export const PayrollModuleView: React.FC<PayrollModuleViewProps> = ({ initialTab = 'staff-payroll-employees', onTabChange }) => {
  const {
    staff,
    salaryStructures,
    employeeSalaryAssignments,
    payslips,
    attendance,
    leaveApplications,
    addSalaryStructure,
    updateSalaryStructure,
    deleteSalaryStructure,
    cloneSalaryStructure,
    assignEmployeeSalaryStructure,
    disburseSalary
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<PayrollTabId>('staff-payroll-employees');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeCategoryFilter, setEmployeeCategoryFilter] = useState<'All' | CategoryValue>('All');
  const [employeeStructureFilter, setEmployeeStructureFilter] = useState('All Structures');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'All' | 'Active' | 'Not Assigned'>('All');
  const [structureSearch, setStructureSearch] = useState('');
  const [structureCategoryFilter, setStructureCategoryFilter] = useState<'All' | CategoryValue>('All');
  const [structureDesignationFilter, setStructureDesignationFilter] = useState('All');
  const [structureStatusFilter, setStructureStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [generationMonth, setGenerationMonth] = useState(monthOptions[new Date().getMonth()]);
  const [generationYear, setGenerationYear] = useState(String(currentYear));
  const [generationBranch, setGenerationBranch] = useState('All Branches');
  const [generationDepartment, setGenerationDepartment] = useState('All Departments');
  const [generationCategory, setGenerationCategory] = useState<'All' | CategoryValue>('All');
  const [generationEmployee, setGenerationEmployee] = useState('All Employees');
  const [historyEmployee, setHistoryEmployee] = useState('All Employees');
  const [historyMonth, setHistoryMonth] = useState('All');
  const [historyYear, setHistoryYear] = useState('All');
  const [historyDepartment, setHistoryDepartment] = useState('All Departments');
  const [drawerStaff, setDrawerStaff] = useState<Staff | null>(null);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [structureMode, setStructureMode] = useState<'add' | 'edit' | 'duplicate'>('add');
  const [structureEditingId, setStructureEditingId] = useState<string | null>(null);
  const [structureDraft, setStructureDraft] = useState<StructureDraft>(structureDraftDefaults);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>(assignmentDraftDefaults);

  useEffect(() => {
    setActiveTab(normalizePayrollTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);

  const branches = useMemo(() => ['All Branches', ...Array.from(new Set(staff.map(item => item.branch || 'Main Campus')))], [staff]);
  const departments = useMemo(() => ['All Departments', ...Array.from(new Set(staff.map(item => item.department).filter(Boolean)))], [staff]);
  const employeeOptions = useMemo(() => ['All Employees', ...staff.map(item => `${item.firstName} ${item.lastName}`.trim())], [staff]);
  const structureOptions = useMemo(() => ['All Structures', ...salaryStructures.map(item => item.structureName)], [salaryStructures]);
  const designationSet = useMemo(() => {
    const values = salaryStructures.map(item => item.designation).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(values))];
  }, [salaryStructures]);

  const employeeRows = useMemo(() => {
    return staff.map(member => {
      const activeAssignment = employeeSalaryAssignments.find(item => item.employeeId === member.id && item.status === 'Active') || null;
      const structure = salaryStructures.find(item => item.id === activeAssignment?.salaryStructureId) || null;
      const breakdown = getStructureBreakdown(structure || undefined, activeAssignment || undefined);
      const category = resolveCategory(member);
      return {
        member,
        category,
        assignment: activeAssignment,
        structure,
        breakdown,
        payrollStatus: activeAssignment ? 'Active' : 'Not Assigned'
      };
    });
  }, [employeeSalaryAssignments, salaryStructures, staff]);

  const filteredEmployeeRows = useMemo(() => {
    const query = normalize(employeeSearch);
    return employeeRows.filter(row => {
      const matchesSearch =
        query.length === 0 ||
        normalize(`${row.member.firstName} ${row.member.lastName} ${row.member.empId} ${row.member.department} ${row.member.designation} ${row.structure?.structureName || ''}`).includes(query);
      const matchesCategory = employeeCategoryFilter === 'All' || row.category === employeeCategoryFilter;
      const matchesStructure = employeeStructureFilter === 'All Structures' || row.structure?.structureName === employeeStructureFilter;
      const matchesStatus = employeeStatusFilter === 'All' || row.payrollStatus === employeeStatusFilter;
      return matchesSearch && matchesCategory && matchesStructure && matchesStatus;
    });
  }, [employeeCategoryFilter, employeeRows, employeeSearch, employeeStatusFilter, employeeStructureFilter]);

  const structureRows = useMemo(() => {
    return salaryStructures.map(structure => {
      const assignedCount = employeeSalaryAssignments.filter(item => item.salaryStructureId === structure.id && item.status === 'Active').length;
      return {
        structure,
        assignedCount,
        breakdown: getStructureBreakdown(structure)
      };
    });
  }, [employeeSalaryAssignments, salaryStructures]);

  const filteredStructureRows = useMemo(() => {
    const query = normalize(structureSearch);
    return structureRows.filter(row => {
      const matchesSearch =
        query.length === 0 ||
        normalize(`${row.structure.structureName} ${row.structure.designation || ''} ${row.structure.structureCode || ''}`).includes(query);
      const matchesCategory = structureCategoryFilter === 'All' || row.structure.employeeCategory === structureCategoryFilter;
      const matchesDesignation = structureDesignationFilter === 'All' || row.structure.designation === structureDesignationFilter;
      const matchesStatus = structureStatusFilter === 'All' || row.structure.status === structureStatusFilter;
      return matchesSearch && matchesCategory && matchesDesignation && matchesStatus;
    });
  }, [structureCategoryFilter, structureDesignationFilter, structureRows, structureSearch, structureStatusFilter]);

  const activeStructureCount = structureRows.filter(row => row.structure.status === 'Active').length;
  const assignedEmployeeCount = employeeRows.filter(row => row.assignment && row.assignment.status === 'Active').length;
  const overrideEmployeeCount = employeeRows.filter(row => row.assignment?.salaryOverride).length;
  const totalPreviewNet = structureRows.reduce((sum, row) => sum + row.breakdown.netSalary, 0);

  const payrollMonthLabel = periodLabel(generationMonth, generationYear);
  const structureDraftPreview = useMemo(() => getStructureDraftTotals(structureDraft), [structureDraft]);

  const generationCandidates = useMemo(() => {
    return employeeRows.filter(row => {
      if (!row.assignment || row.assignment.status !== 'Active') return false;
      const staffBranch = row.member.branch || 'Main Campus';
      const matchesBranch = generationBranch === 'All Branches' || staffBranch === generationBranch;
      const matchesDepartment = generationDepartment === 'All Departments' || row.member.department === generationDepartment;
      const matchesCategory = generationCategory === 'All' || row.category === generationCategory;
      const employeeLabel = `${row.member.firstName} ${row.member.lastName}`.trim();
      const matchesEmployee = generationEmployee === 'All Employees' || employeeLabel === generationEmployee;
      return matchesBranch && matchesDepartment && matchesCategory && matchesEmployee;
    });
  }, [employeeRows, generationBranch, generationCategory, generationDepartment, generationEmployee]);

  const generationRows = useMemo(() => {
    return generationCandidates.map(row => {
      const existing = payslips.find(item => item.employeeId === row.member.id && item.month === payrollMonthLabel) || null;
      const breakdown = row.breakdown;
      const leaveRecords = leaveApplications.filter(item => item.employeeId === row.member.id && item.status === 'Approved');
      const attendanceRecords = attendance.filter(item => item.entityType === 'Staff' && item.entityId === row.member.id);
      const presentDays = attendanceRecords.filter(item => item.status === 'Present').length;
      const halfDays = attendanceRecords.filter(item => item.status === 'HalfDay').length;
      const lateMarks = attendanceRecords.filter(item => item.status === 'Late').length;
      const approvedLeaveDays = leaveRecords.reduce((sum, item) => sum + Number(item.numberOfDays || 0), 0);
      const workingDays = Math.max(1, Math.max(presentDays + halfDays, 22));
      const lopDays = Math.max(0, workingDays - presentDays - approvedLeaveDays - halfDays * 0.5);
      const attendanceDeduction = Math.round((breakdown.grossSalary / workingDays) * lopDays);
      const deductions = breakdown.deductions + attendanceDeduction;
      const netSalary = roundAmount(Math.max(0, breakdown.grossSalary - deductions), row.structure?.roundOffRule);
      return {
        ...row,
        existing,
        breakdown,
        presentDays,
        halfDays,
        lateMarks,
        approvedLeaveDays,
        lopDays,
        deductions,
        netSalary
      };
    });
  }, [attendance, generationCandidates, leaveApplications, payrollMonthLabel, payslips]);

  const historyRows = useMemo(() => {
    return payslips.filter(item => {
      const { month, year } = splitMonthYear(item.month);
      const matchesEmployee = historyEmployee === 'All Employees' || item.employeeName === historyEmployee;
      const matchesMonth = historyMonth === 'All' || month === historyMonth;
      const matchesYear = historyYear === 'All' || year === historyYear;
      const matchesDepartment = historyDepartment === 'All Departments' || (item.department || 'Unknown') === historyDepartment;
      return matchesEmployee && matchesMonth && matchesYear && matchesDepartment;
    });
  }, [historyDepartment, historyEmployee, historyMonth, historyYear, payslips]);

  const currentPreviewStaff = drawerStaff;

  const openStructureModal = (mode: 'add' | 'edit' | 'duplicate', structure?: SalaryStructure) => {
    setStructureMode(mode);
    setStructureEditingId(structure?.id || null);
    setStructureDraft(
      structure
        ? getStructureDraftFromStructure(structure, mode)
        : structureDraftDefaults
    );
    setStructureModalOpen(true);
  };

  const openAssignmentModal = (staffMember?: Staff) => {
    const member = staffMember || null;
    const category = member ? resolveCategory(member) : '';
    const activeAssignment = member ? employeeSalaryAssignments.find(item => item.employeeId === member.id && item.status === 'Active') || null : null;
    const candidateStructures = salaryStructures.filter(item => structureMatches(item, category, member?.designation || ''));
    const structure = activeAssignment
      ? salaryStructures.find(item => item.id === activeAssignment.salaryStructureId)
      : candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0] || null;
    const breakdown = getStructureBreakdown(structure || undefined, activeAssignment || undefined);
    setAssignmentDraft({
      employeeId: member?.id || '',
      employeeCategory: category,
      designation: member?.designation || '',
      salaryStructureId: structure?.id || '',
      salaryOverride: !!activeAssignment?.salaryOverride,
      basicSalary: String(activeAssignment?.overrideBasicSalary ?? breakdown.basicSalary),
      allowances: String(activeAssignment?.overrideAllowances ?? breakdown.allowances),
      deductions: String(activeAssignment?.overrideDeductions ?? breakdown.deductions),
      effectiveDate: activeAssignment?.effectiveDate || todayString()
    });
    setAssignmentModalOpen(true);
  };

  const closeStructureModal = () => {
    setStructureModalOpen(false);
    setStructureEditingId(null);
    setStructureDraft(structureDraftDefaults);
  };

  const closeAssignmentModal = () => {
    setAssignmentModalOpen(false);
    setAssignmentDraft(assignmentDraftDefaults);
  };

  const filteredDesignationOptions = useMemo(() => {
    if (assignmentDraft.employeeCategory === 'Teacher') return teacherDesignationOptions;
    if (assignmentDraft.employeeCategory === 'Staff') return nonTeachingDesignationOptions;
    return [];
  }, [assignmentDraft.employeeCategory]);

  const structureOptionsForAssignment = useMemo(() => {
    const category = assignmentDraft.employeeCategory;
    const designation = assignmentDraft.designation;
    const matches = salaryStructures.filter(item => structureMatches(item, category, designation));
    if (matches.length > 0) return matches;
    if (category) return salaryStructures.filter(item => item.employeeCategory === category);
    return salaryStructures;
  }, [assignmentDraft.designation, assignmentDraft.employeeCategory, salaryStructures]);

  useEffect(() => {
    if (!assignmentModalOpen) return;
    if (!assignmentDraft.employeeId) return;
    const member = staff.find(item => item.id === assignmentDraft.employeeId);
    if (!member) return;
    const category = resolveCategory(member);
    const designation = member.designation || assignmentDraft.designation;
    const options = salaryStructures.filter(item => structureMatches(item, category, designation));
    const nextStructure = options[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0];
    if (!assignmentDraft.designation) {
      setAssignmentDraft(prev => ({
        ...prev,
        employeeCategory: category,
        designation,
        salaryStructureId: nextStructure?.id || prev.salaryStructureId
      }));
    }
  }, [assignmentDraft.designation, assignmentDraft.employeeId, assignmentModalOpen, salaryStructures, staff]);

  useEffect(() => {
    if (!structureModalOpen) return;
    if (structureDraft.id) return;
    if (!structureDraft.structureName) {
      setStructureDraft(prev => ({
        ...prev,
        structureName: `${getCategoryLabel(prev.employeeCategory)} ${prev.designation || 'Scale'}`.trim()
      }));
    }
  }, [structureDraft.designation, structureDraft.employeeCategory, structureDraft.id, structureDraft.structureName, structureModalOpen]);

  const saveStructure = () => {
    if (!structureDraft.structureName.trim() || !structureDraft.designation.trim()) {
      addToast('warning', 'Missing details', 'Please enter a structure name and designation before saving.');
      return;
    }

    const payload = buildStructurePayload(structureDraft);

    if (structureMode === 'edit' && structureEditingId) {
      updateSalaryStructure(structureEditingId, payload);
      addToast('success', 'Salary structure updated', `${payload.structureName} was updated successfully.`);
    } else {
      addSalaryStructure(payload);
      addToast('success', 'Salary structure created', `${payload.structureName} was added to the payroll library.`);
    }
    closeStructureModal();
  };

  const assignSalary = () => {
    const member = staff.find(item => item.id === assignmentDraft.employeeId);
    const structure = salaryStructures.find(item => item.id === assignmentDraft.salaryStructureId);
    if (!member || !structure) {
      addToast('warning', 'Missing selection', 'Please choose an employee and a salary structure.');
      return;
    }

    const breakdown = getStructureBreakdown(structure, assignmentDraft.salaryOverride ? {
      overrideBasicSalary: Number(assignmentDraft.basicSalary) || 0,
      overrideAllowances: Number(assignmentDraft.allowances) || 0,
      overrideDeductions: Number(assignmentDraft.deductions) || 0
    } : undefined);

    assignEmployeeSalaryStructure({
      employeeId: member.id,
      employeeName: `${member.firstName} ${member.lastName}`.trim(),
      empId: member.empId,
      employeeCategory: resolveCategory(member),
      branch: member.branch || 'Main Campus',
      department: member.department,
      salaryStructureId: structure.id,
      salaryStructureName: structure.structureName,
      effectiveDate: assignmentDraft.effectiveDate || todayString(),
      status: 'Active',
      salaryOverride: assignmentDraft.salaryOverride,
      overrideBasicSalary: assignmentDraft.salaryOverride ? Number(assignmentDraft.basicSalary) || breakdown.basicSalary : undefined,
      overrideAllowances: assignmentDraft.salaryOverride ? Number(assignmentDraft.allowances) || breakdown.allowances : undefined,
      overrideDeductions: assignmentDraft.salaryOverride ? Number(assignmentDraft.deductions) || breakdown.deductions : undefined,
      overrideNetSalary: assignmentDraft.salaryOverride ? breakdown.netSalary : undefined,
      monthlyGross: breakdown.grossSalary
    });

    addToast('success', 'Salary assigned', `${member.firstName} ${member.lastName} is now linked to ${structure.structureName}.`);
    closeAssignmentModal();
  };

  const createPayslipForRow = (row: (typeof generationRows)[number]) => {
    const existing = row.existing;
    if (existing) {
      return existing;
    }

    const member = row.member;
    const structure = row.structure;
    const breakdown = row.breakdown;
    const grossSalary = breakdown.grossSalary;
    const attendanceDeduction = Math.max(0, row.deductions - breakdown.deductions);
    const totalDeductions = row.deductions;
    const netSalary = row.netSalary;

    const payload: Omit<Payslip, 'id'> = {
      employeeId: member.id,
      employeeName: `${member.firstName} ${member.lastName}`.trim(),
      empId: member.empId,
      branch: member.branch || 'Main Campus',
      department: member.department,
      designation: member.designation,
      employeeCategory: resolveCategory(member),
      month: payrollMonthLabel,
      basicSalary: breakdown.basicSalary,
      hra: Math.round(breakdown.allowances * 0.45),
      da: Math.round(breakdown.allowances * 0.25),
      earnings: structure
        ? [
            { name: 'Basic Salary', amount: breakdown.basicSalary, type: 'Fixed', value: breakdown.basicSalary },
            { name: 'Allowances', amount: breakdown.allowances, type: 'Fixed', value: breakdown.allowances }
          ]
        : [],
      deductions: structure
        ? [
            { name: 'Structure Deductions', amount: breakdown.deductions, type: 'Fixed', value: breakdown.deductions },
            { name: 'Attendance Deduction', amount: attendanceDeduction, type: 'Fixed', value: attendanceDeduction }
          ]
        : [],
      grossSalary,
      otherDeductions: totalDeductions,
      pfDeduction: 0,
      leaveDeduction: attendanceDeduction,
      lopDeduction: row.lopDays,
      netSalary,
      bankAccount: member.bankDetails?.accountNumber || 'N/A',
      disbursedDate: todayString(),
      paymentDate: todayString(),
      leaveDetails: {
        paidLeaveDays: row.approvedLeaveDays,
        unpaidLeaveDays: row.lopDays,
        halfDays: row.halfDays,
        lateEntries: row.lateMarks
      },
      status: 'Generated'
    };

    disburseSalary(payload);
    return payload as Payslip;
  };

  const handleBulkGenerate = () => {
    const created = generationRows.filter(row => !row.existing).map(createPayslipForRow).length;
    addToast('success', 'Payslips generated', created > 0 ? `${created} payslip${created === 1 ? '' : 's'} generated for ${payrollMonthLabel}.` : 'Nothing new to generate for this payroll period.');
  };

  const handleBulkDownload = () => {
    addToast('info', 'Download queued', `${generationRows.length} payroll records prepared for PDF download.`);
  };

  const handleBulkEmail = () => {
    addToast('info', 'Email queued', `${generationRows.length} payroll records queued for email delivery.`);
  };

  const activePreviewMonth = historyRows[0]?.month || payrollMonthLabel;

  const renderEmployeesTab = () => {
    const totalEmployees = employeeRows.length;
    const activeEmployees = employeeRows.filter(row => row.assignment && row.assignment.status === 'Active').length;
    const unassignedEmployees = totalEmployees - activeEmployees;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Employees" value={String(totalEmployees)} helper="Staff available for payroll" icon={Users} tone="sky" />
          <StatCard label="Assigned" value={String(activeEmployees)} helper="Salary structures linked" icon={CheckCircle2} tone="emerald" />
          <StatCard label="Unassigned" value={String(unassignedEmployees)} helper="Awaiting payroll mapping" icon={AlertTriangle} tone="amber" />
          <StatCard label="Overrides" value={String(overrideEmployeeCount)} helper="Employee-specific salary edits" icon={ShieldCheck} tone="brand" />
        </div>

        <Panel
          title="Employee Payroll"
          subtitle="Assign salary structures to employees. Every new staff member appears here as Not Assigned until payroll mapping is completed."
          action={(
            <button
              type="button"
              onClick={() => openAssignmentModal()}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
            >
              <Plus className="h-4 w-4" /> Assign Salary
            </button>
          )}
        >
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  placeholder="Search employee, ID, department, designation..."
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
              <select value={employeeCategoryFilter} onChange={e => setEmployeeCategoryFilter(e.target.value as 'All' | CategoryValue)} className={selectClass}>
                <option value="All">All Categories</option>
                <option value="Teacher">Teaching Staff</option>
                <option value="Staff">Non-Teaching Staff</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
              <select value={employeeStructureFilter} onChange={e => setEmployeeStructureFilter(e.target.value)} className={selectClass}>
                {structureOptions.map(option => <option key={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
              <select value={employeeStatusFilter} onChange={e => setEmployeeStatusFilter(e.target.value as 'All' | 'Active' | 'Not Assigned')} className={selectClass}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Not Assigned">Not Assigned</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[1100px] w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  <th className="px-3 py-2">Employee ID</th>
                  <th className="px-3 py-2">Employee Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Designation</th>
                  <th className="px-3 py-2">Salary Structure</th>
                  <th className="px-3 py-2">Payroll Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeeRows.map(row => {
                  const statusBadge = row.assignment ? 'success' : 'warning';
                  return (
                    <tr key={row.member.id} className="rounded-[18px] bg-slate-50/90 dark:bg-slate-900/70">
                      <td className="rounded-l-[18px] px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{row.member.empId}</td>
                      <td className="px-3 py-4">
                        <button type="button" onClick={() => setDrawerStaff(row.member)} className="text-left">
                          <div className="text-sm font-black text-slate-900 dark:text-white">{row.member.firstName} {row.member.lastName}</div>
                          <p className="text-[11px] text-slate-500">{row.member.branch || 'Main Campus'}</p>
                        </button>
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{getCategoryLabel(row.category)}</td>
                      <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.member.department}</td>
                      <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.member.designation}</td>
                      <td className="px-3 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-black text-slate-900 dark:text-white">{row.structure?.structureName || 'Not Assigned'}</div>
                          {row.assignment?.salaryOverride && <Badge variant="warning" size="sm">Override</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant={statusBadge} size="sm">{row.payrollStatus}</Badge>
                      </td>
                      <td className="rounded-r-[18px] px-3 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDrawerStaff(row.member)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssignmentModal(row.member)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> {row.assignment ? 'Edit Salary' : 'Assign Salary'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployeeRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                      No employees matched the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  const renderStructureTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Structures" value={String(activeStructureCount)} helper="Available for assignment" icon={BadgeIndianRupee} tone="emerald" />
        <StatCard label="Total Structures" value={String(salaryStructures.length)} helper="Salary templates in library" icon={Layers} tone="sky" />
        <StatCard label="Employees Assigned" value={String(assignedEmployeeCount)} helper="Linked active payroll maps" icon={Users} tone="brand" />
        <StatCard label="Net Salary Preview" value={formatCurrency(totalPreviewNet)} helper="All template net amounts combined" icon={CheckCircle2} tone="amber" />
      </div>

      <Panel
        title="Salary Structures"
        subtitle="Create and reuse salary templates for teaching and non-teaching staff."
        action={(
          <button
            type="button"
            onClick={() => openStructureModal('add')}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
          >
            <Plus className="h-4 w-4" /> Create Structure
          </button>
        )}
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={structureSearch} onChange={e => setStructureSearch(e.target.value)} placeholder="Search structure, designation or code..." className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
            <select value={structureCategoryFilter} onChange={e => setStructureCategoryFilter(e.target.value as 'All' | CategoryValue)} className={selectClass}>
              <option value="All">All Categories</option>
              <option value="Teacher">Teaching Staff</option>
              <option value="Staff">Non-Teaching Staff</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
            <select value={structureDesignationFilter} onChange={e => setStructureDesignationFilter(e.target.value)} className={selectClass}>
              {designationSet.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
            <select value={structureStatusFilter} onChange={e => setStructureStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')} className={selectClass}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1200px] w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                <th className="px-3 py-2">Structure Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Designation</th>
                <th className="px-3 py-2">Effective From</th>
                <th className="px-3 py-2">Frequency</th>
                <th className="px-3 py-2">Gross Salary</th>
                <th className="px-3 py-2">Total Deductions</th>
                <th className="px-3 py-2">Net Salary</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Employees</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStructureRows.map(row => (
                <tr key={row.structure.id} className="rounded-[18px] bg-slate-50/90 dark:bg-slate-900/70">
                  <td className="rounded-l-[18px] px-3 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{row.structure.structureName}</div>
                      {row.structure.structureCode && <p className="text-[11px] text-slate-500">{row.structure.structureCode}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{getCategoryLabel(row.structure.employeeCategory)}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.structure.designation || 'Not set'}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.structure.effectiveDate || 'Not set'}</td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.structure.payrollFrequency || 'Monthly'}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.grossSalary)}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.deductions)}</td>
                  <td className="px-3 py-4 text-sm font-black text-brand-700 dark:text-brand-300">{formatCurrency(row.breakdown.netSalary)}</td>
                  <td className="px-3 py-4">
                    <Badge variant={row.structure.status === 'Active' ? 'success' : 'neutral'} size="sm">{row.structure.status}</Badge>
                  </td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{row.assignedCount}</td>
                  <td className="rounded-r-[18px] px-3 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openStructureModal('edit', row.structure)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openStructureModal('duplicate', row.structure)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Delete ${row.structure.structureName}?`)) return;
                          deleteSalaryStructure(row.structure.id);
                          addToast('info', 'Structure deleted', `${row.structure.structureName} was removed from the library.`);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStructureRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    No salary structures matched the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderPayslipGenerationTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eligible Employees" value={String(generationRows.length)} helper="Ready for payslip generation" icon={Users} tone="sky" />
        <StatCard label="Existing Payslips" value={String(generationRows.filter(row => row.existing).length)} helper="Already generated for this period" icon={ReceiptText} tone="emerald" />
        <StatCard label="Total Gross" value={formatCurrency(generationRows.reduce((sum, row) => sum + row.breakdown.grossSalary, 0))} helper={payrollMonthLabel} icon={BadgeIndianRupee} tone="brand" />
        <StatCard label="Total Net" value={formatCurrency(generationRows.reduce((sum, row) => sum + row.netSalary, 0))} helper="After attendance and deductions" icon={CheckCircle2} tone="amber" />
      </div>

      <Panel
        title="Generate Payslips"
        subtitle="HR selects a month and year, and the system reads attendance, leave, and salary structure data to produce payslips."
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleBulkGenerate} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20">
              <ReceiptText className="h-4 w-4" /> Generate All
            </button>
            <button type="button" onClick={handleBulkDownload} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Download className="h-4 w-4" /> Download All
            </button>
            <button type="button" onClick={handleBulkEmail} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Mail className="h-4 w-4" /> Email All
            </button>
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</label>
            <select value={generationMonth} onChange={e => setGenerationMonth(e.target.value)} className={selectClass}>
              {monthOptions.map(month => <option key={month}>{month}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</label>
            <select value={generationYear} onChange={e => setGenerationYear(e.target.value)} className={selectClass}>
              {yearOptions.map(year => <option key={year}>{year}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Branch</label>
            <select value={generationBranch} onChange={e => setGenerationBranch(e.target.value)} className={selectClass}>
              {branches.map(branch => <option key={branch}>{branch}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</label>
            <select value={generationDepartment} onChange={e => setGenerationDepartment(e.target.value)} className={selectClass}>
              {departments.map(department => <option key={department}>{department}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
            <select value={generationCategory} onChange={e => setGenerationCategory(e.target.value as 'All' | CategoryValue)} className={selectClass}>
              <option value="All">All Categories</option>
              <option value="Teacher">Teaching Staff</option>
              <option value="Staff">Non-Teaching Staff</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
            <select value={generationEmployee} onChange={e => setGenerationEmployee(e.target.value)} className={selectClass}>
              {employeeOptions.map(employee => <option key={employee}>{employee}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1220px] w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                <th className="px-3 py-2">Employee ID</th>
                <th className="px-3 py-2">Employee Name</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Gross Salary</th>
                <th className="px-3 py-2">Total Allowances</th>
                <th className="px-3 py-2">Total Deductions</th>
                <th className="px-3 py-2">Net Salary</th>
                <th className="px-3 py-2">Payslip Status</th>
                <th className="px-3 py-2">Payment Date</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {generationRows.map(row => (
                <tr key={row.member.id} className="rounded-[18px] bg-slate-50/90 dark:bg-slate-900/70">
                  <td className="rounded-l-[18px] px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{row.member.empId}</td>
                  <td className="px-3 py-4">
                    <button type="button" onClick={() => setDrawerStaff(row.member)} className="text-left">
                      <div className="text-sm font-black text-slate-900 dark:text-white">{row.member.firstName} {row.member.lastName}</div>
                      <p className="text-[11px] text-slate-500">{row.assignment?.salaryStructureName || 'Not Assigned'}</p>
                    </button>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.member.department}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.grossSalary)}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.allowances)}</td>
                  <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(row.deductions)}</td>
                  <td className="px-3 py-4 text-sm font-black text-brand-700 dark:text-brand-300">{formatCurrency(row.netSalary)}</td>
                  <td className="px-3 py-4">
                    <Badge variant={row.existing ? 'success' : 'warning'} size="sm">{row.existing ? row.existing.status : 'Ready'}</Badge>
                  </td>
                  <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{row.existing?.paymentDate || 'Pending'}</td>
                  <td className="rounded-r-[18px] px-3 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => setDrawerStaff(row.member)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <button type="button" onClick={() => {
                        createPayslipForRow(row);
                        addToast('success', 'Payslip ready', `${row.member.firstName} ${row.member.lastName} ${row.existing ? 'payslip already existed' : 'payslip generated'} for ${payrollMonthLabel}.`);
                      }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                        <FileText className="h-3.5 w-3.5" /> Generate PDF
                      </button>
                      <button type="button" onClick={() => addToast('info', 'Download queued', `${row.member.firstName} ${row.member.lastName} payslip download prepared.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </button>
                      <button type="button" onClick={() => addToast('info', 'Email queued', `${row.member.firstName} ${row.member.lastName} payslip email prepared.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {generationRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    No employees match the current payroll generation filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="History Rows" value={String(historyRows.length)} helper="Payslips generated so far" icon={Clock3} tone="sky" />
        <StatCard label="Paid" value={String(historyRows.filter(item => item.status === 'Paid').length)} helper="Disbursed salary records" icon={CheckCircle2} tone="emerald" />
        <StatCard label="Generated" value={String(historyRows.filter(item => item.status === 'Generated').length)} helper="Awaiting payment" icon={ReceiptText} tone="amber" />
        <StatCard label="Selected Period" value={historyRows.length > 0 ? activePreviewMonth : payrollMonthLabel} helper="Latest matching payslip window" icon={CalendarDays} tone="brand" />
      </div>

      <Panel
        title="Payslip History"
        subtitle="Review all previously generated payslips and use the filters to find a specific month, year, or employee."
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
            <select value={historyEmployee} onChange={e => setHistoryEmployee(e.target.value)} className={selectClass}>
              {employeeOptions.map(employee => <option key={employee}>{employee}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</label>
            <select value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} className={selectClass}>
              <option value="All">All Months</option>
              {monthOptions.map(month => <option key={month}>{month}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</label>
            <select value={historyYear} onChange={e => setHistoryYear(e.target.value)} className={selectClass}>
              <option value="All">All Years</option>
              {yearOptions.map(year => <option key={year}>{year}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</label>
            <select value={historyDepartment} onChange={e => setHistoryDepartment(e.target.value)} className={selectClass}>
              {departments.map(department => <option key={department}>{department}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1120px] w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Year</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Gross Salary</th>
                <th className="px-3 py-2">Deductions</th>
                <th className="px-3 py-2">Net Salary</th>
                <th className="px-3 py-2">Generated Date</th>
                <th className="px-3 py-2">Payment Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map(item => {
                const { month, year } = splitMonthYear(item.month);
                const linkedStaff = staff.find(member => member.id === item.employeeId) || null;
                return (
                  <tr key={item.id} className="rounded-[18px] bg-slate-50/90 dark:bg-slate-900/70">
                    <td className="rounded-l-[18px] px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{month}</td>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{year}</td>
                    <td className="px-3 py-4">
                      <button type="button" onClick={() => setDrawerStaff(linkedStaff || null)} className="text-left">
                        <div className="text-sm font-black text-slate-900 dark:text-white">{item.employeeName}</div>
                        <p className="text-[11px] text-slate-500">{item.empId}</p>
                      </button>
                    </td>
                    <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.grossSalary || 0)}</td>
                    <td className="px-3 py-4 text-sm font-black text-slate-900 dark:text-white">{formatCurrency((item.leaveDeduction || 0) + (item.otherDeductions || 0) + (item.pfDeduction || 0))}</td>
                    <td className="px-3 py-4 text-sm font-black text-brand-700 dark:text-brand-300">{formatCurrency(item.netSalary)}</td>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{item.paymentDate || item.disbursedDate}</td>
                    <td className="px-3 py-4">
                      <Badge variant={item.status === 'Paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                    </td>
                    <td className="rounded-r-[18px] px-3 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setDrawerStaff(linkedStaff || null)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button type="button" onClick={() => addToast('info', 'Download queued', `${item.employeeName} payslip download prepared.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </button>
                        <button type="button" onClick={() => addToast('info', 'Email queued', `${item.employeeName} payslip email prepared.`)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {historyRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    No payslip records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staff-payroll-employees':
        return renderEmployeesTab();
      case 'staff-payroll-structures':
        return renderStructureTab();
      case 'staff-payroll-payslips':
        return renderPayslipGenerationTab();
      case 'staff-payroll-history':
        return renderHistoryTab();
      default:
        return renderEmployeesTab();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">Faculty & Staff</Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Payroll</span>
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Payroll</h1>
            <p className="mt-2 text-sm text-slate-500">
              A simple payroll workspace for employee salary assignment, salary structures, payslip generation, and payslip history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAssignmentModal()}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Plus className="h-4 w-4" /> Assign Salary
            </button>
            <button
              type="button"
              onClick={() => openStructureModal('add')}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
            >
              <Layers className="h-4 w-4" /> Create Structure
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-[960px] grid grid-cols-4 gap-3">
          {payrollTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-[84px] items-center gap-3 rounded-[18px] border px-4 py-4 text-left transition-all ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.28em]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {renderTabContent()}

      {structureModalOpen && (
        <ModalShell
          title={structureMode === 'add' ? 'Create Salary Structure' : structureMode === 'edit' ? 'Edit Salary Structure' : 'Duplicate Salary Structure'}
          subtitle="Create a reusable salary template with detailed earnings and deductions."
          onClose={closeStructureModal}
          maxWidth="max-w-5xl"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="space-y-5">
              <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Structure Name</label>
                    <input value={structureDraft.structureName} onChange={e => setStructureDraft(prev => ({ ...prev, structureName: e.target.value }))} className={inputClass} placeholder="Senior Teacher Scale" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee Category</label>
                    <select value={structureDraft.employeeCategory} onChange={e => setStructureDraft(prev => ({ ...prev, employeeCategory: e.target.value as CategoryValue }))} className={selectClass}>
                      <option value="Teacher">Teaching Staff</option>
                      <option value="Staff">Non-Teaching Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
                    <select value={structureDraft.designation} onChange={e => setStructureDraft(prev => ({ ...prev, designation: e.target.value }))} className={selectClass}>
                      <option value="">Select Designation</option>
                      {designationOptionsForCategory(structureDraft.employeeCategory).map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective From</label>
                    <input type="date" value={structureDraft.effectiveDate} onChange={e => setStructureDraft(prev => ({ ...prev, effectiveDate: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Frequency</label>
                    <select value={structureDraft.payrollFrequency} onChange={e => setStructureDraft(prev => ({ ...prev, payrollFrequency: e.target.value as 'Monthly' }))} className={selectClass}>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
                    <select value={structureDraft.status} onChange={e => setStructureDraft(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))} className={selectClass}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Description / Notes</label>
                    <textarea
                      value={structureDraft.notes}
                      onChange={e => setStructureDraft(prev => ({ ...prev, notes: e.target.value }))}
                      className={`${inputClass} min-h-[96px] py-3`}
                      placeholder="Optional notes about this salary template..."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-slate-500">Earnings</h3>
                    <p className="mt-1 text-xs text-slate-500">These components build the gross salary.</p>
                  </div>
                  <Badge variant="info" size="sm">{structureEarningFields.length} Fields</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {structureEarningFields.map(field => (
                    <div key={field.key}>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{field.label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={structureDraft[field.key]}
                        onChange={e => setStructureDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-slate-500">Deductions</h3>
                    <p className="mt-1 text-xs text-slate-500">Employee PF and other deductions impact net salary. Employer PF is stored separately.</p>
                  </div>
                  <Badge variant="info" size="sm">{structureDeductionFields.length} Fields</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {structureDeductionFields.map(field => (
                    <div key={field.key}>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{field.label}</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={structureDraft[field.key]}
                        onChange={e => setStructureDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-slate-500">Payroll Rules</h3>
                    <p className="mt-1 text-xs text-slate-500">These rules belong to the salary template, not a separate settings page.</p>
                  </div>
                  <Badge variant="info" size="sm">Template Config</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Payment Day</label>
                    <input
                      value={structureDraft.salaryPaymentDay}
                      onChange={e => setStructureDraft(prev => ({ ...prev, salaryPaymentDay: e.target.value }))}
                      className={inputClass}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Round Off Rule</label>
                    <select
                      value={structureDraft.roundOffRule}
                      onChange={e => setStructureDraft(prev => ({ ...prev, roundOffRule: e.target.value as StructureDraft['roundOffRule'] }))}
                      className={selectClass}
                    >
                      {roundOffOptions.map(option => <option key={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Applicable</label>
                    <select
                      value={structureDraft.pfApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, pfApplicable: e.target.value === 'Yes' }))}
                      className={selectClass}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Percentage</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={structureDraft.pfPercentage}
                      onChange={e => setStructureDraft(prev => ({ ...prev, pfPercentage: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI Applicable</label>
                    <select
                      value={structureDraft.esiApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, esiApplicable: e.target.value === 'Yes' }))}
                      className={selectClass}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">ESI Percentage</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={structureDraft.esiPercentage}
                      onChange={e => setStructureDraft(prev => ({ ...prev, esiPercentage: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PT Applicable</label>
                    <select
                      value={structureDraft.professionalTaxApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, professionalTaxApplicable: e.target.value === 'Yes' }))}
                      className={selectClass}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PT Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={structureDraft.professionalTaxAmount}
                      onChange={e => setStructureDraft(prev => ({ ...prev, professionalTaxAmount: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Live Preview</p>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                    <span className="text-sm font-semibold text-slate-500">Gross Salary</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(structureDraftPreview.grossSalary)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                    <span className="text-sm font-semibold text-slate-500">Total Earnings</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(structureDraftPreview.totalEarnings)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                    <span className="text-sm font-semibold text-slate-500">Total Deductions</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(structureDraftPreview.totalDeductions)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-brand-600 px-4 py-3 text-white shadow-lg shadow-brand-500/20">
                    <span className="text-sm font-semibold text-white/80">Net Salary</span>
                    <span className="font-black">{formatCurrency(structureDraftPreview.netSalary)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={saveStructure}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Save className="h-4 w-4" /> {structureMode === 'edit' ? 'Save Changes' : 'Save Structure'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {assignmentModalOpen && (
        <ModalShell
          title="Assign Salary"
          subtitle="Choose the employee, category, designation, and structure. Override stays off by default."
          onClose={closeAssignmentModal}
          maxWidth="max-w-5xl"
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
                <select
                  value={assignmentDraft.employeeId}
                  onChange={e => {
                    const employeeId = e.target.value;
                    const member = staff.find(item => item.id === employeeId);
                    const category = member ? resolveCategory(member) : '';
                    const designation = member?.designation || '';
                    const candidateStructures = salaryStructures.filter(item => structureMatches(item, category, designation));
                    const selectedStructure = candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0];
                    const breakdown = getStructureBreakdown(selectedStructure || undefined);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      employeeId,
                      employeeCategory: category,
                      designation,
                      salaryStructureId: selectedStructure?.id || '',
                      basicSalary: String(breakdown.basicSalary),
                      allowances: String(breakdown.allowances),
                      deductions: String(breakdown.deductions)
                    }));
                  }}
                  className={selectClass}
                >
                  <option value="">Select Employee</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - {member.empId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
                <select
                  value={assignmentDraft.employeeCategory}
                  onChange={e => {
                    const category = e.target.value as CategoryValue | '';
                    const designation = assignmentDraft.designation;
                    const candidateStructures = salaryStructures.filter(item => structureMatches(item, category, designation));
                    const selectedStructure = candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === category) || salaryStructures[0];
                    const breakdown = getStructureBreakdown(selectedStructure || undefined);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      employeeCategory: category,
                      salaryStructureId: selectedStructure?.id || '',
                      basicSalary: String(breakdown.basicSalary),
                      allowances: String(breakdown.allowances),
                      deductions: String(breakdown.deductions)
                    }));
                  }}
                  className={selectClass}
                >
                  <option value="">Select Category</option>
                  <option value="Teacher">Teaching Staff</option>
                  <option value="Staff">Non-Teaching Staff</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
                <select
                  value={assignmentDraft.designation}
                  onChange={e => {
                    const designation = e.target.value;
                    const candidateStructures = salaryStructures.filter(item => structureMatches(item, assignmentDraft.employeeCategory, designation));
                    const selectedStructure = candidateStructures[0] || salaryStructures.find(item => item.employeeCategory === assignmentDraft.employeeCategory) || salaryStructures[0];
                    const breakdown = getStructureBreakdown(selectedStructure || undefined);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      designation,
                      salaryStructureId: selectedStructure?.id || '',
                      basicSalary: String(breakdown.basicSalary),
                      allowances: String(breakdown.allowances),
                      deductions: String(breakdown.deductions)
                    }));
                  }}
                  className={selectClass}
                  disabled={!assignmentDraft.employeeCategory}
                >
                  <option value="">Select Designation</option>
                  {filteredDesignationOptions.map(option => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
                <select
                  value={assignmentDraft.salaryStructureId}
                  onChange={e => {
                    const salaryStructureId = e.target.value;
                    const structure = salaryStructures.find(item => item.id === salaryStructureId);
                    const breakdown = getStructureBreakdown(structure || undefined);
                    setAssignmentDraft(prev => ({
                      ...prev,
                      salaryStructureId,
                      basicSalary: String(breakdown.basicSalary),
                      allowances: String(breakdown.allowances),
                      deductions: String(breakdown.deductions)
                    }));
                  }}
                  className={selectClass}
                  disabled={!assignmentDraft.designation}
                >
                  <option value="">Select Salary Structure</option>
                  {structureOptionsForAssignment.map(structure => (
                    <option key={structure.id} value={structure.id}>
                      {structure.structureName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Salary Override</p>
                    <p className="text-[11px] text-slate-500">Default OFF. Enable only when this employee needs custom values.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAssignmentDraft(prev => ({ ...prev, salaryOverride: !prev.salaryOverride }))}
                    className={`inline-flex h-11 items-center rounded-full px-4 text-sm font-black transition ${assignmentDraft.salaryOverride ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    {assignmentDraft.salaryOverride ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              {assignmentDraft.salaryOverride && (
                <>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Basic Salary</label>
                    <input type="number" value={assignmentDraft.basicSalary} onChange={e => setAssignmentDraft(prev => ({ ...prev, basicSalary: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Allowances</label>
                    <input type="number" value={assignmentDraft.allowances} onChange={e => setAssignmentDraft(prev => ({ ...prev, allowances: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Deductions</label>
                    <input type="number" value={assignmentDraft.deductions} onChange={e => setAssignmentDraft(prev => ({ ...prev, deductions: e.target.value }))} className={inputClass} />
                  </div>
                </>
              )}
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective Date</label>
                <input type="date" value={assignmentDraft.effectiveDate} onChange={e => setAssignmentDraft(prev => ({ ...prev, effectiveDate: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4">
              {(() => {
                const structure = salaryStructures.find(item => item.id === assignmentDraft.salaryStructureId);
                const preview = getStructureBreakdown(structure, assignmentDraft.salaryOverride ? {
                  overrideBasicSalary: Number(assignmentDraft.basicSalary) || 0,
                  overrideAllowances: Number(assignmentDraft.allowances) || 0,
                  overrideDeductions: Number(assignmentDraft.deductions) || 0
                } : undefined);
                return (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Assignment Preview</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-sm font-semibold text-slate-500">Structure</span>
                        <span className="font-black text-slate-900 dark:text-white">{structure?.structureName || 'Not selected'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-sm font-semibold text-slate-500">Gross Salary</span>
                        <span className="font-black text-slate-900 dark:text-white">{formatCurrency(preview.grossSalary)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                        <span className="text-sm font-semibold text-slate-500">Net Salary</span>
                        <span className="font-black text-brand-700 dark:text-brand-300">{formatCurrency(preview.netSalary)}</span>
                      </div>
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                        A new assignment sets the payroll status to Active and automatically updates the employee profile.
                      </div>
                    </div>
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={assignSalary}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Save className="h-4 w-4" /> Assign
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      <PayrollDrawer
        staff={currentPreviewStaff}
        isOpen={!!currentPreviewStaff}
        onClose={() => setDrawerStaff(null)}
      />
    </div>
  );
};

export default PayrollModuleView;
