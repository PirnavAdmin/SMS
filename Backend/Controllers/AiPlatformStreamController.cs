// ============================================================================
// [TEMPORARILY DISABLED] AI Platform Stream Controller disabled for now
// ============================================================================
/*
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Ai;
using SMS.Api.Services.Ai;

namespace SMS.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Route("api/ai-assistant")]
[Authorize]
[Tags("School ERP AI Platform Extensions")]
public class AiPlatformStreamController : ControllerBase
{
    private readonly IAiPlatformProxyService _proxy;

    public AiPlatformStreamController(IAiPlatformProxyService proxy)
    {
        _proxy = proxy;
    }

    [HttpPost("chat/stream")]
    public async Task StreamChat([FromBody] AiChatRequestDto request, CancellationToken ct)
    {
        await _proxy.StreamChatAsync(User, request, Response, ct);
    }

    [HttpGet("capabilities")]
    public async Task<IActionResult> GetCapabilities(CancellationToken ct)
    {
        var data = await _proxy.ProxyJsonAsync(User, HttpMethod.Get, "/api/v1/ai/capabilities", ct: ct);
        return Ok(new { success = true, data });
    }

    [HttpGet("documents")]
    public async Task<IActionResult> ListDocuments(CancellationToken ct)
    {
        var data = await _proxy.ProxyJsonAsync(User, HttpMethod.Get, "/api/v1/ai/documents", ct: ct);
        return Ok(new { success = true, data });
    }

    [HttpPost("documents")]
    public async Task<IActionResult> UploadDocument(
        IFormFile file,
        [FromForm] string category = "policy",
        [FromForm] string allowedRoles = "All",
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "A non-empty document file is required." });
        }
        var data = await _proxy.UploadDocumentAsync(User, file, category, allowedRoles, ct);
        return Ok(new { success = true, data });
    }

    [HttpDelete("documents/{docId}")]
    public async Task<IActionResult> DeleteDocument(string docId, CancellationToken ct)
    {
        var data = await _proxy.ProxyJsonAsync(User, HttpMethod.Delete, $"/api/v1/ai/documents/{Uri.EscapeDataString(docId)}", ct: ct);
        return Ok(new { success = true, data });
    }
}
*/
