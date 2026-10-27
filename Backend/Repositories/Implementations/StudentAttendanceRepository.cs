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
                case "overall":
                case "all":
                    break;

                case "month":
                    {
                        int targetYear = year ?? DateTime.Now.Year;
                        int targetMonth = month ?? DateTime.Now.Month;

                        // Support both 0-indexed (0-11) and 1-indexed (1-12) months
                        if (targetMonth >= 0 && targetMonth <= 11 && month.HasValue)
                        {
                            targetMonth = targetMonth + 1;
                        }

                        if (targetMonth < 1 || targetMonth > 12)
                        {
                            targetMonth = DateTime.Now.Month;
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
                        "Filter type must be Overall, Month, Day, or Custom.");
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
        else if (query.StudentIds != null && query.StudentIds.Count > 0)
        {
            dbQuery = dbQuery.Where(a => a.StudentId.HasValue && query.StudentIds.Contains(a.StudentId.Value));
        }

        if (!string.IsNullOrWhiteSpace(query.ClassName) &&
            !query.ClassName.Equals("All Classes", StringComparison.OrdinalIgnoreCase) &&
            !query.ClassName.Equals("Select Class", StringComparison.OrdinalIgnoreCase))
        {
            string cleanCls = query.ClassName.Replace("Class", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
            dbQuery = dbQuery.Where(a => a.Student != null && a.Student.ClassGrade != null && a.Student.ClassGrade.ClassName != null &&
                (a.Student.ClassGrade.ClassName.ToLower() == cleanCls ||
                 a.Student.ClassGrade.ClassName.ToLower() == query.ClassName.ToLower() ||
                 a.Student.ClassGrade.ClassName.ToLower().Contains(cleanCls)));
        }

        if (!string.IsNullOrWhiteSpace(query.Section) &&
            !query.Section.Equals("All Sections", StringComparison.OrdinalIgnoreCase) &&
            !query.Section.Equals("Select Section", StringComparison.OrdinalIgnoreCase))
        {
            string cleanSec = query.Section.Replace("Section", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
            dbQuery = dbQuery.Where(a => a.Student != null && a.Student.ClassSection != null &&
                (a.Student.ClassSection.SectionName.ToLower() == cleanSec ||
                 a.Student.ClassSection.SectionName.ToLower() == query.Section.ToLower() ||
                 a.Student.ClassSection.SectionName.Replace("Section", "").Trim().ToLower() == cleanSec));
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

        if (query.Month.HasValue)
        {
            int mVal = query.Month.Value;
            if (mVal >= 0 && mVal <= 11) mVal = mVal + 1;
            if (mVal >= 1 && mVal <= 12)
            {
                int targetYear = query.Year ?? DateTime.Now.Year;
                dbQuery = dbQuery.Where(a => a.AttendanceSession!.AttendanceDate.Year == targetYear && a.AttendanceSession.AttendanceDate.Month == mVal);
            }
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

        Staff? callerStaff = null;
        if (staffId.HasValue)
        {
            callerStaff = await _context.Staff.AsNoTracking().FirstOrDefaultAsync(s => s.StaffId == staffId.Value);
        }

        bool isTeacherCaller = callerStaff != null &&
            (string.Equals(callerStaff.SystemRole, "Teacher", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(callerStaff.EmployeeCategory, "Teaching Staff", StringComparison.OrdinalIgnoreCase));

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

            if (classId == 0 && !string.IsNullOrWhiteSpace(rec.ClassName))
            {
                string cNorm = rec.ClassName.Replace("Class", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
                var matchedClass = await _context.Classes.AsNoTracking().FirstOrDefaultAsync(c => c.ClassName != null && (c.ClassName.ToLower() == cNorm || c.ClassName.ToLower().Contains(cNorm)));
                if (matchedClass != null) classId = matchedClass.ClassId;
            }

            if (sectionId == 0 && !string.IsNullOrWhiteSpace(rec.Section))
            {
                string sNorm = rec.Section.Replace("Section", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();
                var matchedSec = await _context.ClassSections.AsNoTracking().FirstOrDefaultAsync(s => (classId == 0 || s.ClassId == classId) && (s.SectionName.ToLower() == sNorm || s.SectionName.ToLower().Contains(sNorm)));
                if (matchedSec != null)
                {
                    sectionId = matchedSec.SectionId;
                    if (classId == 0) classId = matchedSec.ClassId;
                }
            }

            // Strict Class Teacher Authorization for Teachers
            if (isTeacherCaller && callerStaff != null)
            {
                var secName = student.ClassSection?.SectionName ?? "";
                var cleanSec = secName.Replace("Section", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower();

                bool isCT = await _context.TeacherAssignments.AsNoTracking().AnyAsync(ta =>
                    ta.TeacherId == callerStaff.StaffId &&
                    ta.ClassId == classId &&
                    ta.Status == "Active" &&
                    (ta.Role == null || ta.Role.Contains("Teacher") || ta.Role.Contains("Class")) &&
                    (string.IsNullOrEmpty(ta.SectionLetter) ||
                     ta.SectionLetter.Trim().ToLower() == secName.ToLower() ||
                     ta.SectionLetter.Replace("Section", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower() == cleanSec ||
                     secName.Replace("Section", "", StringComparison.OrdinalIgnoreCase).Trim().ToLower() == ta.SectionLetter.Trim().ToLower()));

                if (!isCT)
                {
                    string tFullName = $"{callerStaff.FirstName} {callerStaff.LastName}".Trim().ToLower();
                    string tFirst = (callerStaff.FirstName ?? "").Trim().ToLower();
                    isCT = await _context.SubjectTeacherAllocations.AsNoTracking().AnyAsync(sta =>
                        sta.Status == "Active" &&
                        (sta.TeacherName.ToLower() == tFullName || (tFirst.Length > 2 && sta.TeacherName.ToLower().Contains(tFirst))) &&
                        (string.IsNullOrEmpty(rec.ClassName) || sta.ClassName.ToLower().Contains(rec.ClassName.ToLower().Replace("class", "").Trim())));
                }

                if (!isCT)
                {
                    // Non-class teacher cannot save student attendance
                    continue;
                }
            }

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