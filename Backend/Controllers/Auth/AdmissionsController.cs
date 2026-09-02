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
        [FromQuery] string? search,
        [FromQuery] string? branch,
        [FromQuery] int? classId,
        [FromQuery] string? status) =>
        Ok(new { success = true, data = await _schoolService.GetAllApplicationsAsync(search, branch, classId, status) });

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetApplicationById(int id) =>
        Ok(new { success = true, data = await _schoolService.GetApplicationByIdAsync(id) });

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitAdmissionDto dto) =>
        Ok(new { success = true, message = "Application submitted successfully.", data = await _schoolService.SubmitApplicationAsync(dto) });

    [HttpPut("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateApplication(string id, [FromBody] SubmitAdmissionDto dto)
    {
        int targetId = 0;
        if (int.TryParse(id, out int parsedId))
        {
            targetId = parsedId;
        }
        else
        {
            var apps = await _schoolService.GetAllApplicationsAsync(id, null, null, null);
            var target = apps.Find(a => a.RegistrationNo.Equals(id, System.StringComparison.OrdinalIgnoreCase));
            if (target != null) targetId = target.Id;
        }

        if (targetId <= 0)
        {
            return NotFound(new { success = false, message = $"Application '{id}' not found." });
        }

        return Ok(new { success = true, message = "Application updated successfully.", data = await _schoolService.UpdateApplicationAsync(targetId, dto) });
    }

    [HttpDelete("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteApplication(int id)
    {
        await _schoolService.DeleteApplicationAsync(id);
        return Ok(new { success = true, message = "Application deleted successfully." });
    }

    [HttpPost("{registrationNo}/status")]
    [HttpPatch("{registrationNo}/status")]
    [HttpPut("{registrationNo}/status")]
    [HttpPost("{id:int}/status")]
    [HttpPatch("{id:int}/status")]
    [HttpPut("{id:int}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateStatusByRegistrationNo(string registrationNo, [FromBody] StatusUpdateDto dto)
    {
        int targetId = 0;
        if (int.TryParse(registrationNo, out int parsedId))
        {
            targetId = parsedId;
        }

        var apps = await _schoolService.GetAllApplicationsAsync(registrationNo, null, null, null);
        var target = apps.Find(a => a.RegistrationNo.Equals(registrationNo, System.StringComparison.OrdinalIgnoreCase) || (targetId > 0 && a.Id == targetId));
        if (target == null && targetId > 0)
        {
            var allApps = await _schoolService.GetAllApplicationsAsync(null, null, null, null);
            target = allApps.Find(a => a.Id == targetId);
        }

        if (target == null)
        {
            return NotFound(new { success = false, message = $"Application '{registrationNo}' not found." });
        }

        if (dto.Status.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase))
        {
            await _schoolService.RejectApplicationAsync(target.Id);
        }
        else if (dto.Status.Equals("Enrolled", System.StringComparison.OrdinalIgnoreCase) || dto.Status.Equals("Admitted", System.StringComparison.OrdinalIgnoreCase))
        {
            await _schoolService.EnrollStudentAsync(target.Id);
        }
        else
        {
            await _schoolService.UpdateApplicationStatusAsync(target.Id, dto.Status);
        }

        return Ok(new { success = true, message = $"Status updated to '{dto.Status}' successfully." });
    }

    [HttpPost("{id:int}/reject")]
    [AllowAnonymous]
    public async Task<IActionResult> RejectApplication(int id)
    {
        await _schoolService.RejectApplicationAsync(id);
        return Ok(new { success = true, message = "Application rejected successfully." });
    }

    [HttpPost("{id:int}/enroll")]
    [AllowAnonymous]
    public async Task<IActionResult> EnrollStudent(int id)
    {
        await _schoolService.EnrollStudentAsync(id);
        return Ok(new { success = true, message = "Student enrolled successfully into active database." });
    }
}

public class StatusUpdateDto
{
    public string Status { get; set; } = string.Empty;
}