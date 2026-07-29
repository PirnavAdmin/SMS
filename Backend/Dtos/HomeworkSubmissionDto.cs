namespace SMS.Api.Dtos;

public class HomeworkSubmissionDto
{
    public int SubmissionId { get; set; }
    public int HomeworkId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string SubmissionDate { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string Status { get; set; } = "Submitted";
    public decimal? MarksObtained { get; set; }
    public string? Feedback { get; set; }
}
