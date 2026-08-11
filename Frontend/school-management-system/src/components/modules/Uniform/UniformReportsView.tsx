import React, { useState, useRef } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { PrintDropdownMenu } from '../../common/PrintDropdownMenu';
import { Pagination } from '../../common/Pagination';
import { FileSpreadsheet, Download, Printer, Search, Calendar, Filter, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

interface UniformReportsViewProps {
  initialReportType?: string;
}

export const UniformReportsView: React.FC<UniformReportsViewProps> = ({ initialReportType }) => {
  const {
    uniforms,
    uniformInventory,
    studentUniformIssues,
    uniformSuppliers,
    academicClasses
  } = useData();

  const { addToast } = useToast();

  const [reportType, setReportType] = useState<string>(initialReportType || 'Current Stock');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSupplier, setFilterSupplier] = useState<string>('All');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialReportType) {
      setReportType(initialReportType);
    }
  }, [initialReportType]);

  // Determine dynamic filter visibility
  const showClass = ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType);
  const showSupplier = ['Supplier Purchase Report'].includes(reportType);
  const showDateRange = ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report', 'Supplier Purchase Report'].includes(reportType);

  const formatDateToLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setTodayPreset = () => {
    const todayStr = formatDateToLocalYYYYMMDD(new Date());
    setFromDate(todayStr);
    setToDate(todayStr);
  };

  const setThisWeekPreset = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    setFromDate(formatDateToLocalYYYYMMDD(monday));
    setToDate(formatDateToLocalYYYYMMDD(now));
    
    try {
      if (fromDateRef.current && 'showPicker' in HTMLInputElement.prototype) {
        fromDateRef.current.showPicker();
      } else {
        fromDateRef.current?.focus();
      }
    } catch (e) {}
  };

  const setThisMonthPreset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(formatDateToLocalYYYYMMDD(firstDay));
    setToDate(formatDateToLocalYYYYMMDD(now));

    try {
      if (fromDateRef.current && 'showPicker' in HTMLInputElement.prototype) {
        fromDateRef.current.showPicker();
      } else {
        fromDateRef.current?.focus();
      }
    } catch (e) {}
  };

  // Instant real-time filtering (Only active filtered records are calculated)
  const filteredInventory = uniformInventory.filter(inv => {
    if (reportType === 'Low Stock' && (inv.currentStock === 0 || inv.currentStock > inv.minimumStock)) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return inv.itemName.toLowerCase().includes(q) || inv.category.toLowerCase().includes(q) || inv.size.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredStudentIssues = studentUniformIssues.filter(i => {
    if (filterClass !== 'All' && i.className !== filterClass) return false;
    if (fromDate && i.issueDate < fromDate) return false;
    if (reportType === 'Additional Uniform Sales' && i.status !== 'Issued') return false;
    if (reportType === 'Replacement Report' && i.status !== 'Replaced') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return i.studentName.toLowerCase().includes(q) || i.admissionNo.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q) || i.size.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredSuppliers = uniformSuppliers.filter(s => {
    if (filterSupplier !== 'All' && s.id !== filterSupplier) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return s.supplierName.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q) || (s.gstNumber && s.gstNumber.toLowerCase().includes(q));
    }
    return true;
  });

  const recordCount = ['Current Stock', 'Low Stock'].includes(reportType) 
    ? filteredInventory.length 
    : ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType)
    ? filteredStudentIssues.length
    : filteredSuppliers.length;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedStudentIssues = filteredStudentIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Download ONLY the active filtered records
  const handleDownload = () => {
    let headers = '';
    let rows = '';

    if (['Current Stock', 'Low Stock'].includes(reportType)) {
      if (filteredInventory.length === 0) {
        addToast('warning', 'No Records', 'No matching records available to download for the applied filters.');
        return;
      }
      headers = 'Item Name,Category,Size,Opening Stock,Current Stock,Min Stock,Reorder Level,Status\n';
      rows = filteredInventory.map(i => `"${i.itemName}","${i.category}","${i.size}",${i.openingStock},${i.currentStock},${i.minimumStock},${i.reorderLevel},"${i.status}"`).join('\n');
    } else if (['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType)) {
      if (filteredStudentIssues.length === 0) {
        addToast('warning', 'No Records', 'No matching records available to download for the applied filters.');
        return;
      }
      headers = 'Student Name,Admission No,Class,Uniform Item,Size,Quantity,Issue Date,Status,Remarks\n';
      rows = filteredStudentIssues.map(i => `"${i.studentName}","${i.admissionNo}","${i.className}","${i.itemName}","${i.size}",${i.quantity},"${i.issueDate}","${i.status}","${i.notes || ''}"`).join('\n');
    } else {
      if (filteredSuppliers.length === 0) {
        addToast('warning', 'No Records', 'No matching records available to download for the applied filters.');
        return;
      }
      headers = 'Supplier Name,Contact,Mobile,Email,GSTIN,Address,Status\n';
      rows = filteredSuppliers.map(s => `"${s.supplierName}","${s.contactPerson}","${s.mobile}","${s.email || ''}","${s.gstNumber || ''}","${s.address}","${s.status}"`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = reportType.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Filtered_Uniform_${cleanName}_${dateStr}.csv`;
    link.click();
    addToast('success', 'Download Complete', `Successfully downloaded ${recordCount} filtered record(s).`);
  };

  const reportExportData = React.useMemo(() => {
    if (['Current Stock', 'Low Stock'].includes(reportType)) {
      return filteredInventory.map(i => ({
        'Item Name': i.itemName,
        'Category': i.category,
        'Size': i.size,
        'Opening Stock': i.openingStock,
        'Current Stock': i.currentStock,
        'Min Stock': i.minimumStock,
        'Reorder Level': i.reorderLevel,
        'Status': i.status
      }));
    } else if (['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType)) {
      return filteredStudentIssues.map(i => ({
        'Student Name': i.studentName,
        'Admission No': i.admissionNo,
        'Class': i.className,
        'Uniform Item': i.itemName,
        'Size': i.size,
        'Quantity': i.quantity,
        'Issue Date': i.issueDate,
        'Status': i.status,
        'Remarks': i.notes || ''
      }));
    } else {
      return filteredSuppliers.map(s => ({
        'Supplier Name': s.supplierName,
        'Contact Person': s.contactPerson,
        'Mobile': s.mobile,
        'Email': s.email || '',
        'GSTIN': s.gstNumber || '',
        'Address': s.address,
        'Status': s.status
      }));
    }
  }, [reportType, filteredInventory, filteredStudentIssues, filteredSuppliers]);

  return (
    <div id="printable-content" className="space-y-6 animate-in fade-in">
      {/* Official Printable Document Header (Only visible in Print preview) */}
      <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900 text-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Uniform Report & Inventory Audit</h1>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Report Category: <span className="underline font-black">{reportType}</span> | Academic Session: 2026-2027
            </p>
          </div>
          <div className="text-right text-xs font-medium text-slate-700">
            <p className="font-black text-slate-900">EduPulse Academy — School Management System</p>
            <p>Printed Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p>Total Filtered Records: <span className="font-black">{recordCount}</span></p>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-600" /> Uniform Reports & Analytics
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <PrintDropdownMenu
            title={`Uniform Report - ${reportType}`}
            data={reportExportData}
            filename={`Uniform_${reportType.replace(/\s+/g, '_')}`}
          />
        </div>
      </div>

      {/* Side-by-Side Filter Bar */}
      <div className="glass-card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
          
          {/* Search Box on the far LEFT - Dynamic width based on visible fields */}
          <div className={`w-full transition-all duration-200 ${(!showClass && !showSupplier) ? 'flex-1 max-w-md sm:max-w-lg md:max-w-xl' : 'w-full sm:w-64 md:w-72 lg:w-80'}`}>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Search Details</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, item, admission no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Filter Controls Grouped on the far RIGHT */}
          <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto justify-start sm:justify-end">
            
            {/* Select Report Type */}
            <div className="w-full sm:w-60 md:w-64">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Select Report Type *</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20 transition-all"
              >
                <optgroup label="Inventory Reports">
                  <option value="Current Stock">Current Stock Registry</option>
                  <option value="Low Stock">Low Stock Alerts</option>
                </optgroup>
                <optgroup label="Student Reports">
                  <option value="Uniform Issue Report">Uniform Issue Report</option>
                  <option value="Student Uniform History">Student Uniform History</option>
                  <option value="Replacement Report">Replacement Exchange Report</option>
                </optgroup>
                <optgroup label="Supplier Reports">
                  <option value="Supplier Purchase Report">Supplier Directory</option>
                </optgroup>
                <optgroup label="Sales Reports">
                  <option value="Additional Uniform Sales">Additional Uniform Sales</option>
                </optgroup>
              </select>
            </div>

            {/* Dynamic Class Filter */}
            {showClass && (
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Target Class</label>
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="All">Select Class</option>
                  <option value="All">All Classes</option>
                  {academicClasses.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dynamic Supplier Filter */}
            {showSupplier && (
              <div className="w-full sm:w-48">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Supplier Partner</label>
                <select
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="All">Select Supplier (All)</option>
                  {uniformSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.supplierName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Premium Styled Date Range Filter Pill Bar */}
        {showDateRange && (
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-extrabold shrink-0">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Date Range Filter:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
              {/* From Date */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From:</span>
                <input
                  ref={fromDateRef}
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs cursor-pointer transition-all"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To:</span>
                <input
                  ref={toDateRef}
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-xs cursor-pointer transition-all"
                />
              </div>

              {/* Quick Date Presets */}
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={setTodayPreset}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:hover:bg-sky-900 text-[11px] font-bold transition-all border border-sky-200/60 dark:border-sky-900/60 shadow-xs cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setThisWeekPreset}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-xs cursor-pointer"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={setThisMonthPreset}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all border border-slate-200/60 dark:border-slate-700/60 shadow-xs cursor-pointer"
                >
                  This Month
                </button>
              </div>

              {(fromDate || toDate || searchQuery || filterClass !== 'All' || filterSupplier !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setSearchQuery('');
                    setFilterClass('All');
                    setFilterSupplier('All');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 text-[11px] font-bold flex items-center gap-1 transition-all border border-rose-200/60 dark:border-rose-900/60 shadow-xs ml-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Report Header & Live Metrics Banner */}
      <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-brand-500/5 to-transparent border border-sky-200 dark:border-sky-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Real-Time Filtered Report
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            <BarChart2 className="w-4 h-4 text-sky-600" />
            {reportType}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20">
            {recordCount} {recordCount === 1 ? 'Filtered Record' : 'Filtered Records'}
          </span>
        </div>
      </div>

      {/* Dynamic Results Grid Table */}
      <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
              {['Current Stock', 'Low Stock'].includes(reportType) ? (
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4 text-right">Opening Stock</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              ) : ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType) ? (
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Admission No</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Uniform Item</th>
                  <th className="py-3 px-4 text-center">Size</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              ) : (
                /* Supplier purchase */
                <tr>
                  <th className="py-3 px-4">Supplier Company</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 font-mono">GST Number</th>
                  <th className="py-3 px-4">Warehouse Address</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {['Current Stock', 'Low Stock'].includes(reportType) ? (
                filteredInventory.length === 0 ? (
                  reportType === 'Low Stock' ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">All Warehouse Stock Levels Are Healthy!</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                          Zero uniform items are currently below safety reorder thresholds. Automated alerts trigger here whenever stock levels fall below minimum reorder points.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">No stock records match active filters.</td>
                    </tr>
                  )
                ) : (
                  paginatedInventory.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.itemName}</td>
                      <td className="py-3 px-4 text-slate-500">{i.category}</td>
                      <td className="py-3 px-4 text-center font-bold text-sky-600">{i.size}</td>
                      <td className="py-3 px-4 text-right">{i.openingStock} Units</td>
                      <td className="py-3 px-4 text-right font-black">{i.currentStock} Units</td>
                      <td className="py-3 px-4 text-right text-amber-600">{i.reorderLevel} Units</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          i.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' : 'bg-rose-100 text-rose-800 dark:bg-rose-950'
                        }`}>
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )
              ) : ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType) ? (
                filteredStudentIssues.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No student transactions match active filters.</td>
                  </tr>
                ) : (
                  paginatedStudentIssues.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.studentName}</td>
                      <td className="py-3 px-4 font-mono">{i.admissionNo}</td>
                      <td className="py-3 px-4">{i.className.includes('-') ? i.className : (i.section ? `${i.className} - ${i.section}` : i.className)}</td>
                      <td className="py-3 px-4 font-semibold text-sky-600">{i.itemName}</td>
                      <td className="py-3 px-4 text-center font-bold">{i.size}</td>
                      <td className="py-3 px-4 text-right">{i.quantity}</td>
                      <td className="py-3 px-4 font-mono">{i.issueDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          i.status === 'Issued' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{i.notes || 'N/A'}</td>
                    </tr>
                  ))
                )
              ) : (
                filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No supplier partners match active filters.</td>
                  </tr>
                ) : (
                  paginatedSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                      <td className="py-3 px-4 font-semibold">{s.contactPerson}</td>
                      <td className="py-3 px-4 font-mono">{s.mobile}</td>
                      <td className="py-3 px-4">{s.email || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-sky-600">{s.gstNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{s.address}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">{s.status}</span>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={recordCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
export default UniformReportsView;
