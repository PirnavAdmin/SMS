namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/admissions")]
[Authorize(Roles = "Admin")]
[Tags("Admission Applications")]
public class AdmissionsController : ControllerBase
{
    private readonly ISchoolService _schoolService;

    public AdmissionsController(ISchoolService schoolService)
    {
        _schoolService = schoolService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetApplications(
        [FromQuery] string? search = null,
        [FromQuery] string? branch = null,
        [FromQuery] int? classId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? academicYear = null,
        [FromHeader(Name = "X-Branch-Id")] string? headerBranch = null,
        [FromHeader(Name = "X-Academic-Year-Id")] string? headerAcademicYear = null)
    {
        string? effectiveBranch = !string.IsNullOrWhiteSpace(branch) ? branch : (!string.IsNullOrWhiteSpace(headerBranch) ? headerBranch : null);
        string? effectiveAcademicYear = !string.IsNullOrWhiteSpace(academicYear) ? academicYear : (!string.IsNullOrWhiteSpace(headerAcademicYear) ? headerAcademicYear : null);

        var apps = await _schoolService.GetAllApplicationsAsync(search, effectiveBranch, classId, status);

        if (!string.IsNullOrWhiteSpace(effectiveAcademicYear) && !effectiveAcademicYear.Equals("All", System.StringComparison.OrdinalIgnoreCase))
        {
            var cleanYear = effectiveAcademicYear.Trim().ToLower().Replace(" ", "");
            var startYear = cleanYear.Length >= 4 ? cleanYear.Substring(0, 4) : cleanYear;
            apps = apps.Where(a => string.IsNullOrWhiteSpace(a.AcademicYear) ||
                                   a.AcademicYear.ToLower().Replace(" ", "") == cleanYear ||
                                   a.AcademicYear.ToLower().Replace(" ", "").Contains(cleanYear) ||
                                   cleanYear.Contains(a.AcademicYear.ToLower().Replace(" ", "")) ||
                                   a.AcademicYear.StartsWith(startYear)).ToList();
        }

        return Ok(new { success = true, data = apps });
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApplicationById(string id)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app != null)
        {
            return Ok(new { success = true, data = app });
        }

        return NotFound(new { success = false, message = $"Application '{id}' not found." });
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitApplication(
        [FromBody] SubmitAdmissionDto dto,
        [FromHeader(Name = "X-Branch-Id")] string? headerBranch = null,
        [FromHeader(Name = "X-Academic-Year-Id")] string? headerAcademicYear = null)
    {
        if (dto != null)
        {
            if (string.IsNullOrWhiteSpace(dto.BranchName) && !string.IsNullOrWhiteSpace(headerBranch))
            {
                dto.BranchName = headerBranch;
            }
            if (string.IsNullOrWhiteSpace(dto.AcademicYear) && !string.IsNullOrWhiteSpace(headerAcademicYear))
            {
                dto.AcademicYear = headerAcademicYear;
            }
        }
        return Ok(new { success = true, message = "Application submitted successfully.", data = await _schoolService.SubmitApplicationAsync(dto!) });
    }

    [HttpPut("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateApplication(string id, [FromBody] SubmitAdmissionDto dto)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app == null)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        return Ok(new { success = true, message = "Application updated successfully.", data = await _schoolService.UpdateApplicationAsync(app.Id, dto) });
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteApplication(string id)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app == null)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        await _schoolService.DeleteApplicationAsync(app.Id);
        return Ok(new { success = true, message = "Application deleted successfully." });
    }

    [HttpPost("{id}/status")]
    [HttpPatch("{id}/status")]
    [HttpPut("{id}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateStatusByRegistrationNo(string id, [FromBody] StatusUpdateDto dto)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app == null)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        string? enrolledAdmissionNo = null;
        string? enrolledRegNo = null;
        if (dto.Status.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase))
        {
            await _schoolService.RejectApplicationAsync(app.Id);
        }
        else if (dto.Status.Equals("Enrolled", System.StringComparison.OrdinalIgnoreCase) || dto.Status.Equals("Admitted", System.StringComparison.OrdinalIgnoreCase))
        {
            enrolledAdmissionNo = await _schoolService.EnrollStudentAsync(app.Id);
            var updatedApp = await _schoolService.GetApplicationByIdAsync(app.Id);
            enrolledRegNo = updatedApp?.RegistrationNo;
        }
        else
        {
            await _schoolService.UpdateApplicationStatusAsync(app.Id, dto.Status);
        }

        return Ok(new { success = true, message = $"Status updated to '{dto.Status}' successfully.", admissionNo = enrolledAdmissionNo, studentId = enrolledRegNo, registrationNo = enrolledRegNo });
    }

    [HttpPost("{id}/reject")]
    [AllowAnonymous]
    public async Task<IActionResult> RejectApplication(string id)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app == null)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        await _schoolService.RejectApplicationAsync(app.Id);
        return Ok(new { success = true, message = "Application rejected successfully." });
    }

    [HttpPost("{id}/enroll")]
    [AllowAnonymous]
    public async Task<IActionResult> EnrollStudent(string id)
    {
        var app = await _schoolService.GetApplicationByIdentifierAsync(id);
        if (app == null)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        var admNo = await _schoolService.EnrollStudentAsync(app.Id);
        var updatedApp = await _schoolService.GetApplicationByIdAsync(app.Id);
        return Ok(new 
        { 
            success = true, 
            message = "Student enrolled successfully into active database.", 
            admissionNo = admNo,
            studentId = updatedApp?.RegistrationNo,
            registrationNo = updatedApp?.RegistrationNo 
        });
    }
}

public class StatusUpdateDto
{
    public string Status { get; set; } = string.Empty;
}
