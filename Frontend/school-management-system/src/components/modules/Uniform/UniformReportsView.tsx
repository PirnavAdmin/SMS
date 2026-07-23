import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileSpreadsheet, Download, Printer, Search, Shirt, Calendar, Filter } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const UniformReportsView: React.FC = () => {
  const {
    uniforms,
    uniformInventory,
    studentUniformIssues,
    uniformSuppliers,
    students,
    academicClasses
  } = useData();

  const { addToast } = useToast();

  const [reportType, setReportType] = useState<string>('Current Stock');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterSupplier, setFilterSupplier] = useState<string>('All');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [appliedFilters, setAppliedFilters] = useState({
    className: 'All',
    supplierId: 'All',
    fromDate: '',
    toDate: '',
    search: ''
  });

  const handleApplyFilters = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAppliedFilters({
      className: filterClass,
      supplierId: filterSupplier,
      fromDate,
      toDate,
      search: searchQuery
    });
    addToast('success', 'Filters Applied', 'Uniform reports updated successfully.');
  };

  // Determine filters visibility
  const showClass = ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType);
  const showSupplier = ['Supplier Purchase Report'].includes(reportType);
  const showDateRange = ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report', 'Supplier Purchase Report'].includes(reportType);
  const showSearch = ['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales'].includes(reportType);

  // Filtered queries
  const filteredInventory = uniformInventory.filter(inv => {
    if (reportType === 'Low Stock' && inv.currentStock > inv.minimumStock) return false;
    return true;
  });

  const filteredStudentIssues = studentUniformIssues.filter(i => {
    if (appliedFilters.className !== 'All' && i.className !== appliedFilters.className) return false;
    if (appliedFilters.fromDate && i.issueDate < appliedFilters.fromDate) return false;
    if (appliedFilters.toDate && i.issueDate > appliedFilters.toDate) return false;
    if (reportType === 'Additional Uniform Sales' && !i.notes?.includes('Additional Purchase')) return false;
    if (reportType === 'Replacement Report' && i.status !== 'Replaced') return false;

    if (appliedFilters.search.trim() !== '') {
      const q = appliedFilters.search.toLowerCase();
      return i.studentName.toLowerCase().includes(q) || i.admissionNo.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q);
    }
    return true;
  });

  // Supplier logs mapping
  const filteredSuppliers = uniformSuppliers.filter(s => {
    if (appliedFilters.supplierId !== 'All' && s.id !== appliedFilters.supplierId) return false;
    return true;
  });

  const handleExport = () => {
    let headers = '';
    let rows = '';

    if (['Current Stock', 'Low Stock'].includes(reportType)) {
      headers = 'Item Name,Category,Size,Opening Stock,Current Stock,Min Stock,Reorder Level,Status\n';
      rows = filteredInventory.map(i => `"${i.itemName}","${i.category}","${i.size}",${i.openingStock},${i.currentStock},${i.minimumStock},${i.reorderLevel},"${i.status}"`).join('\n');
    } else if (['Uniform Issue Report', 'Student Uniform History', 'Additional Uniform Sales', 'Replacement Report'].includes(reportType)) {
      headers = 'Student Name,Admission No,Class,Uniform Item,Size,Quantity,Issue Date,Status,Remarks\n';
      rows = filteredStudentIssues.map(i => `"${i.studentName}","${i.admissionNo}","${i.className}", "${i.itemName}","${i.size}",${i.quantity},"${i.issueDate}","${i.status}","${i.notes || ''}"`).join('\n');
    } else {
      headers = 'Supplier Name,Contact,Mobile,Email,GSTIN,Address,Status\n';
      rows = filteredSuppliers.map(s => `"${s.supplierName}","${s.contactPerson}","${s.mobile}","${s.email || ''}","${s.gstNumber || ''}","${s.address}","${s.status}"`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Uniform_${reportType.replace(/\s+/g, '_')}_Report.csv`;
    a.click();
    addToast('success', 'Report Exported', 'CSV downloaded successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-purple-600" /> Uniform Report Center
          </h2>
          <p className="text-xs text-slate-500">Analyze current stock registries, replacement operations, low items alerts, and supplier coordinates</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
          >
            <Download className="w-4 h-4" /> Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Unified Report Selector & Dynamic Filters */}
      <form onSubmit={handleApplyFilters} className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Type Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Report Type *</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200 font-extrabold outline-none cursor-pointer"
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
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Class</label>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="All">All Classes</option>
                {academicClasses.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Supplier Filter */}
          {showSupplier && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Supplier Partner</label>
              <select
                value={filterSupplier}
                onChange={e => setFilterSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="All">All Suppliers</option>
                {uniformSuppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplierName}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Secondary Row Filters */}
        {(showDateRange || showSearch) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {showDateRange && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </>
            )}

            {showSearch && (
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">General search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search student, item name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" /> Generate / Apply Filters
          </button>
        </div>
      </form>

      {/* Dynamic Results Grid */}
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
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No stock records match filters.</td>
                  </tr>
                ) : (
                  filteredInventory.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.itemName}</td>
                      <td className="py-3 px-4 text-slate-500">{i.category}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">{i.size}</td>
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
                    <td colSpan={9} className="py-8 text-center text-slate-400">No student transactions logged.</td>
                  </tr>
                ) : (
                  filteredStudentIssues.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{i.studentName}</td>
                      <td className="py-3 px-4 font-mono">{i.admissionNo}</td>
                      <td className="py-3 px-4">{i.className} - {i.section}</td>
                      <td className="py-3 px-4 font-semibold text-purple-600">{i.itemName}</td>
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
                    <td colSpan={7} className="py-8 text-center text-slate-400">No supplier partners match search.</td>
                  </tr>
                ) : (
                  filteredSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.supplierName}</td>
                      <td className="py-3 px-4 font-semibold">{s.contactPerson}</td>
                      <td className="py-3 px-4 font-mono">{s.mobile}</td>
                      <td className="py-3 px-4">{s.email || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-indigo-600">{s.gstNumber || 'N/A'}</td>
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
    </div>
  );
};
export default UniformReportsView;
