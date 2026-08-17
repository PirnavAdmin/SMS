using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HostelWardenDto
    {
        [JsonPropertyName("wardenId")]
        public int WardenId { get; set; }

        [JsonPropertyName("id")]
        public int Id => WardenId;

        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("assignedHostel")]
        public string AssignedHostel => HostelName;

        [JsonPropertyName("staffId")]
        public int? StaffId { get; set; }

        [JsonPropertyName("employeeId")]
        public string? EmployeeId { get; set; }

        [JsonPropertyName("wardenName")]
        public string WardenName { get; set; } = string.Empty;

        [JsonPropertyName("mobileNumber")]
        public string MobileNumber { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone => MobileNumber;

        [JsonPropertyName("alternateMobile")]
        public string? AlternateMobile { get; set; }

        [JsonPropertyName("emailAddress")]
        public string? EmailAddress { get; set; }

        [JsonPropertyName("email")]
        public string? Email => EmailAddress;

        [JsonPropertyName("blockName")]
        public string? BlockName { get; set; }

        [JsonPropertyName("floorLevel")]
        public string? FloorLevel { get; set; }

        [JsonPropertyName("effectiveDate")]
        public DateTime? EffectiveDate { get; set; }

        [JsonPropertyName("effectiveDateString")]
        public string? EffectiveDateString => EffectiveDate?.ToString("yyyy-MM-dd");

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class SaveHostelWardenDto
    {
        [JsonPropertyName("hostelId")]
        public int HostelId { get; set; }

        [JsonPropertyName("selectHostel")]
        public string? SelectHostelAlias
        {
            get => HostelId.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [JsonPropertyName("selectHostelBlock")]
        public string? SelectHostelBlockAlias
        {
            get => HostelId.ToString();
            set { if (int.TryParse(value, out int val)) HostelId = val; }
        }

        [JsonPropertyName("staffId")]
        public int? StaffId { get; set; }

        [JsonPropertyName("selectEmployee")]
        public string? SelectEmployeeAlias
        {
            get => StaffId?.ToString();
            set { if (int.TryParse(value, out int val)) StaffId = val; }
        }

        [JsonPropertyName("selectNonTeachingStaffWarden")]
        public string? SelectNonTeachingStaffWardenAlias
        {
            get => StaffId?.ToString();
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int val)) StaffId = val;
                    else WardenName = value;
                }
            }
        }

        [JsonPropertyName("employeeId")]
        public string? EmployeeId { get; set; }

        [JsonPropertyName("wardenName")]
        public string? WardenName { get; set; }

        [JsonPropertyName("mobileNumber")]
        public string? MobileNumber { get; set; }

        [JsonPropertyName("alternateMobile")]
        public string? AlternateMobile { get; set; }

        [JsonPropertyName("emailAddress")]
        public string? EmailAddress { get; set; }

        [JsonPropertyName("email")]
        public string? EmailAlias
        {
            get => EmailAddress;
            set { if (!string.IsNullOrWhiteSpace(value)) EmailAddress = value; }
        }

        [JsonPropertyName("blockName")]
        public string? BlockName { get; set; }

        [JsonPropertyName("floorLevel")]
        public string? FloorLevel { get; set; }

        [JsonPropertyName("effectiveDate")]
        public DateTime? EffectiveDate { get; set; }

        [JsonPropertyName("assignmentDate")]
        public DateTime? AssignmentDateAlias
        {
            get => EffectiveDate;
            set { if (value.HasValue) EffectiveDate = value.Value; }
        }
    }

    public class StaffWardenCandidateDto
    {
        [JsonPropertyName("staffId")]
        public int StaffId { get; set; }

        [JsonPropertyName("employeeId")]
        public string EmployeeId { get; set; } = string.Empty;

        [JsonPropertyName("staffName")]
        public string StaffName { get; set; } = string.Empty;

        [JsonPropertyName("designation")]
        public string Designation { get; set; } = string.Empty;

        [JsonPropertyName("department")]
        public string Department { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("displayText")]
        public string DisplayText => $"{StaffName} ({EmployeeId} • {Designation})";
    }
}
