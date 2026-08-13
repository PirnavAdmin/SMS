import React, { useState, useMemo, useEffect } from 'react';
import { X, IndianRupee, Receipt, AlertCircle, Calendar, CheckSquare, Square } from 'lucide-react';
import { Student, FeePayment, StudentFeeInstallment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/currency';

interface FeeCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onReceiptGenerated: (payment: FeePayment) => void;
}

export const FeeCollectModal: React.FC<FeeCollectModalProps> = ({
  isOpen,
  onClose,
  student,
  onReceiptGenerated
}) => {
  const {
    addFeePayment,
    studentFeeInstallments,
    studentFeeLedgers,
    financeSettings
  } = useData();
  const { addToast } = useToast();

  const activeAY = financeSettings?.academicYear || '2026-2027';

  // Selected Installment IDs
  const [selectedInstIds, setSelectedInstIds] = useState<string[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(1500);
  const [discount, setDiscount] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode'] | ''>('');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch and group unpaid fee obligations for this student
  const { currentYearInsts, previousYearGroups, totalPrevDue, totalCurrDue } = useMemo(() => {
    if (!student) {
      return { currentYearInsts: [], previousYearGroups: [], totalPrevDue: 0, totalCurrDue: 0 };
    }

    // 1. All unpaid installments from studentFeeInstallments
    let insts = studentFeeInstallments.filter(
      (i) => i.studentId === student.id && i.dueAmount > 0
    );

    // 2. Also check studentFeeLedgers
    const ledgers = studentFeeLedgers.filter(
      (l) => l.studentId === student.id && l.dueBalance > 0
    );

    // Merge installments from ledgers if missing
    ledgers.forEach((l) => {
      if (l.installments && l.installments.length > 0) {
        l.installments.forEach((li) => {
          if (li.dueAmount > 0 && !insts.some((existing) => existing.id === li.id)) {
            insts.push(li);
          }
        });
      }
    });

    // Fallback if ledger dueBalance > 0 but no installments exist
    if (insts.length === 0 && ledgers.length > 0) {
      ledgers.forEach((l) => {
        if (l.feeItems && l.feeItems.length > 0) {
          l.feeItems.forEach((item, idx) => {
            if (item.status !== 'Paid' && item.finalAmount > 0) {
              insts.push({
                id: `INST-COLLECT-${l.id}-${idx}`,
                studentId: student.id,
                studentName: `${student.firstName} ${student.lastName}`,
                admissionNo: student.admissionNo,
                academicYear: l.academicYear,
                className: l.className || student.className,
                feeHeadId: item.headId,
                feeHeadName: item.headName,
                termId: l.academicYear,
                termName: item.category || item.headName,
                dueDate: l.updatedAt || `${l.academicYear.slice(0, 4)}-12-31`,
                amount: item.originalAmount || item.finalAmount,
                originalAmount: item.originalAmount,
                paidAmount: item.status === 'Partial' ? Math.max(0, item.originalAmount - item.finalAmount) : 0,
                dueAmount: item.finalAmount > 0 ? item.finalAmount : l.dueBalance,
                status: item.finalAmount > 0 ? (l.paidAmount > 0 ? 'Partial' : 'Pending') : 'Paid',
                isApplicable: true,
                updatedAt: new Date().toISOString()
              });
            }
          });
        }
      });
    }

    const currentYearInsts = insts.filter((i) => i.academicYear === activeAY);
    const previousInsts = insts.filter((i) => i.academicYear < activeAY);

    // Group previous year insts by academicYear
    const prevMap = new Map<string, StudentFeeInstallment[]>();
    previousInsts.forEach((i) => {
      const ay = i.academicYear;
      if (!prevMap.has(ay)) prevMap.set(ay, []);
      prevMap.get(ay)!.push(i);
    });

    const previousYearGroups = Array.from(prevMap.keys())
      .sort((a, b) => b.localeCompare(a))
      .map((ay) => {
        const items = prevMap.get(ay) || [];
        const yearTotal = items.reduce((sum, item) => sum + item.dueAmount, 0);
        return {
          academicYear: ay,
          yearTotal,
          items
        };
      });

    const totalCurrDue = currentYearInsts.reduce((sum, i) => sum + i.dueAmount, 0);
    const totalPrevDue = previousInsts.reduce((sum, i) => sum + i.dueAmount, 0);

    return {
      currentYearInsts,
      previousYearGroups,
      totalPrevDue,
      totalCurrDue
    };
  }, [student, studentFeeInstallments, studentFeeLedgers, activeAY]);

  // Set default initial state when modal opens
  useEffect(() => {
    if (student) {
      // If student has previous dues, pre-select previous year installments by default
      const prevInstsList: string[] = [];
      previousYearGroups.forEach(g => {
        g.items.forEach(i => prevInstsList.push(i.id));
      });

      if (prevInstsList.length > 0) {
        setSelectedInstIds(prevInstsList);
        const sum = previousYearGroups.reduce((acc, g) => acc + g.yearTotal, 0);
        setAmountPaid(sum);
      } else {
        setSelectedInstIds([]);
        setAmountPaid(student.dueFee || 1500);
      }
    }
  }, [isOpen, student, previousYearGroups]);

  if (!isOpen || !student) return null;

  const toggleInstSelection = (instId: string, dueAmt: number) => {
    setSelectedInstIds((prev) => {
      let next: string[];
      if (prev.includes(instId)) {
        next = prev.filter((id) => id !== instId);
      } else {
        next = [...prev, instId];
      }

      // Calculate sum of newly selected installments
      const allInsts = [
        ...currentYearInsts,
        ...previousYearGroups.flatMap((g) => g.items)
      ];
      const newSum = allInsts
        .filter((i) => next.includes(i.id))
        .reduce((sum, i) => sum + i.dueAmount, 0);

      if (newSum > 0) {
        setAmountPaid(newSum);
      }

      return next;
    });
  };

  const handleSelectAllPrev = () => {
    const allPrevIds = previousYearGroups.flatMap((g) => g.items.map((i) => i.id));
    setSelectedInstIds(allPrevIds);
    setAmountPaid(totalPrevDue);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (amountPaid <= 0) {
      addToast('warning', 'Invalid Amount', 'Paid amount must be greater than zero.');
      return;
    }

    const netPayment = amountPaid - discount + fine;

    const payment = addFeePayment({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      className: `${student.className}-${student.section}`,
      amountPaid: netPayment,
      discount,
      fine,
      paymentMode: (paymentMode || 'Online') as FeePayment['paymentMode'],
      transactionId: paymentMode === 'Online' ? transactionId : undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      status: netPayment >= (student.dueFee || totalPrevDue + totalCurrDue) ? 'Paid' : 'Partial',
      selectedInstallmentIds: selectedInstIds.length > 0 ? selectedInstIds : undefined,
      remarks
    });

    addToast('success', 'Fee Collected', `Issued receipt ${payment.receiptNo} for ${formatCurrency(netPayment)}`);
    onReceiptGenerated(payment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Fee Collection Counter</h3>
              <p className="text-xs text-slate-500">Record payment & generate printable receipt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Student Header */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1.5 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <p className="font-black text-sm text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
              <span className="font-mono text-xs font-bold text-slate-500">{student.admissionNo}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Class: <strong className="text-slate-800 dark:text-slate-200">{student.className}-{student.section}</strong></span>
              <div className="flex items-center gap-3">
                {totalPrevDue > 0 && (
                  <span>Previous Dues: <strong className="text-rose-600 font-mono font-black">{formatCurrency(totalPrevDue)}</strong></span>
                )}
                <span>Current Outstanding: <strong className="text-rose-500 font-mono font-black">{formatCurrency(student.dueFee || totalCurrDue)}</strong></span>
              </div>
            </div>
          </div>

          {/* Section 1: Previous Academic Year Dues (If Any) */}
          {previousYearGroups.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80 dark:border-amber-800">
                <div className="flex items-center gap-1.5 font-black text-amber-900 dark:text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  PREVIOUS ACADEMIC YEAR DUES ({formatCurrency(totalPrevDue)})
                </div>
                <button
                  type="button"
                  onClick={handleSelectAllPrev}
                  className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-extrabold text-[10px] hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Select All Previous Dues
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {previousYearGroups.map((group) => (
                  <div key={group.academicYear} className="space-y-1">
                    <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span>Academic Year {group.academicYear}</span>
                      <span className="font-mono font-extrabold text-rose-600">{formatCurrency(group.yearTotal)}</span>
                    </div>

                    <div className="space-y-1 pl-1">
                      {group.items.map((inst) => {
                        const isSelected = selectedInstIds.includes(inst.id);
                        return (
                          <div
                            key={inst.id}
                            onClick={() => toggleInstSelection(inst.id, inst.dueAmount)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-100/90 dark:bg-amber-900/60 border-amber-400 dark:border-amber-700 shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-amber-200/60 dark:border-slate-700 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                  {inst.feeHeadName} ({inst.termName || inst.termId || "Obligation"})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Due Date: {inst.dueDate || 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-xs block">
                                {formatCurrency(inst.dueAmount)}
                              </span>
                              {inst.paidAmount > 0 && (
                                <span className="text-[10px] text-emerald-600 font-semibold block">
                                  Paid: {formatCurrency(inst.paidAmount)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Current Academic Year Fees */}
          {currentYearInsts.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-sky-200/80 dark:border-sky-800">
                <div className="flex items-center gap-1.5 font-black text-sky-900 dark:text-sky-200 text-xs">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  CURRENT ACADEMIC YEAR FEES ({activeAY})
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total: {formatCurrency(totalCurrDue)}
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {currentYearInsts.map((inst) => {
                  const isSelected = selectedInstIds.includes(inst.id);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => toggleInstSelection(inst.id, inst.dueAmount)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-100/90 dark:bg-sky-900/60 border-sky-400 dark:border-sky-700 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-sky-200/60 dark:border-slate-700 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                            {inst.feeHeadName} ({inst.termName || inst.termId || "Term"})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Due Date: {inst.dueDate || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sky-600 dark:text-sky-400 font-mono text-xs block">
                          {formatCurrency(inst.dueAmount)}
                        </span>
                        {inst.paidAmount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-semibold block">
                            Paid: {formatCurrency(inst.paidAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Form Fields */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Collection Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer text-xs"
              >
                <option value="">Select Mode</option>
                <option value="Online">Online / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Grant (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Late Fine (₹)</label>
              <input
                type="number"
                value={fine}
                onChange={(e) => setFine(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 font-bold"
              />
            </div>
          </div>

          {paymentMode === 'Online' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / UTR No</label>
              <input
                type="text"
                placeholder="Enter transaction reference or UTR number..."
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Remarks</label>
            <input
              type="text"
              placeholder="Enter payment remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" /> Issue Official Receipt & Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
