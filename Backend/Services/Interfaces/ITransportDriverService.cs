using SMS.Api.Common;
using SMS.Api.Dtos.Transport.Driver;

namespace SMS.Api.Services.Interfaces
{
    public interface ITransportDriverService
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

        Task<IEnumerable<TransportDriverLookupDto>> GetLookupAsync();
    }
}