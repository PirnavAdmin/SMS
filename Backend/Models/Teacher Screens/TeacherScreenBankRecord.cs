namespace SMS.Api.Models.TeacherScreens;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("teacher_screen_bank_records")]
public class TeacherScreenBankRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required]
    [MaxLength(150)]
    public string AccountHolderName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string BankName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Branch { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string AccountNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string IfscCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? UpiId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
