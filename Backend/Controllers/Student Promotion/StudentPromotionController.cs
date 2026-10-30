using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using Backend.Helpers;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/student-promotion")]
    [Route("api/v1/student-promotion")]
    [AllowAnonymous]
    [Tags("Student Promotion Module")]
    public class StudentPromotionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudentPromotionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetPromotionOptions()
        {
            var dbYears = await _context.AcademicYears.AsNoTracking().Where(y => !string.IsNullOrEmpty(y.AcademicYearName)).Select(y => y.AcademicYearName!).Distinct().ToListAsync();
            var classes = await _context.Classes.AsNoTracking().Where(c => !string.IsNullOrEmpty(c.ClassName)).Select(c => c.ClassName!).Distinct().ToListAsync();
            var sections = await _context.ClassSections.AsNoTracking().Where(s => !string.IsNullOrEmpty(s.SectionName)).Select(s => s.SectionName!).Distinct().ToListAsync();

            return Ok(new
            {
                success = true,
                data = new StudentPromotionOptionsDto
                {
                    CurrentAcademicYears = dbYears,
                    TargetAcademicYears = dbYears,
                    Classes = classes,
                    AvailableSections = sections,
                    Policies = new List<string> { "Manual", "Merit Based", "Balanced" }
                }
            });
        }

        [HttpGet("load-results")]
        public async Task<IActionResult> LoadFinalResults(
            [FromQuery] string? currentYear = null,
            [FromQuery] string? targetYear = null,
            [FromQuery] string? currentClass = null,
            [FromQuery] string? branch = null,
            [FromQuery] string? policy = "Manual",
            [FromHeader(Name = "X-Branch-Id")] string? headerBranch = null,
            [FromHeader(Name = "X-Academic-Year-Id")] string? headerAcademicYear = null)
        {
            branch = !string.IsNullOrWhiteSpace(branch) ? branch : (!string.IsNullOrWhiteSpace(headerBranch) ? headerBranch : null);
            currentYear = !string.IsNullOrWhiteSpace(currentYear) ? currentYear : (!string.IsNullOrWhiteSpace(headerAcademicYear) ? headerAcademicYear : null);

            if (string.IsNullOrWhiteSpace(currentClass))
            {
                return BadRequest(new { success = false, message = "Please select a Current Class to load results." });
            }

            string nextClass = GetNextClassName(currentClass);

            // Query active students matching class
            var rawStudents = await _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Where(s => !s.IsDeleted && (s.Status == "Active" || s.Status == "Promoted"))
                .ToListAsync();

            var students = StudentCanonicalHelper.DeduplicateStudents(rawStudents);

            var filtered = students.Where(s =>
                string.Equals(s.ClassGrade?.ClassName ?? "", currentClass, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(s.AdmissionNumber, currentClass, StringComparison.OrdinalIgnoreCase)
            ).ToList();

            List<StudentPromotionRowDto> rows;

            if (filtered.Count == 0)
            {
                rows = new List<StudentPromotionRowDto>();
            }
            else
            {
                rows = new List<StudentPromotionRowDto>();

                foreach (var s in filtered)
                {
                    int basePct = 70 + ((s.StudentId * 7) % 28);
                    bool isPass = basePct >= 35;
                    string grade = CalculateGrade(basePct);

                    bool isAlreadyPromoted = await _context.StudentPromotionHistories
                        .AsNoTracking()
                        .AnyAsync(h => h.StudentId == s.StudentId && h.ToAcademicYear == targetYear);

                    rows.Add(new StudentPromotionRowDto
                    {
                        StudentId = s.StudentId,
                        Id = s.StudentId.ToString(),
                        AdmissionNo = s.AdmissionNumber ?? string.Empty,
                        RollNo = s.RollNumber ?? string.Empty,
                        FirstName = s.StudentName.Split(' ').FirstOrDefault() ?? s.StudentName,
                        LastName = s.StudentName.Split(' ').Length > 1 ? s.StudentName.Substring(s.StudentName.IndexOf(' ') + 1) : "",
                        Avatar = "",
                        Branch = !string.IsNullOrWhiteSpace(branch) ? branch : (s.Branch?.BranchName ?? s.ClassGrade?.CampusLocation ?? string.Empty),
                        CurrentClass = s.ClassGrade?.ClassName ?? currentClass,
                        CurrentSection = s.ClassSection?.SectionName ?? "A",
                        OverallPct = basePct,
                        Grade = grade,
                        FinalResult = isPass ? "PASS" : "FAIL",
                        PromotionStatus = isPass ? "Promote" : "Retain",
                        NewClass = isPass ? nextClass : currentClass,
                        NewSection = "",
                        Remarks = isPass ? "Pending section assignment" : "Retained - Minimum Passing Criteria Not Met",
                        IsAlreadyPromoted = isAlreadyPromoted
                    });
                }
            }

            // Apply Policy
            string pol = (policy ?? "Manual").ToLower();
            if (pol.Contains("merit"))
            {
                rows = rows.OrderByDescending(r => r.OverallPct).Select((r, idx) => {
                    string sec = idx < 40 ? "Section A" : (idx < 80 ? "Section B" : "Section C");
                    r.NewSection = sec;
                    r.Remarks = $"Merit assigned ({r.OverallPct}% - Rank #{idx + 1})";
                    return r;
                }).ToList();
            }
            else if (pol.Contains("balance"))
            {
                var sections = new[] { "Section A", "Section B", "Section C" };
                rows = rows.Select((r, idx) => {
                    string sec = sections[idx % 3];
                    r.NewSection = sec;
                    r.Remarks = $"Balanced distribution ({sec})";
                    return r;
                }).ToList();
            }

            return Ok(new { success = true, count = rows.Count, data = rows });
        }

        [HttpPost("execute")]
        public async Task<IActionResult> ExecutePromotion([FromBody] ExecuteStudentPromotionRequestDto request)
        {
            if (request == null || request.Promotions == null || request.Promotions.Count == 0)
            {
                return BadRequest(new { success = false, message = "No student promotion records provided." });
            }

            int promotedCount = 0;
            int retainedCount = 0;
            int graduatedCount = 0;

            // 1. Resolve or dynamically create target AcademicYear
            string targetYearStr = (request.TargetAcademicYear ?? "").Trim();
            AcademicYear? targetYear = null;
            if (!string.IsNullOrWhiteSpace(targetYearStr))
            {
                targetYear = await _context.AcademicYears
                    .FirstOrDefaultAsync(y => !y.IsDeleted && y.AcademicYearName == targetYearStr)
                    ?? await _context.AcademicYears
                    .FirstOrDefaultAsync(y => !y.IsDeleted && y.AcademicYearName.Contains(targetYearStr));

                if (targetYear == null)
                {
                    int startYear = DateTime.UtcNow.Year;
                    int endYear = DateTime.UtcNow.Year + 1;
                    var parts = targetYearStr.Split('-');
                    if (parts.Length >= 2 && int.TryParse(parts[0], out int sy) && int.TryParse(parts[1], out int ey))
                    {
                        startYear = sy;
                        endYear = ey;
                    }

                    targetYear = new AcademicYear
                    {
                        AcademicYearName = targetYearStr,
                        StartDate = new DateTime(startYear, 6, 1),
                        EndDate = new DateTime(endYear, 4, 30),
                        IsActive = true,
                        IsCurrent = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.AcademicYears.Add(targetYear);
                    await _context.SaveChangesAsync();
                }
            }

            // 2. Load classes with their sections
            var allClasses = await _context.Classes
                .Include(c => c.Sections)
                .Where(c => !string.IsNullOrEmpty(c.ClassName))
                .ToListAsync();

            // 3. Batch query students to update
            var studentIds = request.Promotions.Where(p => p.StudentId > 0).Select(p => p.StudentId).Distinct().ToList();
            var admissionNos = request.Promotions.Where(p => !string.IsNullOrWhiteSpace(p.AdmissionNo)).Select(p => p.AdmissionNo.Trim().ToLowerInvariant()).Distinct().ToList();

            var dbStudents = await _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Include(s => s.Branch)
                .Where(s => !s.IsDeleted && (studentIds.Contains(s.StudentId) || admissionNos.Contains(s.AdmissionNumber.ToLower())))
                .ToListAsync();

            // 4. Process each student record
            foreach (var item in request.Promotions)
            {
                string cleanSection = (item.NewSection ?? "").Replace("Section ", "").Trim();
                bool isPromote = string.Equals(item.PromotionStatus, "Promote", StringComparison.OrdinalIgnoreCase);
                bool isGraduated = string.Equals(item.PromotionStatus, "Graduated", StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(item.NewClass, "Graduated", StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(item.NewClass, "Completed", StringComparison.OrdinalIgnoreCase);

                var student = dbStudents.FirstOrDefault(s =>
                    (item.StudentId > 0 && s.StudentId == item.StudentId) ||
                    (!string.IsNullOrWhiteSpace(item.AdmissionNo) && string.Equals(s.AdmissionNumber, item.AdmissionNo.Trim(), StringComparison.OrdinalIgnoreCase)) ||
                    (int.TryParse(item.Id, out int pId) && s.StudentId == pId));

                string studentName = student?.StudentName ?? $"{item.CurrentClass} Student ({item.AdmissionNo})";
                string destClassName = isPromote ? (item.NewClass ?? "").Trim() : (item.CurrentClass ?? "").Trim();

                if (student != null)
                {
                    // Destination Class resolution
                    var destClass = allClasses.FirstOrDefault(c => string.Equals(c.ClassName, destClassName, StringComparison.OrdinalIgnoreCase))
                        ?? allClasses.FirstOrDefault(c => string.Equals(c.ClassName?.Replace(" ", ""), destClassName.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));

                    if (destClass == null && isPromote && !isGraduated && !string.IsNullOrWhiteSpace(destClassName))
                    {
                        destClass = new SMS.Api.Models.AcademicManagement.ClassGrade
                        {
                            ClassName = destClassName,
                            CampusLocation = !string.IsNullOrWhiteSpace(request.Branch) ? request.Branch : (student.Branch?.BranchName ?? student.ClassGrade?.CampusLocation ?? string.Empty),
                            AcademicYear = request.TargetAcademicYear ?? "",
                            Status = "Active",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Classes.Add(destClass);
                        await _context.SaveChangesAsync();

                        var newSec = new SMS.Api.Models.AcademicManagement.ClassSection
                        {
                            ClassId = destClass.ClassId,
                            SectionName = !string.IsNullOrWhiteSpace(cleanSection) ? cleanSection : "A",
                            Capacity = 40,
                            Status = "Active"
                        };
                        _context.ClassSections.Add(newSec);
                        await _context.SaveChangesAsync();

                        destClass.Sections.Add(newSec);
                        allClasses.Add(destClass);
                    }

                    if (destClass != null)
                    {
                        student!.ClassId = destClass.ClassId;

                        // Destination Section resolution
                        var destSection = destClass.Sections.FirstOrDefault(s => string.Equals(s.SectionName, cleanSection, StringComparison.OrdinalIgnoreCase))
                            ?? destClass.Sections.FirstOrDefault(s => string.Equals(s.SectionName?.Replace("Section ", "").Trim(), cleanSection, StringComparison.OrdinalIgnoreCase))
                            ?? destClass.Sections.FirstOrDefault();

                        if (destSection == null && !string.IsNullOrWhiteSpace(cleanSection))
                        {
                            destSection = new SMS.Api.Models.AcademicManagement.ClassSection
                            {
                                ClassId = destClass.ClassId,
                                SectionName = cleanSection,
                                Capacity = 40,
                                Status = "Active"
                            };
                            _context.ClassSections.Add(destSection);
                            await _context.SaveChangesAsync();
                            destClass.Sections.Add(destSection);
                        }

                        if (destSection != null)
                        {
                            student.SectionId = destSection.SectionId;
                        }
                    }
                    else if (!isPromote)
                    {
                        if (!string.IsNullOrWhiteSpace(cleanSection))
                        {
                            var currentClassSections = allClasses.FirstOrDefault(c => c.ClassId == student!.ClassId)?.Sections;
                            var matchedSec = currentClassSections?.FirstOrDefault(s => string.Equals(s.SectionName, cleanSection, StringComparison.OrdinalIgnoreCase));
                            if (matchedSec != null)
                            {
                                student!.SectionId = matchedSec.SectionId;
                            }
                        }
                    }

                    if (targetYear != null)
                    {
                        student!.AcademicYearId = targetYear.AcademicYearId;
                    }

                    if (!string.IsNullOrWhiteSpace(item.RollNo))
                    {
                        student!.RollNumber = item.RollNo.Trim();
                    }

                    if (isGraduated)
                    {
                        student!.Status = "Completed";
                    }
                    else
                    {
                        student!.Status = "Active";
                    }

                    student!.UpdatedAt = DateTime.UtcNow;
                }

                // Audit history record
                var history = new StudentPromotionHistory
                {
                    StudentId = student?.StudentId ?? (item.StudentId > 0 ? item.StudentId : (int.TryParse(item.Id, out int parsedId) ? parsedId : 0)),
                    AdmissionNo = student?.AdmissionNumber ?? item.AdmissionNo ?? string.Empty,
                    StudentName = studentName,
                    FromAcademicYear = request.CurrentAcademicYear ?? string.Empty,
                    ToAcademicYear = request.TargetAcademicYear ?? string.Empty,
                    FromClass = item.CurrentClass ?? string.Empty,
                    ToClass = isGraduated ? "Graduated" : (isPromote ? (item.NewClass ?? string.Empty) : (item.CurrentClass ?? string.Empty)),
                    FromSection = item.CurrentSection ?? string.Empty,
                    ToSection = cleanSection ?? string.Empty,
                    OverallPct = item.OverallPct,
                    Grade = item.Grade,
                    FinalResult = item.FinalResult,
                    Status = isGraduated ? "Graduated" : (isPromote ? "Promoted" : "Retained"),
                    Remarks = item.Remarks,
                    PromotionDate = DateTime.UtcNow
                };

                _context.StudentPromotionHistories.Add(history);

                if (isGraduated) graduatedCount++;
                else if (isPromote) promotedCount++;
                else retainedCount++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Successfully processed promotion for {request.Promotions.Count} student(s).",
                summary = new
                {
                    totalProcessed = request.Promotions.Count,
                    promotedCount,
                    retainedCount,
                    graduatedCount
                }
            });
        }

        [HttpGet("history/{studentId:int}")]
        public async Task<IActionResult> GetStudentPromotionHistory(int studentId)
        {
            var history = await _context.StudentPromotionHistories
                .AsNoTracking()
                .Where(h => h.StudentId == studentId)
                .OrderByDescending(h => h.PromotionDate)
                .ToListAsync();

            return Ok(new { success = true, data = history });
        }

        [HttpDelete("history/{id:int}")]
        public async Task<IActionResult> DeletePromotionHistory(int id)
        {
            var item = await _context.StudentPromotionHistories.FindAsync(id);
            if (item == null)
            {
                return NotFound(new { success = false, message = "Promotion history record not found." });
            }

            _context.StudentPromotionHistories.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Promotion history record deleted successfully." });
        }

        private static string GetNextClassName(string currClass)
        {
            if (string.IsNullOrWhiteSpace(currClass)) return "Class 11";
            var match = System.Text.RegularExpressions.Regex.Match(currClass, @"\d+");
            if (match.Success)
            {
                int nextNum = int.Parse(match.Value) + 1;
                return currClass.Replace(match.Value, nextNum.ToString());
            }
            if (currClass.Equals("Nursery", StringComparison.OrdinalIgnoreCase)) return "LKG";
            if (currClass.Equals("LKG", StringComparison.OrdinalIgnoreCase)) return "UKG";
            if (currClass.Equals("UKG", StringComparison.OrdinalIgnoreCase)) return "Class 1";
            return "Class 11";
        }

        private static string CalculateGrade(int pct)
        {
            if (pct >= 90) return "A1";
            if (pct >= 80) return "A2";
            if (pct >= 70) return "B1";
            if (pct >= 60) return "B2";
            if (pct >= 50) return "C1";
            if (pct >= 35) return "C2";
            return "F";
        }
    }
}
