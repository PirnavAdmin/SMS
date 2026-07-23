import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { IndianRupee, Search, Receipt, CheckCircle, AlertCircle, Calculator, History, ArrowRight } from 'lucide-react';
import { Student, FeePayment, StudentFeeLedger } from '../../../types';
import { useData, StudentCalculationResult } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';

interface FeeCollectionViewProps {
  onPrintReceipt: (payment: FeePayment) => void;
}

export const FeeCollectionView: React.FC<FeeCollectionViewProps> = ({ onPrintReceipt }) => {
  const { 
    students, 
    calculateStudentPayableFee, 
    addFeePayment, 
    financeSettings, 
    getStudentFeeLedger,
    scholarships,
    discounts,
    applyScholarshipToStudent,
    removeScholarshipFromStudent,
    applyDiscountToStudent,
    removeDiscountFromStudent
  } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [calcResult, setCalcResult] = useState<StudentCalculationResult | null>(null);

  const [tempScholarshipId, setTempScholarshipId] = useState('');
  const [tempDiscountId, setTempDiscountId] = useState('');

  const [amountPaying, setAmountPaying] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('Online');
  const [transactionId, setTransactionId] = useState('TXN-' + Math.floor(100000 + Math.random() * 900000));
  const [remarks, setRemarks] = useState('Quarterly Fee Payment');

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateCalculation = (
    studentId: string, 
    freshCalcResult = calculateStudentPayableFee(studentId),
    ledgerOverride?: StudentFeeLedger
  ) => {
    let calc = freshCalcResult;
    const ledger = ledgerOverride || getStudentFeeLedger(studentId);
    if (ledger && calc) {
      const gross = ledger.grossAmount || ledger.totalOriginalAmount;
      const scholarshipAmt = ledger.scholarshipAmount || 0;
      const discountAmt = ledger.discountAmount || 0;
      const prevDue = ledger.previousDue || 0;
      const fineAmt = calc.fineAmount || 0;
      const totalPayable = Math.max(0, gross - scholarshipAmt - discountAmt + fineAmt + prevDue);
      const dueBalance = Math.max(0, totalPayable - ledger.paidAmount);

      calc = {
        ...calc,
        scholarshipId: ledger.scholarshipId,
        scholarshipName: ledger.scholarshipName,
        scholarshipDescription: ledger.scholarshipDescription,
        scholarshipDeduction: scholarshipAmt,
        discountId: ledger.discountId,
        discountName: ledger.discountName,
        discountDescription: ledger.discountDescription,
        discountDeduction: discountAmt,
        totalPayable,
        dueBalance
      };
    }
    setCalcResult(calc);
    if (calc) {
      const items = ledger ? ledger.feeItems : [];
      const activeItems = items.filter((fh: any) => fh.isApplicable);
      const gross = activeItems.reduce((sum: number, item: any) => sum + item.originalAmount, 0);
      const netPayable = Math.max(0, gross - calc.scholarshipDeduction - calc.discountDeduction + calc.fineAmount + calc.previousDue);
      const remaining = Math.max(0, netPayable - calc.paidAmount);
      setAmountPaying(remaining);
    }
  };

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setTempScholarshipId('');
    setTempDiscountId('');
    updateCalculation(st.id);
  };

  const handleApplyScholarship = (scholarshipId: string) => {
    if (!selectedStudent || !calcResult) return;
    try {
      const updatedLedger = applyScholarshipToStudent(selectedStudent.id, scholarshipId);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempScholarshipId('');
      addToast('success', 'Scholarship Applied', 'Successfully applied scholarship.');
    } catch (err: any) {
      addToast('warning', 'Already Applied', err.message || 'Scholarship has already been applied.');
    }
  };

  const handleRemoveScholarship = () => {
    if (!selectedStudent) return;
    try {
      const updatedLedger = removeScholarshipFromStudent(selectedStudent.id);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempScholarshipId('');
      addToast('info', 'Scholarship Removed', 'Removed scholarship.');
    } catch (err: any) {
      addToast('warning', 'Error', err.message || 'Failed to remove scholarship.');
    }
  };

  const handleApplyDiscount = (discountId: string) => {
    if (!selectedStudent || !calcResult) return;
    try {
      const updatedLedger = applyDiscountToStudent(selectedStudent.id, discountId);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempDiscountId('');
      addToast('success', 'Discount Applied', 'Successfully applied discount.');
    } catch (err: any) {
      addToast('warning', 'Already Applied', err.message || 'Discount has already been applied.');
    }
  };

  const handleRemoveDiscount = () => {
    if (!selectedStudent) return;
    try {
      const updatedLedger = removeDiscountFromStudent(selectedStudent.id);
      updateCalculation(selectedStudent.id, undefined, updatedLedger);
      setTempDiscountId('');
      addToast('info', 'Discount Removed', 'Removed discount.');
    } catch (err: any) {
      addToast('warning', 'Error', err.message || 'Failed to remove discount.');
    }
  };

  const handleSubmitPayment = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedStudent || !calcResult) return;

    if (amountPaying <= 0) {
      addToast('warning', 'Invalid Amount', 'Paid amount must be greater than zero.');
      return;
    }

    const ledger = getStudentFeeLedger(selectedStudent.id);
    const items = ledger ? ledger.feeItems : [];
    const activeItems = items.filter(fh => fh.isApplicable);
    const gross = activeItems.reduce((sum, item) => sum + item.originalAmount, 0);
    const netPayable = Math.max(0, gross - calcResult.scholarshipDeduction - calcResult.discountDeduction + calcResult.fineAmount + calcResult.previousDue);
    const remainingDue = Math.max(0, netPayable - calcResult.paidAmount);

    const payment = addFeePayment({
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      className: `${selectedStudent.className}-${selectedStudent.section}`,
      amountPaid: amountPaying,
      discount: calcResult.scholarshipDeduction + calcResult.discountDeduction,
      fine: calcResult.fineAmount,
      paymentMode,
      transactionId: paymentMode !== 'Cash' ? transactionId : undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      status: amountPaying >= remainingDue ? 'Paid' : 'Partial',
      remarks,
      scholarshipId: calcResult.scholarshipId,
      scholarshipName: calcResult.scholarshipName,
      scholarshipDescription: calcResult.scholarshipDescription,
      scholarshipAmount: calcResult.scholarshipDeduction,
      discountId: calcResult.discountId,
      discountName: calcResult.discountName,
      discountDescription: calcResult.discountDescription,
      discountAmount: calcResult.discountDeduction,
      grossAmount: gross,
      previousDue: calcResult.previousDue
    });

    addToast('success', 'Payment Processed', `Issued receipt ${payment.receiptNo} for ${formatCurrency(amountPaying)}`);
    onPrintReceipt(payment);

    // Refresh calculation engine
    const freshResult = calculateStudentPayableFee(selectedStudent.id);
    updateCalculation(selectedStudent.id, freshResult);
  };
  const ledger = selectedStudent ? getStudentFeeLedger(selectedStudent.id) : null;
  const items = ledger ? ledger.feeItems : [];
  const activeItems = items.filter(fh => fh.isApplicable);
  const grossAmount = activeItems.reduce((sum, item) => sum + item.originalAmount, 0);
  const netPayable = calcResult ? Math.max(0, grossAmount - calcResult.scholarshipDeduction - calcResult.discountDeduction + calcResult.fineAmount + calcResult.previousDue) : 0;
  const remainingDue = calcResult ? Math.max(0, netPayable - calcResult.paidAmount) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-emerald-500" /> Dynamic Fee Collection Counter
        </h2>
        <p className="text-xs text-slate-500">Zero manual fee entry — automatic computation of Base Fee, Transport, Hostel, Scholarships, Concessions & Late Fines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Selector */}
        <div className="glass-card p-5 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-500" /> Select Student
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search student or adm no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredStudents.map(st => {
              const isSelected = selectedStudent?.id === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => handleSelectStudent(st)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <img src={st.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{st.firstName} {st.lastName}</p>
                    <p className="text-[10px] text-slate-500">{st.className}-{st.section} • Adm: {st.admissionNo}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Dynamic Calculation Breakdown & Payment Terminal */}
        <div className="lg:col-span-2 space-y-4">
          {calcResult ? (
            <div className="space-y-4">
                {/* Formula Summary Banner */}
                <div className="glass-card p-5 rounded-3xl space-y-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-3">
                      <img src={calcResult.student.avatar} alt="" className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-400" />
                      <div>
                        <h3 className="font-extrabold text-base">{calcResult.student.firstName} {calcResult.student.lastName}</h3>
                        <p className="text-xs text-slate-300">{calcResult.student.className}-{calcResult.student.section} • Adm: {calcResult.student.admissionNo} • Branch: {calcResult.student.branch}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-sky-400">Net Due Balance</p>
                      <h4 className="text-2xl font-black text-emerald-400">{formatCurrency(remainingDue)}</h4>
                    </div>
                  </div>

                {/* Calculation Formula Line Items */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Base Structure Fee</p>
                    <p className="font-bold text-white mt-0.5">{formatCurrency(calcResult.baseFee)}</p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Transport Fee</p>
                    <p className="font-bold text-sky-400 mt-0.5">+{formatCurrency(calcResult.transportFee)}</p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Hostel Fee</p>
                    <p className="font-bold text-sky-400 mt-0.5">+{formatCurrency(calcResult.hostelFee)}</p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Scholarships & Concessions</p>
                    <p className="font-bold text-emerald-400 mt-0.5">-{formatCurrency(calcResult.scholarshipDeduction + calcResult.discountDeduction)}</p>
                  </div>
                </div>
              </div>

              {/* Permanent Fee Ledger Line Item Breakdown */}
              <div className="glass-card p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Student Permanent Fee Ledger</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-extrabold text-[10px]">
                    {calcResult.student.studentType || 'Day Scholar'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Applied Fee Heads */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Applied Fee Heads</p>
                    {(() => {
                      const ledger = getStudentFeeLedger(calcResult.student.id);
                      const items = ledger ? ledger.feeItems : [];
                      const activeItems = items.filter(fh => fh.isApplicable);
                      if (activeItems.length === 0) {
                        return <p className="text-[11px] text-slate-400 italic">No active fee heads assigned.</p>;
                      }
                      return activeItems.map((fh, idx) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            {fh.headName}
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {formatCurrency(fh.originalAmount)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800" />

                  {/* Scholarship Section */}
                  <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                    {calcResult.scholarshipDeduction > 0 ? (
                      // Applied Status Card
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scholarship</p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[9px]">
                            ✓ Scholarship Applied
                          </span>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3.5 rounded-xl space-y-2">
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">{calcResult.scholarshipName}</p>
                            {calcResult.scholarshipDescription && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{calcResult.scholarshipDescription}</p>
                            )}
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                            <span>Applied Amount:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">-{formatCurrency(calcResult.scholarshipDeduction)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span>Remaining Payable:</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(netPayable)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveScholarship}
                          className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Remove Scholarship
                        </button>
                      </div>
                    ) : (
                      // Selection Controls
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scholarship</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={tempScholarshipId}
                            onChange={e => setTempScholarshipId(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="">Select Scholarship...</option>
                            {scholarships.filter(s => s.status === 'Active').map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.discountType === 'Percentage' ? `${s.percentage}%` : `${formatCurrency(s.fixedAmount || 0)}`})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempScholarshipId) {
                                addToast('warning', 'Selection Required', 'Please select a scholarship from the list.');
                                return;
                              }
                              handleApplyScholarship(tempScholarshipId);
                            }}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                          >
                            Apply Scholarship
                          </button>
                        </div>
                        <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl text-slate-400 font-bold text-[10px] text-center">
                          Scholarship: Not Applicable
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discount Section */}
                  <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                    {calcResult.discountDeduction > 0 ? (
                      // Applied Status Card
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discount</p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[9px]">
                            ✓ Discount Applied
                          </span>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3.5 rounded-xl space-y-2">
                          <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">{calcResult.discountName}</p>
                            {calcResult.discountDescription && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{calcResult.discountDescription}</p>
                            )}
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                            <span>Applied Amount:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">-{formatCurrency(calcResult.discountDeduction)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            <span>Remaining Payable:</span>
                            <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(netPayable)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Remove Discount
                        </button>
                      </div>
                    ) : (
                      // Selection Controls
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Discount</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={tempDiscountId}
                            onChange={e => setTempDiscountId(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="">Select Discount...</option>
                            {discounts.filter(d => d.status === 'Active').map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.mode === 'Percentage' ? `${d.value}%` : `${formatCurrency(d.value)}`})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!tempDiscountId) {
                                addToast('warning', 'Selection Required', 'Please select a discount from the list.');
                                return;
                              }
                              handleApplyDiscount(tempDiscountId);
                            }}
                            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm transition-all whitespace-nowrap"
                          >
                            Apply Discount
                          </button>
                        </div>
                        <div className="p-2.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl text-slate-400 font-bold text-[10px] text-center">
                          Discount: Not Applicable
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-200 dark:border-slate-700 border-dashed" />

                  {/* Calculations breakdown list */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                    <div className="flex justify-between font-bold text-slate-600 dark:text-slate-400">
                      <span>Gross Amount:</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(grossAmount)}</span>
                    </div>
                    {calcResult.scholarshipDeduction > 0 && (
                      <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Scholarship:</span>
                        <span>-{formatCurrency(calcResult.scholarshipDeduction)}</span>
                      </div>
                    )}
                    {calcResult.discountDeduction > 0 && (
                      <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Discount:</span>
                        <span>-{formatCurrency(calcResult.discountDeduction)}</span>
                      </div>
                    )}
                    {calcResult.fineAmount > 0 && (
                      <div className="flex justify-between font-bold text-rose-500">
                        <span>Late Payment Fine ({calcResult.fineDetails?.daysOverdue} days overdue):</span>
                        <span>+{formatCurrency(calcResult.fineAmount)}</span>
                      </div>
                    )}
                    {calcResult.previousDue > 0 && (
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>Previous Unpaid Outstanding Due:</span>
                        <span>+{formatCurrency(calcResult.previousDue)}</span>
                      </div>
                    )}
                    {calcResult.paidAmount > 0 && (
                      <div className="flex justify-between font-bold text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5">
                        <span>Total Paid Till Date:</span>
                        <span>{formatCurrency(calcResult.paidAmount)}</span>
                      </div>
                    )}
                  </div>

                  <hr className="border-slate-200 dark:border-slate-700 border-dashed" />

                  {/* Total Net Payable Row */}
                  <div className="flex justify-between items-center py-1 font-black text-slate-900 dark:text-white text-sm">
                    <span className="uppercase tracking-wider">Total Payable</span>
                    <span className="text-base text-indigo-600 dark:text-indigo-400">{formatCurrency(netPayable)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Processing Form */}
              <div className="glass-card p-5 rounded-3xl space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-500" /> Collect Payment Terminal
                </h4>

                <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount to Collect (₹) *</label>
                      <input
                        type="number"
                        required
                        value={amountPaying}
                        onChange={e => setAmountPaying(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-extrabold text-emerald-600 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={e => setPaymentMode(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Online">Online / UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {paymentMode !== 'Cash' && (
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / UTR No</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Remarks</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Receipt className="w-4 h-4" /> Issue Official Receipt & Record Payment
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-3xl text-center space-y-3">
              <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No Student Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Select a student from the list on the left to compute dynamic fees automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
