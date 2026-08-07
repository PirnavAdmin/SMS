namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

public class TeacherDashboardRepository : ITeacherDashboardRepository
{
    private readonly AppDbContext _context;

    public TeacherDashboardRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Staff?> GetTeacherByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var normalizedEmail = email.Trim().ToLower();

        return await _context.Staff
    .AsNoTracking()
    .FirstOrDefaultAsync(x =>
        x.Email != null &&
        x.Email.ToLower() == normalizedEmail &&
        x.IsActive == true &&
        (
            x.SystemRole == "Teacher" ||
            x.EmployeeCategory == "Teaching Staff"
        ));
    }

    public async Task<int> GetAssignedClassCountAsync(int staffId)
    {
        return await _context.TimetableSlots
            .AsNoTracking()
            .Where(x =>
                x.TeacherId == staffId &&
                x.Header != null &&
                x.Header.Status == "Published")
            .Select(x => new
            {
                x.Header!.ClassId,
                x.Header.SectionId
            })
            .Distinct()
            .CountAsync();
    }

    public async Task<int> GetTotalStudentCountAsync(int staffId)
    {
        var assignedClassIds = _context.TimetableSlots
            .AsNoTracking()
            .Where(x =>
                x.TeacherId == staffId &&
                x.Header != null &&
                x.Header.Status == "Published")
            .Select(x => x.Header!.ClassId)
            .Distinct();

        return await _context.AdmissionApplications
            .AsNoTracking()
            .Where(x =>
                !x.IsDeleted &&
                x.Status == "Enrolled" &&
                x.AppliedClassId.HasValue &&
                assignedClassIds.Contains(x.AppliedClassId.Value))
            .Select(x => x.Id)
            .Distinct()
            .CountAsync();
    }

    public async Task<int> GetTodayClassCountAsync(
        int staffId,
        string dayOfWeek)
    {
        return await _context.TimetableSlots
            .AsNoTracking()
            .CountAsync(x =>
                x.TeacherId == staffId &&
                x.DayOfWeek == dayOfWeek &&
                x.Header != null &&
                x.Header.Status == "Published");
    }

    public async Task<int> GetPendingHomeworkCountAsync(
        string teacherName)
    {
        if (string.IsNullOrWhiteSpace(teacherName))
        {
            return 0;
        }

        var today = DateTime.UtcNow.Date;
        var normalizedTeacherName = teacherName.Trim().ToLower();

        return await _context.Homeworks
            .AsNoTracking()
            .CountAsync(x =>
                x.TeacherName != null &&
                x.TeacherName.ToLower() == normalizedTeacherName &&
                x.DueDate.Date >= today);
    }

    public async Task<int> GetPendingLeaveCountAsync(int staffId)
    {
        return await _context.LeaveApplications
            .AsNoTracking()
            .CountAsync(x =>
                x.StaffId == staffId &&
                x.Status == "Pending");
    }

    public async Task<int> GetUnreadNotificationCountAsync(
        int? schoolId)
    {
        return await _context.SystemNotifications
            .AsNoTracking()
            .CountAsync(x =>
                !x.IsRead &&
                (
                    schoolId == null ||
                    x.SchoolId == null ||
                    x.SchoolId == schoolId
                ));
    }

    public async Task<StaffAttendance?> GetTodayAttendanceAsync(
        int staffId,
        DateTime date)
    {
        var attendanceDate = date.Date;

        return await _context.StaffAttendances
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.StaffId == staffId &&
                x.Date.Date == attendanceDate);
    }

    public async Task<List<TeacherScheduleDto>> GetTodayScheduleAsync(
        int staffId,
        string dayOfWeek)
    {
        return await _context.TimetableSlots
            .AsNoTracking()
            .Where(x =>
                x.TeacherId == staffId &&
                x.DayOfWeek == dayOfWeek &&
                x.Header != null &&
                x.Header.Status == "Published")
            .OrderBy(x => x.StartTime)
            .Select(x => new TeacherScheduleDto
            {
                SlotId = x.SlotId,
                ClassId = x.Header!.ClassId,
                SectionId = x.Header.SectionId,
                SubjectId = x.SubjectId,

                ClassName =
                    x.Header.ClassGrade != null
                        ? x.Header.ClassGrade.ClassName ?? string.Empty
                        : string.Empty,

                SectionName =
                    x.Header.ClassSection != null
                        ? x.Header.ClassSection.SectionName ?? string.Empty
                        : string.Empty,

                SubjectName =
                    x.Subject != null
                        ? x.Subject.SubjectName ?? string.Empty
                        : string.Empty,

                StartTime = x.StartTime.ToString(@"hh\:mm"),
                EndTime = x.EndTime.ToString(@"hh\:mm"),
                RoomNo = x.RoomNo
            })
            .ToListAsync();
    }
}