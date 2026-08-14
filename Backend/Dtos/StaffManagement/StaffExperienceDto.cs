namespace SMS.Api.Dtos.StaffManagement;

public class StaffExperienceDto
{
    public int Id { get; set; }
    public string? PreviousOrganization { get; set; }
    public string? DesignationHeld { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
    public string? TotalExperience { get; set; }
    public string? ReasonForLeaving { get; set; }
}

