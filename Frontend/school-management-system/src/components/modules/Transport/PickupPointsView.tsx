import React, { useState } from 'react';
import { MapPin, Plus, Search, Edit, Trash2, Clock, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { PickupPoint } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { Badge } from '../../common/Badge';
import { ExportButton } from '../../common/ExportButton';
import { ConfirmModal } from '../../common/ConfirmModal';

const convertTo24Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();

  // 12-hour AM/PM format (e.g. "7:30 AM", "07:30 PM", "12:15 PM")
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = match12h[2];
    const ampm = match12h[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // 24-hour format with optional seconds (e.g. "17:00:00", "07:30", "7:30")
  const match24h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24h) {
    const hours = parseInt(match24h[1], 10);
    const minutes = match24h[2];
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return timeStr;
};

const convertTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();

  // 12-hour AM/PM format (normalize single-digit hours)
  const match12h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (match12h) {
    const hours = parseInt(match12h[1], 10);
    const minutes = match12h[2];
    const ampm = match12h[3].toUpperCase();
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // 24-hour format with optional seconds
  const match24h = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24h) {
    let hours = parseInt(match24h[1], 10);
    const minutes = match24h[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  return timeStr;
};

const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr || !timeStr.trim()) return null;
  const time24 = convertTo24Hour(timeStr);
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

const getTimeValidationWarning = (morningStr?: string, eveningStr?: string): string[] => {
  const warnings: string[] = [];
  const mMin = parseTimeToMinutes(morningStr || '');
  const eMin = parseTimeToMinutes(eveningStr || '');

  if (mMin !== null && mMin >= 12 * 60) {
    warnings.push('Morning pickup is configured as PM');
  }
  if (eMin !== null && eMin < 12 * 60) {
    warnings.push('Evening drop is configured as AM');
  }
  if (mMin !== null && eMin !== null && eMin <= mMin) {
    warnings.push('Evening drop is before or same as morning pickup');
  }
  return warnings;
};

interface DynamicPickupPointInput {
  name: string;
  distance: string;
  morningTime: string;
  eveningTime: string;
  isDropOptional?: boolean;
}

interface DynamicRowError {
  name?: string;
  distance?: string;
  morningTime?: string;
  eveningTime?: string;
}

export const PickupPointsView: React.FC = () => {
  const { pickupPoints = [], routeMasters = [], vehicleMasters = [], vehicleAssignments = [], addPickupPoint, updatePickupPoint, deletePickupPoint } = useData();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState(() => sessionStorage.getItem('tm_pickup_route_filter') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PickupPoint | null>(null);

  // Dynamic creation input fields
  const [newPickupPoints, setNewPickupPoints] = useState<DynamicPickupPointInput[]>([
    { name: '', distance: '', morningTime: '', eveningTime: '', isDropOptional: false }
  ]);
  const [rowErrors, setRowErrors] = useState<Record<number, DynamicRowError>>({});
  const [hasSubmittedCreate, setHasSubmittedCreate] = useState(false);

  const [editErrors, setEditErrors] = useState<{
    pickupName?: string;
    sequenceNumber?: string;
    distanceFromSchoolKm?: string;
    monthlyFee?: string;
    morningPickupTime?: string;
    eveningDropTime?: string;
  }>({});

  // Accordion open/close state by route ID
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});

  const handleRouteFilterChange = (val: string) => {
    setSelectedRouteFilter(val);
    sessionStorage.setItem('tm_pickup_route_filter', val);
  };

  const toggleRouteExpanded = (routeId: string | number) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [routeId]: !prev[routeId]
    }));
  };

  const calculateFeeForDistance = (routeId?: string | number, distanceKm: number = 0) => {
    const r = (routeMasters || []).find(rt => rt.id == routeId);
    const minKm = r?.minDistanceKm ?? 5;
    
    // Find the assigned vehicle via vehicleAssignments
    const activeAssignment = (vehicleAssignments || []).find(va => va.routeId == routeId && (va.status === 'Active' || (va as any).status === true))
      || (vehicleAssignments || []).find(va => va.routeId == routeId);
    const assignedBus = activeAssignment?.vehicleNumber;
    
    // Check if the assigned vehicle is AC
    const vehicle = (vehicleMasters || []).find(v => v.vehicleNumber === assignedBus);
    const isACVehicle = vehicle?.isAC === true;
    
    const baseFare = isACVehicle 
      ? (r?.acMinBaseFare ?? 1200) 
      : (r?.minBaseFare ?? 1000);
      
    const rateKm = isACVehicle 
      ? (r?.acRatePerKm ?? 150) 
      : (r?.ratePerKm ?? 100);
      
    const additionalKm = Math.max(0, distanceKm - minKm);
    return Math.round(baseFare + (additionalKm * rateKm));
  };

  const [form, setForm] = useState<Partial<PickupPoint> & { isDropOptional?: boolean }>({
    routeId: '',
    routeName: '',
    pickupName: '',
    sequenceNumber: undefined,
    arrivalTime: '',
    morningPickupTime: '',
    eveningDropTime: '',
    isDropOptional: false,
    distanceFromSchoolKm: undefined,
    monthlyFee: undefined,
    status: 'Active'
  });

  const isPointForRoute = (p: PickupPoint, r: any) => {
    if (!p || !r) return false;
    const pRouteId = String(p.routeId || '').trim().toLowerCase();
    const rId = String(r.id || '').trim().toLowerCase();
    const rCode = String(r.routeCode || '').trim().toLowerCase();
    const rName = String(r.routeName || '').trim().toLowerCase();
    const pRouteName = String(p.routeName || '').trim().toLowerCase();

    if (pRouteId && pRouteId !== '0' && pRouteId !== 'undefined' && pRouteId !== 'null') {
      if (pRouteId === rId || (rCode && pRouteId === rCode) || (rName && pRouteId === rName)) {
        return true;
      }
    }
    if (pRouteName && pRouteName !== 'undefined' && pRouteName !== 'null') {
      if ((rName && pRouteName === rName) || (rCode && pRouteName === rCode)) {
        return true;
      }
    }
    return false;
  };

  const filteredPoints = (pickupPoints || []).filter(p => {
    if (!p) return false;
    const matchesQuery = (p.pickupName || '').toLowerCase().includes(query.toLowerCase()) || (p.routeName || '').toLowerCase().includes(query.toLowerCase());
    const matchesRoute = selectedRouteFilter === 'All' || 
      p.routeId == selectedRouteFilter || 
      (selectedRouteFilter && (routeMasters || []).some(r => r && r.id == selectedRouteFilter && isPointForRoute(p, r)));
    return matchesQuery && matchesRoute;
  }).sort((a, b) => {
    const routeCompare = (a.routeName || '').localeCompare(b.routeName || '');
    return routeCompare !== 0 ? routeCompare : (a.sequenceNumber || 0) - (b.sequenceNumber || 0);
  });

  const validateSinglePoint = (point: DynamicPickupPointInput, maxLimit?: number): DynamicRowError => {
    const errors: DynamicRowError = {};

    if (!point.name.trim()) {
      errors.name = 'Pickup point name is required.';
    }

    const distNum = Number(point.distance);
    if (!point.distance.trim()) {
      errors.distance = 'Valid distance (> 0 KM) is required.';
    } else if (isNaN(distNum) || distNum <= 0) {
      errors.distance = 'Valid distance (> 0 KM) is required.';
    } else if (maxLimit !== undefined && maxLimit > 0 && distNum > maxLimit) {
      errors.distance = `Exceeds ${maxLimit} KM Limit.`;
    }

    // Morning Pickup Time Validation (Mandatory, AM only)
    if (!point.morningTime || !point.morningTime.trim()) {
      errors.morningTime = 'Morning pickup time is required.';
    } else {
      const mMin = parseTimeToMinutes(point.morningTime);
      if (mMin === null) {
        errors.morningTime = 'Invalid morning time format.';
      } else if (mMin >= 12 * 60) {
        errors.morningTime = 'Morning pickup must be an AM time (before 12:00 PM).';
      }
    }

    // Evening Drop Time Validation (Mandatory unless Optional, PM only, > Morning)
    if (!point.isDropOptional && (!point.eveningTime || !point.eveningTime.trim())) {
      errors.eveningTime = 'Evening drop time is required (or mark Optional).';
    } else if (point.eveningTime && point.eveningTime.trim()) {
      const eMin = parseTimeToMinutes(point.eveningTime);
      const mMin = parseTimeToMinutes(point.morningTime || '');

      if (eMin === null) {
        errors.eveningTime = 'Invalid evening time format.';
      } else if (eMin < 12 * 60) {
        errors.eveningTime = 'Evening drop must be a PM time (12:00 PM or later).';
      } else if (mMin !== null && eMin <= mMin) {
        errors.eveningTime = 'Evening drop must be later than morning pickup.';
      }
    }

    return errors;
  };

  const validateEditForm = (): typeof editErrors => {
    const errs: typeof editErrors = {};

    if (!form.pickupName || !form.pickupName.trim()) {
      errs.pickupName = 'Pickup point name is required.';
    }

    const seqNum = Number(form.sequenceNumber);
    if (!form.sequenceNumber || isNaN(seqNum) || seqNum <= 0) {
      errs.sequenceNumber = 'Sequence number must be a positive integer.';
    } else {
      const routeSequence = pickupPoints.filter(p => p.routeId === form.routeId && p.id !== editingPoint?.id);
      if (routeSequence.some(p => p.sequenceNumber === seqNum)) {
        errs.sequenceNumber = `Sequence #${seqNum} is already used on this route.`;
      }
    }

    const r = routeMasters.find(rt => rt.id == form.routeId);
    const maxLimit = r ? Number(r.totalDistanceKm) : undefined;
    const distKm = Number(form.distanceFromSchoolKm);
    if (form.distanceFromSchoolKm === undefined || form.distanceFromSchoolKm === null || String(form.distanceFromSchoolKm).trim() === '' || isNaN(distKm) || distKm <= 0) {
      errs.distanceFromSchoolKm = 'Valid distance (> 0 KM) is required.';
    } else if (maxLimit !== undefined && maxLimit > 0 && distKm > maxLimit) {
      errs.distanceFromSchoolKm = `Distance (${distKm} KM) cannot exceed total route distance (${maxLimit} KM).`;
    }

    const feeAmt = Number(form.monthlyFee);
    if (form.monthlyFee === undefined || form.monthlyFee === null || String(form.monthlyFee).trim() === '' || isNaN(feeAmt) || feeAmt < 0) {
      errs.monthlyFee = 'Valid monthly fee is required.';
    }

    // Morning Pickup Time Validation
    if (!form.morningPickupTime || !form.morningPickupTime.trim()) {
      errs.morningPickupTime = 'Morning pickup time is required.';
    } else {
      const mMin = parseTimeToMinutes(form.morningPickupTime);
      if (mMin === null) {
        errs.morningPickupTime = 'Invalid morning time format.';
      } else if (mMin >= 12 * 60) {
        errs.morningPickupTime = 'Morning pickup must be an AM time (before 12:00 PM).';
      }
    }

    // Evening Drop Time Validation
    if (!form.isDropOptional && (!form.eveningDropTime || !form.eveningDropTime.trim())) {
      errs.eveningDropTime = 'Evening drop time is required (or mark Optional).';
    } else if (form.eveningDropTime && form.eveningDropTime.trim()) {
      const eMin = parseTimeToMinutes(form.eveningDropTime);
      const mMin = parseTimeToMinutes(form.morningPickupTime || '');
      if (eMin === null) {
        errs.eveningDropTime = 'Invalid evening time format.';
      } else if (eMin < 12 * 60) {
        errs.eveningDropTime = 'Evening drop must be a PM time (12:00 PM or later).';
      } else if (mMin !== null && eMin <= mMin) {
        errs.eveningDropTime = 'Evening drop must be later than morning pickup.';
      }
    }

    return errs;
  };

  const handleUpdatePointField = (
    index: number,
    field: keyof DynamicPickupPointInput,
    value: any
  ) => {
    const updatedPoints = [...newPickupPoints];
    updatedPoints[index] = {
      ...updatedPoints[index],
      [field]: value
    };
    setNewPickupPoints(updatedPoints);

    if (hasSubmittedCreate || rowErrors[index]) {
      const r = routeMasters.find(rt => rt.id == form.routeId);
      const maxLimit = r ? Number(r.totalDistanceKm) : undefined;
      const errs = validateSinglePoint(updatedPoints[index], maxLimit);
      setRowErrors(prev => ({
        ...prev,
        [index]: errs
      }));
    }
  };

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setRowErrors({});
    setHasSubmittedCreate(false);
    setNewPickupPoints([{ name: '', distance: '', morningTime: '', eveningTime: '', isDropOptional: false }]);
    const defaultRoute = (selectedRouteFilter && selectedRouteFilter !== 'All')
      ? (routeMasters || []).find(r => r && r.id == selectedRouteFilter)
      : null;
    setForm({
      routeId: defaultRoute?.id || '',
      routeName: defaultRoute?.routeName || '',
      pickupName: '',
      sequenceNumber: undefined,
      arrivalTime: '',
      morningPickupTime: '',
      eveningDropTime: '',
      isDropOptional: false,
      distanceFromSchoolKm: undefined,
      monthlyFee: undefined,
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PickupPoint) => {
    setEditingPoint(p);
    setEditErrors({});
    const isAct = (p.status as any) === true || p.status === 'Active';
    const eveningVal = p.eveningDropTime || (p as any).dropTime || (p as any).eveningTime || '';
    const isOptional = p.isDropOptional === true || (!eveningVal && p.isDropOptional !== false);

    setForm({
      ...p,
      morningPickupTime: p.morningPickupTime || p.arrivalTime || (p as any).pickupTime || '',
      eveningDropTime: eveningVal,
      isDropOptional: isOptional,
      status: isAct ? 'Active' : 'Inactive'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.routeId) {
      addToast('warning', 'Route Required', 'Please select a route.');
      return;
    }

    const r = routeMasters.find(rt => rt.id == form.routeId);
    const routeName = r ? r.routeName : form.routeName || '';
    const maxLimit = r ? Number(r.totalDistanceKm) : Infinity;

    if (editingPoint) {
      const errs = validateEditForm();
      if (Object.keys(errs).length > 0) {
        setEditErrors(errs);
        addToast('error', 'Validation Error', 'Please correct the highlighted fields before saving.');
        return;
      }

      const seqNum = Number(form.sequenceNumber) || 1;
      const distKm = Number(form.distanceFromSchoolKm) || 0;
      const feeAmt = Number(form.monthlyFee) || calculateFeeForDistance(form.routeId, distKm);
      const morningTime12h = form.morningPickupTime ? convertTo12Hour(form.morningPickupTime) : '';
      const eveningTime12h = form.eveningDropTime ? convertTo12Hour(form.eveningDropTime) : '';

      const payload = {
        ...form,
        routeName,
        sequenceNumber: seqNum,
        distanceFromSchoolKm: distKm,
        arrivalTime: morningTime12h,
        morningPickupTime: morningTime12h,
        eveningDropTime: eveningTime12h,
        dropTime: eveningTime12h,
        isDropOptional: !!form.isDropOptional,
        monthlyFee: feeAmt
      } as Omit<PickupPoint, 'id'>;

      updatePickupPoint(editingPoint.id, payload);
      addToast('success', 'Pickup Point Updated', `Updated ${form.pickupName}`);
    } else {
      setHasSubmittedCreate(true);

      const allErrors: Record<number, DynamicRowError> = {};
      let hasAnyError = false;

      newPickupPoints.forEach((pt, idx) => {
        const rowErr = validateSinglePoint(pt, maxLimit);
        if (Object.keys(rowErr).length > 0) {
          allErrors[idx] = rowErr;
          hasAnyError = true;
        }
      });

      setRowErrors(allErrors);

      if (hasAnyError) {
        addToast('error', 'Validation Error', 'Please correct the highlighted timing and distance errors before saving.');
        return;
      }

      const existingForRoute = pickupPoints.filter(p => p.routeId == form.routeId);
      const maxSeq = existingForRoute.length > 0 ? Math.max(...existingForRoute.map(p => p.sequenceNumber)) : 0;

      newPickupPoints.forEach((item, index) => {
        const seqNum = maxSeq + index + 1;
        const distKm = Number(item.distance) || 0;
        const feeAmt = calculateFeeForDistance(form.routeId, distKm);
        const morningTime12h = item.morningTime ? convertTo12Hour(item.morningTime) : '';
        const eveningTime12h = item.eveningTime ? convertTo12Hour(item.eveningTime) : '';

        const payload = {
          routeId: form.routeId,
          routeName,
          pickupName: item.name.trim(),
          sequenceNumber: seqNum,
          distanceFromSchoolKm: distKm,
          arrivalTime: morningTime12h,
          morningPickupTime: morningTime12h,
          eveningDropTime: eveningTime12h,
          dropTime: eveningTime12h,
          isDropOptional: !!item.isDropOptional,
          monthlyFee: feeAmt,
          status: 'Active'
        } as Omit<PickupPoint, 'id'>;

        addPickupPoint(payload);
      });

      addToast('success', 'Pickup Points Created', `Added ${newPickupPoints.length} pickup point(s) to ${routeName}.`);
    }
    setIsModalOpen(false);
  };

  const visibleRoutes = routeMasters.filter(r => {
    if (selectedRouteFilter && selectedRouteFilter !== 'All') {
      return r.id == selectedRouteFilter;
    }
    return true;
  });

  const selectedRouteObj = routeMasters.find(rt => rt.id == form.routeId);

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-500" /> Pickup Points
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Pickup Point
          </button>
          <ExportButton 
            data={filteredPoints} 
            filename={selectedRouteFilter !== 'All' 
              ? `pickup_points_${routeMasters.find(r => r.id == selectedRouteFilter)?.routeCode || 'filtered'}` 
              : 'pickup_points'} 
          />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by pickup point name..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRouteFilter}
            onChange={e => handleRouteFilterChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="">-- Select Route --</option>
            <option value="All">All Pickup Points</option>
            {routeMasters.map(r => (
              <option key={r.id} value={r.id}>
                {r.routeName} ({r.routeCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRouteFilter === '' ? (
        <div className="glass-card p-10 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-sm">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Please Select a Route</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select a route from the dropdown above or click below to view all pickup points.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleRouteFilterChange('All')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              View All Pickup Points
            </button>
          </div>
        </div>
      ) : visibleRoutes.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <p className="text-slate-400 text-xs font-bold">No routes found matching your filter.</p>
          <button
            onClick={() => { handleRouteFilterChange('All'); setQuery(''); }}
            className="text-xs text-sky-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Accordion List of Routes */
        <div className="space-y-4">
          {visibleRoutes
            .filter(r => {
              if (!query) return true;
              const routePoints = pickupPoints.filter(p => isPointForRoute(p, r));
              const matchesQueryStr = (p: PickupPoint) => 
                (p.pickupName || '').toLowerCase().includes(query.toLowerCase()) || 
                (p.routeName || '').toLowerCase().includes(query.toLowerCase());
              return (r.routeName || '').toLowerCase().includes(query.toLowerCase()) || 
                     (r.routeCode || '').toLowerCase().includes(query.toLowerCase()) || 
                     routePoints.some(matchesQueryStr);
            })
            .map(route => {
              const routePoints = pickupPoints
                .filter(p => isPointForRoute(p, route))
                .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
              
              const filteredRoutePoints = query
                ? routePoints.filter(p => 
                    (p.pickupName || '').toLowerCase().includes(query.toLowerCase()) || 
                    (p.routeName || '').toLowerCase().includes(query.toLowerCase())
                  )
                : routePoints;

              const isExpanded = query ? true : !!expandedRoutes[route.id];

              return (
                <div key={route.id} className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
                  {/* Route Header (Clickable) */}
                  <div
                    onClick={() => toggleRouteExpanded(route.id)}
                    className="p-4 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{route.routeName}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          ({route.routeCode.toLowerCase()})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {filteredRoutePoints.length} Pickup Point{filteredRoutePoints.length !== 1 ? 's' : ''}
                      </span>
                      <Badge variant={route.status === 'Active' ? 'success' : 'neutral'}>{route.status}</Badge>
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="border-t border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-top-1 duration-200">
                      {filteredRoutePoints.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 font-medium">
                          {query ? 'No matching pickup points on this route.' : 'No pickup points configured for this route.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-center border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="py-3.5 px-4 text-center w-16">Seq #</th>
                                <th className="py-3.5 px-4 text-center">Pickup Point Name</th>
                                <th className="py-3.5 px-4 text-center w-32">Distance (KM)</th>
                                <th className="py-3.5 px-4 text-center w-40">Morning Pickup</th>
                                <th className="py-3.5 px-4 text-center w-40">Evening Drop</th>
                                <th className="py-3.5 px-4 text-center w-36">Monthly Fee</th>
                                <th className="py-3.5 px-4 text-center w-24">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                              {filteredRoutePoints.map(p => {
                                const morningVal = p.morningPickupTime || p.arrivalTime || (p as any).pickupTime;
                                const eveningVal = p.eveningDropTime || (p as any).dropTime || (p as any).eveningTime;
                                const timeWarnings = getTimeValidationWarning(morningVal, eveningVal);

                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                    <td className="py-3 px-4 text-center">
                                      <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-black text-[11px] flex items-center justify-center mx-auto">
                                        {p.sequenceNumber}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <span>{p.pickupName}</span>
                                        {timeWarnings.length > 0 && (
                                          <span title={timeWarnings.join(' • ')} className="inline-flex cursor-help">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-center">{p.distanceFromSchoolKm} KM</td>
                                    <td className="py-3 px-4 font-semibold font-mono text-sky-600 dark:text-sky-400 text-center">
                                      {morningVal ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                          <span>{convertTo12Hour(morningVal)}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 font-normal">-</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 font-semibold font-mono text-center">
                                      {eveningVal ? (
                                        <div className="flex items-center justify-center gap-1.5 text-sky-600 dark:text-sky-400">
                                          <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                          <span>{convertTo12Hour(eveningVal)}</span>
                                        </div>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                                          Optional • Not Set
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-center">
                                      ₹{p.monthlyFee || calculateFeeForDistance(p.routeId, p.distanceFromSchoolKm)}/mo
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => handleOpenEdit(p)} className="p-1 rounded hover:bg-slate-100 text-sky-600 cursor-pointer" title="Edit Pickup Point"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => setDeletingPoint(p)} className="p-1 rounded hover:bg-rose-50 text-rose-600 cursor-pointer" title="Delete Pickup Point"><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingPoint ? 'Edit Pickup Point' : 'Create Pickup Point'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure pickup and drop points with validated timings
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">
                    Select Route <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  {selectedRouteObj && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      Total Route Distance: <span className="text-sky-600 font-mono font-bold">{selectedRouteObj.totalDistanceKm} KM</span>
                    </span>
                  )}
                </div>
                <select
                  required
                  value={form.routeId || ''}
                  onChange={e => {
                    const r = routeMasters.find(rt => rt.id == e.target.value);
                    const autoFee = (form.distanceFromSchoolKm !== undefined && form.distanceFromSchoolKm !== null && (form.distanceFromSchoolKm as any) !== '')
                      ? calculateFeeForDistance(e.target.value, Number(form.distanceFromSchoolKm))
                      : undefined;
                    setForm({
                      ...form,
                      routeId: e.target.value,
                      routeName: r?.routeName || '',
                      monthlyFee: autoFee
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">-- Select Route --</option>
                  {routeMasters.map(r => <option key={r.id} value={r.id}>{r.routeName} ({r.routeCode})</option>)}
                </select>
              </div>

              {editingPoint ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">
                        Pickup Point Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter pickup point name..."
                        value={form.pickupName || ''}
                        onChange={e => {
                          setForm({ ...form, pickupName: e.target.value });
                          if (editErrors.pickupName) setEditErrors(prev => ({ ...prev, pickupName: undefined }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none ${
                          editErrors.pickupName ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                        }`}
                      />
                      {editErrors.pickupName && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">* {editErrors.pickupName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Sequence Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 1"
                        value={form.sequenceNumber !== undefined && form.sequenceNumber !== null ? form.sequenceNumber : ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*$/.test(val)) {
                            setForm({ ...form, sequenceNumber: val as any });
                            if (editErrors.sequenceNumber) setEditErrors(prev => ({ ...prev, sequenceNumber: undefined }));
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none ${
                          editErrors.sequenceNumber ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                        }`}
                      />
                      {editErrors.sequenceNumber && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">* {editErrors.sequenceNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">
                        Distance from School (KM) <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 10.0"
                        value={form.distanceFromSchoolKm !== undefined && form.distanceFromSchoolKm !== null ? form.distanceFromSchoolKm : ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            const dist = val === '' ? 0 : Number(val);
                            const autoFee = val === '' ? undefined : calculateFeeForDistance(form.routeId, dist);
                            setForm({ ...form, distanceFromSchoolKm: val as any, monthlyFee: autoFee });
                            if (editErrors.distanceFromSchoolKm) setEditErrors(prev => ({ ...prev, distanceFromSchoolKm: undefined }));
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none ${
                          editErrors.distanceFromSchoolKm || (form.routeId && selectedRouteObj && Number(form.distanceFromSchoolKm || 0) > Number(selectedRouteObj.totalDistanceKm))
                            ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                            : ''
                        }`}
                      />
                      {(editErrors.distanceFromSchoolKm || (form.routeId && selectedRouteObj && Number(form.distanceFromSchoolKm || 0) > Number(selectedRouteObj.totalDistanceKm))) && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">
                          * {editErrors.distanceFromSchoolKm || `Distance exceeds route limit (${selectedRouteObj?.totalDistanceKm} KM)`}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Monthly Fare (Auto-Calculated) <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 1500"
                        value={form.monthlyFee !== undefined && form.monthlyFee !== null ? form.monthlyFee : ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d*$/.test(val)) {
                            setForm({ ...form, monthlyFee: val as any });
                            if (editErrors.monthlyFee) setEditErrors(prev => ({ ...prev, monthlyFee: undefined }));
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-extrabold text-emerald-600 dark:text-emerald-400 outline-none ${
                          editErrors.monthlyFee ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                        }`}
                      />
                      {editErrors.monthlyFee && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">* {editErrors.monthlyFee}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                        <span>Morning Pickup Time</span> <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="time"
                        value={convertTo24Hour(form.morningPickupTime || '')}
                        onClick={e => (e.target as any).showPicker?.()}
                        onChange={e => {
                          const val12h = convertTo12Hour(e.target.value);
                          setForm(prev => ({ ...prev, morningPickupTime: val12h, arrivalTime: val12h }));
                          if (editErrors.morningPickupTime) setEditErrors(prev => ({ ...prev, morningPickupTime: undefined }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                          editErrors.morningPickupTime ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                        }`}
                      />
                      {editErrors.morningPickupTime ? (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">* {editErrors.morningPickupTime}</p>
                      ) : (
                        <p className="text-[9px] text-slate-400 mt-0.5">AM Shift (e.g. 07:30 AM)</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                          <span>Evening Drop Time</span> {!form.isDropOptional && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                        </label>
                        <label className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!form.isDropOptional}
                            onChange={e => {
                              const isOpt = e.target.checked;
                              setForm(prev => ({
                                ...prev,
                                isDropOptional: isOpt,
                                eveningDropTime: isOpt ? '' : prev.eveningDropTime
                              }));
                              if (isOpt) {
                                setEditErrors(prev => ({ ...prev, eveningDropTime: undefined }));
                              }
                            }}
                            className="w-3 h-3 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <span>Optional</span>
                        </label>
                      </div>
                      <input
                        type="time"
                        disabled={!!form.isDropOptional && !form.eveningDropTime}
                        value={convertTo24Hour(form.eveningDropTime || '')}
                        onClick={e => (e.target as any).showPicker?.()}
                        onChange={e => {
                          const val12h = convertTo12Hour(e.target.value);
                          setForm(prev => ({ ...prev, eveningDropTime: val12h }));
                          if (editErrors.eveningDropTime) setEditErrors(prev => ({ ...prev, eveningDropTime: undefined }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-slate-900 dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                          editErrors.eveningDropTime ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                        } ${form.isDropOptional && !form.eveningDropTime ? 'opacity-60 bg-slate-100 dark:bg-slate-800/60' : ''}`}
                      />
                      {editErrors.eveningDropTime ? (
                        <p className="text-[10px] text-rose-500 font-bold mt-1">* {editErrors.eveningDropTime}</p>
                      ) : form.isDropOptional && !form.eveningDropTime ? (
                        <p className="text-[9px] text-slate-400 mt-0.5">Optional • No drop configured</p>
                      ) : (
                        <p className="text-[9px] text-slate-400 mt-0.5">PM Shift (e.g. 04:30 PM)</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold">
                      Pickup Points, Distances & Timings <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      All points validated for AM/PM consistency
                    </span>
                  </div>

                  <div className="max-h-[48vh] overflow-y-auto space-y-3.5 pr-1">
                    {newPickupPoints.map((point, index) => {
                      const err = rowErrors[index] || {};
                      return (
                        <div key={index} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5 relative">
                          {newPickupPoints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewPickupPoints(newPickupPoints.filter((_, i) => i !== index));
                                setRowErrors(prev => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                              }}
                              className="absolute top-2.5 right-2.5 p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                              title="Remove point"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Pickup Point Name #{index + 1} <span className="text-rose-500 font-bold ml-0.5">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Enter pickup point name..."
                              value={point.name}
                              onChange={e => handleUpdatePointField(index, 'name', e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border font-bold text-slate-900 dark:text-white outline-none ${
                                err.name ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                              }`}
                            />
                            {err.name && (
                              <p className="text-[9px] text-rose-500 font-bold mt-0.5">* {err.name}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                Distance (KM) <span className="text-rose-500 font-bold ml-0.5">*</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 5.0"
                                value={point.distance !== undefined ? point.distance : ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    handleUpdatePointField(index, 'distance', val);
                                  }
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-[11px] font-semibold text-slate-900 dark:text-white outline-none ${
                                  err.distance || (form.routeId && selectedRouteObj && Number(point.distance || 0) > Number(selectedRouteObj.totalDistanceKm))
                                    ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20'
                                    : ''
                                }`}
                              />
                              {(err.distance || (form.routeId && selectedRouteObj && Number(point.distance || 0) > Number(selectedRouteObj.totalDistanceKm))) && (
                                <p className="text-[9px] text-rose-500 font-bold mt-0.5">
                                  * {err.distance || `Exceeds ${selectedRouteObj?.totalDistanceKm} KM Limit`}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-500 flex-shrink-0" />
                                <span>Morning Pickup</span> <span className="text-rose-500 font-bold ml-0.5">*</span>
                              </label>
                              <input
                                type="time"
                                value={point.morningTime}
                                onClick={e => (e.target as any).showPicker?.()}
                                onChange={e => handleUpdatePointField(index, 'morningTime', e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-[11px] font-semibold text-slate-900 dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                                  err.morningTime ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                                }`}
                              />
                              {err.morningTime && (
                                <p className="text-[9px] text-rose-500 font-bold mt-0.5">* {err.morningTime}</p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-sky-500 flex-shrink-0" />
                                  <span>Evening Drop</span> {!point.isDropOptional && <span className="text-rose-500 font-bold">*</span>}
                                </label>
                                <label className="inline-flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!point.isDropOptional}
                                    onChange={e => {
                                      const isOpt = e.target.checked;
                                      const updated = [...newPickupPoints];
                                      updated[index] = {
                                        ...updated[index],
                                        isDropOptional: isOpt,
                                        eveningTime: isOpt ? '' : updated[index].eveningTime
                                      };
                                      setNewPickupPoints(updated);
                                      if (isOpt) {
                                        setRowErrors(prev => {
                                          const next = { ...prev };
                                          if (next[index]) {
                                            const rErr = { ...next[index] };
                                            delete rErr.eveningTime;
                                            next[index] = rErr;
                                          }
                                          return next;
                                        });
                                      }
                                    }}
                                    className="w-3 h-3 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                  <span>Optional</span>
                                </label>
                              </div>
                              <input
                                type="time"
                                disabled={!!point.isDropOptional && !point.eveningTime}
                                value={point.eveningTime}
                                onClick={e => (e.target as any).showPicker?.()}
                                onChange={e => handleUpdatePointField(index, 'eveningTime', e.target.value)}
                                className={`w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border font-mono text-[11px] font-semibold text-slate-900 dark:text-white outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                                  err.eveningTime ? 'border-rose-500 focus:border-rose-500 bg-rose-50/20' : ''
                                } ${point.isDropOptional && !point.eveningTime ? 'opacity-60 bg-slate-100 dark:bg-slate-800' : ''}`}
                              />
                              {err.eveningTime ? (
                                <p className="text-[9px] text-rose-500 font-bold mt-0.5">* {err.eveningTime}</p>
                              ) : point.isDropOptional && !point.eveningTime ? (
                                <p className="text-[9px] text-slate-400 mt-0.5">Optional • No drop</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewPickupPoints([...newPickupPoints, { name: '', distance: '', morningTime: '', eveningTime: '', isDropOptional: false }])}
                    className="w-full py-2.5 rounded-xl border border-dashed border-sky-300 dark:border-sky-850 text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-50/50 dark:hover:bg-sky-950/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Pickup Point Field
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingPoint}
        onCancel={() => setDeletingPoint(null)}
        onConfirm={() => {
          if (deletingPoint) {
            deletePickupPoint(deletingPoint.id);
            addToast('info', 'Pickup Point Deleted');
            setDeletingPoint(null);
          }
        }}
        title="Delete Pickup Point"
        message={`Are you sure you want to delete ${deletingPoint?.pickupName}?`}
      />
    </div>
  );
};
