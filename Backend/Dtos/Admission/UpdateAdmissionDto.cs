using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Admission
{
    public class UpdateAdmissionDto
    {
        [Required]
        public string StudentName { get; set; } = string.Empty;

        public DateTime? Dob { get; set; }

        public string? Gender { get; set; }

        public string? FatherName { get; set; }

        public string? FatherMobile { get; set; }

        public string? BloodGroup { get; set; }

        public string? Caste { get; set; }

        [Required]
        public long BranchId { get; set; }

        [Required]
        public long ClassId { get; set; }

        public string? AdmissionType { get; set; }
    }
}