namespace SMS.Api.Dtos.AcademicManagement
{
    using System.ComponentModel.DataAnnotations;

    public class CreateDepartmentDto
    {
        [Required(ErrorMessage = "Department name is required.")]
        [MaxLength(150)]
        public string DepartmentName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? DepartmentCode { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";

        [MaxLength(150)]
        public string? HeadOfDepartment { get; set; }

        [MaxLength(50)]
        public string? Category { get; set; } = "Teaching";
    }
}
