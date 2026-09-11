import { apiClient } from './client';
import { RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, StudentTransport, VehicleMaintenance } from '../types';
import { BusAttendantMaster } from '../components/modules/Transport/transportData';
import {
  initialRouteMasters,
  initialPickupPoints,
  initialVehicleMasters,
  initialDriverMasters,
  initialVehicleAssignments,
  initialStudentTransports,
  initialVehicleMaintenances
} from '../services/mockData';

// Testing Mode Helper: Safely try real API, fallback to local testing mock state if backend is offline/unreachable

const safeTransportApiCall = async <T>(endpoint: string, options?: RequestInit, fallbackData?: any): Promise<T> => {
  try {
    const res = await apiClient(endpoint, options);
    if (res !== undefined && res !== null && !(res as any)?.error) {
      return (res as any)?.data !== undefined ? (res as any).data : res;
    }
  } catch (err) {
    const method = options?.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      throw err;
    }
  }
  return fallbackData as T;
};

const fetchListWithLookupFallback = async <T>(
  listEndpoint: string,
  lookupEndpoint: string,
  idKey: string,
  detailEndpointPrefix: string,
  fallbackData: T
): Promise<T> => {
  try {
    const listRes = await apiClient(listEndpoint, { method: 'GET' });
    let items = Array.isArray(listRes) ? listRes : (listRes?.items || listRes?.data || []);
    if (items.length > 0) {
      return (listRes?.data !== undefined ? listRes.data : listRes) as unknown as T;
    }
    // Fallback: list endpoint returned empty, try using lookup endpoint to fetch item IDs and fetch details
    const lookups = await apiClient(lookupEndpoint, { method: 'GET' });
    const lookupList = Array.isArray(lookups) ? lookups : (lookups?.items || lookups?.data || []);
    if (lookupList.length > 0) {
      const detailsPromises = lookupList.map(async (lookup: any) => {
        const id = lookup[idKey] || lookup.id || lookup.routeId || lookup.driverId || lookup.assignmentId;
        if (!id) return null;
        try {
          return await apiClient(`${detailEndpointPrefix}/${id}`, { method: 'GET' });
        } catch (e) {
          console.warn(`Failed to fetch lookup detail for ${idKey} ${id}`, e);
          return null;
        }
      });
      const detailsResults = await Promise.all(detailsPromises);
      const validDetails = detailsResults.filter(Boolean);
      if (validDetails.length > 0) {
        return validDetails as unknown as T;
      }
    }
    // If the API call succeeded but both list and lookup returned empty, return empty list
    return (Array.isArray(fallbackData) ? [] : {}) as unknown as T;
  } catch (err) {
    console.error(`Error in fetchListWithLookupFallback for ${listEndpoint}`, err);
  }
  return fallbackData;
};

