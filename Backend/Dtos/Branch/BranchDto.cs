namespace SMS.Api.Dtos.Branch
{

    public class BranchDto
    {
        public long BranchId { get; set; }

        public string BranchName { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string State { get; set; } = string.Empty;

        public string Pincode { get; set; } = string.Empty;

        public string ContactNumber { get; set; } = string.Empty;

        public string? Email { get; set; }

        public bool Status { get; set; }

        public DateTime CreatedDate { get; set; }
    }
}