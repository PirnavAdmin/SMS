namespace SMS.Api.Dtos
{
	public record CreateSubjectDto(string SubjectId, string SubjectName, string? CourseCode);
	public record UpdateSubjectDto(string SubjectName, string? CourseCode);

	public record SectionInputDto(string SectionName, string? ClassTeacherEmpId);
	public record CreateClassDto(string ClassName, long? BranchId, List<SectionInputDto>? Sections, List<string>? SubjectIds);

	public record RegisterStaffDto(
		string EmpId, string FirstName, string LastName, string Email,
		string? Phone, string Designation, string Department, decimal MonthlySalary, DateTime? DateOfBirth
	);

	public record CreateAdmissionDto(
		string ApplicantFullName, string AppliedClass, string Gender, DateTime Dob,
		string BloodGroup, string? Religion, string CasteCategory, string FatherFullName,
		string? MotherFullName, string FatherMobileNo, string? HouseNo, string? Street,
		string? AreaLocality, string? City, string? District, string? State, string? PinCode,
		int NumberOfSiblings, string? SiblingStudentId, string StudentType, bool TransportRequired,
		string? TransportType, string? BusRoute, string? PickupPoint, string? DropPoint,
		string? HostelBlock, string? FloorLevel, string? AllocatedBedId
	);

	public record UpdateStatusDto(string Status);
}