namespace SMS.Api.Controllers.FinanceManagement;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Threading.Tasks;

[ApiController]
[Route("api/finance")]
[Authorize]
[Tags("Finance & Fee Collection Module")]
public class FeeCollectionController : ControllerBase
{
    private readonly IFeeCollectionService _feeCollectionService;

    public FeeCollectionController(IFeeCollectionService feeCollectionService)
    {
        _feeCollectionService = feeCollectionService;
    }

    // =========================================================================
    // 1. FEE COLLECTION ROSTER & DETAIL
    // =========================================================================

    [HttpGet("fee-collection/students")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetStudentRoster(
        [FromQuery] string? search,
        [FromQuery] string? className,
        [FromQuery] string? sectionName,
        [FromQuery] string? studentType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _feeCollectionService.GetStudentRosterAsync(
            search, className, sectionName, studentType, page, pageSize);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("fee-collection/student/{studentId:int}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant,Parent,Student")]
    public async Task<IActionResult> GetStudentFeeProfile(
        int studentId,
        [FromQuery] string? academicYear = "2026-2027")
    {
        var result = await _feeCollectionService.GetStudentFeeProfileAsync(studentId, academicYear);
        if (result == null)
            return NotFound(new { success = false, message = "Student not found." });

        return Ok(new { success = true, data = result });
    }

    [HttpPost("fee-collection/collect")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> CollectFeePayment([FromBody] CollectFeePaymentRequestDto request)
    {
        if (request == null || request.TotalAmountPaid <= 0)
            return BadRequest(new { success = false, message = "Valid payment details and amount are required." });

        var response = await _feeCollectionService.CollectPaymentAsync(request);
        return Ok(response);
    }

    // =========================================================================
    // 2. DUE FEES & DEFAULTERS
    // =========================================================================

    [HttpGet("due-fees")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetDueFeesSummary(
        [FromQuery] string? className,
        [FromQuery] string? sectionName,
        [FromQuery] int minDaysOverdue = 0)
    {
        var result = await _feeCollectionService.GetDueFeesSummaryAsync(className, sectionName, minDaysOverdue);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("due-fees/send-reminder")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public IActionResult SendFeeReminder([FromBody] SendFeeReminderRequestDto request)
    {
        if (request == null || request.StudentId <= 0)
            return BadRequest(new { success = false, message = "Student ID is required." });

        return Ok(new
        {
            success = true,
            message = $"Payment reminder {request.ReminderType} sent successfully to student's registered parent phone number."
        });
    }

    // =========================================================================
    // 3. PROMOTED STUDENTS DUES
    // =========================================================================

    [HttpGet("promoted-students-dues")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetPromotedStudentsDues()
    {
        var result = await _feeCollectionService.GetPromotedStudentsDuesAsync();
        return Ok(new { success = true, data = result });
    }

    // =========================================================================
    // 4. RECEIPTS REGISTER & PRINTABLE RECEIPT
    // =========================================================================

    [HttpGet("receipts")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant,Parent")]
    public async Task<IActionResult> GetReceiptsRegister(
        [FromQuery] string? search,
        [FromQuery] string? paymentMode,
        [FromQuery] string? fromDate,
        [FromQuery] string? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _feeCollectionService.GetReceiptsRegisterAsync(
            search, paymentMode, fromDate, toDate, page, pageSize);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("receipts/{receiptNo}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant,Parent,Student")]
    public async Task<IActionResult> GetReceiptByNo(string receiptNo)
    {
        var result = await _feeCollectionService.GetReceiptByNoAsync(receiptNo);
        if (result == null)
            return NotFound(new { success = false, message = "Receipt not found." });

        return Ok(new { success = true, data = result });
    }

    [HttpPost("receipts/{receiptNo}/cancel")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CancelReceipt(string receiptNo, [FromBody] string? reason)
    {
        var success = await _feeCollectionService.CancelReceiptAsync(receiptNo, reason ?? "Administrative cancellation");
        if (!success)
            return NotFound(new { success = false, message = "Receipt not found." });

        return Ok(new { success = true, message = "Receipt cancelled successfully." });
    }

    // =========================================================================
    // 5. FINANCE DASHBOARD & REPORTS
    // =========================================================================

    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var result = await _feeCollectionService.GetDashboardStatsAsync();
        return Ok(new { success = true, data = result });
    }
}