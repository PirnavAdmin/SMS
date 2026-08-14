using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("employee_assessment_candidates")]
    public class EmployeeAssessmentCandidate
    {
        [Key]
        public int CandidateId { get; set; }

        [Required]
        public int AssessmentId { get; set; }

        [ForeignKey(nameof(AssessmentId))]
        public EmployeeCompetencyAssessment Assessment { get; set; } = null!;

        [Required]
        public int StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public Staff Staff { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Assigned"; // "Assigned", "Completed", "Absent"

        public decimal? Score { get; set; }

        [MaxLength(10)]
        public string? Grade { get; set; }

        public string? Remarks { get; set; }

        public bool CertificateIssued { get; set; } = false;

        [MaxLength(100)]
        public string? CertificateNumber { get; set; }

        public DateTime? IssuedDate { get; set; }
    }
}
