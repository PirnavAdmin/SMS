namespace SMS.Api.Models;

public class ClassCurriculumSubject
{
    public int ClassId { get; set; }
    public ClassGrade ClassGrade { get; set; } = null!;

    public int SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}