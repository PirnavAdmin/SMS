using SMS.Api.Common;
using SMS.Api.Dtos.Transport.Attendant;

namespace SMS.Api.Services.Interfaces
{
    public interface ITransportAttendantService
    {
        Task<PagedResult<TransportAttendantDto>> GetAllAsync(TransportAttendantFilterDto filter);
        Task<TransportAttendantDto?> GetByIdAsync(long attendantId);
        Task<long> CreateAsync(CreateTransportAttendantDto dto, long? userId);
        Task<bool> UpdateAsync(long attendantId, UpdateTransportAttendantDto dto, long? userId);
        Task<bool> DeleteAsync(long attendantId, long? userId);
        Task<IEnumerable<TransportAttendantLookupDto>> GetLookupAsync();
        Task<TransportAttendantDto?> GetByIdOrNameAsync(string attendantIdOrName);
    }
}
