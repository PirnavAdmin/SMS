namespace SMS.Api.Dtos.Academic;

public class TeacherLookupDto
{
    public long StaffId { get; set; }

    public string EmployeeCode { get; set; } = string.Empty;

    public string TeacherName { get; set; } = string.Empty;

    public string? Designation { get; set; }

    public string? Specialization { get; set; }
}