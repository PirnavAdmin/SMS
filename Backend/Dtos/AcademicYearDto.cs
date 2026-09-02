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
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("isCurrentAcademicYear")]
        public bool IsCurrentAcademicYear { get; set; }
    }
}
