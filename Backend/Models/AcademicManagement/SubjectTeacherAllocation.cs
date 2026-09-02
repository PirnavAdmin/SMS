using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.AcademicManagement
{
    [Table("subject_teacher_allocations")]
    public class SubjectTeacherAllocation
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = string.Empty;

        [Column("class_name")]
        public string ClassName { get; set; } = string.Empty;

        [Column("section")]
        public string Section { get; set; } = string.Empty;

        [Column("subject_name")]
        public string? SubjectName { get; set; }

        [Column("teacher_name")]
        public string TeacherName { get; set; } = string.Empty;

        [Column("role")]
        public string Role { get; set; } = "Subject Teacher";

        [Column("status")]
        public string Status { get; set; } = "Active";
    }
}
