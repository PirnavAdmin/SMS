namespace SMS.Api.Services.Implementations;

using SMS.Api.Data;
using SMS.Api.Dtos;
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

    public Task<FeeDropdownOptionsDto> GetFeeDropdownOptionsAsync()
    {
        var options = new FeeDropdownOptionsDto
        {
            AcademicYears = new List<string> { "2027-28", "2026-27", "2025-26" },
            HistoryAcademicYears = new List<string> { "All Academic Years", "2026-2027", "2025-2026" }
        };

        return Task.FromResult(options);
    }

    public Task<StudentFeeDetailsResponseDto> GetStudentFeeDetailsAsync(int? studentId, string? academicYear = "2027-28")
    {
        var breakdown = new List<FeeBreakdownItemDto>
        {
            new FeeBreakdownItemDto
            {
                FeeId = "fee-trans-q3",
                Title = "Transport Fee (Q3)",
                DueDate = "2026-10-15",
                Amount = 12000,
                Selected = false
            }
        };

        decimal totalAmount = breakdown.Sum(b => b.Amount);

        var result = new StudentFeeDetailsResponseDto
        {
            TotalAmount = totalAmount,
            Currency = "₹",
            FeeBreakdown = breakdown
        };

        return Task.FromResult(result);
    }

    public Task<List<PaymentReceiptDto>> GetStudentReceiptRegisterAsync(int? studentId, string? academicYear = "All Academic Years")
    {
        var receipts = new List<PaymentReceiptDto>
        {
            new PaymentReceiptDto
            {
                ReceiptNo = "REC-2026-781",
                FeeHeadTerm = "Term 2 Tuition Fee",
                Date = "2026-08-04",
                Mode = "Online (Credit Card)",
                Amount = 45000,
                AcademicYear = "2026-2027"
            },
            new PaymentReceiptDto
            {
                ReceiptNo = "REC-2026-001",
                FeeHeadTerm = "Term 1 Tuition Fee",
                Date = "2026-06-10",
                Mode = "Online",
                Amount = 45000,
                AcademicYear = "2026-2027"
            },
            new PaymentReceiptDto
            {
                ReceiptNo = "REC-2026-042",
                FeeHeadTerm = "Transport Fee (Q1 & Q2)",
                Date = "2026-06-15",
                Mode = "Online",
                Amount = 12000,
                AcademicYear = "2026-2027"
            }
        };

        if (!string.IsNullOrWhiteSpace(academicYear) && !academicYear.Equals("All Academic Years", StringComparison.OrdinalIgnoreCase))
        {
            receipts = receipts.Where(r => r.AcademicYear.Equals(academicYear, StringComparison.OrdinalIgnoreCase) || r.AcademicYear.Contains(academicYear)).ToList();
        }

        return Task.FromResult(receipts);
    }

    public Task<bool> ProcessFeePaymentAsync(ProcessFeePaymentDto dto)
    {
        // Mock fee payment logic
        return Task.FromResult(true);
    }
}
