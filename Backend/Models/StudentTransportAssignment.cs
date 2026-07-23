using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("student_transport_assignments")]
    public class StudentTransportAssignment
    {
        [Key]
        [Column("student_transport_assignment_id")]
        public long StudentTransportAssignmentId { get; set; }

        [Column("student_id")]
        public long StudentId { get; set; }

        [Column("route_id")]
        public long RouteId { get; set; }

        [Column("pickup_point_id")]
        public long PickupPointId { get; set; }

        [Column("vehicle_assignment_id")]
        public long VehicleAssignmentId { get; set; }

        [Column("effective_from")]
        public DateTime EffectiveFrom { get; set; }

        [Column("effective_to")]
        public DateTime? EffectiveTo { get; set; }

        [MaxLength(20)]
        [Column("transport_type")]
        public string TransportType { get; set; } = "Both";

        [MaxLength(255)]
        [Column("remarks")]
        public string? Remarks { get; set; }

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

        public TransportRoute Route { get; set; } = null!;

        public PickupPoint PickupPoint { get; set; } = null!;

        public TransportVehicleAssignment VehicleAssignment { get; set; } = null!;
    }
}