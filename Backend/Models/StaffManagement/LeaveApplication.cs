namespace SMS.Api.Models.StaffManagement;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class LeaveApplication
{
    [Key]
    public int LeaveApplicationId { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [Required]
    public int LeaveTypeId { get; set; }

    [ForeignKey("LeaveTypeId")]
    public LeaveTypeConfig? LeaveType { get; set; }

    [Required]
    public DateTime FromDate { get; set; }

    [Required]
    public DateTime ToDate { get; set; }

    public bool IsHalfDay { get; set; } = false;

    public int RequestedDays { get; set; } = 1;

    [Required]
    public string Reason { get; set; } = string.Empty;

    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected", "Send Back"
    
    public string? ApproverRemarks { get; set; }
    
    public string? ApprovedBy { get; set; }
}

