namespace SMS.Api.Dtos.FinanceManagement;

public class DynamicFeeStructureDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string StudentCategory { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Active";
    public System.Collections.Generic.List<FeeStructureItemDto> Items { get; set; } = new();
}

public class FeeStructureItemDto
{
    public int FeeHeadId { get; set; }
    public string FeeHeadName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class StudentFeeAssignmentDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public int? DynamicFeeStructureId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public string Status { get; set; } = "Active";
    public string FeePolicy { get; set; } = "Full Annual Fee";
    public string? AdjustmentReason { get; set; }
    public string? AssignedDate { get; set; }
}

public class BulkFeeAssignmentRequestDto
{
    public List<string> StudentIds { get; set; } = new();
    public int? DynamicFeeStructureId { get; set; }
    public string? ClassName { get; set; }
    public string? FeePolicy { get; set; } = "Full Annual Fee";
    public decimal? TotalAmount { get; set; }
}

public class CustomFeeAssignmentRequestDto
{
    public string StudentId { get; set; } = string.Empty;
    public int? DynamicFeeStructureId { get; set; }
    public string FeePolicy { get; set; } = "Monthly Pro-rated Fee";
    public string? AdmissionDate { get; set; }
    public string? AdjustmentReason { get; set; }
    public decimal TotalAmount { get; set; }
    public List<FeeHeadAssignmentItemDto>? Breakdown { get; set; }
}

public class FeeHeadAssignmentItemDto
{
    public string FeeHeadId { get; set; } = string.Empty;
    public string FeeHeadName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal OriginalAmount { get; set; }
    public decimal AssignedAmount { get; set; }
    public decimal AdjustmentAmount { get; set; }
}

public class FeePaymentDto
{
    public int Id { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FineAmount { get; set; }
    public decimal TransportFee { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public System.DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = "Completed";
}
