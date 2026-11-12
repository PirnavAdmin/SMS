import { apiClient } from './client';
import { RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, StudentTransport, VehicleMaintenance } from '../types';
import { BusAttendantMaster } from '../components/modules/Transport/transportData';
import { normalizeDrivingLicense, validateDrivingLicense, DRIVING_LICENCE_ERROR_MESSAGE } from '../utils/validation';

const safeTransportApiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const res = await apiClient(endpoint, options);
  if (res !== undefined && res !== null && !(res as any)?.error) {
    return ((res as any)?.data !== undefined ? (res as any).data : res) as T;
  }
  throw new Error((res as any)?.message || (res as any)?.error || 'Transport API request failed');
};

const fetchListWithLookupFallback = async <T>(
  listEndpoint: string,
  lookupEndpoint: string,
  idKey: string,
  detailEndpointPrefix: string
): Promise<T> => {
  const listRes = await apiClient(listEndpoint, { method: 'GET' });
  const items = Array.isArray(listRes) ? listRes : (listRes?.items || listRes?.data || []);
  if (items.length > 0) {
    return (listRes?.data !== undefined ? listRes.data : listRes) as unknown as T;
  }
  const lookups = await apiClient(lookupEndpoint, { method: 'GET' });
  const lookupList = Array.isArray(lookups) ? lookups : (lookups?.items || lookups?.data || []);
  if (lookupList.length > 0) {
    const detailsPromises = lookupList.map(async (lookup: any) => {
      const id = lookup[idKey] || lookup.id || lookup.routeId || lookup.driverId || lookup.assignmentId;
      if (!id) return null;
      return await apiClient(`${detailEndpointPrefix}/${id}`, { method: 'GET' });
    });
    const detailsResults = await Promise.all(detailsPromises);
    const validDetails = detailsResults.filter(Boolean);
    if (validDetails.length > 0) {
      return validDetails as unknown as T;
    }
  }
  return [] as unknown as T;
};

// --- Routes ---

export const fetchRoutesApi = async (): Promise<RouteMaster[]> => {
  return fetchListWithLookupFallback<RouteMaster[]>(
    '/api/transport/routes',
    '/api/transport/lookups/routes',
    'routeId',
    '/api/transport/routes'
  );
};

export const fetchRouteByIdApi = async (id: string): Promise<RouteMaster | undefined> => {
  return safeTransportApiCall<RouteMaster>(`/api/transport/routes/${id}`, { method: 'GET' });
};

