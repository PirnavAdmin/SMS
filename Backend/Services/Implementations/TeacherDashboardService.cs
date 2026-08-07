namespace SMS.Api.Services.Implementations;

using SMS.Api.Dtos;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TeacherDashboardService
    : ITeacherDashboardService
{
    private readonly ITeacherDashboardRepository _repository;

    public TeacherDashboardService(
        ITeacherDashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<TeacherDashboardDto> GetDashboardAsync(
        string teacherEmail,
        int? schoolId)
    {
        if (string.IsNullOrWhiteSpace(teacherEmail))
        {
            throw new UnauthorizedAccessException(
                "Teacher email is missing from the login token.");
        }

        var teacher =
            await _repository.GetTeacherByEmailAsync(
                teacherEmail);

        if (teacher == null)
        {
            throw new KeyNotFoundException(
                "No active teacher staff record is linked " +
                "to the logged-in email.");
        }

        var teacherName =
            $"{teacher.FirstName} {teacher.LastName}".Trim();

        var today = DateTime.UtcNow.Date;
        var dayOfWeek = today.DayOfWeek.ToString();

        var attendance =
            await _repository.GetTodayAttendanceAsync(
                teacher.StaffId,
                today);

        var dashboard = new TeacherDashboardDto
        {
            Teacher = new TeacherProfileDto
            {
                StaffId = teacher.StaffId,
                EmployeeId = teacher.EmployeeId ?? "",
                TeacherName = teacherName,
                Email = teacher.Email ?? "",
                Department = teacher.Department ?? "",
                Designation = teacher.Designation ?? "",
                PrimarySubject =
                    teacher.PrimarySubject ?? ""
            },

            Summary = new TeacherDashboardSummaryDto
            {
                TotalStudents =
                    await _repository
                        .GetTotalStudentCountAsync(
                            teacher.StaffId),

                TotalAssignedClasses =
                    await _repository
                        .GetAssignedClassCountAsync(
                            teacher.StaffId),

                ClassesToday =
                    await _repository
                        .GetTodayClassCountAsync(
                            teacher.StaffId,
                            dayOfWeek),

                PendingHomework =
                    await _repository
                        .GetPendingHomeworkCountAsync(
                            teacherName),

                PendingLeaves =
                    await _repository
                        .GetPendingLeaveCountAsync(
                            teacher.StaffId),

                UnreadNotifications =
                    await _repository
                        .GetUnreadNotificationCountAsync(
                            schoolId)
            },

            AttendanceToday = new TeacherAttendanceTodayDto
            {
                Date = today,
                Status = attendance?.Status ?? "Not Marked",
                InTime = attendance?.InTime,
                OutTime = attendance?.OutTime
            },

            TodaySchedule =
                await _repository.GetTodayScheduleAsync(
                    teacher.StaffId,
                    dayOfWeek),

            QuickTasks = GetQuickTasks()
        };

        return dashboard;
    }

    private static List<TeacherQuickTaskDto> GetQuickTasks()
    {
        return new List<TeacherQuickTaskDto>
        {
            new()
            {
                Title = "Mark Attendance",
                ModuleKey = "student-attendance",
                Route = "/teacher/student-attendance",
                Icon = "attendance"
            },
            new()
            {
                Title = "Enter Marks",
                ModuleKey = "marks",
                Route = "/teacher/marks",
                Icon = "marks"
            },
            new()
            {
                Title = "Create Homework",
                ModuleKey = "homework",
                Route = "/teacher/homework",
                Icon = "homework"
            },
            new()
            {
                Title = "View Students",
                ModuleKey = "students",
                Route = "/teacher/students",
                Icon = "students"
            },
            new()
            {
                Title = "Send Parent Message",
                ModuleKey = "communication",
                Route = "/teacher/communication",
                Icon = "message"
            },
            new()
            {
                Title = "Apply Leave",
                ModuleKey = "leave",
                Route = "/teacher/leaves",
                Icon = "leave"
            }
        };
    }
}