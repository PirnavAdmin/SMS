import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';

interface PrintableFeeReceiptProps {
  payment: FeePayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableFeeReceipt: React.FC<PrintableFeeReceiptProps> = ({ payment, isOpen, onClose }) => {
  const { schoolProfile } = useData();

  if (!isOpen || !payment) return null;

  const gross = payment.grossAmount || (payment.amountPaid + (payment.discount || 0) - (payment.fine || 0) - (payment.previousDue || 0));

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
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-brand-500 shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-content" className="p-8 space-y-6 text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
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
              <p className="font-bold text-slate-900 dark:text-white text-sm">{payment.studentName}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Class & Section:</p>
              <p className="font-bold text-slate-900 dark:text-white">{payment.className}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Payment Mode:</p>
              <p className="font-bold text-slate-900 dark:text-white">{payment.paymentMode} {payment.transactionId ? `(${payment.transactionId})` : ''}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Status:</p>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">{payment.status}</span>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                <th className="p-2.5 border border-slate-200 dark:border-slate-700">Description</th>
                <th className="p-2.5 border border-slate-200 dark:border-slate-700 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-medium">Gross Amount (Fee Structure & Opted Services)</td>
                <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">INR {gross.toLocaleString()}</td>
              </tr>
              {payment.scholarshipAmount && payment.scholarshipAmount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold">Scholarship: {payment.scholarshipName}</p>
                    {payment.scholarshipDescription && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{payment.scholarshipDescription}</p>
                    )}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">-INR {payment.scholarshipAmount.toLocaleString()}</td>
                </tr>
              ) : null}
              {payment.discountAmount && payment.discountAmount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700">
                    <p className="font-bold">Discount: {payment.discountName}</p>
                    {payment.discountDescription && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{payment.discountDescription}</p>
                    )}
                  </td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">-INR {payment.discountAmount.toLocaleString()}</td>
                </tr>
              ) : null}
              {!payment.scholarshipAmount && !payment.discountAmount && payment.discount && payment.discount > 0 ? (
                <tr className="text-emerald-600 dark:text-emerald-400">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-medium">Scholarship / Merit Discount</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">-INR {payment.discount.toLocaleString()}</td>
                </tr>
              ) : null}
              {payment.fine && payment.fine > 0 ? (
                <tr className="text-rose-500">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-medium">Late Payment Fine</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">+INR {payment.fine.toLocaleString()}</td>
                </tr>
              ) : null}
              {payment.previousDue && payment.previousDue > 0 ? (
                <tr className="text-rose-600">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-medium">Previous Outstanding Due</td>
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-right font-bold">+INR {payment.previousDue.toLocaleString()}</td>
                </tr>
              ) : null}
              <tr className="bg-slate-50 dark:bg-slate-800 font-extrabold text-sm">
                <td className="p-3 border border-slate-200 dark:border-slate-700">Total Net Amount Paid</td>
                <td className="p-3 border border-slate-200 dark:border-slate-700 text-right text-emerald-600 dark:text-emerald-400">INR {payment.amountPaid.toLocaleString()}</td>
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
