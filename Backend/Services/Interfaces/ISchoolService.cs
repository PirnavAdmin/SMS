namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface ISchoolService
{
    // Staff Operations
    Task<List<StaffResponseDto>> GetAllStaffAsync(string? search, string? department);
    Task<StaffResponseDto> GetStaffByIdAsync(int id);
    Task<List<StaffDropdownDto>> GetTeachersForDropdownAsync(string? search);
    Task<StaffResponseDto> CreateStaffAsync(StaffCreateDto dto);
    Task<StaffResponseDto> UpdateStaffAsync(int id, StaffCreateDto dto);
    Task<bool> DeleteStaffAsync(int id);

    // Department Operations
    Task<List<DepartmentDto>> GetAllDepartmentsAsync(string? search);
    Task<DepartmentDto> GetDepartmentByIdAsync(int id);
    Task<DepartmentDto> GetDepartmentByIdAsync(string idOrCode);
    Task<List<DepartmentDropdownDto>> GetActiveDepartmentsDropdownAsync(string? search);
    Task<List<SubjectDto>> GetSubjectsByDepartmentIdAsync(int departmentId);
    Task<List<SubjectDto>> GetSubjectsByDepartmentIdAsync(string idOrCode);
    Task<DepartmentDto> CreateDepartmentAsync(CreateDepartmentDto dto);
    Task<DepartmentDto> UpdateDepartmentAsync(int id, CreateDepartmentDto dto);
    Task<DepartmentDto> UpdateDepartmentAsync(string idOrCode, CreateDepartmentDto dto);
    Task<bool> DeleteDepartmentAsync(int id);
    Task<bool> DeleteDepartmentAsync(string idOrCode);

    // Subject Operations
    Task<List<SubjectDto>> GetAllSubjectsAsync(string? search);
    Task<SubjectDto> GetSubjectByIdAsync(int id);
    Task<List<SubjectDropdownDto>> GetSubjectsDropdownAsync(string? search);
    Task<SubjectDto> CreateSubjectAsync(CreateSubjectDto dto);
    Task<SubjectDto> UpdateSubjectAsync(int id, CreateSubjectDto dto);
    Task<bool> DeleteSubjectAsync(int id);

    // Academic Class Operations
    Task<List<ClassGradeResponseDto>> GetAllClassesAsync();
    Task<ClassGradeResponseDto> GetClassByIdAsync(int id);
    Task<bool> CreateClassGradeAsync(CreateClassGradeDto dto);
    Task<bool> UpdateClassGradeAsync(int id, CreateClassGradeDto dto);
    Task<bool> DeleteClassGradeAsync(int id);

    // Admission Application Operations
    Task<List<AdmissionApplicationResponseDto>> GetAllApplicationsAsync(string? search, string? branch, int? classId, string? status);
    Task<AdmissionApplicationResponseDto> GetApplicationByIdAsync(int id);
    Task<AdmissionApplicationResponseDto> SubmitApplicationAsync(SubmitAdmissionDto dto);
    Task<AdmissionApplicationResponseDto> UpdateApplicationAsync(int id, SubmitAdmissionDto dto);
    Task<bool> DeleteApplicationAsync(int id);
    Task<bool> RejectApplicationAsync(int id);
    Task<bool> EnrollStudentAsync(int id);
    Task<bool> UpdateApplicationStatusAsync(int id, string status);
}