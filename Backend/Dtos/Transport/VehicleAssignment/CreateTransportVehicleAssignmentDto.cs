using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class CreateTransportVehicleAssignmentDto
    {
        private DateTime _assignmentDate = DateTime.UtcNow;
        private DateTime _effectiveFrom = DateTime.UtcNow;

        [JsonPropertyName("routeId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long RouteId { get; set; } = 1;

        [JsonPropertyName("vehicleId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long VehicleId { get; set; } = 1;

        [JsonPropertyName("driverId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long DriverId { get; set; } = 1;

        [JsonPropertyName("assignmentDate")]
        public DateTime AssignmentDate
        {
            get => _assignmentDate;
            set => _assignmentDate = value != default ? value : DateTime.UtcNow;
        }

        [JsonPropertyName("effectiveFrom")]
        public DateTime EffectiveFrom
        {
            get => _effectiveFrom;
            set => _effectiveFrom = value != default ? value : DateTime.UtcNow;
        }

        [JsonPropertyName("effectiveTo")]
        public DateTime? EffectiveTo { get; set; }

        [JsonPropertyName("shift")]
        public string? Shift { get; set; } = "Morning";

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }

        [JsonPropertyName("status")]
        [JsonConverter(typeof(FlexibleBoolConverter))]
        public bool Status { get; set; } = true;
    }
}