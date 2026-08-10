using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System.Text;
using System.Text.Json;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/hostel")]
    [AllowAnonymous]
    [Tags("Hostel Management")]
    public class HostelController : ControllerBase
    {
        private readonly IHostelService _hostelService;

        public HostelController(IHostelService hostelService)
        {
            _hostelService = hostelService;
        }

        // =========================================================
        // 1. DASHBOARD & OVERVIEW
        // =========================================================

        [HttpGet("dashboard")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDashboard()
        {
            var metrics = await _hostelService.GetExecutiveDashboardMetricsAsync();
            var blocks = await _hostelService.GetAllHostelBlocksAsync(null, null);

            return Ok(new
            {
                success = true,
                message = "Hostel dashboard metrics retrieved successfully.",
                data = new
                {
                    metrics,
                    blocks,
                    totalHostels = metrics.TotalHostels,
                    totalRooms = metrics.TotalRooms,
                    totalBedCapacity = metrics.TotalBedCapacity,
                    occupiedBeds = metrics.OccupiedBeds,
                    availableVacantBeds = metrics.AvailableVacantBeds,
                    enrolledHostellers = metrics.HostellerStudents,
                    estMonthlyRevenue = metrics.EstMonthlyRevenue,
                    occupancyPercentage = metrics.OccupancyPercentage
                }
            });
        }

        // =========================================================
        // 2. HOSTEL MASTER SETUP / HOSTEL BLOCKS
        // =========================================================

        [HttpGet("blocks")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllHostels(
            [FromQuery] string? search,
            [FromQuery] string? type)
        {
            var hostels = await _hostelService.GetAllHostelBlocksAsync(search, type);
            return Ok(new
            {
                success = true,
                message = "Hostel facilities retrieved successfully.",
                data = hostels,
                totalCount = hostels.Count
            });
        }

        [HttpGet("blocks/lookup")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHostelsLookup()
        {
            var hostels = await _hostelService.GetAllHostelBlocksAsync(null, null);
            var lookup = hostels.Select(h => new
            {
                id = h.HostelId,
                hostelId = h.HostelId,
                name = h.HostelName,
                hostelName = h.HostelName,
                code = h.HostelCode,
                hostelCode = h.HostelCode,
                type = h.HostelType,
                hostelType = h.HostelType
            });

            return Ok(new
            {
                success = true,
                data = lookup
            });
        }

        [HttpGet("blocks/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHostelById(int id)
        {
            var hostel = await _hostelService.GetHostelBlockByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = hostel
            });
        }

        [HttpPost("blocks")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateHostel([FromBody] CreateHostelBlockDto dto)
        {
            var hostel = await _hostelService.CreateHostelBlockAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Hostel facility created successfully.",
                data = hostel
            });
        }

        [HttpPut("blocks/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateHostel(int id, [FromBody] CreateHostelBlockDto dto)
        {
            var hostel = await _hostelService.UpdateHostelBlockAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Hostel facility updated successfully.",
                data = hostel
            });
        }

        [HttpDelete("blocks/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteHostel(int id)
        {
            var deleted = await _hostelService.DeleteHostelBlockAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Hostel facility deleted successfully."
            });
        }

        // =========================================================
        // 3. ROOM CATEGORIES / ROOM TYPES
        // =========================================================

        [HttpGet("room-types")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllRoomTypes([FromQuery] string? search)
        {
            var roomTypes = await _hostelService.GetAllRoomTypeConfigsAsync(search);
            return Ok(new
            {
                success = true,
                message = "Room categories retrieved successfully.",
                data = roomTypes,
                totalCount = roomTypes.Count
            });
        }

        [HttpGet("room-types/lookup")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomTypesLookup()
        {
            var roomTypes = await _hostelService.GetAllRoomTypeConfigsAsync(null);
            var lookup = roomTypes.Select(r => new
            {
                id = r.RoomTypeId,
                roomTypeId = r.RoomTypeId,
                name = r.RoomTypeSpecification,
                specification = r.RoomTypeSpecification,
                bedCapacity = r.BedCapacity,
                acType = r.AcType
            });

            return Ok(new
            {
                success = true,
                data = lookup
            });
        }

        [HttpGet("room-types/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomTypeById(int id)
        {
            var roomType = await _hostelService.GetRoomTypeConfigByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = roomType
            });
        }

        [HttpPost("room-types")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateRoomType([FromBody] CreateRoomTypeConfigDto dto)
        {
            var roomType = await _hostelService.CreateRoomTypeConfigAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Room category configured successfully.",
                data = roomType
            });
        }

        [HttpPut("room-types/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateRoomType(int id, [FromBody] CreateRoomTypeConfigDto dto)
        {
            var roomType = await _hostelService.UpdateRoomTypeConfigAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Room category updated successfully.",
                data = roomType
            });
        }

        [HttpDelete("room-types/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var deleted = await _hostelService.DeleteRoomTypeConfigAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Room category deleted successfully."
            });
        }

        // =========================================================
        // 4. ROOM MANAGEMENT
        // =========================================================

        [HttpGet("rooms")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllRooms(
            [FromQuery] int? hostelId,
            [FromQuery] string? floor,
            [FromQuery] int? roomTypeId,
            [FromQuery] string? search)
        {
            var rooms = await _hostelService.GetAllRoomsAsync(hostelId, floor, roomTypeId, search);
            return Ok(new
            {
                success = true,
                message = "Rooms retrieved successfully.",
                data = rooms,
                totalCount = rooms.Count
            });
        }

        [HttpGet("rooms/lookup")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomsLookup([FromQuery] int? hostelId)
        {
            var rooms = await _hostelService.GetAllRoomsAsync(hostelId, null, null, null);
            var lookup = rooms.Select(r => new
            {
                id = r.RoomId,
                roomId = r.RoomId,
                roomNumber = r.RoomNumber,
                hostelName = r.HostelName,
                floorLevel = r.FloorLevel,
                vacantBeds = r.VacantBeds
            });

            return Ok(new
            {
                success = true,
                data = lookup
            });
        }

        [HttpGet("rooms/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomById(int id)
        {
            var room = await _hostelService.GetRoomByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = room
            });
        }

        [HttpPost("rooms")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomMasterDto dto)
        {
            var room = await _hostelService.CreateRoomAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Room created successfully.",
                data = room
            });
        }

        [HttpPut("rooms/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] CreateRoomMasterDto dto)
        {
            var room = await _hostelService.UpdateRoomAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Room updated successfully.",
                data = room
            });
        }

        [HttpDelete("rooms/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var deleted = await _hostelService.DeleteRoomAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Room deleted successfully."
            });
        }

        // =========================================================
        // 5. WARDEN MANAGEMENT
        // =========================================================

        [HttpGet("wardens")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllWardens(
            [FromQuery] int? hostelId,
            [FromQuery] string? search)
        {
            var wardens = await _hostelService.GetAllWardensAsync(hostelId, search);
            return Ok(new
            {
                success = true,
                message = "Wardens retrieved successfully.",
                data = wardens,
                totalCount = wardens.Count
            });
        }

        [HttpGet("wardens/candidates")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStaffCandidates([FromQuery] string? search)
        {
            var candidates = await _hostelService.GetStaffCandidatesAsync(search);
            return Ok(new
            {
                success = true,
                data = candidates
            });
        }

        [HttpPost("wardens")]
        [AllowAnonymous]
        public async Task<IActionResult> SaveWarden([FromBody] SaveHostelWardenDto dto)
        {
            var warden = await _hostelService.SaveWardenDetailsAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Warden assigned successfully.",
                data = warden
            });
        }

        [HttpDelete("wardens/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> DeleteWarden(int id)
        {
            var deleted = await _hostelService.DeleteWardenAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Warden record deleted successfully."
            });
        }

        // =========================================================
        // 6. BED ALLOCATIONS (Room Allocation)
        // =========================================================

        [HttpGet("students/lookup")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHostellerStudentsLookup([FromQuery] string? search)
        {
            var reports = await _hostelService.GetFilteredReportsAsync(new HostelReportFilterDto { Search = search });
            var list = reports.Select(r => new
            {
                id = r.AllocationId,
                studentId = r.AllocationId,
                studentName = r.StudentName,
                admissionNo = r.AdmissionNo,
                displayText = $"{r.StudentName} ({r.AdmissionNo})"
            });

            return Ok(new
            {
                success = true,
                data = list
            });
        }

        [HttpGet("allocations")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllBedAllocations(
            [FromQuery] int? hostelId,
            [FromQuery] int? roomId,
            [FromQuery] string? search)
        {
            var allocations = await _hostelService.GetAllBedAllocationsAsync(hostelId, roomId, search);
            return Ok(new
            {
                success = true,
                message = "Bed allocations retrieved successfully.",
                data = allocations,
                totalCount = allocations.Count
            });
        }

        [HttpPost("allocations")]
        [AllowAnonymous]
        public async Task<IActionResult> AllocateBed([FromBody] CreateBedAllocationDto dto)
        {
            var allocation = await _hostelService.AllocateBedAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Bed allocated to student successfully.",
                data = allocation
            });
        }

        [HttpDelete("allocations/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> VacateBed(int id)
        {
            var vacated = await _hostelService.VacateBedAsync(id);
            return Ok(new
            {
                success = vacated,
                message = "Bed vacated successfully."
            });
        }

        // =========================================================
        // 7. HOSTEL ATTENDANCE
        // =========================================================

        [HttpGet("attendance")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAttendanceRollCall(
            [FromQuery] DateTime? date,
            [FromQuery] int? hostelId,
            [FromQuery] string? floor,
            [FromQuery] int? roomId)
        {
            var targetDate = date ?? DateTime.UtcNow;
            var records = await _hostelService.GetNightAttendanceRollCallAsync(targetDate, hostelId, floor, roomId);
            return Ok(new
            {
                success = true,
                data = records,
                totalCount = records.Count
            });
        }

        [HttpPost("attendance")]
        [AllowAnonymous]
        public async Task<IActionResult> SaveAttendanceRollCall([FromBody] SaveHostelAttendanceRollCallDto dto)
        {
            var saved = await _hostelService.SaveNightAttendanceRollCallAsync(dto);
            return Ok(new
            {
                success = saved,
                message = "Night roll call attendance saved successfully."
            });
        }

        // =========================================================
        // 8. HOSTEL REPORTS
        // =========================================================

        [HttpGet("reports")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHostelReports([FromQuery] HostelReportFilterDto filter)
        {
            var reports = await _hostelService.GetFilteredReportsAsync(filter);
            return Ok(new
            {
                success = true,
                data = reports,
                totalCount = reports.Count
            });
        }

        [HttpGet("reports/print")]
        [AllowAnonymous]
        public async Task<IActionResult> PrintHostelReport([FromQuery] HostelReportFilterDto filter)
        {
            var reports = await _hostelService.GetFilteredReportsAsync(filter);
            string title = filter.ReportType ?? "Hostel Enterprise Report";

            var sb = new StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + title + "</title>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #1e293b; }");
            sb.AppendLine("h1 { color: #0284c7; text-align: center; margin-bottom: 5px; }");
            sb.AppendLine("p.sub { text-align: center; color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 25px; }");
            sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 15px; }");
            sb.AppendLine("th { background-color: #0284c7; color: white; padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; }");
            sb.AppendLine("td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }");
            sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
            sb.AppendLine("</style></head><body>");
            sb.AppendLine($"<h1>{title}</h1>");
            sb.AppendLine($"<p class='sub'>Generated on {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Pirnav Schools Hostel ERP</p>");
            sb.AppendLine("<table><thead><tr>");

            string reportTypeLower = (filter.ReportType ?? "").ToLower();
            if (reportTypeLower.Contains("hostel report") || reportTypeLower == "hostel")
            {
                sb.AppendLine("<th>Hostel Code</th><th>Hostel Name</th><th>Hostel Type</th><th>Total Rooms</th><th>Total Beds</th><th>Occupied Beds</th><th>Available Beds</th><th>Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.HostelCode}</td><td>{item.HostelName}</td><td>{item.HostelType}</td><td>{item.TotalRooms}</td><td>{item.TotalBeds}</td><td>{item.OccupiedBeds}</td><td>{item.AvailableBeds}</td><td>{item.Status}</td></tr>");
                }
            }
            else if (reportTypeLower.Contains("block report") || reportTypeLower == "block")
            {
                sb.AppendLine("<th>Block Code</th><th>Block Name</th><th>Hostel Facility</th><th>Floors Count</th><th>Assigned Supervisor</th><th>Supervisor Mobile</th><th>Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.BlockCode}</td><td>{item.BlockName}</td><td>{item.HostelFacility}</td><td>{item.FloorsCount}</td><td>{item.AssignedSupervisor}</td><td>{item.SupervisorMobile}</td><td>{item.Status}</td></tr>");
                }
            }
            else if (reportTypeLower.Contains("supervisor report") || reportTypeLower == "supervisor")
            {
                sb.AppendLine("<th>Supervisor Name</th><th>Employee ID</th><th>Assigned Block</th><th>Hostel Facility</th><th>Mobile Number</th><th>Email</th><th>Joining Date</th><th>Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.AssignedSupervisor}</td><td>{item.EmployeeId}</td><td>{item.AssignedBlock}</td><td>{item.HostelFacility}</td><td>{item.MobileNumber}</td><td>{item.Email}</td><td>{item.JoiningDate}</td><td>{item.Status}</td></tr>");
                }
            }
            else if (reportTypeLower.Contains("room occupancy report") || reportTypeLower.Contains("occupancy"))
            {
                sb.AppendLine("<th>Room Number</th><th>Hostel</th><th>Block</th><th>Floor</th><th>Room Type</th><th>Capacity</th><th>Occupied</th><th>Available Beds</th><th>Occupancy Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.RoomNumber}</td><td>{item.HostelName}</td><td>{item.BlockName}</td><td>{item.FloorLevel}</td><td>{item.RoomType}</td><td>{item.Capacity}</td><td>{item.Occupied}</td><td>{item.AvailableBeds}</td><td>{item.OccupancyStatus}</td></tr>");
                }
            }
            else if (reportTypeLower.Contains("student hostel report") || reportTypeLower.Contains("student"))
            {
                sb.AppendLine("<th>Admission No</th><th>Student Name</th><th>Hostel Facility</th><th>Block / Floor</th><th>Room & Bed</th><th>Block Supervisor</th><th>Floor Warden</th><th>Joining Date</th><th>Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.AdmissionNo}</td><td>{item.StudentName}</td><td>{item.HostelFacility}</td><td>{item.BlockAndFloor}</td><td>{item.RoomAndBed}</td><td>{item.BlockSupervisor}</td><td>{item.FloorWarden}</td><td>{item.JoiningDate}</td><td>{item.Status}</td></tr>");
                }
            }
            else
            {
                sb.AppendLine("<th>Admission No</th><th>Student Name</th><th>Class & Section</th><th>Hostel Facility</th><th>Room No</th><th>Bed No</th><th>Joining Date</th><th>Status</th></tr></thead><tbody>");
                foreach (var item in reports)
                {
                    sb.AppendLine($"<tr><td>{item.AdmissionNo}</td><td>{item.StudentName}</td><td>{item.ClassSection}</td><td>{item.HostelFacility}</td><td>{item.RoomNumber}</td><td>{item.BedNumber}</td><td>{item.JoiningDate}</td><td>{item.Status}</td></tr>");
                }
            }

            sb.AppendLine("</tbody></table>");
            sb.AppendLine("<script>window.onload = function() { window.print(); };</script>");
            sb.AppendLine("</body></html>");

            return Content(sb.ToString(), "text/html");
        }

        [HttpGet("reports/export/pdf")]
        [AllowAnonymous]
        public async Task<IActionResult> ExportHostelReportPdf([FromQuery] HostelReportFilterDto filter)
        {
            var reports = await _hostelService.GetFilteredReportsAsync(filter);
            var jsonBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(reports));
            return File(jsonBytes, "application/pdf", $"Hostel_Report_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
        }

        [HttpGet("reports/download")]
        [AllowAnonymous]
        public async Task<IActionResult> DownloadHostelReportCsv([FromQuery] HostelReportFilterDto filter)
        {
            var reports = await _hostelService.GetFilteredReportsAsync(filter);
            var sb = new StringBuilder();
            sb.AppendLine("AdmissionNo,StudentName,HostelName,RoomNumber,BedNumber,JoiningDate,Status");

            foreach (var r in reports)
            {
                sb.AppendLine($"\"{r.AdmissionNo}\",\"{r.StudentName}\",\"{r.HostelName}\",\"{r.RoomNumber}\",\"{r.BedNumber}\",\"{r.JoiningDate}\",\"{r.Status}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"Hostel_Report_{DateTime.Now:yyyyMMdd}.csv");
        }
    }
}
