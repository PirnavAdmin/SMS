namespace SMS.Api.Dtos;

using System;
using System.Collections.Generic;

public static class TimetableGenerationStatus
{
    public const string READY = "READY";
    public const string NO_SOLUTION = "NO_SOLUTION";
    public const string VALIDATION_FAILED = "VALIDATION_FAILED";
    public const string TIMEOUT = "TIMEOUT";
    public const string CANCELLED = "CANCELLED";
    public const string SYSTEM_ERROR = "SYSTEM_ERROR";
}

public class GenerateTimetableResponseDto
{
    public bool Success { get; set; }
    public Guid GenerationId { get; set; } = Guid.NewGuid();
    public int GenerationSeed { get; set; }
    public double QualityScore { get; set; } = 100.0;
    public double DailyPatternSimilarity { get; set; } = 0.0;
    public bool SubjectsDistributed { get; set; } = true;
    public int ConsecutiveSubjectViolations { get; set; } = 0;
    public int TeacherConflicts { get; set; } = 0;
    public int SectionConflicts { get; set; } = 0;
    public int QuotaViolations { get; set; } = 0;
    public string Status { get; set; } = TimetableGenerationStatus.READY;
    public string Message { get; set; } = string.Empty;
    public TimetableGenerationSummaryDto? Summary { get; set; }
    public List<TimetableSlotDto> Timetable { get; set; } = new();
    public List<TimetableConflictDetailDto> Conflicts { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class TimetableGenerationSummaryDto
{
    public int TotalSections { get; set; }
    public int TotalSubjects { get; set; }
    public int SlotsGenerated { get; set; }
    public int HardViolations { get; set; } = 0;
    public int SoftPenalty { get; set; }
    public double DistributionScore { get; set; } = 100.0; // 0.0 - 100.0%
    public double TeacherBalanceScore { get; set; } = 100.0; // 0.0 - 100.0%
    public double DailyPatternDiversityScore { get; set; } = 100.0; // 0.0 - 100.0%
    public double PeriodDiversityScore { get; set; } = 100.0; // 0.0 - 100.0%
    public double OverallQualityScore { get; set; } = 100.0; // 0.0 - 100.0%
    public long ExecutionTimeMs { get; set; }
}

public class TimetableConflictDetailDto
{
    public string Type { get; set; } = string.Empty; // "TEACHER_CAPACITY", "SECTION_CAPACITY", "UNASSIGNED_TEACHER", "ROOM_CONTENTION", "HARD_VIOLATION"
    public string EntityName { get; set; } = string.Empty;
    public int RequiredPeriods { get; set; }
    public int AvailablePeriods { get; set; }
    public string Message { get; set; } = string.Empty;
}
