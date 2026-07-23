namespace SMS.Api.Dtos.Transport.Driver
{
    public class TransportDriverDto
    {
        public long DriverId { get; set; }

        public string DriverName { get; set; } = string.Empty;

        public string MobileNumber { get; set; } = string.Empty;

        public string? AlternateMobileNumber { get; set; }

        public string LicenceNumber { get; set; } = string.Empty;

        public DateTime? LicenceExpiry { get; set; }

        public string? Address { get; set; }

        public string? BloodGroup { get; set; }

        public string? EmergencyContactName { get; set; }

        public string? EmergencyContactNumber { get; set; }

        public bool Status { get; set; }

        public string StatusText { get; set; } = string.Empty;

        public bool IsLicenceExpired { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}