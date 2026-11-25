using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class SchoolOverviewTool : IAiTool
    {
        private readonly AppDbContext _context;

        public SchoolOverviewTool(AppDbContext context)
        {
            _context = context;
        }

        public string Name => "school_get_overview";
        public string Description => "Retrieves institutional profile of the school, active campuses/branches, operational academic years, and school contact information.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {}
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Teacher", "Staff", "Accountant", "Parent", "Student" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var branches = await _context.Branches.AsNoTracking().ToListAsync();
            var academicYears = await _context.AcademicYears.AsNoTracking().Where(y => !y.IsDeleted).ToListAsync();
            var schools = await _context.Schools.AsNoTracking().ToListAsync();

            var primarySchool = schools.FirstOrDefault();
            string schoolName = primarySchool?.SchoolName ?? "NextGen International School";

            var branchList = branches.Select(b => new
            {
                BranchId = b.BranchId,
                Name = b.BranchName,
                City = b.Address ?? "-",
                Contact = b.Phone ?? "-"
            }).ToList();

            var yearList = academicYears.Select(y => new
            {
                YearId = y.AcademicYearId,
                Name = y.AcademicYearName,
                Status = y.IsActive ? "Active" : "Archived"
            }).ToList();

            string summary = $"{schoolName}: Operating across {branches.Count} branch campus(es) with {academicYears.Count} configured academic year(s). Active Branch Context: '{context.BranchName ?? "Madhapur Branch"}'.";

            var visualData = new
            {
                title = $"Institutional Overview: {schoolName}",
                columns = new[] { "BranchId", "Name", "City", "Contact" },
                rows = branchList
            };

            return AiToolResult.Ok(summary, new
            {
                SchoolName = schoolName,
                Branches = branchList,
                AcademicYears = yearList
            }, "table", visualData);
        }
    }
}
