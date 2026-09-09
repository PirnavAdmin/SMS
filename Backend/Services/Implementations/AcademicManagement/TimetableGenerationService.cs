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

public class TimetableGenerationService : ITimetableGenerationService
{
    private readonly ITimetableRepository _timetableRepository;
    private readonly IAcademicYearService _academicYearService;
    private readonly ILogger<TimetableGenerationService> _logger;

    public TimetableGenerationService(
        ITimetableRepository timetableRepository,
        IAcademicYearService academicYearService,
        ILogger<TimetableGenerationService> logger)
    {
        _timetableRepository = timetableRepository;
        _academicYearService = academicYearService;
        _logger = logger;
    }

    private class ComputedPeriod
    {
        public string Name { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Type { get; set; } = "Teaching";
        public int Sequence { get; set; }
    }

    private class CandidateSubject
    {
        public int SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public int WeeklyPeriods { get; set; } = 0;
        public int AssignedCount { get; set; } = 0;
    }

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

    private static int TimeToMinutes(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
            throw new BadRequestException("Time string cannot be empty.");

        var span = ParseTime(timeStr);
        return (int)span.TotalMinutes;
    }

    private static string MinutesToTime(int totalMinutes)
    {
        var span = TimeSpan.FromMinutes(totalMinutes);
        return FormatTime(span);
    }

    public async Task<List<TimetableSlotDto>> GenerateTimetableAsync(GenerateTimetableRequestDto dto)
    {
        _logger.LogInformation("Starting auto-generation of timetable for {Count} class-sections.", dto.SelectedClassSections?.Count ?? 0);

        if (string.IsNullOrWhiteSpace(dto.AcademicYear))
        {
            dto.AcademicYear = await _academicYearService.GetCurrentAcademicYearAsync();
        }

        if (string.IsNullOrWhiteSpace(dto.SchoolStartTime) || string.IsNullOrWhiteSpace(dto.SchoolEndTime) || dto.PeriodDurationMinutes <= 0)
        {
            var allPeriods = await _timetableRepository.GetPeriodSettingsAsync();
            var activePeriods = allPeriods.Where(p => p.IsActive && !p.IsDeleted).ToList();
            if (activePeriods.Any())
            {
                if (string.IsNullOrWhiteSpace(dto.SchoolStartTime))
                    dto.SchoolStartTime = FormatTime(activePeriods.Min(p => p.StartTime));
                if (string.IsNullOrWhiteSpace(dto.SchoolEndTime))
                    dto.SchoolEndTime = FormatTime(activePeriods.Max(p => p.EndTime));
                if (dto.PeriodDurationMinutes <= 0)
                {
                    var teaching = activePeriods.FirstOrDefault(p => p.PeriodType.Contains("Teaching", StringComparison.OrdinalIgnoreCase));
                    dto.PeriodDurationMinutes = teaching != null
                        ? (int)(teaching.EndTime - teaching.StartTime).TotalMinutes
                        : (int)(activePeriods.First().EndTime - activePeriods.First().StartTime).TotalMinutes;
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.SchoolStartTime) || string.IsNullOrWhiteSpace(dto.SchoolEndTime))
                {
                    throw new BadRequestException("SchoolStartTime and SchoolEndTime must be specified when no active Period Settings exist.");
                }
                if (dto.PeriodDurationMinutes <= 0)
                {
                    int sMin = TimeToMinutes(dto.SchoolStartTime);
                    int eMin = TimeToMinutes(dto.SchoolEndTime);
                    if (sMin < eMin)
                    {
                        dto.PeriodDurationMinutes = Math.Max(1, (eMin - sMin) / 8);
                    }
                    else
                    {
                        throw new BadRequestException("Valid PeriodDurationMinutes must be specified.");
                    }
                }
            }
        }

        if (dto.WorkingDays == null || !dto.WorkingDays.Any())
        {
            dto.WorkingDays = Enum.GetValues<DayOfWeek>()
                .Where(d => d >= DayOfWeek.Monday && d <= DayOfWeek.Friday)
                .Select(d => d.ToString())
                .ToList();
        }

        int startMin = TimeToMinutes(dto.SchoolStartTime);
        int endMin = TimeToMinutes(dto.SchoolEndTime);
        int periodDuration = dto.PeriodDurationMinutes;

        if (startMin >= endMin)
        {
            throw new BadRequestException($"School start time ({dto.SchoolStartTime}) must be earlier than end time ({dto.SchoolEndTime}).");
        }

        // 1. Generate Period Slots deterministically
        var generatedPeriods = GeneratePeriodSlots(dto, startMin, endMin, periodDuration);

        // 2. Sync / Map PeriodSettings in database
        var periodMap = await SyncPeriodSettingsAsync(generatedPeriods);

