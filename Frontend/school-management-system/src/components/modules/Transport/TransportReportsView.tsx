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
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { SchoolPrintHeader } from '../../common/SchoolPrintHeader';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency } from '../../../utils/currency';
import { ExportButton } from '../../common/ExportButton';
import { PrintDropdownMenu } from '../../common/PrintDropdownMenu';
import { Pagination } from '../../common/Pagination';
import { ValidatedSearchInput } from '../../common/ValidatedSearchInput';
import { validateSearchQuery } from '../../../utils/validation';
import { resolveAllActiveTransportStudents, resolveAssignedStudentsForTrip } from './transportData';
import { VehicleAssignment } from '../../../types';

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
    staff = [],
    students = [],
    studentTransports = [],
    vehicleMasters = [],
    driverMasters = [],
    routeMasters = [],
    pickupPoints = [],
    vehicleAssignments = [],
    vehicleMaintenances = [],
    admissions = [],
    checkVehicleCapacity
  } = useData();

  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<TransportReportTabId>(normalizeReportTab(initialTab));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');
  const [filterVehicle, setFilterVehicle] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setSelectedReport(normalizeReportTab(initialTab));
  }, [initialTab]);

  // Reset page to 1 whenever report type or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReport, searchQuery, filterRoute, filterVehicle, filterStatus]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterRoute('All');
    setFilterVehicle('All');
    setFilterStatus('All');
    setCurrentPage(1);
    setSelectedReport('transport-dashboard-report');
    addToast('info', 'Report Reset', 'Reset transport report filters and selection.');
  };

  const handlePrint = () => {
    addToast('info', 'Preparing Report Print', `Printing ${getSelectedReportLabel(selectedReport)}`);
    window.print();
  };

  const handlePdfExport = () => {
    addToast('info', 'Print / Save PDF', `Use your browser print dialog ("Save as PDF") for ${getSelectedReportLabel(selectedReport)}.`);
    window.print();
  };

  const selectedReportLabel = getSelectedReportLabel(selectedReport);

  // Dynamic Drivers (Merged from driverMasters and Staff with Driver role/designation)
  const dynamicDrivers = useMemo(() => {
    const list: Array<{ id: string; driverName: string; employeeId?: string; mobileNumber?: string; licenseNumber?: string; licenseExpiryDate?: string; experienceYears?: number; status: string }> = [];
    const seen = new Set<string>();

    (driverMasters || []).forEach(d => {
      if (d && d.driverName && d.driverName.trim() !== '') {
        const key = (d.employeeId || d.driverName).trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: String(d.id),
            driverName: d.driverName,
            employeeId: d.employeeId || (d.id ? String(d.id) : ''),
            mobileNumber: d.mobileNumber || '',
            licenseNumber: d.licenseNumber || '-',
            licenseExpiryDate: d.licenseExpiryDate || '-',
            experienceYears: d.experienceYears || 0,
            status: d.status || 'Active'
          });
        }
      }
    });

    (staff || []).forEach(s => {
      const isDriver =
        s.designation?.toLowerCase().includes('driver') ||
        s.department?.toLowerCase().includes('driver') ||
        (s as any).role?.toLowerCase().includes('driver');

      if (isDriver && s.firstName) {
        const fullName = `${s.firstName} ${s.lastName || ''}`.trim();
        const empId = s.empId || (s as any).employeeId || `EMP-${s.id}`;
        const key = empId.toLowerCase();
        const nameKey = fullName.toLowerCase();
        if (!seen.has(key) && !seen.has(nameKey)) {
          seen.add(key);
          seen.add(nameKey);
          list.push({
            id: `staff-${s.id}`,
            driverName: fullName,
            employeeId: empId,
            mobileNumber: s.phone || (s as any).mobileNumber || '',
            licenseNumber: (s as any).licenseNumber || '-',
            licenseExpiryDate: (s as any).licenseExpiryDate || '-',
            experienceYears: 5,
            status: s.status || 'Active'
          });
        }
      }
    });

    return list;
  }, [driverMasters, staff]);

  // Dynamic Students Using Transport (Unified resolver across all transport views)
  const dynamicTransportStudents = useMemo(() => {
    return resolveAllActiveTransportStudents({
      vehicleAssignments,
      studentTransports,
      students,
      admissions,
      routeMasters,
      pickupPoints,
      vehicleMasters
    }).map(s => ({
      id: s.id,
      admissionNo: s.admissionNo || '-',
      studentName: s.studentName || 'Student',
      routeName: s.routeName || 'Unassigned',
      pickupPoint: s.pickupPoint || '-',
      vehicleNumber: s.vehicleNumber || 'Unassigned',
      feePlan: s.feePlan || 'Monthly',
      feeAmount: s.feeAmount || 0,
      effectiveFrom: s.effectiveFrom || new Date().toISOString().split('T')[0],
      status: s.status || 'Active'
    }));
  }, [vehicleAssignments, studentTransports, students, admissions, routeMasters, pickupPoints, vehicleMasters]);

  const dashboardSummary = useMemo(() => {
    const totalVehicles = vehicleMasters.length;
    const activeVehicles = vehicleMasters.filter(v => v.status === 'Active').length;
    const activeRoutes = routeMasters.filter(r => r.status === 'Active').length;
    const activeDrivers = dynamicDrivers.filter(d => d.status === 'Active').length;
    const activeStudents = dynamicTransportStudents.filter(s => s.status === 'Active').length;
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
  }, [checkVehicleCapacity, dynamicDrivers, dynamicTransportStudents, routeMasters, vehicleMasters]);

  const reportRows = useMemo<ReportRow[]>(() => {
    switch (selectedReport) {
      case 'transport-dashboard-report':
        return dashboardSummary;

      case 'trip-reports': {
        const activeTripAssignments = (vehicleAssignments || []).filter(
          va => va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true'
        );
        const uniqueTripsMap = new Map<string, VehicleAssignment>();
        activeTripAssignments.forEach(va => {
          const key = (va.vehicleNumber ? va.vehicleNumber.trim().toUpperCase() : '') || String(va.vehicleId || va.id);
          if (!uniqueTripsMap.has(key)) {
            uniqueTripsMap.set(key, va);
          } else {
            const existing = uniqueTripsMap.get(key)!;
            const existingHasAttendant = existing.attendantName && existing.attendantName.toLowerCase() !== 'unassigned';
            const currentHasAttendant = va.attendantName && va.attendantName.toLowerCase() !== 'unassigned';
            if (!existingHasAttendant && currentHasAttendant) {
              uniqueTripsMap.set(key, va);
            }
          }
        });

        return Array.from(uniqueTripsMap.values()).map((assignment, index) => {
          const tripStudents = resolveAssignedStudentsForTrip(assignment, {
            studentTransports,
            students,
            admissions,
            routeMasters,
            pickupPoints,
            vehicleMasters
          });
          const routeStudents = tripStudents.length;
          const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
          const capacity = vehicle ? checkVehicleCapacity(vehicle.id) : null;

          return {
            'Trip No': `TRP-${String(index + 1).padStart(3, '0')}`,
            'Vehicle Number': assignment.vehicleNumber,
            'Route Name': assignment.routeName,
            'Driver Name': assignment.driverName,
            'Bus Attendant': assignment.attendantName || 'Unassigned',
            'Students On Route': routeStudents,
            'Capacity Used': capacity ? `${routeStudents}/${capacity.totalCapacity}` : 'N/A',
            'Effective From': formatDateForDisplay(assignment.effectiveFrom),
            'Status': assignment.status || 'Scheduled'
          };
        });
      }

      case 'vehicle-reports':
        return vehicleMasters.map(vehicle => {
          const cap = checkVehicleCapacity(vehicle.id);
          const utilization = vehicle.capacity > 0 ? Math.round((cap.assignedCount / vehicle.capacity) * 100) : 0;
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
        return dynamicDrivers.map(driver => {
          const activeAssignment = vehicleAssignments.find(va => va.driverId === driver.id && va.status === 'Active')
            || vehicleAssignments.find(va => va.driverName === driver.driverName && va.status === 'Active');

          return {
            'Driver Name': driver.driverName,
            'Employee ID': driver.employeeId || (driver.id ? String(driver.id) : '-'),
            'Mobile Number': driver.mobileNumber || '-',
            'License Number': driver.licenseNumber || '-',
            'License Expiry': formatDateForDisplay(driver.licenseExpiryDate),
            'Current Bus': activeAssignment?.vehicleNumber || 'Unassigned',
            'Current Route': activeAssignment?.routeName || 'Unassigned',
            'Bus Attendant': activeAssignment?.attendantName || 'Unassigned',
            'Assignment Status': activeAssignment?.status || 'Unassigned',
            'Experience (Years)': driver.experienceYears || 0,
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
        return dynamicTransportStudents.map(transport => ({
          'Admission No': transport.admissionNo,
          'Student Name': transport.studentName,
          'Route Name': transport.routeName,
          'Pickup Point': transport.pickupPoint,
          'Vehicle Number': transport.vehicleNumber || 'Unassigned',
          'Fee Plan': transport.feePlan,
          'Fee Amount': transport.feeAmount,
          'Effective From': formatDateForDisplay(transport.effectiveFrom),
          'Status': transport.status
        }));

      case 'maintenance-reports':
        return vehicleMaintenances.map(maintenance => ({
          'Vehicle Number': maintenance.vehicleNumber,
          'Service Date': formatDateForDisplay(maintenance.serviceDate),
          'Service Type': maintenance.serviceType,
          'Vendor': maintenance.vendor,
          'Cost': maintenance.cost,
          'Next Service Due': formatDateForDisplay(maintenance.nextServiceDue),
          'Status': maintenance.status
        }));

      default:
        return dashboardSummary;
    }
  }, [
    admissions,
    checkVehicleCapacity,
    dashboardSummary,
    driverMasters,
    pickupPoints,
    routeMasters,
    selectedReport,
    studentTransports,
    students,
    vehicleAssignments,
    vehicleMaintenances,
    vehicleMasters
  ]);

  const isSearchValid = useMemo(() => validateSearchQuery(searchQuery, 30).isValid, [searchQuery]);

  const filteredRows = useMemo(() => {
    if (!isSearchValid && searchQuery.trim()) {
      return [];
    }
    return reportRows.filter(row => {
      const searchableText = Object.values(row).join(' ').toLowerCase();
      const matchesSearch = !searchQuery.trim() || searchableText.includes(searchQuery.toLowerCase());
      const matchesRoute = filterRoute === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('route') && String(value).toLowerCase().includes(filterRoute.toLowerCase()));
      const matchesVehicle = filterVehicle === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('vehicle') && String(value).toLowerCase().includes(filterVehicle.toLowerCase()));
      const matchesStatus = filterStatus === 'All' || Object.entries(row).some(([key, value]) => key.toLowerCase().includes('status') && String(value).toLowerCase().includes(filterStatus.toLowerCase()));

      return matchesSearch && matchesRoute && matchesVehicle && matchesStatus;
    });
  }, [filterRoute, filterStatus, filterVehicle, isSearchValid, reportRows, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const showRouteFilter = ['trip-reports', 'route-reports', 'student-transport-reports', 'transport-dashboard-report'].includes(selectedReport);
  const showVehicleFilter = ['trip-reports', 'vehicle-reports', 'student-transport-reports', 'maintenance-reports'].includes(selectedReport);

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-500" /> Transport Reports
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <PrintDropdownMenu
            title={`Transport Report - ${selectedReportLabel}`}
            data={filteredRows}
            filename={selectedReportLabel.toLowerCase().replace(/\s+/g, '_')}
            onPrint={handlePrint}
            onPdf={handlePdfExport}
          />
        </div>
      </div>

      <div className="w-full sm:w-72 relative no-print">
        <label className="block text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Select Report Type
        </label>
        <div className="relative">
          {(() => {
            const activeTab = REPORT_TABS.find(t => t.id === selectedReport);
            const ActiveIcon = activeTab ? activeTab.icon : FileSpreadsheet;
            return <ActiveIcon className="w-4 h-4 text-sky-500 absolute left-3.5 top-3 pointer-events-none" />;
          })()}
          <select
            value={selectedReport}
            onChange={e => setSelectedReport(e.target.value as TransportReportTabId)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer appearance-none transition-all hover:border-sky-300 shadow-xs"
          >
            {REPORT_TABS.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 border border-slate-200/80 dark:border-slate-800 no-print">
        <div className="w-full sm:w-72">
          <ValidatedSearchInput
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search report rows..."
            maxLength={30}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 ml-auto sm:pt-0.5">
          {showRouteFilter && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Route Filter</label>
              <select
                value={filterRoute}
                onChange={e => setFilterRoute(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="All">All Routes</option>
                {routeMasters.map(route => (
                  <option key={route.id} value={route.routeName}>{route.routeName}</option>
                ))}
              </select>
            </div>
          )}

          {showVehicleFilter && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Vehicle Filter</label>
              <select
                value={filterVehicle}
                onChange={e => setFilterVehicle(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="All">All Vehicles</option>
                {vehicleMasters.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.vehicleNumber}>{vehicle.vehicleNumber}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Status Filter</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {selectedReport === 'transport-dashboard-report' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
          {filteredRows.map(row => (
            <div key={row.Metric as string} className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.Metric}</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{row.Value}</p>
              <p className="mt-1 text-xs font-semibold text-sky-600 dark:text-sky-400">{row.Status}</p>
            </div>
          ))}
        </div>
      )}

      <div id="printable-content" className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 p-4 sm:p-5">
        <SchoolPrintHeader title={`Transport Report - ${selectedReportLabel}`} subtitle={`Total Filtered Records: ${filteredRows.length}`} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200/70 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-2xs">
              {(() => {
                const activeTab = REPORT_TABS.find(t => t.id === selectedReport);
                const TabIcon = activeTab ? activeTab.icon : FileSpreadsheet;
                return <TabIcon className="w-5 h-5" />;
              })()}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {selectedReportLabel}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {filteredRows.length === 0
                  ? '0 records found'
                  : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredRows.length)} of ${filteredRows.length} records`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800/60 shadow-2xs">
              Transport Reporting
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          {filteredRows.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center mx-auto mb-3 border border-sky-100 dark:border-sky-900/60">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {!isSearchValid && searchQuery.trim() ? 'Invalid search query' : 'No report records found'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {!isSearchValid && searchQuery.trim()
                  ? 'Please enter a valid search term without gibberish or forbidden special characters.'
                  : 'No transport data matches your current search or filter criteria.'}
              </p>
              {(searchQuery || filterRoute !== 'All' || filterVehicle !== 'All' || filterStatus !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRoute('All');
                    setFilterVehicle('All');
                    setFilterStatus('All');
                  }}
                  className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-950 dark:hover:bg-sky-900 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer border border-sky-200 dark:border-sky-800 shadow-2xs active:scale-95"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-black uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  {Object.keys(filteredRows[0] || {}).map(key => {
                    const align = getColumnAlignment(key);
                    return (
                      <th
                        key={key}
                        className={`py-3.5 px-4 font-black ${
                          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
                        }`}
                      >
                        {key}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Screen View: Paginated Rows */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium print:hidden">
                {paginatedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {Object.entries(row).map(([key, value]) => {
                      const align = getColumnAlignment(key);
                      return (
                        <td
                          key={key}
                          className={`py-3 px-4 ${
                            align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
                          }`}
                        >
                          {renderReportCell(key, value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              {/* Print View: Full Dataset unpaginated */}
              <tbody className="divide-y divide-slate-300 font-medium hidden print:table-row-group text-slate-900">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    {Object.entries(row).map(([key, value]) => {
                      const align = getColumnAlignment(key);
                      return (
                        <td
                          key={key}
                          className={`py-2 px-3 text-xs ${
                            align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
                          }`}
                        >
                          {typeof value === 'number' && keyMatchesCurrency(key)
                            ? formatCurrency(value)
                            : formatDateForDisplay(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer with Integrated Pagination & Rows Selector */}
        {filteredRows.length > 0 && (
          <div className="pt-2 no-print print:hidden">
            <div className="px-4 py-3 border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white cursor-pointer outline-none shadow-2xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex-1 flex justify-end w-full sm:w-auto">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredRows.length}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                  showBorder={false}
                  className="pt-0 pb-0"
                  label="records"
                />
              </div>
            </div>
          </div>
        )}
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
  return key.includes('fee') || key.includes('cost') || key.includes('amount') || key.includes('revenue') || key.includes('price');
}

function formatDateForDisplay(val: unknown): string {
  if (!val || val === '-' || val === 'N/A' || val === 'Unassigned') return val ? String(val) : '-';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return str;
}

function getColumnAlignment(colKey: string): 'left' | 'center' | 'right' {
  const k = colKey.toLowerCase();
  if (k.includes('fee') || k.includes('cost') || k.includes('amount') || k.includes('revenue') || k.includes('price')) {
    return 'right';
  }
  if (
    k.includes('name') ||
    k.includes('route') ||
    k.includes('attendant') ||
    k.includes('point') ||
    k.includes('start') ||
    k.includes('destination') ||
    k.includes('vendor') ||
    k.includes('service type') ||
    k.includes('metric')
  ) {
    return 'left';
  }
  return 'center';
}

function renderReportCell(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-slate-400 italic">-</span>;
  }

  const strVal = String(value).trim();
  const lowerKey = key.toLowerCase();

  // Empty / Unassigned / Dash placeholder
  if (strVal === '-' || strVal === 'N/A' || strVal === 'Unassigned') {
    return (
      <span className="text-slate-400 dark:text-slate-500 italic text-xs font-normal">
        {strVal}
      </span>
    );
  }

  // AC Status
  if (lowerKey === 'ac status') {
    const isAC = strVal.toUpperCase() === 'AC';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
          isAC
            ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
        }`}
      >
        {strVal}
      </span>
    );
  }

  // Status or Assignment Status
  if (lowerKey.includes('status')) {
    const s = strVal.toLowerCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    let dotClass = 'bg-slate-400';

    if (s === 'active' || s === 'completed' || s === 'in service' || s === 'healthy') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      dotClass = 'bg-emerald-500';
    } else if (s === 'scheduled' || s === 'en route') {
      badgeClass = 'bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      dotClass = 'bg-sky-500';
    } else if (s === 'maintenance' || s === 'pending' || s === 'in repair') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      dotClass = 'bg-amber-500';
    } else if (s === 'inactive' || s === 'cancelled' || s === 'expired') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      dotClass = 'bg-rose-500';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${badgeClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotClass}`} />
        {strVal}
      </span>
    );
  }

  // Currency amounts
  if (typeof value === 'number' && keyMatchesCurrency(key)) {
    return (
      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
        {formatCurrency(value)}
      </span>
    );
  }

  // Capacity Used (e.g. "2/60")
  if (lowerKey === 'capacity used') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        {strVal}
      </span>
    );
  }

  // Utilization %
  if (lowerKey.includes('utilization')) {
    const num = parseInt(strVal, 10);
    const color = isNaN(num)
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : num >= 90
      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
      : num >= 70
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
        {strVal}
      </span>
    );
  }

  // Codes, Registration, Vehicles, Identifiers
  if (
    lowerKey === 'trip no' ||
    lowerKey === 'vehicle number' ||
    lowerKey === 'registration no' ||
    lowerKey === 'current bus' ||
    lowerKey === 'assigned bus' ||
    lowerKey === 'employee id' ||
    lowerKey === 'license number' ||
    lowerKey === 'route code' ||
    lowerKey === 'admission no'
  ) {
    return (
      <span className="font-mono font-bold tracking-tight text-slate-900 dark:text-white">
        {strVal}
      </span>
    );
  }

  // Dates
  if (
    lowerKey.includes('date') ||
    lowerKey.includes('expiry') ||
    lowerKey.includes('effective') ||
    lowerKey.includes('due') ||
    /^\d{4}-\d{2}-\d{2}/.test(strVal)
  ) {
    return (
      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
        {formatDateForDisplay(strVal)}
      </span>
    );
  }

  // Mobile / Phone Number
  if (lowerKey.includes('mobile') || lowerKey.includes('phone')) {
    return (
      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
        {strVal}
      </span>
    );
  }

  // Route Name
  if (lowerKey === 'route name') {
    return (
      <span className="capitalize font-bold text-slate-800 dark:text-slate-100">
        {strVal}
      </span>
    );
  }

  // Driver Name, Student Name, Attendant Name
  if (lowerKey.includes('name') || lowerKey.includes('attendant')) {
    return (
      <span className="font-semibold text-slate-900 dark:text-white">
        {strVal}
      </span>
    );
  }

  // Experience
  if (lowerKey.includes('experience')) {
    return (
      <span className="font-bold text-slate-800 dark:text-slate-200">
        {strVal} Yrs
      </span>
    );
  }

  // Numbers (count, capacity, distance, duration)
  if (typeof value === 'number') {
    return (
      <span className="font-bold text-slate-800 dark:text-slate-200">
        {value}
      </span>
    );
  }

  return (
    <span className="text-slate-800 dark:text-slate-200 font-medium">
      {strVal}
    </span>
  );
}
