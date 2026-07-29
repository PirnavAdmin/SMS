namespace SMS.Api.Dtos;

public class BirthdayRadarDto
{
    public string PersonName { get; set; } = string.Empty;
    public string PersonType { get; set; } = "Student";
    public string ClassOrDepartment { get; set; } = "Class 10-A";
    public string DateOfBirth { get; set; } = string.Empty;
    public bool IsToday { get; set; } = true;
}
