using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination.ExamMaster;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/examinations")]
    public class ExamMasterController : ControllerBase
    {
        private readonly IExamMasterService _service;

        public ExamMasterController(
            IExamMasterService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] ExamMasterFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Examination not found."
                });
            }

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateExamMasterDto dto)
        {
            var examId = await _service.CreateAsync(
                dto,
                GetUserId());

            var createdExam =
                await _service.GetByIdAsync(examId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = examId },
                new
                {
                    success = true,
                    message =
                        "Examination configured successfully.",
                    data = createdExam
                });
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateExamMasterDto dto)
        {
            var updated = await _service.UpdateAsync(
                id,
                dto,
                GetUserId());

            if (!updated)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Examination not found."
                });
            }

            var updatedExam =
                await _service.GetByIdAsync(id);

            return Ok(new
            {
                success = true,
                message =
                    "Examination updated successfully.",
                data = updatedExam
            });
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _service.DeleteAsync(
                id,
                GetUserId());

            if (!deleted)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Examination not found."
                });
            }

            return Ok(new
            {
                success = true,
                message =
                    "Examination deleted successfully."
            });
        }

        [HttpGet("dropdown")]
        public async Task<IActionResult> GetDropdown(
            [FromQuery] long? branchId,
            [FromQuery] long? academicYearId)
        {
            var result = await _service.GetDropdownAsync(
                branchId,
                academicYearId);

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        [HttpGet("exam-types")]
        public IActionResult GetExamTypes()
        {
            var result = new[]
            {
                "Unit Test",
                "Weekly Test",
                "Monthly Test",
                "Mid-Term",
                "Quarterly",
                "Half-Yearly",
                "Annual",
                "Practical"
            };

            return Ok(new
            {
                success = true,
                data = result.Select((name, index) => new
                {
                    id = index + 1,
                    name
                })
            });
        }

        [HttpGet("statuses")]
        public IActionResult GetExamStatuses()
        {
            var result = new[]
            {
                "Draft",
                "Scheduled",
                "Ongoing",
                "Completed",
                "Cancelled"
            };

            return Ok(new
            {
                success = true,
                data = result.Select((name, index) => new
                {
                    id = index + 1,
                    name
                })
            });
        }

        private long? GetUserId()
        {
            var value =
                User.FindFirst("UserId")?.Value ??
                User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value;

            return long.TryParse(value, out var userId)
                ? userId
                : null;
        }
    }
}