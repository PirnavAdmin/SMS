namespace SMS.Api.Services.Implementations.AcademicManagement;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Services.Interfaces;

public class TeacherSubstitutionService : ITeacherSubstitutionService
{
    private readonly AppDbContext _context;
    private readonly IAcademicYearService _academicYearService;
    private readonly ILogger<TeacherSubstitutionService> _logger;

    public TeacherSubstitutionService(
        AppDbContext context,
        IAcademicYearService academicYearService,
        ILogger<TeacherSubstitutionService> logger)
    {
        _context = context;
        _academicYearService = academicYearService;
        _logger = logger;
    }

    private static TimeSpan ParseTime(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
            return TimeSpan.Zero;

        timeStr = timeStr.Trim();
        string[] formats = { "hh:mm tt", "h:mm tt", "hh:mm:ss", "hh:mm", "h:mm", "H:mm", "HH:mm" };

        if (DateTime.TryParseExact(timeStr, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDateTime))
        {
            return parsedDateTime.TimeOfDay;
        }

        if (TimeSpan.TryParse(timeStr, out var parsedSpan))
        {
            return parsedSpan;
        }

        return TimeSpan.Zero;
    }

    private static string FormatTime(TimeSpan span)
    {
        var dummyDate = DateTime.Today.Add(span);
        return dummyDate.ToString("hh:mm tt", CultureInfo.InvariantCulture);
    }

    private static bool IsTeachingStaff(Staff s)
    {
        var cat = (s.EmployeeCategory ?? "").ToLower();
        var des = (s.Designation ?? "").ToLower();
        var dept = (s.Department ?? "").ToLower();
        var role = (s.SystemRole ?? "").ToLower();

        if (des.Contains("driver") || des.Contains("conductor") || des.Contains("peon") || 
            des.Contains("attendant") || des.Contains("cleaner") || dept.Contains("transport"))
        {
            return false;
        }

        return cat.Contains("teacher") || cat.Contains("teaching") || cat.Contains("faculty") ||
               role.Contains("teacher") || des.Contains("teacher") || des.Contains("faculty") || 
               des.Contains("instructor") || des.Contains("lecturer") || des.Contains("master") ||
               dept.Contains("academic") || dept.Contains("science") || dept.Contains("math") || 
               dept.Contains("english") || dept.Contains("social") || dept.Contains("language") ||
               !string.IsNullOrWhiteSpace(s.PrimarySubject);
    }

    public async Task<List<TeacherSubstitutionDto>> GetSubstitutionsAsync(
        DateTime? date, 
        int? teacherId, 
        string? teacherName, 
        string? academicYear, 
        string? branchName)
    {
        var query = _context.TeacherSubstitutions
            .Include(s => s.OriginalTeacher)
            .Include(s => s.SubstituteTeacher)
            .AsNoTracking()
            .AsQueryable();

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(s => s.Date.Date == targetDate);
        }

