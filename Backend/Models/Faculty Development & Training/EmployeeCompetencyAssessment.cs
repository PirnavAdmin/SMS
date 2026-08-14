using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("employee_competency_assessments")]
    public class EmployeeCompetencyAssessment
    {
        [Key]
        public int AssessmentId { get; set; }

        [Required]
        [MaxLength(200)]
        public string AssessmentName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AssessmentType { get; set; } = "Subject Knowledge Test";

        [Required]
        [MaxLength(100)]
        public string AssessmentCategory { get; set; } = "Knowledge";

        [Required]
        public int TotalMarks { get; set; } = 100;

        [Required]
        public int PassingMarks { get; set; } = 70;

        [Required]
        [MaxLength(100)]
        public string GradingScheme { get; set; } = "Letter Grade (A+, A, B, C, F)";

        public string? Description { get; set; }

        public string? AssessmentInstructions { get; set; }

        // Step 2 details (Schedule & Filters)
        public string? EmployeeTypeFilter { get; set; }
        public string? BranchFilter { get; set; }
        public string? DepartmentFilter { get; set; }
        public string? DesignationFilter { get; set; }

        public DateTime? ScheduledDate { get; set; }

        [MaxLength(20)]
        public string? StartTime { get; set; }

        [MaxLength(20)]
        public string? EndTime { get; set; }

        [MaxLength(100)]
        public string? AssessmentMode { get; set; } = "Offline (Exam Hall)";

        [MaxLength(250)]
        public string? Venue { get; set; }

        [MaxLength(150)]
        public string? MainEvaluator { get; set; }

        [MaxLength(150)]
        public string? CoEvaluator { get; set; }

        public bool NotifyParticipants { get; set; } = true;
        public bool AutoCertificates { get; set; } = true;
        public bool AddToCalendar { get; set; } = true;
        public bool PublishImmediately { get; set; } = true;

        public int CandidatesCount { get; set; } = 0;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property for assigned candidates
        public ICollection<EmployeeAssessmentCandidate> Candidates { get; set; } = new List<EmployeeAssessmentCandidate>();
    }
}
