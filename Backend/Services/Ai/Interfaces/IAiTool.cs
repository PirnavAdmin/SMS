using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Dtos.Ai;

namespace SMS.Api.Services.Ai.Interfaces
{
    public class AiToolContext
    {
        public int UserId { get; set; }
        public string UserRole { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string? TenantId { get; set; }
        public int? SchoolId { get; set; }
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }
        public int? AcademicYearId { get; set; }
        public string? AcademicYear { get; set; }
        public int? StaffId { get; set; }
        public int? StudentId { get; set; }
        public List<int> LinkedChildStudentIds { get; set; } = new();
        public List<int> AssignedClassIds { get; set; } = new();
        public List<int> AssignedSectionIds { get; set; } = new();
    }

    public class AiToolResult
    {
        public bool Success { get; set; } = true;
        public string Summary { get; set; } = string.Empty;
        public object? Data { get; set; }
        public string? VisualType { get; set; } // "table", "chart", "action_preview", null
        public object? VisualData { get; set; }
        public AiPendingActionDto? PendingAction { get; set; }
        public string? ErrorMessage { get; set; }

        public static AiToolResult Ok(string summary, object? data = null, string? visualType = null, object? visualData = null)
        {
            return new AiToolResult
            {
                Success = true,
                Summary = summary,
                Data = data,
                VisualType = visualType,
                VisualData = visualData
            };
        }

        public static AiToolResult Fail(string errorMessage)
        {
            return new AiToolResult
            {
                Success = false,
                Summary = errorMessage,
                ErrorMessage = errorMessage
            };
        }
    }

    public interface IAiTool
    {
        string Name { get; }
        string Description { get; }
        string ParametersJsonSchema { get; }
        string[] AllowedRoles { get; }
        Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments);
    }
}
