using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("parent_student_mappings")]
    public class ParentStudentMapping
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ParentUserId { get; set; }

        [ForeignKey("ParentUserId")]
        public virtual User? ParentUser { get; set; }

        [Required]
        public int StudentId { get; set; }

        [ForeignKey("StudentId")]
        public virtual Student? Student { get; set; }

        [MaxLength(50)]
        public string RelationshipType { get; set; } = "Father"; // "Father", "Mother", "Guardian"

        public bool IsPrimaryContact { get; set; } = true;

        [MaxLength(20)]
        public string Status { get; set; } = "Active"; // "Active", "Inactive"

        public int? BranchId { get; set; }

        public int? AcademicYearId { get; set; }

        [MaxLength(50)]
        public string OnboardingStatus { get; set; } = "Account Ready"; // "Account Ready", "Email Sent", "Email Failed"

        public DateTime? WelcomeEmailSentAt { get; set; }

        [MaxLength(500)]
        public string? EmailFailureReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
