// @ts-nocheck
import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { resolvePayslipData, formatNum, printPayslip, downloadPayslipPdf } from '../../../utils/payslipTemplate';
import { useData } from '../../../context/DataContext';

interface PayslipModalProps {
  payslip: any;
  staffMember?: any;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ payslip, staffMember, onClose }) => {
  const { schoolProfile, staff } = useData();

  if (!payslip) return null;

  // Find linked staff if not explicitly provided
  const resolvedStaff = staffMember || (staff || []).find(
    s => s.id === payslip.employeeId || s.empId === payslip.empId || s.id === (payslip as any).staffId
  );

  const d = resolvePayslipData(payslip, resolvedStaff, schoolProfile);

  const maxRows = Math.max(d.earnings.length, d.deductions.length, 5);

  const handlePrint = () => {
    printPayslip(payslip, resolvedStaff, schoolProfile);
  };

  const handleDownload = () => {
    downloadPayslipPdf(payslip, resolvedStaff, schoolProfile);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Salary Payslip Preview
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              {d.monthYearTitle.replace('PAY SLIP FOR THE MONTH OF ', '')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Payslip Paper View */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div className="w-full max-w-[840px] bg-white text-slate-900 shadow-sm border border-slate-500 font-sans text-xs">
            
            {/* Header Section */}
            <div className="p-3 sm:p-4 border-b border-slate-400 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-44 flex items-center justify-center sm:justify-start">
                <img
                  src={d.logoUrl}
                  alt="Company Logo"
                  className="max-h-12 max-w-[150px] object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <div style="font-weight:900; font-size:20px; color:#0d9488; letter-spacing:0.8px; line-height:1.1;">
                          PIRNAV
                          <div style="font-size:8.5px; color:#64748b; font-weight:600;">Software Solutions Pvt. Ltd.</div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>

              <div className="flex-1 text-center">
                <h1 className="text-[#00838f] text-sm sm:text-base font-black tracking-wide uppercase">
                  {d.companyName}
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-800 mt-0.5">
                  {d.companyAddress}
                </p>
                <h2 className="text-xs sm:text-sm font-black text-black mt-2 tracking-wide uppercase">
                  {d.monthYearTitle}
                </h2>
              </div>

              <div className="hidden sm:block w-12"></div>
            </div>

            {/* Employee Name Full-Width Bar */}
            <div className="px-3 py-1.5 border-b border-slate-400 text-xs sm:text-[13px] bg-white font-medium">
              <span className="font-black text-slate-900">Employee Name: </span>
              <span className="font-bold text-slate-900 uppercase">{d.employeeName}</span>
            </div>

            {/* Employee Details Grid (4 Columns, 5 Rows - Removed: PF A/C Number, Work location, Gender, Department) */}
            <table className="w-full border-collapse border-b border-slate-400 text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="w-[22%] px-2.5 py-1 text-slate-700">Employee Code</td>
                  <td className="w-[28%] px-2.5 py-1 font-semibold text-slate-900 border-r border-slate-400">{d.employeeCode}</td>
                  <td className="w-[22%] px-2.5 py-1 text-slate-700">Bank A/C Number</td>
                  <td className="w-[28%] px-2.5 py-1 font-semibold text-slate-900">{d.bankAccountNumber}</td>
                </tr>
                <tr>
                  <td className="px-2.5 py-1 text-slate-700">Designation</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900 border-r border-slate-400">{d.designation}</td>
                  <td className="px-2.5 py-1 text-slate-700">Bank Name</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900">{d.bankName}</td>
                </tr>
                <tr>
                  <td className="px-2.5 py-1 text-slate-700">Date of Joining</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900 border-r border-slate-400">{d.dateOfJoining}</td>
                  <td className="px-2.5 py-1 text-slate-700">Total Working Days</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900">{d.totalWorkingDays}</td>
                </tr>
                <tr>
                  <td className="px-2.5 py-1 text-slate-700">PAN Card</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900 border-r border-slate-400">{d.panCard}</td>
                  <td className="px-2.5 py-1 text-slate-700">LOP Days</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900">{d.lopDays}</td>
                </tr>
                <tr>
                  <td className="px-2.5 py-1 text-slate-700">UAN Number</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900 border-r border-slate-400">{d.uanNumber}</td>
                  <td className="px-2.5 py-1 text-slate-700">Paid Days</td>
                  <td className="px-2.5 py-1 font-semibold text-slate-900">{d.paidDays}</td>
                </tr>
              </tbody>
            </table>

            {/* Earnings and Deductions Side-by-Side Table */}
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-400 font-black text-slate-900">
                  <th className="w-[32%] py-1.5 px-2.5 text-center">EARNINGS</th>
                  <th className="w-[18%] py-1.5 px-2.5 text-center border-r border-slate-400">AMOUNT</th>
                  <th className="w-[32%] py-1.5 px-2.5 text-center">DEDUCTIONS</th>
                  <th className="w-[18%] py-1.5 px-2.5 text-center">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y-0 text-slate-800">
                {Array.from({ length: maxRows }).map((_, i) => {
                  const earn = d.earnings[i];
                  const ded = d.deductions[i];
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-2.5 py-1 text-slate-900 font-normal">{earn ? earn.name : ''}</td>
                      <td className="px-2.5 py-1 text-right font-medium text-slate-900 border-r border-slate-400 tabular-nums">
                        {earn ? formatNum(earn.amount) : ''}
                      </td>
                      <td className="px-2.5 py-1 text-slate-900 font-normal">{ded ? ded.name : ''}</td>
                      <td className="px-2.5 py-1 text-right font-medium text-slate-900 tabular-nums">
                        {ded ? formatNum(ded.amount) : ''}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="border-t border-b border-slate-400 font-black text-slate-900 bg-white">
                  <td className="px-2.5 py-1.5 font-black">TOTAL EARNINGS</td>
                  <td className="px-2.5 py-1.5 text-right font-black border-r border-slate-400 tabular-nums">
                    {formatNum(d.totalEarnings)}
                  </td>
                  <td className="px-2.5 py-1.5 font-black">TOTAL DEDUCTIONS</td>
                  <td className="px-2.5 py-1.5 text-right font-black tabular-nums">
                    {formatNum(d.totalDeductions)}
                  </td>
                </tr>

                {/* Net Salary Row */}
                <tr className="border-b border-slate-400 font-black text-slate-900 bg-white">
                  <td className="px-2.5 py-1.5 font-black">NET SALARY</td>
                  <td className="border-r border-slate-400"></td>
                  <td></td>
                  <td className="px-2.5 py-1.5 text-right font-black tabular-nums">
                    {formatNum(d.netSalary)}
                  </td>
                </tr>

                {/* In Words Row */}
                <tr className="border-b border-slate-400 font-medium text-slate-900 bg-white">
                  <td className="px-2.5 py-1.5 font-black align-top">IN WORDS</td>
                  <td colSpan={3} className="px-2.5 py-1.5 font-medium text-slate-800">
                    {d.inWords}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Disclaimer */}
            <div className="py-2 text-center text-[10.5px] text-slate-600 bg-white">
              *This is a system generated payslip and does not require signature.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default PayslipModal;
