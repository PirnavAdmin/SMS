import React, { useMemo, useState } from 'react';
import {
  X, WalletCards, Coins, Banknote, ReceiptText, ShieldCheck,
  FileSpreadsheet, Download, Mail, Printer, Eye, CheckCircle2
} from 'lucide-react';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Staff } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface PayrollDrawerProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

type DrawerTab =
  | 'overview'
  | 'salary-structure'
  | 'allowances'
  | 'deductions'
  | 'history'
  | 'payslips'
  | 'bank';

const tabs: { id: DrawerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: WalletCards },
  { id: 'salary-structure', label: 'Salary Structure', icon: FileSpreadsheet },
  { id: 'allowances', label: 'Allowances', icon: Coins },
  { id: 'deductions', label: 'Deductions', icon: ShieldCheck },
  { id: 'history', label: 'Payroll History', icon: ReceiptText },
  { id: 'payslips', label: 'Payslips', icon: Printer },
  { id: 'bank', label: 'Bank Details', icon: Banknote }
];

const DrawerCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
  <section className={`rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 ${className}`}>
    <div className="mb-3">
      <h4 className="text-sm font-black text-slate-900 dark:text-white">{title}</h4>
      {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const formatShortDate = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const PayrollDrawer: React.FC<PayrollDrawerProps> = ({ staff, isOpen, onClose }) => {
  const { salaryStructures, employeeSalaryAssignments, payslips } = useData();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');

  if (!isOpen || !staff) return null;

  const assignment = employeeSalaryAssignments.find(item => item.employeeId === staff.id && item.status === 'Active');
  const structure = salaryStructures.find(item => item.id === assignment?.salaryStructureId || item.id === staff.salaryStructureId) || salaryStructures[0];
  const employeePayslips = payslips.filter(item => item.employeeId === staff.id);

  const basicSalary = structure?.earnings[0]?.amount || staff.salary || 0;
  const allowances = structure ? structure.earnings.slice(1).reduce((sum, line) => sum + line.amount, 0) : Math.round(basicSalary * 0.25);
  const deductions = structure ? structure.deductions.reduce((sum, line) => sum + line.amount, 0) : Math.round(basicSalary * 0.12);
  const grossSalary = structure?.grossSalary || basicSalary + allowances;
  const netSalary = assignment?.monthlyGross ? assignment.monthlyGross - deductions : Math.max(0, grossSalary - deductions);
  const historyRows = employeePayslips.length > 0
    ? employeePayslips.slice(0, 5)
    : [
        { month: 'July 2026', status: 'Paid' as const, netSalary, disbursedDate: '2026-07-30', paymentDate: '2026-07-30' },
        { month: 'June 2026', status: 'Paid' as const, netSalary: Math.max(0, netSalary - 800), disbursedDate: '2026-06-30', paymentDate: '2026-06-30' },
        { month: 'May 2026', status: 'Generated' as const, netSalary: Math.max(0, netSalary - 1500), disbursedDate: '2026-05-30', paymentDate: '2026-05-30' }
      ];

  const handleQuickAction = (title: string) => {
    addToast('success', title, `${staff.firstName} ${staff.lastName}'s payroll action executed in the static drawer.`);
  };

  const structureAllowances = structure?.earnings.slice(1) || [];
  const structureDeductions = structure?.deductions || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-5xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-4">
            <img src={staff.avatar} alt={`${staff.firstName} ${staff.lastName}`} className="h-16 w-16 rounded-3xl object-cover ring-4 ring-slate-100 dark:ring-slate-800" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={staff.employeeCategory === 'Teacher' ? 'info' : 'neutral'} size="sm">{staff.employeeCategory === 'Teacher' ? 'Teaching Staff' : 'Non-Teaching Staff'}</Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">{staff.empId}</span>
              </div>
              <h2 className="mt-2 truncate text-xl font-black text-slate-900 dark:text-white">{staff.firstName} {staff.lastName}</h2>
              <p className="text-sm text-slate-500">{staff.designation} | {staff.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[72px] items-center gap-3 rounded-[18px] border p-4 text-left transition-all ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.28em]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
              <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DrawerCard title="Payroll Snapshot" subtitle="Current payroll values pulled from the static ERP data.">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Structure</span><span className="font-bold text-slate-900 dark:text-white">{structure?.structureName || 'N/A'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Gross Salary</span><span className="font-black text-brand-600">{formatCurrency(grossSalary)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Net Salary</span><span className="font-black text-emerald-600">{formatCurrency(netSalary)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Status</span><Badge variant={employeePayslips[0]?.status === 'Generated' ? 'warning' : 'success'} size="sm">{employeePayslips[0]?.status || 'Ready'}</Badge></div>
                  </div>
                </DrawerCard>
                <DrawerCard title="Employment Info" subtitle="Core profile and payroll mapping.">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Branch</span><span className="font-bold text-slate-900 dark:text-white">{staff.branch || 'Main Campus'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Joining Date</span><span className="font-bold text-slate-900 dark:text-white">{formatShortDate(staff.joiningDate)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Current Assignment</span><span className="font-bold text-slate-900 dark:text-white">{assignment?.salaryStructureName || 'Unassigned'}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Bank</span><span className="font-bold text-slate-900 dark:text-white">{staff.bankDetails.bankName}</span></div>
                  </div>
                </DrawerCard>
              </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: 'Payslips', value: String(employeePayslips.length) },
                    { label: 'Gross', value: formatCurrency(grossSalary) },
                    { label: 'Net', value: formatCurrency(netSalary) },
                    { label: 'Status', value: employeePayslips[0]?.status || 'Ready' }
                  ].map(card => (
                    <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">{card.label}</p>
                      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <DrawerCard title="Payroll Actions" subtitle="Fast payroll operations from the employee drawer.">
                <div className="space-y-3">
                  {[
                    'Preview Payslip',
                    'Download PDF',
                    'Email Payslip',
                    'Mark Paid',
                    'Regenerate Payslip'
                  ].map(action => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 transition-all hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <span>{action}</span>
                      <Eye className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </DrawerCard>
            </div>
          )}

          {activeTab === 'salary-structure' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <DrawerCard title="Salary Components" subtitle="Basic, allowances, and deductions for the active structure.">
                <div className="space-y-3">
                  {[
                    ['Basic Salary', basicSalary],
                    ...structureAllowances.map(item => [item.name, item.amount] as const)
                  ].map(([label, amount]) => (
                    <div key={label} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="font-black text-slate-900 dark:text-white">{formatCurrency(Number(amount))}</span>
                    </div>
                  ))}
                </div>
              </DrawerCard>
              <DrawerCard title="Deductions & Net" subtitle="Static payroll deductions and salary preview.">
                <div className="space-y-3">
                  {structureDeductions.map(item => (
                    <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                      <span className="font-black text-rose-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-950/30">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-500">Net Salary Preview</p>
                    <p className="mt-2 text-3xl font-black text-brand-700 dark:text-brand-300">{formatCurrency(netSalary)}</p>
                  </div>
                </div>
              </DrawerCard>
            </div>
          )}

          {activeTab === 'allowances' && (
            <DrawerCard title="Allowances" subtitle="Positive earnings from the active salary structure.">
              <div className="space-y-2">
                {structureAllowances.map(item => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-black text-emerald-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'deductions' && (
            <DrawerCard title="Deductions" subtitle="Statutory and policy deductions for the active employee.">
              <div className="space-y-2">
                {structureDeductions.map(item => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                    <span className="font-black text-rose-600">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'history' && (
            <DrawerCard title="Payroll History" subtitle="Three months of payroll history for this employee.">
              <div className="space-y-3">
                {historyRows.map((item: any) => (
                  <div key={`${item.month}-${item.disbursedDate}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.month}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatShortDate(item.paymentDate || item.disbursedDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-600">{formatCurrency(item.netSalary)}</p>
                      <Badge variant={item.status === 'Paid' ? 'success' : 'warning'} size="sm">{item.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'payslips' && (
            <DrawerCard title="Payslips" subtitle="Download and publish ready-made employee payslips.">
              <div className="space-y-3">
                {historyRows.map((item: any) => (
                  <div key={`${item.month}-slip`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.month}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatCurrency(item.netSalary)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleQuickAction('Preview Payslip')} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Preview</button>
                      <button onClick={() => handleQuickAction('Download Payslip')} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerCard>
          )}

          {activeTab === 'bank' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
              <DrawerCard title="Bank Details" subtitle="Salary disbursement account information.">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Account Holder</p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountHolderName}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Account Number</p>
                    <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.accountNumber}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Bank</p>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.bankName}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">IFSC</p>
                    <p className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-white">{staff.bankDetails.ifscCode}</p>
                  </div>
                </div>
              </DrawerCard>
              <DrawerCard title="Quick Bank Actions" subtitle="Static action buttons for bank workflows.">
                <div className="space-y-3">
                  {['Copy Account Number', 'Download Bank Advice', 'Email Bank Team', 'Print Salary Advice'].map(action => (
                    <button key={action} type="button" onClick={() => handleQuickAction(action)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                      <span>{action}</span>
                      <Mail className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </DrawerCard>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500 dark:border-slate-800">
          Employee payroll details use static data only and are designed to be opened from the staff directory or payroll tables.
        </div>
      </div>
    </div>
  );
};

export default PayrollDrawer;
