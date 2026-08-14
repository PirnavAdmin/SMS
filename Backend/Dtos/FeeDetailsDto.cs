namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class FeeDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
    public List<string> HistoryAcademicYears { get; set; } = new List<string> { "All Academic Years", "2026-2027", "2025-2026" };
}

public class FeeBreakdownItemDto
{
    public string FeeId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public bool IsDue { get; set; } = false;
    public bool Selected { get; set; } = false;
}

public class StudentFeeDetailsResponseDto
{
    public decimal TotalAmount { get; set; } = 57000;
    public string FormattedTotalAmount => $"₹{TotalAmount:N0}";
    public decimal DueAmount { get; set; } = 45000;
    public string FormattedDueAmount => $"₹{DueAmount:N0}";
    public string Currency { get; set; } = "₹";
    public List<FeeBreakdownItemDto> FeeBreakdown { get; set; } = new List<FeeBreakdownItemDto>();
}

public class PaymentReceiptDto
{
    public string ReceiptNo { get; set; } = string.Empty;
    public string FeeHeadTerm { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string FormattedAmount => $"₹{Amount:N0}";
    public string AcademicYear { get; set; } = "2026-2027";
}

public class ProcessFeePaymentDto
{
    public int StudentId { get; set; }
    public List<string> FeeIds { get; set; } = new List<string>();
    public decimal AmountPaid { get; set; }
    public string PaymentMode { get; set; } = "Online (Credit Card)";
}
