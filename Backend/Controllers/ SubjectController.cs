using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Subject;
using SMS.Api.Services.Interfaces;
using System.Security.Claims;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/subjects")]
    [Authorize]
    public class SubjectController : ControllerBase
    {
        private readonly ISubjectService _service;

        public SubjectController(ISubjectService service)
        {
            _service = service;
        }

        //---------------------------------------------------
        // Get All Subjects
        //---------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] SubjectFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);

            return Ok(result);
        }

        //---------------------------------------------------
        // Get Subject By Id
        //---------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound(new
                {
                    Message = "Subject not found."
                });

            return Ok(result);
        }

        //---------------------------------------------------
        // Create Subject
        //---------------------------------------------------

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(
            [FromBody] CreateSubjectDto dto)
        {
            long createdBy = GetUserId();

            var id = await _service.CreateAsync(dto, createdBy);

            return CreatedAtAction(
                nameof(GetById),
                new { id },
                new
                {
                    Message = "Subject created successfully.",
                    SubjectId = id
                });
        }

        //---------------------------------------------------
        // Update Subject
        //---------------------------------------------------

        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateSubjectDto dto)
        {
            long modifiedBy = GetUserId();

            var result = await _service.UpdateAsync(
                id,
                dto,
                modifiedBy);

            if (!result)
            {
                return NotFound(new
                {
                    Message = "Subject not found."
                });
            }

            return Ok(new
            {
                Message = "Subject updated successfully."
            });
        }

        //---------------------------------------------------
        // Delete Subject
        //---------------------------------------------------

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(long id)
        {
            long modifiedBy = GetUserId();

            var result = await _service.DeleteAsync(
                id,
                modifiedBy);

            if (!result)
            {
                return NotFound(new
                {
                    Message = "Subject not found."
                });
            }

            return Ok(new
            {
                Message = "Subject deleted successfully."
            });
        }

        //---------------------------------------------------
        // Get Logged-in UserId
        //---------------------------------------------------

        private long GetUserId()
        {
            var claim = User.FindFirst("UserId")
                     ?? User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
                throw new UnauthorizedAccessException("Invalid token.");

            return Convert.ToInt64(claim.Value);
        }
        //---------------------------------------------------
        // Next Subject Code
        //---------------------------------------------------

        [HttpGet("next-code")]
        [Authorize]
        public async Task<IActionResult> GetNextSubjectCode()
        {
            var code = await _service.GetNextSubjectCodeAsync();

            return Ok(new
            {
                SubjectCode = code
            });
        }
    }
}