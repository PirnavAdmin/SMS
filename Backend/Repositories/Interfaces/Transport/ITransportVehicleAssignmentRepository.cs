using SMS.Api.Common;
using SMS.Api.Dtos.Transport.VehicleAssignment;

namespace SMS.Api.Repositories.Interfaces
{
    public interface ITransportVehicleAssignmentRepository
    {
        Task<PagedResult<TransportVehicleAssignmentDto>> GetAllAsync(
            TransportVehicleAssignmentFilterDto filter);

        Task<TransportVehicleAssignmentDto?> GetByIdAsync(long assignmentId);

        Task<long> CreateAsync(
            CreateTransportVehicleAssignmentDto dto,
            long? userId);

        Task<bool> UpdateAsync(
            long assignmentId,
            UpdateTransportVehicleAssignmentDto dto,
            long? userId);

        Task<bool> DeleteAsync(
            long assignmentId,
            long? userId);

        Task<bool> IsVehicleAssignedAsync(
            long vehicleId,
            DateTime effectiveFrom,
            DateTime? effectiveTo,
            long? excludeAssignmentId = null);

        Task<bool> IsDriverAssignedAsync(
            long driverId,
            DateTime effectiveFrom,
            DateTime? effectiveTo,
            long? excludeAssignmentId = null);

        Task<IEnumerable<TransportVehicleAssignmentLookupDto>> GetLookupAsync();
    }
}