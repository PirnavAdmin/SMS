namespace SMS.Api.Dtos;

public class HomeworkResponseDto
{
    public int HomeworkId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public string? AttachmentFileName { get; set; }
    public string? AttachmentUrl { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int SubmissionsCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
