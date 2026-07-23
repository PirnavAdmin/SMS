using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class CreateTransportVehicleAssignmentDto
    {
        [Required]
        public long RouteId { get; set; }

        [Required]
        public long VehicleId { get; set; }

        [Required]
        public long DriverId { get; set; }

        [Required]
        public DateTime AssignmentDate { get; set; }

        [Required]
        public DateTime EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        [MaxLength(20)]
        public string? Shift { get; set; }

        [MaxLength(255)]
        public string? Remarks { get; set; }

        public bool Status { get; set; } = true;
    }
}