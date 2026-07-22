using SMS.Api.Dtos;
using SMS.Api.Models;

namespace SMS.Api.Services.Interfaces
{
    public interface ISchoolService
    {
        Task<IEnumerable<Subject>> GetAllSubjectsAsync();
        Task CreateSubjectAsync(CreateSubjectDto dto);
        Task UpdateSubjectAsync(string id, UpdateSubjectDto dto);

        Task<IEnumerable<Staff>> GetStaffDirectoryAsync(string? search, string? department);
        Task RegisterStaffAsync(RegisterStaffDto dto);

        Task<object> GetClassesOverviewAsync();
        Task<long> CreateClassGradeAsync(CreateClassDto dto);

        Task<IEnumerable<AdmissionApplication>> GetAdmissionsAsync(string? search, string? status, string? appliedClass);
        Task<string> SubmitAdmissionAsync(CreateAdmissionDto dto);
        Task UpdateAdmissionStatusAsync(string registrationNo, string status);
    }
}