using SMS.Api.Models.AcademicManagement;

namespace SMS.Api.Models;

public class ExamClass
{
    public long ExamId { get; set; }

    public int ClassId { get; set; }

    public ExamMaster Exam { get; set; } = null!;

    public ClassGrade Class { get; set; } = null!;
}