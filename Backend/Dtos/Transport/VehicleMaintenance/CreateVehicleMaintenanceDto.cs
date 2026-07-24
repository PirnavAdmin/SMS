using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.VehicleMaintenance
{
    public class CreateVehicleMaintenanceDto
    {
        private long _vehicleId = 1;
        private string? _vendorCenter;

        [JsonPropertyName("vehicleId")]
        public JsonElement VehicleIdElement
        {
            set
            {
                if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var num))
                {
                    _vehicleId = num;
                }
                else if (value.ValueKind == JsonValueKind.String)
                {
                    var str = value.GetString() ?? "";
                    var cleanStr = System.Text.RegularExpressions.Regex.Replace(str, @"[^\d]", "");
                    if (long.TryParse(cleanStr, out var parsed))
                    {
                        _vehicleId = parsed;
                    }
                }
            }
        }

        public long VehicleId
        {
            get => _vehicleId;
            set => _vehicleId = value;
        }

        [JsonPropertyName("serviceType")]
        public string ServiceType { get; set; } = string.Empty;

        [JsonPropertyName("serviceDate")]
        public DateTime ServiceDate { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("cost")]
        public decimal Cost { get; set; }

        [JsonPropertyName("vendor")]
        public string? Vendor
        {
            get => _vendorCenter;
            set => _vendorCenter = value;
        }

        [JsonPropertyName("vendorCenter")]
        public string? VendorCenter
        {
            get => _vendorCenter;
            set => _vendorCenter = value;
        }

        [JsonPropertyName("nextServiceDue")]
        public DateTime? NextServiceDue { get; set; }

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }

        [JsonPropertyName("status")]
        [JsonConverter(typeof(FlexibleBoolConverter))]
        public bool Status { get; set; } = true;
    }
}