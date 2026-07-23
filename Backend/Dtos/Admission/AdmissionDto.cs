namespace SMS.Api.Dtos.Admission
{
    public class AdmissionDto
    {
        public long AdmissionId { get; set; }

        public string? ApplicationNo { get; set; }

        public string? StudentName { get; set; }

        public DateTime Dob { get; set; }

        public string? Gender { get; set; }

        public string? FatherName { get; set; }

        public string? FatherMobile { get; set; }

        public string? BloodGroup { get; set; }

        public string? Caste { get; set; }


        public string? BranchName { get; set; }

        public string? ClassName { get; set; }


        public string? Status { get; set; }
    }
}