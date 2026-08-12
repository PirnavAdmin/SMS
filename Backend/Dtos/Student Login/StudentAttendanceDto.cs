namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public class StudentAttendanceRegisterQueryDto
{
    public int? StudentId { get; set; }
    public string? FilterType { get; set; } = "Month"; // "Month", "Day", "Custom"
    public int? Month { get; set; } // 0-11 or 1-12
    public int? Year { get; set; } // e.g. 2026
    public DateTime? Date { get; set; } // for Day-wise
    public DateTime? StartDate { get; set; } // for Custom Range
    public DateTime? EndDate { get; set; } // for Custom Range
    public string? StatusFilter { get; set; } = "All"; // "All", "Present", "Absent", "Late", "HalfDay"
}

public class StudentAttendanceRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public string FormattedDate { get; set; } = string.Empty; // "Tuesday, Aug 4, 2026"
    public string DayOfWeek { get; set; } = string.Empty;
    public string Status { get; set; } = "Present";
    public string? Remarks { get; set; }
}

public class StudentAttendanceSummaryDto
{
    public int AttendancePercentage { get; set; } = 100;
    public int TotalDays { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int HalfDay { get; set; }
    public int Leave { get; set; }
}

public class StudentAttendanceRegisterResponseDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public StudentAttendanceSummaryDto Summary { get; set; } = new StudentAttendanceSummaryDto();
    public List<StudentAttendanceRecordDto> Records { get; set; } = new List<StudentAttendanceRecordDto>();
}

public class MarkStudentAttendanceDto
{
    public int StudentId { get; set; }
    public int AttendanceSessionId { get; set; }
    public DateTime Date { get; set; }
    public string Status { get; set; } = "Present";
    public string? Remarks { get; set; }
}
