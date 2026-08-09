using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class SchoolEventDto
    {
        [JsonPropertyName("eventId")]
        public int EventId { get; set; }

        [JsonPropertyName("id")]
        public int Id => EventId;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("eventName")]
        public string EventName => Title;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Sports Day";

        [JsonPropertyName("tag")]
        public string Tag => "SCHOOL EVENT";

        [JsonPropertyName("venue")]
        public string Venue { get; set; } = string.Empty;

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date => StartDate;

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = string.Empty;

        [JsonPropertyName("time")]
        public string Time { get; set; } = "08:30 AM";

        [JsonPropertyName("timeSlot")]
        public string TimeSlot => !string.IsNullOrWhiteSpace(Time) ? Time : "08:30 AM - 04:30 PM";

        [JsonPropertyName("organizer")]
        public string Organizer { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Published";

        [JsonPropertyName("applicableBranch")]
        public string ApplicableBranch { get; set; } = "Main Campus";
    }

    public class CreateSchoolEventDto
    {
        [Required(ErrorMessage = "Event Title is required.")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("eventName")]
        public string? EventNameAlias
        {
            get => Title;
            set { if (!string.IsNullOrWhiteSpace(value)) Title = value; }
        }

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Sports Day";

        [JsonPropertyName("venue")]
        public string Venue { get; set; } = "Main Campus Stadium Ground";

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = "2026-08-15";

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = "2026-08-15";

        [JsonPropertyName("time")]
        public string Time { get; set; } = "08:30 AM - 04:30 PM";

        [JsonPropertyName("organizer")]
        public string Organizer { get; set; } = "Physical Education Dept";

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Published";
    }

    public class PaginatedSchoolEventResultDto
    {
        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }

        [JsonPropertyName("totalEntries")]
        public int TotalEntries => TotalCount;

        [JsonPropertyName("page")]
        public int Page { get; set; } = 1;

        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; } = 10;

        [JsonPropertyName("totalPages")]
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 10));

        [JsonPropertyName("data")]
        public List<SchoolEventDto> Data { get; set; } = new List<SchoolEventDto>();
    }
}
