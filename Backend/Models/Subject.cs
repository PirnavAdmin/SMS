using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models
{
    public class Subject
    {
        [Key]
        public string SubjectId { get; set; } = string.Empty;

        public string SubjectName { get; set; } = string.Empty;
        public string? CourseCode { get; set; }
        public bool Status { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ClassCurriculumSubject> ClassCurriculumSubjects { get; set; } = new List<ClassCurriculumSubject>();
    }
}