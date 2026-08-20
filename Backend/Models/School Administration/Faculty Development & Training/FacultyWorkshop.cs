using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("faculty_workshops")]
    public class FacultyWorkshop
    {
        [Key]
        public int WorkshopId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(100)]
        public string? TrainerName { get; set; }

        [MaxLength(150)]
        public string? Organization { get; set; }

        [MaxLength(100)]
        public string? Venue { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [MaxLength(20)]
        public string StartTime { get; set; } = "10:00 AM";

        [MaxLength(20)]
        public string EndTime { get; set; } = "04:00 PM";

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = "Pedagogy";

        [MaxLength(100)]
        public string? TargetRoleType { get; set; }

        [MaxLength(100)]
        public string? Branch { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Scheduled";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<FacultyTrainingParticipation> Participants { get; set; } = new List<FacultyTrainingParticipation>();
    }
}
