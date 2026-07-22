using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    public class ClassSection
    {
        [Key]
        public long SectionId { get; set; }

        public long ClassId { get; set; }
        public string SectionName { get; set; } = string.Empty;
        public string? ClassTeacherEmpId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ClassId")]
        public ClassGrade? ClassGrade { get; set; }

        [ForeignKey("ClassTeacherEmpId")]
        public Staff? ClassTeacher { get; set; }
    }
}