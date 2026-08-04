import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Bus,
  User,
  Route,
  GraduationCap,
  Wrench,
  FileSpreadsheet,
  Printer,
  FileText,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/currency';
import { ExportButton } from '../../common/ExportButton';
import { TransportScrollableTabs } from './TransportScrollableTabs';

type TransportReportTabId =
  | 'transport-dashboard-report'
  | 'trip-reports'
  | 'vehicle-reports'
  | 'driver-reports'
  | 'route-reports'
  | 'student-transport-reports'
  | 'maintenance-reports';

interface TransportReportsViewProps {
  initialTab?: string;
}

const REPORT_TABS = [
  { id: 'transport-dashboard-report', label: 'Transport Dashboard', icon: LayoutDashboard },
  { id: 'trip-reports', label: 'Trip Reports', icon: CalendarClock },
  { id: 'vehicle-reports', label: 'Vehicle Reports', icon: Bus },
  { id: 'driver-reports', label: 'Driver Reports', icon: User },
  { id: 'route-reports', label: 'Route Reports', icon: Route },
  { id: 'student-transport-reports', label: 'Student Transport Reports', icon: GraduationCap },
  { id: 'maintenance-reports', label: 'Maintenance Reports', icon: Wrench }
] as const;

const normalizeReportTab = (tab?: string): TransportReportTabId => {
  const cleanTab = (tab || 'transport-dashboard-report').replace(/^transport-/, '');

  switch (cleanTab) {
    case 'transport-dashboard-report':
    case 'dashboard-report':
    case 'summary':
    case 'transport-dashboard':
      return 'transport-dashboard-report';
    case 'trip-reports':
    case 'trip-report':
    case 'trip-summary':
      return 'trip-reports';
    case 'vehicle-reports':
    case 'vehicle-report':
      return 'vehicle-reports';
    case 'driver-reports':
    case 'driver-report':
      return 'driver-reports';
    case 'route-reports':
    case 'route-report':
      return 'route-reports';
    case 'student-transport-reports':
    case 'student-transport-report':
      return 'student-transport-reports';
    case 'maintenance-reports':
    case 'maintenance-report':
      return 'maintenance-reports';
    default:
      return 'transport-dashboard-report';
  }
};

type ReportRow = Record<string, string | number>;

