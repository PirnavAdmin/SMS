// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Download, Eye, Calendar, IndianRupee,
  Search, CheckCircle2, XCircle, ShieldCheck, ChevronLeft,
  ChevronRight, ArrowUpDown, ChevronDown, Printer, X, Bus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Badge } from '../../common/Badge';
import { formatCurrency } from '../../../utils/currency';
import { Payslip } from '../../../types';
import { Pagination } from '../../common/Pagination';
import { numberToWords } from '../../../utils/numberToWords';
import { printPayslip, downloadPayslipPdf } from '../../../utils/payslipTemplate';
import { PayslipModal } from './PayslipModal';
import { resolveMediaUrl } from '../../../utils/mediaUtils';

const formatPayMonth = (monthLabel?: string): string => {
  if (!monthLabel) return 'N/A';
  const ym = monthLabel.match(/\b(19|20\d\d)\b/g);
  const year = ym ? ym[0] : '';
  const monthName = monthLabel.replace(/\b(19|20\d\d)\b/g, '').trim();
  if (monthName && year) return `${monthName} ${year}`;
  return monthName || year || 'N/A';
};

export const DriverPayslipsView: React.FC = () => {
  const { user } = useAuth();
  const { staff = [], driverMasters = [], payslips = [], schoolProfile, fetchPayslips } = useData();

  useEffect(() => {
    if (fetchPayslips) {
      fetchPayslips();
    }
  }, [fetchPayslips]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  // 1. Resolve Driver Profile
  const matchedDriver = useMemo(() => {
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const userEmpId = (user?.id || (user as any)?.empId || '').trim().toLowerCase();

    const fromMaster = driverMasters.find(d =>
      (userEmpId && (d.employeeId?.toLowerCase() === userEmpId || String(d.id) === userEmpId)) ||
      (userEmail && d.email?.toLowerCase() === userEmail) ||
      (userName && d.driverName?.toLowerCase() === userName)
    );

    if (fromMaster) return fromMaster;

    const fromStaff = staff.find(s =>
      (userEmpId && (s.employeeId?.toLowerCase() === userEmpId || String(s.id) === userEmpId)) ||
      (userEmail && s.email?.toLowerCase() === userEmail) ||
      (userName && `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase() === userName)
    );

    if (fromStaff) {
      return {
        id: fromStaff.id,
        driverName: `${fromStaff.firstName} ${fromStaff.lastName}`,
        employeeId: fromStaff.employeeId || fromStaff.empId || fromStaff.id || '',
        salary: fromStaff.salary || 30000
      };
    }

    return {
      id: user?.id || '1',
      driverName: user?.name || user?.email || 'Driver',
      employeeId: (user as any)?.empId || (user as any)?.employeeId || user?.id || '',
      salary: 30000
    };
  }, [user, driverMasters, staff]);

  // 2. Retrieve Generated Monthly Payslips
  const driverPayslips: Payslip[] = useMemo(() => {
    const driverId = String(matchedDriver.employeeId || matchedDriver.id || '').toLowerCase();
    const driverName = (matchedDriver.driverName || '').toLowerCase();

    return payslips.filter(p =>
      (p.employeeId && p.employeeId.toLowerCase() === driverId) ||
      (p.empId && p.empId.toLowerCase() === driverId) ||
      (p.employeeName && p.employeeName.toLowerCase().includes(driverName))
    ).map(p => ({
      ...p,
      month: formatPayMonth(p.month)
    }));
  }, [payslips, matchedDriver]);

  // 3. Filtered & Sorted payslips
  const sortedPayslips = useMemo(() => {
    const filtered = driverPayslips.filter(p => {
      const monthMatch = p.month.toLowerCase().includes(searchQuery.toLowerCase());
      const yearMatch = selectedYear === 'All' || p.month.includes(selectedYear);
      return monthMatch && yearMatch;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.disbursedDate || a.month).getTime();
      const dateB = new Date(b.disbursedDate || b.month).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [driverPayslips, searchQuery, selectedYear, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, sortOrder]);

  const totalPages = Math.ceil(sortedPayslips.length / itemsPerPage) || 1;
  const paginatedPayslips = sortedPayslips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Download Payslip PDF helper
  const handleDownloadPayslip = (p: Payslip) => {
    downloadPayslipPdf(p, matchedDriver, schoolProfile);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800 shadow-xs">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Driver Salary & Payslips
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {matchedDriver.driverName} • ID: {matchedDriver.employeeId || matchedDriver.id || '—'} • Transport Roster
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Net Salary</span>
          <span className="text-2xl font-black text-sky-600">
            {formatCurrency(driverPayslips[0]?.netSalary || 28000)}
          </span>
          <p className="text-[10px] text-slate-400">Regular Monthly Transit Disbursement</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">Gross Earnings</span>
          <span className="text-2xl font-black text-emerald-600">
            {formatCurrency(driverPayslips[0]?.grossSalary || 30000)}
          </span>
          <p className="text-[10px] text-slate-400">Includes Base, HRA & Transit Allowance</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-600 block">Total Statutory PF</span>
          <span className="text-2xl font-black text-amber-600">
            {formatCurrency(driverPayslips[0]?.pfDeduction || 1800)}
          </span>
          <p className="text-[10px] text-slate-400">Monthly Provident Fund Contribution</p>
        </div>
      </div>

      {/* Payslips Table Card */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            Payslip History ({sortedPayslips.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search month..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 outline-none w-36 sm:w-44"
              />
            </div>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Payslip Month</th>
                <th className="py-2.5 px-3">Disbursed Date</th>
                <th className="py-2.5 px-3">Gross Salary</th>
                <th className="py-2.5 px-3">Deductions</th>
                <th className="py-2.5 px-3">Net Pay</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedPayslips.map(p => {
                const totalDeductions = (p.pfDeduction || 0) + (p.otherDeductions || 0);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-black text-slate-900 dark:text-white">
                      {p.month}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {p.disbursedDate}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.grossSalary)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">
                      {formatCurrency(totalDeductions)}
                    </td>
                    <td className="py-2.5 px-3 font-black text-emerald-600">
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" size="sm">Paid</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingPayslip(p)}
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                          title="View Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(p)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Print / Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedPayslips.length > 0 && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={currentPage}
              totalItems={sortedPayslips.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              label="payslips"
            />
          </div>
        )}
      </div>

      {/* View Breakdown Modal */}
      {viewingPayslip && (
        <PayslipModal
          payslip={viewingPayslip}
          staffMember={matchedDriver}
          onClose={() => setViewingPayslip(null)}
        />
      )}    </div>
  );
};
