namespace SMS.Api.Models.StaffManagement;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("staff_documents")]
public class StaffDocument
{
    [Key]
    public int StaffDocumentId { get; set; }

    [Required]
    public int StaffId { get; set; }

    [ForeignKey("StaffId")]
    public Staff? Staff { get; set; }

    [Required]
    public string DocumentType { get; set; } = string.Empty; // e.g. "Aadhaar Card", "PAN Card", "Degree Certificate", "B.Ed."

    public string? FileUrl { get; set; }

    public bool IsRequired { get; set; } = true;

    public string Status { get; set; } = "Missing"; // "Missing", "Attached", "Verified"

    public DateTime? UploadedAt { get; set; }
}

