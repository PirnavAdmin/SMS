namespace SMS.Api.Services.Implementations;

using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TeacherAttendanceService : ITeacherAttendanceService
{
    private readonly ITeacherAttendanceRepository _repository;

    public TeacherAttendanceService(
        ITeacherAttendanceRepository repository)
    {
        _repository = repository;
    }

    public async Task<TeacherAttendanceDto?>
        GetTodayAttendanceAsync(string teacherEmail)
    {
        var teacher = await GetTeacherAsync(teacherEmail);

        var attendance =
            await _repository.GetTodayAttendanceAsync(
                teacher.StaffId,
                DateTime.Today);

        return attendance == null
            ? null
            : MapAttendance(attendance);
    }

    public async Task<TeacherAttendancePagedResultDto>
        GetHistoryAsync(
            string teacherEmail,
            TeacherAttendanceFilterDto filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        var teacher = await GetTeacherAsync(teacherEmail);

        filter.PageNumber = filter.PageNumber <= 0
            ? 1
            : filter.PageNumber;

        filter.PageSize = filter.PageSize <= 0
            ? 10
            : Math.Min(filter.PageSize, 100);

        if (filter.FromDate.HasValue &&
            filter.ToDate.HasValue &&
            filter.FromDate.Value.Date >
            filter.ToDate.Value.Date)
        {
            throw new ArgumentException(
                "From date cannot be greater than to date.");
        }

        return await _repository.GetHistoryAsync(
            teacher.StaffId,
            filter);
    }

    public async Task<TeacherAttendanceDto>
        CheckInAsync(
            string teacherEmail,
            TeacherCheckInDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var teacher = await GetTeacherAsync(teacherEmail);
        var now = DateTime.Now;
        var today = now.Date;

        var existingAttendance =
            await _repository.GetTodayAttendanceAsync(
                teacher.StaffId,
                today);

        if (existingAttendance != null)
        {
            existingAttendance.InTime = now.ToString("hh:mm tt");
            existingAttendance.Status = "Present";
            if (string.IsNullOrWhiteSpace(existingAttendance.Department)) existingAttendance.Department = teacher.Department;
            if (string.IsNullOrWhiteSpace(existingAttendance.Designation)) existingAttendance.Designation = teacher.Designation;
            if (string.IsNullOrWhiteSpace(existingAttendance.Branch)) existingAttendance.Branch = "Main Campus";
            if (string.IsNullOrWhiteSpace(existingAttendance.AcademicYear)) existingAttendance.AcademicYear = "2026-2027";

            if (!string.IsNullOrWhiteSpace(dto.Remarks))
            {
                existingAttendance.Remarks =
                    dto.Remarks.Trim();
            }

            await _repository.UpdateAttendanceAsync(
                existingAttendance);

            return MapAttendance(existingAttendance);
        }

        var attendance = new StaffAttendance
        {
            StaffId = teacher.StaffId,
            Date = today,
            Status = "Present",
            InTime = now.ToString("hh:mm tt"),
            OutTime = null,
            AcademicYear = "2026-2027",
            Branch = "Main Campus",
            Department = teacher.Department ?? "Teaching Staff",
            Designation = teacher.Designation ?? "Teacher",
            Remarks = string.IsNullOrWhiteSpace(dto.Remarks)
                ? null
                : dto.Remarks.Trim()
        };

        var createdAttendance =
            await _repository.CreateAttendanceAsync(attendance);

        return MapAttendance(createdAttendance);
    }

    public async Task<TeacherAttendanceDto>
        CheckOutAsync(
            string teacherEmail,
            TeacherCheckOutDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var teacher = await GetTeacherAsync(teacherEmail);

        var attendance =
            await _repository.GetTodayAttendanceAsync(
                teacher.StaffId,
                DateTime.Today);

        if (attendance == null)
        {
            attendance = new StaffAttendance
            {
                StaffId = teacher.StaffId,
                Date = DateTime.Today,
                Status = "Present",
                InTime = "08:30 AM",
                OutTime = DateTime.Now.ToString("hh:mm tt"),
                AcademicYear = "2026-2027",
                Branch = "Main Campus",
                Department = teacher.Department ?? "Teaching Staff",
                Designation = teacher.Designation ?? "Teacher",
                Remarks = string.IsNullOrWhiteSpace(dto.Remarks) ? null : dto.Remarks.Trim()
            };
            var created = await _repository.CreateAttendanceAsync(attendance);
            return MapAttendance(created);
        }
        else
        {
            attendance.OutTime = DateTime.Now.ToString("hh:mm tt");
            if (string.IsNullOrWhiteSpace(attendance.InTime)) attendance.InTime = "08:30 AM";
            attendance.Status = "Present";
            if (string.IsNullOrWhiteSpace(attendance.Department)) attendance.Department = teacher.Department;
            if (string.IsNullOrWhiteSpace(attendance.Designation)) attendance.Designation = teacher.Designation;
            if (!string.IsNullOrWhiteSpace(dto.Remarks))
            {
                attendance.Remarks = dto.Remarks.Trim();
            }
            await _repository.UpdateAttendanceAsync(attendance);
            return MapAttendance(attendance);
        }
    }

    public async Task<AttendanceCorrectionDto>
        CreateCorrectionAsync(
            string teacherEmail,
            CreateAttendanceCorrectionDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var teacher = await GetTeacherAsync(teacherEmail);
        var attendanceDate = dto.AttendanceDate.Date;

        if (attendanceDate > DateTime.Today)
        {
            throw new ArgumentException(
                "Correction cannot be requested for a future date.");
        }

        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            throw new ArgumentException(
                "Correction reason is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.RequestedInTime) &&
            string.IsNullOrWhiteSpace(dto.RequestedOutTime))
        {
            throw new ArgumentException(
                "Enter a requested check-in time or check-out time.");
        }

        var requestedInTime =
            NormalizeTime(
                dto.RequestedInTime,
                "Requested check-in time");

        var requestedOutTime =
            NormalizeTime(
                dto.RequestedOutTime,
                "Requested check-out time");

        if (requestedInTime != null &&
            requestedOutTime != null)
        {
            var inTime = TimeSpan.Parse(requestedInTime);
            var outTime = TimeSpan.Parse(requestedOutTime);

            if (outTime <= inTime)
            {
                throw new ArgumentException(
                    "Requested check-out time must be later " +
                    "than requested check-in time.");
            }
        }

        var hasPendingRequest =
            await _repository.HasPendingCorrectionAsync(
                teacher.StaffId,
                attendanceDate);

        if (hasPendingRequest)
        {
            throw new InvalidOperationException(
                "A pending correction request already exists " +
                "for this date.");
        }

        var currentAttendance =
            await _repository.GetTodayAttendanceAsync(
                teacher.StaffId,
                attendanceDate);

        var correction = new TeacherAttendanceCorrection
        {
            StaffId = teacher.StaffId,
            AttendanceDate = attendanceDate,
            CurrentInTime = currentAttendance?.InTime,
            CurrentOutTime = currentAttendance?.OutTime,
            RequestedInTime = requestedInTime,
            RequestedOutTime = requestedOutTime,
            Reason = dto.Reason.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.Now
        };

        var createdCorrection =
            await _repository.CreateCorrectionAsync(correction);

        return MapCorrection(createdCorrection);
    }

    public async Task<List<AttendanceCorrectionDto>>
        GetCorrectionsAsync(string teacherEmail)
    {
        var teacher = await GetTeacherAsync(teacherEmail);

        return await _repository.GetCorrectionsAsync(
            teacher.StaffId);
    }

    private async Task<Staff> GetTeacherAsync(
        string teacherEmail)
    {
        if (string.IsNullOrWhiteSpace(teacherEmail))
        {
            throw new UnauthorizedAccessException(
                "Teacher email is missing from the login token.");
        }

        var normalizedEmail = teacherEmail.Trim();

        var teacher =
            await _repository.GetTeacherByEmailAsync(
                normalizedEmail);

        if (teacher == null)
        {
            throw new KeyNotFoundException(
                "No active teacher staff record is linked " +
                "to the logged-in email.");
        }

        return teacher;
    }

    private static TeacherAttendanceDto MapAttendance(
        StaffAttendance attendance)
    {
        return new TeacherAttendanceDto
        {
            // StaffAttendance model's actual primary key
            AttendanceId = attendance.StaffAttendanceId,
            StaffId = attendance.StaffId,
            Date = attendance.Date,
            Status = attendance.Status,
            InTime = attendance.InTime,
            OutTime = attendance.OutTime,
            Remarks = attendance.Remarks
        };
    }

    private static AttendanceCorrectionDto MapCorrection(
        TeacherAttendanceCorrection correction)
    {
        return new AttendanceCorrectionDto
        {
            CorrectionId = correction.CorrectionId,
            StaffId = correction.StaffId,
            AttendanceDate = correction.AttendanceDate,
            CurrentInTime = correction.CurrentInTime,
            CurrentOutTime = correction.CurrentOutTime,
            RequestedInTime = correction.RequestedInTime,
            RequestedOutTime = correction.RequestedOutTime,
            Reason = correction.Reason,
            Status = correction.Status,
            ApprovedRemarks = correction.ApprovedRemarks,
            CreatedAt = correction.CreatedAt,
            UpdatedAt = correction.UpdatedAt
        };
    }

    private static string? NormalizeTime(
        string? time,
        string fieldName)
    {
        if (string.IsNullOrWhiteSpace(time))
        {
            return null;
        }

        if (!TimeSpan.TryParse(time.Trim(), out var parsedTime) ||
            parsedTime < TimeSpan.Zero ||
            parsedTime >= TimeSpan.FromDays(1))
        {
            throw new ArgumentException(
                $"{fieldName} must be a valid time, " +
                "for example 09:30 or 17:45.");
        }

        return parsedTime.ToString(@"hh\:mm\:ss");
    }
}