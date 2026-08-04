namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Services.Interfaces;
using System.Threading.Tasks;

[ApiController]
[Route("api/library")]
[Authorize]
[Tags("Library & Books Management")]
public class LibraryController : ControllerBase
{
    private readonly ILibraryService _libraryService;

    public LibraryController(ILibraryService libraryService)
    {
        _libraryService = libraryService;
    }

    /// <summary>
    /// Get dropdown options for Academic Years and Available Books
    /// </summary>
    [HttpGet("options")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetLibraryDropdownOptions()
    {
        var result = await _libraryService.GetLibraryDropdownOptionsAsync();
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Book Inventory catalog list (Book Inventory Tab)
    /// </summary>
    [HttpGet("inventory")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetBookInventory([FromQuery] string? search, [FromQuery] string? category)
    {
        var result = await _libraryService.GetBookInventoryAsync(search, category);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get Issued Books & Overdues list (Issued Books & Overdues Tab)
    /// </summary>
    [HttpGet("issued")]
    [Authorize(Roles = "Admin,Teacher,Student,Parent")]
    public async Task<IActionResult> GetIssuedBooks([FromQuery] string? search, [FromQuery] string? status)
    {
        var result = await _libraryService.GetIssuedBooksAsync(search, status);
        return Ok(new { success = true, data = result });
    }
}
