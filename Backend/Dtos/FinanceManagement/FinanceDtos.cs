namespace SMS.Api.Dtos.FinanceManagement;

public class FeeHeadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public decimal DefaultAmount { get; set; }
    public bool IsRefundable { get; set; }
    public bool IsTaxable { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
}

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
}

public class StudentFeeAssignmentDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public int? DynamicFeeStructureId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DueAmount { get; set; }
    public string Status { get; set; } = "Active";
    public string FeePolicy { get; set; } = string.Empty;
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
