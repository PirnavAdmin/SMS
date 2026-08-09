using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HomeworkCreateDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("homeworkTitle")]
        public string? HomeworkTitleAlias
        {
            get => Title;
            set { if (!string.IsNullOrWhiteSpace(value)) Title = value; }
        }

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = "Class 10-A";

        [JsonPropertyName("classRoom")]
        public string? ClassRoomAlias
        {
            get => ClassName;
            set { if (!string.IsNullOrWhiteSpace(value)) ClassName = value; }
        }

        [JsonPropertyName("class")]
        public string? ClassAlias
        {
            get => ClassName;
            set { if (!string.IsNullOrWhiteSpace(value)) ClassName = value; }
        }

        [JsonPropertyName("subjectName")]
        public string SubjectName { get; set; } = "Mathematics";

        [JsonPropertyName("subject")]
        public string? SubjectAlias
        {
            get => SubjectName;
            set { if (!string.IsNullOrWhiteSpace(value)) SubjectName = value; }
        }

        [JsonPropertyName("topic")]
        public string? Topic { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("dueDate")]
        public string DueDate { get; set; } = "2026-07-22";

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
    }
}
