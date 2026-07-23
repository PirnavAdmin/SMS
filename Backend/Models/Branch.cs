using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("branches")]
    public class Branch
    {
        [Key]
        [Column("branch_id")]
        public long BranchId { get; set; }

        [Required]
        [StringLength(100)]
        [Column("branch_name")]
        public string BranchName { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        [Column("address")]
        public string Address { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [Column("city")]
        public string City { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [Column("state")]
        public string State { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        [Column("pincode")]
        public string Pincode { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        [Column("contact_number")]
        public string ContactNumber { get; set; } = string.Empty;

        [StringLength(150)]
        [Column("email")]
        public string? Email { get; set; }

        [Required]
        [Column("status")]
        public bool Status { get; set; } = true;

        [Required]
        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;

        [Required]
        [Column("created_by")]
        public long CreatedBy { get; set; }

        [Required]
        [Column("created_date")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [Column("modified_by")]
        public long? ModifiedBy { get; set; }

        [Column("modified_date")]
        public DateTime? ModifiedDate { get; set; }
    }
}