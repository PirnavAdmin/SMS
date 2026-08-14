namespace SMS.Api.Services.Interfaces.StaffManagement;

using SMS.Api.Dtos;

public interface ITeacherStudentAttendanceService
{
    Task<List<AttendanceDropdownDto>> GetBranchesAsync(string teacherEmail);
    Task<List<AttendanceDropdownDto>> GetAcademicYearsAsync(string teacherEmail);
    Task<List<AttendanceDropdownDto>> GetClassesAsync(
        string teacherEmail, int branchId, int academicYearId);
    Task<List<AttendanceDropdownDto>> GetSectionsAsync(
        string teacherEmail, int classId);
    Task<List<AttendanceDropdownDto>> GetSubjectsAsync(
        string teacherEmail, int classId, int sectionId);
    Task<List<AttendancePeriodDropdownDto>> GetPeriodsAsync(
        string teacherEmail, DateTime date, int classId, int sectionId, int subjectId);
    Task<TeacherAttendanceSheetResponseDto> GetSheetAsync(
        string teacherEmail, TeacherAttendanceSheetQueryDto query);
    Task<SaveTeacherAttendanceResponseDto> SaveSheetAsync(
        string teacherEmail, SaveTeacherAttendanceSheetDto dto);
    Task<AttendanceLockResponseDto> LockAsync(
        string teacherEmail, int attendanceSessionId);
    Task<AttendanceLockResponseDto> UnlockAsync(
        string teacherEmail, int attendanceSessionId);
}

