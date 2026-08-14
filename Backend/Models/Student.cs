using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using SMS.Api.Models.AcademicManagement;

namespace SMS.Api.Models;

[Table("students")]
public class Student
{
    [Key]
    [Column("student_id")]
    public int StudentId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("admission_number")]
    public string AdmissionNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    [Column("roll_number")]
    public string RollNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [Column("student_name")]
    public string StudentName { get; set; } = string.Empty;

    [Column("date_of_birth", TypeName = "date")]
    public DateTime? DateOfBirth { get; set; }

    [MaxLength(20)]
    [Column("gender")]
    public string? Gender { get; set; }

    [MaxLength(150)]
    [Column("father_name")]
    public string? FatherName { get; set; }

    [MaxLength(20)]
    [Column("father_mobile")]
    public string? FatherMobile { get; set; }

    [MaxLength(150)]
    [Column("mother_name")]
    public string? MotherName { get; set; }

    [MaxLength(20)]
    [Column("mother_mobile")]
    public string? MotherMobile { get; set; }

    [MaxLength(150)]
    [Column("email")]
    public string? Email { get; set; }

    [MaxLength(20)]
    [Column("mobile_number")]
    public string? MobileNumber { get; set; }

    [MaxLength(500)]
    [Column("address")]
    public string? Address { get; set; }

    [Column("branch_id")]
    public int BranchId { get; set; }

    [ForeignKey(nameof(BranchId))]
    public Branch Branch { get; set; } = null!;

    [Column("academic_year_id")]
    public int AcademicYearId { get; set; }

    [ForeignKey(nameof(AcademicYearId))]
    public AcademicYear AcademicYear { get; set; } = null!;

    [Column("class_id")]
    public int ClassId { get; set; }

    [ForeignKey(nameof(ClassId))]
    public ClassGrade ClassGrade { get; set; } = null!;

    [Column("section_id")]
    public int SectionId { get; set; }

    [ForeignKey(nameof(SectionId))]
    public ClassSection ClassSection { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "Active";

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StudentAttendance> AttendanceRecords { get; set; }
        = new List<StudentAttendance>();
}