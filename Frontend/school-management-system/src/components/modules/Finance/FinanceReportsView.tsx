import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { 
  FileSpreadsheet, Printer, Search, IndianRupee, 
  BarChart3, CheckCircle2, AlertCircle, Gift, Tag, Bus, Home, Info 
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';

export const FinanceReportsView: React.FC = () => {
  const { feePayments, students, studentTransports, studentHostels, studentScholarships } = useData();

  const [selectedReport, setSelectedReport] = useState<string>('Daily Collection');
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [generatedReportType, setGeneratedReportType] = useState<string>('');
  const [currentData, setCurrentData] = useState<any[]>([]);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Common Filter States
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('All');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Optional/Conditional Filter States
  const [filterFeeHead, setFilterFeeHead] = useState<string>('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState<string>('All');
  const [filterHostelName, setFilterHostelName] = useState<string>('All');
  const [filterRouteName, setFilterRouteName] = useState<string>('All');

  // Reset pagination on report type or query change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReport, searchQuery]);

  // Distinct values for filter dropdowns
  const paymentModes = Array.from(new Set(feePayments.map(p => p.paymentMode))).filter(Boolean);
  const hostelNames = Array.from(new Set(studentHostels.map(h => h.hostelName))).filter(Boolean);
  const routeNames = Array.from(new Set(studentTransports.map(t => t.routeName))).filter(Boolean);
  const classesList = Array.from(new Set(students.map(s => s.className))).filter(Boolean);
  const sectionsList = Array.from(new Set(students.map(s => s.section))).filter(Boolean);

  // Conditional filters visibility check
  const showFeeHeadFilter = selectedReport === 'Fee Head Wise Collection';
  const showPaymentModeFilter = ['Daily Collection', 'Monthly Collection', 'Yearly Collection', 'Collection Summary', 'Cash Book'].includes(selectedReport);
  const showHostelFilter = selectedReport === 'Hostel Collection';
  const showRouteFilter = selectedReport === 'Transport Collection';

  // KPI Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollection = feePayments.filter(p => p.paymentDate === todayStr).reduce((sum, p) => sum + p.amountPaid, 0);

  const thisMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthlyCollection = feePayments.filter(p => p.paymentDate && p.paymentDate.startsWith(thisMonthStr)).reduce((sum, p) => sum + p.amountPaid, 0);

  const pendingFees = students.reduce((sum, s) => sum + (s.dueFee || 0), 0);
  const distinctPaidStudents = new Set(feePayments.map(p => p.studentId)).size;
  const totalScholarshipsAmount = studentScholarships.reduce((sum, s) => sum + (s.discountType === 'Percentage' ? 3750 : s.discountValue), 0);
  const totalDiscountsAmount = feePayments.reduce((sum, p) => sum + (p.discount || 0), 0);

  const transportRevenue = studentTransports.reduce((sum, t) => sum + t.feeAmount, 0);
  const hostelRevenue = studentHostels.reduce((sum, h) => sum + h.feeAmount, 0);

  const handleGenerate = () => {
    let result: any[] = [];
    switch (selectedReport) {
      case 'Transport Collection':
        result = studentTransports.map(t => ({
          studentName: t.studentName,
          admissionNo: t.admissionNo,
          routeName: t.routeName,
          feePlan: t.feePlan,
          amount: t.feeAmount
        }));
        break;
      case 'Hostel Collection':
        result = studentHostels.map(h => ({
          studentName: h.studentName,
          hostelName: h.hostelName,
          roomNo: h.roomNo,
          amount: h.feeAmount
        }));
        break;
      case 'Scholarship Report':
        result = studentScholarships.map(s => ({
          studentName: s.studentName,
          scholarshipName: s.scholarshipName,
          discount: `${formatCurrency(s.discountValue)} (${s.discountType})`,
          appliedDate: s.appliedDate
        }));
        break;
      case 'Pending Fees':
        result = students.filter(s => s.dueFee > 0).map(s => ({
          studentName: `${s.firstName} ${s.lastName}`,
          classSection: `${s.className}-${s.section}`,
          dueFee: s.dueFee
        }));
        break;
      default:
        // Daily Collection, Monthly Collection, Yearly Collection, Branch Wise Collection,
        // Class Wise Collection, Section Wise Collection, Fee Head Wise Collection,
        // Fine Report (Fine Collection), Collection Summary, Cash Book
        result = feePayments.map(p => ({
          receiptNo: p.receiptNo,
          studentName: p.studentName,
          classSection: p.className,
          amount: p.amountPaid,
          paymentMode: p.paymentMode,
          paymentDate: p.paymentDate
        }));
        break;
    }

    // Apply Filters
    if (filterClass !== 'All') {
      result = result.filter(item => {
        const val = item.classSection || item.class || '';
        return val.toLowerCase().includes(filterClass.toLowerCase());
      });
    }
    if (filterSection !== 'All') {
      result = result.filter(item => {
        const val = item.classSection || item.class || '';
        return val.toLowerCase().includes(`-${filterSection}`.toLowerCase()) || val.toLowerCase().endsWith(filterSection.toLowerCase());
      });
    }
    if (filterStartDate) {
      result = result.filter(item => {
        const d = item.paymentDate || item.appliedDate || '';
        return !d || new Date(d) >= new Date(filterStartDate);
      });
    }
    if (filterEndDate) {
      result = result.filter(item => {
        const d = item.paymentDate || item.appliedDate || '';
        return !d || new Date(d) <= new Date(filterEndDate);
      });
    }
    if (showPaymentModeFilter && filterPaymentMode !== 'All') {
      result = result.filter(item => item.paymentMode === filterPaymentMode);
    }
    if (showHostelFilter && filterHostelName !== 'All') {
      result = result.filter(item => item.hostelName === filterHostelName);
    }
    if (showRouteFilter && filterRouteName !== 'All') {
      result = result.filter(item => item.routeName === filterRouteName);
    }

    setCurrentData(result);
    setGeneratedReportType(selectedReport);
    setIsGenerated(true);
  };

  // Search filter
  const displayedData = currentData.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.studentName && item.studentName.toLowerCase().includes(q)) ||
      (item.admissionNo && item.admissionNo.toLowerCase().includes(q)) ||
      (item.receiptNo && item.receiptNo.toLowerCase().includes(q)) ||
      (item.routeName && item.routeName.toLowerCase().includes(q)) ||
      (item.hostelName && item.hostelName.toLowerCase().includes(q))
    );
  });

  // Totals calculations
  const totalAmountSum = displayedData.reduce((sum, item) => sum + (item.amount || item.dueFee || item.fee || 0), 0);

  // Pagination calculations
  const totalRecords = displayedData.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const paginatedData = displayedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const headers = Object.keys(currentData[0] || {}).slice(0, 7);
    const rowsHtml = displayedData.map(row => `
      <tr>
        ${headers.map(h => `<td style="padding:8px; border:1px solid #ddd;">${row[h] !== undefined ? row[h] : ''}</td>`).join('')}
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${generatedReportType} Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            h2 { margin-bottom: 5px; color: #0284c7; }
            p { color: #64748b; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f1f5f9; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
          </style>
        </head>
        <body>
          <h2>School ERP - ${generatedReportType}</h2>
          <p>Generated Date: ${new Date().toLocaleDateString()} • Total Records: ${totalRecords} • Filtered Total: ${formatCurrency(totalAmountSum)}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Financial Reports & Audit Analytics
        </h2>
        <p className="text-xs text-slate-500 font-medium">Configure advanced search filters, generate ledgers, print reports and audit details</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-sky-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Today's Collection</span>
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">{formatCurrency(todayCollection)}</h4>
          <span className="text-[9px] text-sky-500 font-bold">Daily Receipts</span>
        </div>

        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Monthly Collection</span>
          <h4 className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(monthlyCollection)}</h4>
          <span className="text-[9px] text-emerald-500 font-bold">Monthly Receipts</span>
        </div>

        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Pending Dues</span>
          <h4 className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 truncate">{formatCurrency(pendingFees)}</h4>
          <span className="text-[9px] text-rose-500 font-bold">Outstanding dues</span>
        </div>

        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-indigo-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Students Paid</span>
          <h4 className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 truncate">{distinctPaidStudents} Students</h4>
          <span className="text-[9px] text-slate-400 font-bold">Distinct Payees</span>
        </div>

        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-purple-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Scholarships & Discounts</span>
          <h4 className="text-sm sm:text-base font-black text-purple-600 dark:text-purple-400 truncate">{formatCurrency(totalScholarshipsAmount + totalDiscountsAmount)}</h4>
          <span className="text-[9px] text-slate-400 font-bold">Total Concessions</span>
        </div>

        <div className="glass-card p-4.5 rounded-3xl space-y-1.5 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Transport & Hostel</span>
          <h4 className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 truncate">{formatCurrency(transportRevenue + hostelRevenue)}</h4>
          <span className="text-[9px] text-slate-400 font-bold">Services Collection</span>
        </div>
      </div>

      {/* Report Selector & Filter Panel */}
      <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Report Selection & Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Report Type</label>
            <select
              value={selectedReport}
              onChange={e => {
                setSelectedReport(e.target.value);
                setIsGenerated(false); // Reset generated state on change
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <optgroup label="Collection Reports">
                <option value="Daily Collection">Daily Collection</option>
                <option value="Monthly Collection">Monthly Collection</option>
                <option value="Yearly Collection">Yearly Collection</option>
                <option value="Branch Wise Collection">Branch Wise Collection</option>
                <option value="Class Wise Collection">Class Wise Collection</option>
                <option value="Section Wise Collection">Section Wise Collection</option>
                <option value="Collection Summary">Collection Summary</option>
              </optgroup>
              <optgroup label="Student Reports">
                <option value="Student Ledger">Student Ledger</option>
                <option value="Pending Fees">Pending Fees</option>
              </optgroup>
              <optgroup label="Fee Reports">
                <option value="Fee Head Wise Collection">Fee Head Wise Collection</option>
                <option value="Scholarship Report">Scholarship Report</option>
                <option value="Discount Report">Discount Report</option>
                <option value="Fine Report">Fine Report</option>
              </optgroup>
              <optgroup label="Service Reports">
                <option value="Hostel Collection">Hostel Collection</option>
                <option value="Transport Collection">Transport Collection</option>
              </optgroup>
              <optgroup label="Accounting Reports">
                <option value="Cash Book">Cash Book</option>
              </optgroup>
            </select>
          </div>

          {/* Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Academic Year</label>
            <select
              value={filterAcademicYear}
              onChange={e => setFilterAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>

          {/* Class */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Class</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="All">All Classes</option>
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Section</label>
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="All">All Sections</option>
              {sectionsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic / Optional Filters Panel */}
        {(showPaymentModeFilter || showHostelFilter || showRouteFilter || showFeeHeadFilter || filterStartDate || filterEndDate) && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Payment Mode */}
            {showPaymentModeFilter && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Payment Mode</label>
                <select
                  value={filterPaymentMode}
                  onChange={e => setFilterPaymentMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="All">All Modes</option>
                  {paymentModes.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Hostel Selector */}
            {showHostelFilter && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Select Hostel</label>
                <select
                  value={filterHostelName}
                  onChange={e => setFilterHostelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="All">All Hostels</option>
                  {hostelNames.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Route Selector */}
            {showRouteFilter && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Select Route</label>
                <select
                  value={filterRouteName}
                  onChange={e => setFilterRouteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="All">All Routes</option>
                  {routeNames.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Fee Head (for Fee Head Wise Collection) */}
            {showFeeHeadFilter && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Select Fee Head</label>
                <select
                  value={filterFeeHead}
                  onChange={e => setFilterFeeHead(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="All">All Fee Heads</option>
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Books Fee">Books Fee</option>
                  <option value="Hostel Fee">Hostel Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                </select>
              </div>
            )}

            {/* Date Range Start */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>

            {/* Date Range End */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Generate Primary Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md shadow-sky-500/25 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* Generated Report Output */}
      {isGenerated ? (
        <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-500" /> {generatedReportType}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Total Records Found: {totalRecords} • Current Page: {currentPage} / {totalPages || 1}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <Printer className="w-4 h-4 text-slate-500" /> Print
              </button>
              <ExportButton data={displayedData} filename={`report_${generatedReportType.toLowerCase().replace(/\s+/g, '_')}`} />
            </div>
          </div>

          {/* Search Box & Page Size */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, receipt, admission..."
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-bold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 self-end sm:self-auto">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-extrabold text-slate-800 dark:text-slate-200"
              >
                <option value={5}>5 Rows</option>
                <option value={10}>10 Rows</option>
                <option value={25}>25 Rows</option>
                <option value={50}>50 Rows</option>
              </select>
            </div>
          </div>

          {/* Dynamic Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  {Object.keys(currentData[0] || { Record: '' }).map(key => (
                    <th key={key} className="py-3 px-4 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 font-bold">No records matching search query.</td>
                  </tr>
                ) : (
                  paginatedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      {Object.entries(row).map(([key, val]: any, valIdx) => (
                        <td key={valIdx} className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {key.toLowerCase().includes('amount') || key.toLowerCase().includes('fee') || key === 'cost' ? formatCurrency(val) : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Totals Summary Bar */}
          {displayedData.length > 0 && (
            <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/60 dark:border-sky-900/30 flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300">
              <span>Filtered Summary (Sum of Amounts):</span>
              <span className="font-black text-sm">{formatCurrency(totalAmountSum)}</span>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Showing {Math.min(totalRecords, (currentPage - 1) * pageSize + 1)}-{Math.min(totalRecords, currentPage * pageSize)} of {totalRecords} records</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 text-[10px] font-bold rounded-lg transition-all ${
                      currentPage === idx + 1
                        ? 'bg-sky-600 text-white'
                        : 'border bg-white dark:bg-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">No Report Generated Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">Select a report type, configure target search parameters/filters, and click "Generate Report" to view analytics.</p>
          </div>
        </div>
      )}
    </div>
  );
};
