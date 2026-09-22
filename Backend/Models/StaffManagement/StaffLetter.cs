namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("staff_letters")]
public class StaffLetter
{
    [Key]
    [MaxLength(100)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LetterNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LetterType { get; set; } = "offer"; // "offer", "relieving", "experience"

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

    [MaxLength(50)]
    public string IssueDate { get; set; } = string.Empty;

    [MaxLength(150)]
    public string GeneratedBy { get; set; } = "Institutional HR Administration";

    [MaxLength(50)]
    public string Status { get; set; } = "Issued"; // "Issued", "Draft"

    [Column(TypeName = "longtext")]
    public string PayloadJson { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
