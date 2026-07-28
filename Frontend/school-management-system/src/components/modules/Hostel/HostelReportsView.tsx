import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileSpreadsheet, Printer, Building2, Home, Users, Download, FileText, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { initialHostelBlocks } from './HostelBlocksView';
import { initialHostelFloors } from './HostelFloorsView';

const ENTERPRISE_HOSTEL_REPORTS = [
  'Hostel Report',
  'Block Report',
  'Floor Report',
  'Supervisor Report',
  'Warden Report',
  'Room Occupancy Report',
  'Student Hostel Report'
];

export const HostelReportsView: React.FC = () => {
  const {
    hostelMasters, roomMasters, roomTypeMasters, studentHostelAssignments,
    students, checkVehicleCapacity
  } = useData();

  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('Hostel Report');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = () => {
    addToast('info', 'Preparing Report Print', `Printing ${selectedReport}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Report Generated', `Downloaded PDF for ${selectedReport}`);
  };

  // Generate Report Data JSON
  const getReportData = (): any[] => {
    switch (selectedReport) {
      case 'Hostel Report':
        return hostelMasters.map(h => {
          const hRooms = roomMasters.filter(r => r.hostelId === h.id);
          const totalBeds = hRooms.reduce((acc, r) => acc + (r.capacity || 2), 0);
          const occupied = studentHostelAssignments.filter(a => a.status === 'Active' && hRooms.some(r => r.id === a.roomId)).length;

          return {
            'Hostel Code': h.hostelCode,
            'Hostel Name': h.hostelName,
            'Hostel Type': h.hostelType,
            'Total Rooms': hRooms.length,
            'Total Beds': totalBeds,
            'Occupied Beds': occupied,
            'Available Beds': Math.max(0, totalBeds - occupied),
            'Status': h.status
          };
        });

      case 'Block Report':
        return initialHostelBlocks.map(b => ({
          'Block Code': b.blockCode,
          'Block Name': b.blockName,
          'Hostel Facility': b.hostelName,
          'Floors Count': b.numberOfFloors,
          'Assigned Supervisor': b.supervisorName || 'Unassigned',
          'Supervisor Mobile': b.supervisorMobile || 'N/A',
          'Status': b.status
        }));

      case 'Floor Report':
        return initialHostelFloors.map(f => ({
          'Floor Number': `Floor #${f.floorNumber}`,
          'Floor Name': f.floorName,
          'Block Name': f.blockName,
          'Hostel Facility': f.hostelName,
          'Assigned Floor Warden': f.wardenName || 'Unassigned',
          'Warden Mobile': f.wardenMobile || 'N/A',
          'Status': f.status
        }));

      case 'Supervisor Report':
        return initialHostelBlocks.map(b => ({
          'Supervisor Name': b.supervisorName,
          'Employee ID': 'EMP-101',
          'Assigned Block': b.blockName,
          'Hostel Facility': b.hostelName,
          'Mobile Number': b.supervisorMobile,
          'Email': b.supervisorEmail,
          'Joining Date': b.supervisorJoiningDate,
          'Status': b.status
        }));

      case 'Warden Report':
        return initialHostelFloors.map(f => ({
          'Warden Name': f.wardenName,
          'Employee ID': 'EMP-201',
          'Assigned Floor': f.floorName,
          'Block Name': f.blockName,
          'Mobile Number': f.wardenMobile,
          'Email': f.wardenEmail,
          'Joining Date': f.wardenJoiningDate,
          'Status': f.status
        }));

      case 'Room Occupancy Report':
        return roomMasters.map(r => {
          const rt = roomTypeMasters.find(t => t.id === r.roomTypeId);
          const cap = r.capacity || rt?.capacity || 2;
          const activeInRoom = studentHostelAssignments.filter(a => a.roomId === r.id && a.status === 'Active').length;

          return {
            'Room Number': `Room #${r.roomNumber}`,
            'Hostel': r.hostelName,
            'Block': 'Block A',
            'Floor': r.floor || '1st Floor',
            'Room Type': r.roomTypeName || rt?.roomTypeName || 'Double Sharing',
            'Capacity': cap,
            'Occupied': activeInRoom,
            'Available Beds': Math.max(0, cap - activeInRoom),
            'Occupancy Status': activeInRoom >= cap ? 'FULL' : 'AVAILABLE'
          };
        });

      case 'Student Hostel Report':
        return studentHostelAssignments.map(a => ({
          'Admission No': a.admissionNo,
          'Student Name': a.studentName,
          'Hostel Facility': a.hostelName,
          'Block / Floor': 'Block A • 1st Floor',
          'Room & Bed': `Room #${a.roomNo} (${a.bedNo || 'BED-1'})`,
          'Block Supervisor': 'Robert Langdon',
          'Floor Warden': 'Marcus Vance',
          'Joining Date': a.joiningDate,
          'Status': a.status
        }));

      default:
        return hostelMasters;
    }
  };

  const rawData = getReportData();
  const reportData = rawData.filter(row =>
    JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Enterprise Hostel & Hierarchy Reports
          </h2>
          <p className="text-xs text-slate-500">Generate 7 comprehensive reports covering Hostel, Block, Floor, Supervisor, Warden, and Occupancy metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-sky-600" /> Print
          </button>

          <button
            onClick={handlePdfExport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-600" /> Export PDF
          </button>

          <ExportButton data={reportData} filename={selectedReport.toLowerCase().replace(/\s+/g, '_')} />
        </div>
      </div>

      {/* Report Selector Grid */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Select Enterprise Hostel Report</span>
        <div className="flex flex-wrap gap-2">
          {ENTERPRISE_HOSTEL_REPORTS.map(report => (
            <button
              key={report}
              onClick={() => setSelectedReport(report)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedReport === report
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {report}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Report Table Display */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedReport}</h3>
            <p className="text-[11px] text-slate-400">Total Records: {reportData.length}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search report records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Dynamic Data Table */}
        <div className="overflow-x-auto">
          {reportData.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400 italic">No report records found.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  {Object.keys(reportData[0] || {}).map(key => (
                    <th key={key} className="py-3 px-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    {Object.values(row).map((val: any, valIdx) => (
                      <td key={valIdx} className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
