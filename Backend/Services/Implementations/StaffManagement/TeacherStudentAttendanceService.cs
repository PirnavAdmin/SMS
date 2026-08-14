namespace SMS.Api.Services.Implementations.StaffManagement;

using SMS.Api.Dtos;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TeacherStudentAttendanceService
    : ITeacherStudentAttendanceService
{
    private readonly ITeacherStudentAttendanceRepository _repository;

    public TeacherStudentAttendanceService(
        ITeacherStudentAttendanceRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AttendanceDropdownDto>> GetBranchesAsync(string teacherEmail) =>
        await _repository.GetBranchesAsync(await GetStaffIdAsync(teacherEmail));

    public async Task<List<AttendanceDropdownDto>> GetAcademicYearsAsync(string teacherEmail) =>
        await _repository.GetAcademicYearsAsync(await GetStaffIdAsync(teacherEmail));

    public async Task<List<AttendanceDropdownDto>> GetClassesAsync(
        string teacherEmail, int branchId, int academicYearId)
    {
        EnsurePositive(branchId, nameof(branchId));
        EnsurePositive(academicYearId, nameof(academicYearId));
        return await _repository.GetClassesAsync(
            await GetStaffIdAsync(teacherEmail), branchId, academicYearId);
    }

    public async Task<List<AttendanceDropdownDto>> GetSectionsAsync(
        string teacherEmail, int classId)
    {
        EnsurePositive(classId, nameof(classId));
        return await _repository.GetSectionsAsync(
            await GetStaffIdAsync(teacherEmail), classId);
    }

    public async Task<List<AttendanceDropdownDto>> GetSubjectsAsync(
        string teacherEmail, int classId, int sectionId)
    {
        EnsurePositive(classId, nameof(classId));
        EnsurePositive(sectionId, nameof(sectionId));
        return await _repository.GetSubjectsAsync(
            await GetStaffIdAsync(teacherEmail), classId, sectionId);
    }

    public async Task<List<AttendancePeriodDropdownDto>> GetPeriodsAsync(
        string teacherEmail,
        DateTime date,
        int classId,
        int sectionId,
        int subjectId)
    {
        EnsureDate(date);
        EnsurePositive(classId, nameof(classId));
        EnsurePositive(sectionId, nameof(sectionId));
        EnsurePositive(subjectId, nameof(subjectId));
        return await _repository.GetPeriodsAsync(
            await GetStaffIdAsync(teacherEmail), date.Date, classId, sectionId, subjectId);
    }

    public async Task<TeacherAttendanceSheetResponseDto> GetSheetAsync(
        string teacherEmail, TeacherAttendanceSheetQueryDto query)
    {
        ArgumentNullException.ThrowIfNull(query);
        EnsureDate(query.Date);
        return await _repository.GetSheetAsync(
            await GetStaffIdAsync(teacherEmail), query);
    }

    public async Task<SaveTeacherAttendanceResponseDto> SaveSheetAsync(
        string teacherEmail, SaveTeacherAttendanceSheetDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        EnsureDate(dto.Date);
        if (dto.Students == null || dto.Students.Count == 0)
            throw new ArgumentException("At least one student attendance row is required.");

        return await _repository.SaveSheetAsync(
            await GetStaffIdAsync(teacherEmail), dto);
    }

    public async Task<AttendanceLockResponseDto> LockAsync(
        string teacherEmail, int attendanceSessionId)
    {
        EnsurePositive(attendanceSessionId, nameof(attendanceSessionId));
        return await _repository.SetLockAsync(
            await GetStaffIdAsync(teacherEmail), attendanceSessionId, true);
    }

    public async Task<AttendanceLockResponseDto> UnlockAsync(
        string teacherEmail, int attendanceSessionId)
    {
        EnsurePositive(attendanceSessionId, nameof(attendanceSessionId));
        return await _repository.SetLockAsync(
            await GetStaffIdAsync(teacherEmail), attendanceSessionId, false);
    }

    private Task<int> GetStaffIdAsync(string teacherEmail) =>
        _repository.GetActiveTeacherStaffIdByEmailAsync(teacherEmail);

    private static void EnsurePositive(int value, string name)
    {
        if (value <= 0)
            throw new ArgumentException($"{name} must be greater than zero.");
    }

    private static void EnsureDate(DateTime date)
    {
        if (date == default)
            throw new ArgumentException("Attendance date is required.");
        if (date.Date > DateTime.Today)
            throw new ArgumentException("Attendance cannot be entered for a future date.");
    }
}

