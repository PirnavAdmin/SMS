using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HomeworkResponseDto
    {
        [JsonPropertyName("homeworkId")]
        public int HomeworkId { get; set; }

        [JsonPropertyName("id")]
        public int Id => HomeworkId;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("homeworkTitle")]
        public string HomeworkTitle => Title;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("classRoom")]
        public string ClassRoom => !string.IsNullOrWhiteSpace(ClassName) ? ClassName : "Class 10-A";

        [JsonPropertyName("class")]
        public string Class => ClassRoom;

        [JsonPropertyName("subjectName")]
        public string SubjectName { get; set; } = string.Empty;

        [JsonPropertyName("subject")]
        public string Subject => SubjectName;

        [JsonPropertyName("topic")]
        public string? Topic { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("dueDate")]
        public string DueDate { get; set; } = string.Empty;

        [JsonPropertyName("publishedTo")]
        public string PublishedTo { get; set; } = "Entire Class";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "PUBLISHED";

        [JsonPropertyName("attachmentFileName")]
        public string? AttachmentFileName { get; set; }

        [JsonPropertyName("attachmentUrl")]
        public string? AttachmentUrl { get; set; }

        [JsonPropertyName("teacherName")]
        public string TeacherName { get; set; } = "Jonathan Miller";

        [JsonPropertyName("submissionsCount")]
        public int SubmissionsCount { get; set; } = 24;

        [JsonPropertyName("createdAt")]
        public string CreatedAt { get; set; } = string.Empty;
    }

    public class StudentHomeworkItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("subjectCode")]
        public string SubjectCode { get; set; } = string.Empty;

        [JsonPropertyName("subjectDisplay")]
        public string SubjectDisplay => string.IsNullOrWhiteSpace(SubjectCode) ? Subject : $"{Subject} ({SubjectCode})";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("homeworkDate")]
        public string HomeworkDate { get; set; } = string.Empty;

        [JsonPropertyName("submissionDate")]
        public string SubmissionDate { get; set; } = string.Empty;

        [JsonPropertyName("isClosed")]
        public bool IsClosed { get; set; } = false;
    }

    public class HomeworkDropdownOptionsDto
    {
        [JsonPropertyName("classes")]
        public List<string> Classes { get; set; } = new List<string> { "All Classes", "Class 10-A", "Class 10-B", "Class 9-A", "Class 9-B", "Class 8-A" };

        [JsonPropertyName("subjects")]
        public List<string> Subjects { get; set; } = new List<string> { "All Subjects", "Mathematics", "English", "Physics", "Social Studies", "Chemistry", "Biology" };

        [JsonPropertyName("statuses")]
        public List<string> Statuses { get; set; } = new List<string> { "All Statuses", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED" };

        [JsonPropertyName("academicYears")]
        public List<string> AcademicYears { get; set; } = new List<string> { "2026-27", "2027-28", "2025-26" };
    }

    public class PaginatedHomeworkResultDto
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
        public List<HomeworkResponseDto> Data { get; set; } = new List<HomeworkResponseDto>();
    }
}
