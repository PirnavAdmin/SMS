using SMS.Api.Common;
using SMS.Api.Dtos.Transport;


namespace SMS.Api.Repositories.Interfaces
{
    public interface ITransportRouteRepository
    {
        Task<PagedResult<TransportRouteDto>> GetAllAsync(
            TransportRouteFilterDto filter);

        Task<TransportRouteDto?> GetByIdAsync(long routeId);

        Task<long> CreateAsync(
            CreateTransportRouteDto dto,
            long? userId);

        Task<bool> UpdateAsync(
            long routeId,
            UpdateTransportRouteDto dto,
            long? userId);

        Task<bool> DeleteAsync(
            long routeId,
            long? userId);

        Task<IEnumerable<TransportRouteLookupDto>> GetLookupAsync(
            string? search,
            int limit);

        Task<bool> RouteCodeExistsAsync(
            string routeCode,
            long? excludeRouteId = null);

        Task<bool> RouteNameExistsAsync(
            string routeName,
            long? excludeRouteId = null);
    }
}