namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("staff_letter_requests")]
public class StaffLetterRequest
{
    [Key]
    [MaxLength(100)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string RequestType { get; set; } = "relieving"; // "relieving", "experience"

    [MaxLength(50)]
    public string StaffId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string StaffEmpId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string StaffName { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Designation { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Department { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Branch { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(50)]
    public string RelievingDate { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string Comments { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"

    [Column(TypeName = "text")]
    public string RejectionReason { get; set; } = string.Empty;

    [MaxLength(100)]
    public string GeneratedLetterId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
