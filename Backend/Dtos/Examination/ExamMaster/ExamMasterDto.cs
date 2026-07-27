namespace SMS.Api.Dtos.Examination.ExamMaster
{
    public class ExamMasterDto
    {
        public long ExamId { get; set; }

        public string ExamTitle { get; set; } = string.Empty;

        public string ExamType { get; set; } = string.Empty;

        public string ExamStatus { get; set; } = string.Empty;

        public long BranchId { get; set; }

        public long AcademicYearId { get; set; }

        public DateOnly StartDate { get; set; }

        public DateOnly EndDate { get; set; }

        public List<long> ClassIds { get; set; } = [];

        public List<ExamClassDto> ApplicableClasses { get; set; } = [];

        public int ApplicableClassCount { get; set; }

        public int ScheduledSubjectCount { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}