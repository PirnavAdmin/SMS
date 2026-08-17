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
    public async Task<IActionResult> GetFeeHeads() => Ok(new { success = true, data = await _service.GetFeeHeadsAsync() });
    
    [HttpPost("fee-heads")]
    public async Task<IActionResult> CreateFeeHead([FromBody] FeeHeadDto dto) => Ok(new { success = true, data = await _service.CreateFeeHeadAsync(dto) });
    
    [HttpPut("fee-heads/{id}")]
    public async Task<IActionResult> UpdateFeeHead(int id, [FromBody] FeeHeadDto dto) => Ok(new { success = true, data = await _service.UpdateFeeHeadAsync(id, dto) });
    
    [HttpDelete("fee-heads/{id}")]
    public async Task<IActionResult> DeleteFeeHead(int id) { await _service.DeleteFeeHeadAsync(id); return Ok(new { success = true }); }
    
    [HttpGet("fee-structures")]
    public async Task<IActionResult> GetDynamicFeeStructures() => Ok(new { success = true, data = await _service.GetDynamicFeeStructuresAsync() });
    
    [HttpPost("fee-structures")]
    public async Task<IActionResult> CreateDynamicFeeStructure([FromBody] DynamicFeeStructureDto dto) => Ok(new { success = true, data = await _service.CreateDynamicFeeStructureAsync(dto) });
    
    [HttpGet("fee-assignments")]
    public async Task<IActionResult> GetStudentFeeAssignments() => Ok(new { success = true, data = await _service.GetStudentFeeAssignmentsAsync() });
    
    [HttpPost("fee-assignments")]
    public async Task<IActionResult> CreateStudentFeeAssignment([FromBody] StudentFeeAssignmentDto dto) => Ok(new { success = true, data = await _service.CreateStudentFeeAssignmentAsync(dto) });
    
    [HttpGet("fee-payments")]
    public async Task<IActionResult> GetFeePayments() => Ok(new { success = true, data = await _service.GetFeePaymentsAsync() });
    
    [HttpPost("fee-payments")]
    public async Task<IActionResult> CreateFeePayment([FromBody] FeePaymentDto dto) => Ok(new { success = true, data = await _service.CreateFeePaymentAsync(dto) });
}
