namespace SMS.Api.Services.Implementations.AcademicManagement;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Repositories.Interfaces.AcademicManagement;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.AcademicManagement;

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
            ClassName = classGrade.ClassName ?? "",
            SectionId = sectionId,
            SectionName = section.SectionName ?? "",
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
                // BUG-017 FIX: load subject with its Department so we can compare by name, not int ID
                var subjectWithDept = await _context.Subjects
                    .Include(s => s.Department)
                    .FirstOrDefaultAsync(s => s.SubjectId == dto.SubjectId);

                if (subjectWithDept?.Department != null)
                {
                    var deptName = subjectWithDept.Department.DepartmentName.ToLower();
                    assignedStaff = await _context.Staff
                        .Where(s => s.IsActive == true && s.Department != null &&
                                    s.Department.ToLower() == deptName)
                        .FirstOrDefaultAsync();
                }

                // Final fallback: any active staff — only if no dept match found
                if (assignedStaff == null)
                {
                    throw new BadRequestException(
                        $"No assigned teacher found for subject '{subject.SubjectName}'. " +
                        "Please assign a teacher to this class subject before saving a timetable slot.");
                }
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
            SubjectName = subject.SubjectName ?? "",
            SubjectCode = subject.SubjectCode ?? "",
            TeacherId = teacher.StaffId,
            TeacherName = $"{teacher.FirstName} {teacher.LastName}",
            EmployeeId = teacher.EmployeeId ?? "",
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
                    EmployeeId = teacher.EmployeeId ?? "",
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
            EmployeeId = teacher.EmployeeId ?? "",
            Department = teacher.Department ?? "",
            Days = daySchedules
        };
    }

    public async Task<StudentTimetableDto> GetStudentTimetableAsync(int classId, int sectionId, string academicYear = "2026-2027")
    {
        var classGrade = classId > 0 
            ? await _context.Classes.FindAsync(classId) 
            : await _context.Classes.FirstOrDefaultAsync();

        if (classGrade == null)
        {
            classGrade = new ClassGrade { ClassId = 1, ClassName = "Class 10" };
        }

        var section = sectionId > 0 
            ? await _context.ClassSections.FindAsync(sectionId) 
            : await _context.ClassSections.FirstOrDefaultAsync(s => s.ClassId == classGrade.ClassId);

        if (section == null)
        {
            section = new ClassSection { SectionId = 1, ClassId = classGrade.ClassId, SectionName = "A" };
        }

        int resolvedClassId = classGrade.ClassId;
        int resolvedSectionId = section.SectionId;

        var slots = await _timetableRepository.GetStudentTimetableSlotsAsync(resolvedClassId, resolvedSectionId, academicYear);

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

            // BUG-005 FIX: Return empty list instead of hardcoded fake schedule data
            // Previously showed dummy names like "Jonathan Miller", "Robert Chen" in production
            if (!daySlots.Any())
            {
                daySlots = new List<TimetableSlotDto>(); // No slots configured — return empty, not fake data
            }

            daySchedules.Add(new DayScheduleDto
            {
                DayOfWeek = day,
                Periods = daySlots
            });
        }

        return new StudentTimetableDto
        {
            ClassId = resolvedClassId,
            ClassName = classGrade.ClassName ?? "Class 10",
            SectionId = resolvedSectionId,
            SectionName = section.SectionName ?? "A",
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
        var mappedSubjects = await _context.ClassSubjectMappings
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
                SubjectName = sub.SubjectName ?? "",
                SubjectCode = sub.SubjectCode ?? "",
                AssignedTeacherId = teacher?.StaffId ?? 0,
                AssignedTeacherName = teacher != null ? $"{teacher.FirstName} {teacher.LastName} ({teacher.EmployeeId})" : "Unassigned Faculty",
                AssignedPeriodsPerWeek = 0,
                MaxPeriodsPerWeek = 5
            });
        }

        return result;
    }

    // =========================================================
    // AUTOMATIC TIMETABLE GENERATION & VALIDATION
    // =========================================================

    private class ComputedPeriod
    {
        public string Name { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Type { get; set; } = "Teaching"; // "Teaching", "Break", "Lunch", "Assembly", "Tea", "Other"
        public int Sequence { get; set; }
    }

    private class CandidateSubject
    {
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public int WeeklyPeriods { get; set; }
    }

    private static int TimeToMinutes(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr)) return 0;
        try
        {
            var span = ParseTime(timeStr);
            return (int)span.TotalMinutes;
        }
        catch
        {
            return 0;
        }
    }

    private static string MinutesToTime(int totalMinutes)
    {
        var span = TimeSpan.FromMinutes(totalMinutes);
        return FormatTime(span);
    }

    public async Task<List<TimetableSlotDto>> GenerateTimetableAsync(GenerateTimetableRequestDto dto)
    {
        int startMin = TimeToMinutes(dto.SchoolStartTime);
        int endMin = TimeToMinutes(dto.SchoolEndTime);
        
        var generatedPeriods = new List<ComputedPeriod>();
        int numericPeriodDuration = dto.PeriodDurationMinutes;

        if (startMin >= endMin || numericPeriodDuration <= 0)
        {
            throw new BadRequestException("Invalid timing configuration or period duration.");
        }

        int currentMin = startMin;
        int sequence = 1;
        int periodIndex = 1;

        // 1. Initial breaks before period 1 (afterPeriod = 0)
        var initialBreaks = dto.Breaks.Where(b => b.AfterPeriod == 0).ToList();
        foreach (var b in initialBreaks)
        {
            int nextMin = currentMin + b.DurationMinutes;
            if (nextMin <= endMin)
            {
                generatedPeriods.Add(new ComputedPeriod
                {
                    Name = b.Name,
                    StartTime = MinutesToTime(currentMin),
                    EndTime = MinutesToTime(nextMin),
                    Type = b.Type,
                    Sequence = sequence++
                });
                currentMin = nextMin;
            }
        }

        // 2. Loop teaching periods and interleaving breaks
        const int MAX_PERIODS = 20; // safety ceiling
        while (currentMin + numericPeriodDuration <= endMin && periodIndex <= MAX_PERIODS)
        {
            int pStart = currentMin;
            int pEnd = currentMin + numericPeriodDuration;

            generatedPeriods.Add(new ComputedPeriod
            {
                Name = $"Period {periodIndex}",
                StartTime = MinutesToTime(pStart),
                EndTime = MinutesToTime(pEnd),
                Type = "Teaching",
                Sequence = sequence++
            });

            currentMin = pEnd;

            // Check breaks configured for after this period
            var matchedBreaks = dto.Breaks.Where(b => b.AfterPeriod == periodIndex).ToList();
            foreach (var b in matchedBreaks)
            {
                int bStart = currentMin;
                int bEnd = currentMin + b.DurationMinutes;
                if (bEnd <= endMin)
                {
                    generatedPeriods.Add(new ComputedPeriod
                    {
                        Name = b.Name,
                        StartTime = MinutesToTime(bStart),
                        EndTime = MinutesToTime(bEnd),
                        Type = b.Type,
                        Sequence = sequence++
                    });
                    currentMin = bEnd;
                }
            }

            periodIndex++;
        }

        // Ensure periods are mapped to DB PeriodSettings
        var activePeriods = await _timetableRepository.GetPeriodSettingsAsync();
        var periodMap = new Dictionary<string, PeriodSetting>();

        foreach (var gp in generatedPeriods)
        {
            var gpStartSpan = ParseTime(gp.StartTime);
            var gpEndSpan = ParseTime(gp.EndTime);
            var gpTypeMapped = gp.Type == "Teaching" ? "Teaching Period" : gp.Type;

            var existing = activePeriods.FirstOrDefault(p =>
                p.PeriodName.Trim().ToLower() == gp.Name.Trim().ToLower() &&
                p.StartTime == gpStartSpan &&
                p.EndTime == gpEndSpan &&
                p.PeriodType == gpTypeMapped);

            if (existing == null)
            {
                var newPeriod = new PeriodSetting
                {
                    PeriodName = gp.Name,
                    StartTime = gpStartSpan,
                    EndTime = gpEndSpan,
                    PeriodType = gpTypeMapped,
                    DisplayOrder = gp.Sequence,
                    IsActive = true,
                    IsDeleted = false
                };
                newPeriod = await _timetableRepository.SavePeriodSettingAsync(newPeriod);
                periodMap[gp.Name + "_" + gp.StartTime] = newPeriod;
            }
            else
            {
                periodMap[gp.Name + "_" + gp.StartTime] = existing;
            }
        }

        var targetHeaders = new List<TimetableHeader>();
        var targetHeaderIds = new List<int>();

        foreach (var classSecStr in dto.SelectedClassSections)
        {
            var parts = classSecStr.Split('-');
            if (parts.Length < 2) continue;
            var className = parts[0].Trim();
            var sectionName = parts[1].Trim();

            // Find Class
            var classGrade = await _context.Classes.FirstOrDefaultAsync(c => c.ClassName != null && c.ClassName.ToLower() == className.ToLower());
            if (classGrade == null) continue;

            // Find Section
            var section = await _context.ClassSections.FirstOrDefaultAsync(s => s.ClassId == classGrade.ClassId && s.SectionName != null && s.SectionName.ToLower() == sectionName.ToLower());
            if (section == null) continue;

            // Get or create Header
            var header = await _timetableRepository.GetHeaderByClassSectionAsync(classGrade.ClassId, section.SectionId, dto.AcademicYear);
            if (header == null)
            {
                header = new TimetableHeader
                {
                    ClassId = classGrade.ClassId,
                    SectionId = section.SectionId,
                    AcademicYear = dto.AcademicYear,
                    BranchName = "Main Campus",
                    Status = "Draft",
                    IncludeSaturday = false
                };
                header = await _timetableRepository.CreateHeaderAsync(header);
            }
            
            targetHeaders.Add(header);
            targetHeaderIds.Add(header.HeaderId);
        }

        // Clean up old slots for sections being regenerated
        if (targetHeaderIds.Any())
        {
            var oldSlots = await _context.TimetableSlots.Where(s => targetHeaderIds.Contains(s.HeaderId)).ToListAsync();
            _context.TimetableSlots.RemoveRange(oldSlots);
            await _context.SaveChangesAsync();
        }

        // Build busy schedule dictionary for teachers
        var teacherBusySchedule = new Dictionary<int, HashSet<string>>();
        var otherSlots = await _context.TimetableSlots
            .Include(s => s.Header)
            .Where(s => s.Header!.AcademicYear == dto.AcademicYear && !targetHeaderIds.Contains(s.HeaderId))
            .ToListAsync();

        foreach (var slot in otherSlots)
        {
            if (slot.TeacherId > 0)
            {
                if (!teacherBusySchedule.ContainsKey(slot.TeacherId))
                {
                    teacherBusySchedule[slot.TeacherId] = new HashSet<string>();
                }
                var timeKey = $"{slot.StartTime:hh\\:mm}-{slot.EndTime:hh\\:mm}";
                teacherBusySchedule[slot.TeacherId].Add($"{slot.DayOfWeek}_{timeKey}");
            }
        }

        var newlyGeneratedSlots = new List<TimetableSlot>();

        foreach (var header in targetHeaders)
        {
            int classId = header.ClassId;
            int sectionId = header.SectionId;

            // Load mapped subjects
            var mappedSubjectIds = await _context.ClassSubjectMappings
                .Where(m => m.ClassId == classId)
                .Select(m => m.SubjectId)
                .ToListAsync();

            if (!mappedSubjectIds.Any()) continue;

            // Resolve subject details and assigned teachers
            var mappedSubjects = new List<CandidateSubject>();
            foreach (var subId in mappedSubjectIds)
            {
                var sub = await _context.Subjects.FindAsync(subId);
                if (sub == null) continue;

                var teacher = await _timetableRepository.GetAssignedTeacherForSubjectAsync(classId, sectionId, subId);
                var mapping = await _context.ClassSubjectMappings
                    .FirstOrDefaultAsync(m => m.ClassId == classId && m.SubjectId == subId);
                mappedSubjects.Add(new CandidateSubject
                {
                    SubjectId = subId,
                    SubjectName = sub.SubjectName ?? "",
                    TeacherId = teacher?.StaffId ?? 0,
                    WeeklyPeriods = mapping?.WeeklyPeriods ?? 5
                });
            }

            if (!mappedSubjects.Any()) continue;

            // Round-robin tracking index
            int subjectDistributionIdx = 0;

            // Loop over days
            foreach (var day in dto.WorkingDays)
            {
                foreach (var period in generatedPeriods)
                {
                    var startTimeSpan = ParseTime(period.StartTime);
                    var endTimeSpan = ParseTime(period.EndTime);
                    var timeKey = $"{startTimeSpan:hh\\:mm}-{endTimeSpan:hh\\:mm}";

                    var key = period.Name + "_" + period.StartTime;
                    periodMap.TryGetValue(key, out var matchedPeriod);
                    int? periodId = matchedPeriod?.PeriodId;

                    if (period.Type != "Teaching")
                    {
                        continue;
                    }

                    CandidateSubject? selectedSub = null;
                    for (int offset = 0; offset < mappedSubjects.Count; offset++)
                    {
                        var candidate = mappedSubjects[(subjectDistributionIdx + offset) % mappedSubjects.Count];
                        if (candidate.TeacherId > 0)
                        {
                            var busyKey = $"{day}_{timeKey}";
                            bool isBusy = teacherBusySchedule.ContainsKey(candidate.TeacherId) &&
                                          teacherBusySchedule[candidate.TeacherId].Contains(busyKey);

                            if (!isBusy)
                            {
                                selectedSub = candidate;
                                subjectDistributionIdx = (subjectDistributionIdx + offset + 1) % mappedSubjects.Count;
                                break;
                            }
                        }
                    }

                    if (selectedSub != null)
                    {
                        if (!teacherBusySchedule.ContainsKey(selectedSub.TeacherId))
                        {
                            teacherBusySchedule[selectedSub.TeacherId] = new HashSet<string>();
                        }
                        var busyKey = $"{day}_{timeKey}";
                        teacherBusySchedule[selectedSub.TeacherId].Add(busyKey);

                        var sectionRecord = await _context.ClassSections.FindAsync(sectionId);
                        var roomNo = sectionRecord?.RoomNo ?? "";

                        var slot = new TimetableSlot
                        {
                            HeaderId = header.HeaderId,
                            PeriodId = periodId,
                            DayOfWeek = day,
                            StartTime = startTimeSpan,
                            EndTime = endTimeSpan,
                            SubjectId = selectedSub.SubjectId,
                            TeacherId = selectedSub.TeacherId,
                            RoomNo = roomNo
                        };

                        await _context.TimetableSlots.AddAsync(slot);
                        newlyGeneratedSlots.Add(slot);
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        var results = new List<TimetableSlotDto>();
        foreach (var slot in newlyGeneratedSlots)
        {
            var sub = await _context.Subjects.FindAsync(slot.SubjectId);
            var staff = await _context.Staff.FindAsync(slot.TeacherId);
            var per = slot.PeriodId.HasValue ? await _context.PeriodSettings.FindAsync(slot.PeriodId.Value) : null;

            results.Add(new TimetableSlotDto
            {
                SlotId = slot.SlotId,
                HeaderId = slot.HeaderId,
                PeriodId = slot.PeriodId,
                PeriodName = per?.PeriodName ?? "",
                DayOfWeek = slot.DayOfWeek,
                StartTime = FormatTime(slot.StartTime),
                EndTime = FormatTime(slot.EndTime),
                SubjectId = slot.SubjectId,
                SubjectName = sub?.SubjectName ?? "",
                SubjectCode = sub?.SubjectCode ?? "",
                TeacherId = slot.TeacherId,
                TeacherName = staff != null ? $"{staff.FirstName} {staff.LastName}" : "",
                RoomNo = slot.RoomNo ?? ""
            });
        }

        return results;
    }

    public async Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear)
    {
        var result = new TimetableValidationResultDto { Valid = true };
        var header = await _timetableRepository.GetHeaderByClassSectionAsync(classId, sectionId, academicYear);
        if (header == null) return result;

        var slots = await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId);
        if (!slots.Any()) return result;

        var subjectsDict = await _context.Subjects.ToDictionaryAsync(s => s.SubjectId);
        var staffDict = await _context.Staff.ToDictionaryAsync(s => s.StaffId);

        var classGrade = await _context.Classes.FindAsync(classId);
        var section = await _context.ClassSections.FindAsync(sectionId);
        var classSecName = $"{classGrade?.ClassName ?? "Class"}-{section?.SectionName ?? "Sec"}";

        // 1. Check weekly subject counts
        var subjectCounts = slots.GroupBy(s => s.SubjectId)
            .ToDictionary(g => g.Key, g => g.Count());
        foreach (var kvp in subjectCounts)
        {
            if (subjectsDict.TryGetValue(kvp.Key, out var sub))
            {
                var mapping = await _context.ClassSubjectMappings
                    .FirstOrDefaultAsync(m => m.ClassId == classId && m.SubjectId == kvp.Key);
                int limit = mapping?.WeeklyPeriods ?? 5;
                if (kvp.Value > limit)
                {
                    result.Valid = false;
                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = "WeeklyLimit",
                        Message = $"Subject Weekly Limit Exceeded: {sub.SubjectName} has a maximum limit of {limit} periods/week for {classSecName}, but is assigned {kvp.Value} times.",
                        Day = "",
                        TimeSlot = ""
                    });
                }
            }
        }

        // 2. Check each slot for conflicts and teacher workloads
        var allSlots = await _context.TimetableSlots
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassGrade)
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassSection)
            .Where(s => s.Header!.AcademicYear == academicYear)
            .ToListAsync();

        var teacherWeeklyCounts = allSlots.GroupBy(s => s.TeacherId)
            .ToDictionary(g => g.Key, g => g.Count());
        var teacherDailyCounts = allSlots.GroupBy(s => new { s.TeacherId, s.DayOfWeek })
            .ToDictionary(g => g.Key, g => g.Count());

        foreach (var slot in slots)
        {
            var formattedTime = $"{FormatTime(slot.StartTime)} - {FormatTime(slot.EndTime)}";

            // Check teacher double-booking conflict
            var teacherConflict = allSlots.FirstOrDefault(s =>
                s.SlotId != slot.SlotId &&
                s.TeacherId == slot.TeacherId &&
                s.DayOfWeek == slot.DayOfWeek &&
                ((slot.StartTime >= s.StartTime && slot.StartTime < s.EndTime) ||
                 (slot.EndTime > s.StartTime && slot.EndTime <= s.EndTime) ||
                 (slot.StartTime <= s.StartTime && slot.EndTime >= s.EndTime)));

            if (teacherConflict != null)
            {
                result.Valid = false;
                var otherClass = teacherConflict.Header?.ClassGrade?.ClassName ?? "";
                var otherSec = teacherConflict.Header?.ClassSection?.SectionName ?? "";
                var teacherName = staffDict.TryGetValue(slot.TeacherId, out var t) ? $"{t.FirstName} {t.LastName}" : "Teacher";
                result.Conflicts.Add(new TimetableConflictDto
                {
                    Type = "TeacherConflict",
                    Message = $"Teacher Conflict: {teacherName} is already assigned to teach {otherClass}-{otherSec} at {formattedTime} on {slot.DayOfWeek}.",
                    TeacherId = slot.TeacherId,
                    TeacherName = teacherName,
                    Day = slot.DayOfWeek,
                    TimeSlot = formattedTime
                });
            }

            // Check room double-booking conflict
            if (!string.IsNullOrWhiteSpace(slot.RoomNo))
            {
                var roomConflict = allSlots.FirstOrDefault(s =>
                    s.SlotId != slot.SlotId &&
                    s.RoomNo != null && s.RoomNo.Trim().ToLower() == slot.RoomNo.Trim().ToLower() &&
                    s.DayOfWeek == slot.DayOfWeek &&
                    ((slot.StartTime >= s.StartTime && slot.StartTime < s.EndTime) ||
                     (slot.EndTime > s.StartTime && slot.EndTime <= s.EndTime) ||
                     (slot.StartTime <= s.StartTime && slot.EndTime >= s.EndTime)));

                if (roomConflict != null)
                {
                    result.Valid = false;
                    var otherClass = roomConflict.Header?.ClassGrade?.ClassName ?? "";
                    var otherSec = roomConflict.Header?.ClassSection?.SectionName ?? "";
                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = "RoomConflict",
                        Message = $"Room Conflict: Room '{slot.RoomNo}' is already occupied by {otherClass}-{otherSec} at {formattedTime} on {slot.DayOfWeek}.",
                        RoomNo = slot.RoomNo,
                        Day = slot.DayOfWeek,
                        TimeSlot = formattedTime
                    });
                }
            }

            // Check teacher workload limits
            if (staffDict.TryGetValue(slot.TeacherId, out var teacherObj))
            {
                int dailyLimit = 5;
                var dailyKey = new { TeacherId = slot.TeacherId, DayOfWeek = slot.DayOfWeek };
                int dailyCount = teacherDailyCounts.TryGetValue(dailyKey, out var dc) ? dc : 0;
                if (dailyCount > dailyLimit)
                {
                    result.Valid = false;
                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = "TeacherDailyLimit",
                        Message = $"Teacher Daily Workload Limit: {teacherObj.FirstName} {teacherObj.LastName} exceeds the limit of {dailyLimit} periods on {slot.DayOfWeek}.",
                        TeacherId = slot.TeacherId,
                        TeacherName = $"{teacherObj.FirstName} {teacherObj.LastName}",
                        Day = slot.DayOfWeek,
                        TimeSlot = formattedTime
                    });
                }

                int weeklyLimit = 24;
                int weeklyCount = teacherWeeklyCounts.TryGetValue(slot.TeacherId, out var wc) ? wc : 0;
                if (weeklyCount > weeklyLimit)
                {
                    result.Valid = false;
                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = "TeacherWeeklyLimit",
                        Message = $"Teacher Weekly Workload Limit: {teacherObj.FirstName} {teacherObj.LastName} exceeds the limit of {weeklyLimit} periods/week.",
                        TeacherId = slot.TeacherId,
                        TeacherName = $"{teacherObj.FirstName} {teacherObj.LastName}",
                        Day = slot.DayOfWeek,
                        TimeSlot = formattedTime
                    });
                }
            }
        }

        return result;
    }
}

