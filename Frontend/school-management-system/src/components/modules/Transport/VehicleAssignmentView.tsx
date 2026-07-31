import React, { useState } from 'react';
import {
  Layers, Plus, Search, Trash2, Edit, X, ArrowRight, UserCheck, Users,
  Bus, Route, History, Eye
} from 'lucide-react';
import { VehicleAssignment } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';
import { initialBusAttendants } from './BusAttendantMasterView';
import { VehicleTripDetailsModal } from './VehicleTripDetailsModal';

export interface VehicleAssignmentLogItem {
  id: string;
  vehicleNumber: string;
  driverName: string;
  attendantName: string;
  routeName: string;
  branch: string;
  academicYear: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'Active' | 'Historical';
}

export const initialAssignmentLogs: VehicleAssignmentLogItem[] = [
  {
    id: 'log-1',
    vehicleNumber: 'BUS-101',
    driverName: 'Dwight Schrute',
    attendantName: 'Mary Smith',
    routeName: 'Route A - Downtown Express',
    branch: 'Main Campus',
    academicYear: '2026-2027',
    effectiveFrom: '2026-04-01',
    status: 'Active'
  },
  {
    id: 'log-2',
    vehicleNumber: 'BUS-102',
    driverName: 'Jim Halpert',
    attendantName: 'Sarah Jenkins',
    routeName: 'Route B - North Campus Direct',
    branch: 'Main Campus',
    academicYear: '2026-2027',
    effectiveFrom: '2026-04-01',
    status: 'Active'
  },
  {
    id: 'log-3',
    vehicleNumber: 'BUS-101',
    driverName: 'Michael Scott',
    attendantName: 'Pam Beesly',
    routeName: 'Route A - Downtown Express',
    branch: 'Main Campus',
    academicYear: '2025-2026',
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
    status: 'Historical'
  }
];

type AssignmentFormState = {
  branch: string;
  academicYear: string;
  vehicleId: string;
  routeId: string;
  driverId: string;
  attendantId: string;
  morningTripTime: string;
  eveningTripTime: string;
  effectiveFrom: string;
  status: 'Active' | 'Inactive';
};

