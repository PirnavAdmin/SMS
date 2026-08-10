namespace SMS.Api.Controllers.Examination;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Examination;
using SMS.Api.Services.Interfaces.Examination;
using System.Threading.Tasks;

[ApiController]
[Route("api/examination-new/grading-scale")]
[Authorize]
[Tags("Examination Module - Grade Configuration & Scale Rules")]
public class ExamGradingScaleController : ControllerBase
{
    private readonly IExamGradingScaleService _service;

    public ExamGradingScaleController(IExamGradingScaleService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get dropdown options for Grading Scale (Exam Types & Pass/Fail choices)
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetGradingScaleOptions()
    {
        var result = await _service.GetGradingScaleOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Grading Scale Rules for an Exam Type (Screenshots 1 & 2)
    /// </summary>
    [HttpGet("rules")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetGradingScaleRules([FromQuery] string? examType = "All")
    {
        var result = await _service.GetGradingScaleRulesAsync(examType);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Save or Modify Grading Scale Rules (Clicking "Modify Scale Rules" -> "Save Changes" - Screenshot 3)
    /// </summary>
    [HttpPost("save-rules")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveGradingScaleRules([FromBody] SaveGradingScaleRequestDto request)
    {
        if (request == null || request.ScaleRules == null)
            return BadRequest(new { success = false, message = "Grading scale rules payload is required." });

        var success = await _service.SaveGradingScaleRulesAsync(request);
        return Ok(new { 
            success = true, 
            message = "Grade configuration and scale rules saved successfully.", 
            data = success 
        });
    }

    /// <summary>
    /// Update Grading Scale Rules (PUT /api/examination-new/grading-scale/update-rules)
    /// </summary>
    [HttpPut("update-rules")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateGradingScaleRules([FromBody] SaveGradingScaleRequestDto request)
    {
        if (request == null || request.ScaleRules == null)
            return BadRequest(new { success = false, message = "Grading scale rules payload is required." });

        var success = await _service.SaveGradingScaleRulesAsync(request);
        return Ok(new { 
            success = true, 
            message = "Grade configuration and scale rules updated successfully.", 
            updated = success 
        });
    }

    /// <summary>
    /// Delete an individual Grade Scale Rule by Rule ID (DELETE /api/examination-new/grading-scale/rules/{ruleId})
    /// </summary>
    [HttpDelete("rules/{ruleId:int}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> DeleteScaleRule(int ruleId)
    {
        var success = await _service.DeleteScaleRuleAsync(ruleId);
        return Ok(new { 
            success = true, 
            message = $"Grading scale rule {ruleId} deleted successfully." 
        });
    }
}

