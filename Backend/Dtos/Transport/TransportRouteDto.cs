using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.Transport
{
    public class TransportRouteDto
    {
        [JsonPropertyName("id")]
        public string Id => RouteId > 0 ? RouteId.ToString() : "1";

        [JsonPropertyName("routeId")]
        public long RouteId { get; set; }

        [JsonPropertyName("routeCode")]
        public string RouteCode { get; set; } = string.Empty;

        [JsonPropertyName("routeName")]
        public string RouteName { get; set; } = string.Empty;

        [JsonPropertyName("startLocation")]
        public string StartLocation { get; set; } = string.Empty;

        [JsonPropertyName("routeStart")]
        public string RouteStart => StartLocation;

        [JsonPropertyName("endLocation")]
        public string EndLocation { get; set; } = string.Empty;

        [JsonPropertyName("routeEnd")]
        public string RouteEnd => EndLocation;

        [JsonPropertyName("distanceKm")]
        public decimal DistanceKm { get; set; }

        [JsonPropertyName("totalDistanceKm")]
        public decimal TotalDistanceKm => DistanceKm;

        [JsonPropertyName("estimatedDurationMinutes")]
        public int EstimatedDurationMinutes { get; set; }

        [JsonPropertyName("estimatedTimeMinutes")]
        public int EstimatedTimeMinutes => EstimatedDurationMinutes;

        [JsonPropertyName("estimatedDurationText")]
        public string EstimatedDurationText { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("statusText")]
        public string StatusText { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}