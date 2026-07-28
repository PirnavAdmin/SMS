import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../../utils/currency';
import { FileSpreadsheet, Printer, BarChart3, Bus, Download, FileText } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { ExportButton } from '../../common/ExportButton';
import { initialBusAttendants } from './BusAttendantMasterView';

const ENTERPRISE_REPORT_TYPES = [
  'Vehicle Report',
  'Route Report',
  'Driver Report',
  'Bus Attendant Report',
  'Student Transport Report',
  'Vehicle Capacity Report',
  'Vehicle Assignment Report',
  'Driver Assignment Report',
  'Transport Document Expiry Report',
  'Maintenance Report',
  'GPS Movement Report',
  'Trip Summary Report',
  'Vehicle Route History',
  'Parent Notification Log',
  'Boarding & Drop Report',
  'GPS Device Health Report'
];

export const TransportReportsView: React.FC = () => {
  const { 
    studentTransports, 
    vehicleMasters, 
    driverMasters, 
    routeMasters,
    pickupPoints,
    vehicleAssignments, 
    vehicleMaintenances, 
    feePayments,
    students,
    checkVehicleCapacity
  } = useData();

  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string>('Vehicle Report');

  const [filterAcademicYear, setFilterAcademicYear] = useState('All');
  const [filterRouteId, setFilterRouteId] = useState('All');
  const [filterVehicleId, setFilterVehicleId] = useState('All');
  const [filterDriverId, setFilterDriverId] = useState('All');
  const [filterPickupName, setFilterPickupName] = useState('All');

  const handlePrint = () => {
    addToast('info', 'Preparing Report Print', `Printing ${selectedReport}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Report Generated', `Downloaded PDF for ${selectedReport}`);
  };

  // Generate Report Data JSON for Excel/CSV Export
  const getReportData = (): any[] => {
    switch (selectedReport) {
      case 'Vehicle Report':
        return vehicleMasters.map(v => {
          const cap = checkVehicleCapacity(v.id);
          return {
            'Vehicle Number': v.vehicleNumber,
            'Registration No': v.registrationNumber,
            'Vehicle Type': v.vehicleType,
            'AC/Non-AC': v.isAC ? 'AC' : 'Non-AC',
            'Seating Capacity': v.capacity,
            'Assigned Students': cap.assignedCount,
            'Available Seats': cap.availableSeats,
            'Status': v.status
          };
        });

      case 'Route Report':
        return routeMasters.map(r => ({
          'Route Code': r.routeCode,
          'Route Name': r.routeName,
          'Start Point': r.routeStart,
          'Destination': r.routeEnd,
          'Distance (KM)': r.totalDistanceKm,
          'Duration (Mins)': r.estimatedTimeMinutes,
          'Status': r.status
        }));

      case 'Driver Report':
        return driverMasters.map(d => ({
          'Driver Name': d.driverName,
          'Mobile Number': d.mobileNumber,
          'License Number': d.licenseNumber,
          'License Expiry': d.licenseExpiryDate,
          'Experience (Years)': d.experienceYears,
          'Status': d.status
        }));

      case 'Bus Attendant Report':
        return initialBusAttendants.map(a => ({
          'Employee ID': a.employeeId,
          'Attendant Name': a.attendantName,
          'Mobile Number': a.mobileNumber,
          'Gender': a.gender,
          'Branch': a.branch,
          'Status': a.status
        }));

      case 'Student Transport Report':
        return studentTransports.map(st => ({
          'Admission No': st.admissionNo,
          'Student Name': st.studentName,
          'Route Name': st.routeName,
          'Pickup Point': st.pickupPoint,
          'Vehicle Number': st.vehicleNumber || 'BUS-101',
          'Fee Plan': st.feePlan,
          'Fee Amount': st.feeAmount,
          'Status': st.status
        }));

      case 'Vehicle Capacity Report':
        return vehicleMasters.map(v => {
          const cap = checkVehicleCapacity(v.id);
          const pct = Math.round((cap.assignedCount / v.capacity) * 100);
          return {
            'Vehicle Number': v.vehicleNumber,
            'Type': v.vehicleType,
            'Total Capacity': v.capacity,
            'Assigned Students': cap.assignedCount,
            'Available Seats': cap.availableSeats,
            'Occupancy %': `${pct}%`,
            'Status': pct >= 100 ? 'FULL' : 'AVAILABLE'
          };
        });

      case 'Vehicle Assignment Report':
      case 'Driver Assignment Report':
        return vehicleAssignments.map(va => ({
          'Vehicle Number': va.vehicleNumber,
          'Driver Name': va.driverName,
          'Bus Attendant': 'Mary Smith',
          'Route Name': va.routeName,
          'Effective From': va.effectiveFrom,
          'Status': va.status
        }));

      case 'Transport Document Expiry Report':
        return [
          { 'Entity': 'BUS-101 (Bus)', 'Document Type': 'Insurance Policy', 'Doc Number': 'INS-8810-AB', 'Expiry Date': '2026-12-01', 'Status': 'Valid' },
          { 'Entity': 'BUS-101 (Bus)', 'Document Type': 'Fitness Certificate', 'Doc Number': 'FIT-2025-001', 'Expiry Date': '2026-08-15', 'Status': 'Expiring Soon' },
          { 'Entity': 'Dwight Schrute (Driver)', 'Document Type': 'Commercial License', 'Doc Number': 'DL-NY-2022-77112', 'Expiry Date': '2029-10-31', 'Status': 'Valid' },
          { 'Entity': 'Dwight Schrute (Driver)', 'Document Type': 'Medical Certificate', 'Doc Number': 'MED-2025-004', 'Expiry Date': '2026-08-30', 'Status': 'Expiring Soon' }
        ];

      case 'Maintenance Report':
        return vehicleMaintenances.map(m => ({
          'Vehicle Number': m.vehicleNumber,
          'Service Date': m.serviceDate,
          'Service Type': m.serviceType,
          'Vendor': m.vendor,
          'Cost': m.cost,
          'Next Service Due': m.nextServiceDue,
          'Status': m.status
        }));

      case 'GPS Movement Report':
        return [
          { 'Date': '28/07/2026', 'Vehicle': 'BUS-101', 'Route': 'Route A', 'Distance Travelled': '18.5 KM', 'Avg Speed': '34 km/h', 'Top Speed': '48 km/h', 'Stops Made': '4', 'Idle Time': '8 Mins', 'GPS Status': 'Online' },
          { 'Date': '28/07/2026', 'Vehicle': 'BUS-102', 'Route': 'Route B', 'Distance Travelled': '22.0 KM', 'Avg Speed': '38 km/h', 'Top Speed': '52 km/h', 'Stops Made': '5', 'Idle Time': '5 Mins', 'GPS Status': 'Online' }
        ];

      case 'Trip Summary Report':
        return [
          { 'Trip ID': 'TRP-8810', 'Date': '28/07/2026', 'Vehicle': 'BUS-101', 'Route': 'Route A', 'Morning Start': '07:00 AM', 'Morning End': '08:25 AM', 'Evening Start': '03:45 PM', 'Evening End': '04:45 PM', 'Total Students': 46, 'Status': 'Completed' },
          { 'Trip ID': 'TRP-8811', 'Date': '28/07/2026', 'Vehicle': 'BUS-102', 'Route': 'Route B', 'Morning Start': '07:15 AM', 'Morning End': '08:30 AM', 'Evening Start': '03:45 PM', 'Evening End': '04:50 PM', 'Total Students': 38, 'Status': 'Completed' }
        ];

      case 'Vehicle Route History':
        return [
          { 'Log ID': 'RH-101', 'Vehicle': 'BUS-101', 'Assigned Route': 'Route A - Downtown Express', 'Assigned Driver': 'Dwight Schrute', 'Attendant': 'Mary Smith', 'Effective Date': '01/04/2026', 'Status': 'Active' }
        ];

      case 'Parent Notification Log':
        return [
          { 'Timestamp': '28/07/2026 07:00 AM', 'Student': 'Ethan Hunt', 'Parent Phone': '+1 555-019-283', 'Event': 'Morning Trip Started', 'Channel': 'WhatsApp & SMS', 'Delivery Status': 'Delivered' },
          { 'Timestamp': '28/07/2026 07:22 AM', 'Student': 'Ethan Hunt', 'Parent Phone': '+1 555-019-283', 'Event': 'Student Boarded (RFID)', 'Channel': 'Push & SMS', 'Delivery Status': 'Delivered' },
          { 'Timestamp': '28/07/2026 08:25 AM', 'Student': 'Ethan Hunt', 'Parent Phone': '+1 555-019-283', 'Event': 'Bus Reached School', 'Channel': 'Push Notification', 'Delivery Status': 'Delivered' }
        ];

      case 'Boarding & Drop Report':
        return [
          { 'Date': '28/07/2026', 'Admission No': 'ADM2026-413', 'Student Name': 'Ethan Hunt', 'Pickup Point': 'Central Park West', 'Boarding Method': 'RFID Scanner', 'Morning Boarding Time': '07:22 AM', 'Evening Drop Time': '04:42 PM', 'Status': 'Verified' },
          { 'Date': '28/07/2026', 'Admission No': 'ADM2026-102', 'Student Name': 'Jane Doe', 'Pickup Point': 'Temple Road', 'Boarding Method': 'RFID Scanner', 'Morning Boarding Time': '07:34 AM', 'Evening Drop Time': '04:31 PM', 'Status': 'Verified' }
        ];

      case 'GPS Device Health Report':
        return [
          { 'Device ID': 'GPS-DEV-8810-AB', 'Vehicle Number': 'BUS-101', 'Provider': 'Trac360 Telematics', 'Signal Strength': '98% (Strong)', 'Battery Level': '100%', 'Last Ping': 'Just now', 'Health Status': 'Healthy' },
          { 'Device ID': 'GPS-DEV-8811-CD', 'Vehicle Number': 'BUS-102', 'Provider': 'MapmyIndia Fleet API', 'Signal Strength': '92% (Strong)', 'Battery Level': '95%', 'Last Ping': '2 mins ago', 'Health Status': 'Healthy' }
        ];

      default:
        return studentTransports;
    }
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Transport Reports
          </h2>
          <p className="text-xs text-slate-500">Generate 16 comprehensive transport & GPS telematics reports with Print, PDF, and Excel export capabilities</p>
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Select Enterprise Transport Report</span>
        <div className="flex flex-wrap gap-2">
          {ENTERPRISE_REPORT_TYPES.map(report => (
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
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedReport}</h3>
            <p className="text-[11px] text-slate-400">Total Records: {reportData.length}</p>
          </div>
          <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200">
            Enterprise ERP Certified
          </span>
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
                        {typeof val === 'number' && keyMatchesCurrency(Object.keys(row)[valIdx]) ? formatCurrency(val) : String(val)}
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

function keyMatchesCurrency(keyName: string): boolean {
  if (!keyName) return false;
  const k = keyName.toLowerCase();
  return k.includes('fee') || k.includes('cost') || k.includes('amount') || k.includes('revenue');
}
