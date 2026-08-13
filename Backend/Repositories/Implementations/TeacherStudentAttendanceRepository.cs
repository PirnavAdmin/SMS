using System.Linq;

namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;

public class TeacherStudentAttendanceRepository
    : ITeacherStudentAttendanceRepository
{
    private readonly AppDbContext _context;

    public TeacherStudentAttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetActiveTeacherStaffIdByEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new UnauthorizedAccessException("Teacher email was not found in the token.");

        string normalizedEmail = email.Trim().ToLower();

        int? staffId = await _context.Staff
            .AsNoTracking()
            .Where(x => x.Email != null
                        && x.Email.ToLower() == normalizedEmail
                        && x.IsActive == true
                        && (x.SystemRole == "Teacher"
                            || x.EmployeeCategory == "Teaching Staff"))
            .Select(x => (int?)x.StaffId)
            .SingleOrDefaultAsync();

        return staffId
            ?? throw new UnauthorizedAccessException(
                "An active teacher profile was not found for the logged-in account.");
    }

    public async Task<List<AttendanceDropdownDto>> GetBranchesAsync(int staffId)
    {
        await EnsureActiveTeacherAsync(staffId);

        return await _context.Branches
            .AsNoTracking()
            .OrderBy(x => x.BranchName)
            .Select(x => new AttendanceDropdownDto
            {
                Id = x.BranchId,
                Name = x.BranchName
            })
            .ToListAsync();
    }

    public async Task<List<AttendanceDropdownDto>> GetAcademicYearsAsync(int staffId)
    {
        await EnsureActiveTeacherAsync(staffId);

        return await _context.AcademicYears
            .AsNoTracking()
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new AttendanceDropdownDto
            {
                Id = x.AcademicYearId,
                Name = x.AcademicYearName
            })
            .ToListAsync();
    }

    public async Task<List<AttendanceDropdownDto>> GetClassesAsync(
        int staffId, int branchId, int academicYearId)
    {
        await EnsureActiveTeacherAsync(staffId);

        return await (
            from assignment in _context.TeacherSubjectAssignments.AsNoTracking()
            join student in _context.Students.AsNoTracking()
                on assignment.ClassId equals student.ClassId
            join classGrade in _context.Classes.AsNoTracking()
                on assignment.ClassId equals classGrade.ClassId
            where assignment.StaffId == staffId
                  && student.BranchId == branchId
                  && student.AcademicYearId == academicYearId
                  && !student.IsDeleted
                  && student.Status == "Active"
            select new AttendanceDropdownDto
            {
                Id = classGrade.ClassId,
                Name = classGrade.ClassName ?? ""
            })
            .Distinct()
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<List<AttendanceDropdownDto>> GetSectionsAsync(
        int staffId, int classId)
    {
        await EnsureActiveTeacherAsync(staffId);

        return await (
            from assignment in _context.TeacherSubjectAssignments.AsNoTracking()
            join section in _context.ClassSections.AsNoTracking()
                on assignment.SectionId equals section.SectionId
            where assignment.StaffId == staffId
                  && assignment.ClassId == classId
                  && section.ClassId == classId
            select new AttendanceDropdownDto
            {
                Id = section.SectionId,
                Name = section.SectionName
            })
            .Distinct()
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<List<AttendanceDropdownDto>> GetSubjectsAsync(
        int staffId, int classId, int sectionId)
    {
        await EnsureActiveTeacherAsync(staffId);

        return await (
            from assignment in _context.TeacherSubjectAssignments.AsNoTracking()
            join subject in _context.Subjects.AsNoTracking()
                on assignment.SubjectId equals subject.SubjectId
            where assignment.StaffId == staffId
                  && assignment.ClassId == classId
                  && assignment.SectionId == sectionId
            select new AttendanceDropdownDto
            {
                Id = subject.SubjectId,
                Name = subject.SubjectName ?? subject.SubjectCode ?? $"Subject {subject.SubjectId}"
            })
            .Distinct()
            .OrderBy(x => x.Name)
            .ToListAsync();
    }

    public async Task<List<AttendancePeriodDropdownDto>> GetPeriodsAsync(
        int staffId,
        DateTime date,
        int classId,
        int sectionId,
        int subjectId)
    {
        await EnsureActiveTeacherAsync(staffId);
        string day = date.DayOfWeek.ToString();

        return await (
            from slot in _context.TimetableSlots.AsNoTracking()
            join header in _context.TimetableHeaders.AsNoTracking()
                on slot.HeaderId equals header.HeaderId
            join period in _context.PeriodSettings.AsNoTracking()
                on slot.PeriodId equals period.PeriodId
            where slot.TeacherId == staffId
                  && slot.SubjectId == subjectId
                  && slot.DayOfWeek == day
                  && header.ClassId == classId
                  && header.SectionId == sectionId
                  && header.Status == "Published"
                  && period.IsActive
                  && !period.IsDeleted
                  && period.PeriodType == "Teaching Period"
            orderby period.DisplayOrder
            select new AttendancePeriodDropdownDto
            {
                PeriodId = period.PeriodId,
                PeriodName = period.PeriodName,
                StartTime = period.StartTime,
                EndTime = period.EndTime,
                TimetableSlotId = slot.SlotId
            })
            .ToListAsync();
    }

    public async Task<TeacherAttendanceSheetResponseDto> GetSheetAsync(
        int staffId, TeacherAttendanceSheetQueryDto query)
    {
        ArgumentNullException.ThrowIfNull(query);
        TimetableSlot slot = await GetAuthorizedSlotAsync(staffId, query);

        StudentAttendanceSession? session = await _context.StudentAttendanceSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(x =>
                x.AttendanceDate == query.Date.Date
                && x.BranchId == query.BranchId
                && x.AcademicYearId == query.AcademicYearId
                && x.ClassId == query.ClassId
                && x.SectionId == query.SectionId
                && x.SubjectId == query.SubjectId
                && x.PeriodId == query.PeriodId);

        var students = await _context.Students
            .AsNoTracking()
            .Where(x => x.BranchId == query.BranchId
                        && x.AcademicYearId == query.AcademicYearId
                        && x.ClassId == query.ClassId
                        && x.SectionId == query.SectionId
                        && x.Status == "Active"
                        && !x.IsDeleted)
            .OrderBy(x => x.RollNumber)
            .ThenBy(x => x.StudentName)
            .Select(x => new
            {
                x.StudentId,
                x.AdmissionNumber,
                x.RollNumber,
                x.StudentName
            })
            .ToListAsync();



        Dictionary<int, StudentAttendance> existing = session == null
            ? new Dictionary<int, StudentAttendance>()
            : await _context.StudentAttendances
                .AsNoTracking()
                .Where(x => x.AttendanceSessionId == session.AttendanceSessionId && x.StudentId.HasValue)
                .ToDictionaryAsync(x => x.StudentId!.Value);

        string branchName = await _context.Branches
            .Where(x => x.BranchId == query.BranchId)
            .Select(x => x.BranchName)
            .SingleAsync();
        string yearName = await _context.AcademicYears
            .Where(x => x.AcademicYearId == query.AcademicYearId)
            .Select(x => x.AcademicYearName)
            .SingleAsync();
        string className = await _context.Classes
            .Where(x => x.ClassId == query.ClassId)
            .Select(x => x.ClassName ?? "")
            .SingleAsync();
        string sectionName = await _context.ClassSections
            .Where(x => x.SectionId == query.SectionId && x.ClassId == query.ClassId)
            .Select(x => x.SectionName)
            .SingleAsync();
        string subjectName = await _context.Subjects
            .Where(x => x.SubjectId == query.SubjectId)
            .Select(x => x.SubjectName ?? x.SubjectCode ?? "Subject")
            .SingleAsync();
        PeriodSetting period = await _context.PeriodSettings
            .AsNoTracking()
            .SingleAsync(x => x.PeriodId == query.PeriodId);

        var rows = students.Select(x =>
        {
            existing.TryGetValue(x.StudentId, out StudentAttendance? attendance);
            return new TeacherAttendanceStudentDto
            {
                StudentId = x.StudentId,
                AdmissionNumber = x.AdmissionNumber,
                RollNumber = x.RollNumber,
                StudentName = x.StudentName,
                Status = attendance?.Status ?? "Present",
                Remarks = attendance?.Remarks,
                HasExistingRecord = attendance != null
            };
        }).ToList();

        return new TeacherAttendanceSheetResponseDto
        {
            AttendanceSessionId = session?.AttendanceSessionId,
            AttendanceDate = query.Date.Date,
            BranchId = query.BranchId,
            BranchName = branchName,
            AcademicYearId = query.AcademicYearId,
            AcademicYearName = yearName,
            ClassId = query.ClassId,
            ClassName = className,
            SectionId = query.SectionId,
            SectionName = sectionName,
            SubjectId = query.SubjectId,
            SubjectName = subjectName,
            PeriodId = query.PeriodId,
            PeriodName = period.PeriodName,
            TimetableSlotId = slot.SlotId,
            IsLocked = session?.IsLocked ?? false,
            LockedAt = session?.LockedAt,
            Summary = BuildSummary(rows),
            Students = rows
        };
    }

    public async Task<SaveTeacherAttendanceResponseDto> SaveSheetAsync(
        int staffId, SaveTeacherAttendanceSheetDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        if (dto.Students.Count == 0)
            throw new ArgumentException("At least one student attendance row is required.");
        if (dto.Students.Select(x => x.StudentId).Distinct().Count() != dto.Students.Count)
            throw new ArgumentException("The request contains duplicate student IDs.");

        var query = new TeacherAttendanceSheetQueryDto
        {
            Date = dto.Date,
            BranchId = dto.BranchId,
            AcademicYearId = dto.AcademicYearId,
            ClassId = dto.ClassId,
            SectionId = dto.SectionId,
            SubjectId = dto.SubjectId,
            PeriodId = dto.PeriodId
        };
        TimetableSlot slot = await GetAuthorizedSlotAsync(staffId, query);
        if (dto.TimetableSlotId.HasValue && dto.TimetableSlotId.Value != slot.SlotId)
            throw new UnauthorizedAccessException("The selected timetable slot is not assigned to this teacher.");

        int[] requestedStudentIds = dto.Students.Select(x => x.StudentId).ToArray();
        int validStudentCount = await _context.Students.CountAsync(x =>
            requestedStudentIds.Contains(x.StudentId)
            && x.BranchId == dto.BranchId
            && x.AcademicYearId == dto.AcademicYearId
            && x.ClassId == dto.ClassId
            && x.SectionId == dto.SectionId
            && x.Status == "Active"
            && !x.IsDeleted);
        if (validStudentCount != requestedStudentIds.Length)
            throw new ArgumentException("One or more students do not belong to the selected class and section.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        StudentAttendanceSession? session = await _context.StudentAttendanceSessions
            .FirstOrDefaultAsync(x =>
                x.AttendanceDate == dto.Date.Date
                && x.BranchId == dto.BranchId
                && x.AcademicYearId == dto.AcademicYearId
                && x.ClassId == dto.ClassId
                && x.SectionId == dto.SectionId
                && x.SubjectId == dto.SubjectId
                && x.PeriodId == dto.PeriodId);

        if (session?.IsLocked == true)
            throw new InvalidOperationException("This attendance sheet is locked.");

        if (session == null)
        {
            session = new StudentAttendanceSession
            {
                AttendanceDate = dto.Date.Date,
                BranchId = dto.BranchId,
                AcademicYearId = dto.AcademicYearId,
                ClassId = dto.ClassId,
                SectionId = dto.SectionId,
                SubjectId = dto.SubjectId,
                PeriodId = dto.PeriodId,
                TimetableSlotId = slot.SlotId,
                MarkedByStaffId = staffId,
                CreatedAt = DateTime.UtcNow
            };
            _context.StudentAttendanceSessions.Add(session);
            await _context.SaveChangesAsync();
        }

        Dictionary<int, StudentAttendance> existing = await _context.StudentAttendances
            .Where(x => x.AttendanceSessionId == session.AttendanceSessionId && requestedStudentIds.Contains(x.StudentId ?? -1))
            .ToDictionaryAsync(x => x.StudentId ?? -1);

        int inserted = 0;
        int updated = 0;
        foreach (SaveTeacherAttendanceRecordDto row in dto.Students)
        {
            string status = NormalizeStatus(row.Status);
            string? remarks = string.IsNullOrWhiteSpace(row.Remarks) ? null : row.Remarks.Trim();
            if (existing.TryGetValue(row.StudentId, out StudentAttendance? record))
            {
                record.Status = status;
                record.Remarks = remarks;
                record.UpdatedAt = DateTime.UtcNow;
                updated++;
            }
            else
            {
                _context.StudentAttendances.Add(new StudentAttendance
                {
                    AttendanceSessionId = session.AttendanceSessionId,
                    StudentId = row.StudentId,
                    Status = status,
                    Remarks = remarks,
                    CreatedAt = DateTime.UtcNow
                });
                inserted++;
            }
        }

        session.MarkedByStaffId = staffId;
        session.TimetableSlotId = slot.SlotId;
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        var summaryRows = dto.Students.Select(x => new TeacherAttendanceStudentDto
        {
            StudentId = x.StudentId,
            Status = NormalizeStatus(x.Status)
        }).ToList();

        return new SaveTeacherAttendanceResponseDto
        {
            AttendanceSessionId = session.AttendanceSessionId,
            InsertedCount = inserted,
            UpdatedCount = updated,
            IsLocked = false,
            Message = "Attendance saved successfully.",
            Summary = BuildSummary(summaryRows)
        };
    }

    public async Task<AttendanceLockResponseDto> SetLockAsync(
        int staffId, int attendanceSessionId, bool isLocked)
    {
        await EnsureActiveTeacherAsync(staffId);
        StudentAttendanceSession session = await _context.StudentAttendanceSessions
            .SingleOrDefaultAsync(x => x.AttendanceSessionId == attendanceSessionId)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        await EnsureAuthorizedSessionAsync(staffId, session);
        session.IsLocked = isLocked;
        session.LockedByStaffId = isLocked ? staffId : null;
        session.LockedAt = isLocked ? DateTime.UtcNow : null;
        session.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new AttendanceLockResponseDto
        {
            AttendanceSessionId = session.AttendanceSessionId,
            IsLocked = session.IsLocked,
            LockedAt = session.LockedAt,
            Message = isLocked
                ? "Attendance sheet locked successfully."
                : "Attendance sheet unlocked successfully."
        };
    }

    private async Task EnsureActiveTeacherAsync(int staffId)
    {
        bool exists = await _context.Staff.AsNoTracking().AnyAsync(x =>
            x.StaffId == staffId
            && x.IsActive == true
            && (x.SystemRole == "Teacher" || x.EmployeeCategory == "Teaching Staff"));
        if (!exists)
            throw new UnauthorizedAccessException("An active teacher account was not found.");
    }

    private async Task<TimetableSlot> GetAuthorizedSlotAsync(
        int staffId, TeacherAttendanceSheetQueryDto query)
    {
        await EnsureActiveTeacherAsync(staffId);
        string day = query.Date.DayOfWeek.ToString();

        return await _context.TimetableSlots
            .AsNoTracking()
            .Include(x => x.Header)
            .SingleOrDefaultAsync(x =>
                x.TeacherId == staffId
                && x.SubjectId == query.SubjectId
                && x.PeriodId == query.PeriodId
                && x.DayOfWeek == day
                && x.Header != null
                && x.Header.ClassId == query.ClassId
                && x.Header.SectionId == query.SectionId
                && x.Header.Status == "Published")
            ?? throw new UnauthorizedAccessException(
                "This published timetable period is not assigned to the teacher.");
    }

    private async Task EnsureAuthorizedSessionAsync(
        int staffId, StudentAttendanceSession session)
    {
        var query = new TeacherAttendanceSheetQueryDto
        {
            Date = session.AttendanceDate,
            BranchId = session.BranchId,
            AcademicYearId = session.AcademicYearId,
            ClassId = session.ClassId,
            SectionId = session.SectionId,
            SubjectId = session.SubjectId,
            PeriodId = session.PeriodId
        };
        await GetAuthorizedSlotAsync(staffId, query);
    }

    private static string NormalizeStatus(string? status)
    {
        string normalized = status?.Trim().Replace(" ", string.Empty).ToLowerInvariant()
            ?? string.Empty;
        return normalized switch
        {
            "present" => "Present",
            "absent" => "Absent",
            "late" => "Late",
            "halfday" => "HalfDay",
            _ => throw new ArgumentException(
                "Status must be Present, Absent, Late, or HalfDay.")
        };
    }

    private static TeacherAttendanceSummaryDto BuildSummary(
        IReadOnlyCollection<TeacherAttendanceStudentDto> students)
    {
        int present = students.Count(x => x.Status == "Present");
        int absent = students.Count(x => x.Status == "Absent");
        int late = students.Count(x => x.Status == "Late");
        int halfDay = students.Count(x => x.Status == "HalfDay");
        decimal percentage = students.Count == 0
            ? 0
            : Math.Round((present + late + (halfDay * 0.5m)) / students.Count * 100m, 2);

        return new TeacherAttendanceSummaryDto
        {
            TotalStudents = students.Count,
            Present = present,
            Absent = absent,
            Late = late,
            HalfDay = halfDay,
            AttendancePercentage = percentage
        };
    }
}
