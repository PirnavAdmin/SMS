using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    public class ClassSection
    {
        [Key]
        public int SectionId { get; set; }

        [Required]
        public string SectionName { get; set; } = string.Empty;

        public int ClassId { get; set; }

        [ForeignKey(nameof(ClassId))]
        public ClassGrade ClassGrade { get; set; } = null!;

        public int Capacity { get; set; } = 40;

        public string Status { get; set; } = "Active";

        public string? Remarks { get; set; }
    }
}