        if (teacherId.HasValue && teacherId.Value > 0)
        {
            query = query.Where(s => s.SubstituteTeacherId == teacherId.Value || s.OriginalTeacherId == teacherId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(teacherName))
        {
            var cleanName = teacherName.Trim().ToLower();
            query = query.Where(s => 
                (s.SubstituteTeacherName != null && s.SubstituteTeacherName.ToLower().Contains(cleanName)) ||
                (s.OriginalTeacherName != null && s.OriginalTeacherName.ToLower().Contains(cleanName)));
        }

        if (!string.IsNullOrWhiteSpace(academicYear) && academicYear != "All")
        {
            query = query.Where(s => s.AcademicYear == academicYear);
        }

        if (!string.IsNullOrWhiteSpace(branchName) && branchName != "All" && branchName != "All Branches")
        {
            query = query.Where(s => s.BranchName == branchName);
        }

        var list = await query
            .OrderByDescending(s => s.Date)
            .ThenBy(s => s.StartTime)
            .ToListAsync();

        return list.Select(s => new TeacherSubstitutionDto
        {
            SubstitutionId = s.SubstitutionId,
            Date = s.Date.ToString("yyyy-MM-dd"),
            DayOfWeek = s.DayOfWeek,
            SlotId = s.SlotId,
            PeriodId = s.PeriodId,
            PeriodName = s.PeriodName ?? "Teaching Period",
            StartTime = FormatTime(s.StartTime),
            EndTime = FormatTime(s.EndTime),
            TimeSlot = $"{FormatTime(s.StartTime)} - {FormatTime(s.EndTime)}",
            ClassId = s.ClassId,
            ClassName = s.ClassName ?? $"Class {s.ClassId}",
            SectionId = s.SectionId,
            SectionName = s.SectionName ?? "A",
            SubjectId = s.SubjectId,
            SubjectName = s.SubjectName ?? "General",
            OriginalTeacherId = s.OriginalTeacherId,
            OriginalTeacherName = s.OriginalTeacherName ?? (s.OriginalTeacher != null ? $"{s.OriginalTeacher.FirstName} {s.OriginalTeacher.LastName}".Trim() : "Absent Teacher"),
            SubstituteTeacherId = s.SubstituteTeacherId,
            SubstituteTeacherName = s.SubstituteTeacherName ?? (s.SubstituteTeacher != null ? $"{s.SubstituteTeacher.FirstName} {s.SubstituteTeacher.LastName}".Trim() : "Substitute Teacher"),
            RoomNo = s.RoomNo,
            Reason = s.Reason ?? "Teacher on Leave",
            LeaveApplicationId = s.LeaveApplicationId,
            Status = s.Status,
            Remarks = s.Remarks,
            CreatedAt = s.CreatedAt.ToString("o"),
            CreatedBy = s.CreatedBy,
            AcademicYear = s.AcademicYear,
            BranchName = s.BranchName
        }).ToList();
    }

