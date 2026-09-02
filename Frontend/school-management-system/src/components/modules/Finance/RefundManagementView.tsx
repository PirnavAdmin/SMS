import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { 
  RotateCcw, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Filter, 
  DollarSign, 
  Clock, 
  Check, 
  X, 
  User, 
  Receipt, 
  GraduationCap, 
  Building2, 
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { Refund } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';

export const RefundManagementView: React.FC = () => {
  const { refunds, students, feePayments, addRefund, updateRefundStatus } = useData();
  const { addToast } = useToast();

  // Main Screen Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Filters & Student Selection
  const [modalClassFilter, setModalClassFilter] = useState('All');
  const [modalSectionFilter, setModalSectionFilter] = useState('All');
  const [modalSearchStudent, setModalSearchStudent] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Refund Form Fields
  const [receiptSelectionMode, setReceiptSelectionMode] = useState<'select' | 'manual'>('select');
  const [receiptNo, setReceiptNo] = useState('REC-2026-0891');
  const [amount, setAmount] = useState<number>(1000);
  const [reason, setReason] = useState<string>('Scholarship Adjustment');
  const [refundMode, setRefundMode] = useState<string>('Bank Transfer');
  const [remarks, setRemarks] = useState('Refund adjustment request');

  // Unique Classes and Sections across students
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    students.forEach(st => {
      if (st.className) set.add(st.className);
    });
    return Array.from(set).sort();
  }, [students]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach(st => {
      if (st.section) set.add(st.section);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered Students in Modal
  const modalFilteredStudents = useMemo(() => {
    return students.filter(st => {
      const matchClass = modalClassFilter === 'All' || st.className?.toLowerCase() === modalClassFilter.toLowerCase();
      const matchSection = modalSectionFilter === 'All' || st.section?.toLowerCase() === modalSectionFilter.toLowerCase();
      
      const search = modalSearchStudent.toLowerCase().trim();
      const matchSearch = !search || 
        `${st.firstName} ${st.lastName}`.toLowerCase().includes(search) ||
        (st.admissionNumber && st.admissionNumber.toLowerCase().includes(search)) ||
        (st.rollNo && String(st.rollNo).toLowerCase().includes(search)) ||
        st.id.toLowerCase().includes(search);

      return matchClass && matchSection && matchSearch;
    });
  }, [students, modalClassFilter, modalSectionFilter, modalSearchStudent]);

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Student's Paid Receipts
  const studentPaidReceipts = useMemo(() => {
    if (!selectedStudent) return [];
    return feePayments.filter(fp => 
      String(fp.studentId) === String(selectedStudent.id) || 
      (selectedStudent.admissionNumber && (fp as any).admissionNo === selectedStudent.admissionNumber)
    );
  }, [feePayments, selectedStudent]);

  // Handle student selection change
  const handleSelectStudent = (stId: string) => {
    setSelectedStudentId(stId);
    const st = students.find(s => s.id === stId);
    if (st) {
      const studentReceipts = feePayments.filter(fp => 
        String(fp.studentId) === String(st.id) || 
        (st.admissionNumber && (fp as any).admissionNo === st.admissionNumber)
      );
      if (studentReceipts.length > 0) {
        setReceiptNo(studentReceipts[0].receiptNo || `REC-2026-${st.id}`);
        setReceiptSelectionMode('select');
      } else {
        setReceiptNo(`REC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
        setReceiptSelectionMode('manual');
      }
    }
  };

  // Main Filtered Refunds
  const filteredRefunds = useMemo(() => {
    return refunds.filter(r => {
      const q = query.toLowerCase().trim();
      const matchQuery = !q || 
        r.refundNo.toLowerCase().includes(q) || 
        r.studentName.toLowerCase().includes(q) ||
        r.receiptNo.toLowerCase().includes(q) ||
        (r.admissionNo && r.admissionNo.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();
      const matchReason = reasonFilter === 'All' || r.reason.toLowerCase() === reasonFilter.toLowerCase();
      const matchClass = classFilter === 'All' || (r.className && r.className.toLowerCase() === classFilter.toLowerCase());

      return matchQuery && matchStatus && matchReason && matchClass;
    });
  }, [refunds, query, statusFilter, reasonFilter, classFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalAmount = refunds.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const approved = refunds.filter(r => r.status === 'Approved');
    const approvedAmount = approved.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const pending = refunds.filter(r => r.status === 'Pending');
    const pendingAmount = pending.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const rejected = refunds.filter(r => r.status === 'Rejected');

    return {
      totalCount: refunds.length,
      totalAmount,
      approvedCount: approved.length,
      approvedAmount,
      pendingCount: pending.length,
      pendingAmount,
      rejectedCount: rejected.length,
    };
  }, [refunds]);

  // Form Submit
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      addToast('warning', 'Student Required', 'Please select a student for the refund request.');
      return;
    }
    if (!amount || amount <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a valid refund amount.');
      return;
    }

    addRefund({
      receiptNo: receiptNo.trim() || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      admissionNo: selectedStudent.admissionNumber || `ADM-${selectedStudent.id}`,
      className: selectedStudent.className || 'Class 10',
      section: selectedStudent.section || 'A',
      amount,
      reason,
      approvedBy: 'Pending Admin Review',
      refundMode,
      refundDate: new Date().toISOString().split('T')[0],
      remarks,
      status: 'Pending'
    });

    addToast('success', 'Refund Requested', `Created refund request of ${formatCurrency(amount)} for ${selectedStudent.firstName} ${selectedStudent.lastName}`);
    setIsModalOpen(false);
    
    // Reset modal fields
    setSelectedStudentId('');
    setModalSearchStudent('');
    setModalClassFilter('All');
    setModalSectionFilter('All');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-sky-500" /> Refunds
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Manage fee refunds, scholarship adjustments, and security deposit returns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Request Refund
          </button>
          <ExportButton data={filteredRefunds} filename="refunds_report" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Total Requested</span>
            <RotateCcw className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalAmount)}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
            {metrics.totalCount} total refund requests
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(metrics.approvedAmount)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
            {metrics.approvedCount} approved & settled
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">
            {formatCurrency(metrics.pendingAmount)}
          </div>
          <div className="text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            {metrics.pendingCount} awaiting approval
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-700 dark:text-rose-300">
            {metrics.rejectedCount}
          </div>
          <div className="text-[11px] font-semibold text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            Declined requests
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search refund no, student name, receipt ref..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Reason Filter */}
          <div className="relative">
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="All">All Reasons</option>
              <option value="Scholarship Adjustment">Scholarship Adjustment</option>
              <option value="Duplicate Payment">Duplicate Payment</option>
              <option value="Admission Cancelled">Admission Cancelled</option>
              <option value="Transport Cancellation">Transport Cancellation</option>
              <option value="Hostel Cancellation">Hostel Cancellation</option>
              <option value="Concession Adjustment">Concession Adjustment</option>
              <option value="Others">Others</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="All">All Classes</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Refund No</th>
                <th className="py-3.5 px-4">Receipt Ref</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Approved By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approve / Reject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30 animate-spin-slow" />
                    No refund requests found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                      {r.refundNo}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-[11px]">
                        {r.receiptNo || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{r.studentName}</div>
                      {r.className && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {r.className} {r.section ? `• Sec ${r.section}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {r.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {r.refundMode}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {r.approvedBy || 'Pending Admin Review'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              updateRefundStatus(r.id, 'Approved', 'Dr. Eleanor Vance (Principal)');
                              addToast('success', 'Refund Approved', `Approved refund ${r.refundNo} for ${r.studentName}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 flex items-center gap-1 transition-all"
                            title="Approve Refund"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              updateRefundStatus(r.id, 'Rejected', 'Admin User');
                              addToast('info', 'Refund Rejected', `Rejected refund ${r.refundNo}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-100 flex items-center gap-1 transition-all"
                            title="Reject Refund"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          {r.status === 'Approved' ? 'Settled' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Create Refund Request Modal with Search & Class Filters */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-sky-500" /> Create Refund Request
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Filter students by class/section, search student profile, and link paid receipts
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Student Search & Filters Container */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" /> Filter & Select Student <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {modalFilteredStudents.length} matching students
                  </span>
                </div>

                {/* Class & Section Quick Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Class</label>
                    <div className="relative">
                      <select
                        value={modalClassFilter}
                        onChange={e => setModalClassFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="All">All Classes</option>
                        {availableClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Section</label>
                    <div className="relative">
                      <select
                        value={modalSectionFilter}
                        onChange={e => setModalSectionFilter(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                      >
                        <option value="All">All Sections</option>
                        {availableSections.map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Student Live Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student name, admission no, roll no..."
                    value={modalSearchStudent}
                    onChange={e => setModalSearchStudent(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {/* Student Dropdown Selector */}
                <div>
                  <select 
                    value={selectedStudentId} 
                    onChange={e => handleSelectStudent(e.target.value)} 
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-bold text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Choose Student ({modalFilteredStudents.length} available) --</option>
                    {modalFilteredStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.firstName} {st.lastName} ({st.className || 'Class'} - {st.section || 'A'}) {st.admissionNumber ? `[${st.admissionNumber}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Student Information Card */}
                {selectedStudent && (
                  <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                        {selectedStudent.firstName?.[0] || 'S'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </div>
                        <div className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                          {selectedStudent.className} - Sec {selectedStudent.section || 'A'} • Adm: {selectedStudent.admissionNumber || `ADM-${selectedStudent.id}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentId('')}
                      className="text-[11px] text-rose-500 font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Receipt Reference and Refund Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Receipt Reference */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Receipt Ref No <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {studentPaidReceipts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setReceiptSelectionMode(receiptSelectionMode === 'select' ? 'manual' : 'select')}
                        className="text-[10px] text-sky-600 font-bold hover:underline"
                      >
                        {receiptSelectionMode === 'select' ? 'Manual Ref' : 'From Receipts'}
                      </button>
                    )}
                  </div>

                  {receiptSelectionMode === 'select' && studentPaidReceipts.length > 0 ? (
                    <div className="relative">
                      <select
                        value={receiptNo}
                        onChange={e => {
                          setReceiptNo(e.target.value);
                          const chosenReceipt = studentPaidReceipts.find(p => p.receiptNo === e.target.value);
                          if (chosenReceipt && chosenReceipt.amount) {
                            setAmount(chosenReceipt.amount >= 1000 ? 1000 : chosenReceipt.amount);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs"
                      >
                        {studentPaidReceipts.map(p => (
                          <option key={p.id} value={p.receiptNo}>
                            {p.receiptNo} ({formatCurrency(p.amount)} - {p.paymentDate || 'Paid'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. REC-2026-0891"
                      value={receiptNo} 
                      onChange={e => setReceiptNo(e.target.value)} 
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-sky-500" 
                    />
                  )}
                </div>

                {/* Refund Amount */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Refund Amount (₹) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    value={amount} 
                    onChange={e => setAmount(Number(e.target.value))} 
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-xs text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              {/* Reason & Refund Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Reason <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={reason} 
                      onChange={e => setReason(e.target.value)} 
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs outline-none"
                    >
                      <option value="Scholarship Adjustment">Scholarship Adjustment</option>
                      <option value="Duplicate Payment">Duplicate / Excess Payment</option>
                      <option value="Admission Cancelled">Admission Cancelled (TC Issued)</option>
                      <option value="Transport Cancellation">Transport Cancellation</option>
                      <option value="Hostel Cancellation">Hostel Cancellation</option>
                      <option value="Concession Adjustment">Concession / Discount Adjustment</option>
                      <option value="Caution Deposit Return">Caution Deposit / Security Return</option>
                      <option value="Others">Others</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Refund Mode <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={refundMode} 
                      onChange={e => setRefundMode(e.target.value)} 
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI / Online">UPI / Online Gateway Refund</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Remarks / Notes
                </label>
                <input 
                  type="text" 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)} 
                  placeholder="e.g. Approved scholarship rebate for Term 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedStudentId}
                  className={`px-5 py-2 font-bold rounded-xl shadow-lg transition-all ${
                    selectedStudentId 
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/25' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

