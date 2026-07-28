import React, { useState } from 'react';
import {
  FileSpreadsheet, ArrowUpRight, ArrowDownLeft, Plus, Search, Filter, Calendar,
  Building2, CreditCard, Eye, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2,
  Printer, Download, FileText, IndianRupee, Layers, SlidersHorizontal, BookOpen, Clock,
  ChevronRight, ExternalLink, X, Paperclip, Lock, RefreshCw, PieChart, Sparkles, TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { FinanceTransaction, FinancialAccount, FinancialCategory, FinancialBudget, TransactionType } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const TransactionsMasterLedgerView: React.FC = () => {
  const {
    financeTransactions, addFinanceTransaction, reverseFinanceTransaction, cancelFinanceTransaction,
    financialAccounts, addFinancialAccount, updateFinancialAccount,
    financialCategories, addFinancialCategory, updateFinancialCategory,
    financialBudgets, updateFinancialBudget,
    students, staff
  } = useData();

  const { addToast } = useToast();

  // Active Sub-Tab: 'ledger' | 'manual' | 'categories-accounts' | 'budget' | 'audit'
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'categories-accounts' | 'budget'>('ledger');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
  const [sourceModuleFilter, setSourceModuleFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTxnForDetail, setSelectedTxnForDetail] = useState<FinanceTransaction | null>(null);
  const [txnToReverse, setTxnToReverse] = useState<FinanceTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Category / Account Modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Manual Entry Form State
  const [manualForm, setManualForm] = useState({
    type: 'Income' as TransactionType,
    category: 'Donations & Grants',
    description: '',
    amount: '',
    paymentMode: 'Bank Transfer' as any,
    account: 'Main Bank Account' as any,
    date: new Date().toISOString().split('T')[0],
    branch: 'Main Campus',
    academicYear: '2025-2026',
    notes: '',
    attachmentName: ''
  });

  // New Category Form State
  const [newCatForm, setNewCatForm] = useState({
    name: '',
    type: 'Income' as TransactionType,
    sourceModule: 'Manual'
  });

  // New Account Form State
  const [newAccForm, setNewAccForm] = useState({
    accountName: '',
    accountType: 'Main Bank Account' as any,
    accountNumber: '',
    bankName: '',
    branchName: '',
    currentBalance: ''
  });

  // Summary Metrics Computation
  const filteredTxns = financeTransactions.filter(t => {
    // Search
    const matchesSearch =
      (t.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.referenceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.createdBy || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Type
    const matchesType = typeFilter === 'All' || t.type === typeFilter;

    // Module
    const matchesModule = sourceModuleFilter === 'All' || t.sourceModule === sourceModuleFilter;

    // Category
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    // Payment Mode
    const matchesMode = paymentModeFilter === 'All' || t.paymentMode === paymentModeFilter;

    // Branch
    const matchesBranch = branchFilter === 'All' || t.branch === branchFilter;

    // Status
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesType && matchesModule && matchesCategory && matchesMode && matchesBranch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const totalIncome = financeTransactions
    .filter(t => t.type === 'Income' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = financeTransactions
    .filter(t => t.type === 'Expense' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncome = financeTransactions
    .filter(t => t.type === 'Income' && t.status === 'Completed' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const todayExpenses = financeTransactions
    .filter(t => t.type === 'Expense' && t.status === 'Completed' && t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  const cashBalance = financialAccounts
    .filter(a => a.accountType === 'Cash' || a.accountType === 'Petty Cash Account')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const bankBalance = financialAccounts
    .filter(a => a.accountType !== 'Cash' && a.accountType !== 'Petty Cash Account')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  // Handle Manual Entry Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.description || !manualForm.amount || isNaN(Number(manualForm.amount))) {
      addToast('warning', 'Validation Error', 'Please enter a valid description and amount.');
      return;
    }

    const amt = parseFloat(manualForm.amount);
    const newTxn = addFinanceTransaction({
      date: manualForm.date,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: manualForm.type,
      category: manualForm.category,
      sourceModule: 'Manual',
      referenceNumber: `MNL-${Date.now().toString().slice(-6)}`,
      description: manualForm.description,
      amount: amt,
      paymentMode: manualForm.paymentMode,
      account: manualForm.account,
      branch: manualForm.branch,
      academicYear: manualForm.academicYear,
      status: 'Completed',
      createdBy: 'Finance Admin',
      approvedBy: 'Chief Accountant',
      notes: manualForm.notes,
      attachments: manualForm.attachmentName ? [manualForm.attachmentName] : []
    });

    addToast('success', 'Transaction Recorded', `Master Ledger entry ${newTxn.transactionId} created.`);
    setIsManualModalOpen(false);
    setManualForm({
      type: 'Income',
      category: 'Donations & Grants',
      description: '',
      amount: '',
      paymentMode: 'Bank Transfer',
      account: 'Main Bank Account',
      date: new Date().toISOString().split('T')[0],
      branch: 'Main Campus',
      academicYear: '2025-2026',
      notes: '',
      attachmentName: ''
    });
  };

  // Handle Reversal Submit
  const handleReversalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnToReverse || !reversalReason.trim()) return;

    reverseFinanceTransaction(txnToReverse.transactionId, reversalReason, 'Finance Administrator');
    addToast('info', 'Transaction Reversed', `Transaction ${txnToReverse.transactionId} has been reversed.`);
    setTxnToReverse(null);
    setReversalReason('');
  };

  // Handle Add Category Submit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatForm.name.trim()) return;

    addFinancialCategory({
      name: newCatForm.name.trim(),
      type: newCatForm.type,
      sourceModule: newCatForm.sourceModule,
      status: 'Active',
      isSystem: false
    });

    addToast('success', 'Category Created', `Category '${newCatForm.name}' added.`);
    setIsAddCategoryOpen(false);
    setNewCatForm({ name: '', type: 'Income', sourceModule: 'Manual' });
  };

  // Handle Add Account Submit
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccForm.accountName.trim()) return;

    addFinancialAccount({
      accountName: newAccForm.accountName.trim(),
      accountType: newAccForm.accountType,
      accountNumber: newAccForm.accountNumber,
      bankName: newAccForm.bankName,
      branchName: newAccForm.branchName,
      currentBalance: parseFloat(newAccForm.currentBalance) || 0,
      currency: 'INR',
      status: 'Active'
    });

    addToast('success', 'Account Created', `Financial Account '${newAccForm.accountName}' created.`);
    setIsAddAccountOpen(false);
    setNewAccForm({
      accountName: '',
      accountType: 'Main Bank Account',
      accountNumber: '',
      bankName: '',
      branchName: '',
      currentBalance: ''
    });
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Transaction ID,Date,Type,Category,Source Module,Ref No,Description,Amount,Payment Mode,Account,Branch,Status,Created By'];
    const rows = filteredTxns.map(t =>
      `"${t.transactionId}","${t.date}","${t.type}","${t.category}","${t.sourceModule}","${t.referenceNumber}","${t.description.replace(/"/g, '""')}","${t.amount}","${t.paymentMode}","${t.account}","${t.branch}","${t.status}","${t.createdBy}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'Exported Master Ledger to CSV file.');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Transactions
          </h2>
          <p className="text-xs text-slate-500">
            Single Source of Truth: Central financial repository consolidating all ERP income & expense flows
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export Excel / CSV
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Manual Transaction
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Today: <strong className="text-emerald-600">+{formatCurrency(todayIncome)}</strong></span>
            <span className="text-emerald-600 font-bold">● Active Ledger</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-slate-50 dark:from-rose-950/20 dark:to-slate-900 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Today: <strong className="text-rose-600">-{formatCurrency(todayExpenses)}</strong></span>
            <span className="text-rose-600 font-bold">● Verified Payroll/Bills</span>
          </div>
        </div>

        {/* Net Surplus / Balance */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-slate-50 dark:from-sky-950/20 dark:to-slate-900 border border-sky-200/80 dark:border-sky-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Net Financial Balance</span>
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-black ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatCurrency(netBalance)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Overall Cash Flow</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{netBalance >= 0 ? 'Surplus' : 'Deficit'}</span>
          </div>
        </div>

        {/* Liquidity Accounts */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-slate-50 dark:from-sky-950/20 dark:to-slate-900 border border-sky-200/80 dark:border-sky-900/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">Liquidity Accounts</span>
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="text-slate-500 font-medium">Bank Balance:</span>
              <span className="text-sky-600">{formatCurrency(bankBalance)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="text-slate-500 font-medium">Cash Vault:</span>
              <span className="text-emerald-600">{formatCurrency(cashBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-MODULE TABS */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 max-w-xl border border-slate-200/40 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'ledger'
              ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Master Ledger ({financeTransactions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('categories-accounts')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'categories-accounts'
              ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Categories & Accounts
        </button>

        <button
          onClick={() => setActiveSubTab('budget')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'budget'
              ? 'bg-white dark:bg-slate-950 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" /> Budget Integration
        </button>
      </div>

      {/* SUB-TAB 1: MASTER LEDGER TABLE & ADVANCED FILTERS */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Txn ID, Description, Ref No..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="All">All Transaction Types</option>
                  <option value="Income">Income (+)</option>
                  <option value="Expense">Expense (-)</option>
                </select>
              </div>

              {/* Source Module Filter */}
              <div>
                <select
                  value={sourceModuleFilter}
                  onChange={e => setSourceModuleFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="All">All Source ERP Modules</option>
                  <option value="Student Fee Collection">Student Fee Collection</option>
                  <option value="Admissions">Admissions</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Transport">Transport</option>
                  <option value="Library">Library</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Manual">Manual Entries</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="All">All Categories</option>
                  {financialCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Payment Mode */}
              <div>
                <select
                  value={paymentModeFilter}
                  onChange={e => setPaymentModeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="All">All Payment Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Reversed">Reversed</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-semibold"
                >
                  <option value="date-desc">Sort: Date (Newest First)</option>
                  <option value="date-asc">Sort: Date (Oldest First)</option>
                  <option value="amount-desc">Sort: Amount (High to Low)</option>
                  <option value="amount-asc">Sort: Amount (Low to High)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Txn ID & Date</th>
                    <th className="p-4">Type & Category</th>
                    <th className="p-4">Source Module</th>
                    <th className="p-4">Reference No.</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Mode & Account</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTxns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        No financial transactions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTxns.map(txn => (
                      <tr key={txn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        
                        {/* Txn ID & Date */}
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          <span className="block text-sky-600 dark:text-sky-400">{txn.transactionId}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{txn.date} {txn.time || ''}</span>
                        </td>

                        {/* Type & Category */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              txn.type === 'Income'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {txn.type}
                            </span>
                            <p className="font-bold text-slate-900 dark:text-white">{txn.category}</p>
                          </div>
                        </td>

                        {/* Source Module */}
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 border">
                            {txn.sourceModule}
                          </span>
                        </td>

                        {/* Reference No */}
                        <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {txn.referenceNumber}
                        </td>

                        {/* Description */}
                        <td className="p-4 max-w-xs text-slate-700 dark:text-slate-300 font-medium">
                          <p className="truncate" title={txn.description}>{txn.description}</p>
                        </td>

                        {/* Amount */}
                        <td className="p-4 font-mono font-black text-sm">
                          <span className={txn.type === 'Income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {txn.type === 'Income' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                        </td>

                        {/* Mode & Account */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white">{txn.paymentMode}</p>
                          <p className="text-[10px] text-slate-400">{txn.account}</p>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            txn.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            txn.status === 'Reversed' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {txn.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => setSelectedTxnForDetail(txn)}
                            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 border border-sky-200 dark:border-sky-800"
                            title="View Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {txn.status !== 'Reversed' && (
                            <button
                              onClick={() => setTxnToReverse(txn)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 border border-rose-200 dark:border-rose-800"
                              title="Reverse Transaction"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CATEGORIES & ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'categories-accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Categories Box */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  Financial Transaction Categories
                </h3>
                <p className="text-[11px] text-slate-400">Income & Expense classification master</p>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {financialCategories.map(cat => (
                <div key={cat.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{cat.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        cat.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {cat.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Source: {cat.sourceModule || 'Manual'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {cat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Box */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Financial Accounts & Liquidity Vaults
                </h3>
                <p className="text-[11px] text-slate-400">Cash vaults, bank accounts & department accounts</p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Account
              </button>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {financialAccounts.map(acc => (
                <div key={acc.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between text-xs space-y-1">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{acc.accountName}</h4>
                    <p className="text-[10px] text-slate-400">{acc.accountType} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}</p>
                    {acc.bankName && <p className="text-[10px] text-slate-500">{acc.bankName} ({acc.branchName})</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Current Balance</span>
                    <p className="font-black text-sm text-emerald-600">{formatCurrency(acc.currentBalance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: BUDGET INTEGRATION */}
      {activeSubTab === 'budget' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-sky-600" />
                  Budget Allocation & Consumption Tracking
                </h3>
                <p className="text-[11px] text-slate-400">Automated budget deduction based on Master Ledger expenses</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {financialBudgets.map(b => {
                const percent = Math.min(100, Math.round((b.consumedAmount / (b.allocatedAmount || 1)) * 100));
                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{b.categoryName}</h4>
                        <p className="text-[10px] text-slate-400">{b.branch} • AY {b.academicYear}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        percent >= 90 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {percent}% Consumed
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${percent >= 90 ? 'bg-rose-500' : 'bg-sky-600'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 text-center text-xs pt-1 border-t border-slate-200/80 dark:border-slate-700/60">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Allocated</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(b.allocatedAmount)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Consumed</span>
                        <span className="font-extrabold text-rose-600">{formatCurrency(b.consumedAmount)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Remaining</span>
                        <span className="font-extrabold text-emerald-600">{formatCurrency(b.remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAIL VIEW MODAL */}
      {selectedTxnForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Transaction Details: {selectedTxnForDetail.transactionId}
                </h3>
                <p className="text-[10px] text-slate-400">Master Ledger Central Audit Entry</p>
              </div>
              <button onClick={() => setSelectedTxnForDetail(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Transaction Type & Amount</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      selectedTxnForDetail.type === 'Income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedTxnForDetail.type}
                    </span>
                    <span className="font-black text-lg text-slate-900 dark:text-white">
                      {formatCurrency(selectedTxnForDetail.amount)}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800">
                  {selectedTxnForDetail.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Category</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedTxnForDetail.category}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Source Module</span>
                  <p className="font-bold text-sky-600">{selectedTxnForDetail.sourceModule}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Reference Number</span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedTxnForDetail.referenceNumber}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode & Account</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedTxnForDetail.paymentMode} ({selectedTxnForDetail.account})</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Date & Time</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedTxnForDetail.date} {selectedTxnForDetail.time || ''}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Branch & Academic Year</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedTxnForDetail.branch} ({selectedTxnForDetail.academicYear})</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedTxnForDetail.description}</p>
              </div>

              {/* Audit Log Timeline */}
              {selectedTxnForDetail.auditTrail && selectedTxnForDetail.auditTrail.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-bold uppercase text-slate-400 text-[10px]">Audit Trail Timeline</h4>
                  <div className="space-y-2">
                    {selectedTxnForDetail.auditTrail.map(log => (
                      <div key={log.id} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border text-[11px] space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span className="text-sky-600">{log.action} by {log.user}</span>
                          <span className="text-slate-400 font-normal">{log.timestamp}</span>
                        </div>
                        {log.notes && <p className="text-slate-500 italic">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setSelectedTxnForDetail(null)} className="px-4 py-2 font-bold bg-slate-800 text-white rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* REVERSAL CONFIRMATION MODAL */}
      {txnToReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-rose-600 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Reverse Transaction {txnToReverse.transactionId}
              </h3>
              <button onClick={() => setTxnToReverse(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Reversing this transaction will post an offsetting reversal entry in the Master Ledger to preserve financial integrity and audit history.
            </p>

            <form onSubmit={handleReversalSubmit} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Reason for Reversal *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Duplicate entry, Incorrect account, Returned payment..."
                  value={reversalReason}
                  onChange={e => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setTxnToReverse(null)} className="px-4 py-2 font-semibold bg-slate-200 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 font-bold bg-rose-600 text-white rounded-xl shadow-md">Confirm Reversal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL TRANSACTION CREATION MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Add Manual Financial Transaction
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleManualSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Transaction Type *</label>
                  <select
                    value={manualForm.type}
                    onChange={e => setManualForm({ ...manualForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-sky-600"
                  >
                    <option value="Income">Income (+)</option>
                    <option value="Expense">Expense (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Category *</label>
                  <select
                    value={manualForm.category}
                    onChange={e => setManualForm({ ...manualForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    {financialCategories
                      .filter(c => c.type === manualForm.type)
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alumni Endowment Fund Donation, Emergency Plumbing Repair"
                  value={manualForm.description}
                  onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={manualForm.amount}
                    onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Payment Mode *</label>
                  <select
                    value={manualForm.paymentMode}
                    onChange={e => setManualForm({ ...manualForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Linked Financial Account *</label>
                  <select
                    value={manualForm.account}
                    onChange={e => setManualForm({ ...manualForm, account: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    {financialAccounts.map(a => (
                      <option key={a.id} value={a.accountType}>{a.accountName} ({formatCurrency(a.currentBalance)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Notes / Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Enter audit notes or approval details..."
                  value={manualForm.notes}
                  onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 font-semibold bg-slate-200 dark:bg-slate-800 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-md">Post to Master Ledger</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY SUB-MODAL */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Add Financial Category</h3>
              <button onClick={() => setIsAddCategoryOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Category Name *</label>
                <input type="text" required value={newCatForm.name} onChange={e => setNewCatForm({ ...newCatForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Type *</label>
                <select value={newCatForm.type} onChange={e => setNewCatForm({ ...newCatForm, type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-bold">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT SUB-MODAL */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Add Financial Account</h3>
              <button onClick={() => setIsAddAccountOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Account Name *</label>
                <input type="text" required placeholder="e.g. HDFC Hostel Operations" value={newAccForm.accountName} onChange={e => setNewAccForm({ ...newAccForm, accountName: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Account Type *</label>
                <select value={newAccForm.accountType} onChange={e => setNewAccForm({ ...newAccForm, accountType: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                  <option value="Cash">Cash</option>
                  <option value="Main Bank Account">Main Bank Account</option>
                  <option value="Salary Account">Salary Account</option>
                  <option value="Hostel Account">Hostel Account</option>
                  <option value="Transport Account">Transport Account</option>
                  <option value="Petty Cash Account">Petty Cash Account</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Opening Balance (INR) *</label>
                <input type="number" required value={newAccForm.currentBalance} onChange={e => setNewAccForm({ ...newAccForm, currentBalance: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsAddAccountOpen(false)} className="px-3 py-1.5 rounded-xl bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default TransactionsMasterLedgerView;
