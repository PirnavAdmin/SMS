namespace SMS.Api.Controllers.FinanceManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Threading.Tasks;

[ApiController]
[Route("api/finance")]
[Authorize]
[Tags("Finance & Fee Management (Full)")]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _service;
    public FinanceController(IFinanceService service) { _service = service; }
    
    [HttpGet("fee-heads")]
    public async Task<IActionResult> GetFeeHeads(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? frequency,
        [FromQuery] string? status)
    {
        var result = await _service.GetFeeHeadsAsync();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            result = result.Where(h => h.Name.ToLower().Contains(s) || h.Code.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
            result = result.Where(h => h.Category.Equals(category, System.StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(frequency) && !frequency.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
            result = result.Where(h => h.Frequency.Equals(frequency, System.StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
        {
            string cleanStatus = status.Replace(" Only", "", System.StringComparison.OrdinalIgnoreCase).Trim();
            result = result.Where(h => h.Status.Equals(cleanStatus, System.StringComparison.OrdinalIgnoreCase));
        }

        return Ok(new { success = true, data = result });
    }
    
    [HttpPost("fee-heads")]
    public async Task<IActionResult> CreateFeeHead([FromBody] FeeHeadDto dto) => Ok(new { success = true, data = await _service.CreateFeeHeadAsync(dto) });
    
    [HttpPut("fee-heads/{id}")]
    public async Task<IActionResult> UpdateFeeHead(int id, [FromBody] FeeHeadDto dto) => Ok(new { success = true, data = await _service.UpdateFeeHeadAsync(id, dto) });
    
    [HttpPatch("fee-heads/{id}/toggle-status")]
    public async Task<IActionResult> ToggleFeeHeadStatus(int id)
    {
        var updated = await _service.ToggleFeeHeadStatusAsync(id);
        if (updated == null) return NotFound(new { success = false, message = "Fee Head not found." });
        return Ok(new { success = true, data = updated });
    }

    [HttpDelete("fee-heads/{id}")]
    public async Task<IActionResult> DeleteFeeHead(int id) { await _service.DeleteFeeHeadAsync(id); return Ok(new { success = true }); }
    
    [HttpGet("fee-structures")]
    public async Task<IActionResult> GetDynamicFeeStructures(
        [FromQuery] string? search,
        [FromQuery] string? className,
        [FromQuery] string? academicYear)
    {
        var list = await _service.GetDynamicFeeStructuresAsync();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim().ToLower();
            list = list.Where(x => x.Name.ToLower().Contains(s) || x.ClassName.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
            list = list.Where(x => x.ClassName.Equals(className, System.StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("ALL", System.StringComparison.OrdinalIgnoreCase))
            list = list.Where(x => string.IsNullOrEmpty(x.AcademicYear) || x.AcademicYear.Equals(academicYear, System.StringComparison.OrdinalIgnoreCase));

        return Ok(new { success = true, data = list });
    }

    [HttpGet("fee-structures/{id:int}")]
    public async Task<IActionResult> GetDynamicFeeStructureById(int id)
    {
        var item = await _service.GetDynamicFeeStructureByIdAsync(id);
        if (item == null) return NotFound(new { success = false, message = "Fee Structure not found." });
        return Ok(new { success = true, data = item });
    }
    
    [HttpPost("fee-structures")]
    public async Task<IActionResult> CreateDynamicFeeStructure([FromBody] DynamicFeeStructureDto dto) => Ok(new { success = true, data = await _service.CreateDynamicFeeStructureAsync(dto) });

    [HttpPut("fee-structures/{id:int}")]
    public async Task<IActionResult> UpdateDynamicFeeStructure(int id, [FromBody] DynamicFeeStructureDto dto)
    {
        var item = await _service.UpdateDynamicFeeStructureAsync(id, dto);
        if (item == null) return NotFound(new { success = false, message = "Fee Structure not found." });
        return Ok(new { success = true, data = item });
    }

    [HttpDelete("fee-structures/{id:int}")]
    public async Task<IActionResult> DeleteDynamicFeeStructure(int id)
    {
        await _service.DeleteDynamicFeeStructureAsync(id);
        return Ok(new { success = true });
    }
    
    [HttpGet("fee-assignments")]
    public async Task<IActionResult> GetStudentFeeAssignments() => Ok(new { success = true, data = await _service.GetStudentFeeAssignmentsAsync() });
    
    [HttpPost("fee-assignments")]
    public async Task<IActionResult> CreateStudentFeeAssignment([FromBody] StudentFeeAssignmentDto dto) => Ok(new { success = true, data = await _service.CreateStudentFeeAssignmentAsync(dto) });
    
    [HttpGet("fee-payments")]
    public async Task<IActionResult> GetFeePayments() => Ok(new { success = true, data = await _service.GetFeePaymentsAsync() });
    
    [HttpPost("fee-payments")]
    public async Task<IActionResult> CreateFeePayment([FromBody] FeePaymentDto dto) => Ok(new { success = true, data = await _service.CreateFeePaymentAsync(dto) });
}
