namespace SMS.Api.Services.Implementations;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TimetableService : ITimetableService
{
    private readonly ITimetableRepository _timetableRepository;
    private readonly AppDbContext _context;

    public TimetableService(ITimetableRepository timetableRepository, AppDbContext context)
    {
        _timetableRepository = timetableRepository;
        _context = context;
    }

    // =========================================================
    // TIME PARSING HELPER
    // =========================================================

    private static TimeSpan ParseTime(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
            throw new BadRequestException("Time string cannot be empty.");

        timeStr = timeStr.Trim();

        // Formats: "08:30 AM", "8:30 AM", "08:30:00", "08:30"
        string[] formats = { "hh:mm tt", "h:mm tt", "hh:mm:ss", "hh:mm", "h:mm", "H:mm", "HH:mm" };

        if (DateTime.TryParseExact(timeStr, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDateTime))
        {
            return parsedDateTime.TimeOfDay;
        }

        if (TimeSpan.TryParse(timeStr, out var parsedSpan))
        {
            return parsedSpan;
        }

        throw new BadRequestException($"Invalid time format: '{timeStr}'. Expected format e.g. '08:30 AM' or '08:30'.");
    }

    private static string FormatTime(TimeSpan span)
    {
        var dummyDate = DateTime.Today.Add(span);
        return dummyDate.ToString("hh:mm tt", CultureInfo.InvariantCulture);
    }

    // =========================================================
    // PERIOD SETTINGS MASTER
    // =========================================================

    public async Task<List<PeriodSettingDto>> GetPeriodSettingsAsync()
    {
        var periods = await _timetableRepository.GetPeriodSettingsAsync();
        return periods.Select(p => new PeriodSettingDto
        {
            PeriodId = p.PeriodId,
            PeriodName = p.PeriodName,
            StartTime = FormatTime(p.StartTime),
            EndTime = FormatTime(p.EndTime),
            PeriodType = p.PeriodType,
            DisplayOrder = p.DisplayOrder
        }).ToList();
    }

