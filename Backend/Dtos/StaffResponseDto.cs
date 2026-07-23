namespace SMS.Api.Dtos;

public class StaffResponseDto
{
	public int StaffId { get; set; }
	public string EmployeeId { get; set; } = string.Empty;
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string? Phone { get; set; }
	public string Designation { get; set; } = string.Empty;
	public string Department { get; set; } = string.Empty;
	public decimal MonthlySalary { get; set; }
	public string? DateOfBirth { get; set; }
	public bool IsActive { get; set; }
}