namespace SMS.Api.Services.Implementations.FinanceManagement;

using System;
using System.Collections.Generic;
using System.Linq;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;

public static class AcademicYearTermCalculator
{
    public static List<FeeScheduleTermDto> GenerateTermsFromAcademicYear(
        AcademicYear ay,
        int numberOfTerms,
        int dueDateOffsetDays = 45,
        List<FeeScheduleTermDto>? existingTerms = null)
    {
        int n = Math.Max(1, Math.Min(12, numberOfTerms > 0 ? numberOfTerms : 4));
        int safeOffsetDays = Math.Max(0, dueDateOffsetDays);
        DateTime start = ay.StartDate;
        DateTime end = ay.EndDate;

        if (end <= start)
        {
            end = start.AddYears(1);
        }

        int totalDays = (int)(end.Date - start.Date).TotalDays + 1;
        int baseDays = totalDays / n;
        int remainderDays = totalDays % n;

        var result = new List<FeeScheduleTermDto>();
        DateTime currentStart = start.Date;

        for (int i = 1; i <= n; i++)
        {
            int termDuration = baseDays + (i <= remainderDays ? 1 : 0);
            DateTime termStart = currentStart;
            DateTime termEnd;

            if (i == n)
            {
                termEnd = end.Date;
            }
            else
            {
                termEnd = termStart.AddDays(termDuration - 1);
            }

            var matchingExisting = existingTerms?.FirstOrDefault(t => t.Sequence == i);
            string mode = matchingExisting?.DueDateMode ?? "AUTO";
            string dueDateStr;

            if (mode.Equals("MANUAL", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(matchingExisting?.DueDate))
            {
                dueDateStr = matchingExisting.DueDate;
            }
            else
            {
                mode = "AUTO";
                DateTime calculatedDue = termStart.AddDays(safeOffsetDays);
                dueDateStr = calculatedDue.ToString("yyyy-MM-dd");
            }

            string termName = matchingExisting?.TermName ?? (n switch
            {
                1 => "Term 1 (Annual)",
                2 => $"Term {i} (Semester {i})",
                3 => $"Term {i} (Tri-Semester {i})",
                4 => $"Term {i} (Quarter {i})",
                6 => $"Term {i} (Bi-monthly {i})",
                _ => $"Term {i}"
            });

            double share = Math.Round(100.0 / n, 2);

            result.Add(new FeeScheduleTermDto
            {
                Id = matchingExisting?.Id ?? $"T{i}-{ay.AcademicYearName.Replace(" ", "")}",
                Sequence = i,
                TermName = termName,
                StartDate = termStart.ToString("yyyy-MM-dd"),
                EndDate = termEnd.ToString("yyyy-MM-dd"),
                DueDate = dueDateStr,
                DueDateMode = mode,
                DueDateOffsetDays = safeOffsetDays,
                Status = matchingExisting?.Status ?? "Active",
                PercentageShare = matchingExisting?.PercentageShare ?? share
            });

            currentStart = termEnd.AddDays(1);
        }

        return result;
    }

    public static MonthlyDueDateConfigDto GenerateMonthlyDatesFromAcademicYear(AcademicYear ay, int dueDay = 10)
    {
        DateTime start = ay.StartDate.Date;
        DateTime end = ay.EndDate.Date;
        int safeDueDay = Math.Min(31, Math.Max(1, dueDay > 0 ? dueDay : 10));

        var monthDueDates = new List<MonthDueDateItemDto>();
        DateTime currentMonth = new DateTime(start.Year, start.Month, 1);
        DateTime lastMonth = new DateTime(end.Year, end.Month, 1);

        int idx = 0;
        while (currentMonth <= lastMonth)
        {
            int daysInMonth = DateTime.DaysInMonth(currentMonth.Year, currentMonth.Month);
            int targetDay = Math.Min(safeDueDay, daysInMonth);

            DateTime calculatedDue = new DateTime(currentMonth.Year, currentMonth.Month, targetDay);
            if (calculatedDue < start) calculatedDue = start;
            if (calculatedDue > end) calculatedDue = end;

            string monthName = currentMonth.ToString("MMMM yyyy");

            monthDueDates.Add(new MonthDueDateItemDto
            {
                MonthIndex = idx,
                MonthName = monthName,
                DueDate = calculatedDue.ToString("yyyy-MM-dd")
            });

            currentMonth = currentMonth.AddMonths(1);
            idx++;
        }

        return new MonthlyDueDateConfigDto
        {
            ApplySameDayToAllMonths = true,
            DueDay = safeDueDay,
            MonthDueDates = monthDueDates
        };
    }

    public static bool IsDueDateValidForTerm(string termStartStr, string termEndStr, string dueDateStr, out string errorMessage)
    {
        errorMessage = string.Empty;
        if (!DateTime.TryParse(termStartStr, out var termStart) ||
            !DateTime.TryParse(termEndStr, out var termEnd) ||
            !DateTime.TryParse(dueDateStr, out var dueDate))
        {
            errorMessage = "Invalid date format provided.";
            return false;
        }

        if (dueDate < termStart || dueDate > termEnd)
        {
            errorMessage = $"Calculated due date ({dueDate:yyyy-MM-dd}) falls outside the term period ({termStart:yyyy-MM-dd} to {termEnd:yyyy-MM-dd}).";
            return false;
        }

        return true;
    }
}
