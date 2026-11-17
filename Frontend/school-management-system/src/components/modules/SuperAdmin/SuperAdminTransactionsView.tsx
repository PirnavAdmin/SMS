import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Download, Search, CheckCircle2, Clock, RefreshCw,
  DollarSign, Building2, X, AlertCircle, SearchX
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchSchoolsApi, fetchPackagesApi, SchoolItem, PackagePlan } from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';
import { validateSearchQuery } from '../../../utils/validation';

interface Transaction {
  id: string;
  schoolName: string;
  invoiceNo: string;
  planName: string;
  billingCycle: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

export const SuperAdminTransactionsView: React.FC = () => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('All');
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, pkgs] = await Promise.all([
        fetchSchoolsApi().catch(() => []),
        fetchPackagesApi().catch(() => [])
      ]);
      setSchools(sList || []);
      setPackages(pkgs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    if (!value.trim()) {
      setSearchError(undefined);
    } else {
      const res = validateSearchQuery(value.trim(), 30);
      setSearchError(res.isValid ? undefined : (res.error || 'Enter a valid search term.'));
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchError(undefined);
    setCurrentPage(1);
  };

  // Map package rates dynamically
  const planRates = useMemo(() => {
    const rates: Record<string, { monthly: number; yearly: number }> = {};
    packages.forEach(p => {
      rates[p.name.toLowerCase().trim()] = {
        monthly: p.monthlyPrice,
        yearly: p.yearlyPrice
      };
    });
    return rates;
  }, [packages]);

  // Generate real transactions from registered schools
  const transactions: Transaction[] = useMemo(() => {
    return schools.map(s => {
      const key = (s.planName || '').toLowerCase().trim();
      const cycle = s.planType || 'Monthly';
      const pkgInfo = planRates[key];
      const amount = pkgInfo
        ? (cycle === 'Yearly' ? pkgInfo.yearly : pkgInfo.monthly)
        : 0;

      const dateStr = s.createdAt
        ? new Date(s.createdAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      return {
        id: `tx-${s.schoolId}`,
        schoolName: s.schoolName,
        invoiceNo: `INV-2026-${s.schoolId.toString().padStart(4, '0')}`,
        planName: s.planName ? `${s.planName} (${cycle})` : 'Unassigned Plan',
        billingCycle: cycle,
        amount,
        date: dateStr,
        paymentMethod: s.status === 'Active' ? 'Online Gateway' : 'Pending Verification',
        status: s.status === 'Active' ? 'Paid' : 'Pending'
      };
    });
  }, [schools, planRates]);

  const filtered = useMemo(() => {
    if (searchError) return [];
    const term = searchTerm.toLowerCase().trim();
    return transactions.filter(t => {
      const matchesSearch =
        !term ||
        t.schoolName.toLowerCase().includes(term) ||
        t.invoiceNo.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, searchError, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const handleExport = () => {
    if (filtered.length === 0) {
      addToast('info', 'Export', 'No transactions available to export.');
      return;
    }
    const data = filtered.map(t => ({
      'Invoice No': t.invoiceNo,
      'School Name': t.schoolName,
      'Plan': t.planName,
      'Amount ($)': t.amount,
      'Billing Cycle': t.billingCycle,
      'Date': t.date,
      'Payment Method': t.paymentMethod,
      'Status': t.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('success', 'Export Completed', 'Transaction records exported to Excel.');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Super Admin</span>
            <span>&gt;</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Purchase Transactions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Subscription Invoices & Purchase Transactions
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="w-9 h-9 rounded-2xl btn-glass-secondary flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 transition-all cursor-pointer active:scale-95"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-2xl btn-glass-secondary text-slate-700 dark:text-slate-300 text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Filter & Search Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Row Per Page</span>
            <select
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10 ${searchError ? 'text-rose-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search invoice or school..."
                  value={searchTerm}
                  maxLength={30}
                  onChange={e => handleSearchChange(e.target.value)}
                  className={`w-64 pl-8 ${searchTerm ? 'pr-8' : 'pr-3'} py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border transition-all ${
                    searchError
                      ? 'border-rose-500 ring-1 ring-rose-500/20 text-rose-900 dark:text-rose-100 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-sky-500'
                  } outline-none font-medium`}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchError && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1 pl-1 animate-in fade-in duration-150 absolute -bottom-5 left-0 whitespace-nowrap z-20">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{searchError}</span>
                </p>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3 text-center">Invoice #</th>
                <th className="p-3 text-center">School Name</th>
                <th className="p-3 text-center">Plan & Cycle</th>
                <th className="p-3 text-center">Amount</th>
                <th className="p-3 text-center">Payment Method</th>
                <th className="p-3 text-center">Date</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading subscription invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : searchError ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <p className="font-bold text-xs">{searchError}</p>
                      <p className="text-[11px] text-slate-400 font-normal">Please enter a valid search query.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      {searchTerm ? (
                        <>
                          <SearchX className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No Matching Invoices</p>
                          <p className="text-xs text-slate-400">No invoice records found matching "{searchTerm}". Try checking your invoice number or school name.</p>
                          <button
                            onClick={handleClearSearch}
                            className="mt-2 px-3 py-1.5 rounded-xl btn-glass-secondary text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            Reset Search
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shadow-inner">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">No Subscription Transactions Recorded</p>
                          <p className="text-xs text-slate-400">No client school payment transactions or invoices have been recorded yet. When schools subscribe to packages, billing records appear here automatically.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono font-bold text-sky-600">{tx.invoiceNo}</td>
                    <td className="p-3 text-center font-bold text-slate-900 dark:text-white">{tx.schoolName}</td>
                    <td className="p-3 text-center">
                      <span className="font-semibold">{tx.planName}</span>
                    </td>
                    <td className="p-3 text-center font-extrabold text-slate-900 dark:text-white">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center text-slate-500">{tx.paymentMethod}</td>
                    <td className="p-3 text-center text-slate-500">{tx.date}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-900 dark:text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
