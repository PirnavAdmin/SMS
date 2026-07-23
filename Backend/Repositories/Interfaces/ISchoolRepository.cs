namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface ISchoolRepository
{
    // Staff Operations
    Task<List<Staff>> GetAllStaffAsync(string? search, string? department);
    Task<Staff?> GetStaffByIdAsync(int id);
    Task<List<Staff>> GetTeachersForDropdownAsync(string? search);
    Task AddStaffAsync(Staff staff);
    void RemoveStaff(Staff staff);

    // Subject Operations
    Task<List<Subject>> GetAllSubjectsAsync(string? search);
    Task<Subject?> GetSubjectByIdAsync(int id);
    Task AddSubjectAsync(Subject subject);
    void RemoveSubject(Subject subject);

    // Class Grade & Section Operations
    Task<List<ClassGrade>> GetAllClassGradesAsync();
    Task<ClassGrade?> GetClassGradeByIdAsync(int id);
    Task AddClassGradeAsync(ClassGrade classGrade);
    void RemoveClassGrade(ClassGrade classGrade);

    // Admissions Operations
    Task<List<AdmissionApplication>> GetAllApplicationsAsync(string? search, string? branch, int? classId, string? status);
    Task<AdmissionApplication?> GetApplicationByIdAsync(int id);
    Task AddApplicationAsync(AdmissionApplication application);
    void RemoveApplication(AdmissionApplication application);

    Task SaveChangesAsync();
}