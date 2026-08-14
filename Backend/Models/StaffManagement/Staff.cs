namespace SMS.Api.Models.StaffManagement;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SMS.Api.Models.AcademicManagement;

[Table("staff")]
public class Staff
{
    [Key]
    public int StaffId { get; set; }

    public string? EmployeeId { get; set; } // e.g. "EMP007"

    public string? EmployeeCategory { get; set; } // "Teaching Staff", "Non-Teaching Staff"

    public string? FirstName { get; set; }

    public string? LastName { get; set; }

    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public string? Gender { get; set; } // "Male", "Female", "Other"

    public DateTime? DateOfBirth { get; set; }

    public string? ResidentialAddress { get; set; }

    public string? Designation { get; set; } // e.g. "Head of Department (Mathematics)", "Principal"

    public string? Department { get; set; } // e.g. "Mathematics", "Administration"

    public string? SystemRole { get; set; } // "Teacher", "Principal", etc.

    public DateTime? JoiningDate { get; set; }

    public string? Qualification { get; set; } // e.g. "M.Sc. Mathematics, B.Ed."

    public string? PrimarySubject { get; set; } // e.g. "Mathematics"

    public string? Specialization { get; set; } // e.g. "Algebra & Calculus"

    public decimal? MonthlySalary { get; set; }
    public decimal? GrossSalary { get; set; }
    public decimal? NetSalary { get; set; }
    public int? SalaryStructureId { get; set; }
    public string? SalaryStructureName { get; set; }
    public DateTime? SalaryStructureEffectiveDate { get; set; }

    // Bank Account & Disbursement Information
    public string? AccountHolderName { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? IfscCode { get; set; }
    public string? UpiId { get; set; }

    public bool? IsActive { get; set; } = true;
    public int CasualLeaveBalance { get; set; } = 10;
    public int SickLeaveBalance { get; set; } = 10;
    public int EarnedLeaveBalance { get; set; } = 15;

    // Additional details from the 5-step registration form
    public string? MiddleName { get; set; }
    public string? AlternateMobile { get; set; }
    public string? AadhaarNumber { get; set; }
    public string? PanNumber { get; set; }
    public string? PresentAddress { get; set; }
    public string? PermanentAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PinCode { get; set; }
    public string? EmploymentType { get; set; }
    public string? ReportingManager { get; set; }
    public string? AcademicYear { get; set; }
    public bool? IsClassTeacherEligible { get; set; } = false;
    public string? BloodGroup { get; set; }
    public string? ProfilePhoto { get; set; }

    // Navigation Properties
    public ICollection<Section> SectionsTaught { get; set; } = new List<Section>();
    public ICollection<StaffDocument> Documents { get; set; } = new List<StaffDocument>();
    public ICollection<StaffAttendance> Attendances { get; set; } = new List<StaffAttendance>();
    public ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();
    public ICollection<StaffQualification> Qualifications { get; set; } = new List<StaffQualification>();
    public ICollection<StaffExperience> ExperienceRecords { get; set; } = new List<StaffExperience>();

    // Helper property
    [NotMapped]
    public string DisplayName => $"{FirstName ?? ""} {LastName ?? ""} ({EmployeeId ?? ""})".Trim();
}

