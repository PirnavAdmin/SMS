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
    public async Task<IActionResult> GetApplications(
        [FromQuery] string? search,
        [FromQuery] string? branch,
        [FromQuery] int? classId,
        [FromQuery] string? status) =>
        Ok(new { success = true, data = await _schoolService.GetAllApplicationsAsync(search, branch, classId, status) });

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetApplicationById(int id) =>
        Ok(new { success = true, data = await _schoolService.GetApplicationByIdAsync(id) });

    [HttpPost]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitAdmissionDto dto) =>
        Ok(new { success = true, message = "Application submitted successfully.", data = await _schoolService.SubmitApplicationAsync(dto) });

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateApplication(int id, [FromBody] SubmitAdmissionDto dto) =>
        Ok(new { success = true, message = "Application updated successfully.", data = await _schoolService.UpdateApplicationAsync(id, dto) });

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteApplication(int id)
    {
        await _schoolService.DeleteApplicationAsync(id);
        return Ok(new { success = true, message = "Application deleted successfully." });
    }

    [HttpPost("{registrationNo}/status")]
    [HttpPatch("{registrationNo}/status")]
    public async Task<IActionResult> UpdateStatusByRegistrationNo(string registrationNo, [FromBody] StatusUpdateDto dto)
    {
        var apps = await _schoolService.GetAllApplicationsAsync(registrationNo, null, null, null);
        var target = apps.Find(a => a.RegistrationNo.Equals(registrationNo, System.StringComparison.OrdinalIgnoreCase));
        if (target == null)
        {
            return NotFound(new { success = false, message = $"Application '{registrationNo}' not found." });
        }

        if (dto.Status.Equals("Rejected", System.StringComparison.OrdinalIgnoreCase))
        {
            await _schoolService.RejectApplicationAsync(target.Id);
        }
        else if (dto.Status.Equals("Enrolled", System.StringComparison.OrdinalIgnoreCase))
        {
            await _schoolService.EnrollStudentAsync(target.Id);
        }

        return Ok(new { success = true, message = $"Status updated to '{dto.Status}' successfully." });
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> RejectApplication(int id)
    {
        await _schoolService.RejectApplicationAsync(id);
        return Ok(new { success = true, message = "Application rejected successfully." });
    }

    [HttpPost("{id:int}/enroll")]
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