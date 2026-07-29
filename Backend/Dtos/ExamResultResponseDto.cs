namespace SMS.Api.Dtos;

public class ExamResultResponseDto
{
    public int ResultId { get; set; }
    public long ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public int StudentId { get; set; }
    public string RollNo { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; }
    public decimal Percentage { get; set; }
    public decimal GPA { get; set; }
    public string FinalGrade { get; set; } = string.Empty;
    public string PassStatus { get; set; } = "Pass";
    public string ResultStatus { get; set; } = "PROCESSED";
}
