public class Subject
{
    public long SubjectId { get; set; }

    public string SubjectCode { get; set; } = string.Empty;

    public string SubjectName { get; set; } = string.Empty;

    public string CourseCode { get; set; } = string.Empty;

    public bool IsDeleted { get; set; }

    public long CreatedBy { get; set; }

    public DateTime CreatedDate { get; set; }

    public long? ModifiedBy { get; set; }

    public DateTime? ModifiedDate { get; set; }
}