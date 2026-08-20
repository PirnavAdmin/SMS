namespace SMS.Api.Controllers.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Helpers;
using SMS.Api.Services.Interfaces.TeacherScreens;

[ApiController]
[Route("api/v1/teacher/screens/documents")]
[Authorize(Roles = "Teacher")]
[Tags("Teacher Screens - Documents")]
public class TeacherDocumentController : ControllerBase
{
    private readonly ITeacherDocumentService _service;

    public TeacherDocumentController(ITeacherDocumentService service)
    {
        _service = service;
    }

    private async Task<int?> GetLoggedInStaffIdAsync()
    {
        var staffId = User.GetStaffId();
        if (staffId.HasValue && staffId.Value > 0)
        {
            return staffId;
        }

        var userId = User.GetUserId();
        var email = User.GetEmail();
        return await _service.ResolveStaffIdAsync(userId, email);
    }

    /// <summary>
    /// GET /api/v1/teacher/screens/documents/me - Get document requirements and upload statuses for authenticated teacher.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyDocuments()
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var documents = await _service.GetDocumentsAsync(staffId.Value);
        return Ok(new { success = true, count = documents.Count, data = documents });
    }

    /// <summary>
    /// POST /api/v1/teacher/screens/documents/me - Upload or update a document (Upload File / Replace File button).
    /// </summary>
    [HttpPost("me")]
    public async Task<IActionResult> UploadOrUpdateMyDocument([FromBody] CreateOrUpdateTeacherDocumentDto dto)
    {
        if (dto == null || !ModelState.IsValid)
        {
            return BadRequest(new { success = false, message = "Invalid request payload.", errors = ModelState });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var uploaded = await _service.UploadOrUpdateDocumentAsync(staffId.Value, dto);
        if (uploaded == null)
        {
            return BadRequest(new { success = false, message = "Failed to upload or update document record." });
        }

        return Ok(new { success = true, message = "Document uploaded successfully.", data = uploaded });
    }

    /// <summary>
    /// PUT /api/v1/teacher/screens/documents/me - Bulk update / upload documents list.
    /// </summary>
    [HttpPut("me")]
    public async Task<IActionResult> BulkUpdateMyDocuments([FromBody] BulkUpdateTeacherDocumentDto dto)
    {
        if (dto == null || dto.Documents == null)
        {
            return BadRequest(new { success = false, message = "Invalid request payload." });
        }

        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var updatedList = await _service.BulkUpdateDocumentsAsync(staffId.Value, dto.Documents);
        return Ok(new { success = true, message = "Documents list updated successfully.", count = updatedList.Count, data = updatedList });
    }

    /// <summary>
    /// DELETE /api/v1/teacher/screens/documents/me/{id} - Delete an uploaded document by ID.
    /// </summary>
    [HttpDelete("me/{id:int}")]
    public async Task<IActionResult> DeleteMyDocument(int id)
    {
        var staffId = await GetLoggedInStaffIdAsync();
        if (!staffId.HasValue)
        {
            return NotFound(new { success = false, message = "Teacher staff profile not found for authenticated user." });
        }

        var deleted = await _service.DeleteDocumentAsync(staffId.Value, id);
        if (!deleted)
        {
            return NotFound(new { success = false, message = "Document record not found." });
        }

        return Ok(new { success = true, message = "Document deleted successfully." });
    }
}
