namespace SMS.Api.Dtos.AcademicManagement
{
    public class DesignationMasterDto
    {
        public int Id { get; set; }
        public string DesignationName { get; set; } = string.Empty;
        public string EmployeeCategory { get; set; } = "Both";
        public string Status { get; set; } = "Active";
    }
}
