using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport
{
    public class UpdateTransportRouteDto
    {
        [Required(ErrorMessage = "Route code is required.")]
        [StringLength(30)]
        public string RouteCode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Route name is required.")]
        [StringLength(150)]
        public string RouteName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Start location is required.")]
        [StringLength(150)]
        public string StartLocation { get; set; } = string.Empty;

        [Required(ErrorMessage = "End location is required.")]
        [StringLength(150)]
        public string EndLocation { get; set; } = string.Empty;

        [Range(0, 999999)]
        public decimal DistanceKm { get; set; }

        [Range(0, 10000)]
        public int EstimatedDurationMinutes { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public bool Status { get; set; }
    }
}