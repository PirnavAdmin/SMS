using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Examination.ExamMaster
{
    public class UpdateExamMasterDto
    {
        [Required(ErrorMessage = "Examination title is required.")]
        [StringLength(150)]
        public string ExamTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Exam type is required.")]
        [StringLength(50)]
        public string ExamType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Exam status is required.")]
        [StringLength(30)]
        public string ExamStatus { get; set; } = "Scheduled";

        [Range(1, long.MaxValue)]
        public long BranchId { get; set; }

        [Range(1, long.MaxValue)]
        public long AcademicYearId { get; set; }

        [Required]
        public DateOnly StartDate { get; set; }

        [Required]
        public DateOnly EndDate { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Select at least one class.")]
        public List<int> ClassIds { get; set; } = [];
    }
}