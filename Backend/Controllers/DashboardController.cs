namespace SMS.Api.Controllers;

using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Dashboard;
using SMS.Api.Services.Interfaces.Dashboard;

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Tags("Dashboard Analytics & KPIs")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary(
        [FromQuery] string? branch,
        [FromQuery] int? academicYearId,
        [FromHeader(Name = "X-Branch-Id")] string? headerBranch,
        [FromHeader(Name = "X-Academic-Year-Id")] string? headerAcademicYear,
        CancellationToken cancellationToken)
    {
        // Branch precedence: Query parameter -> Request Header
        string? effectiveBranch = !string.IsNullOrWhiteSpace(branch)
            ? branch
            : (!string.IsNullOrWhiteSpace(headerBranch) ? headerBranch : null);

        // Academic Year precedence: Query parameter -> Request Header parsed
        int? effectiveYearId = academicYearId;
        if (!effectiveYearId.HasValue && !string.IsNullOrWhiteSpace(headerAcademicYear))
        {
            if (int.TryParse(headerAcademicYear, out int parsedYearId))
            {
                effectiveYearId = parsedYearId;
            }
        }

        var result = await _dashboardService.GetDashboardSummaryAsync(
            effectiveBranch,
            effectiveYearId,
            cancellationToken);

        return Ok(new
        {
            success = true,
            data = result
        });
    }
}
