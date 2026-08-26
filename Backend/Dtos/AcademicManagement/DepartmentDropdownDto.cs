namespace SMS.Api.Dtos.AcademicManagement
{
    public class DepartmentDropdownDto
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? DepartmentCode { get; set; }
        public string? Category { get; set; } = "Teaching";
        public string DisplayText => string.IsNullOrWhiteSpace(DepartmentCode) ? DepartmentName : $"{DepartmentName} ({DepartmentCode})";
    }
}
