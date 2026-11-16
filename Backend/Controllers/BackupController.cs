using System;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BackupController : ControllerBase
    {
        private readonly IBackupService _backupService;

        public BackupController(IBackupService backupService)
        {
            _backupService = backupService;
        }

        // GET: api/backup/status
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var schoolId = GetClaimSchoolId();
                var status = await _backupService.GetBackupStatusAsync(schoolId);
                return Ok(new { success = true, data = status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/backup/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportBackup()
        {
            try
            {
                var schoolId = GetClaimSchoolId();
                var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Administrator";
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";

                var payload = await _backupService.GenerateBackupDataAsync(schoolId, userName, userRole);
                var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
                var bytes = System.Text.Encoding.UTF8.GetBytes(json);

                var safeName = string.Join("_", (payload.SchoolName ?? "school").Split(System.IO.Path.GetInvalidFileNameChars())).Replace(" ", "_").ToLower();
                var fileName = $"sms_backup_{safeName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

                return File(bytes, "application/json", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/backup/create-snapshot
        [HttpPost("create-snapshot")]
        public async Task<IActionResult> CreateSnapshot()
        {
            try
            {
                var schoolId = GetClaimSchoolId();
                var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Administrator";
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";

                var snapshot = await _backupService.CreateServerSnapshotAsync(schoolId, userName, userRole);
                return Ok(new
                {
                    success = true,
                    message = $"Snapshot '{snapshot.FileName}' created successfully.",
                    data = snapshot
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/backup/snapshots
        [HttpGet("snapshots")]
        public async Task<IActionResult> GetSnapshots()
        {
            try
            {
                var schoolId = GetClaimSchoolId();
                var snapshots = await _backupService.GetSnapshotsAsync(schoolId);
                return Ok(new { success = true, data = snapshots });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: api/backup/snapshots/{fileName}/download
        [HttpGet("snapshots/{fileName}/download")]
        public async Task<IActionResult> DownloadSnapshot(string fileName)
        {
            try
            {
                var (bytes, cleanName) = await _backupService.GetSnapshotFileAsync(fileName);
                return File(bytes, "application/json", cleanName);
            }
            catch (System.IO.FileNotFoundException)
            {
                return NotFound(new { success = false, message = "Snapshot file not found." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: api/backup/restore
        [HttpPost("restore")]
        [Consumes("multipart/form-data", "application/json")]
        public async Task<IActionResult> RestoreBackup([FromForm] IFormFile? file, [FromBody] RestoreSnapshotRequestDto? requestDto)
        {
            try
            {
                var schoolId = GetClaimSchoolId();
                var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Administrator";
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";

                // 1. If uploaded file
                if (file != null && file.Length > 0)
                {
                    var result = await _backupService.RestoreFromUploadedFileAsync(file, schoolId, userName, userRole);
                    return Ok(new { success = true, message = result.Message, data = result });
                }

                // 2. If request has form file or body file name
                if (Request.HasFormContentType && Request.Form.Files.Count > 0)
                {
                    var formFile = Request.Form.Files[0];
                    var result = await _backupService.RestoreFromUploadedFileAsync(formFile, schoolId, userName, userRole);
                    return Ok(new { success = true, message = result.Message, data = result });
                }

                // 3. If restoring from saved server snapshot fileName
                if (requestDto != null && !string.IsNullOrWhiteSpace(requestDto.FileName))
                {
                    var result = await _backupService.RestoreFromSnapshotFileAsync(requestDto.FileName, schoolId, userName, userRole);
                    return Ok(new { success = true, message = result.Message, data = result });
                }

                return BadRequest(new { success = false, message = "Please provide a backup JSON file or a valid server snapshot name." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private int? GetClaimSchoolId()
        {
            var schoolIdClaim = User.FindFirst("schoolId")?.Value;
            if (int.TryParse(schoolIdClaim, out var parsedSchoolId))
            {
                return parsedSchoolId;
            }
            return null;
        }
    }
}
