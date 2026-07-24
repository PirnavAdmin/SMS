import { apiClient } from './client';

export const fetchTransportRoutesApi = async () => {
  return apiClient('/api/transport/routes', {
    method: 'GET'
  });
};

export const fetchTransportVehiclesApi = async () => {
  return apiClient('/api/transport/vehicles', {
    method: 'GET'
  });
};

export const fetchTransportDriversApi = async () => {
  return apiClient('/api/transport/drivers', {
    method: 'GET'
  });
};

export const fetchPickupPointsApi = async () => {
  return apiClient('/api/transport/pickup-points', {
    method: 'GET'
  });
};

export const fetchVehicleAssignmentsApi = async () => {
  return apiClient('/api/transport/vehicle-assignments', {
    method: 'GET'
  });
};

export const fetchVehicleMaintenanceApi = async () => {
  return apiClient('/api/transport/vehicle-maintenance', {
    method: 'GET'
  });
};