    public async Task<List<AbsentTeacherScheduleDto>> GetAbsentTeachersScheduleAsync(
        DateTime date, 
        string? academicYear, 
        string? branchName)
    {
        var targetDate = date.Date;
        var dayOfWeek = targetDate.DayOfWeek.ToString();

        if (string.IsNullOrWhiteSpace(academicYear) || academicYear == "All")
        {
            academicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        // 1. Fetch All Active Teaching Staff
        var allStaff = await _context.Staff.AsNoTracking().ToListAsync();
        var teachers = allStaff.Where(IsTeachingStaff).ToList();
        var teacherIds = teachers.Select(t => t.StaffId).ToHashSet();

        // 2. Find Approved Leave Applications active on targetDate
        var activeLeaves = await _context.LeaveApplications
            .Include(l => l.Staff)
            .Include(l => l.LeaveType)
            .Where(l => l.Status == "Approved" && l.FromDate.Date <= targetDate && l.ToDate.Date >= targetDate)
            .AsNoTracking()
            .ToListAsync();

        // 3. Find Staff marked "On Leave" or "Absent" in StaffAttendance
        var absentAttendances = await _context.StaffAttendances
            .Where(a => a.Date.Date == targetDate && (a.Status == "On Leave" || a.Status == "Absent" || a.Status == "Half Day"))
            .AsNoTracking()
            .ToListAsync();

        // Combine absent teacher IDs
        var absentTeacherMap = new Dictionary<int, (string LeaveType, string LeaveReason, int? LeaveAppId, bool IsHalfDay)>();

        foreach (var leave in activeLeaves)
        {
            if (teacherIds.Contains(leave.StaffId) && !absentTeacherMap.ContainsKey(leave.StaffId))
            {
                absentTeacherMap[leave.StaffId] = (
                    leave.LeaveType?.Name ?? "Casual Leave",
                    leave.Reason ?? "Approved Leave",
                    leave.LeaveApplicationId,
                    leave.IsHalfDay
                );
            }
        }

        foreach (var att in absentAttendances)
        {
            if (teacherIds.Contains(att.StaffId) && !absentTeacherMap.ContainsKey(att.StaffId))
            {
                absentTeacherMap[att.StaffId] = (
                    att.Status == "On Leave" ? "On Leave (Attendance)" : "Marked Absent",
                    att.Remarks ?? "Absent on Duty Register",
                    null,
                    att.Status == "Half Day"
                );
            }
        }

        // If no absent teachers recorded yet, return empty list
        if (absentTeacherMap.Count == 0)
        {
            return new List<AbsentTeacherScheduleDto>();
        }

        // 4. Fetch all timetable slots for today's DayOfWeek for these absent teachers
        var absentIdsList = absentTeacherMap.Keys.ToList();
        var query = _context.TimetableSlots
            .Include(s => s.Header)
                .ThenInclude(h => h!.ClassGrade)
            .Include(s => s.Header)
                .ThenInclude(h => h!.ClassSection)
            .Include(s => s.Subject)
            .Include(s => s.Period)
            .Where(s => absentIdsList.Contains(s.TeacherId) && s.DayOfWeek == dayOfWeek)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(academicYear) && academicYear != "All")
        {
            query = query.Where(s => s.Header == null || s.Header.AcademicYear == academicYear);
        }

        var slots = await query.OrderBy(s => s.StartTime).ToListAsync();

        // 5. Fetch existing substitutions on this date
        var existingSubs = await _context.TeacherSubstitutions
            .Where(s => s.Date.Date == targetDate && s.Status != "Cancelled")
            .AsNoTracking()
            .ToListAsync();

        var periodMasters = await _context.PeriodSettings.AsNoTracking().Where(p => !p.IsDeleted).ToListAsync();

        var result = new List<AbsentTeacherScheduleDto>();

        foreach (var absentTeacherId in absentIdsList)
        {
            var teacherProfile = teachers.FirstOrDefault(t => t.StaffId == absentTeacherId);
            if (teacherProfile == null) continue;

            var tName = teacherProfile.DisplayName ?? $"{teacherProfile.FirstName} {teacherProfile.LastName}".Trim();
            var (lType, lReason, lAppId, isHalf) = absentTeacherMap[absentTeacherId];

            var teacherSlots = slots.Where(s => s.TeacherId == absentTeacherId).ToList();

            var periodDtos = new List<AbsentTeacherPeriodDto>();

            foreach (var slot in teacherSlots)
            {
                var matchedPeriod = slot.Period ?? periodMasters.FirstOrDefault(p => 
                    (slot.PeriodId.HasValue && p.PeriodId == slot.PeriodId.Value) || 
                    (p.StartTime == slot.StartTime && p.EndTime == slot.EndTime));

                var periodName = matchedPeriod?.PeriodName ?? $"Period";

                // Check if this slot already has an active substitution
                var sub = existingSubs.FirstOrDefault(s => 
                    (s.SlotId.HasValue && s.SlotId.Value == slot.SlotId) ||
                    (s.OriginalTeacherId == absentTeacherId && s.StartTime == slot.StartTime && s.EndTime == slot.EndTime));

                TeacherSubstitutionDto? subDto = null;
                if (sub != null)
                {
                    subDto = new TeacherSubstitutionDto
                    {
                        SubstitutionId = sub.SubstitutionId,
                        Date = sub.Date.ToString("yyyy-MM-dd"),
                        DayOfWeek = sub.DayOfWeek,
                        SlotId = sub.SlotId,
                        PeriodId = sub.PeriodId,
                        PeriodName = sub.PeriodName,
                        StartTime = FormatTime(sub.StartTime),
                        EndTime = FormatTime(sub.EndTime),
                        TimeSlot = $"{FormatTime(sub.StartTime)} - {FormatTime(sub.EndTime)}",
                        ClassId = sub.ClassId,
                        ClassName = sub.ClassName,
                        SectionId = sub.SectionId,
                        SectionName = sub.SectionName,
                        SubjectId = sub.SubjectId,
                        SubjectName = sub.SubjectName,
                        OriginalTeacherId = sub.OriginalTeacherId,
                        OriginalTeacherName = sub.OriginalTeacherName ?? tName,
                        SubstituteTeacherId = sub.SubstituteTeacherId,
                        SubstituteTeacherName = sub.SubstituteTeacherName ?? "Substitute Teacher",
                        RoomNo = sub.RoomNo,
                        Reason = sub.Reason,
                        Status = sub.Status,
                        Remarks = sub.Remarks
                    };
                }

                // If not replaced, get top leisure candidate teachers
                var leisureCandidates = new List<AvailableLeisureTeacherDto>();
                if (sub == null)
                {
                    leisureCandidates = await GetAvailableLeisureTeachersAsync(
                        targetDate, 
                        dayOfWeek, 
                        FormatTime(slot.StartTime), 
                        FormatTime(slot.EndTime), 
                        slot.SubjectId, 
                        absentTeacherId);
                }

                periodDtos.Add(new AbsentTeacherPeriodDto
                {
                    SlotId = slot.SlotId,
                    PeriodId = slot.PeriodId,
                    PeriodName = periodName,
                    StartTime = FormatTime(slot.StartTime),
                    EndTime = FormatTime(slot.EndTime),
                    TimeSlot = $"{FormatTime(slot.StartTime)} - {FormatTime(slot.EndTime)}",
                    ClassId = slot.Header?.ClassId ?? 0,
                    ClassName = slot.Header?.ClassGrade?.ClassName ?? $"Class {slot.Header?.ClassId}",
                    SectionId = slot.Header?.SectionId ?? 0,
                    SectionName = slot.Header?.ClassSection?.SectionName ?? "A",
                    SubjectId = slot.SubjectId,
                    SubjectName = slot.Subject?.SubjectName ?? "Subject",
                    RoomNo = slot.RoomNo ?? slot.Header?.ClassSection?.RoomNo,
                    IsReplaced = sub != null,
                    ActiveSubstitution = subDto,
                    AvailableLeisureTeachers = leisureCandidates
                });
            }

            int replacedCount = periodDtos.Count(p => p.IsReplaced);

            result.Add(new AbsentTeacherScheduleDto
            {
                TeacherId = absentTeacherId,
                TeacherName = tName,
                EmployeeId = teacherProfile.EmployeeId ?? "",
                Department = teacherProfile.Department ?? "Academic",
                LeaveType = lType,
                LeaveReason = lReason,
                LeaveApplicationId = lAppId,
                IsHalfDay = isHalf,
                TotalPeriodsToday = periodDtos.Count,
                ReplacedPeriodsCount = replacedCount,
                PendingPeriodsCount = periodDtos.Count - replacedCount,
                Periods = periodDtos
            });
        }

        return result;
    }

