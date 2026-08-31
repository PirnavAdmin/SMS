import React, { useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../../common/ConfirmModal';
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
  X,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
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
  payrollFrequency: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Hourly' | 'Daily' | 'Per Class' | 'Contractual';
  salaryPaymentDay: string;
  pfApplicable: boolean;
  pfPercentage: string;
  esiApplicable: boolean;
  esiPercentage: string;
  professionalTaxApplicable: boolean;
  professionalTaxAmount: string;
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

const selectClass =
  'h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white appearance-none cursor-pointer';

const SelectField: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, onChange, className = selectClass, disabled, children }) => {
  return (
    <div className="relative w-full">
      <select value={value} onChange={onChange} className={className} disabled={disabled}>
        {children}
      </select>
      <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getCategoryLabel = (category?: CategoryValue | null) => (category === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff');

const resolveCategory = (staff: Staff): CategoryValue => {
  if (staff.employeeCategory) return staff.employeeCategory;
  return staff.role === 'Teacher' ? 'Teacher' : 'Staff';
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
      return 'staff-payroll-payslips';
    case 'staff-payslips':
    case 'staff-payroll':
    case 'staff-payroll-assignment':
    case 'staff-payroll-processing':
    case 'staff-payroll-reports':
      return 'staff-payroll-employees';
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
  <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const SearchableSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  getCode?: (val: string) => string;
}> = ({ value, onChange, options, placeholder = 'Select...', disabled, getCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-white ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-2 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                autoFocus
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border-none bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length > 0 ? filtered.map(option => {
              const match = option.match(/^(.*?)\s*\(([^)]+)\)$/);
              return (
                <div 
                  key={option} 
                  onClick={() => { onChange(option); setIsOpen(false); setSearch(''); }}
                  className="cursor-pointer rounded-xl px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex flex-col gap-0.5"
                >
                  {match ? (
                    <>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{match[1]}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{match[2]}</span>
                    </>
                  ) : (
                    <span>{option}</span>
                  )}
                  {getCode && option !== 'All Departments' && option !== 'All Employees' && (
                    <span className="text-[10px] text-slate-400 font-normal">Code: {getCode(option)}</span>
                  )}
                </div>
              );
            }) : (
              <div className="px-4 py-3 text-sm text-slate-500">No results found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
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
    netSalary: roundAmount(Math.max(0, totalEarnings - totalDeductions), 'Nearest 1')
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
    roundOffRule: 'Nearest 1',
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
    disburseSalary,
    designations,
    fetchSalaryStructures,
    fetchSalaryAssignments
  } = useData();

  useEffect(() => {
    if (fetchSalaryStructures) fetchSalaryStructures();
    if (fetchSalaryAssignments) fetchSalaryAssignments();
  }, [fetchSalaryStructures, fetchSalaryAssignments]);

  const { addToast } = useToast();

  const getDesignationOptions = (category: CategoryValue | '') => {
    if (!category) return [];
    return designations
      .filter(d => 
        d.status === 'Active' && 
        (d.employeeCategory === 'Both' || 
        (category === 'Teacher' && d.employeeCategory === 'Teaching') || 
        (category === 'Staff' && d.employeeCategory === 'Non-Teaching'))
      )
      .map(d => d.designationName);
  };

  const handlePrintPayslip = (p: any, autoPrint = false) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Payslip - ${p.employeeName}</title>
            <style>
              @page { size: A4 portrait; margin: 8mm; }
              @media print {
                html, body { height: 100vh; margin: 0 !important; padding: 10px !important; box-sizing: border-box; page-break-inside: avoid !important; }
              }
              * { box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px 24px; color: #333; font-size: 11px; line-height: 1.3; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 12px; }
              .header h2 { margin: 0; font-size: 18px; color: #0284c7; }
              .header p { margin: 3px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
              .details { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
              .table th, .table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
              .table th { background-color: #f1f5f9; font-weight: 700; }
              .net { font-size: 1.1em; font-weight: bold; margin-top: 14px; text-align: right; color: #16a34a; background: #f0fdf4; padding: 8px; border-radius: 6px; border: 1px solid #bbf7d0; }
              .sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>MONTHLY SALARY PAYSLIP</h2>
              <p>Pirnav Educational Institutions - HR Department</p>
            </div>
            <div class="details">
              <div><strong>Employee Name:</strong> ${p.employeeName}</div>
              <div><strong>Employee ID:</strong> ${p.empId}</div>
              <div><strong>Salary Month:</strong> ${p.month}</div>
              <div><strong>Generated Date:</strong> ${p.disbursedDate || new Date().toISOString().split('T')[0]}</div>
              <div><strong>Bank Account:</strong> ${p.bankAccount || 'N/A'}</div>
              <div><strong>Status:</strong> ${p.status}</div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Earning Details</th>
                  <th>Amount</th>
                  <th>Deduction Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>${formatCurrency(p.basicSalary || p.grossSalary || 0)}</td>
                  <td>Total Deductions</td>
                  <td>${formatCurrency((p.pfDeduction || 0) + (p.lopDeduction || 0) + (p.otherDeductions || 0))}</td>
                </tr>
                <tr>
                  <td><strong>Gross Earning</strong></td>
                  <td><strong>${formatCurrency(p.grossSalary || p.basicSalary || 0)}</strong></td>
                  <td><strong>Total Deductions</strong></td>
                  <td><strong>${formatCurrency((p.pfDeduction || 0) + (p.lopDeduction || 0) + (p.otherDeductions || 0))}</strong></td>
                </tr>
              </tbody>
            </table>
            
            <div class="net">
              Net Payable Salary: ${formatCurrency(p.netSalary)}
            </div>
            
            <div class="sign">
              <div>
                <p>_______________________</p>
                <p>Employee Signature</p>
              </div>
              <div>
                <p>_______________________</p>
                <p>Authorized Signatory</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      if (autoPrint) {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
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
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedStructureIds, setSelectedStructureIds] = useState<string[]>([]);
  const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
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
  const employeeOptions = useMemo(() => ['All Employees', ...staff.map(item => `${item.firstName} ${item.lastName} (${item.empId})`.trim())], [staff]);
  const structureOptions = useMemo(() => ['All Structures', ...Array.from(new Set(salaryStructures.map(item => item.structureName).filter(Boolean)))], [salaryStructures]);
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
      const employeeLabel = `${row.member.firstName} ${row.member.lastName} (${row.member.empId})`.trim();
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

  const pendingGenerationRows = useMemo(() => generationRows.filter(row => !row.existing), [generationRows]);

  const historyRows = useMemo(() => {
    return payslips.filter(item => {
      const { month, year } = splitMonthYear(item.month);
      const employeeLabel = `${item.employeeName} (${item.empId})`.trim();
      const matchesEmployee = historyEmployee === 'All Employees' || employeeLabel === historyEmployee;
      const matchesMonth = historyMonth === 'All' || month === historyMonth;
      const matchesYear = historyYear === 'All' || year === historyYear;
      const matchesDepartment = historyDepartment === 'All Departments' || (item.department || 'Unknown') === historyDepartment;
      return matchesEmployee && matchesMonth && matchesYear && matchesDepartment;
    });
  }, [historyDepartment, historyEmployee, historyMonth, historyYear, payslips]);

  const activePreviewMonth = useMemo(() => {
    if (historyMonth === 'All' && historyYear === 'All') {
      return 'All Periods';
    }
    if (historyMonth !== 'All' && historyYear === 'All') {
      return `${historyMonth} (All Years)`;
    }
    if (historyMonth === 'All' && historyYear !== 'All') {
      return `All Months ${historyYear}`;
    }
    return `${historyMonth} ${historyYear}`;
  }, [historyMonth, historyYear]);

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
    return getDesignationOptions(assignmentDraft.employeeCategory);
  }, [assignmentDraft.employeeCategory, designations]);

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

  const handleBulkGenerate = () => setIsGenerateModalOpen(true);
  
  const confirmBulkGenerate = () => {
    setIsGenerateModalOpen(false);
    const created = generationRows.filter(row => !row.existing).map(createPayslipForRow).length;
    addToast('success', 'Payslips generated', created > 0 ? `${created} payslip${created === 1 ? '' : 's'} generated for ${payrollMonthLabel}.` : 'Nothing new to generate for this payroll period.');
  };

  const handleBulkDownload = () => {
    addToast('info', 'Download queued', `${generationRows.length} payroll records prepared for PDF download.`);
  };

  const handleBulkEmail = () => {
    addToast('info', 'Email queued', `${generationRows.length} payroll records queued for email delivery.`);
  };

  const renderEmployeesTab = () => {
    const totalEmployees = employeeRows.length;
    const activeEmployees = employeeRows.filter(row => row.assignment && row.assignment.status === 'Active').length;
    const unassignedEmployees = totalEmployees - activeEmployees;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Employees" value={String(totalEmployees)} icon={Users} tone="sky" />
          <StatCard label="Assigned" value={String(activeEmployees)} icon={CheckCircle2} tone="emerald" />
          <StatCard label="Unassigned" value={String(unassignedEmployees)} icon={AlertTriangle} tone="amber" />
          <StatCard label="Overrides" value={String(overrideEmployeeCount)} icon={ShieldCheck} tone="brand" />
        </div>

        <Panel
          title="Employee Payroll"
          action={(
            <div className="flex items-center gap-2">
              {selectedEmployeeIds.length > 0 && (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-xs font-black text-white shadow-lg shadow-slate-700/20"
                >
                  Bulk Actions ({selectedEmployeeIds.length})
                </button>
              )}
              <ExportButton
                data={filteredEmployeeRows.map(r => ({
                  'Employee ID': r.member.empId,
                  'Employee Name': `${r.member.firstName} ${r.member.lastName}`,
                  'Category': getCategoryLabel(r.category),
                  'Department': r.member.department,
                  'Designation': r.member.designation,
                  'Salary Structure': r.structure?.structureName || 'Not Assigned',
                  'Payroll Status': r.payrollStatus
                }))}
                filename="employee_payroll"
              />
              <button
                type="button"
                onClick={() => openAssignmentModal()}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Plus className="h-3.5 w-3.5" /> Assign Salary
              </button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  placeholder="Search..."
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
              <SelectField value={employeeCategoryFilter} onChange={e => setEmployeeCategoryFilter(e.target.value as 'All' | CategoryValue)}>
                <option value="All">All Categories</option>
                <option value="Teacher">Teaching Staff</option>
                <option value="Staff">Non-Teaching Staff</option>
              </SelectField>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
              <SelectField value={employeeStructureFilter} onChange={e => setEmployeeStructureFilter(e.target.value)}>
                {structureOptions.map(option => <option key={option}>{option}</option>)}
              </SelectField>
            </div>
            <div className="w-48">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
              <SelectField value={employeeStatusFilter} onChange={e => setEmployeeStatusFilter(e.target.value as 'All' | 'Active' | 'Not Assigned')}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Not Assigned">Not Assigned</option>
              </SelectField>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-3 py-2 w-10"></th>
                  <th className="px-3 py-2 text-center">Employee ID</th>
                  <th className="px-3 py-2 text-center">Employee Name</th>
                  <th className="px-3 py-2 text-center">Category</th>
                  <th className="px-3 py-2 text-center">Department</th>
                  <th className="px-3 py-2 text-center">Designation</th>
                  <th className="px-3 py-2 text-center">Salary Structure</th>
                  <th className="px-3 py-2 text-center">Payroll Status</th>
                  <th className="px-3 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployeeRows.map(row => {
                  const statusBadge = row.assignment ? 'success' : 'warning';
                  return (
                    <tr key={row.member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                      <td className="px-3 py-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                          checked={selectedEmployeeIds.includes(row.member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds(prev => [...prev, row.member.id]);
                            } else {
                              setSelectedEmployeeIds(prev => prev.filter(id => id !== row.member.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{row.member.empId}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => setDrawerStaff(row.member)} className="text-left">
                          <div className="text-xs font-black text-slate-900 dark:text-white">{row.member.firstName} {row.member.lastName}</div>
                          <p className="text-[10px] text-slate-500">{row.member.branch || 'Main Campus'}</p>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{getCategoryLabel(row.category)}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.member.department}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.member.designation}</td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-slate-900 dark:text-white">{row.structure?.structureName || 'Not Assigned'}</div>
                          {row.assignment?.salaryOverride && <Badge variant="warning" size="sm">Override</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={statusBadge} size="sm">{row.payrollStatus}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrawerStaff(row.member)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAssignmentModal(row.member)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
                            title={row.assignment ? 'Edit Salary' : 'Assign Salary'}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (row.assignment) {
                                deleteSalaryStructure(row.assignment.id);
                                addToast('info', 'Assignment Removed', `Salary record for ${row.member.firstName} ${row.member.lastName} deleted.`);
                              } else {
                                addToast('warning', 'No Assignment', `No salary structure is currently assigned to ${row.member.firstName} ${row.member.lastName}.`);
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Active Structures" value={String(activeStructureCount)} icon={BadgeIndianRupee} tone="emerald" />
        <StatCard label="Total Structures" value={String(salaryStructures.length)} icon={Layers} tone="sky" />
        <StatCard label="Employees Assigned" value={String(assignedEmployeeCount)} icon={Users} tone="brand" />
        <StatCard label="Net Salary Preview" value={formatCurrency(totalPreviewNet)} icon={CheckCircle2} tone="amber" />
      </div>

      <Panel
        title="Salary Structures"
        action={(
          <div className="flex items-center gap-2">
            {selectedStructureIds.length > 0 && (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-xs font-black text-white shadow-lg shadow-slate-700/20"
              >
                Bulk Actions ({selectedStructureIds.length})
              </button>
            )}
            <ExportButton
              data={filteredStructureRows.map(r => ({
                'Structure Name': r.structure.structureName,
                'Category': getCategoryLabel(r.structure.employeeCategory),
                'Designation': r.structure.designation || 'Not set',
                'Effective From': r.structure.effectiveDate || 'Not set',
                'Frequency': r.structure.payrollFrequency || 'Monthly',
                'Gross Salary': r.breakdown.grossSalary,
                'Total Deductions': r.breakdown.deductions,
                'Net Salary': r.breakdown.netSalary,
                'Status': r.structure.status,
                'Employees Assigned': r.assignedCount
              }))}
              filename="salary_structures"
            />
            <button
              type="button"
              onClick={() => openStructureModal('add')}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
            >
              <Plus className="h-3.5 w-3.5" /> Create Structure
            </button>
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={structureSearch} onChange={e => setStructureSearch(e.target.value)} placeholder="Search..." className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
            <SelectField value={structureCategoryFilter} onChange={e => setStructureCategoryFilter(e.target.value as 'All' | CategoryValue)}>
              <option value="All">All Categories</option>
              <option value="Teacher">Teaching Staff</option>
              <option value="Staff">Non-Teaching Staff</option>
            </SelectField>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
            <SelectField value={structureDesignationFilter} onChange={e => setStructureDesignationFilter(e.target.value)}>
              {designationSet.map(item => <option key={item}>{item}</option>)}
            </SelectField>
          </div>
          <div className="w-48">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
            <SelectField value={structureStatusFilter} onChange={e => setStructureStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectField>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1200px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-2 w-10"></th>
                <th className="px-3 py-2 text-center">Structure Name</th>
                <th className="px-3 py-2 text-center">Category</th>
                <th className="px-3 py-2 text-center">Designation</th>
                <th className="px-3 py-2 text-center">Effective From</th>
                <th className="px-3 py-2 text-center">Frequency</th>
                <th className="px-3 py-2 text-center">Gross Salary</th>
                <th className="px-3 py-2 text-center">Total Deductions</th>
                <th className="px-3 py-2 text-center">Net Salary</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Employees</th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStructureRows.map(row => (
                <tr key={row.structure.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                  <td className="px-3 py-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      checked={selectedStructureIds.includes(row.structure.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStructureIds(prev => [...prev, row.structure.id]);
                        } else {
                          setSelectedStructureIds(prev => prev.filter(id => id !== row.structure.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white">{row.structure.structureName}</div>
                      {row.structure.structureCode && <p className="text-[10px] text-slate-500">{row.structure.structureCode}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{getCategoryLabel(row.structure.employeeCategory)}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.structure.designation || 'Not set'}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.structure.effectiveDate || 'Not set'}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.structure.payrollFrequency || 'Monthly'}</td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.grossSalary)}</td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.deductions)}</td>
                  <td className="px-3 py-2 text-xs font-black text-brand-700 dark:text-brand-300">{formatCurrency(row.breakdown.netSalary)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={row.structure.status === 'Active' ? 'success' : 'neutral'} size="sm">{row.structure.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{row.assignedCount}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openStructureModal('edit', row.structure)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Structure"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openStructureModal('duplicate', row.structure)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
                        title="Duplicate Structure"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Delete ${row.structure.structureName}?`)) return;
                          deleteSalaryStructure(row.structure.id);
                          addToast('info', 'Structure deleted', `${row.structure.structureName} was removed from the library.`);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                        title="Delete Structure"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Eligible Employees" value={String(generationRows.length)} icon={Users} tone="sky" />
        <StatCard label="Existing Payslips" value={String(generationRows.filter(row => row.existing).length)} icon={ReceiptText} tone="emerald" />
        <StatCard label="Total Gross" value={formatCurrency(generationRows.reduce((sum, row) => sum + row.breakdown.grossSalary, 0))} icon={BadgeIndianRupee} tone="brand" />
        <StatCard label="Total Net" value={formatCurrency(generationRows.reduce((sum, row) => sum + row.netSalary, 0))} icon={CheckCircle2} tone="amber" />
      </div>

      <Panel
        title="Generate Payslips"
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleBulkGenerate} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-black text-white shadow-lg shadow-brand-500/20">
              <ReceiptText className="h-3.5 w-3.5" /> {selectedGenerationIds.length === 1 ? 'Generate' : 'Generate All'}
            </button>
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</label>
            <SelectField value={generationMonth} onChange={e => setGenerationMonth(e.target.value)}>
              {monthOptions.map(month => <option key={month}>{month}</option>)}
            </SelectField>
          </div>
          <div className="w-28">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</label>
            <SelectField value={generationYear} onChange={e => setGenerationYear(e.target.value)}>
              {yearOptions.map(year => <option key={year}>{year}</option>)}
            </SelectField>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
            <SearchableSelect value={generationEmployee} onChange={setGenerationEmployee} options={employeeOptions} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
            <SelectField value={generationCategory} onChange={e => setGenerationCategory(e.target.value as any)}>
              <option value="All">All Categories</option>
              <option value="Teacher">Teaching Staff</option>
              <option value="Staff">Non-Teaching Staff</option>
            </SelectField>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Branch</label>
            <SelectField value={generationBranch} onChange={e => setGenerationBranch(e.target.value)}>
              {branches.map(branch => <option key={branch}>{branch}</option>)}
            </SelectField>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</label>
            <SearchableSelect value={generationDepartment} onChange={setGenerationDepartment} options={departments} getCode={(val) => val.substring(0, 3).toUpperCase()} />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1220px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-2 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                    checked={pendingGenerationRows.length > 0 && selectedGenerationIds.length === pendingGenerationRows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenerationIds(pendingGenerationRows.map(r => r.member.id));
                      } else {
                        setSelectedGenerationIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-2 text-center">Employee ID</th>
                <th className="px-3 py-2 text-center">Employee Name</th>
                <th className="px-3 py-2 text-center">Department</th>
                <th className="px-3 py-2 text-center">Gross Salary</th>
                <th className="px-3 py-2 text-center">Total Allowances</th>
                <th className="px-3 py-2 text-center">Total Deductions</th>
                <th className="px-3 py-2 text-center">Net Salary</th>
                <th className="px-3 py-2 text-center">Payslip Status</th>
                <th className="px-3 py-2 text-center">Payment Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingGenerationRows.map(row => (
                <tr key={row.member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                  <td className="px-3 py-2">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      checked={selectedGenerationIds.includes(row.member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGenerationIds(prev => [...prev, row.member.id]);
                        } else {
                          setSelectedGenerationIds(prev => prev.filter(id => id !== row.member.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{row.member.empId}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setDrawerStaff(row.member)} className="text-left">
                      <div className="text-xs font-black text-slate-900 dark:text-white">{row.member.firstName} {row.member.lastName}</div>
                      <p className="text-[10px] text-slate-500">{row.assignment?.salaryStructureName || 'Not Assigned'}</p>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.member.department}</td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.grossSalary)}</td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(row.breakdown.allowances)}</td>
                  <td className="px-3 py-2 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(row.deductions)}</td>
                  <td className="px-3 py-2 text-xs font-black text-brand-700 dark:text-brand-300">{formatCurrency(row.netSalary)}</td>
                  <td className="px-3 py-2">
                    <Badge variant={row.existing ? 'success' : 'warning'} size="sm">{row.existing ? row.existing.status : 'Ready'}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{row.existing?.paymentDate || 'Pending'}</td>
                </tr>
              ))}
              {pendingGenerationRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="rounded-[18px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                    {generationRows.length === 0 
                      ? "No employees match the current payroll generation filters."
                      : "All matched employees already have payslips generated for this month."}
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Paid" value={String(historyRows.filter(item => item.status === 'Paid').length)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Generated" value={String(historyRows.filter(item => item.status === 'Generated').length)} icon={ReceiptText} tone="amber" />
      </div>

      <Panel
        title="Payslip History"
        action={(
          <div className="flex items-center gap-2">
            {selectedHistoryIds.length > 0 && (
              <button 
                type="button" 
                onClick={() => {
                  const count = selectedHistoryIds.length;
                  if (count === 0) return;
                  
                  // Create CSV string
                  const headers = ['Month', 'Employee Name', 'Emp ID', 'Gross Salary', 'Deductions', 'Net Salary', 'Generated Date', 'Payment Status'];
                  const rowsToDownload = historyRows.filter(r => selectedHistoryIds.includes(r.id));
                  const csvRows = rowsToDownload.map(row => [
                    row.month,
                    `"${row.employeeName}"`,
                    row.empId,
                    row.grossSalary,
                    row.deductions,
                    row.netSalary,
                    row.paymentDate || 'Pending',
                    row.status
                  ]);
                  const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
                  
                  // Download
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `payslips_${new Date().getTime()}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  addToast('success', 'Download Started', `Downloading ${count} payslip(s) data.`);
                }} 
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-black text-white shadow-lg shadow-brand-500/20"
              >
                <Download className="h-3.5 w-3.5" /> 
                {selectedHistoryIds.length > 1 ? `Download All (${selectedHistoryIds.length})` : 'Download'}
              </button>
            )}
          </div>
        )}
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
            <SearchableSelect value={historyEmployee} onChange={setHistoryEmployee} options={employeeOptions} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Month</label>
            <SelectField value={historyMonth} onChange={e => setHistoryMonth(e.target.value)}>
              <option value="All">All Months</option>
              {monthOptions.map(month => <option key={month}>{month}</option>)}
            </SelectField>
          </div>
          <div className="w-32">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Year</label>
            <SelectField value={historyYear} onChange={e => setHistoryYear(e.target.value)}>
              <option value="All">All Years</option>
              {yearOptions.map(year => <option key={year}>{year}</option>)}
            </SelectField>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Department</label>
            <SearchableSelect value={historyDepartment} onChange={setHistoryDepartment} options={departments} getCode={(val) => val.substring(0, 3).toUpperCase()} />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left border-collapse text-xs border border-slate-200 dark:border-slate-800 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-800 [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-800 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-3 py-2 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                    checked={historyRows.length > 0 && selectedHistoryIds.length === historyRows.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedHistoryIds(historyRows.map(r => r.id));
                      } else {
                        setSelectedHistoryIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-3 py-2 text-center">Month</th>
                <th className="px-3 py-2 text-center">Year</th>
                <th className="px-3 py-2 text-center">Employee</th>
                <th className="px-3 py-2 text-center">Gross Salary</th>
                <th className="px-3 py-2 text-center">Deductions</th>
                <th className="px-3 py-2 text-center">Net Salary</th>
                <th className="px-3 py-2 text-center">Generated Date</th>
                <th className="px-3 py-2 text-center">Payment Status</th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map(item => {
                const { month, year } = splitMonthYear(item.month);
                const linkedStaff = staff.find(member => member.id === item.employeeId) || null;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 text-slate-900 dark:text-slate-100">
                  <td className="px-3 py-1.5">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      checked={selectedHistoryIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHistoryIds(prev => [...prev, item.id]);
                        } else {
                          setSelectedHistoryIds(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white">{month}</td>
                  <td className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">{year}</td>
                  <td className="px-3 py-1.5">
                    <button type="button" onClick={() => setDrawerStaff(linkedStaff || null)} className="text-left">
                      <div className="text-xs font-black text-slate-900 dark:text-white">{item.employeeName}</div>
                      <p className="text-[10px] text-slate-500">{item.empId}</p>
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.grossSalary || 0)}</td>
                  <td className="px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white">{formatCurrency((item.leaveDeduction || 0) + (item.otherDeductions || 0) + (item.pfDeduction || 0))}</td>
                  <td className="px-3 py-1.5 text-xs font-black text-brand-700 dark:text-brand-300">{formatCurrency(item.netSalary)}</td>
                  <td className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">{item.paymentDate || item.disbursedDate}</td>
                  <td className="px-3 py-1.5">
                    <Badge variant={item.status === 'Paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => handlePrintPayslip(item, false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors" title="View Payslip">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          handlePrintPayslip(item, true);
                          addToast('success', 'Download Started', `${item.employeeName} payslip PDF prepared.`);
                        }} 
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/30 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors" 
                        title="Download Payslip PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => addToast('info', 'Email queued', `${item.employeeName} payslip email prepared.`)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors" title="Email Payslip">
                        <Mail className="h-3.5 w-3.5" />
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
    <div className="space-y-6 animate-in fade-in pb-12 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BadgeIndianRupee className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Payroll
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {payrollTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-[52px] items-center justify-center xl:justify-start gap-2 rounded-2xl border px-3 py-2 text-left transition-all ${
                active
                  ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'border-slate-200 bg-white shadow-sm text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              <div className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-center xl:text-left leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {renderTabContent()}

      {structureModalOpen && (
        <ModalShell
          title={structureMode === 'add' ? 'Create Salary Structure' : structureMode === 'edit' ? 'Edit Salary Structure' : 'Duplicate Salary Structure'}
          onClose={closeStructureModal}
          maxWidth="max-w-3xl"
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
                    <SelectField value={structureDraft.employeeCategory} onChange={e => setStructureDraft(prev => ({ ...prev, employeeCategory: e.target.value as CategoryValue }))}>
                      <option value="Teacher">Teaching Staff</option>
                      <option value="Staff">Non-Teaching Staff</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
                    <SearchableSelect
                      value={structureDraft.designation}
                      onChange={(val: string) => setStructureDraft(prev => ({ ...prev, designation: val }))}
                      options={getDesignationOptions(structureDraft.employeeCategory)}
                      placeholder="e.g. Mathematics Teacher"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Effective From</label>
                    <input type="date" value={structureDraft.effectiveDate} onChange={e => setStructureDraft(prev => ({ ...prev, effectiveDate: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Payroll Frequency</label>
                    <SelectField value={structureDraft.payrollFrequency} onChange={e => setStructureDraft(prev => ({ ...prev, payrollFrequency: e.target.value as any }))}>
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Daily">Daily</option>
                      <option value="Per Class">Per Class</option>
                      <option value="Contractual">Contractual</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Status</label>
                    <SelectField value={structureDraft.status} onChange={e => setStructureDraft(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </SelectField>
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
                  </div>
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
                  </div>
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
                  </div>
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
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">PF Applicable</label>
                    <SelectField
                      value={structureDraft.pfApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, pfApplicable: e.target.value === 'Yes' }))}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </SelectField>
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
                    <SelectField
                      value={structureDraft.esiApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, esiApplicable: e.target.value === 'Yes' }))}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </SelectField>
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
                    <SelectField
                      value={structureDraft.professionalTaxApplicable ? 'Yes' : 'No'}
                      onChange={e => setStructureDraft(prev => ({ ...prev, professionalTaxApplicable: e.target.value === 'Yes' }))}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </SelectField>
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


              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeStructureModal}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveStructure}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  <Save className="h-4 w-4" /> {structureMode === 'edit' ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {assignmentModalOpen && (
        <ModalShell
          title="Assign Salary"
          onClose={closeAssignmentModal}
          maxWidth="max-w-2xl"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Employee</label>
                <SelectField
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
                >
                  <option value="">Select Employee</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} - {member.empId}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Category</label>
                <SelectField
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
                >
                  <option value="">Select Category</option>
                  <option value="Teacher">Teaching Staff</option>
                  <option value="Staff">Non-Teaching Staff</option>
                </SelectField>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Designation</label>
                <SearchableSelect
                    value={assignmentDraft.designation}
                    onChange={(val: string) => {
                      const designation = val;
                      const candidateStructures = salaryStructures.filter(item => structureMatches(item, assignmentDraft.employeeCategory || '', designation));
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
                    options={filteredDesignationOptions}
                    placeholder="Select Designation"
                    disabled={!assignmentDraft.employeeCategory}
                  />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Salary Structure</label>
                <SelectField
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
                  disabled={!assignmentDraft.designation}
                >
                  <option value="">Select Salary Structure</option>
                  {structureOptionsForAssignment.map(structure => (
                    <option key={structure.id} value={structure.id}>
                      {structure.structureName}
                    </option>
                  ))}
                </SelectField>
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
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeAssignmentModal}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={assignSalary}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-500/20"
                >
                  <Save className="h-4 w-4" /> Assign
                </button>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      <ConfirmModal
        isOpen={isGenerateModalOpen}
        title="Generate Payslips"
        message="Are you sure you want to generate these payslips? This action will process payroll for the selected employees."
        confirmLabel="Generate"
        variant="info"
        onConfirm={confirmBulkGenerate}
        onCancel={() => setIsGenerateModalOpen(false)}
      />

      <PayrollDrawer
        staff={currentPreviewStaff}
        isOpen={!!currentPreviewStaff}
        onClose={() => setDrawerStaff(null)}
      />
    </div>
  );
};

export default PayrollModuleView;
