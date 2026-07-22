import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer, BarChart3, Bus, Download } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ExportButton } from '../../common/ExportButton';

const REPORT_TYPES = [
  'Vehicle-wise Transport Report',
  'Route-wise Student List',
  'Pickup Point-wise Students',
  'Vehicle-wise Students',
  'Driver-wise Vehicles',
  'Seat Occupancy Report',
  'Transport Fee Collection',
  'Pending Transport Fees',
  'Monthly Revenue',
  'Route Revenue Summary',
  'Vehicle Maintenance Report'
];

export const TransportReportsView: React.FC = () => {
  const { 
    studentTransports, 
    vehicleMasters, 
    driverMasters, 
    vehicleAssignments, 
    vehicleMaintenances, 
    feePayments,
    students
  } = useData();

  const [selectedReport, setSelectedReport] = useState<string>('Vehicle-wise Transport Report');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Set default vehicle ID when vehicleMasters load
  useEffect(() => {
    if (vehicleMasters.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicleMasters[0].id);
    }
  }, [vehicleMasters, selectedVehicleId]);

  // Calculations for Vehicle-wise Transport Report
  const selectedVehicleObj = vehicleMasters.find(v => v.id === selectedVehicleId);
  const activeAssignment = vehicleAssignments.find(a => a.vehicleId === selectedVehicleId);
  
  const vehicleRouteName = activeAssignment ? activeAssignment.routeName : 'Unassigned';
  const vehicleDriverName = activeAssignment ? activeAssignment.driverName : 'Unassigned';
  const vehicleCapacity = selectedVehicleObj ? selectedVehicleObj.capacity : 0;

  // Filter students assigned to this route/vehicle
  const assignedStudents = studentTransports.filter(st => {
    if (st.status !== 'Active') return false;
    if (activeAssignment) {
      return st.routeId === activeAssignment.routeId || st.routeName === activeAssignment.routeName;
    }
    return false;
  });

  // Pickup point summary
  const pickupSummary: Record<string, number> = {};
  assignedStudents.forEach(st => {
    const stop = st.pickupPoint || 'Unspecified Point';
    pickupSummary[stop] = (pickupSummary[stop] || 0) + 1;
  });

  // Student list details
  const vehicleStudentsList = assignedStudents.map(st => {
    const sObj = students.find(s => s.id === st.studentId);
    return {
      admissionNo: st.admissionNo,
      studentName: st.studentName,
      className: sObj ? `${sObj.className}-${sObj.section}` : 'N/A',
      pickupPoint: st.pickupPoint
    };
  });

  const getReportData = (): any[] => {
    switch (selectedReport) {
      case 'Vehicle-wise Transport Report':
        return vehicleStudentsList.map(s => ({
          admissionNo: s.admissionNo,
          studentName: s.studentName,
          class: s.className,
          pickupPoint: s.pickupPoint
        }));
      case 'Route-wise Student List':
        return studentTransports.map(st => ({ student: st.studentName, admNo: st.admissionNo, route: st.routeName, stop: st.pickupPoint, feePlan: st.feePlan }));
      case 'Pickup Point-wise Students':
        return studentTransports.map(st => ({ stop: st.pickupPoint, route: st.routeName, student: st.studentName, admNo: st.admissionNo }));
      case 'Vehicle-wise Students':
        return studentTransports.map(st => ({ vehicle: st.vehicleNumber || 'BUS-101', route: st.routeName, student: st.studentName, stop: st.pickupPoint }));
      case 'Driver-wise Vehicles':
        return vehicleAssignments.map(va => ({ driver: va.driverName, vehicle: va.vehicleNumber, route: va.routeName, effectiveFrom: va.effectiveFrom }));
      case 'Seat Occupancy Report':
        return vehicleMasters.map(v => {
          const assigned = studentTransports.filter(st => st.vehicleId === v.id && st.status === 'Active').length;
          return { vehicle: v.vehicleNumber, type: v.vehicleType, capacity: v.capacity, assignedStudents: assigned, availableSeats: Math.max(0, v.capacity - assigned), occupancyRate: `${Math.round((assigned / v.capacity) * 100)}%` };
        });
      case 'Transport Fee Collection':
        return feePayments.map(p => ({ receiptNo: p.receiptNo, student: p.studentName, transportAmount: p.transportFee || 0, date: p.paymentDate }));
      case 'Pending Transport Fees':
        return studentTransports.map(st => ({ student: st.studentName, route: st.routeName, feePlan: st.feePlan, feeAmount: st.feeAmount, status: 'Payment Due' }));
      case 'Vehicle Maintenance Report':
        return vehicleMaintenances.map(m => ({ vehicle: m.vehicleNumber, serviceType: m.serviceType, vendor: m.vendor, cost: m.cost, serviceDate: m.serviceDate, nextDue: m.nextServiceDue }));
      default:
        return studentTransports.map(st => ({ student: st.studentName, route: st.routeName, stop: st.pickupPoint, fee: st.feeAmount }));
    }
  };

  const reportData = getReportData();

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Transport Reports Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium">Generate vehicle and route-wise student transport summaries, audits, and occupancy lists</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200">
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <ExportButton data={reportData} filename={`report_${selectedReport.toLowerCase().replace(/\s+/g, '_')}`} />
        </div>
      </div>

      {/* Selector Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center gap-2">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt}
            onClick={() => setSelectedReport(rt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedReport === rt
                ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {rt}
          </button>
        ))}
      </div>

      {/* Report Render */}
      {selectedReport === 'Vehicle-wise Transport Report' ? (
        <div className="space-y-6">
          {/* Vehicle Dropdown Selector */}
          <div className="glass-card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                <Bus className="w-4 h-4 text-sky-500" /> Select Vehicle:
              </label>
              <select
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
                className="px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
              >
                <option value="">-- Select a Vehicle --</option>
                {vehicleMasters.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.vehicleType})</option>
                ))}
              </select>
            </div>
            
            <div className="text-xs text-slate-400 font-bold">
              Total Assigned Students: {assignedStudents.length}
            </div>
          </div>

          {/* Vehicle Details Card */}
          {selectedVehicleId && selectedVehicleObj ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Details */}
              <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-2">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400">Vehicle Number:</span>
                    <p className="font-black text-slate-800 dark:text-white">{selectedVehicleObj.vehicleNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Route Name:</span>
                    <p className="font-black text-sky-600">{vehicleRouteName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Driver Name:</span>
                    <p className="font-black text-slate-800 dark:text-white">{vehicleDriverName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Seat Capacity:</span>
                    <p className="font-black text-slate-800 dark:text-white">{vehicleCapacity} Seats (Occupied: {assignedStudents.length})</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Pickup Point Summary */}
              <div className="glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-2">Pickup Point Summary</h3>
                <div className="overflow-y-auto max-h-[150px]">
                  <table className="w-full text-left text-xs font-medium">
                    <thead>
                      <tr className="border-b text-slate-400">
                        <th className="pb-1.5 font-bold">Pickup Point</th>
                        <th className="pb-1.5 text-right font-bold">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {Object.keys(pickupSummary).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-slate-400">No student pickup allocations found for this vehicle route.</td>
                        </tr>
                      ) : (
                        Object.entries(pickupSummary).map(([stop, count]) => (
                          <tr key={stop} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2 font-bold text-slate-800 dark:text-white">{stop}</td>
                            <td className="py-2 text-right font-black text-sky-600">{count} Students</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student List Table */}
              <div className="md:col-span-2 glass-card p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-2">Student Passengers Directory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-extrabold uppercase border-b">
                        <th className="py-3 px-4">Admission No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Pickup Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-700 dark:text-slate-300">
                      {vehicleStudentsList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">No active students on this vehicle route.</td>
                        </tr>
                      ) : (
                        vehicleStudentsList.map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-mono text-slate-500">{st.admissionNo}</td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.studentName}</td>
                            <td className="py-3 px-4 text-indigo-600 dark:text-indigo-400">{st.className}</td>
                            <td className="py-3 px-4 font-extrabold">{st.pickupPoint}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-slate-400 rounded-3xl font-bold">
              Please select a vehicle from the dropdown above to load data.
            </div>
          )}
        </div>
      ) : (
        /* Other Reports Tables */
        <div className="glass-card p-6 rounded-3xl space-y-4 shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-500" /> {selectedReport}
            </h3>
            <span className="text-xs font-bold text-slate-500">Total Generated Records: {reportData.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  {Object.keys(reportData[0] || { Record: '' }).map(key => (
                    <th key={key} className="py-3 px-4 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No report records found.</td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      {Object.values(row).map((val: any, valIdx) => (
                        <td key={valIdx} className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {typeof val === 'number' ? `INR ${val.toLocaleString()}` : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
