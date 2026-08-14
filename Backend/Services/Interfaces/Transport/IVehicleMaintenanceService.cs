using SMS.Api.Dtos.Transport.VehicleMaintenance;

namespace SMS.Api.Services.Interfaces
{
    public interface IVehicleMaintenanceService
    {
        Task<(IEnumerable<VehicleMaintenanceDto> Items, int TotalCount)>
            GetAllAsync(VehicleMaintenanceFilterDto filter);

        Task<VehicleMaintenanceDto?> GetByIdAsync(long maintenanceId);

        Task<long> CreateAsync(
            CreateVehicleMaintenanceDto dto,
            long createdBy);

        Task<bool> UpdateAsync(
            long maintenanceId,
            UpdateVehicleMaintenanceDto dto,
            long updatedBy);

        Task<bool> DeleteAsync(
            long maintenanceId,
            long updatedBy);

        Task<IEnumerable<VehicleMaintenanceLookupDto>> GetLookupAsync();
    }
}