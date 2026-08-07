using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models;

[Table("admissions")]
public class Admission
{
    [Key]
    [Column("admission_id")]
    public long AdmissionId { get; set; }

    [Column("application_no")]
    public string ApplicationNo { get; set; } = string.Empty;

    [Column("student_name")]
    public string StudentName { get; set; } = string.Empty;

    [Column("dob")]
    public DateTime? Dob { get; set; }

    [Column("gender")]
    public string? Gender { get; set; }

    [Column("father_name")]
    public string? FatherName { get; set; }

    [Column("father_mobile")]
    public string? FatherMobile { get; set; }

    [Column("blood_group")]
    public string? BloodGroup { get; set; }

    [Column("caste")]
    public string? Caste { get; set; }

    [Column("branch_id")]
    public long BranchId { get; set; } = 1;

    [Column("class_id")]
    public int? ClassId { get; set; }

    [Column("section_letter")]
    public string? SectionLetter { get; set; }

    [Column("roll_no")]
    public string? RollNo { get; set; }

    [Column("admission_type")]
    public string? AdmissionType { get; set; } = "Regular";

    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("created_date")]
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    [Column("modified_by")]
    public long? ModifiedBy { get; set; }

    [Column("modified_date")]
    public DateTime? ModifiedDate { get; set; }
}