    public async Task<PeriodSettingDto> SavePeriodSettingAsync(SavePeriodSettingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PeriodName))
            throw new BadRequestException("Period Name is required.");

        var startTime = ParseTime(dto.StartTime);
        var endTime = ParseTime(dto.EndTime);

        if (startTime >= endTime)
            throw new PeriodOverlapException($"Start time ({FormatTime(startTime)}) must be earlier than end time ({FormatTime(endTime)}).");

        // Check for timing overlaps with existing period settings
        bool hasOverlap = await _timetableRepository.HasOverlappingPeriodSettingAsync(startTime, endTime, dto.PeriodId);
        if (hasOverlap)
        {
            throw new PeriodOverlapException($"Period timing slot {FormatTime(startTime)} - {FormatTime(endTime)} overlaps with an existing period setting slot.");
        }

        PeriodSetting period;
        if (dto.PeriodId.HasValue && dto.PeriodId.Value > 0)
        {
            period = await _timetableRepository.GetPeriodSettingByIdAsync(dto.PeriodId.Value)
                ?? throw new NotFoundException($"Period setting with ID {dto.PeriodId} not found.");
            period.PeriodName = dto.PeriodName.Trim();
            period.StartTime = startTime;
            period.EndTime = endTime;
            period.PeriodType = dto.PeriodType;
            period.DisplayOrder = dto.DisplayOrder;
        }
        else
        {
            period = new PeriodSetting
            {
                PeriodName = dto.PeriodName.Trim(),
                StartTime = startTime,
                EndTime = endTime,
                PeriodType = dto.PeriodType,
                DisplayOrder = dto.DisplayOrder,
                IsActive = true,
                IsDeleted = false
            };
        }

        await _timetableRepository.SavePeriodSettingAsync(period);

        return new PeriodSettingDto
        {
            PeriodId = period.PeriodId,
            PeriodName = period.PeriodName,
            StartTime = FormatTime(period.StartTime),
            EndTime = FormatTime(period.EndTime),
            PeriodType = period.PeriodType,
            DisplayOrder = period.DisplayOrder
        };
    }

    public async Task<bool> DeletePeriodSettingAsync(int periodId)
    {
        return await _timetableRepository.DeletePeriodSettingAsync(periodId);
    }

    // =========================================================
    // CLASS TIMETABLE MATRIX & SLOTS
    // =========================================================

    public async Task<ClassTimetableGridDto> GetClassTimetableGridAsync(int classId, int sectionId, string academicYear = "2026-2027")
    {
        var classGrade = await _context.Classes.FirstOrDefaultAsync(c => c.ClassId == classId)
            ?? throw new NotFoundException($"Class with ID {classId} not found.");

        var section = await _context.ClassSections.FirstOrDefaultAsync(s => s.SectionId == sectionId)
            ?? throw new NotFoundException($"Section with ID {sectionId} not found.");

        var header = await _timetableRepository.GetHeaderByClassSectionAsync(classId, sectionId, academicYear);
        if (header == null)
        {
            header = new TimetableHeader
            {
                ClassId = classId,
                SectionId = sectionId,
                AcademicYear = academicYear,
                BranchName = "Main Campus",
                Status = "Draft",
                IncludeSaturday = true,
                CreatedAt = DateTime.UtcNow
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }

        var periods = await GetPeriodSettingsAsync();
        var slots = await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId);
        var subjectCandidates = await GetClassSubjectsCandidatesAsync(classId, sectionId);

        // Update assigned periods count per subject
        foreach (var sub in subjectCandidates)
        {
            sub.AssignedPeriodsPerWeek = slots.Count(s => s.SubjectId == sub.SubjectId);
        }

        var slotDtos = slots.Select(s => new TimetableSlotDto
        {
            SlotId = s.SlotId,
            HeaderId = s.HeaderId,
            PeriodId = s.PeriodId,
            PeriodName = s.Period?.PeriodName ?? "Custom Period",
            DayOfWeek = s.DayOfWeek,
            StartTime = FormatTime(s.StartTime),
            EndTime = FormatTime(s.EndTime),
            SubjectId = s.SubjectId,
            SubjectName = s.Subject?.SubjectName ?? string.Empty,
            SubjectCode = s.Subject?.SubjectCode ?? string.Empty,
            TeacherId = s.TeacherId,
            TeacherName = s.Teacher != null ? $"{s.Teacher.FirstName} {s.Teacher.LastName}" : string.Empty,
            EmployeeId = s.Teacher?.EmployeeId ?? string.Empty,
            RoomNo = s.RoomNo
        }).ToList();

        return new ClassTimetableGridDto
        {
            HeaderId = header.HeaderId,
            AcademicYear = header.AcademicYear,
            BranchName = header.BranchName,
            ClassId = classId,
            ClassName = classGrade.ClassName,
            SectionId = sectionId,
            SectionName = section.SectionName,
            Status = header.Status,
            IncludeSaturday = header.IncludeSaturday,
            Periods = periods,
            Slots = slotDtos,
            ClassSubjects = subjectCandidates
        };
    }

    public async Task<TimetableSlotDto> SaveTimetableSlotAsync(SaveTimetableSlotDto dto)
    {
        var startTime = ParseTime(dto.StartTime);
        var endTime = ParseTime(dto.EndTime);

        if (startTime >= endTime)
            throw new PeriodOverlapException($"Start time ({FormatTime(startTime)}) must be earlier than end time ({FormatTime(endTime)}).");

        // 1. Get or Create Header
        var header = await _timetableRepository.GetHeaderByClassSectionAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
        if (header == null)
        {
            header = new TimetableHeader
            {
                ClassId = dto.ClassId,
                SectionId = dto.SectionId,
                AcademicYear = dto.AcademicYear,
                BranchName = dto.BranchName,
                Status = "Draft",
                IncludeSaturday = true
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }

        // 2. Resolve Subject
        var subject = await _context.Subjects.FindAsync(dto.SubjectId)
            ?? throw new NotFoundException($"Subject with ID {dto.SubjectId} not found.");

        // 3. Resolve Assigned Teacher (Auto-populated if not supplied)
        int teacherId;
        if (dto.TeacherId.HasValue && dto.TeacherId.Value > 0)
        {
            teacherId = dto.TeacherId.Value;
        }
        else
        {
            var assignedStaff = await _timetableRepository.GetAssignedTeacherForSubjectAsync(dto.ClassId, dto.SectionId, dto.SubjectId);
            if (assignedStaff == null)
            {
                // Fallback to first active teacher in department
                assignedStaff = await _context.Staff
                    .Where(s => s.IsActive && s.Department.ToLower() == subject.DepartmentId.ToString())
                    .FirstOrDefaultAsync()
                    ?? await _context.Staff.FirstOrDefaultAsync(s => s.IsActive)
                    ?? throw new BadRequestException($"No assigned teacher found for subject '{subject.SubjectName}'. Please assign a teacher to this class subject.");
            }
            teacherId = assignedStaff.StaffId;
        }

        var teacher = await _context.Staff.FindAsync(teacherId)
            ?? throw new NotFoundException($"Teacher/Staff with ID {teacherId} not found.");

        // 4. TEACHER CONFLICT VALIDATION
        var teacherConflict = await _timetableRepository.CheckTeacherConflictAsync(teacherId, dto.DayOfWeek, startTime, endTime);
        if (teacherConflict != null && teacherConflict.HeaderId != header.HeaderId)
        {
            var otherClass = teacherConflict.Header?.ClassGrade?.ClassName ?? "another class";
            var otherSec = teacherConflict.Header?.ClassSection?.SectionName ?? "";
            throw new TimetableConflictException(
                $"Teacher Overlap Conflict: Teacher '{teacher.FirstName} {teacher.LastName} ({teacher.EmployeeId})' is already assigned to {otherClass} - Section {otherSec} on {dto.DayOfWeek} ({FormatTime(teacherConflict.StartTime)} - {FormatTime(teacherConflict.EndTime)})."
            );
        }

        // 5. ROOM CONFLICT VALIDATION
        if (!string.IsNullOrWhiteSpace(dto.RoomNo))
        {
            var roomConflict = await _timetableRepository.CheckRoomConflictAsync(dto.RoomNo, dto.DayOfWeek, startTime, endTime);
            if (roomConflict != null && roomConflict.HeaderId != header.HeaderId)
            {
                var otherClass = roomConflict.Header?.ClassGrade?.ClassName ?? "another class";
                var otherSec = roomConflict.Header?.ClassSection?.SectionName ?? "";
                throw new TimetableConflictException(
                    $"Room Overlap Conflict: '{dto.RoomNo}' is already occupied by {otherClass} - Section {otherSec} on {dto.DayOfWeek} ({FormatTime(roomConflict.StartTime)} - {FormatTime(roomConflict.EndTime)})."
                );
            }
        }

        // 6. Check existing slot for this class on same day and same period/time slot
        var existingSlot = (await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId))
            .FirstOrDefault(s => s.DayOfWeek.Equals(dto.DayOfWeek, StringComparison.OrdinalIgnoreCase) &&
                                 ((s.PeriodId.HasValue && dto.PeriodId.HasValue && s.PeriodId == dto.PeriodId) ||
                                  (s.StartTime == startTime && s.EndTime == endTime)));

        TimetableSlot slot;
        if (existingSlot != null)
        {
            slot = existingSlot;
            slot.SubjectId = dto.SubjectId;
            slot.TeacherId = teacherId;
            slot.RoomNo = dto.RoomNo;
            slot.PeriodId = dto.PeriodId;
            slot.StartTime = startTime;
            slot.EndTime = endTime;
        }
        else
        {
            slot = new TimetableSlot
            {
                HeaderId = header.HeaderId,
                PeriodId = dto.PeriodId,
                DayOfWeek = dto.DayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                SubjectId = dto.SubjectId,
                TeacherId = teacherId,
                RoomNo = dto.RoomNo
            };
        }

        slot = await _timetableRepository.SaveSlotAsync(slot);

        return new TimetableSlotDto
        {
            SlotId = slot.SlotId,
            HeaderId = slot.HeaderId,
            PeriodId = slot.PeriodId,
            PeriodName = slot.Period?.PeriodName ?? "Custom Period",
            DayOfWeek = slot.DayOfWeek,
            StartTime = FormatTime(slot.StartTime),
            EndTime = FormatTime(slot.EndTime),
            SubjectId = slot.SubjectId,
            SubjectName = subject.SubjectName,
            SubjectCode = subject.SubjectCode,
            TeacherId = teacher.StaffId,
            TeacherName = $"{teacher.FirstName} {teacher.LastName}",
            EmployeeId = teacher.EmployeeId,
            RoomNo = slot.RoomNo
        };
    }

    public async Task<bool> DeleteTimetableSlotAsync(int slotId)
    {
        return await _timetableRepository.DeleteSlotAsync(slotId);
    }

    public async Task<ClassTimetableGridDto> PublishTimetableAsync(PublishTimetableDto dto)
    {
        var header = await _timetableRepository.GetHeaderByClassSectionAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
        if (header == null)
        {
            header = new TimetableHeader
            {
                ClassId = dto.ClassId,
                SectionId = dto.SectionId,
                AcademicYear = dto.AcademicYear,
                BranchName = "Main Campus",
                Status = dto.Status,
                IncludeSaturday = true
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }
        else
        {
            await _timetableRepository.UpdateHeaderStatusAsync(header.HeaderId, dto.Status);
        }

        return await GetClassTimetableGridAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
    }

    // =========================================================
    // AUTO-GENERATED TEACHER & STUDENT TIMETABLES
    // =========================================================

    public async Task<TeacherTimetableDto> GetTeacherTimetableAsync(int teacherId, string academicYear = "2026-2027")
    {
        var teacher = await _context.Staff.FindAsync(teacherId)
            ?? throw new NotFoundException($"Teacher with ID {teacherId} not found.");

        var slots = await _timetableRepository.GetTeacherTimetableSlotsAsync(teacherId, academicYear);

        var daysOrder = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
        var daySchedules = new List<DayScheduleDto>();

        foreach (var day in daysOrder)
        {
            var daySlots = slots.Where(s => s.DayOfWeek.Equals(day, StringComparison.OrdinalIgnoreCase))
                .Select(s => new TimetableSlotDto
                {
                    SlotId = s.SlotId,
                    HeaderId = s.HeaderId,
                    PeriodId = s.PeriodId,
                    PeriodName = s.Period?.PeriodName ?? "Period",
                    DayOfWeek = s.DayOfWeek,
                    StartTime = FormatTime(s.StartTime),
                    EndTime = FormatTime(s.EndTime),
                    SubjectId = s.SubjectId,
                    SubjectName = s.Subject?.SubjectName ?? "",
                    SubjectCode = s.Subject?.SubjectCode ?? "",
                    TeacherId = teacher.StaffId,
                    TeacherName = $"{teacher.FirstName} {teacher.LastName}",
                    EmployeeId = teacher.EmployeeId,
                    RoomNo = s.RoomNo
                }).ToList();

            daySchedules.Add(new DayScheduleDto
            {
                DayOfWeek = day,
                Periods = daySlots
            });
        }

        return new TeacherTimetableDto
        {
            TeacherId = teacher.StaffId,
            TeacherName = $"{teacher.FirstName} {teacher.LastName}",
            EmployeeId = teacher.EmployeeId,
            Department = teacher.Department,
            Days = daySchedules
        };
    }

    public async Task<StudentTimetableDto> GetStudentTimetableAsync(int classId, int sectionId, string academicYear = "2026-2027")
    {
        var classGrade = await _context.Classes.FindAsync(classId)
            ?? throw new NotFoundException($"Class {classId} not found.");

        var section = await _context.ClassSections.FindAsync(sectionId)
            ?? throw new NotFoundException($"Section {sectionId} not found.");

        var slots = await _timetableRepository.GetStudentTimetableSlotsAsync(classId, sectionId, academicYear);

        var daysOrder = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
        var daySchedules = new List<DayScheduleDto>();

        foreach (var day in daysOrder)
        {
            var daySlots = slots.Where(s => s.DayOfWeek.Equals(day, StringComparison.OrdinalIgnoreCase))
                .Select(s => new TimetableSlotDto
                {
                    SlotId = s.SlotId,
                    HeaderId = s.HeaderId,
                    PeriodId = s.PeriodId,
                    PeriodName = s.Period?.PeriodName ?? "Period",
                    DayOfWeek = s.DayOfWeek,
                    StartTime = FormatTime(s.StartTime),
                    EndTime = FormatTime(s.EndTime),
                    SubjectId = s.SubjectId,
                    SubjectName = s.Subject?.SubjectName ?? "",
                    SubjectCode = s.Subject?.SubjectCode ?? "",
                    TeacherId = s.TeacherId,
                    TeacherName = s.Teacher != null ? $"{s.Teacher.FirstName} {s.Teacher.LastName}" : "",
                    EmployeeId = s.Teacher?.EmployeeId ?? "",
                    RoomNo = s.RoomNo
                }).ToList();

            daySchedules.Add(new DayScheduleDto
            {
                DayOfWeek = day,
                Periods = daySlots
            });
        }

        return new StudentTimetableDto
        {
            ClassId = classId,
            ClassName = classGrade.ClassName,
            SectionId = sectionId,
            SectionName = section.SectionName,
            AcademicYear = academicYear,
            Days = daySchedules
        };
    }

    // =========================================================
    // COPY TIMETABLE
    // =========================================================

    public async Task<ClassTimetableGridDto> CopyTimetableAsync(CopyTimetableDto dto)
    {
        var sourceHeader = await _timetableRepository.GetHeaderByClassSectionAsync(dto.SourceClassId, dto.SourceSectionId, dto.AcademicYear)
            ?? throw new NotFoundException($"Source timetable schedule for Class {dto.SourceClassId} Section {dto.SourceSectionId} not found.");

        var targetHeader = await _timetableRepository.GetHeaderByClassSectionAsync(dto.TargetClassId, dto.TargetSectionId, dto.AcademicYear);
        if (targetHeader == null)
        {
            targetHeader = new TimetableHeader
            {
                ClassId = dto.TargetClassId,
                SectionId = dto.TargetSectionId,
                AcademicYear = dto.AcademicYear,
                BranchName = sourceHeader.BranchName,
                Status = "Draft",
                IncludeSaturday = sourceHeader.IncludeSaturday
            };
            targetHeader = await _timetableRepository.CreateHeaderAsync(targetHeader);
        }

        await _timetableRepository.CopyTimetableSlotsAsync(sourceHeader.HeaderId, targetHeader.HeaderId);
        return await GetClassTimetableGridAsync(dto.TargetClassId, dto.TargetSectionId, dto.AcademicYear);
    }

    // =========================================================
    // CLASS SUBJECTS CANDIDATE HELPER
    // =========================================================

    public async Task<List<ClassSubjectQuotaDto>> GetClassSubjectsCandidatesAsync(int classId, int sectionId)
    {
        // Fetch subjects mapped to class
        var mappedSubjects = await _context.ClassCurriculumSubjects
            .Where(c => c.ClassId == classId)
            .Select(c => c.SubjectId)
            .ToListAsync();

        List<Subject> subjects;
        if (mappedSubjects.Any())
        {
            subjects = await _context.Subjects
                .Where(s => mappedSubjects.Contains(s.SubjectId))
                .ToListAsync();
        }
        else
        {
            // Fallback: Return top active subjects
            subjects = await _context.Subjects
                .Take(6)
                .ToListAsync();
        }

        var result = new List<ClassSubjectQuotaDto>();

        foreach (var sub in subjects)
        {
            var teacher = await _timetableRepository.GetAssignedTeacherForSubjectAsync(classId, sectionId, sub.SubjectId);

            result.Add(new ClassSubjectQuotaDto
            {
                SubjectId = sub.SubjectId,
                SubjectName = sub.SubjectName,
                SubjectCode = sub.SubjectCode,
                AssignedTeacherId = teacher?.StaffId ?? 0,
                AssignedTeacherName = teacher != null ? $"{teacher.FirstName} {teacher.LastName} ({teacher.EmployeeId})" : "Unassigned Faculty",
                AssignedPeriodsPerWeek = 0,
                MaxPeriodsPerWeek = 5
            });
        }

        return result;
    }
}
