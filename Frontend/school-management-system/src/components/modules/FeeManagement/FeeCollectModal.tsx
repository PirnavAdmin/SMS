import React, { useState } from 'react';
import { X, IndianRupee, Receipt } from 'lucide-react';
import { Student, FeePayment } from '../../../types';
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
  const { addFeePayment } = useData();
  const { addToast } = useToast();

  const [amountPaid, setAmountPaid] = useState<number>(student ? student.dueFee || 1500 : 1500);
  const [discount, setDiscount] = useState<number>(0);
  const [fine, setFine] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('Online');
  const [transactionId, setTransactionId] = useState('TXN-' + Math.floor(100000 + Math.random() * 900000));
  const [remarks, setRemarks] = useState('Term Fee Installment');

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
      paymentMode,
      transactionId: paymentMode === 'Online' ? transactionId : undefined,
      paymentDate: new Date().toISOString().split('T')[0],
      status: netPayment >= student.dueFee ? 'Paid' : 'Partial',
      remarks
    });

    addToast('success', 'Fee Collected', `Issued receipt ${payment.receiptNo} for ${formatCurrency(netPayment)}`);
    onReceiptGenerated(payment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
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
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">{student.firstName} {student.lastName}</p>
            <p className="text-slate-500">Class: {student.className}-{student.section} • Current Outstanding Due: <span className="font-bold text-rose-500">{formatCurrency(student.dueFee)}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Base Amount (₹) *</label>
              <input
                type="number"
                required
                value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
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
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Late Fine (₹)</label>
              <input
                type="number"
                value={fine}
                onChange={e => setFine(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 font-bold"
              />
            </div>
          </div>

          {paymentMode === 'Online' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref / UTR No</label>
              <input
                type="text"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Note</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Issue Receipt ({formatCurrency(amountPaid - discount + fine)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
