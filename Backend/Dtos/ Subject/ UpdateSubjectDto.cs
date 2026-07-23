using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Subject
{
    public class UpdateSubjectDto
    {
        [Required]
        public string SubjectCode { get; set; } = string.Empty;

        [Required]
        public string SubjectName { get; set; } = string.Empty;

        [Required]
        public string CourseCode { get; set; } = string.Empty;

        [Required]
        public long BranchId { get; set; }

        public bool Status { get; set; }
    }
}