using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.Transport.PickupPoint
{
    public class PickupPointDto
    {
        [JsonPropertyName("pickupPointId")]
        public long PickupPointId { get; set; }

        [JsonPropertyName("id")]
        public string Id => PickupPointId.ToString();

        [JsonPropertyName("routeId")]
        public long RouteId { get; set; }

        [JsonPropertyName("routeName")]
        public string RouteName { get; set; } = string.Empty;

        [JsonPropertyName("pickupPointName")]
        public string PickupPointName { get; set; } = string.Empty;

        [JsonPropertyName("pickupName")]
        public string PickupName => PickupPointName;

        [JsonPropertyName("landmark")]
        public string? Landmark { get; set; }

        [JsonPropertyName("sequenceNo")]
        public int SequenceNo { get; set; }

        [JsonPropertyName("sequenceNumber")]
        public int SequenceNumber => SequenceNo;

        [JsonPropertyName("pickupTime")]
        public TimeSpan PickupTime { get; set; }

        [JsonPropertyName("arrivalTime")]
        public string ArrivalTime => PickupTime.ToString(@"hh\:mm");

        [JsonPropertyName("distanceFromStart")]
        public decimal DistanceFromStart { get; set; }

        [JsonPropertyName("distanceFromSchoolKm")]
        public decimal DistanceFromSchoolKm => DistanceFromStart;

        [JsonPropertyName("status")]
        public bool Status { get; set; }

        [JsonPropertyName("statusText")]
        public string StatusText { get; set; } = string.Empty;
    }
}