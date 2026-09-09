namespace SMS.Api.Services.Implementations.AcademicManagement;

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Services.Interfaces;

public class TimetableIntegrityValidator : ITimetableIntegrityValidator
{
    private readonly ILogger<TimetableIntegrityValidator> _logger;

    public TimetableIntegrityValidator(ILogger<TimetableIntegrityValidator>? logger = null)
    {
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<TimetableIntegrityValidator>.Instance;
    }

    public TimetableIntegrityResult Validate(
        List<TimetableSlot> slots,
        List<PeriodSetting> activePeriods,
        List<string> workingDays,
        Dictionary<(int classId, int sectionId, int subjectId), int> expectedQuotas,
        GenerateTimetableRequestDto request,
        Dictionary<int, Subject>? allSubjects = null)
    {
        var result = new TimetableIntegrityResult();
        var workingDaysSet = new HashSet<string>(workingDays, StringComparer.OrdinalIgnoreCase);

        var breakPeriods = activePeriods
            .Where(p => p.PeriodType.Contains("Break", StringComparison.OrdinalIgnoreCase) ||
                        p.PeriodType.Contains("Lunch", StringComparison.OrdinalIgnoreCase) ||
                        p.PeriodType.Contains("Recess", StringComparison.OrdinalIgnoreCase))
            .ToList();

        // 1. Check Non-Working Days
        foreach (var slot in slots)
        {
            if (!workingDaysSet.Contains(slot.DayOfWeek))
            {
                result.IsValid = false;
                var msg = $"Slot assigned on non-working day '{slot.DayOfWeek}'.";
                result.Violations.Add(msg);
                result.ConflictDetails.Add(new TimetableConflictDetailDto
                {
                    Type = "NON_WORKING_DAY",
                    EntityName = slot.DayOfWeek,
                    Message = msg
                });
            }
        }

        // 2. Check Break Overlaps
        foreach (var slot in slots)
        {
            foreach (var b in breakPeriods)
            {
                // Slot overlaps if slot.StartTime < b.EndTime and slot.EndTime > b.StartTime
                if (slot.StartTime < b.EndTime && slot.EndTime > b.StartTime)
                {
                    result.IsValid = false;
                    var msg = $"Slot for Subject ID {slot.SubjectId} on {slot.DayOfWeek} ({slot.StartTime}-{slot.EndTime}) overlaps with break '{b.PeriodName}' ({b.StartTime}-{b.EndTime}).";
                    result.Violations.Add(msg);
                    result.ConflictDetails.Add(new TimetableConflictDetailDto
                    {
                        Type = "BREAK_OVERLAP",
                        EntityName = b.PeriodName,
                        Message = msg
                    });
                }
            }
        }

        // 3. Check Section Clashes (One section cannot have 2 subjects at same Day and StartTime)
        var sectionDayTimeGroups = slots.GroupBy(s => $"{s.HeaderId}_{s.DayOfWeek}_{s.StartTime:hh\\:mm}");
        foreach (var group in sectionDayTimeGroups)
        {
            if (group.Count() > 1)
            {
                result.IsValid = false;
                var first = group.First();
                var msg = $"Section Clash: Header ID {first.HeaderId} has {group.Count()} slots scheduled simultaneously on {first.DayOfWeek} at {first.StartTime}.";
                result.Violations.Add(msg);
                result.ConflictDetails.Add(new TimetableConflictDetailDto
                {
                    Type = "SECTION_COLLISION",
                    EntityName = $"Header {first.HeaderId}",
                    Message = msg
                });
            }
        }

        // 4. Check Teacher Clashes (One teacher cannot teach 2 classes at same Day and StartTime)
        var teacherDayTimeGroups = slots
            .Where(s => s.TeacherId > 0)
            .GroupBy(s => $"{s.TeacherId}_{s.DayOfWeek}_{s.StartTime:hh\\:mm}");

        foreach (var group in teacherDayTimeGroups)
        {
            if (group.Count() > 1)
            {
                result.IsValid = false;
                var first = group.First();
                var msg = $"Teacher Clash: Teacher ID {first.TeacherId} is double-booked on {first.DayOfWeek} at {first.StartTime} across {group.Count()} classes.";
                result.Violations.Add(msg);
                result.ConflictDetails.Add(new TimetableConflictDetailDto
                {
                    Type = "TEACHER_COLLISION",
                    EntityName = $"Teacher {first.TeacherId}",
                    Message = msg
                });
            }
        }

        // 5. Check Room Clashes (One room cannot host 2 classes at same Day and StartTime)
        var roomDayTimeGroups = slots
            .Where(s => !string.IsNullOrWhiteSpace(s.RoomNo))
            .GroupBy(s => $"{s.RoomNo!.Trim().ToLowerInvariant()}_{s.DayOfWeek}_{s.StartTime:hh\\:mm}");

        foreach (var group in roomDayTimeGroups)
        {
            if (group.Count() > 1)
            {
                result.IsValid = false;
                var first = group.First();
                var msg = $"Room Clash: Room '{first.RoomNo}' is double-booked on {first.DayOfWeek} at {first.StartTime} across {group.Count()} classes.";
                result.Violations.Add(msg);
                result.ConflictDetails.Add(new TimetableConflictDetailDto
                {
                    Type = "ROOM_COLLISION",
                    EntityName = $"Room {first.RoomNo}",
                    Message = msg
                });
            }
        }

        // 6. Check Anti-Consecutive Rule for Normal Subjects
        // For each Header and Day, order slots by StartTime
        var headerDayGroups = slots.GroupBy(s => $"{s.HeaderId}_{s.DayOfWeek}");
        foreach (var hdGroup in headerDayGroups)
        {
            var orderedSlots = hdGroup.OrderBy(s => s.StartTime).ToList();
            for (int i = 0; i < orderedSlots.Count - 1; i++)
            {
                var cur = orderedSlots[i];
                var next = orderedSlots[i + 1];

                // Consecutive periods means next period starts right when current period ends
                if (cur.EndTime == next.StartTime && cur.SubjectId == next.SubjectId)
                {
                    bool isLab = false;
                    if (allSubjects != null && allSubjects.TryGetValue(cur.SubjectId, out var sub))
                    {
                        isLab = (sub.SubjectName?.Contains("Lab", StringComparison.OrdinalIgnoreCase) == true) ||
                                (sub.SubjectName?.Contains("Practical", StringComparison.OrdinalIgnoreCase) == true);
                    }
                    else if (cur.Subject != null)
                    {
                        isLab = (cur.Subject.SubjectName?.Contains("Lab", StringComparison.OrdinalIgnoreCase) == true) ||
                                (cur.Subject.SubjectName?.Contains("Practical", StringComparison.OrdinalIgnoreCase) == true);
                    }

                    bool isLabConsecutiveAllowed = isLab && request.AllowConsecutiveForLabs;
                    if (!isLabConsecutiveAllowed)
                    {
                        result.IsValid = false;
                        var msg = $"Anti-Consecutive Violation: Subject ID {cur.SubjectId} is scheduled in consecutive periods on {cur.DayOfWeek} ({cur.StartTime} and {next.StartTime}).";
                        result.Violations.Add(msg);
                        result.ConflictDetails.Add(new TimetableConflictDetailDto
                        {
                            Type = "CONSECUTIVE_SUBJECT_VIOLATION",
                            EntityName = $"Subject {cur.SubjectId}",
                            Message = msg
                        });
                    }
                }
            }
        }

        // 7. Check Expected Weekly Quotas
        if (expectedQuotas.Any())
        {
            foreach (var kvp in expectedQuotas)
            {
                int expected = kvp.Value;
                int actual = slots.Count(s =>
                    (s.Header?.ClassId == kvp.Key.classId || s.HeaderId > 0) &&
                    s.SubjectId == kvp.Key.subjectId);

                // If expected > 0 and actual < expected
                if (expected > 0 && actual < expected)
                {
                    result.IsValid = false;
                    var msg = $"Weekly Quota Deficit: Subject ID {kvp.Key.subjectId} received {actual} periods vs. {expected} required.";
                    result.Violations.Add(msg);
                    result.ConflictDetails.Add(new TimetableConflictDetailDto
                    {
                        Type = "QUOTA_DEFICIT",
                        EntityName = $"Subject {kvp.Key.subjectId}",
                        RequiredPeriods = expected,
                        AvailablePeriods = actual,
                        Message = msg
                    });
                }
            }
        }

        // 8. Check Locked Slots Preservation
        if (request?.LockedSlots != null && request.LockedSlots.Any())
        {
            foreach (var locked in request.LockedSlots)
            {
                var match = slots.FirstOrDefault(s =>
                    s.DayOfWeek.Equals(locked.DayOfWeek, StringComparison.OrdinalIgnoreCase) &&
                    s.SubjectId == locked.SubjectId &&
                    (locked.TeacherId <= 0 || s.TeacherId == locked.TeacherId));

                if (match == null)
                {
                    result.IsValid = false;
                    var msg = $"Locked Slot Violation: Locked slot for Subject {locked.SubjectId} on {locked.DayOfWeek} ({locked.StartTime}) was not preserved.";
                    result.Violations.Add(msg);
                    result.ConflictDetails.Add(new TimetableConflictDetailDto
                    {
                        Type = "LOCKED_SLOT_VIOLATION",
                        EntityName = $"Subject {locked.SubjectId}",
                        Message = msg
                    });
                }
            }
        }

        // 9. Check Daily Pattern Repetition (when >= 3 distinct subjects and >= 3 periods per day exist)
        var sectionGroups = slots.GroupBy(s => s.HeaderId);
        foreach (var secGroup in sectionGroups)
        {
            var distinctSubjects = secGroup.Select(s => s.SubjectId).Distinct().Count();
            if (distinctSubjects >= 3)
            {
                var daySignatures = new Dictionary<string, string>();
                var dayGroups = secGroup.GroupBy(s => s.DayOfWeek);
                foreach (var dg in dayGroups)
                {
                    var sig = string.Join("-", dg.OrderBy(s => s.StartTime).Select(s => s.SubjectId));
                    daySignatures[dg.Key] = sig;
                }

                var dayList = daySignatures.Keys.ToList();
                for (int i = 0; i < dayList.Count; i++)
                {
                    for (int j = i + 1; j < dayList.Count; j++)
                    {
                        if (daySignatures[dayList[i]] == daySignatures[dayList[j]] && daySignatures[dayList[i]].Split('-').Length >= 3)
                        {
                            int identicalCount = dayList.Count(d => daySignatures[d] == daySignatures[dayList[i]]);
                            if (identicalCount >= Math.Min(3, dayList.Count))
                            {
                                result.IsValid = false;
                                var msg = $"Daily Pattern Repetition: Section Header {secGroup.Key} repeats identical subject sequence across {identicalCount} days ({daySignatures[dayList[i]]}).";
                                result.Violations.Add(msg);
                                result.ConflictDetails.Add(new TimetableConflictDetailDto
                                {
                                    Type = "DAILY_PATTERN_REPETITION",
                                    EntityName = $"Header {secGroup.Key}",
                                    Message = msg
                                });
                                break;
                            }
                        }
                    }
                    if (!result.IsValid) break;
                }
            }
        }

        if (!result.IsValid)
        {
            _logger.LogWarning("Timetable integrity validation failed with {Count} violations.", result.Violations.Count);
        }

        return result;
    }
}
