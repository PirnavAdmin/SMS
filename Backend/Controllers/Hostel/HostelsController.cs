namespace SMS.Api.Controllers.Auth;

using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Threading.Tasks;

[ApiController]
[Route("api/hostels")]
public class HostelsController : ControllerBase
{
    private readonly IHostelService _hostelService;

    public HostelsController(IHostelService hostelService)
    {
        _hostelService = hostelService;
    }

    // --- EXECUTIVE DASHBOARD ---
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics()
    {
        var metrics = await _hostelService.GetExecutiveDashboardMetricsAsync();
        return Ok(metrics);
    }

    // --- HOSTEL BLOCKS (MASTERS) ---
    [HttpGet("blocks")]
    public async Task<IActionResult> GetAllHostelBlocks([FromQuery] string? search, [FromQuery] string? type)
    {
        var blocks = await _hostelService.GetAllHostelBlocksAsync(search, type);
        return Ok(blocks);
    }

    [HttpGet("blocks/{id:int}")]
    public async Task<IActionResult> GetHostelBlockById(int id)
    {
        var block = await _hostelService.GetHostelBlockByIdAsync(id);
        return Ok(block);
    }

    [HttpPost("blocks")]
    public async Task<IActionResult> CreateHostelBlock([FromBody] CreateHostelBlockDto dto)
    {
        var created = await _hostelService.CreateHostelBlockAsync(dto);
        return CreatedAtAction(nameof(GetHostelBlockById), new { id = created.HostelId }, created);
    }

    [HttpPut("blocks/{id:int}")]
    public async Task<IActionResult> UpdateHostelBlock(int id, [FromBody] CreateHostelBlockDto dto)
    {
        var updated = await _hostelService.UpdateHostelBlockAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("blocks/{id:int}")]
    public async Task<IActionResult> DeleteHostelBlock(int id)
    {
        await _hostelService.DeleteHostelBlockAsync(id);
        return NoContent();
    }

    // --- ROOM TYPE CONFIGS ---
    [HttpGet("room-types")]
    public async Task<IActionResult> GetAllRoomTypeConfigs([FromQuery] string? search)
    {
        var configs = await _hostelService.GetAllRoomTypeConfigsAsync(search);
        return Ok(configs);
    }

    [HttpGet("room-types/{id:int}")]
    public async Task<IActionResult> GetRoomTypeConfigById(int id)
    {
        var config = await _hostelService.GetRoomTypeConfigByIdAsync(id);
        return Ok(config);
    }

    [HttpPost("room-types")]
    public async Task<IActionResult> CreateRoomTypeConfig([FromBody] CreateRoomTypeConfigDto dto)
    {
        var created = await _hostelService.CreateRoomTypeConfigAsync(dto);
        return CreatedAtAction(nameof(GetRoomTypeConfigById), new { id = created.RoomTypeId }, created);
    }

    [HttpPut("room-types/{id:int}")]
    public async Task<IActionResult> UpdateRoomTypeConfig(int id, [FromBody] CreateRoomTypeConfigDto dto)
    {
        var updated = await _hostelService.UpdateRoomTypeConfigAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("room-types/{id:int}")]
    public async Task<IActionResult> DeleteRoomTypeConfig(int id)
    {
        await _hostelService.DeleteRoomTypeConfigAsync(id);
        return NoContent();
    }

    // --- ROOM MASTERS ---
    [HttpGet("rooms")]
    public async Task<IActionResult> GetAllRooms([FromQuery] int? hostelId, [FromQuery] string? floor, [FromQuery] int? roomTypeId, [FromQuery] string? search)
    {
        var rooms = await _hostelService.GetAllRoomsAsync(hostelId, floor, roomTypeId, search);
        return Ok(rooms);
    }

    [HttpGet("rooms/{id:int}")]
    public async Task<IActionResult> GetRoomById(int id)
    {
        var room = await _hostelService.GetRoomByIdAsync(id);
        return Ok(room);
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomMasterDto dto)
    {
        var created = await _hostelService.CreateRoomAsync(dto);
        return CreatedAtAction(nameof(GetRoomById), new { id = created.RoomId }, created);
    }

    [HttpPut("rooms/{id:int}")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] CreateRoomMasterDto dto)
    {
        var updated = await _hostelService.UpdateRoomAsync(id, dto);
        return Ok(updated);
    }

    [HttpDelete("rooms/{id:int}")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        await _hostelService.DeleteRoomAsync(id);
        return NoContent();
    }

    // --- WARDENS & STAFF LINK ---
    [HttpGet("wardens")]
    public async Task<IActionResult> GetAllWardens([FromQuery] int? hostelId, [FromQuery] string? search)
    {
        var wardens = await _hostelService.GetAllWardensAsync(hostelId, search);
        return Ok(wardens);
    }

    [HttpGet("staff-candidates")]
    public async Task<IActionResult> GetStaffCandidates([FromQuery] string? search)
    {
        var candidates = await _hostelService.GetStaffCandidatesAsync(search);
        return Ok(candidates);
    }

    [HttpPost("wardens")]
    public async Task<IActionResult> SaveWardenDetails([FromBody] SaveHostelWardenDto dto)
    {
        var created = await _hostelService.SaveWardenDetailsAsync(dto);
        return Ok(created);
    }

    [HttpDelete("wardens/{id:int}")]
    public async Task<IActionResult> DeleteWarden(int id)
    {
        await _hostelService.DeleteWardenAsync(id);
        return NoContent();
    }

    // --- STUDENT BED ALLOCATIONS ---
    [HttpGet("allocations")]
    public async Task<IActionResult> GetAllBedAllocations([FromQuery] int? hostelId, [FromQuery] int? roomId, [FromQuery] string? search)
    {
        var allocations = await _hostelService.GetAllBedAllocationsAsync(hostelId, roomId, search);
        return Ok(allocations);
    }

    [HttpPost("allocations")]
    public async Task<IActionResult> AllocateBed([FromBody] CreateBedAllocationDto dto)
    {
        var created = await _hostelService.AllocateBedAsync(dto);
        return Ok(created);
    }

    [HttpPut("allocations/{id:int}/vacate")]
    public async Task<IActionResult> VacateBed(int id)
    {
        await _hostelService.VacateBedAsync(id);
        return NoContent();
    }

    // --- NIGHT ATTENDANCE ROLL CALL ---
    [HttpGet("attendance")]
    public async Task<IActionResult> GetNightAttendanceRollCall([FromQuery] DateTime? date, [FromQuery] int? hostelId, [FromQuery] string? floor, [FromQuery] int? roomId)
    {
        var targetDate = date ?? DateTime.UtcNow;
        var rollCall = await _hostelService.GetNightAttendanceRollCallAsync(targetDate, hostelId, floor, roomId);
        return Ok(rollCall);
    }

    [HttpPost("attendance")]
    public async Task<IActionResult> SaveNightAttendanceRollCall([FromBody] SaveHostelAttendanceRollCallDto dto)
    {
        await _hostelService.SaveNightAttendanceRollCallAsync(dto);
        return Ok(new { message = "Hostel night attendance saved successfully." });
    }

    // --- REPORT CENTER ---
    [HttpGet("reports")]
    public async Task<IActionResult> GetFilteredReports([FromQuery] HostelReportFilterDto filter)
    {
        var report = await _hostelService.GetFilteredReportsAsync(filter);
        return Ok(report);
    }
}
