using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("teacher_assignments")]
    public class TeacherAssignment
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("class_id")]
        public int ClassId { get; set; }

        [ForeignKey(nameof(ClassId))]
        public ClassGrade ClassGrade { get; set; } = null!;

        [Required]
        [Column("section_letter")]
        public string SectionLetter { get; set; } = string.Empty;

        [Column("subject_id")]
        public int SubjectId { get; set; }

        [ForeignKey(nameof(SubjectId))]
        public Subject Subject { get; set; } = null!;

        [Column("teacher_id")]
        public int TeacherId { get; set; }

        [ForeignKey(nameof(TeacherId))]
        public Staff Teacher { get; set; } = null!;

        [Required]
        [Column("role")]
        public string Role { get; set; } = string.Empty; // "Class Teacher" or "Subject Teacher"

        [Required]
        [Column("status")]
        public string Status { get; set; } = "Active";
    }
}
