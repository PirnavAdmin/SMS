using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class HostelOccupancyOverviewTool : IAiTool
    {
        private readonly IHostelService _hostelService;

        public HostelOccupancyOverviewTool(IHostelService hostelService)
        {
            _hostelService = hostelService;
        }

        public string Name => "hostel_get_occupancy_overview";
        public string Description => "Retrieves school hostel facility metrics including total hostels, room count, total bed capacity, occupied beds, and available/vacant rooms and beds.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""search"": { ""type"": ""string"", ""description"": ""Optional hostel block name or search keyword"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "HostelWarden", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var metrics = await _hostelService.GetExecutiveDashboardMetricsAsync();

            int totalRooms = metrics.TotalRooms;
            int totalBeds = metrics.TotalBedCapacity;
            int occupiedBeds = metrics.OccupiedBeds;
            int vacantBeds = metrics.AvailableVacantBeds;
            double occupancyPct = totalBeds > 0 ? Math.Round((double)occupiedBeds / (double)totalBeds * 100.0, 1) : 0;

            string summary = $"Hostel Facilities Overview: {metrics.TotalHostels} hostel block(s) with {totalRooms} total rooms. " +
                             $"Bed Capacity: {totalBeds} total beds. Currently {occupiedBeds} occupied ({occupancyPct}% occupancy) and **{vacantBeds} vacant beds available**.";

            var visualData = new
            {
                title = "Hostel Accommodation & Bed Occupancy",
                columns = new[] { "Metric", "Count", "Status" },
                rows = new[]
                {
                    new { Metric = "Total Hostel Blocks", Count = metrics.TotalHostels.ToString(), Status = "Operational" },
                    new { Metric = "Total Rooms", Count = totalRooms.ToString(), Status = "Active" },
                    new { Metric = "Total Bed Capacity", Count = totalBeds.ToString(), Status = "Max Capacity" },
                    new { Metric = "Occupied Beds", Count = occupiedBeds.ToString(), Status = $"{occupancyPct}% Full" },
                    new { Metric = "Available / Vacant Beds", Count = vacantBeds.ToString(), Status = vacantBeds > 0 ? "Vacant" : "Fully Occupied" },
                    new { Metric = "Active Wardens", Count = metrics.ActiveWardens.ToString(), Status = "On Duty" }
                }
            };

            return AiToolResult.Ok(summary, metrics, "table", visualData);
        }
    }

    public class HostelRoomAvailabilityTool : IAiTool
    {
        private readonly IHostelService _hostelService;

        public HostelRoomAvailabilityTool(IHostelService hostelService)
        {
            _hostelService = hostelService;
        }

        public string Name => "hostel_get_room_availability";
        public string Description => "Lists individual hostel rooms with room number, hostel block, floor, sharing type, bed capacity, and vacant bed counts.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""hostelId"": { ""type"": ""integer"", ""description"": ""Optional hostel block ID"" },
                ""floor"": { ""type"": ""string"", ""description"": ""Optional floor, e.g. '1st Floor'"" },
                ""search"": { ""type"": ""string"", ""description"": ""Optional room number or search term"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "HostelWarden", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            int? hostelId = arguments.TryGetProperty("hostelId", out var hElem) && hElem.TryGetInt32(out var hid) ? hid : null;
            string? floor = arguments.TryGetProperty("floor", out var fElem) ? fElem.GetString()?.Trim() : null;
            string? search = arguments.TryGetProperty("search", out var sElem) ? sElem.GetString()?.Trim() : null;

            var rooms = await _hostelService.GetAllRoomsAsync(hostelId, floor, null, search);

            if (rooms == null || rooms.Count == 0)
            {
                return AiToolResult.Ok("No hostel rooms found matching your search criteria.");
            }

            var rows = rooms.Select(r => new
            {
                RoomNumber = r.RoomNumber,
                HostelBlock = r.HostelName ?? $"Block {r.HostelId}",
                Floor = r.Floor ?? "Ground Floor",
                Capacity = r.Capacity,
                Occupied = r.OccupiedBeds,
                Available = Math.Max(0, r.Capacity - r.OccupiedBeds),
                Status = r.Status
            }).ToList();

            int totalAvailableInRooms = rows.Sum(r => r.Available);
            string summary = $"Found {rooms.Count} room(s) with a total of **{totalAvailableInRooms} available bed(s)**.";

            var visualData = new
            {
                title = "Hostel Room Availability Directory",
                columns = new[] { "RoomNumber", "HostelBlock", "Floor", "Capacity", "Occupied", "Available", "Status" },
                rows = rows.Take(30).ToList()
            };

            return AiToolResult.Ok(summary, rows, "table", visualData);
        }
    }
}
