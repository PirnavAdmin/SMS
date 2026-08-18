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
    // API endpoint unreachable or error - using testing mock bypass
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
    routeName: data.routeName || 'Sample Route',
    routeCode: data.routeCode || 'RTC-01',
    routeStart: data.routeStart || 'Main Campus',
    routeEnd: data.routeEnd || 'City Center',
    totalDistanceKm: data.totalDistanceKm || 15,
    estimatedTimeMinutes: data.estimatedTimeMinutes || 45,
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
  localRoutes = localRoutes.filter(r => String(r.id) !== id);
  setStoredMock('route_masters', localRoutes);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/routes/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
};

// --- Pickup Points ---
export const fetchPickupPointsApi = async (): Promise<PickupPoint[]> => {
  return safeTransportApiCall<PickupPoint[]>('/api/transport/pickup-points', { method: 'GET' }, localPickupPoints);
};

export const fetchPickupPointByIdApi = async (id: string): Promise<PickupPoint | undefined> => {
  const fallback = localPickupPoints.find(p => String(p.id) === id);
  return safeTransportApiCall<PickupPoint>(`/api/transport/pickup-points/${id}`, { method: 'GET' }, fallback);
};

export const createPickupPointApi = async (data: Partial<PickupPoint>): Promise<PickupPoint> => {
  const newPoint = {
    id: data.id || `PK-${Date.now()}`,
    pickupName: data.pickupName || 'Main Station',
    routeId: data.routeId || '',
    routeName: data.routeName || 'Sample Route',
    sequenceNumber: data.sequenceNumber || 1,
    arrivalTime: data.arrivalTime || '07:30 AM',
    distanceFromSchoolKm: data.distanceFromSchoolKm || 5,
    monthlyFee: data.monthlyFee || 1500,
    status: data.status || 'Active'
  } as unknown as PickupPoint;
  localPickupPoints.push(newPoint);
  setStoredMock('pickup_points', localPickupPoints);

  return safeTransportApiCall<PickupPoint>(
    '/api/transport/pickup-points',
    { method: 'POST', body: JSON.stringify(data) },
    newPoint
  );
};

export const updatePickupPointApi = async (id: string, data: Partial<PickupPoint>): Promise<PickupPoint> => {
  const idx = localPickupPoints.findIndex(p => String(p.id) === id);
  if (idx !== -1) {
    localPickupPoints[idx] = { ...localPickupPoints[idx], ...data };
    setStoredMock('pickup_points', localPickupPoints);
  }
  const updated = localPickupPoints[idx] || (data as PickupPoint);

  return safeTransportApiCall<PickupPoint>(
    `/api/transport/pickup-points/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    updated
  );
};

export const deletePickupPointApi = async (id: string): Promise<{ success: boolean }> => {
  localPickupPoints = localPickupPoints.filter(p => String(p.id) !== id);
  setStoredMock('pickup_points', localPickupPoints);
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/pickup-points/${id}`,
    { method: 'DELETE' },
    { success: true }
  );
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
    vehicleNumber: data.vehicleNumber || 'KA-01-EXP-1010',
    registrationNumber: data.registrationNumber || 'KA-01-EXP-1010',
    vehicleType: data.vehicleType || 'Bus',
    capacity: data.capacity || 40,
    isAC: data.isAC ?? true,
    chassisNumber: data.chassisNumber || 'CH-001',
    engineNumber: data.engineNumber || 'ENG-001',
    insuranceExpiry: data.insuranceExpiry || '2026-12-31',
    pollutionExpiry: data.pollutionExpiry || '2026-12-31',
    fitnessExpiry: data.fitnessExpiry || '2026-12-31',
    gpsDeviceId: data.gpsDeviceId || 'GPS-001',
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
    driverName: data.driverName || 'Driver',
    licenseNumber: data.licenseNumber || 'DL-99887766',
    mobileNumber: data.mobileNumber || '+91 9876543210',
    licenseExpiryDate: data.licenseExpiryDate || '2027-12-31',
    address: data.address || 'Campus Staff Quarters',
    emergencyContact: data.emergencyContact || '+91 9876543210',
    experienceYears: data.experienceYears || 5,
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
        routeId: "",
        routeName: a.routeName || "",
        vehicleId: "",
        vehicleNumber: a.vehicleNumber || "",
        driverId: "",
        driverName: a.driverName || "",
        attendantId: "",
        attendantName: "Unassigned",
        morningTripTime: "07:00 AM",
        eveningTripTime: "03:45 PM",
        status: "Active",
        effectiveFrom: new Date().toISOString().split('T')[0]
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
    vehicleNumber: data.vehicleNumber || 'KA-01-EXP-1010',
    routeId: data.routeId || '',
    routeName: data.routeName || 'Sample Route',
    driverId: data.driverId || '',
    driverName: data.driverName || 'Driver',
    effectiveFrom: data.effectiveFrom || '2026-06-01',
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
    studentName: data.studentName || 'Student',
    admissionNo: data.admissionNo || 'ADM-101',
    routeId: data.routeId || '',
    routeName: data.routeName || 'Sample Route',
    pickupPoint: data.pickupPoint || 'Main Station',
    feePlan: data.feePlan || 'Monthly',
    feeAmount: data.feeAmount || 1500,
    effectiveFrom: data.effectiveFrom || '2026-06-01',
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
    vehicleNumber: data.vehicleNumber || 'KA-01-EXP-1010',
    serviceDate: data.serviceDate || new Date().toISOString().split('T')[0],
    serviceType: data.serviceType || 'General Service',
    vendor: data.vendor || 'Auto Care Center',
    cost: data.cost || 0,
    nextServiceDue: data.nextServiceDue || '2026-12-31',
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