    public async Task<List<AvailableLeisureTeacherDto>> GetAvailableLeisureTeachersAsync(
        DateTime date, 
        string dayOfWeek, 
        string startTimeStr, 
        string endTimeStr, 
        int? subjectId, 
        int? excludeTeacherId = null)
    {
        var targetDate = date.Date;
        var startTime = ParseTime(startTimeStr);
        var endTime = ParseTime(endTimeStr);

        if (startTime == TimeSpan.Zero && endTime == TimeSpan.Zero)
        {
            return new List<AvailableLeisureTeacherDto>();
        }

        // 1. All Active Teaching Staff
        var allStaff = await _context.Staff.AsNoTracking().ToListAsync();
        var teachers = allStaff.Where(IsTeachingStaff).ToList();

        if (excludeTeacherId.HasValue)
        {
            teachers = teachers.Where(t => t.StaffId != excludeTeacherId.Value).ToList();
        }

        // 2. Absent / On Leave Teachers on this date
        var onLeaveTeacherIds = await _context.LeaveApplications
            .Where(l => l.Status == "Approved" && l.FromDate.Date <= targetDate && l.ToDate.Date >= targetDate)
            .Select(l => l.StaffId)
            .Distinct()
            .ToListAsync();

        var absentAttendanceIds = await _context.StaffAttendances
            .Where(a => a.Date.Date == targetDate && (a.Status == "On Leave" || a.Status == "Absent"))
            .Select(a => a.StaffId)
            .Distinct()
            .ToListAsync();

        var busyOrAbsentIds = new HashSet<int>(onLeaveTeacherIds.Concat(absentAttendanceIds));

        // 3. Teachers with scheduled class in TimetableSlots at this time & dayOfWeek
        var busySlotTeacherIds = await _context.TimetableSlots
            .Where(s => s.DayOfWeek == dayOfWeek && s.StartTime < endTime && s.EndTime > startTime)
            .Select(s => s.TeacherId)
            .Distinct()
            .ToListAsync();

        foreach (var id in busySlotTeacherIds)
        {
            busyOrAbsentIds.Add(id);
        }

        // 4. Teachers already substituting in this time slot on this date
        var busySubTeacherIds = await _context.TeacherSubstitutions
            .Where(s => s.Date.Date == targetDate && s.Status != "Cancelled" && s.StartTime < endTime && s.EndTime > startTime)
            .Select(s => s.SubstituteTeacherId)
            .Distinct()
            .ToListAsync();

        foreach (var id in busySubTeacherIds)
        {
            busyOrAbsentIds.Add(id);
        }

        // 5. Teachers remaining are AT LEISURE (Free Period)!
        var leisureTeachers = teachers.Where(t => !busyOrAbsentIds.Contains(t.StaffId)).ToList();

        // 6. Calculate statistics and matching weight
        var targetSubject = subjectId.HasValue && subjectId.Value > 0
            ? await _context.Subjects.AsNoTracking().FirstOrDefaultAsync(s => s.SubjectId == subjectId.Value)
            : null;

        var targetSubjectName = (targetSubject?.SubjectName ?? "").ToLower().Trim();

        var teacherAssignments = await _context.TeacherSubjectAssignments
            .Include(tsa => tsa.Subject)
            .AsNoTracking()
            .ToListAsync();

        var todaySubs = await _context.TeacherSubstitutions
            .Where(s => s.Date.Date == targetDate && s.Status != "Cancelled")
            .AsNoTracking()
            .ToListAsync();

        var todayLectures = await _context.TimetableSlots
            .Where(s => s.DayOfWeek == dayOfWeek)
            .AsNoTracking()
            .ToListAsync();

        var candidateList = new List<AvailableLeisureTeacherDto>();

        foreach (var t in leisureTeachers)
        {
            var tName = t.DisplayName ?? $"{t.FirstName} {t.LastName}".Trim();
            var tDept = (t.Department ?? "").ToLower().Trim();

            // Check assigned subjects for this teacher
            var assignedSubs = teacherAssignments
                .Where(ta => ta.StaffId == t.StaffId && ta.Subject != null && !string.IsNullOrWhiteSpace(ta.Subject.SubjectName))
                .Select(ta => ta.Subject!.SubjectName!)
                .Distinct()
                .ToList();

            if (!string.IsNullOrWhiteSpace(t.PrimarySubject) && !assignedSubs.Contains(t.PrimarySubject))
            {
                assignedSubs.Add(t.PrimarySubject);
            }

            if (!string.IsNullOrWhiteSpace(t.Department) && !assignedSubs.Contains(t.Department))
            {
                assignedSubs.Add(t.Department);
            }

            bool isSubjectMatch = false;
            if (!string.IsNullOrWhiteSpace(targetSubjectName))
            {
                isSubjectMatch = assignedSubs.Any(s => s.ToLower().Contains(targetSubjectName) || targetSubjectName.Contains(s.ToLower())) ||
                                 tDept.Contains(targetSubjectName) || targetSubjectName.Contains(tDept);
            }

            bool isDeptMatch = !string.IsNullOrWhiteSpace(tDept) && !string.IsNullOrWhiteSpace(targetSubjectName) &&
                               (tDept.Contains(targetSubjectName) || targetSubjectName.Contains(tDept));

            int subCount = todaySubs.Count(s => s.SubstituteTeacherId == t.StaffId);
            int lectureCount = todayLectures.Count(s => s.TeacherId == t.StaffId);

            candidateList.Add(new AvailableLeisureTeacherDto
            {
                TeacherId = t.StaffId,
                TeacherName = tName,
                EmployeeId = t.EmployeeId ?? "",
                Department = t.Department ?? "Academic",
                Designation = t.Designation ?? "Teacher",
                AssignedSubjects = assignedSubs,
                IsSubjectMatch = isSubjectMatch,
                IsDepartmentMatch = isDeptMatch,
                TodaySubstitutionsCount = subCount,
                TodayScheduledLecturesCount = lectureCount,
                AvailabilityStatus = "At Leisure (Free Period)"
            });
        }

        // Sort: Direct Subject Match first, then Department match, then fewest today substitutions, then name
        return candidateList
            .OrderByDescending(c => c.IsSubjectMatch)
            .ThenByDescending(c => c.IsDepartmentMatch)
            .ThenBy(c => c.TodaySubstitutionsCount)
            .ThenBy(c => c.TodayScheduledLecturesCount)
            .ThenBy(c => c.TeacherName)
            .ToList();
    }

