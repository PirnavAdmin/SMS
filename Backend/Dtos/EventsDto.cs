using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class EventCategoryLegendDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("color")]
        public string Color { get; set; } = string.Empty;
    }

    public class EventsOptionsDto
    {
        [JsonPropertyName("academicYears")]
        public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };

        [JsonPropertyName("holidayTypes")]
        public List<string> HolidayTypes { get; set; } = new List<string> { "All Types", "National", "Gazetted", "Festival", "Vacation", "Optional" };

        [JsonPropertyName("categories")]
        public List<EventCategoryLegendDto> Categories { get; set; } = new List<EventCategoryLegendDto>
        {
            new EventCategoryLegendDto { Name = "Holiday", Color = "#10b981" },
            new EventCategoryLegendDto { Name = "Event", Color = "#3b82f6" },
            new EventCategoryLegendDto { Name = "Exam", Color = "#ef4444" },
            new EventCategoryLegendDto { Name = "PTM / Meeting", Color = "#f97316" },
            new EventCategoryLegendDto { Name = "Birthday", Color = "#eab308" }
        };
    }

    public class CalendarEventDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Holiday";

        [JsonPropertyName("color")]
        public string Color { get; set; } = "#06b6d4";

        [JsonPropertyName("isGazettedHoliday")]
        public bool IsGazettedHoliday { get; set; } = false;
    }

    public class UpcomingEventAgendaDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("tag")]
        public string Tag { get; set; } = "SCHOOL EVENT";

        [JsonPropertyName("source")]
        public string Source { get; set; } = "School Events Module";

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("timeSlot")]
        public string TimeSlot { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Event";

        [JsonPropertyName("venue")]
        public string Venue { get; set; } = string.Empty;
    }

    public class SchoolHolidayDto
    {
        [JsonPropertyName("holidayId")]
        public int HolidayId { get; set; }

        [JsonPropertyName("id")]
        public int Id
        {
            get => HolidayId;
            set => HolidayId = value;
        }

        [JsonPropertyName("holidayName")]
        public string HolidayName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name
        {
            get => HolidayName;
            set => HolidayName = value;
        }

        [JsonPropertyName("title")]
        public string Title
        {
            get => HolidayName;
            set => HolidayName = value;
        }

        [JsonPropertyName("holidayType")]
        public string HolidayType { get; set; } = "GAZETTED";

        [JsonPropertyName("type")]
        public string Type
        {
            get => HolidayType;
            set => HolidayType = value;
        }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = string.Empty;

        [JsonPropertyName("fromDate")]
        public string FromDate
        {
            get => StartDate;
            set => StartDate = value;
        }

        [JsonPropertyName("date")]
        public string Date
        {
            get => StartDate;
            set => StartDate = value;
        }

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = string.Empty;

        [JsonPropertyName("toDate")]
        public string ToDate
        {
            get => EndDate;
            set => EndDate = value;
        }

        [JsonPropertyName("duration")]
        public string Duration { get; set; } = "1 Day";

        [JsonPropertyName("dayOfWeek")]
        public string DayOfWeek { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public class CreateHolidayDto
    {
        [Required(ErrorMessage = "Holiday Name is required.")]
        [JsonPropertyName("holidayName")]
        public string HolidayName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? NameAlias
        {
            get => HolidayName;
            set { if (!string.IsNullOrWhiteSpace(value)) HolidayName = value; }
        }

        [JsonPropertyName("title")]
        public string? TitleAlias
        {
            get => HolidayName;
            set { if (!string.IsNullOrWhiteSpace(value)) HolidayName = value; }
        }

        [JsonPropertyName("holidayType")]
        public string HolidayType { get; set; } = "National Holiday";

        [JsonPropertyName("type")]
        public string? TypeAlias
        {
            get => HolidayType;
            set { if (!string.IsNullOrWhiteSpace(value)) HolidayType = value; }
        }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } = "2026-08-09";

        [JsonPropertyName("fromDate")]
        public string? FromDateAlias
        {
            get => StartDate;
            set { if (!string.IsNullOrWhiteSpace(value)) StartDate = value; }
        }

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; } = "2026-08-09";

        [JsonPropertyName("toDate")]
        public string? ToDateAlias
        {
            get => EndDate;
            set { if (!string.IsNullOrWhiteSpace(value)) EndDate = value; }
        }

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    public class HolidayDashboardMetricsDto
    {
        [JsonPropertyName("totalHolidays")]
        public int TotalHolidays { get; set; } = 20;

        [JsonPropertyName("nationalHolidays")]
        public int NationalHolidays { get; set; } = 4;

        [JsonPropertyName("gazettedHolidays")]
        public int GazettedHolidays { get; set; } = 8;

        [JsonPropertyName("festivalsBreaks")]
        public int FestivalsBreaks { get; set; } = 8;
    }

    public class PaginatedHolidayResultDto
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

        [JsonPropertyName("metrics")]
        public HolidayDashboardMetricsDto Metrics { get; set; } = new HolidayDashboardMetricsDto();

        [JsonPropertyName("data")]
        public List<SchoolHolidayDto> Data { get; set; } = new List<SchoolHolidayDto>();
    }
}
