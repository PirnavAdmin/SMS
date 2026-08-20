using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("faculty_training_participations")]
    public class FacultyTrainingParticipation
    {
        [Key]
        public int ParticipationId { get; set; }

        [Required]
        public int WorkshopId { get; set; }

        [ForeignKey(nameof(WorkshopId))]
        public FacultyWorkshop Workshop { get; set; } = null!;

        [Required]
        public int StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public Staff Staff { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string RegistrationStatus { get; set; } = "Registered"; // "Registered", "Attended", "Absent"

        public decimal? AssessmentScore { get; set; }

        public bool CertificateIssued { get; set; } = false;

        [MaxLength(100)]
        public string? CertificateNumber { get; set; }

        public DateTime? IssuedDate { get; set; }
    }
}
