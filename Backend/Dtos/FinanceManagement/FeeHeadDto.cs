namespace SMS.Api.Dtos.FinanceManagement;

using System.Collections.Generic;

public class FeeHeadDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Category { get; set; } = "Tuition";
    public string Frequency { get; set; } = "Quarterly";
    public decimal DefaultAmount { get; set; }
    public decimal Amount { get; set; }
    public bool Mandatory { get; set; } = true;
    public bool IsRefundable { get; set; }
    public bool IsTaxable { get; set; }
    public decimal TaxPercentage { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public string Status { get; set; } = "Active";
    public string Description { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = "All";
    public List<string> ApplicableClasses { get; set; } = new();
    public List<string> ApplicableBranches { get; set; } = new() { "All Branches" };
    public string PaymentEligibility { get; set; } = "Both One-Time and Term-Wise";
    public List<string> ApplicableTerms { get; set; } = new();

    // Module Integration References
    public List<string>? ApplicableSections { get; set; }
    public string? HostelBlockId { get; set; }
    public string? HostelBlockName { get; set; }
    public string? HostelRoomId { get; set; }
    public string? HostelRoomNo { get; set; }
    public string? HostelSharingType { get; set; }
    public string? TransportRouteId { get; set; }
    public string? TransportRouteName { get; set; }
    public string? TransportVehicleId { get; set; }
    public string? TransportVehicleNo { get; set; }
    public string? TransportStopId { get; set; }
    public string? TransportStopName { get; set; }
    public string? UniformItemId { get; set; }
    public string? UniformItemName { get; set; }
    public string? UniformSize { get; set; }
}