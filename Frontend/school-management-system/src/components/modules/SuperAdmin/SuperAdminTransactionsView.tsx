import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Download, Search, CheckCircle2, Clock, RefreshCw, DollarSign, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchSchoolsApi, fetchPackagesApi, SchoolItem, PackagePlan } from '../../../api/superadmin';
import { useToast } from '../../../context/ToastContext';

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
  const [statusFilter, setStatusFilter] = useState('All');
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [packages, setPackages] = useState<PackagePlan[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = transactions.filter(t => {
    const matchesSearch =
      t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time institutional subscription billing records derived from registered schools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or school..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none w-64 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Invoice #</th>
                <th className="p-4">School Name</th>
                <th className="p-4">Plan & Cycle</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading subscription invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No subscription invoices found</p>
                      <p className="text-xs text-slate-400">When schools subscribe to packages, billing records appear here automatically.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-orange-600">{tx.invoiceNo}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{tx.schoolName}</td>
                    <td className="p-4">
                      <span className="font-semibold">{tx.planName}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-500">{tx.paymentMethod}</td>
                    <td className="p-4 text-slate-500">{tx.date}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{tx.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
