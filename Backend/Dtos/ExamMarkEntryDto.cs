namespace SMS.Api.Dtos;

public class ExamMarkEntryDto
{
    public long ExamId { get; set; }
    public string ClassName { get; set; } = "Class 10";
    public string SectionName { get; set; } = "A";
    public int StudentId { get; set; }
    public string RollNo { get; set; } = "1001";
    public string StudentName { get; set; } = "ALEXANDER WRIGHT";
    public string SubjectName { get; set; } = "Mathematics";
    public decimal MaxMarks { get; set; } = 100;
    public decimal MarksObtained { get; set; }
    public string GradePreview { get; set; } = "A+";
    public string? Remarks { get; set; }
    public bool IsLocked { get; set; } = false;
}
