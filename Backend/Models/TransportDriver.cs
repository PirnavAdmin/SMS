using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_drivers")]
    public class TransportDriver
    {
        [Key]
        [Column("driver_id")]
        public long DriverId { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("driver_name")]
        public string DriverName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("mobile_number")]
        public string MobileNumber { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("alternate_mobile_number")]
        public string? AlternateMobileNumber { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("licence_number")]
        public string LicenceNumber { get; set; } = string.Empty;

        [Column("licence_expiry")]
        public DateTime? LicenceExpiry { get; set; }

        [MaxLength(100)]
        [Column("address")]
        public string? Address { get; set; }

        [MaxLength(20)]
        [Column("blood_group")]
        public string? BloodGroup { get; set; }

        [MaxLength(100)]
        [Column("emergency_contact_name")]
        public string? EmergencyContactName { get; set; }

        [MaxLength(20)]
        [Column("emergency_contact_number")]
        public string? EmergencyContactNumber { get; set; }

        [Column("status")]
        public bool Status { get; set; } = true;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; }

        [Column("created_by")]
        public long? CreatedBy { get; set; }

        [Column("updated_by")]
        public long? UpdatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}