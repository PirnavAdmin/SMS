using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models;

public class Branch
{
    [Key]
    public int BranchId { get; set; }

    [Required]
    [MaxLength(150)]
    public string BranchName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string BranchCode { get; set; } = string.Empty;

    public string? Address { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}