    public async Task<TeacherSubstitutionDto> AssignSubstitutionAsync(
        AssignTeacherSubstitutionDto dto, 
        string? currentUserName = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Date))
            throw new BadRequestException("Date is required for assigning substitution.");

        if (!DateTime.TryParse(dto.Date, out var parsedDate))
            throw new BadRequestException($"Invalid date format '{dto.Date}'.");

        var targetDate = parsedDate.Date;
        var dayOfWeek = targetDate.DayOfWeek.ToString();

        var startTime = ParseTime(dto.StartTime);
        var endTime = ParseTime(dto.EndTime);

        if (startTime >= endTime)
            throw new BadRequestException($"Start time ({FormatTime(startTime)}) must be earlier than end time ({FormatTime(endTime)}).");

        if (dto.SubstituteTeacherId <= 0)
            throw new BadRequestException("Substitute Teacher must be selected.");

        if (dto.OriginalTeacherId <= 0)
            throw new BadRequestException("Original (Absent) Teacher must be specified.");

        if (dto.SubstituteTeacherId == dto.OriginalTeacherId)
            throw new BadRequestException("Substitute teacher cannot be the same as the absent teacher.");

        // Check if substitute teacher is already substituting in this time slot on this date
        var existingSub = await _context.TeacherSubstitutions
            .FirstOrDefaultAsync(s => s.Date.Date == targetDate &&
                                      s.SubstituteTeacherId == dto.SubstituteTeacherId &&
                                      s.Status != "Cancelled" &&
                                      s.StartTime < endTime && s.EndTime > startTime);

        if (existingSub != null)
        {
            throw new BadRequestException($"Selected substitute teacher is already assigned to another substitution duty ({existingSub.ClassName} {existingSub.SectionName}) during {FormatTime(startTime)} - {FormatTime(endTime)}.");
        }

        // Check if substitute teacher has a regular scheduled lecture
        var regularClassClash = await _context.TimetableSlots
            .Include(s => s.Header)
                .ThenInclude(h => h!.ClassGrade)
            .FirstOrDefaultAsync(s => s.TeacherId == dto.SubstituteTeacherId &&
                                      s.DayOfWeek == dayOfWeek &&
                                      s.StartTime < endTime && s.EndTime > startTime);

        if (regularClassClash != null)
        {
            var cName = regularClassClash.Header?.ClassGrade?.ClassName ?? "Class";
            throw new BadRequestException($"Selected substitute teacher already has a regular scheduled lecture ({cName}) during {FormatTime(startTime)} - {FormatTime(endTime)}. Please select a teacher who is at leisure.");
        }

        // Resolve teacher names if null
        var subTeacher = await _context.Staff.FindAsync(dto.SubstituteTeacherId);
        var subTeacherName = dto.SubstituteTeacherName ?? (subTeacher != null ? (subTeacher.DisplayName ?? $"{subTeacher.FirstName} {subTeacher.LastName}".Trim()) : "Substitute Faculty");

        var origTeacher = await _context.Staff.FindAsync(dto.OriginalTeacherId);
        var origTeacherName = dto.OriginalTeacherName ?? (origTeacher != null ? (origTeacher.DisplayName ?? $"{origTeacher.FirstName} {origTeacher.LastName}".Trim()) : "Absent Faculty");

        // If there's an existing substitution for this same slot & date, update it
        TeacherSubstitution substitution;
        var existingSlotSub = await _context.TeacherSubstitutions
            .FirstOrDefaultAsync(s => s.Date.Date == targetDate &&
                                      s.OriginalTeacherId == dto.OriginalTeacherId &&
                                      s.StartTime == startTime &&
                                      s.EndTime == endTime &&
                                      s.Status != "Cancelled");

        if (existingSlotSub != null)
        {
            existingSlotSub.SubstituteTeacherId = dto.SubstituteTeacherId;
            existingSlotSub.SubstituteTeacherName = subTeacherName;
            existingSlotSub.Reason = dto.Reason ?? existingSlotSub.Reason;
            existingSlotSub.Remarks = dto.Remarks ?? existingSlotSub.Remarks;
            existingSlotSub.RoomNo = dto.RoomNo ?? existingSlotSub.RoomNo;
            existingSlotSub.CreatedBy = currentUserName ?? existingSlotSub.CreatedBy;
            substitution = existingSlotSub;
        }
        else
        {
            substitution = new TeacherSubstitution
            {
                Date = targetDate,
                DayOfWeek = dayOfWeek,
                SlotId = dto.SlotId,
                PeriodId = dto.PeriodId,
                PeriodName = dto.PeriodName ?? "Teaching Period",
                StartTime = startTime,
                EndTime = endTime,
                ClassId = dto.ClassId,
                ClassName = dto.ClassName,
                SectionId = dto.SectionId,
                SectionName = dto.SectionName,
                SubjectId = dto.SubjectId,
                SubjectName = dto.SubjectName,
                OriginalTeacherId = dto.OriginalTeacherId,
                OriginalTeacherName = origTeacherName,
                SubstituteTeacherId = dto.SubstituteTeacherId,
                SubstituteTeacherName = subTeacherName,
                RoomNo = dto.RoomNo,
                Reason = dto.Reason ?? "Teacher on Leave",
                LeaveApplicationId = dto.LeaveApplicationId,
                Status = "Assigned",
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = currentUserName ?? "Administrator",
                AcademicYear = dto.AcademicYear,
                BranchName = dto.BranchName
            };
            _context.TeacherSubstitutions.Add(substitution);
        }

        await _context.SaveChangesAsync();

        return new TeacherSubstitutionDto
        {
            SubstitutionId = substitution.SubstitutionId,
            Date = substitution.Date.ToString("yyyy-MM-dd"),
            DayOfWeek = substitution.DayOfWeek,
            SlotId = substitution.SlotId,
            PeriodId = substitution.PeriodId,
            PeriodName = substitution.PeriodName,
            StartTime = FormatTime(substitution.StartTime),
            EndTime = FormatTime(substitution.EndTime),
            TimeSlot = $"{FormatTime(substitution.StartTime)} - {FormatTime(substitution.EndTime)}",
            ClassId = substitution.ClassId,
            ClassName = substitution.ClassName,
            SectionId = substitution.SectionId,
            SectionName = substitution.SectionName,
            SubjectId = substitution.SubjectId,
            SubjectName = substitution.SubjectName,
            OriginalTeacherId = substitution.OriginalTeacherId,
            OriginalTeacherName = substitution.OriginalTeacherName ?? origTeacherName,
            SubstituteTeacherId = substitution.SubstituteTeacherId,
            SubstituteTeacherName = substitution.SubstituteTeacherName ?? subTeacherName,
            RoomNo = substitution.RoomNo,
            Reason = substitution.Reason,
            LeaveApplicationId = substitution.LeaveApplicationId,
            Status = substitution.Status,
            Remarks = substitution.Remarks,
            CreatedAt = substitution.CreatedAt.ToString("o"),
            CreatedBy = substitution.CreatedBy,
            AcademicYear = substitution.AcademicYear,
            BranchName = substitution.BranchName
        };
    }

    public async Task<AutoReplaceSubstitutionsResultDto> AutoReplaceSubstitutionsAsync(
        AutoReplaceSubstitutionsRequestDto dto, 
        string? currentUserName = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Date))
            throw new BadRequestException("Date is required for auto-substitution.");

        if (!DateTime.TryParse(dto.Date, out var parsedDate))
            throw new BadRequestException($"Invalid date format '{dto.Date}'.");

        var targetDate = parsedDate.Date;
        var schedules = await GetAbsentTeachersScheduleAsync(targetDate, dto.AcademicYear, dto.BranchName);

        if (dto.TeacherId.HasValue && dto.TeacherId.Value > 0)
        {
            schedules = schedules.Where(s => s.TeacherId == dto.TeacherId.Value).ToList();
        }

        var createdSubstitutions = new List<TeacherSubstitutionDto>();
        var uncoveredDescriptions = new List<string>();
        int totalUnassigned = 0;

        foreach (var sched in schedules)
        {
            foreach (var p in sched.Periods)
            {
                if (p.IsReplaced) continue;
                totalUnassigned++;

                // Find fresh leisure teachers for this slot (considering any assignments made in this loop)
                var leisureCandidates = await GetAvailableLeisureTeachersAsync(
                    targetDate,
                    targetDate.DayOfWeek.ToString(),
                    p.StartTime,
                    p.EndTime,
                    p.SubjectId,
                    sched.TeacherId);

                if (leisureCandidates.Any())
                {
                    // Pick top leisure candidate
                    var bestTeacher = leisureCandidates.First();

                    try
                    {
                        var assignDto = new AssignTeacherSubstitutionDto
                        {
                            Date = dto.Date,
                            SlotId = p.SlotId,
                            PeriodId = p.PeriodId,
                            PeriodName = p.PeriodName,
                            StartTime = p.StartTime,
                            EndTime = p.EndTime,
                            ClassId = p.ClassId,
                            ClassName = p.ClassName,
                            SectionId = p.SectionId,
                            SectionName = p.SectionName,
                            SubjectId = p.SubjectId,
                            SubjectName = p.SubjectName,
                            OriginalTeacherId = sched.TeacherId,
                            OriginalTeacherName = sched.TeacherName,
                            SubstituteTeacherId = bestTeacher.TeacherId,
                            SubstituteTeacherName = bestTeacher.TeacherName,
                            RoomNo = p.RoomNo,
                            Reason = $"Auto-Replaced for {sched.LeaveType}",
                            LeaveApplicationId = sched.LeaveApplicationId,
                            Remarks = dto.Remarks ?? "Auto-Assigned by System (Leisure Period)",
                            AcademicYear = dto.AcademicYear,
                            BranchName = dto.BranchName
                        };

                        var sub = await AssignSubstitutionAsync(assignDto, currentUserName ?? "Auto-Substitution Engine");
                        createdSubstitutions.Add(sub);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to auto-assign period {Period} for {Teacher}", p.PeriodName, sched.TeacherName);
                        uncoveredDescriptions.Add($"{sched.TeacherName} - {p.ClassName}-{p.SectionName} ({p.SubjectName} at {p.TimeSlot}): {ex.Message}");
                    }
                }
                else
                {
                    uncoveredDescriptions.Add($"{sched.TeacherName} - {p.ClassName}-{p.SectionName} ({p.SubjectName} at {p.TimeSlot}): No leisure teacher available at this time.");
                }
            }
        }

        return new AutoReplaceSubstitutionsResultDto
        {
            Success = true,
            Message = createdSubstitutions.Any()
                ? $"Successfully auto-assigned {createdSubstitutions.Count} period(s) to leisure teachers."
                : (totalUnassigned == 0 ? "All periods are already covered." : "No available leisure teachers found for uncovered periods."),
            TotalUnassignedPeriods = totalUnassigned,
            SuccessfullyReplacedCount = createdSubstitutions.Count,
            UncoveredCount = uncoveredDescriptions.Count,
            CreatedSubstitutions = createdSubstitutions,
            UncoveredPeriodDescriptions = uncoveredDescriptions
        };
    }

    public async Task<bool> CancelSubstitutionAsync(int substitutionId)
    {
        var sub = await _context.TeacherSubstitutions.FindAsync(substitutionId);
        if (sub == null)
            throw new NotFoundException($"Substitution record with ID {substitutionId} not found.");

        _context.TeacherSubstitutions.Remove(sub);
        await _context.SaveChangesAsync();
        return true;
    }
}
