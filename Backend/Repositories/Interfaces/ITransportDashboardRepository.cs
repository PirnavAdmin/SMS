using SMS.Api.Dtos.Transport.Dashboard;

namespace SMS.Api.Repositories.Interfaces
{
    public interface ITransportDashboardRepository
    {
        Task<TransportDashboardResponseDto> GetDashboardAsync();
    }
}