namespace SMS.Api.Dtos.AcademicManagement
{
    using System.ComponentModel.DataAnnotations;

    public class CreateDesignationMasterDto
    {
        [Required(ErrorMessage = "Designation name is required.")]
        [MaxLength(150)]
        public string DesignationName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Employee category is required.")]
        [MaxLength(50)]
        public string EmployeeCategory { get; set; } = "Both";

        [Required(ErrorMessage = "Status is required.")]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";
    }
}
