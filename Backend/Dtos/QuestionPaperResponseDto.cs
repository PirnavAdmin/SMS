namespace SMS.Api.Dtos;

public class QuestionPaperResponseDto
{
    public int QuestionPaperId { get; set; }
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string PaperTitle { get; set; } = string.Empty;
    public string PaperCode { get; set; } = string.Empty;
    public string ExamDate { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public decimal MaxMarks { get; set; }
    public string? Instructions { get; set; }
    public string DocumentFileName { get; set; } = string.Empty;
    public string DocumentSize { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public string UploadedDate { get; set; } = string.Empty;
    public string PublishStatus { get; set; } = "PUBLISHED";
}
