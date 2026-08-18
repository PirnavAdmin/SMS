namespace SMS.Api.Services.Implementations;

using SMS.Api.Dtos;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

public class SchoolService : ISchoolService
{
	private readonly ISchoolRepository _schoolRepository;
	private readonly Data.AppDbContext _context;

	public SchoolService(ISchoolRepository schoolRepository, Data.AppDbContext context)
	{
		_schoolRepository = schoolRepository;
		_context = context;
	}

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
			HeadOfDepartment = dto.HeadOfDepartment?.Trim(),
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
		dept.HeadOfDepartment = dto.HeadOfDepartment?.Trim();

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
		dept.HeadOfDepartment = dto.HeadOfDepartment?.Trim();

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
		HeadOfDepartment = d.HeadOfDepartment,
		CreatedDate = d.CreatedDate,
		NumberOfSubjects = d.Subjects?.Count ?? 0
	};

	// --- DESIGNATIONS ---
	public async Task<List<DesignationMasterDto>> GetAllDesignationsAsync(string? search)
	{
		var query = _context.DesignationMasters.AsNoTracking().AsQueryable();
		if (!string.IsNullOrWhiteSpace(search))
		{
			query = query.Where(d => d.DesignationName.Contains(search) || d.EmployeeCategory.Contains(search));
		}
		var list = await query.OrderBy(d => d.DesignationName).ToListAsync();
		return list.Select(d => new DesignationMasterDto
		{
			Id = d.Id,
			DesignationName = d.DesignationName,
			EmployeeCategory = d.EmployeeCategory,
			Status = d.Status
		}).ToList();
	}

	public async Task<DesignationMasterDto> GetDesignationByIdAsync(int id)
	{
		var d = await _context.DesignationMasters.FindAsync(id)
			?? throw new NotFoundException($"Designation with ID '{id}' not found.");
		return new DesignationMasterDto
		{
			Id = d.Id,
			DesignationName = d.DesignationName,
			EmployeeCategory = d.EmployeeCategory,
			Status = d.Status
		};
	}

	public async Task<DesignationMasterDto> CreateDesignationAsync(CreateDesignationMasterDto dto)
	{
		if (string.IsNullOrWhiteSpace(dto.DesignationName))
			throw new InvalidOperationException("Designation name is required.");

		var isDuplicate = await _context.DesignationMasters.AnyAsync(d => d.DesignationName.ToLower() == dto.DesignationName.ToLower().Trim());
		if (isDuplicate)
			throw new InvalidOperationException($"Designation '{dto.DesignationName}' already exists.");

		var designation = new SMS.Api.Models.AcademicManagement.DesignationMaster
		{
			DesignationName = dto.DesignationName.Trim(),
			EmployeeCategory = dto.EmployeeCategory,
			Status = dto.Status,
			CreatedDate = DateTime.UtcNow
		};

		await _context.DesignationMasters.AddAsync(designation);
		await _context.SaveChangesAsync();

		return new DesignationMasterDto
		{
			Id = designation.Id,
			DesignationName = designation.DesignationName,
			EmployeeCategory = designation.EmployeeCategory,
			Status = designation.Status
		};
	}

	public async Task<DesignationMasterDto> UpdateDesignationAsync(int id, CreateDesignationMasterDto dto)
	{
		if (string.IsNullOrWhiteSpace(dto.DesignationName))
			throw new InvalidOperationException("Designation name is required.");

		var designation = await _context.DesignationMasters.FindAsync(id)
			?? throw new NotFoundException($"Designation with ID '{id}' not found.");

		var isDuplicate = await _context.DesignationMasters.AnyAsync(d => d.Id != id && d.DesignationName.ToLower() == dto.DesignationName.ToLower().Trim());
		if (isDuplicate)
			throw new InvalidOperationException($"Another designation with name '{dto.DesignationName}' already exists.");

		designation.DesignationName = dto.DesignationName.Trim();
		designation.EmployeeCategory = dto.EmployeeCategory;
		designation.Status = dto.Status;

		await _context.SaveChangesAsync();

		return new DesignationMasterDto
		{
			Id = designation.Id,
			DesignationName = designation.DesignationName,
			EmployeeCategory = designation.EmployeeCategory,
			Status = designation.Status
		};
	}

	public async Task<bool> DeleteDesignationAsync(int id)
	{
		var designation = await _context.DesignationMasters.FindAsync(id)
			?? throw new NotFoundException($"Designation with ID '{id}' not found.");

		// Verify if designation is currently referenced by active staff records
		var hasStaff = await _context.Staff.AnyAsync(s => s.Designation != null && s.Designation.ToLower() == designation.DesignationName.ToLower());
		if (hasStaff)
		{
			throw new InvalidOperationException("Cannot delete designation because staff members are currently assigned to it.");
		}

		_context.DesignationMasters.Remove(designation);
		await _context.SaveChangesAsync();
		return true;
	}

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
			SubjectCode = s.SubjectCode ?? "",
			SubjectName = s.SubjectName ?? "",
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
			CourseCode = string.IsNullOrWhiteSpace(dto.CourseCode) ? effectiveCode : dto.CourseCode.Trim(),
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
		SubjectCode = s.SubjectCode ?? "",
		SubjectName = s.SubjectName ?? "",
		CourseCode = s.CourseCode ?? "",
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
		var newClass = new ClassGrade { ClassName = !string.IsNullOrEmpty(dto.Name) ? dto.Name : dto.ClassName };
		await _schoolRepository.AddClassGradeAsync(newClass);
		await _schoolRepository.SaveChangesAsync();

		// BUG-002 FIX: Resolve default active department for auto-created subjects
		var defaultDept = await _context.Departments.FirstOrDefaultAsync(d => d.Status == "Active");
		int safeDeptId = defaultDept?.DepartmentId ?? 1;

		// Handle Subjects mapping
		var subjectIds = new List<int>();
		if (dto.Subjects != null && dto.Subjects.Any())
		{
			foreach (var subName in dto.Subjects)
			{
				var sub = await _context.Subjects.FirstOrDefaultAsync(s => s.SubjectName == subName);
				if (sub == null)
				{
					// Dynamically create the subject if not found with safe DepartmentId
					sub = new Subject
					{
						SubjectName = subName,
						SubjectCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length)) + "101",
						CourseCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length)),
						DepartmentId = safeDeptId
					};
					await _context.Subjects.AddAsync(sub);
					await _context.SaveChangesAsync();
				}
				subjectIds.Add(sub.SubjectId);
			}
		}
		else if (dto.SubjectIds != null)
		{
			subjectIds.AddRange(dto.SubjectIds);
		}

		foreach (var subId in subjectIds)
		{
			newClass.SubjectMappings.Add(new ClassSubjectMapping
			{
				ClassId = newClass.ClassId,
				SubjectId = subId
			});
		}

		// Handle Sections and Teachers mapping
		var sectionsList = new List<SectionAssignmentDto>();
		if (dto.SectionNames != null && dto.SectionNames.Any())
		{
			foreach (var secName in dto.SectionNames)
			{
				int? teacherId = null;
				if (dto.SectionTeachers != null && dto.SectionTeachers.TryGetValue(secName, out var teacherName) && !string.IsNullOrEmpty(teacherName))
				{
					var parsedTeacherName = teacherName;
					if (teacherName.Contains("(") && teacherName.Contains(")"))
					{
						parsedTeacherName = teacherName.Substring(0, teacherName.IndexOf("(")).Trim();
					}
					var staff = await _context.Staff.FirstOrDefaultAsync(s => 
						(s.FirstName + " " + s.LastName).Trim().ToLower() == parsedTeacherName.ToLower());
					if (staff != null)
					{
						teacherId = staff.StaffId;
					}
				}
				sectionsList.Add(new SectionAssignmentDto
				{
					SectionName = secName,
					ClassTeacherEmpId = teacherId
				});
			}
		}
		else if (dto.Sections != null)
		{
			sectionsList.AddRange(dto.Sections);
		}

		foreach (var secDto in sectionsList)
		{
			var section = new ClassSection
			{
				ClassId = newClass.ClassId,
				SectionName = secDto.SectionName
			};
			newClass.Sections.Add(section);

			if (secDto.ClassTeacherEmpId.HasValue)
			{
				_context.TeacherAssignments.Add(new TeacherAssignment
				{
					ClassId = newClass.ClassId,
					SectionLetter = secDto.SectionName,
					TeacherId = secDto.ClassTeacherEmpId.Value,
					Role = "Class Teacher",
					Status = "Active",
					SubjectId = subjectIds.FirstOrDefault()
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

		cls.ClassName = !string.IsNullOrEmpty(dto.Name) ? dto.Name : dto.ClassName;

		cls.SubjectMappings.Clear();
		
		var defaultDept = await _context.Departments.FirstOrDefaultAsync(d => d.Status == "Active");
		int safeDeptId = defaultDept?.DepartmentId ?? 1;

		// Handle Subjects mapping
		var subjectIds = new List<int>();
		if (dto.Subjects != null && dto.Subjects.Any())
		{
			foreach (var subName in dto.Subjects)
			{
				var sub = await _context.Subjects.FirstOrDefaultAsync(s => s.SubjectName == subName);
				if (sub == null)
				{
					sub = new Subject
					{
						SubjectName = subName,
						SubjectCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length)) + "101",
						CourseCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length)),
						DepartmentId = safeDeptId
					};
					await _context.Subjects.AddAsync(sub);
					await _context.SaveChangesAsync();
				}
				subjectIds.Add(sub.SubjectId);
			}
		}
		else if (dto.SubjectIds != null)
		{
			subjectIds.AddRange(dto.SubjectIds);
		}

		foreach (var subId in subjectIds)
		{
			cls.SubjectMappings.Add(new ClassSubjectMapping
			{
				ClassId = cls.ClassId,
				SubjectId = subId
			});
		}

		// BUG-003 FIX: Do NOT clear all existing sections (causes cascading delete on timetable/students).
		// Merge sections instead.
		var sectionsList = new List<SectionAssignmentDto>();
		if (dto.SectionNames != null && dto.SectionNames.Any())
		{
			foreach (var secName in dto.SectionNames)
			{
				int? teacherId = null;
				if (dto.SectionTeachers != null && dto.SectionTeachers.TryGetValue(secName, out var teacherName) && !string.IsNullOrEmpty(teacherName))
				{
					var parsedTeacherName = teacherName;
					if (teacherName.Contains("(") && teacherName.Contains(")"))
					{
						parsedTeacherName = teacherName.Substring(0, teacherName.IndexOf("(")).Trim();
					}
					var staff = await _context.Staff.FirstOrDefaultAsync(s => 
						(s.FirstName + " " + s.LastName).Trim().ToLower() == parsedTeacherName.ToLower());
					if (staff != null)
					{
						teacherId = staff.StaffId;
					}
				}
				sectionsList.Add(new SectionAssignmentDto
				{
					SectionName = secName,
					ClassTeacherEmpId = teacherId
				});
			}
		}
		else if (dto.Sections != null)
		{
			sectionsList.AddRange(dto.Sections);
		}

		// Update or add sections safely
		var existingSectionNames = cls.Sections.Select(s => s.SectionName.ToLower()).ToHashSet();
		foreach (var secDto in sectionsList)
		{
			if (!existingSectionNames.Contains(secDto.SectionName.ToLower()))
			{
				cls.Sections.Add(new ClassSection
				{
					ClassId = cls.ClassId,
					SectionName = secDto.SectionName
				});
			}
		}

		// Remove existing Class Teacher assignments for this class
		var existingClassTeachers = _context.TeacherAssignments
			.Where(a => a.ClassId == cls.ClassId && a.Role == "Class Teacher")
			.ToList();
		_context.TeacherAssignments.RemoveRange(existingClassTeachers);

		foreach (var secDto in sectionsList)
		{
			if (secDto.ClassTeacherEmpId.HasValue)
			{
				_context.TeacherAssignments.Add(new TeacherAssignment
				{
					ClassId = cls.ClassId,
					SectionLetter = secDto.SectionName,
					TeacherId = secDto.ClassTeacherEmpId.Value,
					Role = "Class Teacher",
					Status = "Active",
					SubjectId = subjectIds.FirstOrDefault()
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
		ClassName = c.ClassName ?? "",
		Sections = c.Sections.Select(s => new SectionResponseDto
		{
			SectionId = s.SectionId,
			SectionName = s.SectionName,
			ClassTeacherEmpId = null,
			ClassTeacherName = null,
			EmployeeId = null
		}).ToList(),
		CurriculumSubjects = c.SubjectMappings.Select(cs => new SubjectDto
		{
			SubjectId = cs.Subject.SubjectId,
			SubjectCode = cs.Subject.SubjectCode ?? "",
			SubjectName = cs.Subject.SubjectName ?? "",
			CourseCode = cs.Subject.CourseCode ?? ""
		}).ToList()
	};

	// --- ADMISSIONS ---
	public async Task<List<AdmissionApplicationResponseDto>> GetAllApplicationsAsync(string? search, string? branch, int? classId, string? status)
	{
		var list = await _schoolRepository.GetAllApplicationsAsync(search, branch, classId, status);
		foreach (var a in list)
		{
			if (a.TransportRequired == true || (!string.IsNullOrWhiteSpace(a.StudentType) && a.StudentType.Contains("Transport", StringComparison.OrdinalIgnoreCase)) || !string.IsNullOrWhiteSpace(a.BusRoute))
			{
				await SyncTransportAllocationAsync(a);
			}
		}
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
		if (targetClassId <= 0 && !string.IsNullOrWhiteSpace(dto.AppliedClass))
		{
			if (dto.AppliedClass.StartsWith("CL-", StringComparison.OrdinalIgnoreCase) && 
				int.TryParse(dto.AppliedClass.Substring(3), out var parsedId))
			{
				targetClassId = parsedId;
			}
			else
			{
				var matchedClass = await _context.Classes.FirstOrDefaultAsync(c => 
					c.ClassName == dto.AppliedClass || 
					c.ClassName.ToLower() == dto.AppliedClass.ToLower());
				if (matchedClass != null)
				{
					targetClassId = matchedClass.ClassId;
				}
			}
		}

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

		// Generate sequential registration number (e.g. REG-1001, REG-1002, ...)
		var allApps = await _schoolRepository.GetAllApplicationsAsync(null, null, null, null);
		int maxSeq = 1000;
		if (allApps != null)
		{
			foreach (var a in allApps)
			{
				if (!string.IsNullOrWhiteSpace(a.RegistrationNo) && a.RegistrationNo.StartsWith("REG-"))
				{
					if (int.TryParse(a.RegistrationNo.Substring(4), out int seqNum) && seqNum > maxSeq)
					{
						maxSeq = seqNum;
					}
				}
			}
		}

		var allStudents = await _context.Students.AsNoTracking().Select(s => s.AdmissionNumber).ToListAsync();
		foreach (var admNo in allStudents)
		{
			if (!string.IsNullOrWhiteSpace(admNo) && admNo.StartsWith("REG-"))
			{
				if (int.TryParse(admNo.Substring(4), out int seqNum) && seqNum > maxSeq)
				{
					maxSeq = seqNum;
				}
			}
		}

		string nextRegNo = $"REG-{maxSeq + 1}";

		var app = new AdmissionApplication
		{
			RegistrationNo = nextRegNo,
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
			StudentType = string.IsNullOrWhiteSpace(dto.StudentType) ? "Non-Residential" : dto.StudentType,
			TransportRequired = dto.TransportRequired,
			TransportType = dto.TransportType,
			BusRoute = dto.BusRoute,
			PickupPoint = dto.PickupPoint,
			DropPoint = dto.DropPoint,
			HostelBlock = dto.HostelBlock,
			FloorLevel = dto.FloorLevel,
			HostelRoom = dto.HostelRoom,
			AvailableBed = dto.AvailableBed,
			AllocatedBedId = dto.AllocatedBedId ?? dto.AvailableBed,
			Scholarship = dto.Scholarship,
			Discount = dto.Discount,
			Status = "Pending"
		};

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) app.DateOfBirth = parsedDob;

		await _schoolRepository.AddApplicationAsync(app);
		await _schoolRepository.SaveChangesAsync();

		await SyncToAdmissionsTableAsync(app);
		await SyncHostelAllocationAsync(app);
		await SyncTransportAllocationAsync(app);

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
		int targetClassId = dto.AppliedClassId;
		if (targetClassId <= 0 && !string.IsNullOrWhiteSpace(dto.AppliedClass))
		{
			if (dto.AppliedClass.StartsWith("CL-", StringComparison.OrdinalIgnoreCase) && 
				int.TryParse(dto.AppliedClass.Substring(3), out var parsedId))
			{
				targetClassId = parsedId;
			}
			else
			{
				var matchedClass = await _context.Classes.FirstOrDefaultAsync(c => 
					c.ClassName == dto.AppliedClass || 
					c.ClassName.ToLower() == dto.AppliedClass.ToLower());
				if (matchedClass != null)
				{
					targetClassId = matchedClass.ClassId;
				}
			}
		}
		if (targetClassId > 0) app.AppliedClassId = targetClassId;
		app.BranchName = dto.BranchName;
		if (!string.IsNullOrWhiteSpace(dto.StudentType)) app.StudentType = dto.StudentType;
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
		app.AllocatedBedId = dto.AllocatedBedId ?? dto.AvailableBed ?? app.AllocatedBedId;
		app.Scholarship = dto.Scholarship;
		app.Discount = dto.Discount;

		if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) app.DateOfBirth = parsedDob;

		await _schoolRepository.SaveChangesAsync();
		await SyncToAdmissionsTableAsync(app);
		await SyncHostelAllocationAsync(app);
		await SyncTransportAllocationAsync(app);

		return MapToAdmissionResponseDto(app);
	}

	public async Task<bool> DeleteApplicationAsync(int id)
	{
		var app = await _schoolRepository.GetApplicationByIdAsync(id)
			?? throw new NotFoundException($"Admission application with ID '{id}' not found.");

		app.Status = "Deleted";
		app.IsDeleted = true;
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

			var branches = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(_context.Branches);
			var defaultBranch = branches.Find(b => b.BranchId == 1) ?? branches.FirstOrDefault();
			var appBranch = branches.Find(b => b.BranchName.ToLower() == (app.BranchName ?? "").ToLower()) ?? defaultBranch;
			var branchId = appBranch != null ? appBranch.BranchId : 1;

			if (existing == null)
			{
				var newAdmission = new Admission
				{
					ApplicationNo = app.RegistrationNo ?? "",
					StudentName = $"{app.FirstName} {app.LastName}".Trim(),
					Dob = app.DateOfBirth,
					Gender = app.Gender,
					FatherName = app.FatherName,
					FatherMobile = app.FatherContact,
					BloodGroup = app.BloodGroup,
					Caste = app.Caste,
					BranchId = branchId,
					ClassId = app.AppliedClassId.HasValue && app.AppliedClassId.Value > 0 ? app.AppliedClassId.Value : 1,
					SectionLetter = "A",
					AdmissionType = "Regular",
					Status = app.Status ?? "",
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
				existing.BranchId = branchId;
				existing.ClassId = app.AppliedClassId.HasValue && app.AppliedClassId.Value > 0 ? app.AppliedClassId.Value : 1;
				existing.Status = app.Status ?? "";
				existing.IsDeleted = isDeleted;
				existing.ModifiedDate = DateTime.UtcNow;
				if (string.IsNullOrEmpty(existing.SectionLetter))
				{
					existing.SectionLetter = "A";
				}
			}

			await _context.SaveChangesAsync();

			// Sync to students table if enrolled/active/approved and not deleted
			if (!isDeleted && (app.Status == "Enrolled" || app.Status == "Active" || app.Status == "Approved"))
			{
				var admission = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.Admissions, x => x.ApplicationNo == app.RegistrationNo);

				if (admission != null && admission.ClassId.HasValue)
				{
					var sectionLetter = string.IsNullOrEmpty(admission.SectionLetter) ? "A" : admission.SectionLetter;
					var sectionObj = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
						_context.ClassSections, s => s.ClassId == admission.ClassId.Value && s.SectionName.ToLower() == sectionLetter.ToLower());

					if (sectionObj == null)
					{
						sectionObj = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
							_context.ClassSections, s => s.ClassId == admission.ClassId.Value);
					}

					if (sectionObj != null)
					{
						var defaultAcademicYear = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.AcademicYears);

						if (defaultAcademicYear != null)
						{
							var existingStudent = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
								_context.Students, s => s.AdmissionNumber == admission.ApplicationNo);

							if (existingStudent != null)
							{
								existingStudent.StudentName = admission.StudentName;
								existingStudent.DateOfBirth = admission.Dob;
								existingStudent.Gender = admission.Gender;
								existingStudent.FatherName = admission.FatherName;
								existingStudent.FatherMobile = admission.FatherMobile;
								existingStudent.ClassId = admission.ClassId.Value;
								existingStudent.SectionId = sectionObj.SectionId;
								existingStudent.RollNumber = admission.RollNo ?? existingStudent.RollNumber;
								existingStudent.BranchId = (int)admission.BranchId;
								existingStudent.Status = "Active";
								existingStudent.UpdatedAt = DateTime.UtcNow;
							}
							else
							{
								var newStudent = new Student
								{
									AdmissionNumber = admission.ApplicationNo ?? $"ADM-{admission.AdmissionId}",
									RollNumber = admission.RollNo ?? $"R-{admission.AdmissionId}",
									StudentName = admission.StudentName,
									DateOfBirth = admission.Dob,
									Gender = admission.Gender,
									FatherName = admission.FatherName,
									FatherMobile = admission.FatherMobile,
									BranchId = (int)admission.BranchId,
									AcademicYearId = defaultAcademicYear.AcademicYearId,
									ClassId = admission.ClassId.Value,
									SectionId = sectionObj.SectionId,
									Status = "Active",
									CreatedAt = DateTime.UtcNow
								};
								await _context.Students.AddAsync(newStudent);
							}
							await _context.SaveChangesAsync();
						}
					}
				}
			}
			else
			{
				var existingStudent = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.Students, s => s.AdmissionNumber == app.RegistrationNo);
				if (existingStudent != null)
				{
					existingStudent.Status = "Inactive";
					existingStudent.IsDeleted = true;
					await _context.SaveChangesAsync();
				}
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error syncing to admissions table: {ex.Message}");
		}
	}

	private static AdmissionApplicationResponseDto MapToAdmissionResponseDto(AdmissionApplication a) => new()
	{
		Id = a.Id,
		RegistrationNo = a.RegistrationNo ?? "",
		ProfilePhotoUrl = a.ProfilePhotoUrl,
		FirstName = a.FirstName ?? "",
		LastName = a.LastName ?? "",
		DateOfBirth = a.DateOfBirth?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
		Gender = a.Gender ?? "",
		AppliedClassGrade = a.AppliedClass != null ? a.AppliedClass.ClassName ?? "N/A" : "N/A",
		BranchName = a.BranchName ?? "",
		BloodGroup = a.BloodGroup,
		Religion = a.Religion,
		Caste = a.Caste,
		FatherName = a.FatherName ?? "",
		MotherName = a.MotherName,
		FatherContact = a.FatherContact ?? "",
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
		NumberOfSiblings = a.NumberOfSiblings ?? 0,
		ExistingSiblingLookup = a.ExistingSiblingLookup,
		StudentType = a.StudentType ?? "",
		TransportRequired = a.TransportRequired ?? false,
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
		Status = a.Status ?? "",
		CreatedAt = a.CreatedAt
	};

	private async Task SyncHostelAllocationAsync(AdmissionApplication app)
	{
		try
		{
			if (string.Equals(app.StudentType, "Residential", StringComparison.OrdinalIgnoreCase))
			{
				string blockName = !string.IsNullOrWhiteSpace(app.HostelBlock) && app.HostelBlock != "N/A" ? app.HostelBlock : "Main Block";
				string roomNo = !string.IsNullOrWhiteSpace(app.HostelRoom) && app.HostelRoom != "N/A" ? app.HostelRoom : "Room 101";
				string bedNo = !string.IsNullOrWhiteSpace(app.AllocatedBedId) && app.AllocatedBedId != "N/A" 
					? app.AllocatedBedId 
					: (!string.IsNullOrWhiteSpace(app.AvailableBed) && app.AvailableBed != "N/A" ? app.AvailableBed : "Bed-1");

				var block = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.HostelBlocks, b => b.HostelName == blockName && b.Status == "Active");

				if (block == null)
				{
					block = new HostelBlock { HostelName = blockName, HostelCode = "HST-01", HostelType = "Boys Hostel", Status = "Active", Address = "Main Campus" };
					await _context.HostelBlocks.AddAsync(block);
					await _context.SaveChangesAsync();
				}

				var roomType = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.RoomTypeConfigs, rt => rt.Status == "Active");

				if (roomType == null)
				{
					roomType = new RoomTypeConfig { RoomTypeSpecification = "Standard Room", BedCapacity = 4, AcType = "AC", Status = "Active" };
					await _context.RoomTypeConfigs.AddAsync(roomType);
					await _context.SaveChangesAsync();
				}

				var room = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.RoomMasters, r => r.HostelId == block.HostelId && r.RoomNumber == roomNo && r.Status == "Active");

				if (room == null)
				{
					room = new RoomMaster { HostelId = block.HostelId, RoomTypeId = roomType.RoomTypeId, RoomNumber = roomNo, FloorLevel = app.FloorLevel ?? "1st Floor", Status = "Active" };
					await _context.RoomMasters.AddAsync(room);
					await _context.SaveChangesAsync();
				}

				string regNo = app.RegistrationNo ?? string.Empty;
				string stName = $"{app.FirstName} {app.LastName}".Trim();

				var existingAllocation = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.StudentBedAllocations, a => a.StudentId == app.Id && a.Status == "Active");

				if (existingAllocation == null)
				{
					var allocation = new StudentBedAllocation
					{
						StudentId = app.Id,
						RegistrationNo = regNo,
						StudentName = stName,
						HostelId = block.HostelId,
						RoomId = room.RoomId,
						BedNumber = bedNo,
						JoiningDate = DateTime.UtcNow,
						Status = "Active"
					};
					await _context.StudentBedAllocations.AddAsync(allocation);
				}
				else
				{
					existingAllocation.RegistrationNo = regNo;
					existingAllocation.StudentName = stName;
					existingAllocation.HostelId = block.HostelId;
					existingAllocation.RoomId = room.RoomId;
					existingAllocation.BedNumber = bedNo;
				}

				await _context.SaveChangesAsync();
			}
			else
			{
				var existingAllocation = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.StudentBedAllocations, a => a.StudentId == app.Id && a.Status == "Active");

				if (existingAllocation != null)
				{
					existingAllocation.Status = "Inactive";
					await _context.SaveChangesAsync();
				}
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error syncing hostel allocation: {ex.Message}");
		}
	}

	private async Task SyncTransportAllocationAsync(AdmissionApplication app)
	{
		try
		{
			bool isTransportReq = app.TransportRequired == true || 
				(!string.IsNullOrWhiteSpace(app.StudentType) && app.StudentType.Contains("Transport", StringComparison.OrdinalIgnoreCase)) ||
				(!string.IsNullOrWhiteSpace(app.StudentType) && app.StudentType.Equals("Non-Residential", StringComparison.OrdinalIgnoreCase) && app.TransportRequired == true) ||
				!string.IsNullOrWhiteSpace(app.BusRoute) ||
				!string.IsNullOrWhiteSpace(app.PickupPoint);

			string admissionNo = !string.IsNullOrWhiteSpace(app.RegistrationNo) ? app.RegistrationNo : $"REG-{app.Id}";

			if (isTransportReq)
			{
				string routeName = !string.IsNullOrWhiteSpace(app.BusRoute) ? app.BusRoute : "Main Route";
				string pickupName = !string.IsNullOrWhiteSpace(app.PickupPoint) ? app.PickupPoint : "Main Stop";

				// Get or create route
				var route = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.TransportRoutes, r => r.RouteName == routeName && !r.IsDeleted);

				if (route == null)
				{
					route = new TransportRoute { RouteName = routeName, RouteCode = "RT-" + new Random().Next(100, 999), Status = true, IsDeleted = false, CreatedAt = DateTime.UtcNow };
					await _context.TransportRoutes.AddAsync(route);
					await _context.SaveChangesAsync();
				}

				// Get or create pickup point linked to the route
				var pickup = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.PickupPoints, p => p.PickupPointName == pickupName && p.RouteId == route.RouteId && !p.IsDeleted);

				if (pickup == null)
				{
					pickup = new PickupPoint { PickupPointName = pickupName, RouteId = route.RouteId, Status = true, IsDeleted = false, CreatedAt = DateTime.UtcNow };
					await _context.PickupPoints.AddAsync(pickup);
					await _context.SaveChangesAsync();
				}

				// Get or create vehicle assignment linked to the route
				var vehicleAssignment = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.TransportVehicleAssignments, va => va.RouteId == route.RouteId && !va.IsDeleted);

				if (vehicleAssignment == null)
				{
					var vehicle = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
						_context.TransportVehicles, v => !v.IsDeleted)
						?? new TransportVehicle { VehicleNumber = "BUS-" + new Random().Next(100, 999), Capacity = 40, Status = true };

					if (vehicle.VehicleId <= 0)
					{
						await _context.TransportVehicles.AddAsync(vehicle);
						await _context.SaveChangesAsync();
					}

					var driver = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
						_context.TransportDrivers, d => !d.IsDeleted)
						?? new TransportDriver { DriverName = "Main Driver", MobileNumber = "9876543210", Status = true };

					if (driver.DriverId <= 0)
					{
						await _context.TransportDrivers.AddAsync(driver);
						await _context.SaveChangesAsync();
					}

					vehicleAssignment = new TransportVehicleAssignment
					{
						RouteId = route.RouteId,
						VehicleId = vehicle.VehicleId,
						DriverId = driver.DriverId,
						Status = true,
						IsDeleted = false,
						EffectiveFrom = DateTime.UtcNow
					};
					await _context.TransportVehicleAssignments.AddAsync(vehicleAssignment);
					await _context.SaveChangesAsync();
				}

				// Sync student assignment
				var existingAssignment = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.StudentTransportAssignments, sta => sta.AdmissionNo == admissionNo && !sta.IsDeleted);

				if (existingAssignment == null)
				{
					var assignment = new StudentTransportAssignment
					{
						AdmissionNo = admissionNo,
						RouteId = route.RouteId,
						PickupPointId = pickup.PickupPointId,
						VehicleAssignmentId = vehicleAssignment.AssignmentId,
						EffectiveFrom = DateTime.UtcNow,
						TransportType = !string.IsNullOrWhiteSpace(app.TransportType) ? app.TransportType : "Both",
						Status = true,
						IsDeleted = false
					};
					await _context.StudentTransportAssignments.AddAsync(assignment);
				}
				else
				{
					existingAssignment.RouteId = route.RouteId;
					existingAssignment.PickupPointId = pickup.PickupPointId;
					existingAssignment.VehicleAssignmentId = vehicleAssignment.AssignmentId;
					existingAssignment.TransportType = !string.IsNullOrWhiteSpace(app.TransportType) ? app.TransportType : "Both";
					existingAssignment.Status = true;
				}

				await _context.SaveChangesAsync();
			}
			else
			{
				// Deactivate any active transport assignment if transport is no longer requested
				var existingAssignment = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
					_context.StudentTransportAssignments, sta => sta.AdmissionNo == admissionNo && !sta.IsDeleted);

				if (existingAssignment != null)
				{
					existingAssignment.Status = false;
					existingAssignment.IsDeleted = true;
					await _context.SaveChangesAsync();
				}
			}
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Error syncing transport allocation: {ex.Message}");
		}
	}

	// --- ATTENDANCE & LEAVE MANAGEMENT IMPLEMENTATIONS ---
	public async Task<List<LeaveTypeConfigDto>> GetAllLeaveTypesAsync()
	{
		var list = await _schoolRepository.GetAllLeaveTypesAsync();
		return list.Select(l => new LeaveTypeConfigDto
		{
			LeaveTypeId = l.LeaveTypeId,
			Name = l.Name,
			Code = l.Code,
			AnnualAllowance = l.AnnualAllowance,
			CarryForward = l.CarryForward,
			MaxConsecutiveDays = l.MaxConsecutiveDays,
			RequiresAttachment = l.RequiresAttachment,
			IsPaid = l.IsPaid,
			Status = l.Status
		}).ToList();
	}

	public async Task<LeaveTypeConfigDto> CreateLeaveTypeAsync(LeaveTypeConfigDto dto)
	{
		var entity = new LeaveTypeConfig
		{
			Name = dto.Name,
			Code = dto.Code,
			AnnualAllowance = dto.AnnualAllowance,
			CarryForward = dto.CarryForward,
			MaxConsecutiveDays = dto.MaxConsecutiveDays,
			RequiresAttachment = dto.RequiresAttachment,
			IsPaid = dto.IsPaid,
			Status = dto.Status
		};
		await _schoolRepository.AddLeaveTypeAsync(entity);
		await _schoolRepository.SaveChangesAsync();
		dto.LeaveTypeId = entity.LeaveTypeId;
		return dto;
	}

	public async Task<List<LeaveApplicationResponseDto>> GetAllLeaveApplicationsAsync(string? status)
	{
		var list = await _schoolRepository.GetAllLeaveApplicationsAsync(status);
		return list.Select(l => new LeaveApplicationResponseDto
		{
			LeaveApplicationId = l.LeaveApplicationId,
			StaffId = l.StaffId,
			EmployeeId = l.Staff?.EmployeeId ?? "N/A",
			StaffName = l.Staff != null ? $"{l.Staff.FirstName} {l.Staff.LastName}" : "N/A",
			Designation = l.Staff?.Designation ?? "N/A",
			Department = l.Staff?.Department ?? "N/A",
			Branch = l.Staff?.BranchName ?? "Main Campus",
			EmployeeCategory = l.Staff?.EmployeeCategory ?? "Staff",
			LeaveTypeName = l.LeaveType?.Name ?? "N/A",
			LeaveTypeCode = l.LeaveType?.Code ?? "N/A",
			FromDate = l.FromDate.ToString("yyyy-MM-dd"),
			ToDate = l.ToDate.ToString("yyyy-MM-dd"),
			IsHalfDay = l.IsHalfDay,
			RequestedDays = l.RequestedDays,
			Reason = l.Reason,
			AppliedDate = l.AppliedDate.ToString("yyyy-MM-dd"),
			Status = l.Status
		}).ToList();
	}

	public async Task<LeaveApplicationResponseDto> SubmitLeaveApplicationAsync(LeaveApplicationCreateDto dto)
	{
		var staff = await _schoolRepository.GetStaffByIdAsync(dto.StaffId)
			?? throw new NotFoundException($"Staff member with ID {dto.StaffId} not found.");

		DateTime from = DateTime.TryParse(dto.FromDate, out var f) ? f : DateTime.UtcNow;
		DateTime to = DateTime.TryParse(dto.ToDate, out var t) ? t : DateTime.UtcNow;
		int days = Math.Max(1, (int)(to - from).TotalDays + 1);

		var entity = new LeaveApplication
		{
			StaffId = dto.StaffId,
			LeaveTypeId = dto.LeaveTypeId,
			FromDate = from,
			ToDate = to,
			IsHalfDay = dto.IsHalfDay,
			RequestedDays = dto.IsHalfDay ? 1 : days,
			Reason = dto.Reason,
			AppliedDate = DateTime.UtcNow,
			Status = "Pending"
		};

		await _schoolRepository.AddLeaveApplicationAsync(entity);
		await _schoolRepository.SaveChangesAsync();

		var leaveType = await _schoolRepository.GetLeaveTypeByIdAsync(dto.LeaveTypeId);

		return new LeaveApplicationResponseDto
		{
			LeaveApplicationId = entity.LeaveApplicationId,
			StaffId = staff.StaffId,
			EmployeeId = staff.EmployeeId ?? "",
			StaffName = $"{staff.FirstName} {staff.LastName}",
			Designation = staff.Designation ?? "",
			Department = staff.Department ?? "",
			Branch = staff.BranchName ?? "Main Campus",
			EmployeeCategory = staff.EmployeeCategory ?? "Staff",
			LeaveTypeName = leaveType?.Name ?? "Leave",
			LeaveTypeCode = leaveType?.Code ?? "LV",
			FromDate = entity.FromDate.ToString("yyyy-MM-dd"),
			ToDate = entity.ToDate.ToString("yyyy-MM-dd"),
			IsHalfDay = entity.IsHalfDay,
			RequestedDays = entity.RequestedDays,
			Reason = entity.Reason,
			AppliedDate = entity.AppliedDate.ToString("yyyy-MM-dd"),
			Status = entity.Status
		};
	}

	public async Task<LeaveApplicationResponseDto> UpdateLeaveStatusAsync(int applicationId, string status)
	{
		var application = await _schoolRepository.GetLeaveApplicationByIdAsync(applicationId)
			?? throw new NotFoundException($"Leave application with ID {applicationId} not found.");

		application.Status = status;

		if (status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
		{
			var staff = await _schoolRepository.GetStaffByIdAsync(application.StaffId);
			if (staff != null)
			{
				var code = (application.LeaveType?.Code ?? "").ToUpper();
				if (code.Contains("CL"))
				{
					staff.CasualLeaveBalance = Math.Max(0, staff.CasualLeaveBalance - application.RequestedDays);
				}
				else if (code.Contains("SL"))
				{
					staff.SickLeaveBalance = Math.Max(0, staff.SickLeaveBalance - application.RequestedDays);
				}
				else if (code.Contains("EL") || code.Contains("PL"))
				{
					staff.EarnedLeaveBalance = Math.Max(0, staff.EarnedLeaveBalance - application.RequestedDays);
				}
			}

			// Generate Staff Attendance Records
			var start = application.FromDate.Date;
			var end = application.ToDate.Date;

			for (var date = start; date <= end; date = date.AddDays(1))
			{
				var existingAttendance = await _context.StaffAttendances
					.FirstOrDefaultAsync(a => a.StaffId == application.StaffId && a.Date.Date == date);

				if (existingAttendance != null)
				{
					existingAttendance.Status = application.IsHalfDay ? "HalfDay" : "Leave";
					existingAttendance.Remarks = $"Approved Leave: {application.LeaveType?.Name ?? "Leave"}";
				}
				else
				{
					var newAttendance = new StaffAttendance
					{
						StaffId = application.StaffId,
						Date = date,
						Status = application.IsHalfDay ? "HalfDay" : "Leave",
						Remarks = $"Approved Leave: {application.LeaveType?.Name ?? "Leave"}",
						InTime = "00:00",
						OutTime = "00:00",
						AcademicYear = "2026-2027",
						Branch = staff?.BranchName ?? "Main Campus"
					};
					await _context.StaffAttendances.AddAsync(newAttendance);
				}
			}
		}

		await _schoolRepository.SaveChangesAsync();

		return new LeaveApplicationResponseDto
		{
			LeaveApplicationId = application.LeaveApplicationId,
			StaffId = application.StaffId,
			EmployeeId = application.Staff?.EmployeeId ?? "N/A",
			StaffName = application.Staff != null ? $"{application.Staff.FirstName} {application.Staff.LastName}" : "N/A",
			Designation = application.Staff?.Designation ?? "N/A",
			Department = application.Staff?.Department ?? "N/A",
			Branch = application.Staff?.BranchName ?? "Main Campus",
			EmployeeCategory = application.Staff?.EmployeeCategory ?? "Staff",
			LeaveTypeName = application.LeaveType?.Name ?? "N/A",
			LeaveTypeCode = application.LeaveType?.Code ?? "N/A",
			FromDate = application.FromDate.ToString("yyyy-MM-dd"),
			ToDate = application.ToDate.ToString("yyyy-MM-dd"),
			IsHalfDay = application.IsHalfDay,
			RequestedDays = application.RequestedDays,
			Reason = application.Reason,
			AppliedDate = application.AppliedDate.ToString("yyyy-MM-dd"),
			Status = application.Status
		};
	}

	public async Task<List<LeaveBalanceDto>> GetLeaveBalancesAsync()
	{
		var allStaff = await _schoolRepository.GetAllStaffAsync(null, null);
		var result = new List<LeaveBalanceDto>();

		foreach (var s in allStaff)
		{
			result.Add(new LeaveBalanceDto
			{
				StaffId = s.StaffId,
				EmployeeId = s.EmployeeId ?? "",
				StaffName = $"{s.FirstName} {s.LastName}",
				Designation = s.Designation ?? "",
				CasualLeaveBalance = s.CasualLeaveBalance,
				SickLeaveBalance = s.SickLeaveBalance,
				EarnedLeaveBalance = s.EarnedLeaveBalance,
				TotalRemainingBalance = s.CasualLeaveBalance + s.SickLeaveBalance + s.EarnedLeaveBalance
			});
		}

		return result;
	}

	public async Task<List<HolidayCalendarDto>> GetAllHolidaysAsync()
	{
		var holidays = await _schoolRepository.GetAllHolidaysAsync();
		return holidays.Select(h => new HolidayCalendarDto
		{
			HolidayId = h.HolidayId,
			Name = h.Name,
			Type = h.Type,
			FromDate = h.FromDate.ToString("yyyy-MM-dd"),
			ToDate = h.ToDate.ToString("yyyy-MM-dd"),
			ApplicableBranch = h.ApplicableBranch,
			Description = h.Description
		}).ToList();
	}

	public async Task<HolidayCalendarDto> CreateHolidayAsync(HolidayCalendarDto dto)
	{
		DateTime from = DateTime.TryParse(dto.FromDate, out var f) ? f : DateTime.UtcNow;
		DateTime to = DateTime.TryParse(dto.ToDate, out var t) ? t : DateTime.UtcNow;

		var holiday = new HolidayCalendar
		{
			Name = dto.Name,
			Type = dto.Type,
			FromDate = from,
			ToDate = to,
			ApplicableBranch = dto.ApplicableBranch,
			Description = dto.Description
		};

		await _schoolRepository.AddHolidayAsync(holiday);
		await _schoolRepository.SaveChangesAsync();

		dto.HolidayId = holiday.HolidayId;
		return dto;
	}

	public async Task<bool> DeleteHolidayAsync(int id)
	{
		var holiday = await _schoolRepository.GetHolidayByIdAsync(id)
			?? throw new NotFoundException($"Holiday with ID {id} not found.");

		_schoolRepository.RemoveHoliday(holiday);
		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	// --- STUDENT MANAGEMENT ---
	public async Task<PagedStudentResponseDto> GetAllStudentsAsync(StudentFilterDto filter)
	{
		filter ??= new StudentFilterDto();
		filter.PageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
		filter.PageSize = filter.PageSize is < 1 or > 10000 ? 10000 : filter.PageSize;

		return await _schoolRepository.GetAllStudentsAsync(filter);
	}

	public async Task<StudentDetailsDto> GetStudentByIdAsync(int studentId)
	{
		if (studentId <= 0)
			throw new InvalidOperationException("A valid student ID is required.");

		return await _schoolRepository.GetStudentByIdAsync(studentId)
			?? throw new NotFoundException($"Student with ID '{studentId}' not found.");
	}

	public async Task<StudentDetailsDto> CreateStudentAsync(CreateStudentDto dto)
	{
		await ValidateStudentReferencesAsync(
			dto.BranchId,
			dto.AcademicYearId,
			dto.ClassId,
			dto.SectionId);

		var admissionNumber = dto.AdmissionNumber.Trim();
		var rollNumber = dto.RollNumber.Trim();

		if (await _schoolRepository.AdmissionNumberExistsAsync(admissionNumber))
			throw new InvalidOperationException($"Admission number '{admissionNumber}' already exists.");

		if (await _schoolRepository.RollNumberExistsAsync(
			rollNumber,
			dto.AcademicYearId,
			dto.ClassId,
			dto.SectionId))
		{
			throw new InvalidOperationException(
				$"Roll number '{rollNumber}' already exists for the selected academic year, class, and section.");
		}

		var student = new Student
		{
			AdmissionNumber = admissionNumber,
			RollNumber = rollNumber,
			StudentName = dto.StudentName.Trim(),
			DateOfBirth = dto.DateOfBirth,
			Gender = Clean(dto.Gender),
			FatherName = Clean(dto.FatherName),
			FatherMobile = Clean(dto.FatherMobile),
			MotherName = Clean(dto.MotherName),
			MotherMobile = Clean(dto.MotherMobile),
			Email = Clean(dto.Email),
			MobileNumber = Clean(dto.MobileNumber),
			Address = Clean(dto.Address),
			BranchId = dto.BranchId,
			AcademicYearId = dto.AcademicYearId,
			ClassId = dto.ClassId,
			SectionId = dto.SectionId,
			Status = NormalizeStudentStatus(dto.Status),
			IsDeleted = false,
			CreatedAt = DateTime.UtcNow
		};

		await _schoolRepository.AddStudentAsync(student);
		await _schoolRepository.SaveChangesAsync();

		return await GetStudentByIdAsync(student.StudentId);
	}

	public async Task<StudentDetailsDto> UpdateStudentAsync(int studentId, UpdateStudentDto dto)
	{
		var student = await _schoolRepository.GetStudentEntityByIdAsync(studentId)
			?? throw new NotFoundException($"Student with ID '{studentId}' not found.");

		await ValidateStudentReferencesAsync(
			dto.BranchId,
			dto.AcademicYearId,
			dto.ClassId,
			dto.SectionId);

		var admissionNumber = dto.AdmissionNumber.Trim();
		var rollNumber = dto.RollNumber.Trim();

		if (await _schoolRepository.AdmissionNumberExistsAsync(admissionNumber, studentId))
			throw new InvalidOperationException($"Admission number '{admissionNumber}' already exists.");

		if (await _schoolRepository.RollNumberExistsAsync(
			rollNumber,
			dto.AcademicYearId,
			dto.ClassId,
			dto.SectionId,
			studentId))
		{
			throw new InvalidOperationException(
				$"Roll number '{rollNumber}' already exists for the selected academic year, class, and section.");
		}

		student.AdmissionNumber = admissionNumber;
		student.RollNumber = rollNumber;
		student.StudentName = dto.StudentName.Trim();
		student.DateOfBirth = dto.DateOfBirth;
		student.Gender = Clean(dto.Gender);
		student.FatherName = Clean(dto.FatherName);
		student.FatherMobile = Clean(dto.FatherMobile);
		student.MotherName = Clean(dto.MotherName);
		student.MotherMobile = Clean(dto.MotherMobile);
		student.Email = Clean(dto.Email);
		student.MobileNumber = Clean(dto.MobileNumber);
		student.Address = Clean(dto.Address);
		student.BranchId = dto.BranchId;
		student.AcademicYearId = dto.AcademicYearId;
		student.ClassId = dto.ClassId;
		student.SectionId = dto.SectionId;
		student.Status = NormalizeStudentStatus(dto.Status);
		student.UpdatedAt = DateTime.UtcNow;

		await _schoolRepository.SaveChangesAsync();
		return await GetStudentByIdAsync(studentId);
	}

	public async Task<bool> UpdateStudentStatusAsync(int studentId, UpdateStudentStatusDto dto)
	{
		var student = await _schoolRepository.GetStudentEntityByIdAsync(studentId)
			?? throw new NotFoundException($"Student with ID '{studentId}' not found.");

		student.Status = NormalizeStudentStatus(dto.Status);
		student.UpdatedAt = DateTime.UtcNow;

		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteStudentAsync(int studentId)
	{
		var student = await _schoolRepository.GetStudentEntityByIdAsync(studentId)
			?? throw new NotFoundException($"Student with ID '{studentId}' not found.");

		student.IsDeleted = true;
		student.Status = "Inactive";
		student.UpdatedAt = DateTime.UtcNow;

		await _schoolRepository.SaveChangesAsync();
		return true;
	}

	public Task<List<StudentDropdownDto>> GetAcademicYearDropdownAsync(string? search)
		=> _schoolRepository.GetAcademicYearDropdownAsync(search);

	public Task<List<StudentDropdownDto>> GetClassDropdownAsync(string? search)
		=> _schoolRepository.GetClassDropdownAsync(search);

	public async Task<List<StudentDropdownDto>> GetSectionDropdownAsync(int classId, string? search)
	{
		if (!await _schoolRepository.ClassGradeExistsAsync(classId))
			throw new NotFoundException($"Class with ID '{classId}' not found.");

		return await _schoolRepository.GetSectionDropdownAsync(classId, search);
	}

	private async Task ValidateStudentReferencesAsync(
		int branchId,
		int academicYearId,
		int classId,
		int sectionId)
	{
		if (!await _schoolRepository.BranchExistsAsync(branchId))
			throw new NotFoundException($"Branch with ID '{branchId}' not found.");

		if (!await _schoolRepository.AcademicYearExistsAsync(academicYearId))
			throw new NotFoundException($"Academic year with ID '{academicYearId}' not found.");

		if (!await _schoolRepository.ClassGradeExistsAsync(classId))
			throw new NotFoundException($"Class with ID '{classId}' not found.");

		if (!await _schoolRepository.SectionBelongsToClassAsync(sectionId, classId))
			throw new InvalidOperationException(
				$"Section with ID '{sectionId}' does not belong to class ID '{classId}'.");
	}

	private static string NormalizeStudentStatus(string? status)
	{
		if (string.IsNullOrWhiteSpace(status))
			return "Active";

		if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
			return "Active";

		if (status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
			return "Inactive";

		throw new InvalidOperationException("Student status must be either 'Active' or 'Inactive'.");
	}

	private static string? Clean(string? value)
		=> string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}