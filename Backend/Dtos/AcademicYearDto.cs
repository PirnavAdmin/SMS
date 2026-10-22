using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class AcademicYearDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("academicYearId")]
        public int AcademicYearId { get; set; }

        [JsonPropertyName("academicYear")]
        [MaxLength(20, ErrorMessage = "Academic Session Name cannot exceed 20 characters.")]
        public string AcademicYear { get; set; } = string.Empty;

        [JsonPropertyName("academicYearName")]
        public string AcademicYearNameAlias
        {
            get => AcademicYear;
            set { if (!string.IsNullOrWhiteSpace(value)) AcademicYear = value; }
        }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = string.Empty;

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("description")]
        [MaxLength(150, ErrorMessage = "Description cannot exceed 150 characters.")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isCurrentAcademicYear")]
        public bool IsCurrentAcademicYear { get; set; }
    }
}
