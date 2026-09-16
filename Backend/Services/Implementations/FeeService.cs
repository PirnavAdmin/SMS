namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class FeeService : IFeeService
{
    private readonly AppDbContext _context;

    public FeeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<FeeDropdownOptionsDto> GetFeeDropdownOptionsAsync()
    {
        var years = await _context.DynamicFeeStructures.AsNoTracking()
            .Where(d => !string.IsNullOrEmpty(d.AcademicYear))
            .Select(d => d.AcademicYear)
            .Distinct()
            .ToListAsync();

        if (!years.Contains("2026-2027"))
        {
            years.Insert(0, "2026-2027");
        }

        var historyYears = new List<string> { "All Academic Years" };
        historyYears.AddRange(years);

        return new FeeDropdownOptionsDto
        {
            AcademicYears = years,
            HistoryAcademicYears = historyYears
        };
    }

    public async Task<StudentFeeDetailsResponseDto> GetStudentFeeDetailsAsync(int? studentId, string? academicYear = "2026-2027")
    {
        if (studentId == null)
        {
            return new StudentFeeDetailsResponseDto
            {
                TotalAmount = 0,
                DueAmount = 0,
                Currency = "₹",
                FeeBreakdown = new List<FeeBreakdownItemDto>()
            };
        }

        var student = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.StudentId == studentId);
        if (student == null)
        {
            return new StudentFeeDetailsResponseDto
            {
                TotalAmount = 0,
                DueAmount = 0,
                Currency = "₹",
                FeeBreakdown = new List<FeeBreakdownItemDto>()
            };
        }

        var cls = await _context.Classes.AsNoTracking().FirstOrDefaultAsync(c => c.ClassId == student.ClassId);
        string className = cls?.ClassName ?? string.Empty;

        var assignment = await _context.StudentFeeAssignments.AsNoTracking()
            .FirstOrDefaultAsync(a => a.StudentId == student.StudentId.ToString() && (a.Status == "Active" || string.IsNullOrEmpty(a.Status)));

        DynamicFeeStructure? matchedStructure = null;
        if (assignment != null && assignment.DynamicFeeStructureId.HasValue)
        {
            matchedStructure = await _context.DynamicFeeStructures.AsNoTracking().FirstOrDefaultAsync(d => d.Id == assignment.DynamicFeeStructureId.Value);
        }
        if (matchedStructure == null && !string.IsNullOrEmpty(className))
        {
            matchedStructure = await _context.DynamicFeeStructures.AsNoTracking()
                .FirstOrDefaultAsync(d => d.ClassName == className && (d.Status == "Active" || string.IsNullOrEmpty(d.Status)));
        }

        // If no structure and no assignment is configured for this student/class, dues are 0
        if (matchedStructure == null && assignment == null)
        {
            return new StudentFeeDetailsResponseDto
            {
                TotalAmount = 0,
                DueAmount = 0,
                Currency = "₹",
                FeeBreakdown = new List<FeeBreakdownItemDto>()
            };
        }

        var sidStr = student.StudentId.ToString();
        var admNo = student.AdmissionNumber ?? string.Empty;
        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.StudentId == sidStr || (!string.IsNullOrEmpty(admNo) && p.StudentId == admNo))
            .ToListAsync();

        decimal paid = payments.Sum(p => p.Amount);
        decimal total = assignment?.TotalAmount ?? matchedStructure?.TotalAmount ?? 0m;
        decimal due = Math.Max(0m, total - paid);

        var terms = await _context.FeeScheduleTerms.AsNoTracking()
            .OrderBy(t => t.Sequence)
            .ToListAsync();

        var breakdown = new List<FeeBreakdownItemDto>();
        if (terms.Any() && total > 0)
        {
            decimal sharePerTerm = Math.Round(total / terms.Count, 2);
            decimal remainingDue = due;
            foreach (var term in terms)
            {
                bool isTermDue = remainingDue > 0;
                breakdown.Add(new FeeBreakdownItemDto
                {
                    FeeId = term.Id,
                    Title = $"{term.TermName} Tuition Fee",
                    DueDate = term.DueDate,
                    Amount = sharePerTerm,
                    IsDue = isTermDue,
                    Selected = false
                });
                remainingDue = Math.Max(0m, remainingDue - sharePerTerm);
            }
        }
        else if (total > 0)
        {
            breakdown.Add(new FeeBreakdownItemDto
            {
                FeeId = "fee-base",
                Title = "Academic & School Fee",
                DueDate = "2026-04-15",
                Amount = total,
                IsDue = due > 0,
                Selected = false
            });
        }

        return new StudentFeeDetailsResponseDto
        {
            TotalAmount = total,
            DueAmount = due,
            Currency = "₹",
            FeeBreakdown = breakdown
        };
    }

    public async Task<List<PaymentReceiptDto>> GetStudentReceiptRegisterAsync(int? studentId, string? academicYear = "All Academic Years")
    {
        if (studentId == null) return new List<PaymentReceiptDto>();

        var student = await _context.Students.AsNoTracking().FirstOrDefaultAsync(s => s.StudentId == studentId);
        string sidStr = studentId.ToString()!;
        string admNo = student?.AdmissionNumber ?? string.Empty;

        var payments = await _context.FeePayments.AsNoTracking()
            .Where(p => p.StudentId == sidStr || (!string.IsNullOrEmpty(admNo) && p.StudentId == admNo))
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var receipts = payments.Select(p => new PaymentReceiptDto
        {
            ReceiptNo = p.ReceiptNo ?? $"REC-{p.Id}",
            FeeHeadTerm = "Fee Payment",
            Date = p.PaymentDate.ToString("yyyy-MM-dd"),
            Mode = p.PaymentMethod ?? "Cash",
            Amount = p.Amount,
            AcademicYear = academicYear ?? "2026-2027"
        }).ToList();

        return receipts;
    }

    public Task<bool> ProcessFeePaymentAsync(ProcessFeePaymentDto dto)
    {
        return Task.FromResult(true);
    }
}
