namespace SMS.Api.Dtos.Transport
{
    public class TransportRouteDto
    {
        public long RouteId { get; set; }

        public string RouteCode { get; set; } = string.Empty;

        public string RouteName { get; set; } = string.Empty;

        public string StartLocation { get; set; } = string.Empty;

        public string EndLocation { get; set; } = string.Empty;

        public decimal DistanceKm { get; set; }

        public int EstimatedDurationMinutes { get; set; }

        public string EstimatedDurationText { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool Status { get; set; }

        public string StatusText { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}