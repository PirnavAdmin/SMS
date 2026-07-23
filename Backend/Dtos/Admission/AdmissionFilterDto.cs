namespace SMS.Api.Dtos.Admission
{
    public class AdmissionFilterDto
    {

        public string? Search { get; set; }


        public long? BranchId { get; set; }


        public long? ClassId { get; set; }


        public string? Status { get; set; }


        public int PageNumber { get; set; } = 1;


        public int PageSize { get; set; } = 10;

    }
}