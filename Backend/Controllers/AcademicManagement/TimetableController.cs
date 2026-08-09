namespace SMS.Api.Controllers.AcademicManagement
{
    using System;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using SMS.Api.Dtos;
    using SMS.Api.Exceptions;
    using SMS.Api.Services.Interfaces;

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Tags("Timetable & Class Schedule")]
    public class TimetableController : ControllerBase
    {
        private readonly ITimetableService _timetableService;

        public TimetableController(ITimetableService timetableService)
        {
            _timetableService = timetableService;
        }

        /// <summary>
        /// Get dropdown options for Academic Years and Days of the Week
        /// </summary>
        [HttpGet("options")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public IActionResult GetTimetableDropdownOptions()
        {
            var academicYears = new[] { "2026-2027", "2027-2028", "2025-2026" };
            var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };

            return Ok(new
            {
                success = true,
                data = new
                {
                    academicYears,
                    days
                }
            });
        }

        /// <summary>
        /// Get Student Class Schedule Timetable (supports Academic Year & Day Filter: Monday, Tuesday, etc.)
        /// </summary>
        [HttpGet("student")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public async Task<IActionResult> GetStudentTimetable(
            [FromQuery] int classId = 0,
            [FromQuery] int sectionId = 0,
            [FromQuery] string academicYear = "2026-2027",
            [FromQuery] string? dayOfWeek = null)
        {
            try
            {
                var result = await _timetableService.GetStudentTimetableAsync(classId, sectionId, academicYear);

                if (!string.IsNullOrWhiteSpace(dayOfWeek) && !dayOfWeek.Equals("All", StringComparison.OrdinalIgnoreCase))
                {
                    var filteredDays = result.Days
                        .Where(d => d.DayOfWeek.Equals(dayOfWeek, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            result.ClassId,
                            result.ClassName,
                            result.SectionId,
                            result.SectionName,
                            result.AcademicYear,
                            dayFilter = dayOfWeek,
                            days = filteredDays
                        }
                    });
                }

                return Ok(new { success = true, data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("class-grid")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public async Task<IActionResult> GetClassTimetableGrid(
            [FromQuery] int classId = 0, 
            [FromQuery] int sectionId = 0, 
            [FromQuery] string academicYear = "2026-2027")
        {
            try
            {
                var result = await _timetableService.GetClassTimetableGridAsync(classId, sectionId, academicYear);
                return Ok(new { success = true, data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("periods")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public async Task<IActionResult> GetPeriodSettings()
        {
            try
            {
                var periods = await _timetableService.GetPeriodSettingsAsync();
                return Ok(new { success = true, data = periods });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("teacher/{teacherId:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public async Task<IActionResult> GetTeacherTimetable(int teacherId, [FromQuery] string academicYear = "2026-2027")
        {
            try
            {
                var result = await _timetableService.GetTeacherTimetableAsync(teacherId, academicYear);
                return Ok(new { success = true, data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("subjects-for-class")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Student,Parent,Principal")]
        public async Task<IActionResult> GetSubjectsForClass([FromQuery] int classId, [FromQuery] int sectionId)
        {
            try
            {
                var candidates = await _timetableService.GetClassSubjectsCandidatesAsync(classId, sectionId);
                return Ok(new { success = true, data = candidates });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Save (Create or Update) a period master setting slot
        /// </summary>
        [HttpPost("period")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> SavePeriodSetting([FromBody] SavePeriodSettingDto dto)
        {
            try
            {
                var result = await _timetableService.SavePeriodSettingAsync(dto);
                return Ok(new { success = true, message = "Period setting saved successfully.", data = result });
            }
            catch (PeriodOverlapException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a period master setting slot
        /// </summary>
        [HttpDelete("period/{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeletePeriodSetting(int id)
        {
            try
            {
                var success = await _timetableService.DeletePeriodSettingAsync(id);
                if (success)
                {
                    return Ok(new { success = true, message = "Period setting deleted successfully." });
                }
                return BadRequest(new { success = false, message = "Failed to delete period setting. It may be linked to timetable slot mappings." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Save (Create or Update) a weekly class timetable slot allocation mapping
        /// </summary>
        [HttpPost("slot")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> SaveTimetableSlot([FromBody] SaveTimetableSlotDto dto)
        {
            try
            {
                var result = await _timetableService.SaveTimetableSlotAsync(dto);
                return Ok(new { success = true, message = "Timetable slot saved successfully.", data = result });
            }
            catch (TimetableConflictException ex)
            {
                return Conflict(new { success = false, message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Delete an allocated weekly class timetable slot mapping
        /// </summary>
        [HttpDelete("slot/{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteTimetableSlot(int id)
        {
            try
            {
                var success = await _timetableService.DeleteTimetableSlotAsync(id);
                if (success)
                {
                    return Ok(new { success = true, message = "Timetable slot deleted successfully." });
                }
                return NotFound(new { success = false, message = "Timetable slot not found." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Publish or draft a class section weekly timetable grid status
        /// </summary>
        [HttpPost("publish")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> PublishTimetable([FromBody] PublishTimetableDto dto)
        {
            try
            {
                var result = await _timetableService.PublishTimetableAsync(dto);
                return Ok(new { success = true, message = $"Timetable status set to '{dto.Status}' successfully.", data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Copy all timetable slot mappings from source class-section to target class-section
        /// </summary>
        [HttpPost("copy")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> CopyTimetable([FromBody] CopyTimetableDto dto)
        {
            try
            {
                var result = await _timetableService.CopyTimetableAsync(dto);
                return Ok(new { success = true, message = "Timetable copied successfully.", data = result });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
