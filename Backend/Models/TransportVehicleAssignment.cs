using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_vehicle_assignments")]
    public class TransportVehicleAssignment
    {
        [Key]
        [Column("assignment_id")]
        public long AssignmentId { get; set; }

        [Column("route_id")]
        public long RouteId { get; set; }

        [Column("vehicle_id")]
        public long VehicleId { get; set; }

        [Column("driver_id")]
        public long DriverId { get; set; }

        [Column("assignment_date")]
        public DateTime AssignmentDate { get; set; }

        [Column("effective_from")]
        public DateTime EffectiveFrom { get; set; }

        [Column("effective_to")]
        public DateTime? EffectiveTo { get; set; }

        [MaxLength(20)]
        [Column("shift")]
        public string? Shift { get; set; }

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

        public TransportVehicle Vehicle { get; set; } = null!;

        public TransportDriver Driver { get; set; } = null!;
    }
}