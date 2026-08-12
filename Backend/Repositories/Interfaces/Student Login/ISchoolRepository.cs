namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface ISchoolRepository
{
    // Staff & Teacher Operations
    Task<List<Staff>> GetAllStaffAsync(string? search, string? department);
    Task<Staff?> GetStaffByIdAsync(int id);
    Task<List<Staff>> GetTeachersForDropdownAsync(string? search);
    Task<List<Staff>> GetAllTeachersAsync(string? search, string? subject);
    Task AddStaffAsync(Staff staff);
    void RemoveStaff(Staff staff);
    Task<List<string>> GetAllEmployeeIdsAsync();

    // Department Operations
    Task<List<Department>> GetAllDepartmentsAsync(string? search);
    Task<Department?> GetDepartmentByIdAsync(int id);
    Task<Department?> GetDepartmentByIdOrCodeAsync(string idOrCode);
    Task<List<Department>> GetActiveDepartmentsDropdownAsync(string? search);
    Task<List<Subject>> GetSubjectsByDepartmentIdAsync(int departmentId);
    Task AddDepartmentAsync(Department department);
    void RemoveDepartment(Department department);
    Task<bool> DepartmentHasSubjectsAsync(int departmentId);

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

    // Staff Attendance Operations
    Task<List<StaffAttendance>> GetStaffAttendanceAsync(DateTime date, string? department);
    Task<List<StaffAttendance>> GetStaffAttendanceMonthlyAsync(int month, int year, string? department);
    Task AddStaffAttendanceRangeAsync(IEnumerable<StaffAttendance> attendances);

    // Leave Management Operations
    Task<List<LeaveTypeConfig>> GetAllLeaveTypesAsync();
    Task<LeaveTypeConfig?> GetLeaveTypeByIdAsync(int id);
    Task AddLeaveTypeAsync(LeaveTypeConfig leaveType);
    Task<List<LeaveApplication>> GetAllLeaveApplicationsAsync(string? status);
    Task<LeaveApplication?> GetLeaveApplicationByIdAsync(int id);
    Task AddLeaveApplicationAsync(LeaveApplication leaveApplication);

    // Holiday Calendar Operations
    Task<List<HolidayCalendar>> GetAllHolidaysAsync();
    Task<HolidayCalendar?> GetHolidayByIdAsync(int id);
    Task AddHolidayAsync(HolidayCalendar holiday);
    void RemoveHoliday(HolidayCalendar holiday);

    // Student Management Operations
    Task<PagedStudentResponseDto> GetAllStudentsAsync(StudentFilterDto filter);
    Task<StudentDetailsDto?> GetStudentByIdAsync(int studentId);
    Task<Student?> GetStudentEntityByIdAsync(int studentId);
    Task<bool> AdmissionNumberExistsAsync(string admissionNumber, int? excludeStudentId = null);
    Task<bool> RollNumberExistsAsync(string rollNumber, int academicYearId, int classId, int sectionId, int? excludeStudentId = null);
    Task<bool> BranchExistsAsync(int branchId);
    Task<bool> AcademicYearExistsAsync(int academicYearId);
    Task<bool> ClassGradeExistsAsync(int classId);
    Task<bool> SectionBelongsToClassAsync(int sectionId, int classId);
    Task AddStudentAsync(Student student);
    void RemoveStudent(Student student);
    Task<List<StudentDropdownDto>> GetAcademicYearDropdownAsync(string? search);
    Task<List<StudentDropdownDto>> GetClassDropdownAsync(string? search);
    Task<List<StudentDropdownDto>> GetSectionDropdownAsync(int classId, string? search);

    Task SaveChangesAsync();
}