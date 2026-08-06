namespace SMS.Api.Dtos;

public class TeacherDashboardDto
{
    public TeacherProfileDto Teacher { get; set; } = new();
    public TeacherDashboardSummaryDto Summary { get; set; } = new();
    public TeacherAttendanceTodayDto AttendanceToday { get; set; } = new();

    public List<TeacherScheduleDto> TodaySchedule { get; set; } = new();
    public List<TeacherQuickTaskDto> QuickTasks { get; set; } = new();
}

public class TeacherProfileDto
{
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string PrimarySubject { get; set; } = string.Empty;
}

public class TeacherDashboardSummaryDto
{
    public int TotalStudents { get; set; }
    public int TotalAssignedClasses { get; set; }
    public int ClassesToday { get; set; }
    public int PendingHomework { get; set; }
    public int PendingLeaves { get; set; }
    public int UnreadNotifications { get; set; }
}

public class TeacherAttendanceTodayDto
{
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Not Marked";
    public string? InTime { get; set; }
    public string? OutTime { get; set; }
}

public class TeacherScheduleDto
{
    public int SlotId { get; set; }
    public int ClassId { get; set; }
    public int SectionId { get; set; }
    public int SubjectId { get; set; }

    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string? RoomNo { get; set; }
}

public class TeacherQuickTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string ModuleKey { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}