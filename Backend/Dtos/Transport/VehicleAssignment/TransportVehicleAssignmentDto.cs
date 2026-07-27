using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class TransportVehicleAssignmentDto
    {
        [JsonPropertyName("assignmentId")]
        public long AssignmentId { get; set; }

        [JsonPropertyName("id")]
        public string Id => AssignmentId.ToString();

        [JsonPropertyName("routeId")]
        public long RouteId { get; set; }

        [JsonPropertyName("routeName")]
        public string RouteName { get; set; } = string.Empty;

        [JsonPropertyName("vehicleId")]
        public long VehicleId { get; set; }

        [JsonPropertyName("vehicleNumber")]
        public string VehicleNumber { get; set; } = string.Empty;

        [JsonPropertyName("vehicleName")]
        public string VehicleName { get; set; } = string.Empty;

        [JsonPropertyName("driverId")]
        public long DriverId { get; set; }

        [JsonPropertyName("driverName")]
        public string DriverName { get; set; } = string.Empty;

        [JsonPropertyName("driverMobile")]
        public string DriverMobile { get; set; } = string.Empty;

        [JsonPropertyName("assignmentDate")]
        public DateTime AssignmentDate { get; set; }

        [JsonPropertyName("effectiveFrom")]
        public DateTime EffectiveFrom { get; set; }

        [JsonPropertyName("effectiveTo")]
        public DateTime? EffectiveTo { get; set; }

        [JsonPropertyName("shift")]
        public string? Shift { get; set; }

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }

        [JsonPropertyName("status")]
        public bool Status { get; set; }

        [JsonPropertyName("statusText")]
        public string StatusText { get; set; } = string.Empty;

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}