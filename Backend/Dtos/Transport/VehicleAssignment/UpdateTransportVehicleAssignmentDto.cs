using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class UpdateTransportVehicleAssignmentDto
    {
        private DateTime _assignmentDate = DateTime.UtcNow;
        private DateTime _effectiveFrom = DateTime.UtcNow;

        private string? _selectRoute;
        private string? _selectActiveVehicle;
        private string? _selectLicensedDriver;
        private string? _selectBusAttendant;

        [JsonPropertyName("routeId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long RouteId { get; set; } = 1;

        [JsonPropertyName("routeName")]
        public string? RouteName
        {
            get => _selectRoute;
            set => _selectRoute = value;
        }

        [JsonPropertyName("selectRoute")]
        public string? SelectRoute
        {
            get => !string.IsNullOrWhiteSpace(_selectRoute) ? _selectRoute : RouteId.ToString();
            set
            {
                _selectRoute = value;
                if (!string.IsNullOrWhiteSpace(value) && long.TryParse(value, out var id)) RouteId = id;
            }
        }

        [JsonPropertyName("vehicleId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long VehicleId { get; set; } = 1;

        [JsonPropertyName("vehicleNumber")]
        public string? VehicleNumber
        {
            get => _selectActiveVehicle;
            set => _selectActiveVehicle = value;
        }

        [JsonPropertyName("selectActiveVehicle")]
        public string? SelectActiveVehicle
        {
            get => !string.IsNullOrWhiteSpace(_selectActiveVehicle) ? _selectActiveVehicle : VehicleId.ToString();
            set
            {
                _selectActiveVehicle = value;
                if (!string.IsNullOrWhiteSpace(value) && long.TryParse(value, out var id)) VehicleId = id;
            }
        }

        [JsonPropertyName("driverId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long DriverId { get; set; } = 1;

        [JsonPropertyName("driverName")]
        public string? DriverName
        {
            get => _selectLicensedDriver;
            set => _selectLicensedDriver = value;
        }

        [JsonPropertyName("selectLicensedDriver")]
        public string? SelectLicensedDriver
        {
            get => !string.IsNullOrWhiteSpace(_selectLicensedDriver) ? _selectLicensedDriver : DriverId.ToString();
            set
            {
                _selectLicensedDriver = value;
                if (!string.IsNullOrWhiteSpace(value) && long.TryParse(value, out var id)) DriverId = id;
            }
        }

        [JsonPropertyName("attendantId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long? AttendantId { get; set; }

        [JsonPropertyName("attendantName")]
        public string? AttendantName
        {
            get => _selectBusAttendant;
            set => _selectBusAttendant = value;
        }

        [JsonPropertyName("busAttendant")]
        public string? BusAttendant
        {
            get => _selectBusAttendant;
            set => _selectBusAttendant = value;
        }

        [JsonPropertyName("selectBusAttendant")]
        public string? SelectBusAttendant
        {
            get => !string.IsNullOrWhiteSpace(_selectBusAttendant) ? _selectBusAttendant : AttendantId?.ToString();
            set
            {
                _selectBusAttendant = value;
                if (!string.IsNullOrWhiteSpace(value) && long.TryParse(value, out var id))
                {
                    if (!AttendantId.HasValue || AttendantId.Value <= 0)
                        AttendantId = id;
                }
            }
        }

        [JsonPropertyName("branchName")]
        public string? BranchName { get; set; }

        [JsonPropertyName("branch")]
        public string? Branch
        {
            get => BranchName;
            set { if (!string.IsNullOrWhiteSpace(value)) BranchName = value; }
        }

        [JsonPropertyName("academicYear")]
        public string? AcademicYear { get; set; }

        [JsonPropertyName("morningTripTime")]
        public string? MorningTripTime { get; set; }

        [JsonPropertyName("morningTrip")]
        public string? MorningTrip
        {
            get => MorningTripTime;
            set { if (!string.IsNullOrWhiteSpace(value)) MorningTripTime = value; }
        }

        [JsonPropertyName("eveningTripTime")]
        public string? EveningTripTime { get; set; }

        [JsonPropertyName("eveningTrip")]
        public string? EveningTrip
        {
            get => EveningTripTime;
            set { if (!string.IsNullOrWhiteSpace(value)) EveningTripTime = value; }
        }

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

        [JsonPropertyName("effectiveFromDate")]
        public string? EffectiveFromDate
        {
            get => EffectiveFrom.ToString("yyyy-MM-dd");
            set { if (DateTime.TryParse(value, out var d)) EffectiveFrom = d; }
        }

        [JsonPropertyName("effectiveTo")]
        [JsonConverter(typeof(FlexibleNullableDateTimeConverter))]
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