const formatTripTime = (value?: string) => {
  if (!value) return 'Not set';
  if (value.includes('AM') || value.includes('PM')) return value;

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

export const VehicleAssignmentView: React.FC = () => {
  const {
    vehicleAssignments,
    vehicleMasters,
    routeMasters,
    driverMasters,
    studentTransports,
    assignVehicleRouteDriver,
    removeVehicleAssignment,
    updateVehicleAssignment
  } = useData();
  const { selectedBranch } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'reassign'>('create');
  const [editingAssignment, setEditingAssignment] = useState<VehicleAssignment | null>(null);
  const [reassignSource, setReassignSource] = useState<VehicleAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<VehicleAssignment | null>(null);
  const [selectedTripAssignment, setSelectedTripAssignment] = useState<VehicleAssignment | null>(null);
  const [isTripDetailsOpen, setIsTripDetailsOpen] = useState(false);
  const [assignmentLogs, setAssignmentLogs] = useState<VehicleAssignmentLogItem[]>(initialAssignmentLogs);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [form, setForm] = useState<AssignmentFormState>({
    branch: selectedBranch || 'Main Campus',
    academicYear: getCurrentAcademicYear(),
    vehicleId: '',
    routeId: '',
    driverId: '',
    attendantId: '',
    morningTripTime: '07:00',
    eveningTripTime: '15:45',
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  const branchOptions = Array.from(new Set([
    selectedBranch || 'Main Campus',
    'Main Campus',
    'North Branch',
    'West Campus'
  ]));

  const academicYear = getCurrentAcademicYear();
  const academicYearOptions = Array.from(new Set([
    academicYear,
    `${Number(academicYear.split('-')[0]) - 1}-${Number(academicYear.split('-')[0])}`,
    `${Number(academicYear.split('-')[0]) + 1}-${Number(academicYear.split('-')[0]) + 2}`
  ]));

  const resolveAttendant = (assignment: VehicleAssignment) => {
    const attendant = initialBusAttendants.find(a =>
      a.id === assignment.attendantId ||
      a.attendantName === assignment.attendantName
    );

    return {
      id: attendant?.id || assignment.attendantId || '',
      name: assignment.attendantName || attendant?.attendantName || 'Unassigned',
      mobile: assignment.attendantMobile || attendant?.mobileNumber || ''
    };
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingAssignment(null);
    setReassignSource(null);
    setForm({
      branch: selectedBranch || 'Main Campus',
      academicYear: getCurrentAcademicYear(),
      vehicleId: vehicleMasters.find(v => v.status === 'Active')?.id || '',
      routeId: routeMasters.find(r => r.status === 'Active')?.id || '',
      driverId: driverMasters.find(d => d.status === 'Active')?.id || '',
      attendantId: initialBusAttendants.find(a => a.status === 'Active')?.id || '',
      morningTripTime: '07:00',
      eveningTripTime: '15:45',
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: VehicleAssignment) => {
    setModalMode('edit');
    setEditingAssignment(assignment);
    setReassignSource(null);
    setForm({
      branch: assignment.branch || selectedBranch || 'Main Campus',
      academicYear: assignment.academicYear || getCurrentAcademicYear(),
      vehicleId: assignment.vehicleId,
      routeId: assignment.routeId,
      driverId: assignment.driverId,
      attendantId: assignment.attendantId || '',
      morningTripTime: assignment.morningTripTime || '07:00',
      eveningTripTime: assignment.eveningTripTime || '15:45',
      effectiveFrom: assignment.effectiveFrom,
      status: assignment.status
    });
    setIsModalOpen(true);
  };

  const openReassignModal = (assignment: VehicleAssignment) => {
    setModalMode('reassign');
    setEditingAssignment(null);
    setReassignSource(assignment);
    setForm({
      branch: assignment.branch || selectedBranch || 'Main Campus',
      academicYear: assignment.academicYear || getCurrentAcademicYear(),
      vehicleId: assignment.vehicleId,
      routeId: assignment.routeId,
      driverId: assignment.driverId,
      attendantId: assignment.attendantId || '',
      morningTripTime: assignment.morningTripTime || '07:00',
      eveningTripTime: assignment.eveningTripTime || '15:45',
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenTripDetails = (assignment: VehicleAssignment) => {
    setSelectedTripAssignment(assignment);
    setIsTripDetailsOpen(true);
  };

  const filteredAssignments = vehicleAssignments.filter(assignment => {
    const attendant = resolveAttendant(assignment);

    const matchesSearch =
      assignment.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
      assignment.routeName.toLowerCase().includes(query.toLowerCase()) ||
      assignment.driverName.toLowerCase().includes(query.toLowerCase()) ||
      attendant.name.toLowerCase().includes(query.toLowerCase());

    const matchesRoute = routeFilter === 'All' || assignment.routeId === routeFilter || assignment.routeName === routeFilter;
    const matchesVehicle = vehicleFilter === 'All' || assignment.vehicleId === vehicleFilter || assignment.vehicleNumber === vehicleFilter;
    const matchesStatus = statusFilter === 'All' || assignment.status === statusFilter;

    return matchesSearch && matchesRoute && matchesVehicle && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicle = vehicleMasters.find(v => v.id === form.vehicleId);
    const route = routeMasters.find(r => r.id === form.routeId);
    const driver = driverMasters.find(d => d.id === form.driverId);
    const attendant = initialBusAttendants.find(a => a.id === form.attendantId);

    if (!vehicle || !route || !driver) {
      addToast('warning', 'Incomplete Form', 'Select active vehicle, route, and driver before saving.');
      return;
    }

    if (vehicle.status === 'Inactive' || vehicle.status === 'Maintenance') {
      addToast('warning', 'Inactive Vehicle', `Cannot assign ${vehicle.vehicleNumber} because its status is ${vehicle.status}.`);
      return;
    }

    if (driver.status !== 'Active') {
      addToast('warning', 'Inactive Driver', `Cannot assign ${driver.driverName} because its status is ${driver.status}.`);
      return;
    }

    if (attendant && attendant.status !== 'Active') {
      addToast('warning', 'Inactive Bus Attendant', `Cannot assign ${attendant.attendantName} because its status is ${attendant.status}.`);
      return;
    }

    const attendantName = attendant?.attendantName || 'Unassigned';
    const attendantMobile = attendant?.mobileNumber || '';
    const assignedStudents = studentTransports.filter(st => st.routeId === route.id || st.routeName === route.routeName).length;
    const gpsStatus: 'Online' | 'Offline' = vehicle.gpsDeviceId ? 'Online' : 'Offline';

    const payload: Omit<VehicleAssignment, 'id'> = {
      branch: form.branch,
      academicYear: form.academicYear,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      routeId: route.id,
      routeName: route.routeName,
      driverId: driver.id,
      driverName: driver.driverName,
      attendantId: attendant?.id,
      attendantName,
      attendantMobile,
      morningTripTime: form.morningTripTime,
      eveningTripTime: form.eveningTripTime,
      vehicleCapacity: vehicle.capacity,
      assignedStudents,
      gpsStatus,
      effectiveFrom: form.effectiveFrom,
      status: form.status
    };

    if (modalMode === 'edit' && editingAssignment) {
      await updateVehicleAssignment(editingAssignment.id, {
        ...payload,
        effectiveTo: editingAssignment.effectiveTo
      });
      setAssignmentLogs(prev => [
        {
          id: `log-${Date.now()}`,
          vehicleNumber: vehicle.vehicleNumber,
          driverName: driver.driverName,
          attendantName,
          routeName: route.routeName,
          branch: form.branch,
          academicYear: form.academicYear,
          effectiveFrom: form.effectiveFrom,
          status: 'Active' as const
        },
        ...prev
      ]);
      addToast('success', 'Assignment Updated', `Updated ${vehicle.vehicleNumber} on ${route.routeName}.`);
      setIsModalOpen(false);
      return;
    }

    if (modalMode === 'reassign' && reassignSource) {
      await updateVehicleAssignment(reassignSource.id, {
        status: 'Inactive',
        effectiveTo: form.effectiveFrom
      });

      await assignVehicleRouteDriver(payload);
      setAssignmentLogs(prev => [
        ...prev.map(log =>
          log.vehicleNumber === reassignSource.vehicleNumber && log.status === 'Active'
            ? { ...log, status: 'Historical' as const, effectiveTo: form.effectiveFrom }
            : log
        ),
        {
          id: `log-${Date.now()}`,
          vehicleNumber: vehicle.vehicleNumber,
          driverName: driver.driverName,
          attendantName,
          routeName: route.routeName,
          branch: form.branch,
          academicYear: form.academicYear,
          effectiveFrom: form.effectiveFrom,
          status: 'Active' as const
        }
      ]);
      addToast('success', 'Assignment Reassigned', `Reassigned ${vehicle.vehicleNumber} to ${route.routeName}.`);
      setIsModalOpen(false);
      return;
    }

    await assignVehicleRouteDriver(payload);
    setAssignmentLogs(prev => [
      {
        id: `log-${Date.now()}`,
        vehicleNumber: vehicle.vehicleNumber,
        driverName: driver.driverName,
        attendantName,
        routeName: route.routeName,
        branch: form.branch,
        academicYear: form.academicYear,
        effectiveFrom: form.effectiveFrom,
        status: 'Active' as const
      },
      ...prev
    ]);
    addToast('success', 'Assignment Created', `Assigned ${vehicle.vehicleNumber} to ${route.routeName}.`);
    setIsModalOpen(false);
  };

  const currentAssignments = filteredAssignments.map(assignment => {
    const vehicle = vehicleMasters.find(v => v.id === assignment.vehicleId || v.vehicleNumber === assignment.vehicleNumber);
    const route = routeMasters.find(r => r.id === assignment.routeId || r.routeName === assignment.routeName);
    const driver = driverMasters.find(d => d.id === assignment.driverId || d.driverName === assignment.driverName);
    const attendant = resolveAttendant(assignment);
    const capacity = assignment.vehicleCapacity || vehicle?.capacity || 50;
    const assignedStudents = assignment.assignedStudents ?? studentTransports.filter(st => st.routeId === assignment.routeId || st.routeName === assignment.routeName).length;

    return {
      assignment,
      vehicle,
      route,
      driver,
      attendant,
      capacity,
      assignedStudents,
      morningTripTime: formatTripTime(assignment.morningTripTime || '07:00'),
      eveningTripTime: formatTripTime(assignment.eveningTripTime || '15:45')
    };
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-500" /> Vehicle Assignment
          </h2>
          <p className="text-xs text-slate-500">
            Assign branch, route, vehicle, driver, attendant, and trip timings on one screen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
          <ExportButton data={filteredAssignments} filename="vehicle_assignments" />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Assignments ({currentAssignments.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Assignment History Log ({assignmentLogs.length})
        </button>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between overflow-x-auto w-full">
        <div className="relative w-full xl:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by vehicle, driver, attendant, or route..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            value={routeFilter}
            onChange={e => setRouteFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Routes</option>
            {routeMasters.map(route => <option key={route.id} value={route.id}>{route.routeName}</option>)}
          </select>

          <select
            value={vehicleFilter}
            onChange={e => setVehicleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Vehicles</option>
            {vehicleMasters.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {activeTab === 'current' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Bus Number</th>
                  <th className="py-3.5 px-4">Route Name</th>
                  <th className="py-3.5 px-4">Driver Name</th>
                  <th className="py-3.5 px-4">Bus Attendant</th>
                  <th className="py-3.5 px-4">Vehicle Capacity</th>
                  <th className="py-3.5 px-4">Assigned Students</th>
                  <th className="py-3.5 px-4">Morning Trip</th>
                  <th className="py-3.5 px-4">Evening Trip</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Effective Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {currentAssignments.map(({ assignment, vehicle, route, driver, attendant, capacity, assignedStudents, morningTripTime, eveningTripTime }) => (
                  <tr key={assignment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{assignment.vehicleNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-sky-600 dark:text-sky-400">{assignment.routeName}</div>
                      <div className="text-[10px] text-slate-400">
                        {assignment.branch || 'Main Campus'} - {assignment.academicYear || getCurrentAcademicYear()}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{driver?.driverName || assignment.driverName}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                      {attendant.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{capacity}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{assignedStudents}</td>
                    <td className="py-3 px-4 font-mono text-sky-600 font-bold">{morningTripTime}</td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-bold">{eveningTripTime}</td>
                    <td className="py-3 px-4">
                      <Badge variant={assignment.status === 'Active' ? 'success' : 'neutral'} size="sm">
                        {assignment.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{assignment.effectiveFrom}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenTripDetails(assignment)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => openEditModal(assignment)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-200 flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => openReassignModal(assignment)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px] hover:bg-amber-100 flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> Reassign
                        </button>
                        <button
                          onClick={() => setDeletingAssignment(assignment)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px] hover:bg-rose-100 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Route</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Attendant</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Academic Year</th>
                  <th className="py-3.5 px-4">Assignment Period</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {assignmentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{log.vehicleNumber}</td>
                    <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">{log.routeName}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.driverName}</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">{log.attendantName}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{log.branch}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.academicYear}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.effectiveFrom}{log.effectiveTo ? ` to ${log.effectiveTo}` : ' (Current)'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={log.status === 'Active' ? 'success' : 'neutral'} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {modalMode === 'create' && 'Create Vehicle Assignment'}
                  {modalMode === 'edit' && 'Edit Vehicle Assignment'}
                  {modalMode === 'reassign' && 'Reassign Vehicle'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign branch, route, bus, driver, attendant, and trip timings in one place.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Branch *</label>
                <select
                  value={form.branch}
                  onChange={e => setForm(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  {branchOptions.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Academic Year *</label>
                <select
                  value={form.academicYear}
                  onChange={e => setForm(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  {academicYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Route *</label>
                <select
                  value={form.routeId}
                  onChange={e => setForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="" disabled>-- Select a Route --</option>
                  {routeMasters.filter(route => route.status === 'Active').map(route => (
                    <option key={route.id} value={route.id}>{route.routeName} ({route.routeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Active Vehicle *</label>
                <select
                  value={form.vehicleId}
                  onChange={e => setForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="" disabled>-- Select a Vehicle --</option>
                  {vehicleMasters.filter(vehicle => vehicle.status === 'Active').map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber} ({vehicle.registrationNumber} - {vehicle.capacity} Seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Licensed Driver *</label>
                <select
                  value={form.driverId}
                  onChange={e => setForm(prev => ({ ...prev, driverId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="" disabled>-- Select a Driver --</option>
                  {driverMasters.filter(driver => driver.status === 'Active').map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.driverName} ({driver.mobileNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Bus Attendant *</label>
                <select
                  value={form.attendantId}
                  onChange={e => setForm(prev => ({ ...prev, attendantId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="" disabled>-- Select a Bus Attendant --</option>
                  {initialBusAttendants.filter(attendant => attendant.status === 'Active').map(attendant => (
                    <option key={attendant.id} value={attendant.id}>{attendant.attendantName} ({attendant.employeeId} - {attendant.mobileNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Morning Trip Time</label>
                <input
                  type="time"
                  value={form.morningTripTime}
                  onChange={e => setForm(prev => ({ ...prev, morningTripTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Evening Trip Time</label>
                <input
                  type="time"
                  value={form.eveningTripTime}
                  onChange={e => setForm(prev => ({ ...prev, eveningTripTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Effective From Date</label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={e => setForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20"
                >
                  {modalMode === 'create' && 'Create Assignment'}
                  {modalMode === 'edit' && 'Update Assignment'}
                  {modalMode === 'reassign' && 'Reassign Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <VehicleTripDetailsModal
        assignment={selectedTripAssignment}
        isOpen={isTripDetailsOpen}
        onClose={() => setIsTripDetailsOpen(false)}
      />

      <ConfirmModal
        isOpen={!!deletingAssignment}
        onCancel={() => setDeletingAssignment(null)}
        onConfirm={async () => {
          if (!deletingAssignment) return;
          await removeVehicleAssignment(deletingAssignment.id);
          setAssignmentLogs(prev => prev.map(log =>
            log.vehicleNumber === deletingAssignment.vehicleNumber && log.status === 'Active'
              ? { ...log, status: 'Historical' as const, effectiveTo: new Date().toISOString().split('T')[0] }
              : log
          ));
          addToast('info', 'Assignment Removed');
          setDeletingAssignment(null);
        }}
        title="Remove Vehicle Assignment"
        message={`Remove assignment of ${deletingAssignment?.vehicleNumber} from ${deletingAssignment?.routeName}?`}
      />
    </div>
  );
};