export const createRouteApi = async (data: Partial<RouteMaster>): Promise<RouteMaster> => {
  return safeTransportApiCall<RouteMaster>(
    '/api/transport/routes',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateRouteApi = async (id: string, data: Partial<RouteMaster>): Promise<RouteMaster> => {
  return safeTransportApiCall<RouteMaster>(
    `/api/transport/routes/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteRouteApi = async (id: string): Promise<{ success: boolean }> => {
  const cleanId = String(id || '').trim();
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/routes/${encodeURIComponent(cleanId)}`,
    { method: 'DELETE' }
  );
};

// --- Pickup Points ---

export const fetchPickupPointsApi = async (): Promise<PickupPoint[]> => {
  let items: any[] = [];
  const res = await safeTransportApiCall<any>('/api/transport/pickup-points', { method: 'GET' });
  if (res !== null && res !== undefined) {
    items = Array.isArray(res) ? res : (res?.items || res?.data || []);
  }
  if (items.length === 0) {
    const lookupRes = await safeTransportApiCall<any>('/api/transport/lookups/pickup-points', { method: 'GET' });
    if (lookupRes !== null && lookupRes !== undefined) {
      items = Array.isArray(lookupRes) ? lookupRes : (lookupRes?.items || lookupRes?.data || []);
    }
  }

  return items.map((p: any) => {
    const ptId = (p.id || p.pickupPointId || p.pickupId || '').toString();
    const ptRouteId = (p as any).routeId;
    const isRouteIdValid = ptRouteId !== undefined && ptRouteId !== null && String(ptRouteId) !== '0' && String(ptRouteId) !== '';
    return {
      id: ptId,
      pickupName: p.pickupName || (p as any).pickupPointName || (p as any).stopName || '',
      routeId: isRouteIdValid ? String(ptRouteId) : '',
      routeName: p.routeName || (p as any).selectRoute || '',
      sequenceNumber: Number(p.sequenceNumber !== undefined ? p.sequenceNumber : ((p as any).sequenceNo !== undefined ? (p as any).sequenceNo : 1)),
      distanceFromSchoolKm: Number(p.distanceFromSchoolKm !== undefined ? p.distanceFromSchoolKm : ((p as any).distanceFromStart !== undefined ? (p as any).distanceFromStart : 0)),
      arrivalTime: p.morningPickupTime || p.arrivalTime || (p as any).pickupTime || '',
      morningPickupTime: p.morningPickupTime || p.arrivalTime || (p as any).pickupTime || '',
      eveningDropTime: p.eveningDropTime || (p as any).dropTime || '',
      monthlyFee: Number(p.monthlyFee !== undefined ? p.monthlyFee : ((p as any).monthlyFare !== undefined ? (p as any).monthlyFare : 0)),
      status: ((p.status as any) === true || String(p.status).toLowerCase() === 'true' || p.status === 'Active') ? 'Active' : 'Inactive'
    };
  });
};

export const fetchPickupPointByIdApi = async (id: string): Promise<PickupPoint | undefined> => {
  return safeTransportApiCall<PickupPoint>(`/api/transport/pickup-points/${id}`, { method: 'GET' });
};

export const createPickupPointApi = async (data: Partial<PickupPoint>): Promise<PickupPoint> => {
  const res = await safeTransportApiCall<any>(
    '/api/transport/pickup-points',
    { method: 'POST', body: JSON.stringify(data) }
  );
  const resRouteId = res?.routeId;
  const isResRouteValid = resRouteId !== undefined && resRouteId !== null && String(resRouteId) !== '0' && String(resRouteId) !== '';
  return {
    ...res,
    id: String(res?.id || res?.pickupPointId || ''),
    routeId: isResRouteValid ? String(resRouteId) : (data.routeId ? String(data.routeId) : ''),
    routeName: res?.routeName || data.routeName || '',
    pickupName: res?.pickupName || res?.pickupPointName || data.pickupName || '',
    sequenceNumber: res?.sequenceNumber ?? res?.sequenceNo ?? data.sequenceNumber ?? 1,
    morningPickupTime: res?.morningPickupTime || res?.arrivalTime || res?.pickupTime || data.morningPickupTime || '',
    eveningDropTime: res?.eveningDropTime || res?.dropTime || data.eveningDropTime || '',
    distanceFromSchoolKm: res?.distanceFromSchoolKm ?? res?.distanceFromStart ?? data.distanceFromSchoolKm ?? 0,
    monthlyFee: res?.monthlyFee ?? data.monthlyFee ?? 0,
    status: (res?.status === true || String(res?.status).toLowerCase() === 'true' || res?.status === 'Active') ? 'Active' : 'Inactive'
  } as PickupPoint;
};

export const updatePickupPointApi = async (id: string, data: Partial<PickupPoint>): Promise<PickupPoint> => {
  return safeTransportApiCall<PickupPoint>(
    `/api/transport/pickup-points/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deletePickupPointApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/pickup-points/${id}`,
    { method: 'DELETE' }
  );
};

// --- Vehicles ---

export const fetchVehiclesApi = async (): Promise<VehicleMaster[]> => {
  return safeTransportApiCall<VehicleMaster[]>('/api/transport/vehicles', { method: 'GET' });
};

export const fetchVehicleByIdApi = async (id: string): Promise<VehicleMaster | undefined> => {
  return safeTransportApiCall<VehicleMaster>(`/api/transport/vehicles/${id}`, { method: 'GET' });
};

export const createVehicleApi = async (data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
  return safeTransportApiCall<VehicleMaster>(
    '/api/transport/vehicles',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateVehicleApi = async (id: string, data: Partial<VehicleMaster>): Promise<VehicleMaster> => {
  return safeTransportApiCall<VehicleMaster>(
    `/api/transport/vehicles/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteVehicleApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicles/${id}`,
    { method: 'DELETE' }
  );
};

// --- Drivers ---

export const fetchDriversApi = async (): Promise<DriverMaster[]> => {
  return fetchListWithLookupFallback<DriverMaster[]>(
    '/api/transport/drivers',
    '/api/transport/lookups/drivers',
    'driverId',
    '/api/transport/drivers'
  );
};

export const fetchDriverByIdApi = async (id: string): Promise<DriverMaster | undefined> => {
  return safeTransportApiCall<DriverMaster>(`/api/transport/drivers/${id}`, { method: 'GET' });
};

export const createDriverApi = async (data: Partial<DriverMaster>): Promise<DriverMaster> => {
  const rawLicense = data.licenseNumber || (data as any).licenceNumber || (data as any).commercialLicenseNo || '';
  const normalizedLicense = normalizeDrivingLicense(rawLicense);
  if (normalizedLicense) {
    const check = validateDrivingLicense(normalizedLicense, true);
    if (!check.isValid) {
      throw new Error(check.error || DRIVING_LICENCE_ERROR_MESSAGE);
    }
  }

  const payload = {
    ...data,
    ...(normalizedLicense ? { licenseNumber: normalizedLicense } : {})
  };

  return safeTransportApiCall<DriverMaster>(
    '/api/transport/drivers',
    { method: 'POST', body: JSON.stringify(payload) }
  );
};

export const updateDriverApi = async (id: string, data: Partial<DriverMaster>): Promise<DriverMaster> => {
  const rawLicense = data.licenseNumber ?? (data as any).licenceNumber ?? (data as any).commercialLicenseNo;
  const normalizedLicense = rawLicense !== undefined ? normalizeDrivingLicense(String(rawLicense)) : undefined;
  if (normalizedLicense) {
    const check = validateDrivingLicense(normalizedLicense, true);
    if (!check.isValid) {
      throw new Error(check.error || DRIVING_LICENCE_ERROR_MESSAGE);
    }
  }

  const payload = {
    ...data,
    ...(normalizedLicense !== undefined
      ? {
          licenseNumber: normalizedLicense,
          licenceNumber: normalizedLicense,
          commercialLicenseNo: normalizedLicense,
        }
      : {}),
  };

  return safeTransportApiCall<DriverMaster>(
    `/api/transport/drivers/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
};

export const deleteDriverApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/drivers/${id}`,
    { method: 'DELETE' }
  );
};

// --- Vehicle Assignments ---

export const fetchVehicleAssignmentsApi = async (): Promise<VehicleAssignment[]> => {
  const listRes = await apiClient('/api/transport/vehicle-assignments', { method: 'GET' });
  const items = Array.isArray(listRes) ? listRes : (listRes?.items || listRes?.Items || listRes?.data?.items || listRes?.data?.Items || listRes?.data || []);
  const mapAssignment = (a: any) => ({
    id: (a.assignmentId || a.id || "").toString(),
    routeId: (a.routeId || "").toString(),
    routeName: a.routeName || a.selectRoute || "",
    vehicleId: (a.vehicleId || "").toString(),
    vehicleNumber: a.vehicleNumber || a.selectActiveVehicle || "",
    driverId: (a.driverId || "").toString(),
    driverName: a.driverName || a.selectLicensedDriver || "",
    driverEmployeeId: a.driverEmployeeId || a.employeeId || "",
    attendantId: a.attendantId ? a.attendantId.toString() : "",
    attendantName: a.attendantName || a.selectBusAttendant || a.busAttendant || "",
    attendantEmployeeId: a.attendantEmployeeId || "",
    attendantMobile: a.attendantMobile || "",
    morningTripTime: a.morningTripTime || a.morningTrip || "",
    eveningTripTime: a.eveningTripTime || a.eveningTrip || "",
    status: (a.status === true || String(a.status).toLowerCase() === 'true' || a.status === 'Active') ? "Active" : "Inactive",
    branch: a.branchName || a.branch || "",
    academicYear: a.academicYear || "",
    effectiveFrom: a.effectiveFrom || a.assignmentDate || new Date().toISOString().split('T')[0],
    effectiveTo: a.effectiveTo || ""
  });

  if (items.length > 0) {
    return items.map(mapAssignment) as unknown as VehicleAssignment[];
  }

  const lookups = await apiClient('/api/transport/lookups/vehicle-assignments', { method: 'GET' });
  const lookupList = Array.isArray(lookups) ? lookups : (lookups?.items || lookups?.data || []);
  return lookupList.map(mapAssignment) as unknown as VehicleAssignment[];
};

export const fetchVehicleAssignmentByIdApi = async (id: string): Promise<VehicleAssignment | undefined> => {
  return safeTransportApiCall<VehicleAssignment>(`/api/transport/vehicle-assignments/${id}`, { method: 'GET' });
};

export const createVehicleAssignmentApi = async (data: Partial<VehicleAssignment>): Promise<VehicleAssignment> => {
  return safeTransportApiCall<VehicleAssignment>(
    '/api/transport/vehicle-assignments',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateVehicleAssignmentApi = async (id: string, data: Partial<VehicleAssignment>): Promise<VehicleAssignment> => {
  return safeTransportApiCall<VehicleAssignment>(
    `/api/transport/vehicle-assignments/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteVehicleAssignmentApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicle-assignments/${id}`,
    { method: 'DELETE' }
  );
};

export const fetchStudentAssignmentsApi = async (): Promise<StudentTransport[]> => {
  const res: any = await apiClient('/api/transport/student-assignments', { method: 'GET' });
  const items = Array.isArray(res) ? res : (res?.items || res?.data?.items || res?.data || []);
  return items.map((t: any) => ({
    id: String(t.studentTransportAssignmentId || t.id || ''),
    studentId: t.studentId ? String(t.studentId) : '',
    studentName: t.studentName || t.fullName || '',
    admissionNo: t.admissionNo || '',
    routeId: t.routeId ? String(t.routeId) : '',
    routeName: t.routeName || '',
    pickupPointId: t.pickupPointId ? String(t.pickupPointId) : '',
    pickupPoint: t.pickupPointName || t.pickupPoint || '',
    vehicleAssignmentId: t.vehicleAssignmentId ? String(t.vehicleAssignmentId) : '',
    vehicleId: t.vehicleAssignmentId ? String(t.vehicleAssignmentId) : (t.vehicleId ? String(t.vehicleId) : ''),
    vehicleNumber: t.vehicleNumber || '',
    driverName: t.driverName || '',
    transportType: t.transportType || 'Both',
    effectiveFrom: t.effectiveFrom ? String(t.effectiveFrom).split('T')[0] : '',
    effectiveTo: t.effectiveTo ? String(t.effectiveTo).split('T')[0] : '',
    feePlan: t.feePlan || 'Monthly',
    feeAmount: Number(t.feeAmount || 0),
    status: (t.status === true || String(t.status).toLowerCase() === 'true' || t.status === 'Active') ? 'Active' : 'Inactive'
  })) as unknown as StudentTransport[];
};

export const fetchStudentAssignmentByIdApi = async (id: string): Promise<StudentTransport | undefined> => {
  return safeTransportApiCall<StudentTransport>(`/api/transport/student-assignments/${id}`, { method: 'GET' });
};

export const createStudentAssignmentApi = async (data: Partial<StudentTransport>): Promise<StudentTransport> => {
  return safeTransportApiCall<StudentTransport>(
    '/api/transport/student-assignments',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateStudentAssignmentApi = async (id: string, data: Partial<StudentTransport>): Promise<StudentTransport> => {
  return safeTransportApiCall<StudentTransport>(
    `/api/transport/student-assignments/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteStudentAssignmentApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/student-assignments/${id}`,
    { method: 'DELETE' }
  );
};

// --- Maintenance ---

export const fetchMaintenanceApi = async (): Promise<VehicleMaintenance[]> => {
  return safeTransportApiCall<VehicleMaintenance[]>('/api/transport/vehicle-maintenance', { method: 'GET' });
};

export const fetchMaintenanceByIdApi = async (id: string): Promise<VehicleMaintenance | undefined> => {
  return safeTransportApiCall<VehicleMaintenance>(`/api/transport/vehicle-maintenance/${id}`, { method: 'GET' });
};

export const createMaintenanceApi = async (data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
  return safeTransportApiCall<VehicleMaintenance>(
    '/api/transport/vehicle-maintenance',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateMaintenanceApi = async (id: string, data: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
  return safeTransportApiCall<VehicleMaintenance>(
    `/api/transport/vehicle-maintenance/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteMaintenanceApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/vehicle-maintenance/${id}`,
    { method: 'DELETE' }
  );
};

export const fetchMaintenanceLookupApi = async (): Promise<any> => {
  return safeTransportApiCall('/api/transport/vehicle-maintenance/lookup', { method: 'GET' });
};

// --- Dashboards & Reports ---

export const fetchTransportDashboardApi = async (): Promise<any> => {
  return safeTransportApiCall('/api/transport/dashboard', { method: 'GET' });
};

export const fetchTransportReportsVehicleWiseApi = async () => safeTransportApiCall('/api/transport/reports/vehicle-wise', { method: 'GET' });
export const fetchTransportReportsRouteWiseApi = async () => safeTransportApiCall('/api/transport/reports/route-wise', { method: 'GET' });
export const fetchTransportReportsPickupWiseApi = async () => safeTransportApiCall('/api/transport/reports/pickup-wise', { method: 'GET' });
export const fetchTransportReportsDriverWiseApi = async () => safeTransportApiCall('/api/transport/reports/driver-wise', { method: 'GET' });
export const fetchTransportReportsSeatOccupancyApi = async () => safeTransportApiCall('/api/transport/reports/seat-occupancy', { method: 'GET' });
export const fetchTransportReportsMaintenanceApi = async () => safeTransportApiCall('/api/transport/reports/maintenance', { method: 'GET' });
export const fetchTransportReportsMonthlyCostApi = async () => safeTransportApiCall('/api/transport/reports/monthly-cost', { method: 'GET' });

// --- Dropdown Lookups ---

export const fetchTransportLookupsVehiclesApi = async () => safeTransportApiCall('/api/transport/lookups/vehicles', { method: 'GET' });
export const fetchTransportLookupsRoutesApi = async () => safeTransportApiCall('/api/transport/lookups/routes', { method: 'GET' });
export const fetchTransportLookupsDriversApi = async () => safeTransportApiCall('/api/transport/lookups/drivers', { method: 'GET' });
export const fetchTransportLookupsPickupPointsApi = async () => safeTransportApiCall('/api/transport/lookups/pickup-points', { method: 'GET' });
export const fetchTransportLookupsVehicleAssignmentsApi = async () => safeTransportApiCall('/api/transport/lookups/vehicle-assignments', { method: 'GET' });
export const fetchTransportLookupsStudentAssignmentsApi = async () => safeTransportApiCall('/api/transport/lookups/student-assignments', { method: 'GET' });

// --- Bus Attendants ---

export const fetchAttendantsApi = async (): Promise<BusAttendantMaster[]> => {
  return safeTransportApiCall<BusAttendantMaster[]>('/api/transport/bus-attendants', { method: 'GET' });
};

export const createAttendantApi = async (data: Partial<BusAttendantMaster>): Promise<BusAttendantMaster> => {
  return safeTransportApiCall<BusAttendantMaster>(
    '/api/transport/bus-attendants',
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const updateAttendantApi = async (id: string, data: Partial<BusAttendantMaster>): Promise<BusAttendantMaster> => {
  return safeTransportApiCall<BusAttendantMaster>(
    `/api/transport/bus-attendants/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
};

export const deleteAttendantApi = async (id: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/bus-attendants/${id}`,
    { method: 'DELETE' }
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

export const fetchAllDriverDocumentsApi = async (): Promise<DriverDocumentDto[]> => {
  return safeTransportApiCall<DriverDocumentDto[]>(
    '/api/transport/drivers/documents',
    { method: 'GET' }
  );
};

export const fetchDriverDocumentsApi = async (driverId: string): Promise<DriverDocumentDto[]> => {
  return safeTransportApiCall<DriverDocumentDto[]>(
    `/api/transport/drivers/${driverId}/documents`,
    { method: 'GET' }
  );
};

export const createDriverDocumentApi = async (driverId: string, data: DriverDocumentDto): Promise<DriverDocumentDto> => {
  return safeTransportApiCall<DriverDocumentDto>(
    `/api/transport/drivers/${driverId}/documents`,
    { method: 'POST', body: JSON.stringify(data) }
  );
};

export const deleteDriverDocumentApi = async (driverId: string, docId: string): Promise<{ success: boolean }> => {
  return safeTransportApiCall<{ success: boolean }>(
    `/api/transport/drivers/${driverId}/documents/${docId}`,
    { method: 'DELETE' }
  );
};
