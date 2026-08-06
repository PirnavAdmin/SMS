namespace SMS.Api.Services.Implementations;

using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;

public class StudentAttendanceService : IStudentAttendanceService
{
    private readonly IStudentAttendanceRepository _repository;

    public StudentAttendanceService(
        IStudentAttendanceRepository repository)
    {
        _repository = repository;
    }

    public async Task<StudentAttendanceRegisterResponseDto>
        GetStudentAttendanceRegisterAsync(
            StudentAttendanceRegisterQueryDto query)
    {
        ArgumentNullException.ThrowIfNull(query);

        var records =
            await _repository.GetStudentAttendanceRecordsAsync(
                query.StudentId,
                query.FilterType,
                query.Month,
                query.Year,
                query.Date,
                query.StartDate,
                query.EndDate,
                query.StatusFilter);

        int totalDays = records.Count;

        int present = records.Count(r =>
            IsStatus(r.Status, "Present"));

        int absent = records.Count(r =>
            IsStatus(r.Status, "Absent"));

        int late = records.Count(r =>
            IsStatus(r.Status, "Late"));

        int halfDay = records.Count(r =>
            IsStatus(r.Status, "HalfDay") ||
            IsStatus(r.Status, "Half Day"));

        int leave = records.Count(r =>
            IsStatus(r.Status, "Leave"));

        int percentage = totalDays == 0
            ? 100
            : (int)Math.Round(
                ((present + late + (halfDay * 0.5))
                    / totalDays) * 100,
                MidpointRounding.AwayFromZero);

        var mappedRecords = records
            .Where(r => r.AttendanceSession != null)
            .Select(r =>
            {
                DateTime attendanceDate =
                    r.AttendanceSession!.AttendanceDate;

                return new StudentAttendanceRecordDto
                {
                    Id = $"att-{r.Id}",
                    Date = attendanceDate.ToString("yyyy-MM-dd"),
                    FormattedDate = attendanceDate
                        .ToString("dddd, MMM d, yyyy"),
                    DayOfWeek = attendanceDate
                        .ToString("dddd"),
                    Status = FormatStatus(r.Status),
                    Remarks = r.Remarks
                };
            })
            .ToList();

        return new StudentAttendanceRegisterResponseDto
        {
            StudentId = query.StudentId ?? 0,

            // StudentName was removed from StudentAttendance.
            // It should later be loaded through a Student-table join.
            StudentName = "Student",

            Summary = new StudentAttendanceSummaryDto
            {
                AttendancePercentage = percentage,
                TotalDays = totalDays,
                Present = present,
                Absent = absent,
                Late = late,
                HalfDay = halfDay,
                Leave = leave
            },

            Records = mappedRecords
        };
    }

    public async Task<bool> MarkStudentAttendanceAsync(
        MarkStudentAttendanceDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.StudentId <= 0)
        {
            throw new ArgumentException(
                "A valid student ID is required.");
        }

        if (dto.AttendanceSessionId <= 0)
        {
            throw new ArgumentException(
                "A valid attendance session ID is required.");
        }

        string normalizedStatus = NormalizeStatus(dto.Status);

        var record = new StudentAttendance
        {
            AttendanceSessionId = dto.AttendanceSessionId,
            StudentId = dto.StudentId,
            Status = normalizedStatus,
            Remarks = string.IsNullOrWhiteSpace(dto.Remarks)
                ? null
                : dto.Remarks.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddStudentAttendanceAsync(record);
        await _repository.SaveChangesAsync();

        return true;
    }

    private static bool IsStatus(
        string? actualStatus,
        string expectedStatus)
    {
        return string.Equals(
            actualStatus?.Replace(" ", string.Empty),
            expectedStatus.Replace(" ", string.Empty),
            StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            throw new ArgumentException(
                "Attendance status is required.");
        }

        string normalized = status
            .Trim()
            .Replace(" ", string.Empty)
            .ToLowerInvariant();

        return normalized switch
        {
            "present" => "Present",
            "absent" => "Absent",
            "late" => "Late",
            "halfday" => "HalfDay",
            "leave" => "Leave",

            _ => throw new ArgumentException(
                "Status must be Present, Absent, Late, HalfDay, or Leave.")
        };
    }

    private static string FormatStatus(string? status)
    {
        return IsStatus(status, "HalfDay")
            ? "Half Day"
            : status ?? string.Empty;
    }
}