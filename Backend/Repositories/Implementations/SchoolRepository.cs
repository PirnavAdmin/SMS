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
			query = query.Where(s => s.Department.ToLower() == department.ToLower());

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(s => s.FirstName.Contains(search) || s.LastName.Contains(search) || s.EmployeeId.Contains(search));

		return await query.ToListAsync();
	}

	public async Task<Staff?> GetStaffByIdAsync(int id) => await _context.Staff.FindAsync(id);

	public async Task<List<Staff>> GetTeachersForDropdownAsync(string? search)
	{
		var query = _context.Staff.AsNoTracking().Where(s => s.IsActive).AsQueryable();

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(s => s.FirstName.Contains(search) || s.LastName.Contains(search) || s.EmployeeId.Contains(search));

		return await query.ToListAsync();
	}

	public async Task AddStaffAsync(Staff staff) => await _context.Staff.AddAsync(staff);

	public void RemoveStaff(Staff staff) => _context.Staff.Remove(staff);

	// --- SUBJECTS ---
	public async Task<List<Subject>> GetAllSubjectsAsync(string? search)
	{
		var query = _context.Subjects.AsNoTracking().AsQueryable();

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(s => s.SubjectName.Contains(search) || s.SubjectCode.Contains(search) || s.CourseCode.Contains(search));

		return await query.ToListAsync();
	}

	public async Task<Subject?> GetSubjectByIdAsync(int id) => await _context.Subjects.FindAsync(id);

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
			query = query.Where(a => a.BranchName.ToLower() == branch.ToLower());

		if (classId.HasValue && classId.Value > 0)
			query = query.Where(a => a.AppliedClassId == classId.Value);

		if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Status", System.StringComparison.OrdinalIgnoreCase))
			query = query.Where(a => a.Status.ToLower() == status.ToLower());

		if (!string.IsNullOrWhiteSpace(search))
			query = query.Where(a => a.FirstName.Contains(search) || a.LastName.Contains(search) || a.RegistrationNo.Contains(search) || a.FatherName.Contains(search));

		return await query.ToListAsync();
	}

	public async Task<AdmissionApplication?> GetApplicationByIdAsync(int id) =>
		await _context.AdmissionApplications.Include(a => a.AppliedClass).FirstOrDefaultAsync(a => a.Id == id);

	public async Task AddApplicationAsync(AdmissionApplication application) =>
		await _context.AdmissionApplications.AddAsync(application);

	public void RemoveApplication(AdmissionApplication application) => _context.AdmissionApplications.Remove(application);

	public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}