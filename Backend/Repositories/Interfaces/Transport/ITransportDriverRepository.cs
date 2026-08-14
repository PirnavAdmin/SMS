using SMS.Api.Common;
using SMS.Api.Dtos.Transport.Driver;

namespace SMS.Api.Repositories.Interfaces
{
    public interface ITransportDriverRepository
    {
        Task<PagedResult<TransportDriverDto>> GetAllAsync(
            TransportDriverFilterDto filter);

        Task<TransportDriverDto?> GetByIdAsync(long driverId);

        Task<long> CreateAsync(
            CreateTransportDriverDto dto,
            long? userId);

        Task<bool> UpdateAsync(
            long driverId,
            UpdateTransportDriverDto dto,
            long? userId);

        Task<bool> DeleteAsync(
            long driverId,
            long? userId);

        Task<bool> ExistsAsync(
            string licenceNumber,
            string mobileNumber,
            long? excludeDriverId = null);

        Task<IEnumerable<TransportDriverLookupDto>> GetLookupAsync();
    }
}