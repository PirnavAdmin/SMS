namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class StudentAttendanceService : IStudentAttendanceService
{
    private readonly IStudentAttendanceRepository _repository;
    private readonly AppDbContext _context;

    public StudentAttendanceService(
        IStudentAttendanceRepository repository,
        AppDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<StudentAttendanceRegisterResponseDto>
        GetStudentAttendanceRegisterAsync(
            StudentAttendanceRegisterQueryDto query)
    {
        var records = await _repository.GetStudentAttendanceRecordsAsync(
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
            StudentId = query.StudentId ?? 1,
            StudentName = records.OrderByDescending(r => r.AttendanceSession?.AttendanceDate).FirstOrDefault()?.Student?.StudentName ?? "Student",
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

    public async Task<List<StudentAttendanceUniversalDto>> GetAllAttendanceRecordsAsync(
        StudentAttendanceUniversalQueryDto query)
    {
        var records = await _repository.GetAllAttendanceRecordsAsync(query);

        var subjects = await _context.Subjects
            .AsNoTracking()
            .ToDictionaryAsync(s => s.SubjectId, s => s.SubjectName ?? s.SubjectCode ?? "");

        var periods = await _context.PeriodSettings
            .AsNoTracking()
            .ToDictionaryAsync(p => p.PeriodId, p => p.PeriodName ?? "");

        var staff = await _context.Staff
            .AsNoTracking()
            .ToDictionaryAsync(st => st.StaffId, st => $"{st.FirstName} {st.LastName}".Trim());

        return records.Select(r =>
        {
            var sess = r.AttendanceSession;
            var stu = r.Student;
            string subjName = sess != null && subjects.TryGetValue(sess.SubjectId, out var sn) ? sn : "";
            string prdName = sess != null && periods.TryGetValue(sess.PeriodId, out var pn) ? pn : "";
            string markedByName = sess != null && staff.TryGetValue(sess.MarkedByStaffId, out var mn) ? mn : "Administrator";

            return new StudentAttendanceUniversalDto
            {
                Id = r.Id.ToString(),
                StudentId = (r.StudentId ?? 0).ToString(),
                RollNo = stu?.RollNumber ?? "",
                AdmissionNo = stu?.AdmissionNumber ?? "",
                StudentName = stu?.StudentName ?? "Student",
                ClassName = stu?.ClassGrade?.ClassName ?? "",
                Section = stu?.ClassSection?.SectionName ?? "",
                Date = sess?.AttendanceDate.ToString("yyyy-MM-dd") ?? "",
                Status = FormatStatus(r.Status),
                Remarks = r.Remarks ?? "",
                Subject = subjName,
                Period = prdName,
                MarkedBy = markedByName
            };
        }).ToList();
    }

    public async Task<BulkSaveStudentAttendanceResponseDto> BulkSaveStudentAttendanceAsync(
        BulkSaveStudentAttendanceDto dto, int? staffId)
    {
        ArgumentNullException.ThrowIfNull(dto);

        int count = await _repository.BulkSaveStudentAttendanceAsync(dto.Records, staffId);

        return new BulkSaveStudentAttendanceResponseDto
        {
            Success = true,
            Count = count,
            Message = $"Successfully saved attendance for {count} student records."
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

            _ => "Present"
        };
    }

    private static string FormatStatus(string? status)
    {
        return IsStatus(status, "HalfDay")
            ? "Half Day"
            : status ?? string.Empty;
    }
}