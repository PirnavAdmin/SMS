import { apiClient } from './client';
import { RouteMaster, PickupPoint, VehicleMaster, DriverMaster, VehicleAssignment, StudentTransport, VehicleMaintenance } from '../types';

// Routes
export const fetchRoutesApi = () => apiClient('/api/transport/routes');
export const fetchRouteByIdApi = (id: string) => apiClient(`/api/transport/routes/${id}`);
export const createRouteApi = (data: Partial<RouteMaster>) => apiClient('/api/transport/routes', { method: 'POST', body: JSON.stringify(data) });
export const updateRouteApi = (id: string, data: Partial<RouteMaster>) => apiClient(`/api/transport/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRouteApi = (id: string) => apiClient(`/api/transport/routes/${id}`, { method: 'DELETE' });

// Pickup Points
export const fetchPickupPointsApi = () => apiClient('/api/transport/pickup-points');
export const fetchPickupPointByIdApi = (id: string) => apiClient(`/api/transport/pickup-points/${id}`);
export const createPickupPointApi = (data: Partial<PickupPoint>) => apiClient('/api/transport/pickup-points', { method: 'POST', body: JSON.stringify(data) });
export const updatePickupPointApi = (id: string, data: Partial<PickupPoint>) => apiClient(`/api/transport/pickup-points/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePickupPointApi = (id: string) => apiClient(`/api/transport/pickup-points/${id}`, { method: 'DELETE' });

// Vehicles
export const fetchVehiclesApi = () => apiClient('/api/transport/vehicles');
export const fetchVehicleByIdApi = (id: string) => apiClient(`/api/transport/vehicles/${id}`);
export const createVehicleApi = (data: Partial<VehicleMaster>) => apiClient('/api/transport/vehicles', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicleApi = (id: string, data: Partial<VehicleMaster>) => apiClient(`/api/transport/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicleApi = (id: string) => apiClient(`/api/transport/vehicles/${id}`, { method: 'DELETE' });

// Drivers
export const fetchDriversApi = () => apiClient('/api/transport/drivers');
export const fetchDriverByIdApi = (id: string) => apiClient(`/api/transport/drivers/${id}`);
export const createDriverApi = (data: Partial<DriverMaster>) => apiClient('/api/transport/drivers', { method: 'POST', body: JSON.stringify(data) });
export const updateDriverApi = (id: string, data: Partial<DriverMaster>) => apiClient(`/api/transport/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDriverApi = (id: string) => apiClient(`/api/transport/drivers/${id}`, { method: 'DELETE' });

// Vehicle Assignments
export const fetchVehicleAssignmentsApi = () => apiClient('/api/transport/vehicle-assignments');
export const fetchVehicleAssignmentByIdApi = (id: string) => apiClient(`/api/transport/vehicle-assignments/${id}`);
export const createVehicleAssignmentApi = (data: Partial<VehicleAssignment>) => apiClient('/api/transport/vehicle-assignments', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicleAssignmentApi = (id: string, data: Partial<VehicleAssignment>) => apiClient(`/api/transport/vehicle-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicleAssignmentApi = (id: string) => apiClient(`/api/transport/vehicle-assignments/${id}`, { method: 'DELETE' });

// Student Assignments
export const fetchStudentAssignmentsApi = () => apiClient('/api/transport/student-assignments');
export const fetchStudentAssignmentByIdApi = (id: string) => apiClient(`/api/transport/student-assignments/${id}`);
export const createStudentAssignmentApi = (data: Partial<StudentTransport>) => apiClient('/api/transport/student-assignments', { method: 'POST', body: JSON.stringify(data) });
export const updateStudentAssignmentApi = (id: string, data: Partial<StudentTransport>) => apiClient(`/api/transport/student-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStudentAssignmentApi = (id: string) => apiClient(`/api/transport/student-assignments/${id}`, { method: 'DELETE' });

// Maintenance
export const fetchMaintenanceApi = () => apiClient('/api/transport/vehicle-maintenance');
export const fetchMaintenanceByIdApi = (id: string) => apiClient(`/api/transport/vehicle-maintenance/${id}`);
export const createMaintenanceApi = (data: Partial<VehicleMaintenance>) => apiClient('/api/transport/vehicle-maintenance', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenanceApi = (id: string, data: Partial<VehicleMaintenance>) => apiClient(`/api/transport/vehicle-maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaintenanceApi = (id: string) => apiClient(`/api/transport/vehicle-maintenance/${id}`, { method: 'DELETE' });
export const fetchMaintenanceLookupApi = () => apiClient('/api/transport/vehicle-maintenance/lookup');

// Dashboards
export const fetchTransportDashboardApi = () => apiClient('/api/transport/dashboard');

// Reports
export const fetchTransportReportsVehicleWiseApi = () => apiClient('/api/transport/reports/vehicle-wise');
export const fetchTransportReportsRouteWiseApi = () => apiClient('/api/transport/reports/route-wise');
export const fetchTransportReportsPickupWiseApi = () => apiClient('/api/transport/reports/pickup-wise');
export const fetchTransportReportsDriverWiseApi = () => apiClient('/api/transport/reports/driver-wise');
export const fetchTransportReportsSeatOccupancyApi = () => apiClient('/api/transport/reports/seat-occupancy');
export const fetchTransportReportsMaintenanceApi = () => apiClient('/api/transport/reports/maintenance');
export const fetchTransportReportsMonthlyCostApi = () => apiClient('/api/transport/reports/monthly-cost');

// Dropdown Lookups
export const fetchTransportLookupsVehiclesApi = () => apiClient('/api/transport/lookups/vehicles');
export const fetchTransportLookupsRoutesApi = () => apiClient('/api/transport/lookups/routes');
export const fetchTransportLookupsDriversApi = () => apiClient('/api/transport/lookups/drivers');
export const fetchTransportLookupsPickupPointsApi = () => apiClient('/api/transport/lookups/pickup-points');
export const fetchTransportLookupsVehicleAssignmentsApi = () => apiClient('/api/transport/lookups/vehicle-assignments');
export const fetchTransportLookupsStudentAssignmentsApi = () => apiClient('/api/transport/lookups/student-assignments');
