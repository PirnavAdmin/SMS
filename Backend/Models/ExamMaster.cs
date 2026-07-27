namespace SMS.Api.Models
{
    public class ExamMaster
    {
        public long ExamId { get; set; }

        public string ExamTitle { get; set; } = string.Empty;

        public string ExamType { get; set; } = string.Empty;

        public string ExamStatus { get; set; } = "Scheduled";

        public long BranchId { get; set; }

        public long AcademicYearId { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public bool IsDeleted { get; set; }

        public long? CreatedBy { get; set; }

        public long? UpdatedBy { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public ICollection<ExamClass> ExamClasses { get; set; } =
            new List<ExamClass>();
    }
}