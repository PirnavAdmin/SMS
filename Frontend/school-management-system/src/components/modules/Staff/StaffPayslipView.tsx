import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileText, Printer, Search, HelpCircle } from 'lucide-react';
import { Payslip } from '../../../types';
import { useData } from '../../../context/DataContext';
import { resolveMediaUrl } from '../../../utils/mediaUtils';
import { numberToWords } from '../../../utils/numberToWords';

export const StaffPayslipView: React.FC = () => {
  const { payslips, schoolProfile, staff } = useData();

  const [query, setQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const filteredPayslips = payslips.filter(p => {
    const nameMatch = p.employeeName.toLowerCase().includes(query.toLowerCase()) || p.empId.toLowerCase().includes(query.toLowerCase());
    const monthMatch = selectedMonth === 'All' || p.month === selectedMonth;
    return nameMatch && monthMatch;
  });

  const handlePrint = (p: Payslip) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const matchedStaff = (staff || []).find(s => s.id === p.employeeId || s.empId === p.empId);
    const basicVal = Number(p.basicSalary) || 0;
    const hraVal = Number(p.hra) || 0;
    const daVal = Number(p.da) || 0;
    const grossVal = Number(p.grossSalary) || (basicVal + hraVal + daVal);
    const pfVal = Number(p.pfDeduction) || 0;
    const lopVal = Number(p.lopDeduction) || 0;
    const ptVal = Number(p.otherDeductions) || 0;
    const totalDeductionsVal = pfVal + lopVal + ptVal;
    const netSalaryVal = Number(p.netSalary) || Math.max(0, grossVal - totalDeductionsVal);

    const formatNum = (num: number) => isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const inWords = numberToWords(netSalaryVal);

    const earningsRows = [
      { name: 'Basic Salary', amount: basicVal },
      { name: 'House Rent Allowance (HRA)', amount: hraVal },
      { name: 'Dearness Allowance (DA)', amount: daVal },
      ...(Array.isArray(p.earnings) ? p.earnings.filter(e => !['basic', 'hra', 'da'].some(k => e.name.toLowerCase().includes(k))) : [])
    ].filter(e => e.amount > 0);

    const deductionsRows = [
      { name: 'Provident Fund (PF)', amount: pfVal },
      ...(ptVal > 0 ? [{ name: 'Professional Tax (PT)', amount: ptVal }] : []),
      ...(lopVal > 0 ? [{ name: 'Loss of Pay (LOP)', amount: lopVal }] : []),
      ...(Array.isArray(p.deductions) ? p.deductions.filter(d => !['pf', 'lop', 'pt'].some(k => d.name.toLowerCase().includes(k))) : [])
    ].filter(d => d.amount > 0);

    const maxRows = Math.max(earningsRows.length, deductionsRows.length, 1);
    const tableRowsHtml = Array.from({ length: maxRows }).map((_, i) => {
      const earn = earningsRows[i];
      const ded = deductionsRows[i];
      return `
        <tr>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${earn ? earn.name : ''}</td>
          <td style="padding: 5px 8px; border-right: 2px solid #94a3b8; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600;">${earn ? `₹${formatNum(earn.amount)}` : ''}</td>
          <td style="padding: 5px 8px; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${ded ? ded.name : ''}</td>
          <td style="padding: 5px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Consolas', monospace; font-weight: 600; color: ${ded ? '#b91c1c' : 'inherit'};">${ded ? `₹${formatNum(ded.amount)}` : ''}</td>
        </tr>
      `;
    }).join('');

    const activeSchoolName = schoolProfile?.name || schoolProfile?.schoolName || 'PIRNAV EDUCATIONAL INSTITUTIONS';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Payslip - ${p.month} - ${p.employeeName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .payslip-sheet {
                box-shadow: none !important;
                border: 1.5px solid #0f172a !important;
                max-height: 275mm !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                page-break-inside: avoid !important;
              }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #f8fafc;
              margin: 0;
              padding: 12px;
              font-size: 11px;
              line-height: 1.35;
            }
            .payslip-sheet {
              max-width: 210mm;
              margin: 0 auto;
              background: #ffffff;
              border: 1.5px solid #0f172a;
              padding: 20px 24px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .school-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .school-info {
              flex: 1;
              text-align: center;
              padding: 0 10px;
            }
            .school-name {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .school-sub {
              font-size: 10px;
              color: #475569;
              font-weight: 500;
              line-height: 1.3;
            }
            .logo-img {
              max-height: 52px;
              max-width: 100px;
              object-fit: contain;
            }
            .doc-title-bar {
              background: #0f172a;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 5px 12px;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.8px;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .emp-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              border: 1px solid #cbd5e1;
            }
            .emp-table td {
              padding: 4px 8px;
              font-size: 10px;
              border: 1px solid #e2e8f0;
            }
            .emp-table .lbl {
              background: #f8fafc;
              color: #475569;
              font-weight: 700;
              width: 18%;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.3px;
            }
            .emp-table .val {
              color: #0f172a;
              font-weight: 600;
              width: 32%;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              border: 1.5px solid #0f172a;
            }
            .salary-table th {
              padding: 5px 8px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #cbd5e1;
            }
            .salary-table th.main-hdr {
              background: #0f172a;
              color: #ffffff;
              font-size: 10.5px;
              text-align: left;
            }
            .salary-table th.sub-hdr {
              background: #f1f5f9;
              color: #334155;
            }
            .salary-table td {
              padding: 4.5px 8px;
              font-size: 10.5px;
              border: 1px solid #e2e8f0;
              color: #1e293b;
            }
            .salary-table td.amount {
              text-align: right;
              font-family: 'Consolas', 'Courier New', monospace;
              font-weight: 600;
            }
            .salary-table .divider-col {
              border-right: 2px solid #94a3b8 !important;
            }
            .salary-table .tot-row td {
              background: #f1f5f9;
              font-weight: 800;
              color: #0f172a;
              border-top: 1.5px solid #0f172a;
              border-bottom: 1.5px solid #0f172a;
            }
            .net-summary-box {
              border: 1.5px solid #0f172a;
              background: #f8fafc;
              padding: 10px 14px;
              margin-bottom: 14px;
              border-radius: 2px;
            }
            .net-main {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px dashed #cbd5e1;
              padding-bottom: 6px;
              margin-bottom: 6px;
            }
            .net-title {
              font-size: 11px;
              font-weight: 900;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .net-amount {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              font-family: 'Consolas', 'Courier New', monospace;
            }
            .net-words {
              font-size: 10px;
              color: #334155;
              font-weight: 600;
            }
            .net-words strong {
              color: #0f172a;
            }
            .net-meta {
              margin-top: 4px;
              font-size: 9.5px;
              color: #64748b;
            }
            .signature-block {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 36px;
              margin-bottom: 12px;
              padding: 0 10px;
            }
            .sign-col {
              text-align: center;
              width: 210px;
            }
            .sign-line {
              border-top: 1px solid #475569;
              margin-bottom: 4px;
            }
            .sign-label {
              font-size: 9.5px;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
            }
            .footer-note {
              text-align: center;
              font-size: 9px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
              margin-top: 8px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="payslip-sheet">
            <div class="school-header">
              ${schoolProfile?.logoUrl ? `<img src="${resolveMediaUrl(schoolProfile.logoUrl)}" class="logo-img" alt="Logo" />` : '<div style="width: 70px;"></div>'}
              <div class="school-info">
                <div class="school-name">${activeSchoolName.toUpperCase()}</div>
                <div class="school-sub">
                  ${schoolProfile?.address || 'Madhapur Campus, Hyderabad, Telangana - 500081'}<br/>
                  Affiliated to CBSE, New Delhi | Affiliation No. 3630284 | Phone: ${schoolProfile?.phone || '+91 40 2345 6789'}
                </div>
              </div>
              <div style="width: 70px; text-align: right;">
                <span style="font-size: 9px; font-weight: 800; color: #16a34a; background: #dcfce7; border: 1px solid #86efac; padding: 2px 6px; border-radius: 3px;">PAID</span>
              </div>
            </div>

            <div class="doc-title-bar">
              <span>SALARY PAYSLIP FOR THE MONTH OF ${String(p.month || 'CURRENT').toUpperCase()}</span>
              <span style="font-size: 9.5px; font-weight: 600; opacity: 0.9;">Ref: PS-${p.empId || 'EMP'}-${String(p.month || 'M').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</span>
            </div>

            <table class="emp-table">
              <tr>
                <td class="lbl">Employee ID</td>
                <td class="val" style="font-family: monospace; font-weight: 700;">${p.empId}</td>
                <td class="lbl">Employee Name</td>
                <td class="val">${p.employeeName}</td>
              </tr>
              <tr>
                <td class="lbl">Designation</td>
                <td class="val">${matchedStaff?.designation || 'Staff'}</td>
                <td class="lbl">Department</td>
                <td class="val">${matchedStaff?.department || 'Administration'}</td>
              </tr>
              <tr>
                <td class="lbl">Campus / Branch</td>
                <td class="val">${matchedStaff?.branch || 'Main Campus'}</td>
                <td class="lbl">Disbursed Date</td>
                <td class="val">${p.disbursedDate || new Date().toISOString().split('T')[0]}</td>
              </tr>
              <tr>
                <td class="lbl">Bank Name &amp; A/C</td>
                <td class="val" style="font-family: monospace;">${p.bankAccount ? `Bank A/C: ${p.bankAccount}` : 'Direct Bank Deposit'}</td>
                <td class="lbl">Payment Status</td>
                <td class="val" style="color: #16a34a; font-weight: 700;">CONFIRMED (PAID)</td>
              </tr>
            </table>

            <table class="salary-table">
              <thead>
                <tr>
                  <th class="main-hdr divider-col" colspan="2">EARNINGS</th>
                  <th class="main-hdr" colspan="2">DEDUCTIONS</th>
                </tr>
                <tr>
                  <th class="sub-hdr" style="text-align: left; width: 33%;">Particulars / Component</th>
                  <th class="sub-hdr divider-col" style="text-align: right; width: 17%;">Amount (₹)</th>
                  <th class="sub-hdr" style="text-align: left; width: 33%;">Particulars / Component</th>
                  <th class="sub-hdr" style="text-align: right; width: 17%;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr class="tot-row">
                  <td><strong>TOTAL GROSS EARNINGS (A)</strong></td>
                  <td class="amount divider-col"><strong>₹${formatNum(grossVal)}</strong></td>
                  <td><strong>TOTAL DEDUCTIONS (B)</strong></td>
                  <td class="amount" style="color: #b91c1c;"><strong>₹${formatNum(totalDeductionsVal)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div class="net-summary-box">
              <div class="net-main">
                <div>
                  <div class="net-title">NET TAKE-HOME SALARY PAYABLE (A - B)</div>
                  <div class="net-meta">Payment Mode: Direct Bank Transfer (NEFT/RTGS) &bull; Credit Account: ${p.bankAccount || 'On File'}</div>
                </div>
                <div class="net-amount">₹${formatNum(netSalaryVal)}</div>
              </div>
              <div class="net-words">
                Amount in Words: <strong>Rupees ${inWords}</strong>
              </div>
            </div>

            <div class="signature-block">
              <div class="sign-col">
                <div class="sign-line"></div>
                <div class="sign-label">Employee Signature</div>
              </div>
              <div class="sign-col">
                <div class="sign-line"></div>
                <div class="sign-label">Authorised Signatory / Accounts</div>
              </div>
            </div>

            <div class="footer-note">
              This is a computer-generated official payslip issued by ${activeSchoolName}. Does not require an ink signature.
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const uniqueMonths = Array.from(new Set(payslips.map(p => p.month)));

  return (
    <div className="space-y-6 animate-in fade-in text-xs">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" /> Employee Payslips Registry
          </h2>
          <p className="text-xs text-slate-500">Search and print historical salary slips disbursed to school staff members</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-semibold text-slate-500">Filter Payout Month:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border outline-none font-bold text-slate-800 cursor-pointer"
          >
            <option value="All">All Months</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, employee ID..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border outline-none"
          />
        </div>
      </div>

      {/* Payslips table sheet */}
      <div className="glass-card rounded-2xl overflow-hidden border shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Payout Month</th>
              <th className="py-3.5 px-4">Bank Account</th>
              <th className="py-3.5 px-4">Disbursed Date</th>
              <th className="py-3.5 px-4">Net Payout</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y font-medium text-xs">
            {filteredPayslips.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No salary slips found for current parameters.</td></tr>
            ) : (
              filteredPayslips.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{p.employeeName}</p>
                    <p className="text-[10px] text-slate-400">Emp ID: {p.empId}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{p.month}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{p.bankAccount}</td>
                  <td className="py-3.5 px-4">{p.disbursedDate}</td>
                  <td className="py-3.5 px-4 font-mono font-black text-brand-600 text-sm">{formatCurrency(p.netSalary)}</td>
                  <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-[10px]">Released</span></td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handlePrint(p)}
                      className="px-2.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg flex items-center gap-1 transition-all inline-flex align-middle"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Payslip
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
export default StaffPayslipView;
