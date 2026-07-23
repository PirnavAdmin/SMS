using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.Driver
{
    public class UpdateTransportDriverDto
    {
        [Required]
        [MaxLength(100)]
        public string DriverName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string MobileNumber { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? AlternateMobileNumber { get; set; }

        [Required]
        [MaxLength(50)]
        public string LicenceNumber { get; set; } = string.Empty;

        public DateTime? LicenceExpiry { get; set; }

        [MaxLength(255)]
        public string? Address { get; set; }

        [MaxLength(20)]
        public string? BloodGroup { get; set; }

        [MaxLength(100)]
        public string? EmergencyContactName { get; set; }

        [MaxLength(20)]
        public string? EmergencyContactNumber { get; set; }

        public bool Status { get; set; }
    }
}