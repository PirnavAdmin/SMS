namespace SMS.Api.Services.Implementations;

using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class SchoolService : ISchoolService
{
	private readonly ISchoolRepository _schoolRepository;
	private readonly Data.AppDbContext _context;

	public SchoolService(ISchoolRepository schoolRepository, Data.AppDbContext context)
	{
		_schoolRepository = schoolRepository;
		_context = context;
	}

	// --- STAFF ---
	public async Task<List<StaffResponseDto>> GetAllStaffAsync(string? search, string? department)
	{
		var list = await _schoolRepository.GetAllStaffAsync(search, department);
		return list.Select(s => MapToStaffResponseDto(s)).ToList();
	}

	public async Task<StaffResponseDto> GetStaffByIdAsync(int id)
	{
		var staff = await _schoolRepository.GetStaffByIdAsync(id)
			?? throw new NotFoundException($"Staff member with ID '{id}' not found.");
		return MapToStaffResponseDto(staff);
	}

	public async Task<List<StaffDropdownDto>> GetTeachersForDropdownAsync(string? search)
	{
		var list = await _schoolRepository.GetTeachersForDropdownAsync(search);
		return list.Select(s => new StaffDropdownDto
		{
			StaffId = s.StaffId,
			EmployeeId = s.EmployeeId,
			FullName = $"{s.FirstName} {s.LastName}",
			Designation = s.Designation
		}).ToList();
	}

	public async Task<StaffResponseDto> CreateStaffAsync(StaffCreateDto dto)
	{
		var staff = new Staff
		{
			EmployeeId = $"EMP{new Random().Next(100, 999)}",
			FirstName = dto.FirstName,
			LastName = dto.LastName,
			Email = dto.Email,
			Phone = dto.Phone,
			Designation = dto.Designation,
			Department = dto.Department,
			MonthlySalary = dto.MonthlySalary,
			IsActive = true
		};

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) staff.DateOfBirth = parsedDob;

		await _schoolRepository.AddStaffAsync(staff);
		await _schoolRepository.SaveChangesAsync();
		return MapToStaffResponseDto(staff);
	}

	public async Task<StaffResponseDto> UpdateStaffAsync(int id, StaffCreateDto dto)
	{
		var staff = await _schoolRepository.GetStaffByIdAsync(id)
			?? throw new NotFoundException($"Staff member with ID '{id}' not found.");

		staff.FirstName = dto.FirstName;
		staff.LastName = dto.LastName;
		staff.Email = dto.Email;
		staff.Phone = dto.Phone;
		staff.Designation = dto.Designation;
		staff.Department = dto.Department;
		staff.MonthlySalary = dto.MonthlySalary;

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) staff.DateOfBirth = parsedDob;

		await _schoolRepository.SaveChangesAsync();
		return MapToStaffResponseDto(staff);
	}

	public async Task<bool> DeleteStaffAsync(int id)
	{
		var staff = await _schoolRepository.GetStaffByIdAsync(id)
			?? throw new NotFoundException($"Staff member with ID '{id}' not found.");
		_schoolRepository.RemoveStaff(staff);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	private static StaffResponseDto MapToStaffResponseDto(Staff s) => new()
	{
		StaffId = s.StaffId,
		EmployeeId = s.EmployeeId,
		FirstName = s.FirstName,
		LastName = s.LastName,
		Email = s.Email,
		Phone = s.Phone,
		Designation = s.Designation,
		Department = s.Department,
		MonthlySalary = s.MonthlySalary,
		DateOfBirth = s.DateOfBirth?.ToString("yyyy-MM-dd"),
		IsActive = s.IsActive
	};

	// --- DEPARTMENTS ---
	public async Task<List<DepartmentDto>> GetAllDepartmentsAsync(string? search)
	{
		var list = await _schoolRepository.GetAllDepartmentsAsync(search);
		return list.Select(MapToDepartmentDto).ToList();
	}

	public async Task<DepartmentDto> GetDepartmentByIdAsync(int id)
	{
		var dept = await _schoolRepository.GetDepartmentByIdAsync(id)
			?? throw new NotFoundException($"Department with ID '{id}' not found.");
		return MapToDepartmentDto(dept);
	}

	public async Task<DepartmentDto> GetDepartmentByIdAsync(string idOrCode)
	{
		var dept = await _schoolRepository.GetDepartmentByIdOrCodeAsync(idOrCode)
			?? throw new NotFoundException($"Department '{idOrCode}' not found.");
		return MapToDepartmentDto(dept);
	}

	public async Task<List<DepartmentDropdownDto>> GetActiveDepartmentsDropdownAsync(string? search)
	{
		var list = await _schoolRepository.GetActiveDepartmentsDropdownAsync(search);
		return list.Select(d => new DepartmentDropdownDto
		{
			DepartmentId = d.DepartmentId,
			DepartmentName = d.DepartmentName,
			DepartmentCode = d.DepartmentCode
		}).ToList();
	}

	public async Task<List<SubjectDto>> GetSubjectsByDepartmentIdAsync(int departmentId)
	{
		var dept = await _schoolRepository.GetDepartmentByIdAsync(departmentId)
			?? throw new NotFoundException($"Department with ID '{departmentId}' not found.");

		var subjects = await _schoolRepository.GetSubjectsByDepartmentIdAsync(departmentId);
		return subjects.Select(MapToSubjectDto).ToList();
	}

	public async Task<List<SubjectDto>> GetSubjectsByDepartmentIdAsync(string idOrCode)
	{
		var dept = await _schoolRepository.GetDepartmentByIdOrCodeAsync(idOrCode)
			?? throw new NotFoundException($"Department '{idOrCode}' not found.");

		var subjects = await _schoolRepository.GetSubjectsByDepartmentIdAsync(dept.DepartmentId);
		return subjects.Select(MapToSubjectDto).ToList();
	}

	public async Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto)
	{
		if (string.IsNullOrWhiteSpace(dto.DepartmentName))
			throw new InvalidOperationException("Department name is required.");

		var dept = new Department
		{
			DepartmentName = dto.DepartmentName.Trim(),
			DepartmentCode = dto.DepartmentCode?.Trim(),
			Description = dto.Description?.Trim(),
			Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim(),
			CreatedDate = System.DateTime.UtcNow
		};

		await _schoolRepository.AddDepartmentAsync(dept);
		await _schoolRepository.SaveChangesAsync();
		return MapToDepartmentDto(dept);
	}

	public async Task<DepartmentDto> UpdateDepartmentAsync(int id, CreateDepartmentDto dto)
	{
		var dept = await _schoolRepository.GetDepartmentByIdAsync(id)
			?? throw new NotFoundException($"Department with ID '{id}' not found.");

		if (string.IsNullOrWhiteSpace(dto.DepartmentName))
			throw new InvalidOperationException("Department name is required.");

		dept.DepartmentName = dto.DepartmentName.Trim();
		dept.DepartmentCode = dto.DepartmentCode?.Trim();
		dept.Description = dto.Description?.Trim();
		dept.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();

		await _schoolRepository.SaveChangesAsync();
		return MapToDepartmentDto(dept);
	}

	public async Task<DepartmentDto> UpdateDepartmentAsync(string idOrCode, CreateDepartmentDto dto)
	{
		var dept = await _schoolRepository.GetDepartmentByIdOrCodeAsync(idOrCode)
			?? throw new NotFoundException($"Department '{idOrCode}' not found.");

		if (string.IsNullOrWhiteSpace(dto.DepartmentName))
			throw new InvalidOperationException("Department name is required.");

		dept.DepartmentName = dto.DepartmentName.Trim();
		dept.DepartmentCode = dto.DepartmentCode?.Trim();
		dept.Description = dto.Description?.Trim();
		dept.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status.Trim();

		await _schoolRepository.SaveChangesAsync();
		return MapToDepartmentDto(dept);
	}

	public async Task<bool> DeleteDepartmentAsync(int id)
	{
		var dept = await _schoolRepository.GetDepartmentByIdAsync(id)
			?? throw new NotFoundException($"Department with ID '{id}' not found.");

		bool hasSubjects = await _schoolRepository.DepartmentHasSubjectsAsync(id);
		if (hasSubjects)
		{
			throw new InvalidOperationException("Cannot delete department because subjects are currently assigned to it. Move or delete its subjects first.");
		}

		_schoolRepository.RemoveDepartment(dept);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteDepartmentAsync(string idOrCode)
	{
		var dept = await _schoolRepository.GetDepartmentByIdOrCodeAsync(idOrCode)
			?? throw new NotFoundException($"Department '{idOrCode}' not found.");

		bool hasSubjects = await _schoolRepository.DepartmentHasSubjectsAsync(dept.DepartmentId);
		if (hasSubjects)
		{
			throw new InvalidOperationException("Cannot delete department because subjects are currently assigned to it. Move or delete its subjects first.");
		}

		_schoolRepository.RemoveDepartment(dept);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	private static DepartmentDto MapToDepartmentDto(Department d) => new()
	{
		DepartmentId = d.DepartmentId,
		DepartmentName = d.DepartmentName,
		DepartmentCode = d.DepartmentCode,
		Description = d.Description,
		Status = d.Status,
		CreatedDate = d.CreatedDate,
		NumberOfSubjects = d.Subjects?.Count ?? 0
	};

	// --- SUBJECTS ---
	public async Task<List<SubjectDto>> GetAllSubjectsAsync(string? search)
	{
		var list = await _schoolRepository.GetAllSubjectsAsync(search);
		return list.Select(s => MapToSubjectDto(s)).ToList();
	}

	public async Task<SubjectDto> GetSubjectByIdAsync(int id)
	{
		var subject = await _schoolRepository.GetSubjectByIdAsync(id)
			?? throw new NotFoundException($"Subject with ID '{id}' not found.");
		return MapToSubjectDto(subject);
	}

	public async Task<List<SubjectDropdownDto>> GetSubjectsDropdownAsync(string? search)
	{
		var list = await _schoolRepository.GetAllSubjectsAsync(search);
		return list.Select(s => new SubjectDropdownDto
		{
			SubjectId = s.SubjectId,
			SubjectCode = s.SubjectCode,
			SubjectName = s.SubjectName,
			DepartmentId = s.DepartmentId,
			DepartmentName = s.Department?.DepartmentName ?? string.Empty
		}).ToList();
	}

	public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto)
	{
		if (dto.DepartmentId <= 0)
		{
			var activeDepts = await _schoolRepository.GetActiveDepartmentsDropdownAsync(null);
			if (activeDepts.Count > 0)
			{
				dto.DepartmentId = activeDepts[0].DepartmentId;
			}
			else
			{
				var defaultDept = new Department 
				{ 
					DepartmentName = "General", 
					DepartmentCode = "DEPT-GEN", 
					Description = "General Academic Department", 
					Status = "Active",
					CreatedDate = System.DateTime.UtcNow
				};
				await _schoolRepository.AddDepartmentAsync(defaultDept);
				await _schoolRepository.SaveChangesAsync();
				dto.DepartmentId = defaultDept.DepartmentId;
			}
		}

		var dept = await _schoolRepository.GetDepartmentByIdAsync(dto.DepartmentId)
			?? throw new InvalidOperationException($"Department with ID '{dto.DepartmentId}' does not exist.");

		if (dept.Status != "Active")
			throw new InvalidOperationException("Subjects can only be assigned to active departments.");

		string effectiveCode = string.IsNullOrWhiteSpace(dto.SubjectCode)
			? (string.IsNullOrWhiteSpace(dto.CourseCode) ? dto.SubjectName : dto.CourseCode)
			: dto.SubjectCode;

		var subject = new Subject
		{
			SubjectCode = effectiveCode,
			SubjectName = dto.SubjectName.Trim(),
			CourseCode = dto.CourseCode?.Trim() ?? string.Empty,
			DepartmentId = dto.DepartmentId
		};

		await _schoolRepository.AddSubjectAsync(subject);
		await _schoolRepository.SaveChangesAsync();

		var createdSubject = await _schoolRepository.GetSubjectByIdAsync(subject.SubjectId);
		return MapToSubjectDto(createdSubject ?? subject);
	}

	public async Task<SubjectDto> UpdateSubjectAsync(int id, CreateSubjectDto dto)
	{
		var subject = await _schoolRepository.GetSubjectByIdAsync(id)
			?? throw new NotFoundException($"Subject with ID '{id}' not found.");

		if (dto.DepartmentId <= 0)
		{
			dto.DepartmentId = subject.DepartmentId;
		}

		var dept = await _schoolRepository.GetDepartmentByIdAsync(dto.DepartmentId)
			?? throw new InvalidOperationException($"Department with ID '{dto.DepartmentId}' does not exist.");

		if (dept.Status != "Active")
			throw new InvalidOperationException("Subjects can only be assigned to active departments.");

		string effectiveCode = string.IsNullOrWhiteSpace(dto.SubjectCode)
			? (string.IsNullOrWhiteSpace(dto.CourseCode) ? dto.SubjectName : dto.CourseCode)
			: dto.SubjectCode;

		subject.SubjectCode = effectiveCode;
		subject.SubjectName = dto.SubjectName.Trim();
		subject.CourseCode = dto.CourseCode?.Trim() ?? string.Empty;
		subject.DepartmentId = dto.DepartmentId;

		await _schoolRepository.SaveChangesAsync();

		var updatedSubject = await _schoolRepository.GetSubjectByIdAsync(subject.SubjectId);
		return MapToSubjectDto(updatedSubject ?? subject);
	}

	public async Task<bool> DeleteSubjectAsync(int id)
	{
		var subject = await _schoolRepository.GetSubjectByIdAsync(id)
			?? throw new NotFoundException($"Subject with ID '{id}' not found.");

		_schoolRepository.RemoveSubject(subject);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	private static SubjectDto MapToSubjectDto(Subject s) => new()
	{
		SubjectId = s.SubjectId,
		SubjectCode = s.SubjectCode,
		SubjectName = s.SubjectName,
		CourseCode = s.CourseCode,
		DepartmentId = s.DepartmentId,
		DepartmentName = s.Department?.DepartmentName ?? string.Empty,
		DepartmentCode = s.Department?.DepartmentCode
	};

	// --- ACADEMIC CLASSES ---
	public async Task<List<ClassGradeResponseDto>> GetAllClassesAsync()
	{
		var classes = await _schoolRepository.GetAllClassGradesAsync();
		return classes.Select(c => MapToClassGradeResponseDto(c)).ToList();
	}

	public async Task<ClassGradeResponseDto> GetClassByIdAsync(int id)
	{
		var cls = await _schoolRepository.GetClassGradeByIdAsync(id)
			?? throw new NotFoundException($"Class Grade with ID '{id}' not found.");
		return MapToClassGradeResponseDto(cls);
	}

	public async Task<bool> CreateClassGradeAsync(CreateClassGradeDto dto)
	{
		var newClass = new ClassGrade { ClassName = dto.ClassName };
		await _schoolRepository.AddClassGradeAsync(newClass);
		await _schoolRepository.SaveChangesAsync();

		if (dto.SubjectIds != null && dto.SubjectIds.Any())
		{
			foreach (var subId in dto.SubjectIds)
			{
				newClass.CurriculumSubjects.Add(new ClassCurriculumSubject
				{
					ClassId = newClass.ClassId,
					SubjectId = subId
				});
			}
		}

		if (dto.Sections != null && dto.Sections.Any())
		{
			foreach (var secDto in dto.Sections)
			{
				newClass.Sections.Add(new ClassSection
				{
					ClassId = newClass.ClassId,
					SectionName = secDto.SectionName,
					ClassTeacherEmpId = secDto.ClassTeacherEmpId
				});
			}
		}

		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	public async Task<bool> UpdateClassGradeAsync(int id, CreateClassGradeDto dto)
	{
		var cls = await _schoolRepository.GetClassGradeByIdAsync(id)
			?? throw new NotFoundException($"Class Grade with ID '{id}' not found.");

		cls.ClassName = dto.ClassName;

		cls.CurriculumSubjects.Clear();
		if (dto.SubjectIds != null && dto.SubjectIds.Any())
		{
			foreach (var subId in dto.SubjectIds)
			{
				cls.CurriculumSubjects.Add(new ClassCurriculumSubject
				{
					ClassId = cls.ClassId,
					SubjectId = subId
				});
			}
		}

		cls.Sections.Clear();
		if (dto.Sections != null && dto.Sections.Any())
		{
			foreach (var secDto in dto.Sections)
			{
				cls.Sections.Add(new ClassSection
				{
					ClassId = cls.ClassId,
					SectionName = secDto.SectionName,
					ClassTeacherEmpId = secDto.ClassTeacherEmpId
				});
			}
		}

		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteClassGradeAsync(int id)
	{
		var cls = await _schoolRepository.GetClassGradeByIdAsync(id)
			?? throw new NotFoundException($"Class Grade with ID '{id}' not found.");

		_schoolRepository.RemoveClassGrade(cls);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	private static ClassGradeResponseDto MapToClassGradeResponseDto(ClassGrade c) => new()
	{
		ClassId = c.ClassId,
		ClassName = c.ClassName,
		Sections = c.Sections.Select(s => new SectionResponseDto
		{
			SectionId = s.SectionId,
			SectionName = s.SectionName,
			ClassTeacherEmpId = s.ClassTeacherEmpId,
			ClassTeacherName = s.ClassTeacher != null ? $"{s.ClassTeacher.FirstName} {s.ClassTeacher.LastName}" : null,
			EmployeeId = s.ClassTeacher?.EmployeeId
		}).ToList(),
		CurriculumSubjects = c.CurriculumSubjects.Select(cs => new SubjectDto
		{
			SubjectId = cs.Subject.SubjectId,
			SubjectCode = cs.Subject.SubjectCode,
			SubjectName = cs.Subject.SubjectName,
			CourseCode = cs.Subject.CourseCode
		}).ToList()
	};

	// --- ADMISSIONS ---
	public async Task<List<AdmissionApplicationResponseDto>> GetAllApplicationsAsync(string? search, string? branch, int? classId, string? status)
	{
		var list = await _schoolRepository.GetAllApplicationsAsync(search, branch, classId, status);
		return list.Select(a => MapToAdmissionResponseDto(a)).ToList();
	}

	public async Task<AdmissionApplicationResponseDto> GetApplicationByIdAsync(int id)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");
		return MapToAdmissionResponseDto(app);
	}

	public async Task<AdmissionApplicationResponseDto> SubmitApplicationAsync(SubmitAdmissionDto dto)
	{
		int targetClassId = dto.AppliedClassId;
		if (targetClassId > 0)
		{
			var existingClass = await _schoolRepository.GetClassGradeByIdAsync(targetClassId);
			if (existingClass == null)
			{
				var allClasses = await _schoolRepository.GetAllClassGradesAsync();
				if (allClasses != null && allClasses.Any())
					targetClassId = allClasses.First().ClassId;
			}
		}
		else
		{
			var allClasses = await _schoolRepository.GetAllClassGradesAsync();
			if (allClasses != null && allClasses.Any())
				targetClassId = allClasses.First().ClassId;
		}

		var app = new AdmissionApplication
		{
			RegistrationNo = $"REG-{new Random().Next(1000, 9999)}",
			ProfilePhotoUrl = dto.ProfilePhotoUrl,
			FirstName = dto.FirstName ?? "",
			LastName = dto.LastName ?? "",
			Gender = dto.Gender,
			AppliedClassId = targetClassId,
			BranchName = dto.BranchName,
			BloodGroup = dto.BloodGroup,
			Religion = dto.Religion,
			Caste = dto.Caste,
			FatherName = dto.FatherName,
			MotherName = dto.MotherName,
			FatherContact = dto.FatherContact,
			MotherMobileNumber = dto.MotherMobileNumber,
			AlternateMobileNumber = dto.AlternateMobileNumber,
			ParentEmail = dto.ParentEmail,
			HouseNo = dto.HouseNo,
			Street = dto.Street,
			AreaLocality = dto.AreaLocality,
			City = dto.City,
			District = dto.District,
			State = dto.State,
			PinCode = dto.PinCode,
			NumberOfSiblings = dto.NumberOfSiblings,
			ExistingSiblingLookup = dto.ExistingSiblingLookup,
			TransportRequired = dto.TransportRequired,
			TransportType = dto.TransportType,
			BusRoute = dto.BusRoute,
			PickupPoint = dto.PickupPoint,
			DropPoint = dto.DropPoint,
			HostelBlock = dto.HostelBlock,
			FloorLevel = dto.FloorLevel,
			HostelRoom = dto.HostelRoom,
			AvailableBed = dto.AvailableBed,
			Scholarship = dto.Scholarship,
			Discount = dto.Discount,
			Status = "Pending"
		};

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) app.DateOfBirth = parsedDob;

		await _schoolRepository.AddApplicationAsync(app);
		await _schoolRepository.SaveChangesAsync();

		await SyncToAdmissionsTableAsync(app);

		return MapToAdmissionResponseDto(app);
	}

	public async Task<AdmissionApplicationResponseDto> UpdateApplicationAsync(int id, SubmitAdmissionDto dto)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		app.ProfilePhotoUrl = dto.ProfilePhotoUrl;
		app.FirstName = dto.FirstName ?? app.FirstName;
		app.LastName = dto.LastName ?? app.LastName;
		app.Gender = dto.Gender;
		if (dto.AppliedClassId > 0) app.AppliedClassId = dto.AppliedClassId;
		app.BranchName = dto.BranchName;
		app.BloodGroup = dto.BloodGroup;
		app.Religion = dto.Religion;
		app.Caste = dto.Caste;
		app.FatherName = dto.FatherName;
		app.MotherName = dto.MotherName;
		app.FatherContact = dto.FatherContact;
		app.MotherMobileNumber = dto.MotherMobileNumber;
		app.AlternateMobileNumber = dto.AlternateMobileNumber;
		app.ParentEmail = dto.ParentEmail;
		app.HouseNo = dto.HouseNo;
		app.Street = dto.Street;
		app.AreaLocality = dto.AreaLocality;
		app.City = dto.City;
		app.District = dto.District;
		app.State = dto.State;
		app.PinCode = dto.PinCode;
		app.NumberOfSiblings = dto.NumberOfSiblings;
		app.ExistingSiblingLookup = dto.ExistingSiblingLookup;
		app.TransportRequired = dto.TransportRequired;
		app.TransportType = dto.TransportType;
		app.BusRoute = dto.BusRoute;
		app.PickupPoint = dto.PickupPoint;
		app.DropPoint = dto.DropPoint;
		app.HostelBlock = dto.HostelBlock;
		app.FloorLevel = dto.FloorLevel;
		app.HostelRoom = dto.HostelRoom;
		app.AvailableBed = dto.AvailableBed;
		app.Scholarship = dto.Scholarship;
		app.Discount = dto.Discount;

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) app.DateOfBirth = parsedDob;

		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app);

		return MapToAdmissionResponseDto(app);
	}

	public async Task<bool> DeleteApplicationAsync(int id)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		app.Status = "Deleted";
		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app, isDeleted: true);
		return true;
	}

	public async Task<bool> RejectApplicationAsync(int id)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		app.Status = "Rejected";
		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app);
		return true;
	}

	public async Task<bool> EnrollStudentAsync(int id)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		if (app.Status == "Enrolled") throw new BadRequestException("Student is already enrolled.");

		app.Status = "Enrolled";
		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app);
		return true;
	}

	public async Task<bool> UpdateApplicationStatusAsync(int id, string status)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		app.Status = status;
		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app, isDeleted: string.Equals(status, "Deleted", StringComparison.OrdinalIgnoreCase));
		return true;
	}

	private async Task SyncToAdmissionsTableAsync(AdmissionApplication app, bool isDeleted = false)
	{
		try
		{
			var existing = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
				_context.Admissions, x => x.ApplicationNo == app.RegistrationNo);

			if (existing == null)
			{
				var newAdmission = new Admission
				{
					ApplicationNo = app.RegistrationNo,
					StudentName = $"{app.FirstName} {app.LastName}".Trim(),
					Dob = app.DateOfBirth,
					Gender = app.Gender,
					FatherName = app.FatherName,
					FatherMobile = app.FatherContact,
					BloodGroup = app.BloodGroup,
					Caste = app.Caste,
					BranchId = 1,
					ClassId = app.AppliedClassId > 0 ? app.AppliedClassId : 1,
					AdmissionType = "Regular",
					Status = app.Status,
					IsDeleted = isDeleted,
					CreatedDate = DateTime.UtcNow
				};
				await _context.Admissions.AddAsync(newAdmission);
			}
			else
			{
				existing.StudentName = $"{app.FirstName} {app.LastName}".Trim();
				existing.Dob = app.DateOfBirth;
				existing.Gender = app.Gender;
				existing.FatherName = app.FatherName;
				existing.FatherMobile = app.FatherContact;
				existing.BloodGroup = app.BloodGroup;
				existing.Caste = app.Caste;
				existing.ClassId = app.AppliedClassId > 0 ? app.AppliedClassId : 1;
				existing.Status = app.Status;
				existing.IsDeleted = isDeleted;
				existing.ModifiedDate = DateTime.UtcNow;
			}

			await _context.SaveChangesAsync();
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error syncing to admissions table: {ex.Message}");
		}
	}

	private static AdmissionApplicationResponseDto MapToAdmissionResponseDto(AdmissionApplication a) => new()
	{
		Id = a.Id,
		RegistrationNo = a.RegistrationNo,
		ProfilePhotoUrl = a.ProfilePhotoUrl,
		FirstName = a.FirstName,
		LastName = a.LastName,
		DateOfBirth = a.DateOfBirth?.ToString("yyyy-MM-dd"),
		Gender = a.Gender,
		AppliedClassGrade = a.AppliedClass != null ? a.AppliedClass.ClassName : "N/A",
		BranchName = a.BranchName,
		BloodGroup = a.BloodGroup,
		Religion = a.Religion,
		Caste = a.Caste,
		FatherName = a.FatherName,
		MotherName = a.MotherName,
		FatherContact = a.FatherContact,
		MotherMobileNumber = a.MotherMobileNumber,
		AlternateMobileNumber = a.AlternateMobileNumber,
		ParentEmail = a.ParentEmail,
		HouseNo = a.HouseNo,
		Street = a.Street,
		AreaLocality = a.AreaLocality,
		City = a.City,
		District = a.District,
		State = a.State,
		PinCode = a.PinCode,
		NumberOfSiblings = a.NumberOfSiblings,
		ExistingSiblingLookup = a.ExistingSiblingLookup,
		TransportRequired = a.TransportRequired,
		TransportType = a.TransportType,
		BusRoute = a.BusRoute,
		PickupPoint = a.PickupPoint,
		DropPoint = a.DropPoint,
		HostelBlock = a.HostelBlock,
		FloorLevel = a.FloorLevel,
		HostelRoom = a.HostelRoom,
		AvailableBed = a.AvailableBed,
		Scholarship = a.Scholarship,
		Discount = a.Discount,
		Status = a.Status
	};
}