using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces.StaffManagement;

namespace SMS.Api.Services.Ai.Tools
{
    public class AdminStaffDirectoryTool : IAiTool
    {
        private readonly IStaffService _staffService;

        public AdminStaffDirectoryTool(IStaffService staffService)
        {
            _staffService = staffService;
        }

        public string Name => "admin_get_staff_list";
        public string Description => "Retrieves directory of school staff and teachers by department, designation, or search query.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""search"": { ""type"": ""string"", ""description"": ""Staff name, designation, or employee ID"" },
                ""department"": { ""type"": ""string"", ""description"": ""Department e.g. 'Mathematics', 'Science', 'Administration'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Staff", "Accountant" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? search = arguments.TryGetProperty("search", out var sElem) ? sElem.GetString()?.Trim() : null;
            string? department = arguments.TryGetProperty("department", out var dElem) ? dElem.GetString()?.Trim() : null;

            var staffList = await _staffService.GetAllStaffAsync(search, department);
            if (staffList.Count == 0)
            {
                return AiToolResult.Ok($"No staff members found matching query '{search ?? department}'.");
            }

            var rows = staffList.Select(s => new
            {
                EmployeeId = s.EmployeeId ?? "-",
                Name = $"{s.FirstName} {s.LastName}".Trim(),
                Designation = s.Designation ?? "Faculty",
                Department = s.Department ?? "Academics",
                Role = s.SystemRole ?? "Teacher",
                Email = s.Email ?? "-",
                Phone = s.Phone ?? "-"
            }).ToList();

            string summary = $"Found {staffList.Count} staff member(s) in directory.";
            return AiToolResult.Ok(summary, rows, "table", new
            {
                title = "School Staff & Faculty Directory",
                columns = new[] { "EmployeeId", "Name", "Designation", "Department", "Role", "Email", "Phone" },
                rows = rows.Take(30).ToList()
            });
        }
    }

    public class AdminClassesTool : IAiTool
    {
        private readonly AppDbContext _context;

        public AdminClassesTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "admin_get_classes_sections";
        public string Description => "Lists all academic classes, sections, student capacity, and class teacher assignments.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""search"": { ""type"": ""string"", ""description"": ""Optional class or section name"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var classes = await _context.Classes
                .AsNoTracking()
                .Include(c => c.Sections)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            if (classes.Count == 0)
            {
                return AiToolResult.Ok("No academic classes configured.");
            }

            var rows = new List<object>();
            foreach (var c in classes)
            {
                foreach (var s in c.Sections)
                {
                    rows.Add(new
                    {
                        Class = c.ClassName,
                        Section = s.SectionName,
                        Capacity = s.Capacity,
                        RoomNumber = s.RoomNo ?? "-",
                        ClassTeacher = s.Remarks ?? "Assigned"
                    });
                }
            }

            string summary = $"Found {classes.Count} class grades with {rows.Count} active section(s).";
            return AiToolResult.Ok(summary, rows, "table", new
            {
                title = "Academic Classes & Sections Overview",
                columns = new[] { "Class", "Section", "ClassTeacher", "Capacity", "RoomNumber" },
                rows = rows
            });
        }
    }
}
