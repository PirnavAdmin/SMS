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

    public ICollection<Student> Students { get; set; }
        = new List<Student>();
}