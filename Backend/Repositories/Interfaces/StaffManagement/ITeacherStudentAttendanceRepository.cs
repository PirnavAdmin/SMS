namespace SMS.Api.Repositories.Interfaces.StaffManagement;

using SMS.Api.Dtos;

public interface ITeacherStudentAttendanceRepository
{
    Task<int> GetActiveTeacherStaffIdByEmailAsync(string email);
    Task<List<AttendanceDropdownDto>> GetBranchesAsync(int staffId);
    Task<List<AttendanceDropdownDto>> GetAcademicYearsAsync(int staffId);
    Task<List<AttendanceDropdownDto>> GetClassesAsync(int staffId, int branchId, int academicYearId);
    Task<List<AttendanceDropdownDto>> GetSectionsAsync(int staffId, int classId);
    Task<List<AttendanceDropdownDto>> GetSubjectsAsync(int staffId, int classId, int sectionId);
    Task<List<AttendancePeriodDropdownDto>> GetPeriodsAsync(
        int staffId, DateTime date, int classId, int sectionId, int subjectId);
    Task<TeacherAttendanceSheetResponseDto> GetSheetAsync(
        int staffId, TeacherAttendanceSheetQueryDto query);
    Task<SaveTeacherAttendanceResponseDto> SaveSheetAsync(
        int staffId, SaveTeacherAttendanceSheetDto dto);
    Task<AttendanceLockResponseDto> SetLockAsync(
        int staffId, int attendanceSessionId, bool isLocked);
}

