using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class TransportFleetTool : IAiTool
    {
        private readonly AppDbContext _context;

        public TransportFleetTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "transport_get_fleet_info";
        public string Description => "Retrieves school transport fleet information, bus routes, pickup points, assigned drivers, and student bus allocations.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""routeSearch"": { ""type"": ""string"", ""description"": ""Route name or stop landmark"" },
                ""vehicleNumber"": { ""type"": ""string"", ""description"": ""Bus registration number"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "TransportManager", "Driver", "Teacher", "Parent", "Student" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var rSearch = arguments.TryGetProperty("routeSearch", out var rElem) ? rElem.GetString()?.Trim().ToLowerInvariant() : null;
            var vNum = arguments.TryGetProperty("vehicleNumber", out var vElem) ? vElem.GetString()?.Trim().ToLowerInvariant() : null;

            // Parent/Student scoping: return their specific assigned bus, route and pickup point
            if (context.UserRole.Equals("Student", StringComparison.OrdinalIgnoreCase) || context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                var targetStudentId = context.StudentId;
                if (!targetStudentId.HasValue && context.LinkedChildStudentIds.Count > 0)
                    targetStudentId = context.LinkedChildStudentIds.First();

                if (targetStudentId.HasValue)
                {
                    var assignment = await _context.StudentTransportAssignments
                        .AsNoTracking()
                        .Include(a => a.Route)
                        .Include(a => a.PickupPoint)
                        .FirstOrDefaultAsync(a => a.StudentId == targetStudentId.Value && a.Status && !a.IsDeleted);

                    if (assignment != null)
                    {
                        var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentId == targetStudentId.Value);
                        var studentName = student?.StudentName ?? assignment.AdmissionNo ?? "Student";

                        var vehicle = await _context.TransportVehicleAssignments
                            .AsNoTracking()
                            .Include(v => v.Vehicle)
                            .Include(v => v.Driver)
                            .FirstOrDefaultAsync(v => v.RouteId == assignment.RouteId && v.Status && !v.IsDeleted);

                        string pickupTimeStr = assignment.PickupPoint != null ? assignment.PickupPoint.PickupTime.ToString(@"hh\:mm") : "-";
                        string dropTimeStr = assignment.PickupPoint != null ? assignment.PickupPoint.DropTime.ToString(@"hh\:mm") : "-";
                        string stopName = assignment.PickupPoint?.PickupPointName ?? "Assigned Stop";

                        var summary = $"Transport details for {studentName}: Route '{assignment.Route?.RouteName ?? "-"}', Bus: {vehicle?.Vehicle?.VehicleNumber ?? "Bus Assigned"}, Driver: {vehicle?.Driver?.DriverName ?? "Driver"} ({vehicle?.Driver?.Phone ?? "-"}), Pickup Stop: '{stopName}', Morning Pickup: {pickupTimeStr}, Evening Drop: {dropTimeStr}.";

                        var visual = new
                        {
                            title = $"Assigned School Bus - {studentName}",
                            columns = new[] { "Field", "Detail" },
                            rows = new[]
                            {
                                new { Field = "Route Name", Detail = assignment.Route?.RouteName ?? "-" },
                                new { Field = "Vehicle / Bus No", Detail = vehicle?.Vehicle?.VehicleNumber ?? "Assigned" },
                                new { Field = "Driver Name", Detail = vehicle?.Driver?.DriverName ?? "Assigned Driver" },
                                new { Field = "Driver Contact", Detail = vehicle?.Driver?.Phone ?? "-" },
                                new { Field = "Pickup Point", Detail = stopName },
                                new { Field = "Morning Pickup Time", Detail = pickupTimeStr },
                                new { Field = "Evening Drop Time", Detail = dropTimeStr }
                            }
                        };
                        return AiToolResult.Ok(summary, assignment, "table", visual);
                    }
                    else
                    {
                        return AiToolResult.Ok("No active school bus / transport allocation found for this student account.");
                    }
                }
            }

            // Driver scoping: return their own assigned vehicle and route
            if (context.UserRole.Equals("Driver", StringComparison.OrdinalIgnoreCase))
            {
                var driver = await _context.TransportDrivers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => (context.UserEmail.Length > 0 && d.Email == context.UserEmail) ||
                                              (d.Phone != null && d.Phone.Contains(context.UserName)));

                var assignment = await _context.TransportVehicleAssignments
                    .AsNoTracking()
                    .Include(v => v.Route)
                    .Include(v => v.Vehicle)
                    .FirstOrDefaultAsync(v => (driver != null && v.DriverId == driver.DriverId) || (v.Status && !v.IsDeleted));

                if (assignment != null)
                {
                    var stops = await _context.PickupPoints
                        .Where(p => p.RouteId == assignment.RouteId && p.Status && !p.IsDeleted)
                        .OrderBy(p => p.SequenceNo)
                        .Select(p => new { Stop = p.PickupPointName ?? "Stop", Pickup = p.PickupTime.ToString(@"hh\:mm"), Drop = p.DropTime.ToString(@"hh\:mm") })
                        .ToListAsync();

                    var summary = $"Driver Schedule: Route '{assignment.Route?.RouteName}', Bus Registration '{assignment.Vehicle?.VehicleNumber}', {stops.Count} stops along the route.";
                    return AiToolResult.Ok(summary, stops, "table", new
                    {
                        title = $"Driver Route Sheet: {assignment.Route?.RouteName} ({assignment.Vehicle?.VehicleNumber})",
                        columns = new[] { "Stop", "Pickup", "Drop" },
                        rows = stops
                    });
                }
            }

            // Admin / Fleet wide
            var routes = await _context.TransportRoutes
                .AsNoTracking()
                .Where(r => r.Status && !r.IsDeleted)
                .Take(20)
                .ToListAsync();

            var vehicles = await _context.TransportVehicleAssignments
                .AsNoTracking()
                .Include(v => v.Vehicle)
                .Include(v => v.Driver)
                .Where(v => v.Status && !v.IsDeleted)
                .ToListAsync();

            var list = routes.Select(r =>
            {
                var v = vehicles.FirstOrDefault(x => x.RouteId == r.RouteId);
                return new
                {
                    RouteName = r.RouteName,
                    RouteCode = r.RouteCode,
                    VehicleNumber = v?.Vehicle?.VehicleNumber ?? "Unassigned",
                    DriverName = v?.Driver?.DriverName ?? "Unassigned",
                    DriverPhone = v?.Driver?.Phone ?? "-",
                    MonthlyFee = $"₹{r.MonthlyFee:N0}",
                    Status = r.Status ? "Active" : "Inactive"
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(rSearch))
            {
                list = list.Where(x => (x.RouteName != null && x.RouteName.ToLower().Contains(rSearch)) ||
                                       (x.RouteCode != null && x.RouteCode.ToLower().Contains(rSearch))).ToList();
            }

            if (!string.IsNullOrWhiteSpace(vNum))
            {
                list = list.Where(x => x.VehicleNumber.ToLower().Contains(vNum)).ToList();
            }

            string adminSummary = $"Transport Fleet: {list.Count} route(s) registered. Active vehicles: {vehicles.Count}.";
            return AiToolResult.Ok(adminSummary, list, "table", new
            {
                title = "School Transport Fleet & Route Roster",
                columns = new[] { "RouteName", "RouteCode", "VehicleNumber", "DriverName", "DriverPhone", "MonthlyFee", "Status" },
                rows = list
            });
        }
    }

    public class TransportStudentAssignmentsTool : IAiTool
    {
        private readonly AppDbContext _context;

        public TransportStudentAssignmentsTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "transport_get_student_assignments";
        public string Description => "Lists students assigned to school transport routes, buses, and pickup stops with contact details and allocation status.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""routeName"": { ""type"": ""string"", ""description"": ""Optional route name filter"" },
                ""studentName"": { ""type"": ""string"", ""description"": ""Optional student name or admission number"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "TransportManager", "Teacher", "Staff", "Accountant" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? rName = arguments.TryGetProperty("routeName", out var rElem) ? rElem.GetString()?.Trim().ToLowerInvariant() : null;
            string? sName = arguments.TryGetProperty("studentName", out var sElem) ? sElem.GetString()?.Trim().ToLowerInvariant() : null;

            var query = _context.StudentTransportAssignments
                .AsNoTracking()
                .Include(a => a.Route)
                .Include(a => a.PickupPoint)
                .Where(a => a.Status && !a.IsDeleted);

            if (!string.IsNullOrEmpty(rName))
            {
                query = query.Where(a => a.Route != null && ((a.Route.RouteName != null && a.Route.RouteName.ToLower().Contains(rName)) || (a.Route.RouteCode != null && a.Route.RouteCode.ToLower().Contains(rName))));
            }

            var assignments = await query.Take(50).ToListAsync();

            if (assignments.Count == 0)
            {
                return AiToolResult.Ok("No active transport student assignments found matching criteria.");
            }

            var studentIds = assignments.Where(a => a.StudentId.HasValue).Select(a => (int)a.StudentId!.Value).Distinct().ToList();
            var students = await _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Where(s => studentIds.Contains(s.StudentId))
                .ToDictionaryAsync(s => s.StudentId);

            var rows = assignments.Select(a =>
            {
                Student? stu = null;
                if (a.StudentId.HasValue)
                {
                    students.TryGetValue((int)a.StudentId.Value, out stu);
                }
                return new
                {
                    StudentId = a.StudentId ?? 0,
                    AdmissionNo = a.AdmissionNo ?? stu?.AdmissionNumber ?? "-",
                    StudentName = stu?.StudentName ?? a.AdmissionNo ?? "Student",
                    Class = stu?.ClassGrade?.ClassName ?? "-",
                    Section = stu?.ClassSection?.SectionName ?? "-",
                    Route = a.Route?.RouteName ?? "-",
                    PickupPoint = a.PickupPoint?.PickupPointName ?? "Assigned Stop",
                    ParentMobile = stu?.FatherMobile ?? stu?.MobileNumber ?? "-",
                    MonthlyFee = a.Route?.MonthlyFee ?? 0
                };
            }).ToList();

            if (!string.IsNullOrEmpty(sName))
            {
                rows = rows.Where(r => r.StudentName.ToLower().Contains(sName) || r.AdmissionNo.ToLower().Contains(sName)).ToList();
            }

            string summary = $"Found {rows.Count} student(s) actively assigned to school transport.";
            var visualData = new
            {
                title = "Transport Student Allocations Roster",
                columns = new[] { "AdmissionNo", "StudentName", "Class", "Route", "PickupPoint", "ParentMobile", "MonthlyFee" },
                rows = rows
            };

            return AiToolResult.Ok(summary, rows, "table", visualData);
        }
    }
}
