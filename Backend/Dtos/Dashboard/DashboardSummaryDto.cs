namespace SMS.Api.Dtos.Dashboard;

using System.Collections.Generic;

public class DashboardSummaryDto
{
    public int TotalStudents { get; set; }
    public int TeachingStaff { get; set; }
    public int NonTeachingStaff { get; set; }
    public int TotalClasses { get; set; }

    public int TotalAdmissions { get; set; }
    public int PendingAdmissions { get; set; }
    public int EnrolledAdmissions { get; set; }
    public int RejectedAdmissions { get; set; }
    public int OtherAdmissions { get; set; }

    public StudentAttendanceSummaryDto StudentAttendance { get; set; } = new();
    public StaffAttendanceSummaryDto StaffAttendance { get; set; } = new();
    public StaffAttendanceSummaryDto TeachingStaffAttendance { get; set; } = new();
    public StaffAttendanceSummaryDto NonTeachingStaffAttendance { get; set; } = new();
    public List<ClassStrengthDto> ClassWiseStrength { get; set; } = new();
}

public class StudentAttendanceSummaryDto
{
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int HalfDay { get; set; }
    public int Total { get; set; }
    public int PresentPct { get; set; }
}

public class StaffAttendanceSummaryDto
{
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int HalfDay { get; set; }
    public int Total { get; set; }
    public int PresentPct { get; set; }
}

public class ClassStrengthDto
{
    public string ClassName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}
