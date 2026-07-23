using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.PickupPoint
{
    public class UpdatePickupPointDto
    {
        [Required]
        public long RouteId { get; set; }

        [Required]
        [StringLength(150)]
        public string PickupPointName { get; set; } = string.Empty;

        [StringLength(250)]
        public string? Landmark { get; set; }

        [Range(1, 1000)]
        public int SequenceNo { get; set; }

        public TimeSpan PickupTime { get; set; }

        [Range(0, 999999)]
        public decimal DistanceFromStart { get; set; }

        public bool Status { get; set; }
    }
}