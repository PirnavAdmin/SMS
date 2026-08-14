using SMS.Api.Common;
using SMS.Api.Dtos.Transport.PickupPoint;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IPickupPointRepository
    {
        Task<PagedResult<PickupPointDto>> GetAllAsync(PickupPointFilterDto filter);

        Task<PickupPointDto?> GetByIdAsync(long pickupPointId);

        Task<long> CreateAsync(CreatePickupPointDto dto, long? userId);

        Task<bool> UpdateAsync(long pickupPointId, UpdatePickupPointDto dto, long? userId);

        Task<bool> DeleteAsync(long pickupPointId, long? userId);

        Task<IEnumerable<PickupPointLookupDto>> GetLookupAsync(long? routeId);

        Task<bool> ExistsAsync(
            long routeId,
            string pickupPointName,
            long? excludePickupPointId = null);
    }
}