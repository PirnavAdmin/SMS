using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.StudentTransportAssignment
{
    public class UpdateStudentTransportAssignmentDto
    {
        [Required]
        public long StudentId { get; set; }

        [Required]
        public long RouteId { get; set; }

        [Required]
        public long PickupPointId { get; set; }

        [Required]
        public long VehicleAssignmentId { get; set; }

        [Required]
        public DateTime EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        [Required]
        [MaxLength(20)]
        public string TransportType { get; set; } = "Both";

        [MaxLength(255)]
        public string? Remarks { get; set; }

        public bool Status { get; set; }
    }
}