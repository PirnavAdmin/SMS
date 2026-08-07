namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;

[ApiController]
[Route("api/teacher/dashboard")]
[Authorize(Roles = "Teacher")]
public class TeacherDashboardController : ControllerBase
{
    private readonly ITeacherDashboardService _service;

    public TeacherDashboardController(
        ITeacherDashboardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var email =
            User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(new
            {
                message =
                    "Email claim is missing from the token."
            });
        }

        int? schoolId = null;

        var schoolIdValue =
            User.FindFirst("schoolId")?.Value;

        if (int.TryParse(schoolIdValue, out var parsedSchoolId))
        {
            schoolId = parsedSchoolId;
        }

        var result =
            await _service.GetDashboardAsync( email, schoolId);

        return Ok(result);
    }
}