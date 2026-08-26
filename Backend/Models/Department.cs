namespace SMS.Api.Models;

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Department
{
    [Key]
    public int DepartmentId { get; set; }

    [Required]
    [MaxLength(150)]
    public string DepartmentName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? DepartmentCode { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    [MaxLength(150)]
    public string? HeadOfDepartment { get; set; }

    [MaxLength(50)]
    public string? Category { get; set; } = "Teaching";

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}
