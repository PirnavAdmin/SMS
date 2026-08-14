import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/currency';

interface PrintableFeeReceiptProps {
  payment: FeePayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableFeeReceipt: React.FC<PrintableFeeReceiptProps> = ({ payment, isOpen, onClose }) => {
  const { schoolProfile, students, getStudentFeeLedger, studentFeeLedgers, financeSettings } = useData();
  const { selectedAcademicYear } = useAuth();

  if (!isOpen || !payment) return null;

  const student = students.find(s => s.id === payment.studentId || s.admissionNo === payment.studentId || s.admissionNo === (payment as any).admissionNo);

  const studentName = student
    ? `${student.firstName} ${student.lastName || ''}`.trim()
    : payment.studentName;

  const className = student
    ? `${student.className}${student.section ? ` (Section ${student.section})` : ''}`
    : payment.className;

  const admissionNo = student ? student.admissionNo : ((payment as any).admissionNo || payment.studentId);
  const currentAY = selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

  // Compute student's ledgers and installments across all academic years
  const studentLedgers = student ? studentFeeLedgers.filter(l => l.studentId === student.id) : [];
  const years = Array.from(new Set(studentLedgers.map(l => l.academicYear)));

  const allStudentInstallments = student
    ? years.flatMap(yr => getStudentFeeLedger(student.id, yr)?.installments || [])
    : [];

  // Determine current remaining due amounts after payment
  let currentYearDueAfter = allStudentInstallments
    .filter(i => i.academicYear === currentAY)
    .reduce((sum, i) => sum + (i.dueAmount || 0), 0);

  let previousYearDueAfter = allStudentInstallments
    .filter(i => i.academicYear !== currentAY)
    .reduce((sum, i) => sum + (i.dueAmount || 0), 0);

  // If payment object has stored previousDue value, ensure fallback
  if (payment.previousDue && previousYearDueAfter < payment.previousDue) {
    const allocToPrev = (payment.paymentAllocation || [])
      .filter(a => a.academicYear !== currentAY)
      .reduce((sum, a) => sum + a.amount, 0);
    previousYearDueAfter = Math.max(0, payment.previousDue - allocToPrev);
  }

  // Calculate allocation amounts in this transaction
  const allocToCurrentYear = (payment.paymentAllocation || [])
    .filter(a => a.academicYear === currentAY)
    .reduce((sum, a) => sum + a.amount, 0);

  const allocToPreviousYear = (payment.paymentAllocation || [])
    .filter(a => a.academicYear !== currentAY)
    .reduce((sum, a) => sum + a.amount, 0);

  // Calculate "Before Payment" totals
  const currentYearPendingBefore = currentYearDueAfter + allocToCurrentYear;
  const previousYearPendingBefore = previousYearDueAfter + allocToPreviousYear;

  const totalOutstandingBefore = currentYearPendingBefore + previousYearPendingBefore;
  const amountPaidNow = payment.amountPaid;
  const totalPendingBalanceAfter = Math.max(0, totalOutstandingBefore - amountPaidNow);

  const receiptStatus = totalPendingBalanceAfter <= 0 ? 'PAID' : (payment.status || 'PARTIAL');
  const gross = payment.grossAmount || (payment.amountPaid + (payment.discount || 0) - (payment.fine || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fee Payment Receipt ({payment.receiptNo})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-content" className="p-8 space-y-6 text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1.5 pb-4 border-b border-slate-200 dark:border-slate-800">
            {schoolProfile.logoUrl && (
              <img
                src={schoolProfile.logoUrl}
                alt="School Logo"
                className="w-14 h-14 mx-auto object-contain mb-1"
              />
            )}
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{schoolProfile.name}</h1>
            <p className="text-[10px] text-slate-500">{schoolProfile.address} • Ph: {schoolProfile.phone}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold uppercase tracking-wider text-[10px]">
              OFFICIAL FEE PAYMENT RECEIPT
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-slate-400 font-medium">Receipt Number:</p>
              <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">{payment.receiptNo}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Date:</p>
              <p className="font-bold text-slate-900 dark:text-white">{payment.paymentDate}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Student Name:</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{studentName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Class & Section:</p>
              <p className="font-bold text-slate-900 dark:text-white">{className}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Mode:</p>
              <p className="font-bold text-slate-900 dark:text-white">{payment.paymentMode} {payment.transactionId ? `(${payment.transactionId})` : ''}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Status:</p>
              <span className={`font-extrabold uppercase ${receiptStatus === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {receiptStatus}
              </span>
            </div>
          </div>

          {/* Uniformly Aligned Receipt Table */}
          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700 table-fixed">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                <th className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 align-middle">
                  DESCRIPTION
                </th>
                <th className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right align-middle">
                  AMOUNT (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              {/* Itemized Payment Allocations */}
              {payment.paymentAllocation && payment.paymentAllocation.length > 0 ? (
                payment.paymentAllocation.map((alloc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 align-middle break-words">
                      <span className="text-slate-400 font-medium mr-1 font-mono">[{alloc.academicYear}]</span>
                      {alloc.feeHeadName} {alloc.termName ? `— ${alloc.termName}` : ''}
                    </td>
                    <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono text-slate-900 dark:text-white align-middle whitespace-nowrap">
                      {formatCurrency(alloc.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200 align-middle break-words">
                    Gross Amount (Fee Structure & Opted Services)
                  </td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono text-slate-900 dark:text-white align-middle whitespace-nowrap">
                    {formatCurrency(gross)}
                  </td>
                </tr>
              )}

              {/* Scholarships / Discounts */}
              {payment.scholarshipAmount && payment.scholarshipAmount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 align-middle break-words">
                    <p className="font-bold">Scholarship: {payment.scholarshipName}</p>
                    {payment.scholarshipDescription && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{payment.scholarshipDescription}</p>
                    )}
                  </td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">
                    -{formatCurrency(payment.scholarshipAmount)}
                  </td>
                </tr>
              ) : null}

              {payment.discountAmount && payment.discountAmount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 align-middle break-words">
                    <p className="font-bold">Discount: {payment.discountName}</p>
                    {payment.discountDescription && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{payment.discountDescription}</p>
                    )}
                  </td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">
                    -{formatCurrency(payment.discountAmount)}
                  </td>
                </tr>
              ) : null}

              {!payment.scholarshipAmount && !payment.discountAmount && payment.discount && payment.discount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-medium align-middle break-words">Scholarship / Merit Discount</td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">-{formatCurrency(payment.discount)}</td>
                </tr>
              ) : null}

              {payment.fine && payment.fine > 0 ? (
                <tr className="text-rose-500">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-medium align-middle break-words">Late Payment Fine</td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">+{formatCurrency(payment.fine)}</td>
                </tr>
              ) : null}

              {/* Previous Academic Year Due Row */}
              {previousYearPendingBefore > 0 && (
                <tr className="text-rose-600 dark:text-rose-400">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-bold align-middle break-words">
                    Previous Academic Year Due
                  </td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">
                    +{formatCurrency(previousYearPendingBefore)}
                  </td>
                </tr>
              )}

              {/* Current Academic Year Pending Row */}
              {currentYearPendingBefore > 0 && (
                <tr className="text-slate-700 dark:text-slate-300">
                  <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 font-bold align-middle break-words">
                    Current Academic Year Pending
                  </td>
                  <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold font-mono align-middle whitespace-nowrap">
                    {formatCurrency(currentYearPendingBefore)}
                  </td>
                </tr>
              )}

              {/* Total Outstanding Before Payment */}
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-extrabold border-t-2 border-slate-300 dark:border-slate-600">
                <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white align-middle break-words">
                  Total Outstanding Before Payment
                </td>
                <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-mono text-slate-900 dark:text-white align-middle whitespace-nowrap">
                  {formatCurrency(totalOutstandingBefore)}
                </td>
              </tr>

              {/* Total Net Amount Paid */}
              <tr className="bg-emerald-50/50 dark:bg-emerald-950/40 font-extrabold text-emerald-800 dark:text-emerald-300">
                <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 align-middle break-words">
                  Total Net Amount Paid
                </td>
                <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm align-middle whitespace-nowrap">
                  {formatCurrency(amountPaidNow)}
                </td>
              </tr>

              {/* Total Pending Balance */}
              <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white text-xs">
                <td className="w-[75%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 align-middle break-words">
                  Total Pending Balance
                </td>
                <td className="w-[25%] px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-right font-mono text-slate-900 dark:text-white align-middle whitespace-nowrap">
                  {formatCurrency(totalPendingBalanceAfter)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signature Footer */}
          <div className="pt-8 flex items-end justify-between text-slate-400">
            <div>
              <p className="text-[10px]">Computer Generated Receipt</p>
              <p className="text-[9px]">Valid without physical signature</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-32 h-0.5 bg-slate-300 dark:bg-slate-700 mb-1" />
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Accounts Officer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
