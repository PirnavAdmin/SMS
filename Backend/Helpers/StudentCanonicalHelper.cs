using System;
using System.Collections.Generic;
using System.Linq;
using SMS.Api.Models;

namespace Backend.Helpers;

public static class StudentCanonicalHelper
{
    /// <summary>
    /// Deduplicates student records to return unique currently enrolled students.
    /// Priority is given to official "ADM-" admission numbers and earlier primary records.
    /// Deduplicates by canonical admission number, (student name + mobile), or (student name + class).
    /// </summary>
    public static List<Student> DeduplicateStudents(IEnumerable<Student> students)
    {
        if (students == null) return new List<Student>();

        // Order so primary canonical records come first:
        // 1. Records with ADM- prefix come before REG- or other prefixes
        // 2. Smaller StudentId (earlier original creation) comes first
        var ordered = students
            .OrderBy(s => !string.IsNullOrWhiteSpace(s.AdmissionNumber) && s.AdmissionNumber.Trim().StartsWith("ADM-", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(s => s.StudentId)
            .ToList();

        var result = new List<Student>();
        var seenAdmNos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var seenPhoneKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var seenClassKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var s in ordered)
        {
            var admNo = (!string.IsNullOrWhiteSpace(s.AdmissionNumber) ? s.AdmissionNumber.Trim() : $"STU-{s.StudentId:D4}").ToLowerInvariant();
            var sName = (s.StudentName ?? "").Trim().ToLowerInvariant();
            var sPhone = (s.FatherMobile ?? s.MobileNumber ?? "").Trim();
            var sCls = ((s.ClassGrade != null && !string.IsNullOrWhiteSpace(s.ClassGrade.ClassName)) ? s.ClassGrade.ClassName : (s.ClassId > 0 ? $"Class {s.ClassId}" : "")).Trim().ToLowerInvariant();

            if (seenAdmNos.Contains(admNo))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(sName) && !string.IsNullOrWhiteSpace(sPhone) && seenPhoneKeys.Contains($"{sName}|{sPhone}"))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(sName) && !string.IsNullOrWhiteSpace(sCls) && seenClassKeys.Contains($"{sName}|{sCls}"))
            {
                continue;
            }

            result.Add(s);
            seenAdmNos.Add(admNo);

            if (!string.IsNullOrWhiteSpace(sName))
            {
                if (!string.IsNullOrWhiteSpace(sPhone))
                    seenPhoneKeys.Add($"{sName}|{sPhone}");
                if (!string.IsNullOrWhiteSpace(sCls))
                    seenClassKeys.Add($"{sName}|{sCls}");
            }
        }

        return result;
    }
}
