namespace SMS.Api.Services.Implementations.AcademicManagement;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TimetableService : ITimetableService
{
    private readonly ITimetableRepository _timetableRepository;
    private readonly IAcademicYearService _academicYearService;
    private readonly ITimetableValidationService _validationService;
    private readonly ITimetableGenerationService _generationService;
    private readonly ILogger<TimetableService> _logger;

    public TimetableService(
        ITimetableRepository timetableRepository,
        IAcademicYearService academicYearService,
        ITimetableValidationService validationService,
        ITimetableGenerationService generationService,
        ILogger<TimetableService> logger)
    {
        _timetableRepository = timetableRepository;
        _academicYearService = academicYearService;
        _validationService = validationService;
        _generationService = generationService;
        _logger = logger;
    }

    // =========================================================
    // TIME PARSING HELPER
    // =========================================================

    private static TimeSpan ParseTime(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
            throw new BadRequestException("Time string cannot be empty.");

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

        bool hasOverlap = await _timetableRepository.HasOverlappingPeriodSettingAsync(startTime, endTime, dto.PeriodId);
        if (hasOverlap)
        {
            throw new PeriodOverlapException($"Period timing slot {FormatTime(startTime)} - {FormatTime(endTime)} overlaps with an existing period setting slot.");
        }

        PeriodSetting period;
        if (dto.PeriodId.HasValue && dto.PeriodId.Value > 0)
        {
            period = await _timetableRepository.GetPeriodSettingByIdAsync(dto.PeriodId.Value)
                ?? throw new NotFoundException($"Period setting with ID {dto.PeriodId.Value} not found.");

            period.PeriodName = dto.PeriodName.Trim();
            period.StartTime = startTime;
            period.EndTime = endTime;
            period.PeriodType = !string.IsNullOrWhiteSpace(dto.PeriodType) ? dto.PeriodType.Trim() : period.PeriodType;
            period.DisplayOrder = dto.DisplayOrder;
        }
        else
        {
            period = new PeriodSetting
            {
                PeriodName = dto.PeriodName.Trim(),
                StartTime = startTime,
                EndTime = endTime,
                PeriodType = !string.IsNullOrWhiteSpace(dto.PeriodType) ? dto.PeriodType.Trim() : (dto.PeriodName.Contains("Break", StringComparison.OrdinalIgnoreCase) ? "Break" : "Teaching Period"),
                DisplayOrder = dto.DisplayOrder,
                IsActive = true,
                IsDeleted = false
            };
        }

        period = await _timetableRepository.SavePeriodSettingAsync(period);

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

    public async Task<List<PeriodSettingDto>> SyncPeriodSettingsAsync(List<SavePeriodSettingDto> dtos)
    {
        if (dtos == null || !dtos.Any())
        {
            return await GetPeriodSettingsAsync();
        }

        var domainPeriods = dtos.Select(d => new PeriodSetting
        {
            PeriodName = d.PeriodName.Trim(),
            StartTime = ParseTime(d.StartTime),
            EndTime = ParseTime(d.EndTime),
            PeriodType = !string.IsNullOrWhiteSpace(d.PeriodType) ? d.PeriodType.Trim() : (d.PeriodName.Contains("Break", StringComparison.OrdinalIgnoreCase) ? "Break" : "Teaching Period"),
            DisplayOrder = d.DisplayOrder,
            IsActive = true,
            IsDeleted = false
        }).ToList();

        var synced = await _timetableRepository.SyncPeriodSettingsAsync(domainPeriods);
        return synced.Select(p => new PeriodSettingDto
        {
            PeriodId = p.PeriodId,
            PeriodName = p.PeriodName,
            StartTime = FormatTime(p.StartTime),
            EndTime = FormatTime(p.EndTime),
            PeriodType = p.PeriodType,
            DisplayOrder = p.DisplayOrder
        }).ToList();
    }

    // =========================================================
    // CLASS TIMETABLE MATRIX & SLOTS
    // =========================================================

    public async Task<ClassTimetableGridDto> GetClassTimetableGridAsync(int classId, int sectionId, string academicYear = "")
    {
        if (string.IsNullOrWhiteSpace(academicYear))
        {
            academicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        var classGrade = await _timetableRepository.GetClassByIdAsync(classId)
            ?? throw new NotFoundException($"Class with ID {classId} not found.");

        var section = await _timetableRepository.GetSectionByIdAsync(sectionId)
            ?? throw new NotFoundException($"Section with ID {sectionId} not found.");

        var header = await _timetableRepository.GetHeaderByClassSectionAsync(classId, sectionId, academicYear);
        if (header == null)
        {
            header = new TimetableHeader
            {
                ClassId = classId,
                SectionId = sectionId,
                AcademicYear = academicYear,
                BranchName = !string.IsNullOrWhiteSpace(classGrade.CampusLocation) ? classGrade.CampusLocation : string.Empty,
                Status = nameof(TimetableStatus.Draft),
                IncludeSaturday = true,
                CreatedAt = DateTime.UtcNow
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }

        var periods = await GetPeriodSettingsAsync();
        var slots = await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId);
        var subjectCandidates = await GetClassSubjectsCandidatesAsync(classId, sectionId);

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
            TeacherName = s.Teacher != null
                ? (s.Teacher.DisplayName ?? $"{s.Teacher.FirstName ?? ""} {s.Teacher.LastName ?? ""}".Trim())
                : string.Empty,
            EmployeeId = s.Teacher?.EmployeeId ?? string.Empty,
            RoomNo = !string.IsNullOrWhiteSpace(s.RoomNo) ? s.RoomNo : (section.RoomNo ?? string.Empty)
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

        if (string.IsNullOrWhiteSpace(dto.AcademicYear))
        {
            dto.AcademicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        // 1. Resolve ClassId by name if not supplied
        if (dto.ClassId == 0 && !string.IsNullOrWhiteSpace(dto.ClassName))
        {
            var matchedClass = await _timetableRepository.GetClassByNameAsync(dto.ClassName);
            if (matchedClass != null)
            {
                dto.ClassId = matchedClass.ClassId;
            }
        }

        if (dto.ClassId == 0)
        {
            throw new BadRequestException("A valid ClassId or ClassName is required.");
        }

        // 2. Resolve SectionId by name if not supplied or verify it belongs to ClassId
        if (dto.ClassId > 0)
        {
            if (dto.SectionId > 0)
            {
                var existingSec = await _timetableRepository.GetSectionByIdAsync(dto.SectionId);
                if (existingSec == null || existingSec.ClassId != dto.ClassId)
                {
                    dto.SectionId = 0; // force resolution from SectionName
                }
            }

            if (dto.SectionId == 0 && !string.IsNullOrWhiteSpace(dto.SectionName))
            {
                var matchedSection = await _timetableRepository.GetSectionByNameAsync(dto.ClassId, dto.SectionName);
                if (matchedSection != null)
                {
                    dto.SectionId = matchedSection.SectionId;
                }
            }
        }

        if (dto.SectionId == 0)
        {
            throw new BadRequestException("A valid SectionId or SectionName is required.");
        }

        // 3. Resolve TeacherId by name if not supplied
        if ((!dto.TeacherId.HasValue || dto.TeacherId.Value == 0) &&
            !string.IsNullOrWhiteSpace(dto.TeacherName) &&
            dto.TeacherName != "Unassigned" && dto.TeacherName != "--")
        {
            var nameParts = dto.TeacherName.Split(' ');
            var firstName = nameParts[0].Trim();
            var lastName = nameParts.Length > 1 ? nameParts[1].Trim() : "";

            var matchedTeacher = await _timetableRepository.GetStaffByNameAsync(firstName, lastName);
            if (matchedTeacher != null)
            {
                dto.TeacherId = matchedTeacher.StaffId;
            }
        }

        // 5. Resolve RoomNo from Section if not supplied
        if (string.IsNullOrWhiteSpace(dto.RoomNo) && dto.SectionId > 0)
        {
            var secObj = await _timetableRepository.GetSectionByIdAsync(dto.SectionId);
            if (secObj != null && !string.IsNullOrWhiteSpace(secObj.RoomNo))
            {
                dto.RoomNo = secObj.RoomNo;
            }
        }

        // 6. Get or Create Header
        var header = await _timetableRepository.GetHeaderByClassSectionAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
        if (header == null)
        {
            var classGradeObj = await _timetableRepository.GetClassByIdAsync(dto.ClassId);
            var branchName = !string.IsNullOrWhiteSpace(dto.BranchName)
                ? dto.BranchName
                : (!string.IsNullOrWhiteSpace(classGradeObj?.CampusLocation) ? classGradeObj.CampusLocation : string.Empty);

            header = new TimetableHeader
            {
                ClassId = dto.ClassId,
                SectionId = dto.SectionId,
                AcademicYear = dto.AcademicYear,
                BranchName = branchName,
                Status = nameof(TimetableStatus.Draft),
                IncludeSaturday = true
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }

        // 7. Resolve Subject
        Subject? subject = null;
        if (dto.SubjectId > 0)
        {
            subject = await _timetableRepository.GetSubjectByIdAsync(dto.SubjectId);
        }

        if (subject == null && !string.IsNullOrWhiteSpace(dto.SubjectName))
        {
            subject = await _timetableRepository.GetSubjectByNameAsync(dto.SubjectName);
            if (subject != null)
            {
                dto.SubjectId = subject.SubjectId;
            }
        }

        if (subject == null && !string.IsNullOrWhiteSpace(dto.SubjectName))
        {
            try
            {
                var cleanSubName = dto.SubjectName.Trim();
                var allSubjects = await _timetableRepository.GetAllSubjectsAsync();
                var existingSubject = allSubjects.FirstOrDefault(s =>
                    !string.IsNullOrWhiteSpace(s.SubjectName) &&
                    s.SubjectName.Trim().Equals(cleanSubName, StringComparison.OrdinalIgnoreCase));

                if (existingSubject != null)
                {
                    subject = existingSubject;
                    dto.SubjectId = subject.SubjectId;
                }
                else
                {
                    var newSub = new Subject
                    {
                        SubjectName = cleanSubName,
                        SubjectCode = cleanSubName.Length >= 3 ? cleanSubName.Substring(0, 3).ToUpper() : cleanSubName.ToUpper(),
                        CourseCode = cleanSubName.Length >= 3 ? cleanSubName.Substring(0, 3).ToUpper() : cleanSubName.ToUpper(),
                        DepartmentId = 1
                    };
                    subject = await _timetableRepository.SaveSubjectAsync(newSub);
                    dto.SubjectId = subject.SubjectId;
                }
            }
            catch
            {
                // If saving fails due to Department FK or DB constraint, lookup first available subject
                var allSubs = await _timetableRepository.GetAllSubjectsAsync();
                subject = allSubs.FirstOrDefault();
                if (subject != null)
                {
                    dto.SubjectId = subject.SubjectId;
                }
            }
        }

        if (subject == null)
        {
            var allSubs = await _timetableRepository.GetAllSubjectsAsync();
            subject = allSubs.FirstOrDefault();
            if (subject != null)
            {
                dto.SubjectId = subject.SubjectId;
            }
            else
            {
                try
                {
                    var fallbackSub = new Subject
                    {
                        SubjectName = !string.IsNullOrWhiteSpace(dto.SubjectName) ? dto.SubjectName.Trim() : "General Subject",
                        SubjectCode = "GEN",
                        CourseCode = "GEN",
                        DepartmentId = 1
                    };
                    subject = await _timetableRepository.SaveSubjectAsync(fallbackSub);
                    dto.SubjectId = subject.SubjectId;
                }
                catch
                {
                    dto.SubjectId = 1;
                }
            }
        }

        // 8. Resolve Assigned Teacher
        int teacherId = 0;
        if (dto.TeacherId.HasValue && dto.TeacherId.Value > 0)
        {
            teacherId = dto.TeacherId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(dto.TeacherName) && dto.TeacherName != "Unassigned" && dto.TeacherName != "--")
        {
            var nameParts = dto.TeacherName.Split(' ');
            var firstName = nameParts[0].Trim();
            var lastName = nameParts.Length > 1 ? nameParts[1].Trim() : "";

            var matchedTeacher = await _timetableRepository.GetStaffByNameAsync(firstName, lastName);
            if (matchedTeacher != null)
            {
                teacherId = matchedTeacher.StaffId;
            }
        }

        if (teacherId == 0)
        {
            var assignedStaff = await _timetableRepository.GetAssignedTeacherForSubjectAsync(dto.ClassId, dto.SectionId, dto.SubjectId);
            if (assignedStaff != null)
            {
                teacherId = assignedStaff.StaffId;
            }
        }

        if (teacherId == 0)
        {
            var allStaff = await _timetableRepository.GetAllStaffAsync();
            var fallbackTeacher = allStaff.FirstOrDefault(s => s.Designation != null && s.Designation.Contains("Teacher")) 
                               ?? allStaff.FirstOrDefault();
            if (fallbackTeacher != null)
            {
                teacherId = fallbackTeacher.StaffId;
            }
        }

        var teacher = teacherId > 0 ? await _timetableRepository.GetStaffByIdAsync(teacherId) : null;
        var teacherName = teacher != null
            ? (teacher.DisplayName ?? $"{teacher.FirstName ?? ""} {teacher.LastName ?? ""}".Trim())
            : (dto.TeacherName ?? "Faculty Member");
        if (string.IsNullOrWhiteSpace(teacherName)) teacherName = "Faculty Member";

        // 8.5 Auto-resolve PeriodId if not explicitly supplied
        if (!dto.PeriodId.HasValue || dto.PeriodId.Value == 0)
        {
            var periodSettings = await _timetableRepository.GetPeriodSettingsAsync();
            var matchedPeriod = periodSettings.FirstOrDefault(p =>
                (p.StartTime == startTime && p.EndTime == endTime) ||
                (p.StartTime == startTime));
            if (matchedPeriod != null)
            {
                dto.PeriodId = matchedPeriod.PeriodId;
            }
        }

        // 9. Existing slot check
        var existingSlot = (await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId))
            .FirstOrDefault(s => s.DayOfWeek.Equals(dto.DayOfWeek, StringComparison.OrdinalIgnoreCase) &&
                                 ((s.PeriodId.HasValue && dto.PeriodId.HasValue && s.PeriodId == dto.PeriodId) ||
                                  (s.StartTime == startTime && s.EndTime == endTime)));

        // 10. Weekly Subject Limit Enforcement & Conflict Validation
        if (dto.Overwrite != true && dto.IgnoreConflicts != true)
        {
            await _validationService.ValidateWeeklySubjectLimitAsync(
                header.HeaderId, dto.ClassId, dto.SubjectId, subject.SubjectName ?? string.Empty, existingSlot?.SlotId);

            // 11. Conflict Validation (Teacher & Room Overlap)
            await _validationService.ValidateSlotConflictsAsync(
                header.HeaderId, teacherId, teacherName, dto.RoomNo, dto.DayOfWeek, startTime, endTime, existingSlot?.SlotId);
        }

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
            TeacherName = teacherName,
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
        // 1. Resolve ClassId by name if not supplied
        if (dto.ClassId == 0 && !string.IsNullOrWhiteSpace(dto.ClassName))
        {
            var matchedClass = await _timetableRepository.GetClassByNameAsync(dto.ClassName);
            if (matchedClass != null)
            {
                dto.ClassId = matchedClass.ClassId;
            }
            else
            {
                throw new NotFoundException($"Class '{dto.ClassName}' not found.");
            }
        }

        // 2. Resolve SectionId by name from ClassSections if not supplied
        if (dto.SectionId == 0 && !string.IsNullOrWhiteSpace(dto.SectionName) && dto.ClassId > 0)
        {
            var matchedSection = await _timetableRepository.GetSectionByNameAsync(dto.ClassId, dto.SectionName);
            if (matchedSection != null)
            {
                dto.SectionId = matchedSection.SectionId;
            }
            else
            {
                throw new NotFoundException($"Section '{dto.SectionName}' not found for Class ID {dto.ClassId}.");
            }
        }

        if (dto.ClassId == 0 || dto.SectionId == 0)
        {
            throw new BadRequestException("Valid ClassId and SectionId are required to publish a timetable.");
        }

        if (string.IsNullOrWhiteSpace(dto.AcademicYear))
        {
            dto.AcademicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        var header = await _timetableRepository.GetHeaderByClassSectionAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
        string statusToSet = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : nameof(TimetableStatus.Published);

        if (header == null)
        {
            var classObj = await _timetableRepository.GetClassByIdAsync(dto.ClassId);
            header = new TimetableHeader
            {
                ClassId = dto.ClassId,
                SectionId = dto.SectionId,
                AcademicYear = dto.AcademicYear,
                BranchName = !string.IsNullOrWhiteSpace(classObj?.CampusLocation) ? classObj.CampusLocation : string.Empty,
                Status = statusToSet,
                IncludeSaturday = true
            };
            header = await _timetableRepository.CreateHeaderAsync(header);
        }
        else
        {
            await _timetableRepository.UpdateHeaderStatusAsync(header.HeaderId, statusToSet);
        }

        return await GetClassTimetableGridAsync(dto.ClassId, dto.SectionId, dto.AcademicYear);
    }

    // =========================================================
    // AUTO-GENERATED TEACHER & STUDENT TIMETABLES
    // =========================================================

    public async Task<TeacherTimetableDto> GetTeacherTimetableAsync(int teacherId, string academicYear = "")
    {
        if (string.IsNullOrWhiteSpace(academicYear))
        {
            academicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        var teacher = await _timetableRepository.GetStaffByIdAsync(teacherId)
            ?? throw new NotFoundException($"Teacher with ID {teacherId} not found.");

        var teacherName = teacher.DisplayName ?? $"{teacher.FirstName ?? ""} {teacher.LastName ?? ""}".Trim();
        if (string.IsNullOrWhiteSpace(teacherName)) teacherName = "Faculty Member";

        var slots = await _timetableRepository.GetTeacherTimetableSlotsAsync(teacherId, academicYear);

        var activeDays = slots.Select(s => s.DayOfWeek).Where(d => !string.IsNullOrWhiteSpace(d)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var daysOrder = Enum.GetValues<DayOfWeek>()
            .Where(d => d != DayOfWeek.Sunday)
            .Select(d => d.ToString())
            .Where(d => activeDays.Count == 0 || activeDays.Contains(d, StringComparer.OrdinalIgnoreCase))
            .ToList();
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
                    TeacherName = teacherName,
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
            TeacherName = teacherName,
            EmployeeId = teacher.EmployeeId ?? "",
            Department = teacher.Department ?? "",
            Days = daySchedules
        };
    }

    public async Task<StudentTimetableDto> GetStudentTimetableAsync(int classId, int sectionId, string academicYear = "")
    {
        if (string.IsNullOrWhiteSpace(academicYear))
        {
            academicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        var classGrade = classId > 0
            ? await _timetableRepository.GetClassByIdAsync(classId)
            : await _timetableRepository.GetDefaultClassAsync();

        if (classGrade == null)
        {
            throw new NotFoundException($"Class with ID {classId} not found.");
        }

        var section = sectionId > 0
            ? await _timetableRepository.GetSectionByIdAsync(sectionId)
            : await _timetableRepository.GetDefaultSectionForClassAsync(classGrade.ClassId);

        if (section == null)
        {
            throw new NotFoundException($"Section with ID {sectionId} not found for Class '{classGrade.ClassName}'.");
        }

        int resolvedClassId = classGrade.ClassId;
        int resolvedSectionId = section.SectionId;

        var slots = await _timetableRepository.GetStudentTimetableSlotsAsync(resolvedClassId, resolvedSectionId, academicYear);

        var activeDays = slots.Select(s => s.DayOfWeek).Where(d => !string.IsNullOrWhiteSpace(d)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var daysOrder = Enum.GetValues<DayOfWeek>()
            .Where(d => d != DayOfWeek.Sunday)
            .Select(d => d.ToString())
            .Where(d => activeDays.Count == 0 || activeDays.Contains(d, StringComparer.OrdinalIgnoreCase))
            .ToList();
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
                    TeacherName = s.Teacher != null
                        ? (s.Teacher.DisplayName ?? $"{s.Teacher.FirstName ?? ""} {s.Teacher.LastName ?? ""}".Trim())
                        : "",
                    EmployeeId = s.Teacher?.EmployeeId ?? "",
                    RoomNo = !string.IsNullOrWhiteSpace(s.RoomNo) ? s.RoomNo : (section.RoomNo ?? "")
                }).ToList();

            daySchedules.Add(new DayScheduleDto
            {
                DayOfWeek = day,
                Periods = daySlots
            });
        }

        return new StudentTimetableDto
        {
            ClassId = resolvedClassId,
            ClassName = classGrade.ClassName ?? "",
            SectionId = resolvedSectionId,
            SectionName = section.SectionName ?? "",
            AcademicYear = academicYear,
            Days = daySchedules
        };
    }

    // =========================================================
    // COPY TIMETABLE
    // =========================================================

    public async Task<ClassTimetableGridDto> CopyTimetableAsync(CopyTimetableDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AcademicYear))
        {
            dto.AcademicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

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
                Status = nameof(TimetableStatus.Draft),
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
        var mappings = await _timetableRepository.GetClassSubjectMappingsByClassAsync(classId);
        var allSubjects = (await _timetableRepository.GetAllSubjectsAsync()).ToDictionary(s => s.SubjectId);

        var result = new List<ClassSubjectQuotaDto>();

        if (mappings.Any())
        {
            foreach (var mapping in mappings)
            {
                if (!allSubjects.TryGetValue(mapping.SubjectId, out var sub)) continue;

                var teacher = await _timetableRepository.GetAssignedTeacherForSubjectAsync(classId, sectionId, sub.SubjectId);
                var tName = teacher != null
                    ? (teacher.DisplayName ?? $"{teacher.FirstName ?? ""} {teacher.LastName ?? ""}".Trim())
                    : "Unassigned Faculty";

                result.Add(new ClassSubjectQuotaDto
                {
                    SubjectId = sub.SubjectId,
                    SubjectName = sub.SubjectName ?? "",
                    SubjectCode = sub.SubjectCode ?? "",
                    AssignedTeacherId = teacher?.StaffId ?? 0,
                    AssignedTeacherName = tName,
                    AssignedPeriodsPerWeek = 0,
                    MaxPeriodsPerWeek = mapping.WeeklyPeriods > 0 ? mapping.WeeklyPeriods : 0
                });
            }
        }

        return result;
    }

    // =========================================================
    // AUTOMATIC TIMETABLE GENERATION & VALIDATION DELEGATES
    // =========================================================

    public async Task<List<TimetableSlotDto>> GenerateTimetableAsync(GenerateTimetableRequestDto dto)
    {
        return await _generationService.GenerateTimetableAsync(dto);
    }

    public async Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear)
    {
        if (string.IsNullOrWhiteSpace(academicYear))
        {
            academicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }
        return await _validationService.ValidateTimetableAsync(classId, sectionId, academicYear);
    }
}