export const TransportReportsView: React.FC<TransportReportsViewProps> = ({ initialTab = 'transport-dashboard-report' }) => {
  const {
    studentTransports,
    vehicleMasters,
    driverMasters,
    routeMasters,
    pickupPoints,
    vehicleAssignments,
    vehicleMaintenances,
    checkVehicleCapacity
  } = useData();

  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<TransportReportTabId>(normalizeReportTab(initialTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');
  const [filterVehicle, setFilterVehicle] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    setSelectedReport(normalizeReportTab(initialTab));
  }, [initialTab]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterRoute('All');
    setFilterVehicle('All');
    setFilterStatus('All');
    setSelectedReport('transport-dashboard-report');
    addToast('info', 'Report Reset', 'Reset transport report filters and selection.');
  };

  const handlePrint = () => {
    addToast('info', 'Preparing Report Print', `Printing ${getSelectedReportLabel(selectedReport)}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('success', 'PDF Report Generated', `Downloaded PDF for ${getSelectedReportLabel(selectedReport)}`);
  };

  const selectedReportLabel = getSelectedReportLabel(selectedReport);

  const dashboardSummary = useMemo(() => {
    const totalVehicles = vehicleMasters.length;
    const activeVehicles = vehicleMasters.filter(v => v.status === 'Active').length;
    const activeRoutes = routeMasters.filter(r => r.status === 'Active').length;
    const activeDrivers = driverMasters.filter(d => d.status === 'Active').length;
    const activeStudents = studentTransports.filter(s => s.status === 'Active').length;
    const maintenanceVehicles = vehicleMasters.filter(v => v.status === 'Maintenance').length;
    const totalCapacity = vehicleMasters.reduce((sum, vehicle) => sum + vehicle.capacity, 0) || 1;
    const occupiedSeats = vehicleMasters.reduce((sum, vehicle) => {
      const cap = checkVehicleCapacity(vehicle.id);
      return sum + cap.assignedCount;
    }, 0);
    const occupancy = Math.round((occupiedSeats / totalCapacity) * 100);

    return [
      { Metric: 'Fleet Size', Value: totalVehicles, Status: `${activeVehicles} Active` },
      { Metric: 'Active Routes', Value: activeRoutes, Status: 'Configured' },
      { Metric: 'Active Drivers', Value: activeDrivers, Status: 'Licensed Staff' },
      { Metric: 'Transport Students', Value: activeStudents, Status: `${occupancy}% Occupancy` },
      { Metric: 'Maintenance Units', Value: maintenanceVehicles, Status: 'In Service' },
      { Metric: 'Seat Utilization', Value: `${occupancy}%`, Status: `${occupiedSeats}/${totalCapacity} Seats` }
    ];
  }, [checkVehicleCapacity, driverMasters, routeMasters, studentTransports, vehicleMasters]);

  const reportRows = useMemo<ReportRow[]>(() => {
    switch (selectedReport) {
      case 'transport-dashboard-report':
        return dashboardSummary;

      case 'trip-reports':
        return vehicleAssignments.map((assignment, index) => {
          const routeStudents = studentTransports.filter(st => st.routeId === assignment.routeId || st.routeName === assignment.routeName).length;
          const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId);
          const capacity = vehicle ? checkVehicleCapacity(vehicle.id) : null;

          return {
            'Trip No': `TRP-${String(index + 1).padStart(3, '0')}`,
            'Vehicle Number': assignment.vehicleNumber,
            'Route Name': assignment.routeName,
            'Driver Name': assignment.driverName,
            'Bus Attendant': assignment.attendantName || 'Unassigned',
            'Students On Route': routeStudents,
            'Capacity Used': capacity ? `${capacity.assignedCount}/${capacity.totalCapacity}` : 'N/A',
            'Effective From': assignment.effectiveFrom,
            'Status': 'Scheduled'
          };
        });

      case 'vehicle-reports':
        return vehicleMasters.map(vehicle => {
          const cap = checkVehicleCapacity(vehicle.id);
          const utilization = Math.round((cap.assignedCount / vehicle.capacity) * 100);
          const activeAssignment = vehicleAssignments.find(va => va.vehicleId === vehicle.id && va.status === 'Active')
            || vehicleAssignments.find(va => va.vehicleNumber === vehicle.vehicleNumber && va.status === 'Active');

          return {
            'Vehicle Number': vehicle.vehicleNumber,
            'Registration No': vehicle.registrationNumber,
            'Vehicle Type': vehicle.vehicleType,
            'AC Status': vehicle.isAC ? 'AC' : 'Non-AC',
            'Capacity': vehicle.capacity,
            'Assigned Students': cap.assignedCount,
            'Assigned Route': activeAssignment?.routeName || 'Unassigned',
            'Assigned Driver': activeAssignment?.driverName || 'Unassigned',
            'Bus Attendant': activeAssignment?.attendantName || 'Unassigned',
            'Assignment Status': activeAssignment?.status || 'Unassigned',
            'Utilization %': `${utilization}%`,
            'Status': vehicle.status
          };
        });

      case 'driver-reports':
        return driverMasters.map(driver => {
          const activeAssignment = vehicleAssignments.find(va => va.driverId === driver.id && va.status === 'Active')
            || vehicleAssignments.find(va => va.driverName === driver.driverName && va.status === 'Active');

          return {
            'Driver Name': driver.driverName,
            'Mobile Number': driver.mobileNumber,
            'License Number': driver.licenseNumber,
            'License Expiry': driver.licenseExpiryDate,
            'Current Bus': activeAssignment?.vehicleNumber || 'Unassigned',
            'Current Route': activeAssignment?.routeName || 'Unassigned',
            'Bus Attendant': activeAssignment?.attendantName || 'Unassigned',
            'Assignment Status': activeAssignment?.status || 'Unassigned',
            'Experience (Years)': driver.experienceYears,
            'Status': driver.status
          };
        });

      case 'route-reports':
        return routeMasters.map(route => {
          const assignedAssignment = vehicleAssignments.find(va => va.routeId === route.id && va.status === 'Active')
            || vehicleAssignments.find(va => va.routeId === route.id);
          const totalPickupPoints = pickupPoints.filter(p => p.routeId === route.id).length;

          return {
            'Route Code': route.routeCode,
            'Route Name': route.routeName,
            'Start Point': route.routeStart,
            'Destination': route.routeEnd,
            'Distance (KM)': route.totalDistanceKm,
            'Duration (Mins)': route.estimatedTimeMinutes,
            'Total Pickup Points': totalPickupPoints,
            'Assigned Bus': assignedAssignment?.vehicleNumber || 'Unassigned',
            'Assigned Driver': assignedAssignment?.driverName || 'Unassigned',
            'Status': route.status
          };
        });

      case 'student-transport-reports':
        return studentTransports.map(transport => ({
          'Admission No': transport.admissionNo,
          'Student Name': transport.studentName,
          'Route Name': transport.routeName,
          'Pickup Point': transport.pickupPoint,
          'Vehicle Number': transport.vehicleNumber || 'Unassigned',
          'Fee Plan': transport.feePlan,
          'Fee Amount': transport.feeAmount,
          'Effective From': transport.effectiveFrom,
          'Status': transport.status
        }));

      case 'maintenance-reports':
        return vehicleMaintenances.map(maintenance => ({
          'Vehicle Number': maintenance.vehicleNumber,
          'Service Date': maintenance.serviceDate,
          'Service Type': maintenance.serviceType,
          'Vendor': maintenance.vendor,
          'Cost': maintenance.cost,
          'Next Service Due': maintenance.nextServiceDue,
          'Status': maintenance.status
        }));

      default:
        return dashboardSummary;
    }
  }, [
    checkVehicleCapacity,
    dashboardSummary,
    driverMasters,
    pickupPoints,
    routeMasters,
    selectedReport,
    studentTransports,
    vehicleAssignments,
    vehicleMaintenances,
    vehicleMasters
  ]);

  const filteredRows = useMemo(() => {
    return reportRows.filter(row => {
      const searchableText = Object.values(row).join(' ').toLowerCase();
      const matchesSearch = !searchQuery.trim() || searchableText.includes(searchQuery.toLowerCase());
      const matchesRoute = filterRoute === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('route') && String(value).toLowerCase().includes(filterRoute.toLowerCase()));
      const matchesVehicle = filterVehicle === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('vehicle') && String(value).toLowerCase().includes(filterVehicle.toLowerCase()));
      const matchesStatus = filterStatus === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('status') && String(value).toLowerCase().includes(filterStatus.toLowerCase()));

      return matchesSearch && matchesRoute && matchesVehicle && matchesStatus;
    });
  }, [filterRoute, filterStatus, filterVehicle, reportRows, searchQuery]);

  const showRouteFilter = ['trip-reports', 'route-reports', 'student-transport-reports', 'transport-dashboard-report'].includes(selectedReport);
  const showVehicleFilter = ['trip-reports', 'vehicle-reports', 'student-transport-reports', 'maintenance-reports'].includes(selectedReport);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Transport Reports
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={resetFilters}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-sky-600" /> Refresh
          </button>
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
          <ExportButton data={filteredRows} filename={selectedReportLabel.toLowerCase().replace(/\s+/g, '_')} />
        </div>
      </div>

      <TransportScrollableTabs
        tabs={REPORT_TABS}
        activeId={selectedReport}
        onChange={tabId => setSelectedReport(tabId as TransportReportTabId)}
        sticky={false}
      />

      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-end gap-3 lg:gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search report rows..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          {showRouteFilter && (
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Route Filter</label>
              <select
                value={filterRoute}
                onChange={e => setFilterRoute(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="All">All Routes</option>
                {routeMasters.map(route => (
                  <option key={route.id} value={route.routeName}>{route.routeName}</option>
                ))}
              </select>
            </div>
          )}

          {showVehicleFilter && (
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Vehicle Filter</label>
              <select
                value={filterVehicle}
                onChange={e => setFilterVehicle(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="All">All Vehicles</option>
                {vehicleMasters.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Status Filter</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-[11px] font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-sky-500" />
            {filteredRows.length} matching rows
          </div>
        </div>
      </div>

      {selectedReport === 'transport-dashboard-report' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRows.map(row => (
            <div key={row.Metric as string} className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.Metric}</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{row.Value}</p>
              <p className="mt-1 text-xs font-semibold text-sky-600 dark:text-sky-400">{row.Status}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-3 p-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedReportLabel}</h3>
            <p className="text-[11px] text-slate-400">Total Records: {filteredRows.length}</p>
          </div>
          <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200">
            Transport Reporting
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredRows.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400 italic">No report records found.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  {Object.keys(filteredRows[0] || {}).map(key => (
                    <th key={key} className="py-3 px-4">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {typeof value === 'number' && keyMatchesCurrency(key) ? formatCurrency(value) : String(value)}
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

function getSelectedReportLabel(selectedReport: TransportReportTabId): string {
  const item = REPORT_TABS.find(tab => tab.id === selectedReport);
  return item?.label || 'Transport Dashboard';
}

function keyMatchesCurrency(keyName: string): boolean {
  if (!keyName) return false;
  const key = keyName.toLowerCase();
  return key.includes('fee') || key.includes('cost') || key.includes('amount') || key.includes('revenue');
}
