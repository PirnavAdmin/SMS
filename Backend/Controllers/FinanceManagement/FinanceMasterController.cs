namespace SMS.Api.Controllers.FinanceManagement;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Threading.Tasks;

[ApiController]
[Route("api/finance")]
[Authorize]
[Tags("Finance Master, General Ledger & Reports Hub")]
public class FinanceMasterController : ControllerBase
{
    private readonly IFinanceMasterService _masterService;

    public FinanceMasterController(IFinanceMasterService masterService)
    {
        _masterService = masterService;
    }

    // =========================================================================
    // 1. GENERAL LEDGER & TRANSACTIONS
    // =========================================================================

    [HttpGet("transactions")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? module,
        [FromQuery] string? category,
        [FromQuery] string? paymentMode,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _masterService.GetTransactionsAsync(
            search, type, module, category, paymentMode, status, page, pageSize);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("transactions/summary")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetTransactionSummary()
    {
        var result = await _masterService.GetTransactionSummaryAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpPost("transactions")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequestDto request)
    {
        if (request == null || request.Amount <= 0)
            return BadRequest(new { success = false, message = "Valid transaction details and positive amount are required." });

        var result = await _masterService.CreateTransactionAsync(request);
        return Ok(new { success = true, message = "Transaction recorded successfully in General Ledger.", data = result });
    }

    [HttpPost("transactions/{id:int}/reverse")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ReverseTransaction(int id, [FromBody] ReverseTransactionRequestDto request)
    {
        var success = await _masterService.ReverseTransactionAsync(id, request ?? new ReverseTransactionRequestDto());
        if (!success)
            return NotFound(new { success = false, message = "Transaction not found or could not be reversed." });

        return Ok(new { success = true, message = "Transaction reversed and contra-entry logged." });
    }

    // =========================================================================
    // 2. BANK ACCOUNTS & CATEGORIES
    // =========================================================================

    [HttpGet("accounts")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetAccounts()
    {
        var result = await _masterService.GetAccountsAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpPost("accounts")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateAccount([FromBody] FinancialAccountDto account)
    {
        if (account == null || string.IsNullOrWhiteSpace(account.AccountName))
            return BadRequest(new { success = false, message = "Account name is required." });

        var result = await _masterService.CreateAccountAsync(account);
        return Ok(new { success = true, message = "Financial account created successfully.", data = result });
    }

    [HttpPut("accounts/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> UpdateAccount(int id, [FromBody] FinancialAccountDto account)
    {
        var success = await _masterService.UpdateAccountAsync(id, account);
        if (!success)
            return NotFound(new { success = false, message = "Account not found." });

        return Ok(new { success = true, message = "Financial account updated successfully." });
    }

    [HttpGet("categories")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetCategories([FromQuery] string? type)
    {
        var result = await _masterService.GetCategoriesAsync(type);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("categories")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateCategory([FromBody] FinancialCategoryDto category)
    {
        if (category == null || string.IsNullOrWhiteSpace(category.Name))
            return BadRequest(new { success = false, message = "Category name is required." });

        var result = await _masterService.CreateCategoryAsync(category);
        return Ok(new { success = true, message = "Category created successfully.", data = result });
    }

    // =========================================================================
    // 3. BUDGETS
    // =========================================================================

    [HttpGet("budgets")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetBudgets([FromQuery] string? academicYear = "2026-2027")
    {
        var result = await _masterService.GetBudgetsAsync(academicYear);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("budgets")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> SaveBudget([FromBody] FinancialBudgetDto budget)
    {
        if (budget == null || string.IsNullOrWhiteSpace(budget.Department))
            return BadRequest(new { success = false, message = "Department and allocated budget are required." });

        var result = await _masterService.SaveBudgetAsync(budget);
        return Ok(new { success = true, message = "Departmental budget allocation saved.", data = result });
    }

    // =========================================================================
    // 4. REFUND MANAGEMENT
    // =========================================================================

    [HttpGet("refunds")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetRefundRequests([FromQuery] string? status)
    {
        var result = await _masterService.GetRefundRequestsAsync(status);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("refunds/request")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant,Parent")]
    public async Task<IActionResult> CreateRefundRequest([FromBody] CreateRefundRequestDto request)
    {
        if (request == null || request.RefundAmount <= 0)
            return BadRequest(new { success = false, message = "Valid student details and positive refund amount are required." });

        var result = await _masterService.CreateRefundRequestAsync(request);
        return Ok(new { success = true, message = "Refund request submitted successfully.", data = result });
    }

    [HttpPost("refunds/{id:int}/process")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> ProcessRefundRequest(int id, [FromBody] ProcessRefundRequestDto request)
    {
        var success = await _masterService.ProcessRefundRequestAsync(id, request ?? new ProcessRefundRequestDto());
        if (!success)
            return NotFound(new { success = false, message = "Refund request not found." });

        return Ok(new { success = true, message = $"Refund request marked as {request?.Status}." });
    }

    // =========================================================================
    // 5. FINANCE SETUP & SETTINGS
    // =========================================================================

    [HttpGet("fee-schedules")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant,Parent,Student")]
    public async Task<IActionResult> GetFeeSchedule([FromQuery] string? academicYear = "2026-2027")
    {
        var result = await _masterService.GetFeeScheduleAsync(academicYear);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("fee-schedules")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> SaveFeeSchedule([FromBody] FeeScheduleConfigDto schedule)
    {
        var success = await _masterService.SaveFeeScheduleAsync(schedule);
        return Ok(new { success = true, message = "Fee installment schedule updated." });
    }

    [HttpGet("settings")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetFinanceSettings()
    {
        var result = await _masterService.GetFinanceSettingsAsync();
        return Ok(new { success = true, data = result });
    }

    [HttpPut("settings")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateFinanceSettings([FromBody] FinanceSettingsDto settings)
    {
        var success = await _masterService.UpdateFinanceSettingsAsync(settings);
        return Ok(new { success = true, message = "Finance settings saved successfully." });
    }

    // =========================================================================
    // 6. REPORTS HUB
    // =========================================================================

    [HttpGet("reports/daily-collection")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetDailyCollectionReport([FromQuery] string? date)
    {
        var result = await _masterService.GetDailyCollectionReportAsync(date);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("reports/class-wise-collection")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetClassWiseCollectionReport([FromQuery] string? academicYear = "2026-2027")
    {
        var result = await _masterService.GetClassWiseCollectionReportAsync(academicYear);
        return Ok(new { success = true, data = result });
    }

    // =========================================================================
    // 7. SCHOLARSHIPS MASTER & STUDENT AWARDS
    // =========================================================================

    [HttpGet("scholarships")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetScholarships(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? status)
    {
        var result = await _masterService.GetScholarshipsAsync(search, type, status);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("scholarships/{id:int}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetScholarshipById(int id)
    {
        var item = await _masterService.GetScholarshipByIdAsync(id);
        if (item == null)
            return NotFound(new { success = false, message = "Scholarship not found." });
        return Ok(new { success = true, data = item });
    }

    [HttpPost("scholarships")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateScholarship([FromBody] ScholarshipMasterDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { success = false, message = "Scholarship name is required." });

        var result = await _masterService.CreateScholarshipAsync(dto);
        return Ok(new { success = true, message = "Scholarship created successfully.", data = result });
    }

    [HttpPut("scholarships/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> UpdateScholarship(int id, [FromBody] ScholarshipMasterDto dto)
    {
        var result = await _masterService.UpdateScholarshipAsync(id, dto);
        if (result == null)
            return NotFound(new { success = false, message = "Scholarship not found." });

        return Ok(new { success = true, message = "Scholarship updated successfully.", data = result });
    }

    [HttpDelete("scholarships/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> DeleteScholarship(int id)
    {
        var success = await _masterService.DeleteScholarshipAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Scholarship not found." });

        return Ok(new { success = true, message = "Scholarship deleted successfully." });
    }

    [HttpGet("student-scholarships")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetStudentScholarships(
        [FromQuery] string? search,
        [FromQuery] string? className,
        [FromQuery] int? scholarshipId)
    {
        var result = await _masterService.GetStudentScholarshipsAsync(search, className, scholarshipId);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("student-scholarships")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> AwardStudentScholarship([FromBody] AwardScholarshipRequestDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.StudentId) || dto.ScholarshipId <= 0)
            return BadRequest(new { success = false, message = "Valid Student and Scholarship are required." });

        var result = await _masterService.AwardScholarshipToStudentAsync(dto);
        return Ok(new { success = true, message = "Scholarship awarded to student successfully.", data = result });
    }

    [HttpDelete("student-scholarships/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> RevokeStudentScholarship(int id)
    {
        var success = await _masterService.RevokeStudentScholarshipAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Scholarship record not found." });

        return Ok(new { success = true, message = "Scholarship revoked successfully." });
    }

    // =========================================================================
    // 8. DISCOUNTS MASTER & STUDENT CONCESSIONS
    // =========================================================================

    [HttpGet("discounts")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetDiscounts(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? mode,
        [FromQuery] string? status)
    {
        var result = await _masterService.GetDiscountsAsync(search, type, mode, status);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("discounts/{id:int}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetDiscountById(int id)
    {
        var item = await _masterService.GetDiscountByIdAsync(id);
        if (item == null)
            return NotFound(new { success = false, message = "Discount rule not found." });
        return Ok(new { success = true, data = item });
    }

    [HttpPost("discounts")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateDiscount([FromBody] DiscountRuleDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { success = false, message = "Discount name is required." });

        var result = await _masterService.CreateDiscountAsync(dto);
        return Ok(new { success = true, message = "Discount rule created successfully.", data = result });
    }

    [HttpPut("discounts/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> UpdateDiscount(int id, [FromBody] DiscountRuleDto dto)
    {
        var result = await _masterService.UpdateDiscountAsync(id, dto);
        if (result == null)
            return NotFound(new { success = false, message = "Discount rule not found." });

        return Ok(new { success = true, message = "Discount rule updated successfully.", data = result });
    }

    [HttpDelete("discounts/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> DeleteDiscount(int id)
    {
        var success = await _masterService.DeleteDiscountAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Discount rule not found." });

        return Ok(new { success = true, message = "Discount rule deleted successfully." });
    }

    [HttpGet("student-discounts")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetStudentDiscounts(
        [FromQuery] string? search,
        [FromQuery] string? className,
        [FromQuery] int? discountId)
    {
        var result = await _masterService.GetStudentDiscountsAsync(search, className, discountId);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("student-discounts")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> GrantStudentDiscount([FromBody] GrantDiscountRequestDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.StudentId) || dto.DiscountId <= 0)
            return BadRequest(new { success = false, message = "Valid Student and Discount rule are required." });

        var result = await _masterService.GrantDiscountToStudentAsync(dto);
        return Ok(new { success = true, message = "Concession granted to student successfully.", data = result });
    }

    [HttpDelete("student-discounts/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> RemoveStudentDiscount(int id)
    {
        var success = await _masterService.RemoveStudentDiscountAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Concession record not found." });

        return Ok(new { success = true, message = "Concession removed successfully." });
    }

    // =========================================================================
    // 9. LATE FINE RULES
    // =========================================================================

    [HttpGet("fine-rules")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetFineRules(
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        var result = await _masterService.GetFineRulesAsync(search, status);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("fine-rules/{id:int}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetFineRuleById(int id)
    {
        var item = await _masterService.GetFineRuleByIdAsync(id);
        if (item == null)
            return NotFound(new { success = false, message = "Fine rule not found." });
        return Ok(new { success = true, data = item });
    }

    [HttpPost("fine-rules")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateFineRule([FromBody] FineRuleDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.RuleName))
            return BadRequest(new { success = false, message = "Rule name is required." });

        var result = await _masterService.CreateFineRuleAsync(dto);
        return Ok(new { success = true, message = "Fine rule created successfully.", data = result });
    }

    [HttpPut("fine-rules/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> UpdateFineRule(int id, [FromBody] FineRuleDto dto)
    {
        var result = await _masterService.UpdateFineRuleAsync(id, dto);
        if (result == null)
            return NotFound(new { success = false, message = "Fine rule not found." });

        return Ok(new { success = true, message = "Fine rule updated successfully.", data = result });
    }

    [HttpDelete("fine-rules/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> DeleteFineRule(int id)
    {
        var success = await _masterService.DeleteFineRuleAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Fine rule not found." });

        return Ok(new { success = true, message = "Fine rule deleted successfully." });
    }

    // =========================================================================
    // 9. HOSTEL FEE CONFIGURATIONS
    // =========================================================================

    [HttpGet("hostel-fees")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetHostelFeeConfigs(
        [FromQuery] string? search,
        [FromQuery] string? hostelId,
        [FromQuery] string? status)
    {
        var result = await _masterService.GetHostelFeeConfigsAsync(search, hostelId, status);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("hostel-fees/{id:int}")]
    [Authorize(Roles = "Admin,Staff,SuperAdmin,Accountant")]
    public async Task<IActionResult> GetHostelFeeConfigById(int id)
    {
        var item = await _masterService.GetHostelFeeConfigByIdAsync(id);
        if (item == null)
            return NotFound(new { success = false, message = "Hostel fee configuration not found." });
        return Ok(new { success = true, data = item });
    }

    [HttpPost("hostel-fees")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> CreateHostelFeeConfig([FromBody] CreateFinanceHostelConfigDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.HostelId) || dto.HostelFee < 0)
            return BadRequest(new { success = false, message = "Valid hostel block and non-negative hostel fee are required." });

        var result = await _masterService.CreateHostelFeeConfigAsync(dto);
        return Ok(new { success = true, message = "Hostel fee configuration created successfully.", data = result });
    }

    [HttpPut("hostel-fees/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> UpdateHostelFeeConfig(int id, [FromBody] CreateFinanceHostelConfigDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.HostelId) || dto.HostelFee < 0)
            return BadRequest(new { success = false, message = "Valid hostel block and non-negative hostel fee are required." });

        var result = await _masterService.UpdateHostelFeeConfigAsync(id, dto);
        if (result == null)
            return NotFound(new { success = false, message = "Hostel fee configuration not found." });

        return Ok(new { success = true, message = "Hostel fee configuration updated successfully.", data = result });
    }

    [HttpDelete("hostel-fees/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin,Accountant")]
    public async Task<IActionResult> DeleteHostelFeeConfig(int id)
    {
        var success = await _masterService.DeleteHostelFeeConfigAsync(id);
        if (!success)
            return NotFound(new { success = false, message = "Hostel fee configuration not found." });

        return Ok(new { success = true, message = "Hostel fee configuration deleted successfully." });
    }
}