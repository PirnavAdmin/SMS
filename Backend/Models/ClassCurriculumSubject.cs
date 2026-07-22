using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    public class ClassCurriculumSubject
    {
        public long ClassId { get; set; }
        public string SubjectId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ClassId")]
        public ClassGrade? ClassGrade { get; set; }

        [ForeignKey("SubjectId")]
        public Subject? Subject { get; set; }
    }
}