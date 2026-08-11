using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.AcademicManagement
{
    public class SectionCreateDto
    {
        [Required]
        [JsonPropertyName("section_letter")]
        public string SectionLetter { get; set; } = string.Empty;

        public int Capacity { get; set; } = 40;

        public string Status { get; set; } = "Active";

        public string? Remarks { get; set; }

        [JsonPropertyName("room_no")]
        public string? RoomNo { get; set; }
    }

    public class SectionUpdateDto
    {
        public int Capacity { get; set; } = 40;

        public string Status { get; set; } = "Active";

        public string? Remarks { get; set; }

        [JsonPropertyName("room_no")]
        public string? RoomNo { get; set; }
    }

    public class SubjectMapDto
    {
        [Required]
        [JsonPropertyName("subject_name")]
        public string SubjectName { get; set; } = string.Empty;

        [JsonPropertyName("weekly_periods")]
        public int WeeklyPeriods { get; set; } = 5;
    }

    public class AssignTeacherDto
    {
        [Required]
        [JsonPropertyName("teacher_id")]
        public string TeacherId { get; set; } = string.Empty; // Supports StaffId or EmployeeId

        [Required]
        [JsonPropertyName("role")]
        public string Role { get; set; } = "Subject Teacher"; // "Class Teacher" or "Subject Teacher"

        [JsonPropertyName("subject_name")]
        public string? SubjectName { get; set; }
    }

    public class StudentAllocateDto
    {
        [Required]
        [JsonPropertyName("section_letter")]
        public string SectionLetter { get; set; } = string.Empty;

        [JsonPropertyName("roll_no")]
        public string? RollNo { get; set; }
    }

    public class StudentResponseDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty; // "STD-001" format based on admission_id

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("rollNo")]
        public string? RollNo { get; set; }

        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = string.Empty;

        [JsonPropertyName("dob")]
        public string Dob { get; set; } = string.Empty;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("section")]
        public string Section { get; set; } = string.Empty;

        [JsonPropertyName("fatherName")]
        public string FatherName { get; set; } = string.Empty;

        [JsonPropertyName("fatherPhone")]
        public string FatherPhone { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("avatar")]
        public string? Avatar { get; set; }

        [JsonPropertyName("totalFee")]
        public decimal TotalFee { get; set; }

        [JsonPropertyName("paidFee")]
        public decimal PaidFee { get; set; }

        [JsonPropertyName("dueFee")]
        public decimal DueFee { get; set; }

        [JsonPropertyName("attendancePct")]
        public double AttendancePct { get; set; } = 100.0;

        [JsonPropertyName("gpa")]
        public double Gpa { get; set; } = 4.0;
    }
}
