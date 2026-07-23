using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_vehicles")]
    public class TransportVehicle
    {
        [Key]
        [Column("vehicle_id")]
        public long VehicleId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("vehicle_number")]
        public string VehicleNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("registration_number")]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("vehicle_name")]
        public string VehicleName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("vehicle_type")]
        public string VehicleType { get; set; } = string.Empty;

        [Column("capacity")]
        public int Capacity { get; set; }

        [MaxLength(100)]
        [Column("manufacturer")]
        public string? Manufacturer { get; set; }

        [MaxLength(100)]
        [Column("model")]
        public string? Model { get; set; }

        [MaxLength(100)]
        [Column("insurance_number")]
        public string? InsuranceNumber { get; set; }

        [Column("insurance_expiry")]
        public DateTime? InsuranceExpiry { get; set; }

        [Column("pollution_expiry")]
        public DateTime? PollutionExpiry { get; set; }

        [Column("fitness_expiry")]
        public DateTime? FitnessExpiry { get; set; }

        [Column("status")]
        public bool Status { get; set; } = true;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; }

        [Column("created_by")]
        public long? CreatedBy { get; set; }

        [Column("updated_by")]
        public long? UpdatedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}