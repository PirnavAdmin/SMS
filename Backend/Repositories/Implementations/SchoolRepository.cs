namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class SchoolRepository : ISchoolRepository
{
	private readonly AppDbContext _context;

	public SchoolRepository(AppDbContext context)
	{
		_context = context;
	}

	// --- STAFF ---
	public async Task<List<Staff>> GetAllStaffAsync(string? search, string? department)
	{
		var query = _context.Staff.AsNoTracking().AsQueryable();

		if (!string.IsNullOrWhiteSpace(department) && !department.Equals("All Departments", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(s => s.Department != null && s.Department.ToLower() == department.ToLower());

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(s => (s.FirstName != null && s.FirstName.Contains(search)) || (s.LastName != null && s.LastName.Contains(search)) || (s.EmployeeId != null && s.EmployeeId.Contains(search)));

		return await query.ToListAsync();
	}

	public async Task<Staff?> GetStaffByIdAsync(int id) => await _context.Staff.FindAsync(id);

	public async Task<List<Staff>> GetTeachersForDropdownAsync(string? search)
	{
		var query = _context.Staff.AsNoTracking().Where(s => s.IsActive == true).AsQueryable();

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(s => (s.FirstName != null && s.FirstName.Contains(search)) || (s.LastName != null && s.LastName.Contains(search)) || (s.EmployeeId != null && s.EmployeeId.Contains(search)));

		return await query.ToListAsync();
	}

	public async Task AddStaffAsync(Staff staff) => await _context.Staff.AddAsync(staff);

	public void RemoveStaff(Staff staff) => _context.Staff.Remove(staff);

	// --- DEPARTMENTS ---
	public async Task<List<Department>> GetAllDepartmentsAsync(string? search)
	{
		var query = _context.Departments.Include(d => d.Subjects).AsNoTracking().AsQueryable();

		if (!string.IsNullOrWhiteSpace(search))
		{
			query = query.Where(d => d.DepartmentName.Contains(search) || 
			                         (d.DepartmentCode != null && d.DepartmentCode.Contains(search)) || 
			                         (d.Description != null && d.Description.Contains(search)));
		}

		return await query.OrderByDescending(d => d.CreatedDate).ToListAsync();
	}

	public async Task<Department?> GetDepartmentByIdAsync(int id)
	{
		return await _context.Departments.Include(d => d.Subjects).FirstOrDefaultAsync(d => d.DepartmentId == id);
	}

	public async Task<Department?> GetDepartmentByIdOrCodeAsync(string idOrCode)
	{
		if (string.IsNullOrWhiteSpace(idOrCode)) return null;

		var cleanInput = idOrCode.Trim();

		// 1. Exact numeric ID lookup
		if (int.TryParse(cleanInput, out int id))
		{
			var deptById = await _context.Departments.Include(d => d.Subjects).FirstOrDefaultAsync(d => d.DepartmentId == id);
			if (deptById != null) return deptById;
		}

		// 2. DepartmentCode or DepartmentName lookup (exact & space-normalized)
		var deptByCode = await _context.Departments.Include(d => d.Subjects)
			.FirstOrDefaultAsync(d => (d.DepartmentCode != null && (d.DepartmentCode.ToLower() == cleanInput.ToLower() || d.DepartmentCode.Replace(" ", "").ToLower() == cleanInput.Replace(" ", "").ToLower())) ||
			                          d.DepartmentName.ToLower() == cleanInput.ToLower());
		if (deptByCode != null) return deptByCode;

		// 3. Extracted numeric digits fallback (e.g., DEPT-005 or DEPT-5 -> 5)
		var digitsOnly = new string(cleanInput.Where(char.IsDigit).ToArray());
		if (!string.IsNullOrEmpty(digitsOnly) && int.TryParse(digitsOnly, out int extractedId))
		{
			return await _context.Departments.Include(d => d.Subjects).FirstOrDefaultAsync(d => d.DepartmentId == extractedId);
		}

		return null;
	}

	public async Task<List<Department>> GetActiveDepartmentsDropdownAsync(string? search)
	{
		var query = _context.Departments.AsNoTracking().Where(d => d.Status == "Active");

		if (!string.IsNullOrWhiteSpace(search))
		{
			query = query.Where(d => d.DepartmentName.Contains(search) || 
			                         (d.DepartmentCode != null && d.DepartmentCode.Contains(search)));
		}

		return await query.OrderBy(d => d.DepartmentName).ToListAsync();
	}

	public async Task<List<Subject>> GetSubjectsByDepartmentIdAsync(int departmentId)
	{
		return await _context.Subjects
			.Include(s => s.Department)
			.AsNoTracking()
			.Where(s => s.DepartmentId == departmentId)
			.OrderBy(s => s.SubjectName)
			.ToListAsync();
	}

	public async Task AddDepartmentAsync(Department department) => await _context.Departments.AddAsync(department);

	public void RemoveDepartment(Department department) => _context.Departments.Remove(department);

	public async Task<bool> DepartmentHasSubjectsAsync(int departmentId)
	{
		return await _context.Subjects.AnyAsync(s => s.DepartmentId == departmentId);
	}

	// --- SUBJECTS ---
	public async Task<List<Subject>> GetAllSubjectsAsync(string? search)
	{
		var query = _context.Subjects.Include(s => s.Department).AsNoTracking().AsQueryable();

		if (!string.IsNullOrWhiteSpace(search))
		{
			query = query.Where(s => (s.SubjectName != null && s.SubjectName.Contains(search)) || 
			                         (s.SubjectCode != null && s.SubjectCode.Contains(search)) || 
			                         (s.CourseCode != null && s.CourseCode.Contains(search)) || 
			                         (s.Department != null && s.Department.DepartmentName != null && s.Department.DepartmentName.Contains(search)));
		}

		return await query.OrderBy(s => s.SubjectName).ToListAsync();
	}

	public async Task<Subject?> GetSubjectByIdAsync(int id) => 
		await _context.Subjects.Include(s => s.Department).FirstOrDefaultAsync(s => s.SubjectId == id);

	public async Task AddSubjectAsync(Subject subject) => await _context.Subjects.AddAsync(subject);

	public void RemoveSubject(Subject subject) => _context.Subjects.Remove(subject);

	// --- CLASS GRADES & SECTIONS ---
	public async Task<List<ClassGrade>> GetAllClassGradesAsync()
	{
		return await _context.Classes
			.AsNoTracking()
			.Include(c => c.Sections).ThenInclude(s => s.ClassTeacher)
			.Include(c => c.CurriculumSubjects).ThenInclude(cs => cs.Subject)
			.ToListAsync();
	}

	public async Task<ClassGrade?> GetClassGradeByIdAsync(int id) =>
		await _context.Classes
			.Include(c => c.Sections)
			.Include(c => c.CurriculumSubjects)
			.FirstOrDefaultAsync(c => c.ClassId == id);

	public async Task AddClassGradeAsync(ClassGrade classGrade) => await _context.Classes.AddAsync(classGrade);

	public void RemoveClassGrade(ClassGrade classGrade) => _context.Classes.Remove(classGrade);

	// --- ADMISSIONS ---
	public async Task<List<AdmissionApplication>> GetAllApplicationsAsync(string? search, string? branch, int? classId, string? status)
	{
		var query = _context.AdmissionApplications
			.AsNoTracking()
			.Include(a => a.AppliedClass)
			.AsQueryable();

		if (!string.IsNullOrWhiteSpace(branch) && !branch.Equals("All Branches", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(a => a.BranchName != null && a.BranchName.ToLower() == branch.ToLower());

		if (classId.HasValue && classId.Value > 0)
			query = query.Where(a => a.AppliedClassId == classId.Value);

		if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Status", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(a => a.Status != null && a.Status.ToLower() == status.ToLower());

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(a => (a.FirstName != null && a.FirstName.Contains(search)) || (a.LastName != null && a.LastName.Contains(search)) || (a.RegistrationNo != null && a.RegistrationNo.Contains(search)) || (a.FatherName != null && a.FatherName.Contains(search)));

		return await query.ToListAsync();
	}

	public async Task<AdmissionApplication?> GetApplicationByIdAsync(int id) =>
		await _context.AdmissionApplications.Include(a => a.AppliedClass).FirstOrDefaultAsync(a => a.Id == id);

	public async Task AddApplicationAsync(AdmissionApplication application) =>
		await _context.AdmissionApplications.AddAsync(application);

	public void RemoveApplication(AdmissionApplication application) => _context.AdmissionApplications.Remove(application);

	public async Task<List<string>> GetAllEmployeeIdsAsync()
	{
		return await _context.Staff
			.AsNoTracking()
			.Where(s => s.EmployeeId != null)
			.Select(s => s.EmployeeId!)
			.ToListAsync();
	}

	// --- STAFF ATTENDANCE ---
	public async Task<List<StaffAttendance>> GetStaffAttendanceAsync(System.DateTime date, string? department)
	{
		var query = _context.StaffAttendances
			.AsNoTracking()
			.Include(sa => sa.Staff)
			.Where(sa => sa.Date.Date == date.Date)
			.AsQueryable();

		if (!string.IsNullOrWhiteSpace(department) && !department.Equals("All Departments", System.StringComparison.OrdinalIgnoreCase) && !department.Equals("All", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(sa => sa.Department != null && sa.Department.ToLower() == department.ToLower());

		return await query.ToListAsync();
	}

	public async Task<List<StaffAttendance>> GetStaffAttendanceMonthlyAsync(int month, int year, string? department)
	{
		var query = _context.StaffAttendances
			.AsNoTracking()
			.Include(sa => sa.Staff)
			.Where(sa => sa.Date.Month == month && sa.Date.Year == year)
			.AsQueryable();

		if (!string.IsNullOrWhiteSpace(department) && !department.Equals("All Departments", System.StringComparison.OrdinalIgnoreCase) && !department.Equals("All", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(sa => sa.Department != null && sa.Department.ToLower() == department.ToLower());

		return await query.ToListAsync();
	}

	public async Task AddStaffAttendanceRangeAsync(IEnumerable<StaffAttendance> attendances)
	{
		await _context.StaffAttendances.AddRangeAsync(attendances);
	}

	// --- LEAVE MANAGEMENT ---
	public async Task<List<LeaveTypeConfig>> GetAllLeaveTypesAsync()
	{
		return await _context.LeaveTypeConfigs.AsNoTracking().ToListAsync();
	}

	public async Task<LeaveTypeConfig?> GetLeaveTypeByIdAsync(int id)
	{
		return await _context.LeaveTypeConfigs.FindAsync(id);
	}

	public async Task AddLeaveTypeAsync(LeaveTypeConfig leaveType)
	{
		await _context.LeaveTypeConfigs.AddAsync(leaveType);
	}

	public async Task<List<LeaveApplication>> GetAllLeaveApplicationsAsync(string? status)
	{
		var query = _context.LeaveApplications
			.AsNoTracking()
			.Include(l => l.Staff)
			.Include(l => l.LeaveType)
			.AsQueryable();

		if (!string.IsNullOrWhiteSpace(status))
			query = query.Where(l => l.Status.ToLower() == status.ToLower());

		return await query.OrderByDescending(l => l.AppliedDate).ToListAsync();
	}

	public async Task<LeaveApplication?> GetLeaveApplicationByIdAsync(int id)
	{
		return await _context.LeaveApplications
			.Include(l => l.Staff)
			.Include(l => l.LeaveType)
			.FirstOrDefaultAsync(l => l.LeaveApplicationId == id);
	}

	public async Task AddLeaveApplicationAsync(LeaveApplication leaveApplication)
	{
		await _context.LeaveApplications.AddAsync(leaveApplication);
	}

	// --- HOLIDAY CALENDAR ---
	public async Task<List<HolidayCalendar>> GetAllHolidaysAsync()
	{
		return await _context.HolidayCalendars.AsNoTracking().OrderBy(h => h.FromDate).ToListAsync();
	}

	public async Task<HolidayCalendar?> GetHolidayByIdAsync(int id)
	{
		return await _context.HolidayCalendars.FindAsync(id);
	}

	public async Task AddHolidayAsync(HolidayCalendar holiday)
	{
		await _context.HolidayCalendars.AddAsync(holiday);
	}

	public void RemoveHoliday(HolidayCalendar holiday)
	{
		_context.HolidayCalendars.Remove(holiday);
	}

	public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}