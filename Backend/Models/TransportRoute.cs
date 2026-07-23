using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_routes")]
    public class TransportRoute
    {
        [Key]
        [Column("route_id")]
        public long RouteId { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("route_code")]
        public string RouteCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("route_name")]
        public string RouteName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("start_location")]
        public string StartLocation { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("end_location")]
        public string EndLocation { get; set; } = string.Empty;

        [Column("distance_km", TypeName = "decimal(10,2)")]
        public decimal DistanceKm { get; set; }

        [Column("estimated_duration_minutes")]
        public int EstimatedDurationMinutes { get; set; }

        [MaxLength(500)]
        [Column("description")]
        public string? Description { get; set; }

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