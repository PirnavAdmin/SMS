namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("students")]
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
    public long ClassId { get; set; } = 1;

    [Column("admission_type")]
    public string? AdmissionType { get; set; } = "Regular";

    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("created_date")]
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    [Column("modified_by")]
    public long? ModifiedBy { get; set; }

    [Column("modified_date")]
    public DateTime? ModifiedDate { get; set; }
}
