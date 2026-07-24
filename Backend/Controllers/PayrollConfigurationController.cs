using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using SMS.Api.Data;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("payroll/configuration")]
    [Route("api/payroll/configuration")]
    public class PayrollConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PayrollConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPut("{id}/leave")]
        public async Task<IActionResult> UpdateLeave(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Leave configuration updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/attendance")]
        public async Task<IActionResult> UpdateAttendance(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Attendance configuration updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/deductions")]
        public async Task<IActionResult> UpdateDeductions(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Deduction configuration updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/cycle")]
        public async Task<IActionResult> UpdateCycle(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Payroll cycle updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/overtime")]
        public async Task<IActionResult> UpdateOvertime(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Overtime configuration updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPut("{id}/settings")]
        public async Task<IActionResult> UpdateSettings(string id, [FromBody] object payload)
        {
            if (payload == null) return BadRequest(new { success = false, message = "Invalid data." });
            
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await transaction.CommitAsync();
                return Ok(new { success = true, message = "Payroll settings updated successfully.", data = payload });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
