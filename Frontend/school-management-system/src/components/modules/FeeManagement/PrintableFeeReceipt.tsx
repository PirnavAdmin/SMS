import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/currency';
import { formatDateForDisplay } from '../../../utils/dateValidation';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { numberToWords } from '../../../utils/numberToWords';

interface PrintableFeeReceiptProps {
  payment: FeePayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableFeeReceipt: React.FC<PrintableFeeReceiptProps> = ({ payment, isOpen, onClose }) => {
  const { schoolProfile, students, admissions, financeSettings, studentFeeInstallments } = useData();
  const { selectedAcademicYear } = useAuth();

  if (!isOpen || !payment) return null;

  // Resolve Student Info
  const student =
    students.find(s => s.id === payment.studentId || String(s.id) === String(payment.studentId) || s.admissionNo === payment.studentId || (s.admissionNo && payment.studentId && s.admissionNo.includes(payment.studentId)) || s.admissionNo === (payment as any).admissionNo) ||
    (admissions || []).find(a => a.id === payment.studentId || String(a.id) === String(payment.studentId) || a.applicationNo === payment.studentId || (a as any).registrationNo === payment.studentId || a.applicationNo === (payment as any).admissionNo || (a as any).registrationNo === (payment as any).admissionNo);

  const rawStudentName = student
    ? `${(student as any).firstName || (student as any).applicantName || ''} ${(student as any).lastName || ''}`.trim()
    : (payment.studentName || payment.studentId || "");

  const studentNameUpper = (rawStudentName || "").toUpperCase();

  const rawClass = student ? ((student as any).className || (student as any).appliedClass || "") : (payment.className || "");
  const rawSec = student ? (student.section || "") : "";
  const classNameDisplay = rawSec ? `${rawClass} - ${rawSec}` : rawClass;

  const admissionNo = student ? (student.admissionNo || (student as any).applicationNo || (student as any).registrationNo) : ((payment as any).admissionNo || payment.studentId || "");
  const currentAY = payment.academicYear || selectedAcademicYear || financeSettings?.academicYear || "";

  // Extract key financial amounts
  const discountVal = payment.discount || payment.discountAmount || payment.scholarshipAmount || 0;
  const fineVal = payment.fine || (payment as any).fineAmount || 0;
  const totalAmountPaid = payment.amountPaid || payment.amount || 0;
  const grossFee = payment.grossAmount || (totalAmountPaid + discountVal - fineVal);
  const discountTitle = payment.discountName || payment.scholarshipName || (payment as any).concessionName || (discountVal > 0 ? "Concession / Discount" : "");

  // Build fee table rows
  let feeRows: Array<{ slNo: number; description: string; due: number; con: number; paid: number }> = [];

  if (payment.paymentAllocation && payment.paymentAllocation.length > 0) {
    const totalCount = payment.paymentAllocation.length;
    const itemCon = discountVal > 0 ? Math.round((discountVal / totalCount) * 100) / 100 : 0;
    
    feeRows = payment.paymentAllocation.map((alloc, idx) => {
      const paid = alloc.amount || 0;
      const con = idx === totalCount - 1
        ? Math.max(0, Math.round((discountVal - itemCon * (totalCount - 1)) * 100) / 100)
        : itemCon;
      const inst = alloc.installmentId ? (studentFeeInstallments || []).find(i => i.id === alloc.installmentId) : null;
      const due = inst?.amount || (alloc as any).dueAmount || (payment.grossAmount ? Math.round(payment.grossAmount / totalCount) : (paid + con));

      const rawHead = (alloc.feeHeadName || (alloc as any).headName || (alloc as any).title || (alloc as any).category || inst?.feeHeadName || (inst as any)?.headName || "").trim();
      const rawTerm = (alloc.termName || inst?.termName || "").trim();
      
      let desc = "";
      if (rawHead && rawHead !== "Fee" && !rawHead.toLowerCase().startsWith("fee item")) {
        desc = (rawTerm && rawTerm !== rawHead && rawTerm !== "Installment") ? `${rawHead} (${rawTerm})` : rawHead;
      } else if (rawTerm && rawTerm !== "Installment") {
        desc = `Tuition Fee (${rawTerm})`;
      } else {
        desc = payment.feeHeadName || inst?.feeHeadName || "Tuition Fee";
      }

      return { slNo: idx + 1, description: desc, due, con, paid };
    });
  } else {
    const paid = totalAmountPaid;
    const con = discountVal;
    const due = grossFee;
    const desc = payment.feeHeadName || payment.notes || "Tuition Fee";
    feeRows = [{ slNo: 1, description: desc, due, con, paid }];
  }

  // Determine Installment Label
  let installmentLabel = "ANNUAL";
  if (payment.paymentAllocation && payment.paymentAllocation.length > 0) {
    const terms = Array.from(new Set(payment.paymentAllocation.map(a => a.termName).filter(Boolean)));
    if (terms.length > 0) {
      installmentLabel = terms.join(', ').toUpperCase();
    }
  } else if (payment.notes && payment.notes.trim() !== '') {
    installmentLabel = payment.notes.toUpperCase();
  }

  const schoolName = schoolProfile?.name || "Pirnav Educational Institutions";
  const schoolAddress = schoolProfile?.address || "Sri Sadguru Nilayam, Capital ParkRd28, Capital Pk Rd, VVIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081";
  const schoolPhone = schoolProfile?.phone ? ` • Ph: ${schoolProfile.phone}` : "";

  const receiptNo = payment.receiptNo || payment.id || "";
  const paymentDate = formatDateForDisplay(payment.paymentDate, new Date().toLocaleDateString('en-GB'));
  const payMode = payment.paymentMode || "Cash";
  const bankName = payment.bankName || "-";
  const transactionNumber = payment.chequeNo || payment.transactionId || "-";
  const counterNo = (payment as any).receivedBy || schoolProfile?.name || "Counter";
  const remarksNote = payment.remarks || "";

  const amountWords = numberToWords(totalAmountPaid);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(receiptNo)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in printable-receipt-backdrop">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm !important;
          }
          html, body {
            height: 100% !important;
            min-height: 0 !important;
            max-height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-receipt-backdrop {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            filter: none !important;
            backdrop-filter: none !important;
            transform: none !important;
          }
          .printable-receipt-card {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          #printable-receipt-modal,
          #printable-receipt-modal * {
            visibility: visible !important;
          }
          #printable-receipt-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, ui-sans-serif, system-ui, sans-serif !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] printable-receipt-card">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 no-print">
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Printable Fee Receipt ({receiptNo})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition-all font-sans"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Card Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-white text-black font-sans text-xs leading-tight">
          <div id="printable-receipt-modal" className="w-full mx-auto space-y-0 text-black font-sans">
            {/* Main Receipt Outer Border Box */}
            <div className="border border-black bg-white p-3 space-y-1.5 font-sans">
              
              {/* Header: Logo + School Info */}
              <div className="flex items-center justify-center relative pb-1">
                {schoolProfile?.logoUrl && (
                  <img
                    src={resolveMediaUrl(schoolProfile.logoUrl)}
                    alt="School Logo"
                    className="w-12 h-12 object-contain absolute left-1 top-0"
                  />
                )}
                <div className="text-center px-10">
                  <h1 className="text-xl font-black tracking-tight text-black font-sans uppercase">{schoolName}</h1>
                  <p className="text-[10px] text-gray-800 font-sans mt-0.5 leading-snug">{schoolAddress}{schoolPhone}</p>
                </div>
              </div>

              {/* Banner 1: FEE RECEIPT */}
              <div className="bg-gray-200 text-black border-y border-black py-0.5 text-center font-black text-xs tracking-wider uppercase font-sans">
                FEE RECEIPT
              </div>

              {/* Metadata Key-Value Table */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 py-1 text-[11px] font-sans">
                <div className="space-y-0.5">
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Receipt No</span><span className="font-sans">: {receiptNo}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Adm No</span><span className="font-sans">: {admissionNo}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Name</span><span className="font-sans font-bold">: {studentNameUpper}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Installment</span><span className="font-sans font-bold text-blue-900">: {installmentLabel}</span></div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Date</span><span className="font-sans">: {paymentDate}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Session</span><span className="font-sans">: {currentAY}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Class</span><span className="font-sans">: {classNameDisplay}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">CounterNo</span><span className="font-sans">: {counterNo}</span></div>
                </div>
              </div>

              {/* Itemized Fee Table */}
              <table className="w-full border-collapse border border-black text-[11px] font-sans">
                <thead>
                  <tr className="bg-gray-200 border-b border-black font-bold text-[10px]">
                    <th className="border-r border-black px-2 py-0.5 text-center w-12">SL.NO</th>
                    <th className="border-r border-black px-2 py-0.5 text-left">DESCRIPTION</th>
                    <th className="border-r border-black px-2 py-0.5 text-right w-20">DUE</th>
                    <th className="border-r border-black px-2 py-0.5 text-right w-16">CON</th>
                    <th className="px-2 py-0.5 text-right w-20">PAID</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row) => (
                    <tr key={row.slNo} className="border-b border-gray-300">
                      <td className="border-r border-black px-2 py-1 text-center font-sans font-medium">{row.slNo}</td>
                      <td className="border-r border-black px-2 py-1 font-sans font-bold">{row.description}</td>
                      <td className="border-r border-black px-2 py-1 text-right font-sans font-medium">{row.due}</td>
                      <td className="border-r border-black px-2 py-1 text-right font-sans font-medium">{row.con}</td>
                      <td className="px-2 py-1 text-right font-sans font-bold">{row.paid}</td>
                    </tr>
                  ))}
                  {/* Subtle buffer row if only 1 item to maintain neat visual proportions */}
                  {feeRows.length === 1 && (
                    <tr className="border-b border-gray-200 h-5">
                      <td className="border-r border-black px-2 py-0.5 text-center">&nbsp;</td>
                      <td className="border-r border-black px-2 py-0.5">&nbsp;</td>
                      <td className="border-r border-black px-2 py-0.5 text-right">&nbsp;</td>
                      <td className="border-r border-black px-2 py-0.5 text-right">&nbsp;</td>
                      <td className="px-2 py-0.5 text-right">&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Banner 2: PAY MODE INFORMATION */}
              <div className="bg-gray-200 text-black border-y border-black py-0.5 text-center font-black text-xs tracking-wider uppercase font-sans">
                PAY MODE INFORMATION
              </div>

              {/* Pay Mode Grid */}
              <div className="space-y-0.5 text-[11px] font-sans py-0.5">
                <div className="grid grid-cols-2 gap-x-6">
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Pay Mode</span><span className="font-sans">: {payMode}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Date</span><span className="font-sans">: {paymentDate}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Bank</span><span className="font-sans">: {bankName}</span></div>
                  <div className="flex"><span className="w-24 font-bold text-gray-900">Number</span><span className="font-sans">: {transactionNumber}</span></div>
                </div>

                {/* Financial Summary Breakdown Row if concession/discount exists */}
                {discountVal > 0 && (
                  <div className="border-t border-dashed border-gray-400 mt-1 pt-0.5 space-y-0.5 text-[10px] font-sans bg-gray-50 p-1 rounded border border-gray-200">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Total Gross Fee Due:</span>
                      <span className="font-semibold">{formatCurrency(grossFee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span>Concession / Discount ({discountTitle}):</span>
                      <span>- {formatCurrency(discountVal)}</span>
                    </div>
                    {fineVal > 0 && (
                      <div className="flex justify-between items-center text-rose-700 font-semibold">
                        <span>Late Fee Fine:</span>
                        <span>+ {formatCurrency(fineVal)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total & Amount In Words Section */}
              <div className="border-t border-black pt-1 space-y-1 font-sans text-[11px]">
                <div className="bg-gray-200 border border-black py-0.5 px-2 flex justify-between items-center font-bold text-xs font-sans">
                  <span>Total Amount Paid</span>
                  <span className="font-sans font-black text-sm">{totalAmountPaid}</span>
                </div>
                <div className="px-1 font-semibold text-[11px] leading-tight font-sans">
                  Total in Words: {amountWords}
                </div>
              </div>

              {/* Receipt Footer with QR Code & Computer Generated Note */}
              <div className="border-t border-black pt-1.5 flex items-center justify-between text-[10px] font-sans">
                <div className="flex items-center gap-2.5">
                  <img
                    src={qrCodeUrl}
                    alt="Receipt QR Code"
                    className="w-11 h-11 object-contain border border-gray-300 shrink-0"
                  />
                  <div>
                    <p className="font-bold text-[10px] font-sans leading-tight">
                      Note: {discountVal > 0 ? (
                        remarksNote && remarksNote.includes("Concession Applied")
                          ? (remarksNote.includes(" - ") || remarksNote.includes("Discount:") ? remarksNote : `${remarksNote} (${discountTitle} - Discount: ${formatCurrency(discountVal)})`)
                          : `Concession Applied (${discountTitle} - Discount: ${formatCurrency(discountVal)})`
                      ) : (remarksNote || "Fee Collection Receipt")}
                    </p>
                    <p className="text-[9px] text-gray-500 font-sans mt-0.5">
                      Verified by Finance Office
                    </p>
                  </div>
                </div>
                <div className="text-right font-bold text-gray-700 max-w-[240px] font-sans text-[9px] leading-snug">
                  This is a computer generated Receipt. Does not require signature.
                </div>
              </div>

              {/* Sub-Footer Parent Copy Label inside the border */}
              <div className="border-t border-dashed border-gray-300 pt-1 text-center font-bold text-gray-500 uppercase tracking-widest text-[10px] font-sans">
                PARENT COPY
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
