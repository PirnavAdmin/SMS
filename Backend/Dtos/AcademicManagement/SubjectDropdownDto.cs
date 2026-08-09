namespace SMS.Api.Dtos.AcademicManagement
{
    public class SubjectDropdownDto
    {
        public int SubjectId { get; set; }
        public string SubjectCode { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DisplayText => $"{SubjectCode} - {SubjectName}".Trim(' ', '-');
    }
}
