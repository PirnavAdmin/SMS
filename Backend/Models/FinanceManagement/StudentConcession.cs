using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class StudentConcession
{
    [Key]
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string AdmissionNo { get; set; } = string.Empty;
    public int ConcessionRuleId { get; set; }
    public int AcademicYearId { get; set; }
    public decimal ApprovedAmount { get; set; }
    public string Status { get; set; } = "Active"; // Active, Revoked, Expired
    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;
    public string Remarks { get; set; } = string.Empty;
}
