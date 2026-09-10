namespace SMS.Api.Services.Interfaces;

using System.Collections.Generic;
using SMS.Api.Dtos;
using SMS.Api.Models;

public class TimetableIntegrityResult
{
    public bool IsValid { get; set; } = true;
    public List<string> Violations { get; set; } = new();
    public List<TimetableConflictDetailDto> ConflictDetails { get; set; } = new();
}

public interface ITimetableIntegrityValidator
{
    TimetableIntegrityResult Validate(
        List<TimetableSlot> slots,
        List<PeriodSetting> activePeriods,
        List<string> workingDays,
        Dictionary<(int classId, int sectionId, int subjectId), int> expectedQuotas,
        GenerateTimetableRequestDto request,
        Dictionary<int, Subject>? allSubjects = null);
}
