namespace SMS.Api.Dtos.Subject
{
    public class SubjectDto
    {
        public long SubjectId { get; set; }

        public string SubjectCode { get; set; } = string.Empty;

        public string SubjectName { get; set; } = string.Empty;

        public string CourseCode { get; set; } = string.Empty;

        public long BranchId { get; set; }

        public bool Status { get; set; }
    }
}