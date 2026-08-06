using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("class_subject_mappings")]
    public class ClassSubjectMapping
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("class_id")]
        public int ClassId { get; set; }

        [ForeignKey(nameof(ClassId))]
        public ClassGrade ClassGrade { get; set; } = null!;

        [Column("subject_id")]
        public int SubjectId { get; set; }

        [ForeignKey(nameof(SubjectId))]
        public Subject Subject { get; set; } = null!;

        [Column("weekly_periods")]
        public int WeeklyPeriods { get; set; } = 5;
    }
}
