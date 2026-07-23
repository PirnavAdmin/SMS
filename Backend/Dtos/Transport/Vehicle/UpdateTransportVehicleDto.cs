using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.Vehicle
{
    public class UpdateTransportVehicleDto
    {
        [Required]
        [StringLength(50)]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string VehicleName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string VehicleType { get; set; } = string.Empty;

        [Range(1, 500)]
        public int Capacity { get; set; }

        [StringLength(100)]
        public string? Manufacturer { get; set; }

        [StringLength(100)]
        public string? Model { get; set; }

        [StringLength(100)]
        public string? InsuranceNumber { get; set; }

        public DateTime? InsuranceExpiry { get; set; }

        public DateTime? PollutionExpiry { get; set; }

        public DateTime? FitnessExpiry { get; set; }

        public bool Status { get; set; }
    }
}
