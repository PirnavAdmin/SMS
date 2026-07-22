using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    public class Staff
    {
        [Key]
        public string EmpId { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        [Column(TypeName = "decimal(10,2)")]
        public decimal MonthlySalary { get; set; }

        public DateTime? DateOfBirth { get; set; }
        public bool BankDetailsSet { get; set; } = false;
        public int DocsUploadedCount { get; set; } = 0;
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}