namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class StudentAttendanceRepository : IStudentAttendanceRepository
{
    private readonly AppDbContext _context;

    public StudentAttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentAttendance>> GetStudentAttendanceRecordsAsync(
        int? studentId,
        string? filterType,
        int? month,
        int? year,
        DateTime? date,
        DateTime? startDate,
        DateTime? endDate,
        string? statusFilter)
    {
        var query = _context.StudentAttendances
            .AsNoTracking()
            .Include(a => a.AttendanceSession)
            .Include(a => a.Student)
            .AsQueryable();

        // Filter by student
        if (studentId.HasValue && studentId.Value > 0)
        {
            query = query.Where(a => a.StudentId == studentId.Value);
        }

        // Filter by attendance date stored in the parent session
        if (!string.IsNullOrWhiteSpace(filterType))
        {
            switch (filterType.Trim().ToLower())
            {
                case "month":
                    {
                        int targetYear = year ?? DateTime.Now.Year;
                        int targetMonth = month ?? DateTime.Now.Month;

                        if (targetMonth < 1 || targetMonth > 12)
                        {
                            throw new ArgumentException(
                                "Month must be between 1 and 12.");
                        }

                        query = query.Where(a =>
                            a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Year == targetYear &&
                            a.AttendanceSession.AttendanceDate.Month == targetMonth);

                        break;
                    }

                case "day":
                    {
                        if (!date.HasValue)
                        {
                            throw new ArgumentException(
                                "Date is required when filter type is Day.");
                        }

                        DateTime selectedDate = date.Value.Date;

                        query = query.Where(a =>
                            a.AttendanceSession != null &&
                            a.AttendanceSession.AttendanceDate.Date == selectedDate);

                        break;
                    }

                case "custom":
                    {
                        if (!startDate.HasValue && !endDate.HasValue)
                        {
                            throw new ArgumentException(
                                "Start date or end date is required for a custom filter.");
                        }

                        if (startDate.HasValue &&
                            endDate.HasValue &&
                            startDate.Value.Date > endDate.Value.Date)
                        {
                            throw new ArgumentException(
                                "Start date cannot be later than end date.");
                        }

                        if (startDate.HasValue)
                        {
                            DateTime selectedStartDate = startDate.Value.Date;

                            query = query.Where(a =>
                                a.AttendanceSession != null &&
                                a.AttendanceSession.AttendanceDate.Date >=
                                selectedStartDate);
                        }

                        if (endDate.HasValue)
                        {
                            DateTime selectedEndDate = endDate.Value.Date;

                            query = query.Where(a =>
                                a.AttendanceSession != null &&
                                a.AttendanceSession.AttendanceDate.Date <=
                                selectedEndDate);
                        }

                        break;
                    }

                default:
                    throw new ArgumentException(
                        "Filter type must be Month, Day, or Custom.");
            }
        }

        // Filter by attendance status
        if (!string.IsNullOrWhiteSpace(statusFilter) &&
            !statusFilter.Equals(
                "All",
                StringComparison.OrdinalIgnoreCase))
        {
            string normalizedStatus = NormalizeStatus(statusFilter);

            query = query.Where(a => a.Status == normalizedStatus);
        }

        return await query
            .OrderByDescending(a =>
                a.AttendanceSession!.AttendanceDate)
            .ThenBy(a => a.StudentId)
            .ToListAsync();
    }

    public async Task<List<StudentAttendance>> GetAllAttendanceRecordsAsync(
        StudentAttendanceUniversalQueryDto query)
    {
        var dbQuery = _context.StudentAttendances
            .AsNoTracking()
            .Include(a => a.AttendanceSession)
            .Include(a => a.Student)
                .ThenInclude(s => s!.ClassGrade)
            .Include(a => a.Student)
                .ThenInclude(s => s!.ClassSection)
            .Where(a => a.AttendanceSession != null)
            .AsQueryable();

        if (query.StudentId.HasValue && query.StudentId.Value > 0)
        {
            dbQuery = dbQuery.Where(a => a.StudentId == query.StudentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Date) && DateTime.TryParse(query.Date, out DateTime singleDate))
        {
            DateTime targetDate = singleDate.Date;
            dbQuery = dbQuery.Where(a => a.AttendanceSession!.AttendanceDate.Date == targetDate);
        }

        if (!string.IsNullOrWhiteSpace(query.StartDate) && DateTime.TryParse(query.StartDate, out DateTime sDate))
        {
            DateTime start = sDate.Date;
            dbQuery = dbQuery.Where(a => a.AttendanceSession!.AttendanceDate.Date >= start);
        }

        if (!string.IsNullOrWhiteSpace(query.EndDate) && DateTime.TryParse(query.EndDate, out DateTime eDate))
        {
            DateTime end = eDate.Date;
            dbQuery = dbQuery.Where(a => a.AttendanceSession!.AttendanceDate.Date <= end);
        }

        if (query.Month.HasValue && query.Month.Value >= 1 && query.Month.Value <= 12)
        {
            int targetYear = query.Year ?? DateTime.Now.Year;
            dbQuery = dbQuery.Where(a => a.AttendanceSession!.AttendanceDate.Year == targetYear && a.AttendanceSession.AttendanceDate.Month == query.Month.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            string norm = NormalizeStatus(query.Status);
            dbQuery = dbQuery.Where(a => a.Status == norm);
        }

        return await dbQuery
            .OrderByDescending(a => a.AttendanceSession!.AttendanceDate)
            .ThenBy(a => a.StudentId)
            .ToListAsync();
    }

    public async Task<int> BulkSaveStudentAttendanceAsync(List<BulkStudentAttendanceRecordDto> records, int? staffId)
    {
        if (records == null || records.Count == 0) return 0;

        var allStudents = await _context.Students
            .Include(s => s.ClassGrade)
            .Include(s => s.ClassSection)
            .Where(s => !s.IsDeleted)
            .ToListAsync();

        var allSubjects = await _context.Subjects.AsNoTracking().ToListAsync();
        var allPeriods = await _context.PeriodSettings.AsNoTracking().ToListAsync();
        var activeAcademicYear = await _context.AcademicYears.AsNoTracking().FirstOrDefaultAsync(y => y.IsActive && !y.IsDeleted);
        var defaultBranch = await _context.Branches.AsNoTracking().FirstOrDefaultAsync();

        int defaultStaffId = staffId ?? 1;
        int defaultBranchId = defaultBranch?.BranchId ?? 1;
        int defaultYearId = activeAcademicYear?.AcademicYearId ?? 1;

        int savedCount = 0;

        foreach (var rec in records)
        {
            DateTime recordDate = DateTime.Today;
            if (!string.IsNullOrWhiteSpace(rec.Date) && DateTime.TryParse(rec.Date, out DateTime parsedDate))
            {
                recordDate = parsedDate.Date;
            }

            // Find student
            Student? student = null;
            if (rec.StudentId.HasValue && rec.StudentId.Value > 0)
            {
                student = allStudents.FirstOrDefault(s => s.StudentId == rec.StudentId.Value);
            }
            if (student == null && !string.IsNullOrWhiteSpace(rec.AdmissionNo))
            {
                student = allStudents.FirstOrDefault(s => string.Equals(s.AdmissionNumber, rec.AdmissionNo.Trim(), StringComparison.OrdinalIgnoreCase));
            }
            if (student == null && !string.IsNullOrWhiteSpace(rec.RollNo))
            {
                student = allStudents.FirstOrDefault(s => string.Equals(s.RollNumber, rec.RollNo.Trim(), StringComparison.OrdinalIgnoreCase) &&
                    (string.IsNullOrWhiteSpace(rec.ClassName) || s.ClassGrade?.ClassName?.ToLower().Contains(rec.ClassName.ToLower().Replace("class", "").Trim()) == true));
            }
            if (student == null && !string.IsNullOrWhiteSpace(rec.StudentName))
            {
                student = allStudents.FirstOrDefault(s => string.Equals(s.StudentName.Trim(), rec.StudentName.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (student == null)
            {
                continue;
            }

            int branchId = student.BranchId > 0 ? student.BranchId : defaultBranchId;
            int yearId = student.AcademicYearId > 0 ? student.AcademicYearId : defaultYearId;
            int classId = student.ClassId;
            int sectionId = student.SectionId;

            // Resolve subjectId
            int subjectId = 0;
            if (!string.IsNullOrWhiteSpace(rec.Subject) && !rec.Subject.Equals("All", StringComparison.OrdinalIgnoreCase) && !rec.Subject.Equals("All Subjects", StringComparison.OrdinalIgnoreCase) && !rec.Subject.Equals("Select Subject", StringComparison.OrdinalIgnoreCase))
            {
                var matchSubj = allSubjects.FirstOrDefault(s => (s.SubjectName != null && s.SubjectName.Equals(rec.Subject.Trim(), StringComparison.OrdinalIgnoreCase)) || (s.SubjectCode != null && s.SubjectCode.Equals(rec.Subject.Trim(), StringComparison.OrdinalIgnoreCase)));
                if (matchSubj != null) subjectId = matchSubj.SubjectId;
            }

            // Resolve periodId
            int periodId = 0;
            if (!string.IsNullOrWhiteSpace(rec.Period) && !rec.Period.Equals("Select Period", StringComparison.OrdinalIgnoreCase))
            {
                var matchPeriod = allPeriods.FirstOrDefault(p => (p.PeriodName != null && p.PeriodName.Equals(rec.Period.Trim(), StringComparison.OrdinalIgnoreCase)) || (rec.Period.Contains(p.PeriodName ?? "xyz")));
                if (matchPeriod != null) periodId = matchPeriod.PeriodId;
            }

            // Find or create StudentAttendanceSession
            var session = await _context.StudentAttendanceSessions
                .FirstOrDefaultAsync(x =>
                    x.AttendanceDate == recordDate
                    && x.BranchId == branchId
                    && x.AcademicYearId == yearId
                    && x.ClassId == classId
                    && x.SectionId == sectionId
                    && x.SubjectId == subjectId
                    && x.PeriodId == periodId);

            if (session == null)
            {
                session = new StudentAttendanceSession
                {
                    AttendanceDate = recordDate,
                    BranchId = branchId,
                    AcademicYearId = yearId,
                    ClassId = classId,
                    SectionId = sectionId,
                    SubjectId = subjectId,
                    PeriodId = periodId,
                    MarkedByStaffId = defaultStaffId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.StudentAttendanceSessions.Add(session);
                await _context.SaveChangesAsync();
            }

            // Find or create StudentAttendance record
            var attendanceRecord = await _context.StudentAttendances
                .FirstOrDefaultAsync(x => x.AttendanceSessionId == session.AttendanceSessionId && x.StudentId == student.StudentId);

            string normStatus = NormalizeStatus(rec.Status);
            string? remarks = string.IsNullOrWhiteSpace(rec.Remarks) ? null : rec.Remarks.Trim();

            if (attendanceRecord != null)
            {
                attendanceRecord.Status = normStatus;
                attendanceRecord.Remarks = remarks;
                attendanceRecord.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.StudentAttendances.Add(new StudentAttendance
                {
                    AttendanceSessionId = session.AttendanceSessionId,
                    StudentId = student.StudentId,
                    Status = normStatus,
                    Remarks = remarks,
                    CreatedAt = DateTime.UtcNow
                });
            }

            savedCount++;
        }

        await _context.SaveChangesAsync();
        return savedCount;
    }

    public async Task AddStudentAttendanceAsync(
        StudentAttendance attendance)
    {
        ArgumentNullException.ThrowIfNull(attendance);

        await _context.StudentAttendances.AddAsync(attendance);
    }

    public async Task AddStudentAttendanceRangeAsync(
        IEnumerable<StudentAttendance> attendances)
    {
        ArgumentNullException.ThrowIfNull(attendances);

        await _context.StudentAttendances.AddRangeAsync(attendances);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    private static string NormalizeStatus(string status)
    {
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
}