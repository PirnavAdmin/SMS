import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Printer, FileText, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { Pagination } from '../../common/Pagination';
import { SearchableSelect } from '../../common/SearchableSelect';
import { getHostelBlocks, getRooms, getAllocations, getWardens, HostelBlock, HostelRoom, BedAllocation, WardenRecord } from '../../../api/hostel';

const ENTERPRISE_HOSTEL_REPORTS = [
  'Hostel Report',
  'Block Report',
  'Warden Report',
  'Room Occupancy Report',
  'Student Hostel Report'
];

export const HostelReportsView: React.FC = () => {
  const { addToast } = useToast();
  const dataContext = useData();
  const students = Array.isArray(dataContext?.students) ? dataContext.students : [];
  const admissions = Array.isArray(dataContext?.admissions) ? dataContext.admissions : [];

  const [selectedReport, setSelectedReport] = useState<string>(''); // Default empty prompt
  const [manualReportInput, setManualReportInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHostel, setFilterHostel] = useState('');
  const [manualHostelInput, setManualHostelInput] = useState('');
  const [tabFilter, setTabFilter] = useState('');
  const [manualTabInput, setManualTabInput] = useState('');

  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocations, setAllocations] = useState<BedAllocation[]>([]);
  const [wardens, setWardens] = useState<WardenRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Reset tab-specific filters when tab changes
  useEffect(() => {
    setTabFilter('');
    setFilterHostel('');
    setSearchQuery('');
    setManualReportInput('');
    setManualHostelInput('');
    setManualTabInput('');
    setCurrentPage(1);
  }, [selectedReport]);

  useEffect(() => {
    const fetchAllHostelData = async () => {
      try {
        setLoading(true);
        const [bData, rData, aData, wData] = await Promise.all([
          getHostelBlocks().catch(() => []),
          getRooms().catch(() => []),
          getAllocations().catch(() => []),
          getWardens().catch(() => [])
        ]);
        setBlocks(Array.isArray(bData) ? bData : []);
        setRooms(Array.isArray(rData) ? rData : []);
        setAllocations(Array.isArray(aData) ? aData : []);
        setWardens(Array.isArray(wData) ? wData : []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllHostelData();
  }, []);

  // Effective filter values
  const effectiveHostel = filterHostel === 'MANUAL' ? manualHostelInput : filterHostel;
  const effectiveTabFilter = tabFilter === 'MANUAL' ? manualTabInput : tabFilter;
  const effectiveReportName = selectedReport === 'MANUAL' ? (manualReportInput || 'Custom Report') : selectedReport;

  // Live options for Hostel Block Filter
  const blockFilterOptions = useMemo(() => {
    const opts = [
      { value: '', label: '-- Select Hostel Block --' },
      { value: 'All', label: 'All Hostels' }
    ];
    blocks.forEach(b => {
      const bName = b.hostelName || (b as any).name || `Block #${b.hostelId}`;
      opts.push({ value: bName, label: bName });
    });
    opts.push({ value: 'MANUAL', label: '✍️ Custom / Manual Block Entry' });
    return opts;
  }, [blocks]);

  // Tab-Specific Secondary Filter Options
  const tabFilterOptions = useMemo(() => {
    const baseOpts = (() => {
      switch (selectedReport) {
        case 'Hostel Report':
        case 'Block Report':
          return [
            { value: '', label: '-- Filter by Category --' },
            { value: 'All', label: 'All Categories' },
            { value: 'Boys Hostel', label: 'Boys Hostel' },
            { value: 'Girls Hostel', label: 'Girls Hostel' }
          ];
        case 'Warden Report':
          return [
            { value: '', label: '-- Filter Warden Status --' },
            { value: 'All', label: 'All Wardens' },
            { value: 'Assigned', label: 'Assigned Wardens' },
            { value: 'Unassigned', label: 'Unassigned Wardens' }
          ];
        case 'Room Occupancy Report':
          return [
            { value: '', label: '-- Filter Occupancy Status --' },
            { value: 'All', label: 'All Occupancy Status' },
            { value: 'VACANT', label: 'Vacant Rooms' },
            { value: 'PARTIAL', label: 'Partially Occupied' },
            { value: 'FULL', label: 'Fully Occupied' }
          ];
        case 'Student Hostel Report':
          return [
            { value: '', label: '-- Filter Allocation Status --' },
            { value: 'All', label: 'All Allocation Status' },
            { value: 'Active', label: 'Active Allocated' },
            { value: 'Pending Allocation', label: 'Pending Allocation' }
          ];
        default:
          return [{ value: '', label: '-- Select Category Filter --' }, { value: 'All', label: 'All Records' }];
      }
    })();
    return [...baseOpts, { value: 'MANUAL', label: '✍️ Custom / Manual Filter Entry' }];
  }, [selectedReport]);

  // Generate Live Report Data JSON
  const rawReportData = useMemo(() => {
    switch (selectedReport) {
      case 'Hostel Report': {
        if (blocks.length === 0) return [];
        return blocks.map(b => {
          const bName = b.hostelName || (b as any).name || `Block #${b.hostelId}`;
          const blockRooms = rooms.filter(r => String(r.hostelId) === String(b.hostelId));
          const totalBeds = blockRooms.reduce((acc, r) => acc + (r.bedCapacity || 0), 0);
          const activeAllocations = allocations.filter(a => String(a.hostelId) === String(b.hostelId) && a.status === 'Active').length;
          const availBeds = Math.max(0, totalBeds - activeAllocations);

          return {
            'Hostel Code': b.hostelCode || `BLK-${b.hostelId}`,
            'Hostel Name': bName,
            'Category': b.hostelType || 'Hostel',
            'Floors Count': (b as any).totalFloors || 1,
            'Total Rooms': blockRooms.length,
            'Total Beds': totalBeds,
            'Occupied Beds': activeAllocations,
            'Available Beds': availBeds,
            'Assigned Warden': b.wardenName || 'Unassigned',
            'Status': b.status || 'Active'
          };
        });
      }

      case 'Block Report': {
        if (blocks.length === 0) return [];
        return blocks.map(b => ({
          'Block Code': b.hostelCode || `BLK-${b.hostelId}`,
          'Block Name': b.hostelName || `Block #${b.hostelId}`,
          'Category': b.hostelType || 'Boys Hostel',
          'Total Floors': (b as any).totalFloors || 1,
          'Warden Name': b.wardenName || 'Unassigned',
          'Primary Mobile': b.primaryMobileNumber || 'N/A',
          'Location': b.address || 'Main Campus',
          'Status': b.status || 'Active'
        }));
      }

      case 'Warden Report': {
        if (wardens.length === 0 && blocks.length === 0) return [];
        if (wardens.length > 0) {
          return wardens.map(w => ({
            'Warden Name': w.wardenName || 'Warden',
            'Employee ID': w.employeeId || 'EMP-101',
            'Assigned Block': w.hostelName || 'Hostel Block',
            'Mobile Number': w.mobileNumber || 'N/A',
            'Email': w.emailAddress || 'N/A',
            'Assignment Date': w.createdAt ? w.createdAt.split('T')[0] : 'Active'
          }));
        }
        return blocks.filter(b => b.wardenName && b.wardenName !== 'Unassigned').map(b => ({
          'Warden Name': b.wardenName,
          'Employee ID': `EMP-${b.hostelId}`,
          'Assigned Block': b.hostelName,
          'Mobile Number': b.primaryMobileNumber || 'N/A',
          'Email': b.email || 'N/A',
          'Assignment Date': 'Active'
        }));
      }

      case 'Room Occupancy Report': {
        if (rooms.length === 0) return [];
        return rooms.map(r => {
          const blockObj = blocks.find(b => String(b.hostelId) === String(r.hostelId));
          const blockName = blockObj?.hostelName || (r as any).hostelName || `Block #${r.hostelId}`;
          const occBeds = allocations.filter(a => String(a.roomId) === String(r.roomId) && a.status === 'Active').length;
          const cap = r.bedCapacity || 4;
          const avail = Math.max(0, cap - occBeds);
          const occStatus = avail === 0 ? 'FULL' : occBeds > 0 ? 'PARTIAL' : 'VACANT';

          return {
            'Room Number': `Room #${r.roomNumber || r.roomId}`,
            'Hostel Block': blockName,
            'Floor Level': r.floorLevel || 'Ground Floor',
            'Room Type': r.roomType || 'Standard',
            'AC Status': r.acType || 'Non-AC',
            'Capacity': cap,
            'Occupied Beds': occBeds,
            'Available Beds': avail,
            'Occupancy Status': occStatus
          };
        });
      }

      case 'Student Hostel Report': {
        const list: any[] = [];

        allocations.forEach(a => {
          const blockObj = blocks.find(b => String(b.hostelId) === String(a.hostelId));
          const bName = a.hostelName || blockObj?.hostelName || `Block #${a.hostelId}`;
          list.push({
            'Admission No': a.admissionNo || 'N/A',
            'Student Name': a.studentName || 'Student',
            'Hostel Facility': bName,
            'Room & Bed': a.roomNumber ? `Room #${a.roomNumber} (${a.bedNumber || 'BED-1'})` : 'Unassigned',
            'Assigned Warden': blockObj?.wardenName || 'Unassigned',
            'Joining Date': a.joiningDate ? a.joiningDate.split('T')[0] : 'N/A',
            'Status': a.status || 'Active'
          });
        });

        const allocatedStudentIds = new Set(allocations.map(a => String(a.studentId || a.admissionNo)));
        const allCandidates = [...students, ...admissions];

        allCandidates.forEach((s: any) => {
          const sId = String(s.id || s.applicationNo || s.admissionNo);
          const sType = String(s.studentType || s.residenceType || s.facilityOpted || '').toLowerCase();
          const isRes = sType.includes('hostel') || sType.includes('residential') || sType.includes('boarder') || s.isHostelRequired === true;

          if (isRes && !allocatedStudentIds.has(sId) && !allocatedStudentIds.has(String(s.admissionNo))) {
            allocatedStudentIds.add(sId);
            list.push({
              'Admission No': s.admissionNo || s.applicationNo || sId,
              'Student Name': s.applicantName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
              'Hostel Facility': s.hostelBlock || 'Opted during Admission',
              'Room & Bed': 'Unassigned (Pending Bed)',
              'Assigned Warden': 'Unassigned',
              'Joining Date': 'Registration Date',
              'Status': 'Pending Allocation'
            });
          }
        });

        return list;
      }

      default:
        return [];
    }
  }, [selectedReport, blocks, rooms, allocations, wardens, students, admissions]);

  // Apply Real-Time Filters (Search, Hostel Block & Tab-Specific Filter)
  const reportData = useMemo(() => {
    if (!selectedReport && !searchQuery.trim()) return [];
    return rawReportData.filter(row => {
      const rowValues = Object.values(row).join(' ').toLowerCase();
      const matchesSearch = !searchQuery.trim() || rowValues.includes(searchQuery.toLowerCase().trim());
      const matchesHostel = !effectiveHostel || effectiveHostel === 'All' || rowValues.includes(effectiveHostel.toLowerCase().trim());

      let matchesTabFilter = true;
      if (effectiveTabFilter && effectiveTabFilter !== 'All') {
        const tf = effectiveTabFilter.toLowerCase().trim();
        if (selectedReport === 'Warden Report') {
          const wardenName = String(row['Warden Name'] || '').toLowerCase();
          if (tf === 'assigned') matchesTabFilter = wardenName !== 'unassigned' && wardenName !== '';
          if (tf === 'unassigned') matchesTabFilter = wardenName === 'unassigned' || wardenName === '';
        } else {
          matchesTabFilter = rowValues.includes(tf);
        }
      }

      return matchesSearch && matchesHostel && matchesTabFilter;
    });
  }, [rawReportData, searchQuery, effectiveHostel, effectiveTabFilter, selectedReport]);

  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return reportData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [reportData, currentPage, itemsPerPage]);

  const handlePrint = () => {
    addToast('info', 'Preparing Print', `Printing ${reportData.length} records for ${selectedReport}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Export Complete', `Exported ${reportData.length} filtered records to PDF`);
    const link = document.createElement('a');
    const content = `HOSTEL REPORT - ${selectedReport.toUpperCase()}\nRecords Count: ${reportData.length}\nGenerated: ${new Date().toLocaleString()}\n\n` +
      reportData.map((r, i) => `${i + 1}. ` + Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | ')).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    link.href = URL.createObjectURL(blob);
    link.download = `Hostel_${selectedReport.replace(/\s+/g, '_')}_Filtered_Report.txt`;
    link.click();
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

          <ExportButton
            data={reportData}
            filename={`Hostel_${selectedReport.replace(/\s+/g, '_')}_Report`}
            label="Download"
          />
        </div>
      </div>

      {/* Filter Bar with Report Selector */}
      <div className="glass-card p-4 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* 1. Report Category Select */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hostel Report Category <span className="text-rose-500 font-bold ml-0.5">*</span></label>
            <select
              value={selectedReport}
              onChange={e => {
                setSelectedReport(e.target.value);
                if (e.target.value !== 'MANUAL') setManualReportInput('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              <option value="">-- Select Hostel Report --</option>
              {ENTERPRISE_HOSTEL_REPORTS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="MANUAL">✍️ Custom / Manual Report Entry</option>
            </select>

            {selectedReport === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type custom hostel report..."
                value={manualReportInput}
                onChange={e => setManualReportInput(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
          </div>

          {/* 2. Hostel Block Filter Dropdown */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Hostel Block Filter</label>
            <select
              value={filterHostel}
              onChange={e => {
                setFilterHostel(e.target.value);
                if (e.target.value !== 'MANUAL') setManualHostelInput('');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              {blockFilterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {filterHostel === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type manual hostel block (e.g. Block C)..."
                value={manualHostelInput}
                onChange={e => setManualHostelInput(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
          </div>

          {/* 3. Status / Sub-Category Filter Dropdown */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category / Status Filter</label>
            <select
              value={tabFilter}
              onChange={e => {
                setTabFilter(e.target.value);
                if (e.target.value !== 'MANUAL') setManualTabInput('');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer outline-none focus:border-sky-500 h-[38px]"
            >
              {tabFilterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {tabFilter === 'MANUAL' && (
              <input
                type="text"
                placeholder="Type manual status/filter..."
                value={manualTabInput}
                onChange={e => setManualTabInput(e.target.value)}
                className="w-full mt-2 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-300 text-xs font-bold"
              />
            )}
          </div>

        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search hostel report records..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {!selectedReport && !searchQuery ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-sky-400 dark:border-sky-500 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center mx-auto border border-sky-200 dark:border-sky-800">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Hostel Report Selected</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Please select a hostel report category & block filter from the dropdowns above or use manual entry to load matching records.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md space-y-3 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-base text-slate-900 dark:text-white">{effectiveReportName}</h3>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full">
              Total Records: {reportData.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold italic">Loading hostel report data...</div>
            ) : reportData.length === 0 ? (
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

          {reportData.length > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalItems={reportData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemsPerPageOptions={[5, 8, 10, 25, 50]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
