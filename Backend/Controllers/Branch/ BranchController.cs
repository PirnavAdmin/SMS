using SMS.Api.Dtos.Branch;
using SMS.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SMS.Api.Controllers.Branch
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BranchController : ControllerBase
    {
        private readonly IBranchService _branchService;

        public BranchController(IBranchService branchService)
        {
            _branchService = branchService;
        }

        //----------------------------------------------------
        // Get All Branches
        //----------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _branchService.GetAllAsync();

            return Ok(result);
        }

        //----------------------------------------------------
        // Get Branch By Id
        //----------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _branchService.GetByIdAsync(id);

            if (result == null)
                return NotFound(new
                {
                    Message = "Branch not found."
                });

            return Ok(result);
        }

        //----------------------------------------------------
        // Create Branch
        //----------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create(CreateBranchDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Replace with Logged In User Id
            long createdBy = 1;

            var branchId = await _branchService.CreateAsync(dto, createdBy);

            return CreatedAtAction(nameof(GetById),
                new { id = branchId },
                new
                {
                    Message = "Branch created successfully.",
                    BranchId = branchId
                });
        }

        //----------------------------------------------------
        // Update Branch
        //----------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, UpdateBranchDto dto)
        {
            if (id != dto.BranchId)
            {
                return BadRequest(new
                {
                    Message = "Branch Id mismatch."
                });
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Replace with Logged In User Id
            long modifiedBy = 1;

            var result = await _branchService.UpdateAsync(dto, modifiedBy);

            if (!result)
            {
                return NotFound(new
                {
                    Message = "Branch not found."
                });
            }

            return Ok(new
            {
                Message = "Branch updated successfully."
            });
        }

        //----------------------------------------------------
        // Delete Branch (Soft Delete)
        //----------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            // Replace with Logged In User Id
            long modifiedBy = 1;

            var result = await _branchService.DeleteAsync(id, modifiedBy);

            if (!result)
            {
                return NotFound(new
                {
                    Message = "Branch not found."
                });
            }

            return Ok(new
            {
                Message = "Branch deleted successfully."
            });
        }

        //----------------------------------------------------
        // Update Status
        //----------------------------------------------------

        [HttpPatch("{id:long}/status")]
        public async Task<IActionResult> UpdateStatus(long id, bool status)
        {
            // Replace with Logged In User Id
            long modifiedBy = 1;

            var result = await _branchService.UpdateStatusAsync(id, status, modifiedBy);

            if (!result)
            {
                return NotFound(new
                {
                    Message = "Branch not found."
                });
            }

            return Ok(new
            {
                Message = "Branch status updated successfully."
            });
        }
    }
}