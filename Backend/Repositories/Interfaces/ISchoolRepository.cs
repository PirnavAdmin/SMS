using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces
{
    public interface ISchoolRepository
    {
        Task<IEnumerable<Subject>> GetAllSubjectsAsync();
        Task<Subject?> GetSubjectByIdAsync(string id);
        Task AddSubjectAsync(Subject subject);
        Task UpdateSubjectAsync(Subject subject);

        Task<IEnumerable<Staff>> GetStaffAsync(string? search, string? department);
        Task<Staff?> GetStaffByEmpIdAsync(string empId);
        Task AddStaffAsync(Staff staff);

        Task<IEnumerable<ClassGrade>> GetClassesWithDetailsAsync();
        Task AddClassGradeAsync(ClassGrade classGrade);
        Task AddSectionsAsync(IEnumerable<ClassSection> sections);
        Task AddCurriculumSubjectsAsync(IEnumerable<ClassCurriculumSubject> curriculumSubjects);

        Task<IEnumerable<AdmissionApplication>> GetAdmissionsAsync(string? search, string? status, string? appliedClass);
        Task<AdmissionApplication?> GetAdmissionByRegistrationNoAsync(string registrationNo);
        Task AddAdmissionApplicationAsync(AdmissionApplication application);
        Task UpdateAdmissionStatusAsync(AdmissionApplication application);

        Task<bool> SaveChangesAsync();
    }
}