using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class BackupModuleCountDto
    {
        [JsonPropertyName("module")]
        public string Module { get; set; } = string.Empty;

        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public class BackupStatusDto
    {
        [JsonPropertyName("databaseEngine")]
        public string DatabaseEngine { get; set; } = "MySQL 8.0 (InnoDB)";

        [JsonPropertyName("schoolId")]
        public int? SchoolId { get; set; }

        [JsonPropertyName("schoolName")]
        public string SchoolName { get; set; } = string.Empty;

        [JsonPropertyName("totalRecords")]
        public int TotalRecords { get; set; }

        [JsonPropertyName("lastBackupDate")]
        public string? LastBackupDate { get; set; }

        [JsonPropertyName("modules")]
        public List<BackupModuleCountDto> Modules { get; set; } = new();
    }

    public class BackupSnapshotItemDto
    {
        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [JsonPropertyName("fileSizeBytes")]
        public long FileSizeBytes { get; set; }

        [JsonPropertyName("fileSizeFormatted")]
        public string FileSizeFormatted { get; set; } = string.Empty;

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("createdAtFormatted")]
        public string CreatedAtFormatted { get; set; } = string.Empty;

        [JsonPropertyName("createdBy")]
        public string CreatedBy { get; set; } = string.Empty;

        [JsonPropertyName("totalRecords")]
        public int TotalRecords { get; set; }

        [JsonPropertyName("schoolName")]
        public string? SchoolName { get; set; }
    }

    public class RestoreResultDto
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("restoredAt")]
        public string RestoredAt { get; set; } = string.Empty;

        [JsonPropertyName("restoredBy")]
        public string RestoredBy { get; set; } = string.Empty;

        [JsonPropertyName("totalRestored")]
        public int TotalRestored { get; set; }

        [JsonPropertyName("moduleCounts")]
        public Dictionary<string, int> ModuleCounts { get; set; } = new();
    }

    public class RestoreSnapshotRequestDto
    {
        [JsonPropertyName("fileName")]
        public string? FileName { get; set; }
    }

    public class DatabaseBackupPayloadDto
    {
        [JsonPropertyName("formatVersion")]
        public string FormatVersion { get; set; } = "2.0";

        [JsonPropertyName("exportedAt")]
        public DateTime ExportedAt { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("exportedBy")]
        public string ExportedBy { get; set; } = "Administrator";

        [JsonPropertyName("userRole")]
        public string UserRole { get; set; } = "Admin";

        [JsonPropertyName("schoolId")]
        public int? SchoolId { get; set; }

        [JsonPropertyName("schoolName")]
        public string SchoolName { get; set; } = string.Empty;

        [JsonPropertyName("totalRecords")]
        public int TotalRecords { get; set; }

        // Module payloads stored as JSON elements
        [JsonPropertyName("settings")]
        public object? Settings { get; set; }

        [JsonPropertyName("automatedIdFormats")]
        public List<object>? AutomatedIdFormats { get; set; }

        [JsonPropertyName("campuses")]
        public List<object>? Campuses { get; set; }

        [JsonPropertyName("academicYears")]
        public List<object>? AcademicYears { get; set; }

        [JsonPropertyName("departments")]
        public List<object>? Departments { get; set; }

        [JsonPropertyName("designations")]
        public List<object>? Designations { get; set; }

        [JsonPropertyName("classes")]
        public List<object>? Classes { get; set; }

        [JsonPropertyName("sections")]
        public List<object>? Sections { get; set; }

        [JsonPropertyName("subjects")]
        public List<object>? Subjects { get; set; }

        [JsonPropertyName("feeHeads")]
        public List<object>? FeeHeads { get; set; }

        [JsonPropertyName("feeStructures")]
        public List<object>? FeeStructures { get; set; }

        [JsonPropertyName("students")]
        public List<object>? Students { get; set; }

        [JsonPropertyName("staff")]
        public List<object>? Staff { get; set; }
    }
}
