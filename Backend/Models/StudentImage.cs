using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

[Table("student_images")]
public class StudentImage
{
    [Key]
    [Column("file_id")]
    public int FileId { get; set; }

    [Column("student_id")]
    [Required]
    public int StudentId { get; set; }

    [ForeignKey("StudentId")]
    public Student? Student { get; set; }

    [Column("file_name")]
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Column("stored_file_name")]
    [Required]
    [MaxLength(255)]
    public string StoredFileName { get; set; } = string.Empty;

    [Column("content_type")]
    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    [Column("file_path")]
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [Column("file_size")]
    public long FileSize { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
