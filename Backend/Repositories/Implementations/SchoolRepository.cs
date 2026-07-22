using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class SchoolRepository : ISchoolRepository
    {
        private readonly AppDbContext _context;

        public SchoolRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Subject>> GetAllSubjectsAsync() =>
            await _context.Subjects.OrderByDescending(s => s.CreatedAt).ToListAsync();

        public async Task<Subject?> GetSubjectByIdAsync(string id) =>
            await _context.Subjects.FindAsync(id);

        public async Task AddSubjectAsync(Subject subject) =>
            await _context.Subjects.AddAsync(subject);

        public async Task UpdateSubjectAsync(Subject subject) =>
            await Task.FromResult(_context.Subjects.Update(subject));

        public async Task<IEnumerable<Staff>> GetStaffAsync(string? search, string? department)
        {
            var query = _context.Staff.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(s => s.FirstName.Contains(search) || s.LastName.Contains(search) || s.EmpId.Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(department) && department != "All Departments")
            {
                query = query.Where(s => s.Department == department);
            }

            return await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        }

        public async Task<Staff?> GetStaffByEmpIdAsync(string empId) =>
            await _context.Staff.FindAsync(empId);

        public async Task AddStaffAsync(Staff staff) =>
            await _context.Staff.AddAsync(staff);

        public async Task<IEnumerable<ClassGrade>> GetClassesWithDetailsAsync() =>
            await _context.Classes
                .Include(c => c.Sections)
                    .ThenInclude(s => s.ClassTeacher)
                .Include(c => c.CurriculumSubjects)
                    .ThenInclude(cs => cs.Subject)
                .ToListAsync();

        public async Task AddClassGradeAsync(ClassGrade classGrade) =>
            await _context.Classes.AddAsync(classGrade);

        public async Task AddSectionsAsync(IEnumerable<ClassSection> sections) =>
            await _context.ClassSections.AddRangeAsync(sections);

        public async Task AddCurriculumSubjectsAsync(IEnumerable<ClassCurriculumSubject> curriculumSubjects) =>
            await _context.ClassCurriculumSubjects.AddRangeAsync(curriculumSubjects);

        public async Task<IEnumerable<AdmissionApplication>> GetAdmissionsAsync(string? search, string? status, string? appliedClass)
        {
            var query = _context.AdmissionApplications.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(a => a.RegistrationNo.Contains(search) || a.ApplicantFullName.Contains(search) || a.FatherFullName.Contains(search));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All Status")
            {
                query = query.Where(a => a.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(appliedClass) && appliedClass != "All Classes")
            {
                query = query.Where(a => a.AppliedClass == appliedClass);
            }

            return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        }

        public async Task<AdmissionApplication?> GetAdmissionByRegistrationNoAsync(string registrationNo) =>
            await _context.AdmissionApplications.FirstOrDefaultAsync(a => a.RegistrationNo == registrationNo);

        public async Task AddAdmissionApplicationAsync(AdmissionApplication application) =>
            await _context.AdmissionApplications.AddAsync(application);

        public async Task UpdateAdmissionStatusAsync(AdmissionApplication application) =>
            await Task.FromResult(_context.AdmissionApplications.Update(application));

        public async Task<bool> SaveChangesAsync() =>
            (await _context.SaveChangesAsync()) > 0;
    }
}