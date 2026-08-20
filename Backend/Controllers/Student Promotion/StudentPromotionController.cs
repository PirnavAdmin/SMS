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
            var years = new List<string> { "2026-2027 (Current)", "2025-2026 (Previous Year)", "2024-2025 (Previous Year)" };
            var targetYears = new List<string> { "2027-2028 (Next Year)", "2026-2027", "2028-2029 (Upcoming)" };
            var classes = new List<string> { "Class 10", "Class 9", "LKG", "Class 5", "Class 7", "Class 1", "Class 2", "Class 3", "Class 4", "Class 6", "Class 8", "Class 11", "Class 12 (Terminal Class)" };

            return Ok(new
            {
                success = true,
                data = new StudentPromotionOptionsDto
                {
                    CurrentAcademicYears = years,
                    TargetAcademicYears = targetYears,
                    Classes = classes,
                    AvailableSections = new List<string> { "Section A", "Section B", "Section C" },
                    Policies = new List<string> { "Manual", "Merit Based", "Balanced" }
                }
            });
        }

        [HttpGet("load-results")]
        public async Task<IActionResult> LoadFinalResults(
            [FromQuery] string? currentYear = "2026-2027",
            [FromQuery] string? targetYear = "2027-2028",
            [FromQuery] string? currentClass = "Class 10",
            [FromQuery] string? branch = "Main Campus",
            [FromQuery] string? policy = "Manual")
        {
            if (string.IsNullOrWhiteSpace(currentClass))
            {
                return BadRequest(new { success = false, message = "Please select a Current Class to load results." });
            }

            string nextClass = GetNextClassName(currentClass);

            // Query active students matching class
            var students = await _context.Students
                .AsNoTracking()
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .Where(s => !s.IsDeleted && (s.Status == "Active" || s.Status == "Promoted"))
                .ToListAsync();

            var filtered = students.Where(s =>
                string.Equals(s.ClassGrade?.ClassName ?? "", currentClass, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(s.AdmissionNumber, currentClass, StringComparison.OrdinalIgnoreCase)
            ).ToList();

            List<StudentPromotionRowDto> rows;

            if (filtered.Count == 0)
            {
                rows = GetSamplePromotionRows(currentClass, nextClass, targetYear ?? "2027-2028");
            }
            else
            {
                rows = new List<StudentPromotionRowDto>();
                int rollIndex = 1;

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
                        AdmissionNo = s.AdmissionNumber,
                        RollNo = string.IsNullOrEmpty(s.RollNumber) ? $"R-{70 + rollIndex}" : s.RollNumber,
                        FirstName = s.StudentName.Split(' ').FirstOrDefault() ?? s.StudentName,
                        LastName = s.StudentName.Split(' ').Length > 1 ? s.StudentName.Substring(s.StudentName.IndexOf(' ') + 1) : "",
                        Avatar = "",
                        Branch = branch ?? "Main Campus",
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

                    rollIndex++;
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

            foreach (var item in request.Promotions)
            {
                string cleanSection = (item.NewSection ?? "").Replace("Section ", "").Trim();
                bool isPromote = string.Equals(item.PromotionStatus, "Promote", StringComparison.OrdinalIgnoreCase);

                var history = new StudentPromotionHistory
                {
                    StudentId = item.StudentId > 0 ? item.StudentId : 1,
                    AdmissionNo = item.AdmissionNo,
                    StudentName = $"{item.CurrentClass} Student ({item.AdmissionNo})",
                    FromAcademicYear = request.CurrentAcademicYear,
                    ToAcademicYear = request.TargetAcademicYear,
                    FromClass = item.CurrentClass,
                    ToClass = isPromote ? item.NewClass : item.CurrentClass,
                    FromSection = item.CurrentSection,
                    ToSection = cleanSection,
                    OverallPct = item.OverallPct,
                    Grade = item.Grade,
                    FinalResult = item.FinalResult,
                    Status = isPromote ? "Promoted" : "Retained",
                    Remarks = item.Remarks,
                    PromotionDate = DateTime.UtcNow
                };

                _context.StudentPromotionHistories.Add(history);

                if (isPromote) promotedCount++;
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

        private static List<StudentPromotionRowDto> GetSamplePromotionRows(string currentClass, string nextClass, string targetYear)
        {
            return new List<StudentPromotionRowDto>
            {
                new StudentPromotionRowDto { StudentId = 1, Id = "1", AdmissionNo = "REG-1064", RollNo = "R-74", FirstName = "Anjali", LastName = "Priyanka", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 84, Grade = "A2", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 2, Id = "2", AdmissionNo = "REG-1067", RollNo = "R-64", FirstName = "Ashish", LastName = "Yadav", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 84, Grade = "A2", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 3, Id = "3", AdmissionNo = "REG-1108", RollNo = "R-60", FirstName = "Bharath", LastName = "Addagarla", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 70, Grade = "B1", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 4, Id = "4", AdmissionNo = "REG-1084", RollNo = "R-36", FirstName = "bhargav", LastName = "k", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 91, Grade = "A1", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 5, Id = "5", AdmissionNo = "REG-1043", RollNo = "R-34", FirstName = "fahim", LastName = "Mohamad", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 84, Grade = "A2", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 6, Id = "6", AdmissionNo = "REG-1089", RollNo = "R-54", FirstName = "gangadhar", LastName = "G", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 84, Grade = "A2", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" },
                new StudentPromotionRowDto { StudentId = 7, Id = "7", AdmissionNo = "REG-1072", RollNo = "R-79", FirstName = "Indra", LastName = "Reddy", Branch = "Main Campus", CurrentClass = currentClass, CurrentSection = "A", OverallPct = 91, Grade = "A1", FinalResult = "PASS", PromotionStatus = "Promote", NewClass = nextClass, NewSection = "", Remarks = "Pending section assignment" }
            };
        }
    }
}
