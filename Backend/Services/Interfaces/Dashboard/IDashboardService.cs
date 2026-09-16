namespace SMS.Api.Services.Interfaces.Dashboard;

using System.Threading;
using System.Threading.Tasks;
using SMS.Api.Dtos.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(
        string? branchContext,
        int? academicYearId,
        string? academicYearContext = null,
        CancellationToken cancellationToken = default);
}
