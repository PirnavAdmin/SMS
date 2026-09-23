namespace SMS.Api.Services.Implementations.Dashboard;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Dashboard;
using SMS.Api.Services.Interfaces.Dashboard;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(
        string? branchContext,
        int? academicYearId,
        string? academicYearContext = null,
        CancellationToken cancellationToken = default)
    {
        int? targetBranchId = null;
        string? targetBranchName = null;

        if (!string.IsNullOrWhiteSpace(branchContext) && !branchContext.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !branchContext.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (int.TryParse(branchContext, out int bId))
            {
                targetBranchId = bId;
                var branchObj = await _context.Branches.AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BranchId == bId, cancellationToken);
                targetBranchName = branchObj?.BranchName;
            }
            else
            {
                targetBranchName = branchContext.Trim();
                var branchObj = await _context.Branches.AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BranchName.ToLower() == targetBranchName.ToLower(), cancellationToken);
                if (branchObj != null)
                {
                    targetBranchId = branchObj.BranchId;
                }
            }
        }

        // Academic Year resolution
        int? effectiveYearId = null;
        if (academicYearId.HasValue && academicYearId.Value > 0)
        {
            effectiveYearId = academicYearId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(academicYearContext) && !academicYearContext.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (int.TryParse(academicYearContext, out int yId))
            {
                effectiveYearId = yId;
            }
            else
            {
                var cleanYear = academicYearContext.Trim();
                var ayObj = await _context.AcademicYears.AsNoTracking()
                    .FirstOrDefaultAsync(a => !a.IsDeleted && (a.AcademicYearName == cleanYear || a.AcademicYearName.Contains(cleanYear) || cleanYear.Contains(a.AcademicYearName)), cancellationToken);
                effectiveYearId = ayObj?.AcademicYearId;
            }
        }

        // 1. Total Active Students (matches Student Directory query)
        var studentQuery = _context.Students.AsNoTracking()
            .Where(s => !s.IsDeleted && (s.Status == "Active" || string.IsNullOrEmpty(s.Status)));

        if (targetBranchId.HasValue)
        {
            studentQuery = studentQuery.Where(s => s.BranchId == targetBranchId.Value);
        }
        else if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            studentQuery = studentQuery.Where(s => s.Branch != null && (s.Branch.BranchName.ToLower() == targetBranchName.ToLower() || s.Branch.BranchName.ToLower().Contains(targetBranchName.ToLower())));
        }

        if (effectiveYearId.HasValue && effectiveYearId.Value > 0)
        {
            studentQuery = studentQuery.Where(s => s.AcademicYearId == effectiveYearId.Value || s.AcademicYearId == 0);
        }

        int totalStudents = await studentQuery.CountAsync(cancellationToken);

        // Also check if there are any enrolled/admitted applications in AdmissionApplications not yet in Students table
        var existingAdmNos = await _context.Students.AsNoTracking()
            .Where(s => !s.IsDeleted && s.AdmissionNumber != null)
            .Select(s => s.AdmissionNumber.ToLower())
            .ToListAsync(cancellationToken);

        var admissionAppsQuery = _context.AdmissionApplications.AsNoTracking()
            .Where(a => !a.IsDeleted && (a.Status == "Enrolled" || a.Status == "Admitted"));

        if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            admissionAppsQuery = admissionAppsQuery.Where(a => a.BranchName != null && a.BranchName.ToLower() == targetBranchName.ToLower());
        }

        var unmappedAdmissions = await admissionAppsQuery
            .Where(a => a.RegistrationNo != null && !existingAdmNos.Contains(a.RegistrationNo.ToLower()))
            .CountAsync(cancellationToken);

        totalStudents += unmappedAdmissions;

        // 2. Staff Counts (Teaching & Non-Teaching)
        var staffQuery = _context.Staff.AsNoTracking()
            .Where(s => s.IsActive == true);

        if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            staffQuery = staffQuery.Where(s => s.BranchName != null && s.BranchName.ToLower() == targetBranchName.ToLower());
        }

        int teachingStaff = await staffQuery.CountAsync(s => s.Department == "Teaching" || s.EmployeeCategory == "Teaching Staff" || s.EmployeeCategory == "Teacher", cancellationToken);
        int nonTeachingStaff = await staffQuery.CountAsync(s => s.Department != "Teaching" && s.EmployeeCategory != "Teaching Staff" && s.EmployeeCategory != "Teacher", cancellationToken);

        // 3. Total Active Classes
        var classQuery = _context.Classes.AsNoTracking()
            .Where(c => c.Status == "Active");

        if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            classQuery = classQuery.Where(c => c.CampusLocation == targetBranchName || c.CampusLocation == "All" || c.CampusLocation == "All Branches");
        }

        int totalClasses = await classQuery.CountAsync(cancellationToken);

        // 4. Admissions Invariant Breakdown
        var admQuery = _context.AdmissionApplications.AsNoTracking()
            .Where(a => !a.IsDeleted && a.Status != "Deleted");

        if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            admQuery = admQuery.Where(a => a.BranchName == targetBranchName);
        }

        int totalAdmissions = await admQuery.CountAsync(cancellationToken);
        int pendingAdmissions = await admQuery.CountAsync(a => a.Status == "Pending" || a.Status == "pending", cancellationToken);
        int enrolledAdmissions = await admQuery.CountAsync(a => a.Status == "Enrolled" || a.Status == "enrolled" || a.Status == "Admitted", cancellationToken);
        int rejectedAdmissions = await admQuery.CountAsync(a => a.Status == "Rejected" || a.Status == "rejected", cancellationToken);
        int otherAdmissions = Math.Max(0, totalAdmissions - (pendingAdmissions + enrolledAdmissions + rejectedAdmissions));

        // 5. Student Attendance (Today)
        var today = DateTime.UtcNow.Date;
        var sessionQuery = _context.StudentAttendanceSessions.AsNoTracking()
            .Where(sas => sas.AttendanceDate.Date == today);

        if (targetBranchId.HasValue)
        {
            sessionQuery = sessionQuery.Where(sas => sas.BranchId == targetBranchId.Value);
        }

        var sessionIds = await sessionQuery.Select(sas => sas.AttendanceSessionId).ToListAsync(cancellationToken);

        var studentAttendanceSummary = new StudentAttendanceSummaryDto();
        if (sessionIds.Count > 0)
        {
            var records = await _context.StudentAttendances.AsNoTracking()
                .Where(sa => sessionIds.Contains(sa.AttendanceSessionId))
                .ToListAsync(cancellationToken);

            studentAttendanceSummary.Present = records.Count(r => r.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
            studentAttendanceSummary.Absent = records.Count(r => r.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
            studentAttendanceSummary.Late = records.Count(r => r.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
            studentAttendanceSummary.HalfDay = records.Count(r => r.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase) || r.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase));
            studentAttendanceSummary.Total = records.Count;
            studentAttendanceSummary.PresentPct = studentAttendanceSummary.Total > 0
                ? (int)Math.Round((double)studentAttendanceSummary.Present / studentAttendanceSummary.Total * 100)
                : 0;
        }

        // 6. Staff Attendance (Today)
        var staffAttQuery = _context.StaffAttendances.AsNoTracking()
            .Where(sa => sa.Date.Date == today);

        if (targetBranchId.HasValue)
        {
            staffAttQuery = staffAttQuery.Where(sa => sa.Branch == targetBranchName);
        }
        else if (!string.IsNullOrEmpty(targetBranchName) && !targetBranchName.Equals("All Branches", StringComparison.OrdinalIgnoreCase) && !targetBranchName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            staffAttQuery = staffAttQuery.Where(sa => sa.Branch == targetBranchName);
        }

        var staffRecords = await staffAttQuery.ToListAsync(cancellationToken);

        var teachingStaffIds = await staffQuery
            .Where(s => s.Department == "Teaching" || s.EmployeeCategory == "Teaching Staff" || s.EmployeeCategory == "Teacher")
            .Select(s => s.StaffId)
            .ToListAsync(cancellationToken);

        var nonTeachingStaffIds = await staffQuery
            .Where(s => s.Department != "Teaching" && s.EmployeeCategory != "Teaching Staff" && s.EmployeeCategory != "Teacher")
            .Select(s => s.StaffId)
            .ToListAsync(cancellationToken);

        // Overall Staff Attendance
        var staffAttendanceSummary = new StaffAttendanceSummaryDto();
        if (staffRecords.Count > 0)
        {
            staffAttendanceSummary.Present = staffRecords.Count(r => r.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
            staffAttendanceSummary.Absent = staffRecords.Count(r => r.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
            staffAttendanceSummary.Late = staffRecords.Count(r => r.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
            staffAttendanceSummary.HalfDay = staffRecords.Count(r => r.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase) || r.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase));
            staffAttendanceSummary.Total = (teachingStaff + nonTeachingStaff) > 0 ? (teachingStaff + nonTeachingStaff) : staffRecords.Count;
            staffAttendanceSummary.PresentPct = staffAttendanceSummary.Total > 0
                ? (int)Math.Round((double)staffAttendanceSummary.Present / staffAttendanceSummary.Total * 100)
                : 0;
        }

        // Teaching Staff Attendance
        var teachingRecords = staffRecords.Where(r => teachingStaffIds.Contains(r.StaffId)).ToList();
        var teachingAttendanceSummary = new StaffAttendanceSummaryDto();
        if (teachingRecords.Count > 0 || teachingStaff > 0)
        {
            teachingAttendanceSummary.Present = teachingRecords.Count(r => r.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
            teachingAttendanceSummary.Absent = teachingRecords.Count(r => r.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
            teachingAttendanceSummary.Late = teachingRecords.Count(r => r.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
            teachingAttendanceSummary.HalfDay = teachingRecords.Count(r => r.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase) || r.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase));
            teachingAttendanceSummary.Total = teachingStaff > 0 ? teachingStaff : teachingRecords.Count;
            teachingAttendanceSummary.PresentPct = teachingAttendanceSummary.Total > 0
                ? (int)Math.Round((double)teachingAttendanceSummary.Present / teachingAttendanceSummary.Total * 100)
                : 0;
        }

        // Non-Teaching Staff Attendance
        var nonTeachingRecords = staffRecords.Where(r => nonTeachingStaffIds.Contains(r.StaffId)).ToList();
        var nonTeachingAttendanceSummary = new StaffAttendanceSummaryDto();
        if (nonTeachingRecords.Count > 0 || nonTeachingStaff > 0)
        {
            nonTeachingAttendanceSummary.Present = nonTeachingRecords.Count(r => r.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
            nonTeachingAttendanceSummary.Absent = nonTeachingRecords.Count(r => r.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
            nonTeachingAttendanceSummary.Late = nonTeachingRecords.Count(r => r.Status.Equals("Late", StringComparison.OrdinalIgnoreCase));
            nonTeachingAttendanceSummary.HalfDay = nonTeachingRecords.Count(r => r.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase) || r.Status.Equals("HalfDay", StringComparison.OrdinalIgnoreCase));
            nonTeachingAttendanceSummary.Total = nonTeachingStaff > 0 ? nonTeachingStaff : nonTeachingRecords.Count;
            nonTeachingAttendanceSummary.PresentPct = nonTeachingAttendanceSummary.Total > 0
                ? (int)Math.Round((double)nonTeachingAttendanceSummary.Present / nonTeachingAttendanceSummary.Total * 100)
                : 0;
        }

        // 7. Class-wise Student Strength
        var rawClassStrengths = await studentQuery
            .Include(s => s.ClassGrade)
            .GroupBy(s => s.ClassGrade.ClassName)
            .Select(g => new
            {
                ClassName = g.Key ?? "Unassigned",
                StudentCount = g.Count()
            })
            .ToListAsync(cancellationToken);

        var classWiseStrength = rawClassStrengths
            .Select(x => new ClassStrengthDto
            {
                ClassName = x.ClassName,
                StudentCount = x.StudentCount
            })
            .OrderBy(x => x.ClassName)
            .ToList();

        return new DashboardSummaryDto
        {
            TotalStudents = totalStudents,
            TeachingStaff = teachingStaff,
            NonTeachingStaff = nonTeachingStaff,
            TotalClasses = totalClasses,
            TotalAdmissions = totalAdmissions,
            PendingAdmissions = pendingAdmissions,
            EnrolledAdmissions = enrolledAdmissions,
            RejectedAdmissions = rejectedAdmissions,
            OtherAdmissions = otherAdmissions,
            StudentAttendance = studentAttendanceSummary,
            StaffAttendance = staffAttendanceSummary,
            TeachingStaffAttendance = teachingAttendanceSummary,
            NonTeachingStaffAttendance = nonTeachingAttendanceSummary,
            ClassWiseStrength = classWiseStrength
        };
    }
}
