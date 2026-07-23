using SMS.Api.Dtos.Transport.Dashboard;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class TransportDashboardService : ITransportDashboardService
    {
        private readonly ITransportDashboardRepository _repository;

        public TransportDashboardService(
            ITransportDashboardRepository repository)
        {
            _repository = repository;
        }

        public async Task<TransportDashboardResponseDto> GetDashboardAsync()
        {
            return await _repository.GetDashboardAsync();
        }
    }
}