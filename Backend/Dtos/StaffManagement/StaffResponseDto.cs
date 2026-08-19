using System.Collections.Generic;

namespace SMS.Api.Dtos;

public class StaffResponseDto
{
	public int StaffId { get; set; }
	public string EmployeeId { get; set; } = string.Empty;
	public string EmployeeCategory { get; set; } = "Teaching Staff";
	public string FirstName { get; set; } = string.Empty;
	public string? MiddleName { get; set; }
	public string LastName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
	public string? Phone { get; set; }
	public string? AlternateMobile { get; set; }
	public string? Gender { get; set; }
	public string? DateOfBirth { get; set; }
	public string? BloodGroup { get; set; }
	public string? ResidentialAddress { get; set; }

	// Identity Details
	public string? AadhaarNumber { get; set; }
	public string? PanNumber { get; set; }

	// Address Details
	public string? PresentAddress { get; set; }
	public string? PermanentAddress { get; set; }
	public string? City { get; set; }
	public string? State { get; set; }
	public string? PinCode { get; set; }

	public string Designation { get; set; } = string.Empty;
	public string Department { get; set; } = string.Empty;
	public string? SystemRole { get; set; }
	public string? JoiningDate { get; set; }
	public string? Qualification { get; set; }
	public string? EmploymentType { get; set; }
	public string? ReportingManager { get; set; }
	public string? AcademicYear { get; set; }
	public bool? IsClassTeacherEligible { get; set; }

	public string? PrimarySubject { get; set; }
	public string? Specialization { get; set; }
	public decimal MonthlySalary { get; set; }
	public string? AccountHolderName { get; set; }
	public string? AccountNumber { get; set; }
	public string? BankName { get; set; }
	public string? BranchName { get; set; }
	public string? IfscCode { get; set; }
	public string? UpiId { get; set; }
	public bool IsActive { get; set; }

	// Sub-collections
	public List<StaffQualificationDto> Qualifications { get; set; } = new();
	public List<StaffExperienceDto> ExperienceRecords { get; set; } = new();
	public List<StaffDocumentDto> Documents { get; set; } = new();

	public List<string> AssignedClasses { get; set; } = new();
	public List<string> AssignedSubjects { get; set; } = new();
}
