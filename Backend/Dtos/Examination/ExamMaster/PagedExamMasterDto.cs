namespace SMS.Api.Dtos.Examination.ExamMaster
{
    public class PagedExamMasterDto
    {
        public IEnumerable<ExamMasterDto> Items { get; set; } =
            new List<ExamMasterDto>();

        public int TotalRecords { get; set; }

        public int PageNumber { get; set; }

        public int PageSize { get; set; }

        public int TotalPages { get; set; }
    }
}