        // 3. Resolve Class-Section Headers
        var (targetHeaders, targetHeaderIds) = await ResolveTargetHeadersAsync(dto);
        if (!targetHeaders.Any())
        {
            _logger.LogWarning("No valid class-section headers resolved for generation.");
            return new List<TimetableSlotDto>();
        }

        // 4. Pre-load all required data to prevent N+1 queries
        var allSubjects = (await _timetableRepository.GetAllSubjectsAsync()).ToDictionary(s => s.SubjectId);
        var allStaff = (await _timetableRepository.GetAllStaffAsync()).ToDictionary(s => s.StaffId);
        var allMappings = await _timetableRepository.GetAllClassSubjectMappingsAsync();

        // 5. Build teacher busy schedule dictionary from existing slots in other classes
        var existingSlots = await _timetableRepository.GetSlotsByAcademicYearAsync(dto.AcademicYear);
        var teacherBusySchedule = BuildTeacherBusySchedule(existingSlots, targetHeaderIds);

        // 6. Allocate slots for each target header
        var newlyGeneratedSlots = new List<TimetableSlot>();
        var resultDtos = new List<TimetableSlotDto>();

        foreach (var header in targetHeaders)
        {
            int classId = header.ClassId;
            int sectionId = header.SectionId;

            var sectionObj = await _timetableRepository.GetSectionByIdAsync(sectionId);
            var roomNo = sectionObj?.RoomNo ?? "";

            var candidateSubjects = await FetchCandidateSubjectsAsync(classId, sectionId, allSubjects, allStaff, allMappings);

            // Guard against DivideByZeroException
            if (!candidateSubjects.Any())
            {
                _logger.LogWarning("No candidate subjects mapped for Class ID {ClassId}, Section ID {SectionId}. Skipping.", classId, sectionId);
                continue;
            }

            int totalTeachingSlotsInWeek = generatedPeriods.Count(p => p.Type.Equals("Teaching", StringComparison.OrdinalIgnoreCase) || p.Type.Equals("Teaching Period", StringComparison.OrdinalIgnoreCase)) * dto.WorkingDays.Count;
            int unallocatedCandidates = candidateSubjects.Count(c => c.WeeklyPeriods <= 0);
            if (unallocatedCandidates > 0)
            {
                int alreadyAllocated = candidateSubjects.Where(c => c.WeeklyPeriods > 0).Sum(c => c.WeeklyPeriods);
                int remainingSlots = Math.Max(0, totalTeachingSlotsInWeek - alreadyAllocated);
                int dynamicWeeklyQuota = Math.Max(1, remainingSlots / unallocatedCandidates);
                foreach (var c in candidateSubjects.Where(c => c.WeeklyPeriods <= 0))
                {
                    c.WeeklyPeriods = dynamicWeeklyQuota;
                }
            }

            int subjectDistributionIdx = 0;

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

                    if (!period.Type.Equals("Teaching", StringComparison.OrdinalIgnoreCase) && !period.Type.Equals("Teaching Period", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    CandidateSubject? selectedSub = null;

                    // Filter candidate subjects that have not exceeded their weekly limit
                    var eligibleCandidates = candidateSubjects
                        .Where(c => c.AssignedCount < c.WeeklyPeriods)
                        .ToList();

                    if (!eligibleCandidates.Any())
                    {
                        // All subjects have satisfied their weekly quota
                        _logger.LogInformation("All subjects for Class {ClassId} Section {SectionId} have met weekly period quotas.", classId, sectionId);
                        break;
                    }

                    // Find next available candidate without teacher conflict
                    for (int offset = 0; offset < eligibleCandidates.Count; offset++)
                    {
                        int targetIdx = (subjectDistributionIdx + offset) % eligibleCandidates.Count;
                        var candidate = eligibleCandidates[targetIdx];

                        if (candidate.TeacherId > 0)
                        {
                            var busyKey = $"{day}_{timeKey}";
                            bool isBusy = teacherBusySchedule.ContainsKey(candidate.TeacherId) &&
                                          teacherBusySchedule[candidate.TeacherId].Contains(busyKey);

                            if (!isBusy)
                            {
                                selectedSub = candidate;
                                subjectDistributionIdx = (subjectDistributionIdx + offset + 1) % eligibleCandidates.Count;
                                break;
                            }
                        }
                    }

                    if (selectedSub != null)
                    {
                        // Mark teacher busy
                        if (!teacherBusySchedule.ContainsKey(selectedSub.TeacherId))
                        {
                            teacherBusySchedule[selectedSub.TeacherId] = new HashSet<string>();
                        }
                        var busyKey = $"{day}_{timeKey}";
                        teacherBusySchedule[selectedSub.TeacherId].Add(busyKey);

                        // Increment assigned quota for subject
                        selectedSub.AssignedCount++;

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

                        newlyGeneratedSlots.Add(slot);

                        resultDtos.Add(new TimetableSlotDto
                        {
                            SlotId = 0,
                            HeaderId = header.HeaderId,
                            PeriodId = periodId,
                            PeriodName = period.Name,
                            DayOfWeek = day,
                            StartTime = period.StartTime,
                            EndTime = period.EndTime,
                            SubjectId = selectedSub.SubjectId,
                            SubjectName = selectedSub.SubjectName,
                            SubjectCode = selectedSub.SubjectCode,
                            TeacherId = selectedSub.TeacherId,
                            TeacherName = selectedSub.TeacherName,
                            EmployeeId = selectedSub.EmployeeId,
                            RoomNo = roomNo
                        });
                    }
                }
            }
        }

