namespace SMS.Api.Dtos;

public class QuestionPaperUploadDto
{
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = "Mid-Term Examination 2026";
    public string ClassName { get; set; } = "Class 10";
    public string SectionName { get; set; } = "All Sections";
    public string SubjectName { get; set; } = "Mathematics";
    public string PaperTitle { get; set; } = "final";
    public string PaperCode { get; set; } = "MAT-101";
    public string ExamDate { get; set; } = string.Empty;
    public string Duration { get; set; } = "3 Hours";
    public decimal MaxMarks { get; set; } = 100;
    public string? Instructions { get; set; }
    public string DocumentFileName { get; set; } = "question_paper.pdf";
    public string DocumentSize { get; set; } = "1.5 MB";
    public string PublishStatus { get; set; } = "PUBLISHED";
}
