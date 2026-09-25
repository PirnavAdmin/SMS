import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { FeePayment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/currency';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { numberToWords } from '../../../utils/numberToWords';

interface PrintableFeeReceiptProps {
  payment: FeePayment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableFeeReceipt: React.FC<PrintableFeeReceiptProps> = ({ payment, isOpen, onClose }) => {
  const { schoolProfile, students, admissions, financeSettings } = useData();
  const { selectedAcademicYear } = useAuth();

  if (!isOpen || !payment) return null;

  // Resolve Student Info
  const student =
    students.find(s => s.id === payment.studentId || String(s.id) === String(payment.studentId) || s.admissionNo === payment.studentId || (s.admissionNo && payment.studentId && s.admissionNo.includes(payment.studentId)) || s.admissionNo === (payment as any).admissionNo) ||
    (admissions || []).find(a => a.id === payment.studentId || String(a.id) === String(payment.studentId) || a.applicationNo === payment.studentId || (a as any).registrationNo === payment.studentId || a.applicationNo === (payment as any).admissionNo || (a as any).registrationNo === (payment as any).admissionNo);

  const rawStudentName = student
    ? `${(student as any).firstName || (student as any).applicantName || ''} ${(student as any).lastName || ''}`.trim()
    : (payment.studentName && payment.studentName !== "Enrolled Student" ? payment.studentName : (payment.studentId ? `Student #${payment.studentId}` : "Enrolled Student"));

  const studentNameUpper = (rawStudentName || 'STUDENT').toUpperCase();

  const rawClass = student ? ((student as any).className || (student as any).appliedClass || "Nursery") : (payment.className && payment.className !== "—" ? payment.className : "Nursery");
  const rawSec = student ? (student.section || "A") : "A";
  const formattedClass = rawClass.toLowerCase().includes("nursery") || rawClass.toLowerCase().includes("lkg") || rawClass.toLowerCase().includes("ukg")
    ? rawClass
    : (rawClass.toLowerCase().startsWith("class") ? rawClass : `Class ${rawClass}`);
  const classNameDisplay = `${formattedClass} - ${rawSec}`;

  const admissionNo = student ? (student.admissionNo || (student as any).applicationNo || (student as any).registrationNo) : ((payment as any).admissionNo || (payment.studentId ? `REG-${payment.studentId}` : "140516"));
  const currentAY = payment.academicYear || selectedAcademicYear || financeSettings?.academicYear || "2026-2027";

  // Build fee table rows
  let feeRows: Array<{ slNo: number; description: string; due: number; con: number; paid: number }> = [];

  if (payment.paymentAllocation && payment.paymentAllocation.length > 0) {
    feeRows = payment.paymentAllocation.map((alloc, idx) => {
      const paid = alloc.amount || 0;
      const con = 0; // Concession allocated if applicable
      const due = paid + con;
      const desc = alloc.feeHeadName || alloc.termName || `Fee Item ${idx + 1}`;
      return { slNo: idx + 1, description: desc, due, con, paid };
    });
  } else {
    const paid = payment.amountPaid || payment.amount || 0;
    const con = payment.discount || payment.discountAmount || 0;
    const due = payment.grossAmount || (paid + con);
    const desc = payment.feeHeadName || payment.notes || "Tuition / Academic Fees";
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

  const schoolName = schoolProfile?.name || "Delhi Public School";
  const schoolAddress = schoolProfile?.address || "Site No.1, Sector-45, Urban Estate, Gurgaon, Haryana";
  const schoolPhone = schoolProfile?.phone ? ` • Ph: ${schoolProfile.phone}` : "";

  const receiptNo = payment.receiptNo || "43358";
  const paymentDate = payment.paymentDate || new Date().toLocaleDateString('en-GB');
  const payMode = payment.paymentMode || "Cash";
  const bankName = payment.bankName || "-";
  const transactionNumber = payment.chequeNo || payment.transactionId || "-";
  const counterNo = (payment as any).receivedBy || "DPS-RECEIPT";
  const remarksNote = payment.remarks || (payment as any).receiptNo || "356";

  const totalAmountPaid = payment.amountPaid || payment.amount || 0;
  const amountWords = numberToWords(totalAmountPaid);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(receiptNo)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt-modal, #printable-receipt-modal * {
            visibility: visible !important;
          }
          #printable-receipt-modal {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, ui-sans-serif, system-ui, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
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
        <div className="p-6 overflow-y-auto bg-white text-black font-sans text-xs leading-tight">
          <div id="printable-receipt-modal" className="w-full mx-auto space-y-0 text-black font-sans">
            {/* Main Receipt Outer Border Box */}
            <div className="border border-black bg-white p-3 space-y-2 font-sans">
              
              {/* Header: Logo + School Info */}
              <div className="flex items-center justify-center relative pb-2">
                {schoolProfile?.logoUrl && (
                  <img
                    src={resolveMediaUrl(schoolProfile.logoUrl)}
                    alt="School Logo"
                    className="w-14 h-14 object-contain absolute left-1 top-0"
                  />
                )}
                <div className="text-center px-12">
                  <h1 className="text-2xl font-bold tracking-tight text-black font-sans">{schoolName}</h1>
                  <p className="text-[11px] text-gray-800 font-sans mt-0.5">{schoolAddress}{schoolPhone}</p>
                </div>
              </div>

              {/* Banner 1: FEE RECEIPT */}
              <div className="bg-gray-200 text-black border-y border-black py-1 text-center font-bold text-sm tracking-wider uppercase font-sans">
                FEE RECEIPT
              </div>

              {/* Metadata Key-Value Table */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-1 text-[12px] font-sans">
                <div className="space-y-1">
                  <div className="flex"><span className="w-24 font-bold">Receipt No</span><span className="font-sans">: {receiptNo}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Adm No</span><span className="font-sans">: {admissionNo}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Name</span><span className="font-sans">: {studentNameUpper}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Installment</span><span className="font-sans">: {installmentLabel}</span></div>
                </div>
                <div className="space-y-1">
                  <div className="flex"><span className="w-24 font-bold">Date</span><span className="font-sans">: {paymentDate}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Session</span><span className="font-sans">: {currentAY}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Class</span><span className="font-sans">: {classNameDisplay}</span></div>
                  <div className="flex"><span className="w-24 font-bold">CounterNo</span><span className="font-sans">: {counterNo}</span></div>
                </div>
              </div>

              {/* Itemized Fee Table */}
              <table className="w-full border-collapse border border-black text-[11px] font-sans">
                <thead>
                  <tr className="bg-gray-200 border-b border-black font-bold">
                    <th className="border-r border-black px-2 py-1 text-center w-12">Sl.No</th>
                    <th className="border-r border-black px-2 py-1 text-left">Description</th>
                    <th className="border-r border-black px-2 py-1 text-right w-20">Due</th>
                    <th className="border-r border-black px-2 py-1 text-right w-16">Con</th>
                    <th className="px-2 py-1 text-right w-20">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((row) => (
                    <tr key={row.slNo} className="border-b border-gray-300">
                      <td className="border-r border-black px-2 py-1 text-center font-sans">{row.slNo}</td>
                      <td className="border-r border-black px-2 py-1 font-sans">{row.description}</td>
                      <td className="border-r border-black px-2 py-1 text-right font-sans">{row.due}</td>
                      <td className="border-r border-black px-2 py-1 text-right font-sans">{row.con}</td>
                      <td className="px-2 py-1 text-right font-sans font-medium">{row.paid}</td>
                    </tr>
                  ))}
                  {/* Empty buffer rows to maintain table height like reference */}
                  {feeRows.length < 5 && Array.from({ length: 5 - feeRows.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-gray-200">
                      <td className="border-r border-black px-2 py-1 text-center">&nbsp;</td>
                      <td className="border-r border-black px-2 py-1">&nbsp;</td>
                      <td className="border-r border-black px-2 py-1 text-right">&nbsp;</td>
                      <td className="border-r border-black px-2 py-1 text-right">&nbsp;</td>
                      <td className="px-2 py-1 text-right">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Banner 2: PAY MODE INFORMATION */}
              <div className="bg-gray-200 text-black border-y border-black py-1 text-center font-bold text-sm tracking-wider uppercase font-sans">
                PAY MODE INFORMATION
              </div>

              {/* Pay Mode Grid */}
              <div className="space-y-1 text-[12px] font-sans py-1">
                <div className="grid grid-cols-2 gap-x-6">
                  <div className="flex"><span className="w-24 font-bold">Pay Mode</span><span className="font-sans">{payMode}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Date</span><span className="font-sans">{paymentDate}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <div className="flex"><span className="w-24 font-bold">Bank</span><span className="font-sans">{bankName}</span></div>
                  <div className="flex"><span className="w-24 font-bold">Number</span><span className="font-sans">{transactionNumber}</span></div>
                </div>

                {/* Total Bar Row inside Pay Mode */}
                <div className="bg-gray-300 border-y border-black py-1 px-2 flex justify-between items-center font-bold text-xs mt-1 font-sans">
                  <span>Total</span>
                  <span className="font-sans">{totalAmountPaid}</span>
                </div>
              </div>

              {/* Total & Amount In Words Section */}
              <div className="border-t border-black pt-2 space-y-1 font-sans text-[12px]">
                <div className="flex justify-between items-center font-bold text-sm px-1">
                  <span>Total :</span>
                  <span className="font-sans">{totalAmountPaid}</span>
                </div>
                <div className="border-t border-black pt-1 px-1 font-semibold text-[11px] leading-snug font-sans">
                  Total in Words: {amountWords}
                </div>
              </div>

              {/* Receipt Footer with QR Code & Computer Generated Note */}
              <div className="border-t border-black pt-2 flex items-center justify-between text-[10px] font-sans">
                <div className="flex items-center gap-3">
                  <img
                    src={qrCodeUrl}
                    alt="Receipt QR Code"
                    className="w-16 h-16 object-contain border border-gray-300"
                  />
                  <div>
                    <p className="font-bold text-xs font-sans">Note :{remarksNote}</p>
                  </div>
                </div>
                <div className="text-right font-bold text-gray-800 max-w-[260px] font-sans">
                  This is a computer generated Receipt. Does not require signature.
                </div>
              </div>

            </div>

            {/* Sub-Footer Parent Copy Label */}
            <div className="text-center pt-2 font-bold text-gray-500 uppercase tracking-widest text-xs font-sans">
              PARENT COPY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
