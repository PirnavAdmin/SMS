using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_pickup_points")]
    public class PickupPoint
    {
        [Key]
        [Column("pickup_point_id")]
        public long PickupPointId { get; set; }

        [Required]
        [Column("route_id")]
        public long RouteId { get; set; }

        [ForeignKey(nameof(RouteId))]
        public TransportRoute? TransportRoute { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("pickup_point_name")]
        public string PickupPointName { get; set; } = string.Empty;

        [MaxLength(250)]
        [Column("landmark")]
        public string? Landmark { get; set; }

        [Column("sequence_no")]
        public int SequenceNo { get; set; }

        [Column("pickup_time")]
        public TimeSpan PickupTime { get; set; }

        [Column("distance_from_start", TypeName = "decimal(10,2)")]
        public decimal DistanceFromStart { get; set; }

        [Column("status")]
        public bool Status { get; set; } = true;

        [Column("is_deleted")]
        public bool IsDeleted { get; set; } = false;

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