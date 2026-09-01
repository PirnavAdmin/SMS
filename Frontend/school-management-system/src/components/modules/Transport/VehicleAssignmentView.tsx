import React, { useState, useEffect } from 'react';
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
import { Pagination } from '../../common/Pagination';
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

const initialAssignmentLogs: VehicleAssignmentLogItem[] = [];

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
    students = [],
    vehicleAssignments,
    vehicleMasters,
    routeMasters,
    driverMasters,
    studentTransports = [],
    busAttendants = [],
    assignVehicleRouteDriver,
    removeVehicleAssignment,
    updateVehicleAssignment
  } = useData();
  const { selectedBranch, selectedAcademicYear } = useAuth();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
    branch: (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses') ? selectedBranch : 'Main Campus',
    academicYear: selectedAcademicYear || getCurrentAcademicYear(),
    vehicleId: '',
    routeId: '',
    driverId: '',
    attendantId: '',
    morningTripTime: '07:00',
    eveningTripTime: '15:45',
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    if (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses') {
      setForm(prev => ({ ...prev, branch: selectedBranch }));
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedAcademicYear) {
      setForm(prev => ({ ...prev, academicYear: selectedAcademicYear }));
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (vehicleAssignments && vehicleAssignments.length > 0) {
      const logsMap = new Map<string, VehicleAssignmentLogItem>();

      vehicleAssignments.forEach(va => {
        const attendant = resolveAttendant(va);
        const route = routeMasters.find(r => r.id?.toString() === va.routeId?.toString() || r.routeName?.toLowerCase() === va.routeName?.toLowerCase());
        const resolvedRouteName = route?.routeName || (va.routeName && va.routeName.toUpperCase() !== 'N/A' ? va.routeName : '') || 'Unassigned Route';
        const hasValidRoute = resolvedRouteName !== 'Unassigned Route' && resolvedRouteName.toUpperCase() !== 'N/A';
        const isActive = va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true';

        const vehicleKey = va.vehicleNumber && va.vehicleNumber.trim() !== ''
          ? `${va.vehicleNumber.trim().toUpperCase()}-${isActive ? 'Active' : 'Hist'}`
          : `log-${va.id}`;

        const logItem: VehicleAssignmentLogItem = {
          id: `log-${va.id}`,
          vehicleNumber: va.vehicleNumber || 'Unassigned',
          driverName: va.driverName || 'Unassigned',
          attendantName: attendant.name || 'Unassigned',
          routeName: resolvedRouteName,
          branch: va.branch || selectedBranch || 'Main Campus',
          academicYear: va.academicYear || selectedAcademicYear || getCurrentAcademicYear(),
          effectiveFrom: (va.effectiveFrom || '').split('T')[0] || new Date().toISOString().split('T')[0],
          effectiveTo: va.effectiveTo ? (va.effectiveTo || '').split('T')[0] : undefined,
          status: isActive ? 'Active' : 'Historical'
        };

        if (!logsMap.has(vehicleKey)) {
          logsMap.set(vehicleKey, logItem);
        } else {
          const existing = logsMap.get(vehicleKey)!;
          const existingHasValidRoute = existing.routeName !== 'Unassigned Route' && existing.routeName.toUpperCase() !== 'N/A';
          if (!existingHasValidRoute && hasValidRoute) {
            logsMap.set(vehicleKey, logItem);
          }
        }
      });

      const dynamicLogs = Array.from(logsMap.values()).filter(log => {
        return (log.routeName !== 'Unassigned Route' && log.routeName.toUpperCase() !== 'N/A') || (log.vehicleNumber !== 'Unassigned' && log.vehicleNumber.trim() !== '');
      });

      setAssignmentLogs(dynamicLogs);
    } else {
      setAssignmentLogs([]);
    }
  }, [vehicleAssignments, busAttendants, routeMasters, selectedBranch, selectedAcademicYear]);

  const hasFilterSelection = routeFilter !== '' || query.trim() !== '';

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
    const attendant = busAttendants.find(a =>
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
      vehicleId: '',
      routeId: '',
      driverId: '',
      attendantId: '',
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
      status: 'Active'
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

  const rawFilteredAssignments = vehicleAssignments.filter(assignment => {
    const attendant = resolveAttendant(assignment);
    const selectedRouteObj = routeMasters.find(r => r.id === routeFilter || r.routeName === routeFilter || r.routeCode === routeFilter);

    const matchesSearch =
      query.trim() === '' ||
      assignment.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
      assignment.routeName.toLowerCase().includes(query.toLowerCase()) ||
      assignment.driverName.toLowerCase().includes(query.toLowerCase()) ||
      attendant.name.toLowerCase().includes(query.toLowerCase());

    const matchesRoute =
      routeFilter === '' ||
      routeFilter === 'All' ||
      assignment.routeId === routeFilter ||
      assignment.routeName === routeFilter ||
      (selectedRouteObj && (
        assignment.routeId === selectedRouteObj.id ||
        assignment.routeName === selectedRouteObj.routeName ||
        assignment.routeName === selectedRouteObj.routeCode ||
        (selectedRouteObj.routeName && assignment.routeName && selectedRouteObj.routeName.trim().toLowerCase() === assignment.routeName.trim().toLowerCase())
      ));

    return matchesSearch && matchesRoute;
  });

  const assignmentsByVehicleMap = new Map<string, VehicleAssignment>();

  rawFilteredAssignments.forEach(assignment => {
    const route = routeMasters.find(r => r.id?.toString() === assignment.routeId?.toString() || r.routeName?.toLowerCase() === assignment.routeName?.toLowerCase());
    const resolvedRouteName = (route?.routeName || assignment.routeName || '').trim();
    const hasValidRoute = resolvedRouteName !== '' && resolvedRouteName.toUpperCase() !== 'N/A';

    const vehicleKey = assignment.vehicleNumber && assignment.vehicleNumber.trim() !== ''
      ? assignment.vehicleNumber.trim().toUpperCase()
      : (assignment.vehicleId || assignment.id);

    if (!assignmentsByVehicleMap.has(vehicleKey)) {
      assignmentsByVehicleMap.set(vehicleKey, assignment);
    } else {
      const existing = assignmentsByVehicleMap.get(vehicleKey)!;
      const existingRoute = routeMasters.find(r => r.id?.toString() === existing.routeId?.toString() || r.routeName?.toLowerCase() === existing.routeName?.toLowerCase());
      const existingRouteName = (existingRoute?.routeName || existing.routeName || '').trim();
      const existingHasValidRoute = existingRouteName !== '' && existingRouteName.toUpperCase() !== 'N/A';

      if (!existingHasValidRoute && hasValidRoute) {
        assignmentsByVehicleMap.set(vehicleKey, assignment);
      }
    }
  });

  const filteredAssignments = Array.from(assignmentsByVehicleMap.values()).filter(assignment => {
    const route = routeMasters.find(r => r.id?.toString() === assignment.routeId?.toString() || r.routeName?.toLowerCase() === assignment.routeName?.toLowerCase());
    const resolvedRouteName = (route?.routeName || assignment.routeName || '').trim();
    const resolvedVehicleNumber = (assignment.vehicleNumber || '').trim();
    
    return (resolvedRouteName !== '' && resolvedRouteName.toUpperCase() !== 'N/A') || resolvedVehicleNumber !== '';
  });

  const filteredAssignmentLogs = assignmentLogs.filter(log => {
    const matchesSearch =
      query.trim() === '' ||
      log.vehicleNumber.toLowerCase().includes(query.toLowerCase()) ||
      log.routeName.toLowerCase().includes(query.toLowerCase()) ||
      log.driverName.toLowerCase().includes(query.toLowerCase()) ||
      log.attendantName.toLowerCase().includes(query.toLowerCase());

    const selectedRouteObj = routeMasters.find(r => r.id === routeFilter || r.routeName === routeFilter || r.routeCode === routeFilter);

    const matchesRoute =
      routeFilter === '' ||
      routeFilter === 'All' ||
      log.routeName === routeFilter ||
      (selectedRouteObj && (
        log.routeName === selectedRouteObj.routeName ||
        log.routeName === selectedRouteObj.routeCode ||
        (selectedRouteObj.routeName && log.routeName.trim().toLowerCase() === selectedRouteObj.routeName.trim().toLowerCase())
      ));

    return matchesSearch && matchesRoute;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicle = vehicleMasters.find(v => v.id === form.vehicleId);
    const route = routeMasters.find(r => r.id === form.routeId);
    const driver = driverMasters.find(d => d.id === form.driverId);
    const attendant = busAttendants.find(a => a.id === form.attendantId);

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

    const isAssignmentActive = (va: VehicleAssignment) => {
      return va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true';
    };

    // Strict Rule 1: A route can only be assigned to ONE active bus
    const routeAlreadyAssigned = vehicleAssignments.find(va =>
      va.id !== editingAssignment?.id &&
      va.id !== reassignSource?.id &&
      isAssignmentActive(va) &&
      (String(va.routeId) === String(route.id) || (va.routeName && va.routeName.toLowerCase() === route.routeName.toLowerCase()))
    );
    if (routeAlreadyAssigned) {
      addToast('warning', 'Route Already Assigned', `Route "${route.routeName}" is already assigned to bus ${routeAlreadyAssigned.vehicleNumber}. A route cannot have multiple active buses.`);
      return;
    }

    // Strict Rule 2: A bus can only be assigned to ONE active route
    const vehicleAlreadyAssigned = vehicleAssignments.find(va =>
      va.id !== editingAssignment?.id &&
      va.id !== reassignSource?.id &&
      isAssignmentActive(va) &&
      (String(va.vehicleId) === String(vehicle.id) || (va.vehicleNumber && va.vehicleNumber.toLowerCase() === vehicle.vehicleNumber.toLowerCase()))
    );
    if (vehicleAlreadyAssigned) {
      addToast('warning', 'Vehicle Already Assigned', `Bus "${vehicle.vehicleNumber}" is already assigned to route "${vehicleAlreadyAssigned.routeName}".`);
      return;
    }

    // Strict Rule 3: No single driver can drive multiple buses
    const driverAlreadyAssigned = vehicleAssignments.find(va =>
      va.id !== editingAssignment?.id &&
      va.id !== reassignSource?.id &&
      isAssignmentActive(va) &&
      (String(va.driverId) === String(driver.id) || (va.driverName && va.driverName.toLowerCase() === driver.driverName.toLowerCase()))
    );
    if (driverAlreadyAssigned) {
      addToast('warning', 'Driver Already Assigned', `Driver "${driver.driverName}" is already assigned to bus ${driverAlreadyAssigned.vehicleNumber} (${driverAlreadyAssigned.routeName}). A driver cannot be assigned to two buses.`);
      return;
    }

    // Strict Rule 4: No single attendant for two buses
    if (attendant) {
      const attendantAlreadyAssigned = vehicleAssignments.find(va =>
        va.id !== editingAssignment?.id &&
        va.id !== reassignSource?.id &&
        isAssignmentActive(va) &&
        (String(va.attendantId) === String(attendant.id) || (va.attendantName && va.attendantName.toLowerCase() === attendant.attendantName.toLowerCase()))
      );
      if (attendantAlreadyAssigned) {
        addToast('warning', 'Attendant Already Assigned', `Bus Attendant "${attendant.attendantName}" is already assigned to bus ${attendantAlreadyAssigned.vehicleNumber}.`);
        return;
      }
    }

    const attendantName = attendant?.attendantName || 'Unassigned';
    const attendantMobile = attendant?.mobileNumber || '';
    const assignedStudents = studentTransports.filter(st => st.routeId === route.id || st.routeName === route.routeName).length;
    const gpsStatus: 'Online' | 'Offline' = vehicle.gpsDeviceId ? 'Online' : 'Offline';

    const activeBranch = (selectedBranch && selectedBranch !== 'All Branches' && selectedBranch !== 'All Campuses') ? selectedBranch : 'Main Campus';
    const activeAY = selectedAcademicYear || getCurrentAcademicYear();

    const payload: Omit<VehicleAssignment, 'id'> = {
      branch: activeBranch,
      academicYear: activeAY,
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
          branch: activeBranch,
          academicYear: activeAY,
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
          branch: activeBranch,
          academicYear: activeAY,
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
        branch: activeBranch,
        academicYear: activeAY,
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
    const routeStudentsCount = students.filter(student => {
      const isStudentActive = student.status !== 'Inactive' && student.status !== 'Discontinued' && student.status !== 'Transferred';
      if (!isStudentActive) return false;

      const stAssignment = studentTransports.find(st => {
        const isStatusActive = st.status === 'Active' || (st.status as any) === true || String(st.status).toLowerCase() === 'true';
        if (!isStatusActive) return false;

        return (
          (st.studentId && student.id && String(st.studentId).trim() === String(student.id).trim()) ||
          (st.admissionNo && student.admissionNo && String(st.admissionNo).trim().toLowerCase() === String(student.admissionNo).trim().toLowerCase())
        );
      });

      // 1. Match by routeId
      const matchesRouteId = Boolean(
        (stAssignment?.routeId && route?.id && String(stAssignment.routeId).trim() === String(route.id).trim()) ||
        (stAssignment?.routeId && assignment.routeId && String(stAssignment.routeId).trim() === String(assignment.routeId).trim()) ||
        (student.busRoute && route?.id && String(student.busRoute).trim() === String(route.id).trim()) ||
        (student.busRoute && assignment.routeId && String(student.busRoute).trim() === String(assignment.routeId).trim())
      );

      // 2. Match by vehicleNumber / vehicleId
      const matchesVehicle = Boolean(
        (stAssignment?.vehicleNumber && assignment.vehicleNumber && stAssignment.vehicleNumber.trim().toUpperCase() === assignment.vehicleNumber.trim().toUpperCase()) ||
        (stAssignment?.vehicleId && assignment.vehicleId && String(stAssignment.vehicleId).trim() === String(assignment.vehicleId).trim())
      );

      // 3. Match by exact Route Name / Code
      const studentRoute = (stAssignment?.routeName || student.busRoute || '').trim().toLowerCase();
      const targetRouteName = (route?.routeName || assignment.routeName || '').trim().toLowerCase();
      const targetRouteCode = (route?.routeCode || '').trim().toLowerCase();

      const matchesRouteName = Boolean(
        studentRoute !== '' &&
        studentRoute !== 'n/a' &&
        studentRoute !== 'unassigned' &&
        ((targetRouteName !== '' && targetRouteName !== 'n/a' && targetRouteName !== 'unassigned' && studentRoute === targetRouteName) ||
         (targetRouteCode !== '' && studentRoute === targetRouteCode))
      );

      return matchesRouteId || matchesVehicle || matchesRouteName;
    }).length;
    const assignedStudents = routeStudentsCount;

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
          </div>

        <div className="flex items-center gap-3">
          {activeTab !== 'history' && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
          <ExportButton data={filteredAssignments} filename="vehicle_assignments" />
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => {
            setActiveTab('current');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'current'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Assignments ({currentAssignments.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Assignment History Log ({filteredAssignmentLogs.length})
        </button>
      </div>

      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by vehicle, driver, attendant, or route..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Filter by Route:</label>
          <select
            value={routeFilter}
            onChange={e => {
              setRouteFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Route --</option>
            <option value="All">All Routes</option>
            {routeMasters.map(route => (
              <option key={route.id} value={route.id}>
                {route.routeName} ({route.routeCode || 'RT'})
              </option>
            ))}
          </select>

          {hasFilterSelection && (
            <button
              onClick={() => {
                setRouteFilter('');
                setQuery('');
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!hasFilterSelection ? (
        <div className="p-10 text-center glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Please Select a Route</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a route from the dropdown filter above to inspect active vehicle assignments.
          </p>
          <button
            onClick={() => {
              setRouteFilter('All');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            View All Assignments
          </button>
        </div>
      ) : activeTab === 'current' ? (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 py-3.5 px-4 text-left z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Bus Number</th>
                  <th className="py-3.5 px-4 text-left">Route Name</th>
                  <th className="py-3.5 px-4 text-left">Driver Name</th>
                  <th className="py-3.5 px-4 text-left">Bus Attendant</th>
                  <th className="py-3.5 px-4 text-center">Capacity</th>
                  <th className="py-3.5 px-4 text-center">Students</th>
                  <th className="py-3.5 px-4 text-center">Morning Trip</th>
                  <th className="py-3.5 px-4 text-center">Evening Trip</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Effective Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {currentAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-400">
                      No active vehicle assignments match the selected filters.
                    </td>
                  </tr>
                ) : (
                  currentAssignments
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(({ assignment, vehicle, route, driver, attendant, capacity, assignedStudents, morningTripTime, eveningTripTime }) => {
                    const cleanDate = (assignment.effectiveFrom || '').split('T')[0] || '-';
                    return (
                      <tr key={assignment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="sticky left-0 bg-white dark:bg-slate-900 py-3 px-4 font-mono font-bold text-slate-900 dark:text-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                            {assignment.vehicleNumber || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <div className="font-bold text-sky-600 dark:text-sky-400">
                            {route?.routeName || (assignment.routeName && assignment.routeName.toUpperCase() !== 'N/A' ? assignment.routeName : '') || 'Unassigned Route'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {assignment.branch || 'Main Campus'} • {assignment.academicYear || getCurrentAcademicYear()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{driver?.driverName || assignment.driverName || 'Unassigned'}</div>
                          <div className="text-[10px] font-mono text-slate-400">Emp ID: {driver?.employeeId || assignment.driverEmployeeId || (driver?.id ? `DRV-${driver.id}` : '-')}</div>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">{attendant.name || 'Unassigned'}</div>
                          <div className="text-[10px] font-mono text-slate-400">Emp ID: {attendant.id || assignment.attendantEmployeeId || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">{capacity}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {assignedStudents}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sky-600 font-bold">{morningTripTime}</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-600 font-bold">{eveningTripTime}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={assignment.status === 'Active' ? 'success' : 'neutral'} size="sm">
                            {assignment.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {cleanDate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenTripDetails(assignment)}
                              title="View Trip Details"
                              className="p-2 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all cursor-pointer shadow-sm hover:scale-105"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(assignment)}
                              title="Edit Assignment"
                              className="p-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm hover:scale-105"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReassignModal(assignment)}
                              title="Reassign Bus / Route"
                              className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all cursor-pointer shadow-sm hover:scale-105"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingAssignment(assignment)}
                              title="Remove Assignment"
                              className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-sm hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={currentAssignments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="sticky left-0 bg-slate-100 dark:bg-slate-800 py-3.5 px-4 text-left z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Vehicle</th>
                  <th className="py-3.5 px-4 text-left">Route</th>
                  <th className="py-3.5 px-4 text-left">Driver</th>
                  <th className="py-3.5 px-4 text-left">Attendant</th>
                  <th className="py-3.5 px-4 text-left">Branch</th>
                  <th className="py-3.5 px-4 text-center">Academic Year</th>
                  <th className="py-3.5 px-4 text-center">Assignment Period</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredAssignmentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No assignment history log items found.
                    </td>
                  </tr>
                ) : (
                  filteredAssignmentLogs
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="sticky left-0 bg-white dark:bg-slate-900 py-3 px-4 font-mono font-bold text-slate-900 dark:text-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                          {log.vehicleNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-bold text-sky-600 dark:text-sky-400">{log.routeName}</td>
                      <td className="py-3 px-4 text-left text-slate-700 dark:text-slate-300">{log.driverName}</td>
                      <td className="py-3 px-4 text-left text-emerald-600 dark:text-emerald-400">{log.attendantName}</td>
                      <td className="py-3 px-4 text-left text-slate-700 dark:text-slate-300">{log.branch}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">{log.academicYear}</td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {(log.effectiveFrom || '').split('T')[0]}{log.effectiveTo ? ` to ${(log.effectiveTo || '').split('T')[0]}` : ' (Current)'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={log.status === 'Active' ? 'success' : 'neutral'} size="sm">
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredAssignmentLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
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
                
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">

              <div>
                <label className="block font-semibold mb-1">Select Route <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.routeId}
                  onChange={e => setForm(prev => ({ ...prev, routeId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="">-- Select Route --</option>
                  {routeMasters.filter(route => route.status === 'Active').map(route => {
                    const activeOther = vehicleAssignments.find(va =>
                      (va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true') &&
                      String(va.routeId) === String(route.id) &&
                      va.id !== editingAssignment?.id &&
                      va.id !== reassignSource?.id
                    );
                    return (
                      <option key={route.id} value={route.id} disabled={!!activeOther}>
                        {route.routeName} ({route.routeCode}) {activeOther ? ` [Assigned to ${activeOther.vehicleNumber}]` : ' [Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Active Vehicle <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.vehicleId}
                  onChange={e => setForm(prev => ({ ...prev, vehicleId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicleMasters.filter(vehicle => vehicle.status === 'Active').map(vehicle => {
                    const activeOther = vehicleAssignments.find(va =>
                      (va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true') &&
                      String(va.vehicleId) === String(vehicle.id) &&
                      va.id !== editingAssignment?.id &&
                      va.id !== reassignSource?.id
                    );
                    return (
                      <option key={vehicle.id} value={vehicle.id} disabled={!!activeOther}>
                        {vehicle.vehicleNumber} ({vehicle.registrationNumber} - {vehicle.capacity} Seats)
                        {activeOther ? ` [Assigned to: ${activeOther.routeName}]` : ' [Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Licensed Driver <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.driverId}
                  onChange={e => {
                    const drv = driverMasters.find(d => d.id === e.target.value);
                    setForm(prev => ({
                      ...prev,
                      driverId: e.target.value,
                      driverEmployeeId: drv?.employeeId || `DRV-${drv?.id || '01'}`
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="">-- Select Driver --</option>
                  {driverMasters.filter(driver => driver.status === 'Active').map(driver => {
                    const activeOther = vehicleAssignments.find(va =>
                      (va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true') &&
                      String(va.driverId) === String(driver.id) &&
                      va.id !== editingAssignment?.id &&
                      va.id !== reassignSource?.id
                    );
                    const empIdText = driver.employeeId ? `Emp ID: ${driver.employeeId}` : `DRV-${driver.id}`;
                    return (
                      <option key={driver.id} value={driver.id} disabled={!!activeOther}>
                        {driver.driverName} ({empIdText} • {driver.mobileNumber})
                        {activeOther ? ` [Assigned to: ${activeOther.vehicleNumber}]` : ' [Available]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Select Bus Attendant <span className="text-rose-500 font-bold ml-0.5">*</span></label>
                <select
                  value={form.attendantId}
                  onChange={e => {
                    const att = busAttendants.find(a => a.id === e.target.value);
                    setForm(prev => ({
                      ...prev,
                      attendantId: e.target.value,
                      attendantEmployeeId: att?.employeeId || 'ATT-2026-01'
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                >
                  <option value="">-- Select Bus Attendant --</option>
                  {busAttendants.filter(attendant => attendant.status === 'Active').map(attendant => {
                    const activeOther = vehicleAssignments.find(va =>
                      (va.status === 'Active' || (va.status as any) === true || String(va.status).toLowerCase() === 'true') &&
                      String(va.attendantId) === String(attendant.id) &&
                      va.id !== editingAssignment?.id &&
                      va.id !== reassignSource?.id
                    );
                    return (
                      <option key={attendant.id} value={attendant.id} disabled={!!activeOther}>
                        {attendant.attendantName} (Emp ID: {attendant.employeeId} • {attendant.mobileNumber})
                        {activeOther ? ` [Assigned to: ${activeOther.vehicleNumber}]` : ' [Available]'}
                      </option>
                    );
                  })}
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
                  Save
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
          try {
            await removeVehicleAssignment(deletingAssignment.id);
            setAssignmentLogs(prev => prev.map(log =>
              log.vehicleNumber === deletingAssignment.vehicleNumber && log.status === 'Active'
                ? { ...log, status: 'Historical' as const, effectiveTo: new Date().toISOString().split('T')[0] }
                : log
            ));
          } catch (err) {
            // Error is already toasted by Context
          } finally {
            setDeletingAssignment(null);
          }
        }}
        title="Remove Vehicle Assignment"
        message={`Remove assignment of ${deletingAssignment?.vehicleNumber} from ${deletingAssignment?.routeName}?`}
      />
    </div>
  );
};
