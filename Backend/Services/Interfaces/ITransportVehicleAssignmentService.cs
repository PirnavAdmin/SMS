using SMS.Api.Common;
using SMS.Api.Dtos.Transport.VehicleAssignment;

namespace SMS.Api.Services.Interfaces
{
    public interface ITransportVehicleAssignmentService
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

        Task<IEnumerable<TransportVehicleAssignmentLookupDto>> GetLookupAsync();
    }
}