using SMS.Api.Dtos.Transport.Dashboard;

namespace SMS.Api.Services.Interfaces
{
    public interface ITransportDashboardService
    {
        Task<TransportDashboardResponseDto> GetDashboardAsync();
        Task<OperationDetailsDto?> GetOperationDetailsAsync(long assignmentId);
    }
}