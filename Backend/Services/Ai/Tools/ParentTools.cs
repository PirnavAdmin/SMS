using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces.Parent;

namespace SMS.Api.Services.Ai.Tools
{
    public class ParentChildrenProfileTool : IAiTool
    {
        private readonly IParentService _parentService;
        private readonly AppDbContext _context;

        public ParentChildrenProfileTool(IParentService parentService, AppDbContext context)
        {
            _parentService = parentService;
            _context = context;
        }

        public string Name => "parent_get_children_profile";
        public string Description => "Retrieves linked children profiles for parents, including academic standing, attendance overview, and enrolled classes.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""studentName"": { ""type"": ""string"", ""description"": ""Optional child name if parent has multiple children"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Parent", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            string? childName = arguments.TryGetProperty("studentName", out var nElem) ? nElem.GetString()?.Trim().ToLowerInvariant() : null;

            List<int> studentIds = new();

            if (context.UserRole.Equals("Parent", StringComparison.OrdinalIgnoreCase))
            {
                studentIds = context.LinkedChildStudentIds;
                if (studentIds.Count == 0 && context.UserId > 0)
                {
                    var children = await _parentService.GetChildrenByUserIdAsync(context.UserId);
                    studentIds = children.Select(c => c.StudentId).Distinct().ToList();
                }
            }
            else
            {
                // Admin / Teacher querying
                if (!string.IsNullOrEmpty(childName))
                {
                    studentIds = await _context.Students
                        .Where(s => !s.IsDeleted && s.StudentName.ToLower().Contains(childName))
                        .Select(s => s.StudentId)
                        .Take(5)
                        .ToListAsync();
                }
            }

            if (studentIds.Count == 0)
            {
                return AiToolResult.Ok("No linked children records found for this account.");
            }

            var students = await _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Where(s => studentIds.Contains(s.StudentId) && !s.IsDeleted)
                .ToListAsync();

            var rows = students.Select(s => new
            {
                StudentId = s.StudentId,
                Name = s.StudentName,
                RollNo = s.RollNumber,
                Class = s.ClassGrade?.ClassName ?? "-",
                Section = s.ClassSection?.SectionName ?? "-",
                Branch = s.Branch?.BranchName ?? "-",
                Status = s.Status
            }).ToList();

            string summary = $"Found {students.Count} child profile(s) linked to your parent account.";
            var visualData = new
            {
                title = "Linked Children Profiles",
                columns = new[] { "StudentId", "Name", "RollNo", "Class", "Section", "Branch", "Status" },
                rows = rows
            };

            return AiToolResult.Ok(summary, rows, "table", visualData);
        }
    }
}