const getStoredMock = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(`edu_db_${key}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredMock = (key: string, data: any) => {
  try {
    localStorage.setItem(`edu_db_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save edu_db_${key} to localStorage`, err);
  }
};

// Persisted Mock Testing Store

let localRoutes: RouteMaster[] = getStoredMock('route_masters', initialRouteMasters);
let localPickupPoints: PickupPoint[] = getStoredMock('pickup_points', initialPickupPoints);
let localVehicles: VehicleMaster[] = getStoredMock('vehicle_masters', initialVehicleMasters);
let localDrivers: DriverMaster[] = getStoredMock('driver_masters', initialDriverMasters);
let localVehicleAssignments: VehicleAssignment[] = getStoredMock('vehicle_assignments', initialVehicleAssignments);
let localStudentAssignments: StudentTransport[] = getStoredMock('student_transports', initialStudentTransports);
let localMaintenance: VehicleMaintenance[] = getStoredMock('vehicle_maintenances', initialVehicleMaintenances);

// --- Routes ---

export const fetchRoutesApi = async (): Promise<RouteMaster[]> => {
  return fetchListWithLookupFallback<RouteMaster[]>(
    '/api/transport/routes',
    '/api/transport/lookups/routes',
    'routeId',
    '/api/transport/routes',
    localRoutes
  );
};

export const fetchRouteByIdApi = async (id: string): Promise<RouteMaster | undefined> => {
  const fallback = localRoutes.find(r => String(r.id) === id);
  return safeTransportApiCall<RouteMaster>(`/api/transport/routes/${id}`, { method: 'GET' }, fallback);
};

export const createRouteApi = async (data: Partial<RouteMaster>): Promise<RouteMaster> => {
  const newRoute = {
    id: data.id || `RT-${Date.now()}`,
    routeName: data.routeName || '',
    routeCode: data.routeCode || '',
    routeStart: data.routeStart || '',
    routeEnd: data.routeEnd || '',
    totalDistanceKm: data.totalDistanceKm || 0,
    estimatedTimeMinutes: data.estimatedTimeMinutes || 0,
    status: data.status || 'Active',
    description: data.description || ''
  } as unknown as RouteMaster;

  localRoutes.push(newRoute);
  setStoredMock('route_masters', localRoutes);

  return safeTransportApiCall<RouteMaster>(
    '/api/transport/routes',
    { method: 'POST', body: JSON.stringify(data) },
    newRoute
  );
};

export const updateRouteApi = async (id: string, data: Partial<RouteMaster>): Promise<RouteMaster> => {
  const idx = localRoutes.findIndex(r => String(r.id) === id);
  if (idx !== -1) {
    localRoutes[idx] = { ...localRoutes[idx], ...data };
    setStoredMock('route_masters', localRoutes);
  }
  const updated = localRoutes[idx] || (data as RouteMaster);
  return safeTransportApiCall<RouteMaster>(
    `/api/transport/routes/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteRouteApi = async (id: string): Promise<{ success: boolean }> => {
  const cleanId = String(id || '').trim();
  localRoutes = localRoutes.filter(r => String(r.id) !== cleanId && r.routeCode !== cleanId && r.routeName !== cleanId);
  setStoredMock('route_masters', localRoutes);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/routes/${encodeURIComponent(cleanId)}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Pickup Points ---

// --- Pickup Points ---

export const fetchPickupPointsApi = async (): Promise<PickupPoint[]> => {
  const storedLocal = getStoredMock('pickup_points', localPickupPoints);
  if (Array.isArray(storedLocal) && storedLocal.length > 0) {
    localPickupPoints = storedLocal;
  }

  let items: any[] = [];
  try {
    const res = await safeTransportApiCall<any>('/api/transport/pickup-points', { method: 'GET' }, null);
    items = Array.isArray(res) ? res : (res?.items || res?.data || []);
    if (items.length === 0) {
      const lookupRes = await safeTransportApiCall<any>('/api/transport/lookups/pickup-points', { method: 'GET' }, null);
      items = Array.isArray(lookupRes) ? lookupRes : (lookupRes?.items || lookupRes?.data || []);
    }
  } catch (e) {
    items = [];
  }

  if (items.length === 0 && localPickupPoints.length > 0) {
    return localPickupPoints;
  }

  // Merge items from API with localPickupPoints
  const mergedMap = new Map<string, PickupPoint>();
  localPickupPoints.forEach(p => mergedMap.set(String(p.id), p));
  items.forEach((p: any) => {
    const ptId = (p.id || p.pickupPointId || p.pickupId || '').toString();
    const ptRouteId = (p as any).routeId;
    const isRouteIdValid = ptRouteId !== undefined && ptRouteId !== null && String(ptRouteId) !== '0' && String(ptRouteId) !== '';
    if (ptId) {
      const existing = mergedMap.get(ptId);
      const normalized: PickupPoint = {
        ...existing,
        ...p,
        id: ptId,
        pickupName: p.pickupName || (p as any).pickupPointName || (p as any).stopName || existing?.pickupName || '',
        routeId: isRouteIdValid ? String(ptRouteId) : (existing?.routeId || ''),
        routeName: p.routeName || (p as any).selectRoute || existing?.routeName || '',
        sequenceNumber: Number(p.sequenceNumber !== undefined ? p.sequenceNumber : ((p as any).sequenceNo !== undefined ? (p as any).sequenceNo : (existing?.sequenceNumber || 1))),
        distanceFromSchoolKm: Number(p.distanceFromSchoolKm !== undefined ? p.distanceFromSchoolKm : ((p as any).distanceFromStart !== undefined ? (p as any).distanceFromStart : (existing?.distanceFromSchoolKm || 0))),
        arrivalTime: p.morningPickupTime || p.arrivalTime || (p as any).pickupTime || existing?.arrivalTime || '',
        morningPickupTime: p.morningPickupTime || p.arrivalTime || (p as any).pickupTime || existing?.morningPickupTime || '',
        eveningDropTime: p.eveningDropTime || (p as any).dropTime || existing?.eveningDropTime || '',
        monthlyFee: Number(p.monthlyFee !== undefined ? p.monthlyFee : ((p as any).monthlyFare !== undefined ? (p as any).monthlyFare : (existing?.monthlyFee || 0))),
        status: ((p.status as any) === true || String(p.status).toLowerCase() === 'true' || p.status === 'Active') ? 'Active' : (existing?.status || 'Inactive')
      };
      mergedMap.set(ptId, normalized);
    }
  });

  const finalPoints = Array.from(mergedMap.values());
  localPickupPoints = finalPoints;
  setStoredMock('pickup_points', finalPoints);
  return finalPoints;
};

export const fetchPickupPointByIdApi = async (id: string): Promise<PickupPoint | undefined> => {
  const fallback = localPickupPoints.find(p => String(p.id) === id);
  return safeTransportApiCall<PickupPoint>(`/api/transport/pickup-points/${id}`, { method: 'GET' }, fallback);
};

export const createPickupPointApi = async (data: Partial<PickupPoint>): Promise<PickupPoint> => {
  const inputRouteId = (data as any).routeId;
  const isInputRouteValid = inputRouteId !== undefined && inputRouteId !== null && String(inputRouteId) !== '0' && String(inputRouteId) !== '';

  const newPoint = {
    id: data.id || `PK-${Date.now()}`,
    pickupName: data.pickupName || (data as any).pickupPointName || '',
    routeId: isInputRouteValid ? String(inputRouteId) : '',
    routeName: data.routeName || '',
    sequenceNumber: data.sequenceNumber || (data as any).sequenceNo || 1,
    arrivalTime: data.arrivalTime || data.morningPickupTime || (data as any).pickupTime || '',
    morningPickupTime: data.morningPickupTime || data.arrivalTime || (data as any).pickupTime || '',
    eveningDropTime: data.eveningDropTime || (data as any).dropTime || '',
    distanceFromSchoolKm: data.distanceFromSchoolKm || (data as any).distanceFromStart || 0,
    monthlyFee: data.monthlyFee !== undefined ? data.monthlyFee : ((data as any).monthlyFare || 0),
    status: data.status || 'Active'
  } as unknown as PickupPoint;

  localPickupPoints = [
    ...localPickupPoints.filter(p => String(p.id) !== String(newPoint.id)),
    newPoint
  ];
  setStoredMock('pickup_points', localPickupPoints);
  try {
    localStorage.setItem('edu_db_pickup_points', JSON.stringify(localPickupPoints));
  } catch (e) {}

  try {
    const res = await safeTransportApiCall<PickupPoint>(
      '/api/transport/pickup-points',
      { method: 'POST', body: JSON.stringify(data) },
      newPoint
    );
    if (res && typeof res === 'object') {
      const resRouteId = (res as any).routeId;
      const isResRouteValid = resRouteId !== undefined && resRouteId !== null && String(resRouteId) !== '0' && String(resRouteId) !== '';

      const normalized: PickupPoint = {
        ...newPoint,
        ...res,
        id: String(res.id || (res as any).pickupPointId || newPoint.id),
        routeId: isResRouteValid ? String(resRouteId) : newPoint.routeId,
        routeName: res.routeName || newPoint.routeName,
        pickupName: res.pickupName || (res as any).pickupPointName || newPoint.pickupName,
        sequenceNumber: res.sequenceNumber || (res as any).sequenceNo || newPoint.sequenceNumber,
        morningPickupTime: res.morningPickupTime || res.arrivalTime || (res as any).pickupTime || newPoint.morningPickupTime || '',
        eveningDropTime: res.eveningDropTime || (res as any).dropTime || newPoint.eveningDropTime || '',
        distanceFromSchoolKm: res.distanceFromSchoolKm || (res as any).distanceFromStart || newPoint.distanceFromSchoolKm,
        monthlyFee: res.monthlyFee !== undefined ? res.monthlyFee : newPoint.monthlyFee,
        status: ((res.status as any) === true || String(res.status).toLowerCase() === 'true' || res.status === 'Active') ? 'Active' : 'Inactive'
      };
      return normalized;
    }
    return newPoint;
  } catch (err) {
    return newPoint;
  }
};

export const updatePickupPointApi = async (id: string, data: Partial<PickupPoint>): Promise<PickupPoint> => {
  const idx = localPickupPoints.findIndex(p => String(p.id) === id);
  if (idx !== -1) {
    localPickupPoints[idx] = { ...localPickupPoints[idx], ...data };
  } else {
    localPickupPoints.push({ id, ...data } as PickupPoint);
  }
  setStoredMock('pickup_points', localPickupPoints);
  try {
    localStorage.setItem('edu_db_pickup_points', JSON.stringify(localPickupPoints));
  } catch (e) {}

  const updated = localPickupPoints.find(p => String(p.id) === id) || (data as PickupPoint);
  try {
    return await safeTransportApiCall<PickupPoint>(
      `/api/transport/pickup-points/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      updated
    );
  } catch (err) {
    return updated;
  }
};

export const deletePickupPointApi = async (id: string): Promise<{ success: boolean }> => {
  localPickupPoints = localPickupPoints.filter(p => String(p.id) !== id);
  setStoredMock('pickup_points', localPickupPoints);
  try {
    localStorage.setItem('edu_db_pickup_points', JSON.stringify(localPickupPoints));
  } catch (e) {}

  try {
    return await safeTransportApiCall<{ success: boolean }>(
      `/api/transport/pickup-points/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  } catch (err) {
    return { success: true };
  }
};

// --- Vehicles ---

export const fetchVehiclesApi = async (): Promise<VehicleMaster[]> => {
  return safeTransportApiCall<VehicleMaster[]>('/api/transport/vehicles', { method: 'GET' }, localVehicles);
};

export const fetchVehicleByIdApi = async (id: string): Promise<VehicleMaster | undefined> => {
  const fallback = localVehicles.find(v => String(v.id) === id);
  return safeTransportApiCall<VehicleMaster>(`/api/transport/vehicles/${id}`, { method: 'GET' }, fallback);
};

export const createVehicleApi = async (data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
  const newVehicle = {
    id: data.id || `VH-${Date.now()}`,
    vehicleNumber: data.vehicleNumber || '',
    registrationNumber: data.registrationNumber || data.vehicleNumber || '',
    vehicleType: data.vehicleType || 'Bus',
    capacity: data.capacity || 0,
    isAC: data.isAC ?? true,
    chassisNumber: data.chassisNumber || '',
    engineNumber: data.engineNumber || '',
    insuranceExpiry: data.insuranceExpiry || '',
    pollutionExpiry: data.pollutionExpiry || '',
    fitnessExpiry: data.fitnessExpiry || '',
    gpsDeviceId: data.gpsDeviceId || '',
    status: data.status || 'Active'
  } as unknown as VehicleMaster;

  localVehicles.push(newVehicle);
  setStoredMock('vehicle_masters', localVehicles);

  return safeTransportApiCall<VehicleMaster>(
    '/api/transport/vehicles',
    { method: 'POST', body: JSON.stringify(data) },
    newVehicle
  );
};

export const updateVehicleApi = async (id: string, data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
  const idx = localVehicles.findIndex(v => String(v.id) === id);
  if (idx !== -1) {
    localVehicles[idx] = { ...localVehicles[idx], ...data };
    setStoredMock('vehicle_masters', localVehicles);
  }
  const updated = localVehicles[idx] || (data as VehicleMaster);
  return safeTransportApiCall<VehicleMaster>(
    `/api/transport/vehicles/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteVehicleApi = async (id: string): Promise<{ success: boolean }> => {
  localVehicles = localVehicles.filter(v => String(v.id) !== id);
  setStoredMock('vehicle_masters', localVehicles);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicles/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Drivers ---

export const fetchDriversApi = async (): Promise<DriverMaster[]> => {
  return fetchListWithLookupFallback<DriverMaster[]>(
    '/api/transport/drivers',
    '/api/transport/lookups/drivers',
    'driverId',
    '/api/transport/drivers',
    localDrivers
  );
};

export const fetchDriverByIdApi = async (id: string): Promise<DriverMaster | undefined> => {
  const fallback = localDrivers.find(d => String(d.id) === id);
  return safeTransportApiCall<DriverMaster>(`/api/transport/drivers/${id}`, { method: 'GET' }, fallback);
};

export const createDriverApi = async (data: Partial<DriverMaster>): Promise<DriverMaster> => {
  const newDriver = {
    id: data.id || `DRV-${Date.now()}`,
    driverName: data.driverName || '',
    licenseNumber: data.licenseNumber || '',
    mobileNumber: data.mobileNumber || '',
    licenseExpiryDate: data.licenseExpiryDate || '',
    address: data.address || '',
    emergencyContact: data.emergencyContact || '',
    experienceYears: data.experienceYears || 0,
    status: data.status || 'Active'
  } as unknown as DriverMaster;

  localDrivers.push(newDriver);
  setStoredMock('driver_masters', localDrivers);

  return safeTransportApiCall<DriverMaster>(
    '/api/transport/drivers',
    { method: 'POST', body: JSON.stringify(data) },
    newDriver
  );
};

export const updateDriverApi = async (id: string, data: Partial<DriverMaster>): Promise<DriverMaster> => {
  const idx = localDrivers.findIndex(d => String(d.id) === id);
  if (idx !== -1) {
    localDrivers[idx] = { ...localDrivers[idx], ...data };
    setStoredMock('driver_masters', localDrivers);
  }
  const updated = localDrivers[idx] || (data as DriverMaster);
  return safeTransportApiCall<DriverMaster>(
    `/api/transport/drivers/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteDriverApi = async (id: string): Promise<{ success: boolean }> => {
  localDrivers = localDrivers.filter(d => String(d.id) !== id);
  setStoredMock('driver_masters', localDrivers);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/drivers/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Vehicle Assignments ---

export const fetchVehicleAssignmentsApi = async (): Promise<VehicleAssignment[]> => {
  try {
    const lookups = await apiClient('/api/transport/lookups/vehicle-assignments', { method: 'GET' });
    const lookupList = Array.isArray(lookups) ? lookups : (lookups?.items || lookups?.data || []);
    if (lookupList.length > 0) {
      const mapped = lookupList.map((a: any) => ({
        id: (a.assignmentId || a.id || "").toString(),
        routeId: (a.routeId || "").toString(),
        routeName: a.routeName || "",
        vehicleId: (a.vehicleId || "").toString(),
        vehicleNumber: a.vehicleNumber || "",
        driverId: (a.driverId || "").toString(),
        driverName: a.driverName || "",
        attendantId: (a.attendantId || "").toString(),
        attendantName: a.attendantName || "Unassigned",
        morningTripTime: a.morningTripTime || "",
        eveningTripTime: a.eveningTripTime || "",
        status: a.status ? "Active" : (a.status === false ? "Inactive" : "Active"),
        effectiveFrom: a.effectiveFrom || new Date().toISOString().split('T')[0]
      }));
      return mapped as unknown as VehicleAssignment[];
    }
  } catch (err) {
    console.error("Failed to fetch vehicle assignments lookup", err);
  }
  return safeTransportApiCall<VehicleAssignment[]>('/api/transport/vehicle-assignments', { method: 'GET' }, localVehicleAssignments);
};

export const fetchVehicleAssignmentByIdApi = async (id: string): Promise<VehicleAssignment | undefined> => {
  const fallback = localVehicleAssignments.find(a => String(a.id) === id);
  return safeTransportApiCall<VehicleAssignment>(`/api/transport/vehicle-assignments/${id}`, { method: 'GET' }, fallback);
};

export const createVehicleAssignmentApi = async (data: Partial<VehicleAssignment>): Promise<VehicleAssignment> => {
  const newAssign: VehicleAssignment = {
    id: data.id || `VA-${Date.now()}`,
    vehicleId: data.vehicleId || '',
    vehicleNumber: data.vehicleNumber || '',
    routeId: data.routeId || '',
    routeName: data.routeName || '',
    driverId: data.driverId || '',
    driverName: data.driverName || '',
    effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
    status: data.status || 'Active'
  } as unknown as VehicleAssignment;

  localVehicleAssignments.push(newAssign);
  setStoredMock('vehicle_assignments', localVehicleAssignments);

  return safeTransportApiCall<VehicleAssignment>(
    '/api/transport/vehicle-assignments',
    { method: 'POST', body: JSON.stringify(data) },
    newAssign
  );
};

export const updateVehicleAssignmentApi = async (id: string, data: Partial<VehicleAssignment>): Promise<VehicleAssignment> => {
  const idx = localVehicleAssignments.findIndex(a => String(a.id) === id);
  if (idx !== -1) {
    localVehicleAssignments[idx] = { ...localVehicleAssignments[idx], ...data };
    setStoredMock('vehicle_assignments', localVehicleAssignments);
  }
  const updated = localVehicleAssignments[idx] || (data as VehicleAssignment);
  return safeTransportApiCall<VehicleAssignment>(
    `/api/transport/vehicle-assignments/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteVehicleAssignmentApi = async (id: string): Promise<{ success: boolean }> => {
  localVehicleAssignments = localVehicleAssignments.filter(a => String(a.id) !== id);
  setStoredMock('vehicle_assignments', localVehicleAssignments);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicle-assignments/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Student Transport Assignments ---

export const fetchStudentAssignmentsApi = async (): Promise<StudentTransport[]> => {
  return safeTransportApiCall<StudentTransport[]>('/api/transport/student-assignments', { method: 'GET' }, localStudentAssignments);
};

export const fetchStudentAssignmentByIdApi = async (id: string): Promise<StudentTransport | undefined> => {
  const fallback = localStudentAssignments.find(s => String(s.id) === id);
  return safeTransportApiCall<StudentTransport>(`/api/transport/student-assignments/${id}`, { method: 'GET' }, fallback);
};

export const createStudentAssignmentApi = async (data: Partial<StudentTransport>): Promise<StudentTransport> => {
  const newSt = {
    id: data.id || `ST-${Date.now()}`,
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    admissionNo: data.admissionNo || '',
    routeId: data.routeId || '',
    routeName: data.routeName || '',
    pickupPoint: data.pickupPoint || '',
    feePlan: data.feePlan || 'Monthly',
    feeAmount: data.feeAmount || 0,
    effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0],
    vehicleId: data.vehicleId || '',
    status: data.status || 'Active'
  } as unknown as StudentTransport;

  localStudentAssignments.push(newSt);
  setStoredMock('student_transports', localStudentAssignments);

  return safeTransportApiCall<StudentTransport>(
    '/api/transport/student-assignments',
    { method: 'POST', body: JSON.stringify(data) },
    newSt
  );
};

export const updateStudentAssignmentApi = async (id: string, data: Partial<StudentTransport>): Promise<StudentTransport> => {
  const idx = localStudentAssignments.findIndex(s => String(s.id) === id);
  if (idx !== -1) {
    localStudentAssignments[idx] = { ...localStudentAssignments[idx], ...data };
    setStoredMock('student_transports', localStudentAssignments);
  }
  const updated = localStudentAssignments[idx] || (data as StudentTransport);
  return safeTransportApiCall<StudentTransport>(
    `/api/transport/student-assignments/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteStudentAssignmentApi = async (id: string): Promise<{ success: boolean }> => {
  localStudentAssignments = localStudentAssignments.filter(s => String(s.id) !== id);
  setStoredMock('student_transports', localStudentAssignments);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/student-assignments/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Maintenance ---

export const fetchMaintenanceApi = async (): Promise<VehicleMaintenance[]> => {
  return safeTransportApiCall<VehicleMaintenance[]>('/api/transport/vehicle-maintenance', { method: 'GET' }, localMaintenance);
};

export const fetchMaintenanceByIdApi = async (id: string): Promise<VehicleMaintenance | undefined> => {
  const fallback = localMaintenance.find(m => String(m.id) === id);
  return safeTransportApiCall<VehicleMaintenance>(`/api/transport/vehicle-maintenance/${id}`, { method: 'GET' }, fallback);
};

export const createMaintenanceApi = async (data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
  const newM = {
    id: data.id || `MAIN-${Date.now()}`,
    vehicleId: data.vehicleId || '',
    vehicleNumber: data.vehicleNumber || '',
    serviceDate: data.serviceDate || new Date().toISOString().split('T')[0],
    serviceType: data.serviceType || 'General Service',
    vendor: data.vendor || '',
    cost: data.cost || 0,
    nextServiceDue: data.nextServiceDue || '',
    remarks: data.remarks || '',
    status: data.status || 'Completed'
  } as unknown as VehicleMaintenance;

  localMaintenance.push(newM);
  setStoredMock('vehicle_maintenances', localMaintenance);

  return safeTransportApiCall<VehicleMaintenance>(
    '/api/transport/vehicle-maintenance',
    { method: 'POST', body: JSON.stringify(data) },
    newM
  );
};

export const updateMaintenanceApi = async (id: string, data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
  const idx = localMaintenance.findIndex(m => String(m.id) === id);
  if (idx !== -1) {
    localMaintenance[idx] = { ...localMaintenance[idx], ...data };
    setStoredMock('vehicle_maintenances', localMaintenance);
  }
  const updated = localMaintenance[idx] || (data as VehicleMaintenance);
  return safeTransportApiCall<VehicleMaintenance>(
    `/api/transport/vehicle-maintenance/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deleteMaintenanceApi = async (id: string): Promise<{ success: boolean }> => {
  localMaintenance = localMaintenance.filter(m => String(m.id) !== id);
  setStoredMock('vehicle_maintenances', localMaintenance);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicle-maintenance/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

export const fetchMaintenanceLookupApi = async (): Promise<any> => {
  return safeTransportApiCall('/api/transport/vehicle-maintenance/lookup', { method: 'GET' }, { vehicles: localVehicles });
};

// --- Dashboards & Reports ---

export const fetchTransportDashboardApi = async (): Promise<any> => {
  const defaultDashboard = {
    totalRoutes: localRoutes.length,
    totalVehicles: localVehicles.length,
    totalDrivers: localDrivers.length,
    totalStudents: localStudentAssignments.length,
    activeVehicles: localVehicles.filter(v => v.status === 'Active').length,
    inMaintenance: localMaintenance.filter(m => m.status === 'Scheduled' || m.status === 'Overdue').length
  };
  return safeTransportApiCall('/api/transport/dashboard', { method: 'GET' }, defaultDashboard);
};

export const fetchTransportReportsVehicleWiseApi = async () => safeTransportApiCall('/api/transport/reports/vehicle-wise', { method: 'GET' }, localVehicles);
export const fetchTransportReportsRouteWiseApi = async () => safeTransportApiCall('/api/transport/reports/route-wise', { method: 'GET' }, localRoutes);
export const fetchTransportReportsPickupWiseApi = async () => safeTransportApiCall('/api/transport/reports/pickup-wise', { method: 'GET' }, localPickupPoints);
export const fetchTransportReportsDriverWiseApi = async () => safeTransportApiCall('/api/transport/reports/driver-wise', { method: 'GET' }, localDrivers);
export const fetchTransportReportsSeatOccupancyApi = async () => safeTransportApiCall('/api/transport/reports/seat-occupancy', { method: 'GET' }, []);
export const fetchTransportReportsMaintenanceApi = async () => safeTransportApiCall('/api/transport/reports/maintenance', { method: 'GET' }, localMaintenance);
export const fetchTransportReportsMonthlyCostApi = async () => safeTransportApiCall('/api/transport/reports/monthly-cost', { method: 'GET' }, []);

// --- Dropdown Lookups ---

export const fetchTransportLookupsVehiclesApi = async () => safeTransportApiCall('/api/transport/lookups/vehicles', { method: 'GET' }, localVehicles);
export const fetchTransportLookupsRoutesApi = async () => safeTransportApiCall('/api/transport/lookups/routes', { method: 'GET' }, localRoutes);
export const fetchTransportLookupsDriversApi = async () => safeTransportApiCall('/api/transport/lookups/drivers', { method: 'GET' }, localDrivers);
export const fetchTransportLookupsPickupPointsApi = async () => safeTransportApiCall('/api/transport/lookups/pickup-points', { method: 'GET' }, localPickupPoints);
export const fetchTransportLookupsVehicleAssignmentsApi = async () => safeTransportApiCall('/api/transport/lookups/vehicle-assignments', { method: 'GET' }, localVehicleAssignments);
export const fetchTransportLookupsStudentAssignmentsApi = async () => safeTransportApiCall('/api/transport/lookups/student-assignments', { method: 'GET' }, localStudentAssignments);

// --- Bus Attendants ---

export const fetchAttendantsApi = async (): Promise<BusAttendantMaster[]> => {
  return safeTransportApiCall<BusAttendantMaster[]>('/api/transport/bus-attendants', { method: 'GET' }, []);
};

export const createAttendantApi = async (data: Partial<BusAttendantMaster>): Promise<BusAttendantMaster> => {
  return safeTransportApiCall<BusAttendantMaster>(
    '/api/transport/bus-attendants',
    { method: 'POST', body: JSON.stringify(data) },
    data as BusAttendantMaster
  );
};

export const updateAttendantApi = async (id: string, data: Partial<BusAttendantMaster>): Promise<BusAttendantMaster> => {
  return safeTransportApiCall<BusAttendantMaster>(
    `/api/transport/bus-attendants/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    data as BusAttendantMaster
  );
};

export const deleteAttendantApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/bus-attendants/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Driver Documents ---

export interface DriverDocumentDto {
  id?: number;
  documentCategory: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  badgeNumber?: string;
  fileName?: string;
  fileUrl?: string;
}

export const fetchDriverDocumentsApi = async (driverId: string): Promise<DriverDocumentDto[]> => {
  return safeTransportApiCall<DriverDocumentDto[]>(
    `/api/transport/drivers/${driverId}/documents`,
    { method: 'GET' },
    []
  );
};

export const createDriverDocumentApi = async (driverId: string, data: DriverDocumentDto): Promise<DriverDocumentDto> => {
  return safeTransportApiCall<DriverDocumentDto>(
    `/api/transport/drivers/${driverId}/documents`,
    { method: 'POST', body: JSON.stringify(data) },
    data
  );
};

export const deleteDriverDocumentApi = async (driverId: string, docId: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/drivers/${driverId}/documents/${docId}`,
    { method: 'DELETE' },
    { success: true }
  );
};
