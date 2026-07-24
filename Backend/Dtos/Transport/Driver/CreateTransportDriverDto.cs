using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.Driver
{
    public class CreateTransportDriverDto
    {
        private string _driverName = string.Empty;
        private string _mobileNumber = string.Empty;
        private string _licenceNumber = string.Empty;

        [JsonPropertyName("driverName")]
        public string DriverName
        {
            get => !string.IsNullOrWhiteSpace(_driverName) ? _driverName : "New Driver";
            set => _driverName = value ?? string.Empty;
        }

        [JsonPropertyName("mobileNumber")]
        public string MobileNumber
        {
            get => !string.IsNullOrWhiteSpace(_mobileNumber) ? _mobileNumber : "0000000000";
            set => _mobileNumber = value ?? string.Empty;
        }

        [JsonPropertyName("alternateMobileNumber")]
        public string? AlternateMobileNumber { get; set; }

        [JsonPropertyName("licenceNumber")]
        public string LicenceNumber
        {
            get => !string.IsNullOrWhiteSpace(_licenceNumber) ? _licenceNumber : $"LIC-{Random.Shared.Next(1000, 9999)}";
            set => _licenceNumber = value ?? string.Empty;
        }

        [JsonPropertyName("licenseNumber")]
        public string? LicenseNumber
        {
            get => LicenceNumber;
            set { if (!string.IsNullOrWhiteSpace(value)) LicenceNumber = value; }
        }

        [JsonPropertyName("licenceExpiry")]
        public DateTime? LicenceExpiry { get; set; }

        [JsonPropertyName("licenseExpiryDate")]
        public string? LicenseExpiryDate
        {
            get => LicenceExpiry?.ToString("yyyy-MM-dd");
            set { if (DateTime.TryParse(value, out var d)) LicenceExpiry = d; }
        }

        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("bloodGroup")]
        public string? BloodGroup { get; set; }

        [JsonPropertyName("emergencyContactName")]
        public string? EmergencyContactName { get; set; }

        [JsonPropertyName("emergencyContactNumber")]
        public string? EmergencyContactNumber { get; set; }

        [JsonPropertyName("emergencyContact")]
        public string? EmergencyContact
        {
            get => EmergencyContactNumber ?? EmergencyContactName;
            set { if (!string.IsNullOrWhiteSpace(value)) { EmergencyContactNumber = value; EmergencyContactName = value; } }
        }

        [JsonPropertyName("experienceYears")]
        public int ExperienceYears { get; set; } = 5;

        [JsonPropertyName("status")]
        [JsonConverter(typeof(FlexibleBoolConverter))]
        public bool Status { get; set; } = true;
    }
}