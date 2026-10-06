namespace SMS.Api.Dtos.FinanceManagement;

public class DynamicFeeStructureDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string FeeCategory { get; set; } = string.Empty;
    public string? FeeHeadId { get; set; }
    public string? FeeHeadName { get; set; }
    public string? HostelId { get; set; }
    public string? HostelName { get; set; }
    public List<string>? SelectedBlockIds { get; set; }
    public List<string>? SelectedBlockNames { get; set; }
    public string? EffectiveDate { get; set; }
    public string? PaymentEligibility { get; set; }
    public List<string>? ApplicableTerms { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string StudentCategory { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Active";
    public System.Collections.Generic.List<FeeStructureItemDto> Items { get; set; } = new();
}

public class StringOrIntConverter : System.Text.Json.Serialization.JsonConverter<string>
{
    public override string Read(ref System.Text.Json.Utf8JsonReader reader, System.Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
    {
        if (reader.TokenType == System.Text.Json.JsonTokenType.Number)
        {
            return reader.GetInt64().ToString();
        }
        if (reader.TokenType == System.Text.Json.JsonTokenType.String)
        {
            return reader.GetString() ?? string.Empty;
        }
        return string.Empty;
    }

    public override void Write(System.Text.Json.Utf8JsonWriter writer, string value, System.Text.Json.JsonSerializerOptions options)
    {
        writer.WriteStringValue(value ?? string.Empty);
    }
}

public class FeeStructureItemDto
{
    [System.Text.Json.Serialization.JsonConverter(typeof(StringOrIntConverter))]
    public string FeeHeadId { get; set; } = string.Empty;
    public string FeeHeadName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Term { get; set; }
    public string? ClassName { get; set; }
    public string? Frequency { get; set; }
    public string? PaymentEligibility { get; set; }
    public List<string>? ApplicableTerms { get; set; }

    // Hostel dimensions
    public string? HostelBlockId { get; set; }
    public string? HostelBlockName { get; set; }
    public string? RoomId { get; set; }
    public string? RoomName { get; set; }
    public string? RoomNo { get; set; }
    public string? RoomType { get; set; }
    public int? Capacity { get; set; }
    public string? SharingType { get; set; }

    // Transport dimensions
    public string? TransportRouteId { get; set; }
    public string? RouteName { get; set; }
    public string? PickupPointId { get; set; }
    public string? StopName { get; set; }
    public string? VehicleId { get; set; }
    public string? VehicleNumber { get; set; }

    // Uniform dimensions
    public string? UniformItemId { get; set; }
    public string? UniformItemName { get; set; }
    public string? UniformCategoryId { get; set; }
    public string? UniformCategoryName { get; set; }
    public string? UniformSizeId { get; set; }
    public string? UniformSizeName { get; set; }
    public int? Quantity { get; set; }
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
    public string? TermName { get; set; }
    public string? FeeHeadName { get; set; }
    public string? Remarks { get; set; }
    public string? PaidItemsJson { get; set; }
}
