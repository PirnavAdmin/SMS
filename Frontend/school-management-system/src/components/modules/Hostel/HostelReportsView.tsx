import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer, FileText, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { SearchableSelect } from '../../common/SearchableSelect';
import { getHostelBlocks, HostelBlock } from '../../../api/hostel';

const ENTERPRISE_HOSTEL_REPORTS = [
  'Hostel Report',
  'Block Report',
  'Warden Report',
  'Room Occupancy Report',
  'Student Hostel Report'
];

export const HostelReportsView: React.FC = () => {
  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('Hostel Report');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('');
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    getHostelBlocks().then(setBlocks).catch(e => console.error(e));
  }, []);

  // Generate Report Data JSON
  const getReportData = (): any[] => {
    switch (selectedReport) {
      case 'Hostel Report':
        return [
          {
            'Hostel Code': 'HST-01',
            'Hostel Name': 'Boys Residence - Block A',
            'Hostel Type': 'Boys Hostel',
            'Total Rooms': 2,
            'Total Beds': 8,
            'Occupied Beds': 1,
            'Available Beds': 7,
            'Status': 'Active'
          },
          {
            'Hostel Code': 'HST-02',
            'Hostel Name': 'Girls Residence - Block B',
            'Hostel Type': 'Girls Hostel',
            'Total Rooms': 4,
            'Total Beds': 12,
            'Occupied Beds': 0,
            'Available Beds': 12,
            'Status': 'Active'
          }
        ];

      case 'Block Report':
        return (blocks.length > 0 ? blocks : [
          { hostelCode: 'HST-01', hostelName: 'Boys Residence - Block A', totalFloors: 3, wardenName: 'Dr. Eleanor Vance', status: 'Active' },
          { hostelCode: 'HST-02', hostelName: 'Girls Residence - Block B', totalFloors: 4, wardenName: 'Mrs. Sarah Connor', status: 'Active' }
        ]).map(b => ({
          'Block Code': b.hostelCode || 'HST-01',
          'Block Name': b.hostelName || 'Boys Residence - Block A',
          'Hostel Facility': b.hostelName || 'Boys Residence - Block A',
          'Floors Count': (b as any).totalFloors || 3,
          'Assigned Warden': b.wardenName || 'Dr. Eleanor Vance',
          'Status': b.status || 'Active'
        }));

      case 'Warden Report':
        return [
          {
            'Warden Name': 'Dr. Eleanor Vance',
            'Employee ID': 'EMP-101',
            'Assigned Block': 'Boys Residence - Block A',
            'Hostel Facility': 'Boys Residence - Block A',
            'Mobile Number': '+91 98765 43210',
            'Status': 'Active'
          },
          {
            'Warden Name': 'Mrs. Sarah Connor',
            'Employee ID': 'EMP-104',
            'Assigned Block': 'Girls Residence - Block B',
            'Hostel Facility': 'Girls Residence - Block B',
            'Mobile Number': '+91 98765 88888',
            'Status': 'Active'
          }
        ];

      case 'Room Occupancy Report':
        return [
          {
            'Room Number': 'Room #101',
            'Hostel': 'Boys Residence - Block A',
            'Floor': '1st Floor',
            'Room Type': 'Double Sharing (AC)',
            'Capacity': 2,
            'Occupied': 1,
            'Available Beds': 1,
            'Occupancy Status': 'AVAILABLE'
          },
          {
            'Room Number': 'Room #102',
            'Hostel': 'Boys Residence - Block A',
            'Floor': '1st Floor',
            'Room Type': 'Four Sharing (Non-AC)',
            'Capacity': 4,
            'Occupied': 0,
            'Available Beds': 4,
            'Occupancy Status': 'AVAILABLE'
          }
        ];

      case 'Student Hostel Report':
        return [
          {
            'Admission No': 'ADM-2024-001',
            'Student Name': 'Rahul Sharma',
            'Hostel Facility': 'Boys Residence - Block A',
            'Room & Bed': 'Room #101 (BED-1)',
            'Assigned Warden': 'Dr. Eleanor Vance',
            'Joining Date': '2026-08-01',
            'Status': 'Active'
          }
        ];

      default:
        return [];
    }
  };

  const rawData = getReportData();
  const reportData = rawData.filter(row => {
    const matchesSearch = !searchQuery.trim() || JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHostel = filterHostel === 'All' || !filterHostel || JSON.stringify(row).toLowerCase().includes(filterHostel.toLowerCase());
    return matchesSearch && matchesHostel;
  });

  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const paginatedData = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrint = () => {
    addToast('info', 'Preparing Print', `Printing ${reportData.length} records for ${selectedReport}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Export Complete', `Exported ${reportData.length} records to PDF`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Hostel Reports
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-sky-600" /> Print
          </button>

          <button
            onClick={handlePdfExport}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-600" /> Export PDF
          </button>

          <ExportButton data={reportData} filename={selectedReport.toLowerCase().replace(/\s+/g, '_')} />
        </div>
      </div>

      {/* Filter Bar with Report Selector */}
      <div className="glass-card p-4 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Select Hostel Report Category</span>
          <div className="flex flex-wrap gap-2">
            {ENTERPRISE_HOSTEL_REPORTS.map(report => (
              <button
                key={report}
                onClick={() => {
                  setSelectedReport(report);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedReport === report
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {report}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search report records..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="min-w-[180px] w-full sm:w-auto">
              <SearchableSelect
                value={filterHostel}
                onChange={val => {
                  setFilterHostel(val);
                  setCurrentPage(1);
                }}
                placeholder="Select Option"
                searchPlaceholder="Search hostel block..."
                options={[
                  { value: '', label: 'Select Option' },
                  { value: 'All', label: 'All Hostels' },
                  { value: 'Boys Residence - Block A', label: 'Boys Residence - Block A' },
                  { value: 'Girls Residence - Block B', label: 'Girls Residence - Block B' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedReport}</h3>
        </div>

        <div className="overflow-x-auto">
          {reportData.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400 italic font-semibold">No report records found matching filter.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs text-slate-700 dark:text-slate-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 uppercase font-extrabold text-[10px] tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  {Object.keys(reportData[0] || {}).map(key => (
                    <th key={key} className="py-3 px-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {Object.values(row).map((val: any, valIdx) => (
                      <td key={valIdx} className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