        // 7. Persist generated timetable in single batch transaction
        await PersistGeneratedTimetableAsync(targetHeaderIds, newlyGeneratedSlots);

        _logger.LogInformation("Completed timetable auto-generation: Generated {Count} slots across {Headers} sections.",
            newlyGeneratedSlots.Count, targetHeaders.Count);

        return resultDtos;
    }

    private List<ComputedPeriod> GeneratePeriodSlots(GenerateTimetableRequestDto dto, int startMin, int endMin, int periodDuration)
    {
        var periods = new List<ComputedPeriod>();
        int totalAvailableMinutes = endMin - startMin;
        int totalBreakMinutes = (dto.Breaks ?? new List<BreakItemDto>()).Sum(b => b.DurationMinutes);

        if (totalBreakMinutes >= totalAvailableMinutes)
        {
            throw new BadRequestException("Total break duration exceeds school hours.");
        }

        int maxPossibleTeachingPeriods = (totalAvailableMinutes - totalBreakMinutes) / periodDuration;
        int maxPeriodsToGenerate = maxPossibleTeachingPeriods;

        int currentMin = startMin;
        int sequence = 1;

        // 1. Initial breaks before period 1 (afterPeriod = 0)
        var initialBreaks = (dto.Breaks ?? new List<BreakItemDto>()).Where(b => b.AfterPeriod == 0).ToList();
        foreach (var b in initialBreaks)
        {
            int nextMin = currentMin + b.DurationMinutes;
            if (nextMin <= endMin)
            {
                periods.Add(new ComputedPeriod
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
        for (int periodIndex = 1; periodIndex <= maxPeriodsToGenerate; periodIndex++)
        {
            if (currentMin + periodDuration > endMin)
            {
                break;
            }

            int pStart = currentMin;
            int pEnd = currentMin + periodDuration;

            periods.Add(new ComputedPeriod
            {
                Name = $"Period {periodIndex}",
                StartTime = MinutesToTime(pStart),
                EndTime = MinutesToTime(pEnd),
                Type = "Teaching",
                Sequence = sequence++
            });

            currentMin = pEnd;

            // Breaks configured for after this period
            var matchedBreaks = (dto.Breaks ?? new List<BreakItemDto>()).Where(b => b.AfterPeriod == periodIndex).ToList();
            foreach (var b in matchedBreaks)
            {
                int bEnd = currentMin + b.DurationMinutes;
                if (bEnd <= endMin)
                {
                    periods.Add(new ComputedPeriod
                    {
                        Name = b.Name,
                        StartTime = MinutesToTime(currentMin),
                        EndTime = MinutesToTime(bEnd),
                        Type = b.Type,
                        Sequence = sequence++
                    });
                    currentMin = bEnd;
                }
            }
        }

        return periods;
    }

    private async Task<Dictionary<string, PeriodSetting>> SyncPeriodSettingsAsync(List<ComputedPeriod> generatedPeriods)
    {
        var activePeriods = await _timetableRepository.GetPeriodSettingsAsync();
        var periodMap = new Dictionary<string, PeriodSetting>();

        foreach (var gp in generatedPeriods)
        {
            var gpStartSpan = ParseTime(gp.StartTime);
            var gpEndSpan = ParseTime(gp.EndTime);
            var gpTypeMapped = gp.Type.Equals("Teaching", StringComparison.OrdinalIgnoreCase)
                ? "Teaching Period"
                : gp.Type;

            var existing = activePeriods.FirstOrDefault(p =>
                p.PeriodName.Trim().Equals(gp.Name.Trim(), StringComparison.OrdinalIgnoreCase) &&
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

        return periodMap;
    }

    private async Task<(List<TimetableHeader> headers, List<int> headerIds)> ResolveTargetHeadersAsync(GenerateTimetableRequestDto dto)
    {
        var targetHeaders = new List<TimetableHeader>();
        var targetHeaderIds = new List<int>();

        foreach (var classSecStr in dto.SelectedClassSections ?? new List<string>())
        {
            var parts = classSecStr.Split('-');
            if (parts.Length < 2) continue;
            var className = parts[0].Trim();
            var sectionName = parts[1].Trim();

            var classGrade = await _timetableRepository.GetClassByNameAsync(className);
            if (classGrade == null)
            {
                _logger.LogWarning("Class '{ClassName}' not found during timetable generation.", className);
                continue;
            }

            var section = await _timetableRepository.GetSectionByNameAsync(classGrade.ClassId, sectionName);
            if (section == null)
            {
                _logger.LogWarning("Section '{SectionName}' not found in Class '{ClassName}' during generation.", sectionName, className);
                continue;
            }

            var year = dto.AcademicYear ?? string.Empty;
            var header = await _timetableRepository.GetHeaderByClassSectionAsync(classGrade.ClassId, section.SectionId, year);
            if (header == null)
            {
                header = new TimetableHeader
                {
                    ClassId = classGrade.ClassId,
                    SectionId = section.SectionId,
                    AcademicYear = year,
                    BranchName = !string.IsNullOrWhiteSpace(classGrade.CampusLocation) ? classGrade.CampusLocation : string.Empty,
                    Status = nameof(TimetableStatus.Draft),
                    IncludeSaturday = false
                };
                header = await _timetableRepository.CreateHeaderAsync(header);
            }

            targetHeaders.Add(header);
            targetHeaderIds.Add(header.HeaderId);
        }

        return (targetHeaders, targetHeaderIds);
    }

    private static Dictionary<int, HashSet<string>> BuildTeacherBusySchedule(List<TimetableSlot> existingSlots, List<int> excludeHeaderIds)
    {
        var teacherBusySchedule = new Dictionary<int, HashSet<string>>();

        foreach (var slot in existingSlots)
        {
            if (slot.TeacherId > 0 && !excludeHeaderIds.Contains(slot.HeaderId))
            {
                if (!teacherBusySchedule.ContainsKey(slot.TeacherId))
                {
                    teacherBusySchedule[slot.TeacherId] = new HashSet<string>();
                }
                var timeKey = $"{slot.StartTime:hh\\:mm}-{slot.EndTime:hh\\:mm}";
                teacherBusySchedule[slot.TeacherId].Add($"{slot.DayOfWeek}_{timeKey}");
            }
        }

        return teacherBusySchedule;
    }

    private async Task<List<CandidateSubject>> FetchCandidateSubjectsAsync(
        int classId,
        int sectionId,
        Dictionary<int, Subject> allSubjects,
        Dictionary<int, Staff> allStaff,
        List<ClassSubjectMapping> allMappings)
    {
        var classMappings = allMappings.Where(m => m.ClassId == classId).ToList();
        var candidateSubjects = new List<CandidateSubject>();

        foreach (var mapping in classMappings)
        {
            if (!allSubjects.TryGetValue(mapping.SubjectId, out var sub))
            {
                continue;
            }

            var teacher = await _timetableRepository.GetAssignedTeacherForSubjectAsync(classId, sectionId, mapping.SubjectId);
            string tName = "Unassigned Faculty";
            string empId = "";

            if (teacher != null && allStaff.TryGetValue(teacher.StaffId, out var staffObj))
            {
                tName = staffObj.DisplayName ?? $"{staffObj.FirstName ?? ""} {staffObj.LastName ?? ""}".Trim();
                empId = staffObj.EmployeeId ?? "";
            }

            candidateSubjects.Add(new CandidateSubject
            {
                SubjectId = mapping.SubjectId,
                SubjectName = sub.SubjectName ?? "",
                SubjectCode = sub.SubjectCode ?? "",
                TeacherId = teacher?.StaffId ?? 0,
                TeacherName = tName,
                EmployeeId = empId,
                WeeklyPeriods = mapping.WeeklyPeriods > 0 ? mapping.WeeklyPeriods : 0,
                AssignedCount = 0
            });
        }

        return candidateSubjects;
    }

    private async Task PersistGeneratedTimetableAsync(List<int> targetHeaderIds, List<TimetableSlot> newlyGeneratedSlots)
    {
        if (targetHeaderIds.Any())
        {
            await _timetableRepository.DeleteSlotsByHeaderIdsAsync(targetHeaderIds);
        }

        if (newlyGeneratedSlots.Any())
        {
            await _timetableRepository.SaveSlotsBatchAsync(newlyGeneratedSlots);
        }
    }
}
