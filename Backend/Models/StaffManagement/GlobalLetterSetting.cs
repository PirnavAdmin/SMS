namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("global_letter_settings")]
public class GlobalLetterSetting
{
    [Key]
    public int Id { get; set; } = 1;

    [MaxLength(200)]
    public string SignatoryName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string SignatoryTitle { get; set; } = string.Empty;

    public int ProbationMonths { get; set; } = 6;

    public int NoticePeriodDays { get; set; } = 30;

    [Column(TypeName = "longtext")]
    public string? SignatureImageUrl { get; set; }

    [Column(TypeName = "longtext")]
    public string? SealImageUrl { get; set; }

    [Column(TypeName = "longtext")]
    public string? MasterTermsJson { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
