namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    // Bank Account & Disbursement Information
    public string? AccountHolderName { get; set; }
    public string? AccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? BranchName { get; set; }
    public string? IfscCode { get; set; }
    public string? UpiId { get; set; }

    public bool? IsActive { get; set; } = true;

    // Navigation Properties
    public ICollection<Section> SectionsTaught { get; set; } = new List<Section>();
    public ICollection<StaffDocument> Documents { get; set; } = new List<StaffDocument>();
    public ICollection<StaffAttendance> Attendances { get; set; } = new List<StaffAttendance>();
    public ICollection<LeaveApplication> LeaveApplications { get; set; } = new List<LeaveApplication>();

    // Helper property
    [NotMapped]
    public string DisplayName => $"{FirstName ?? ""} {LastName ?? ""} ({EmployeeId ?? ""})".Trim();
}