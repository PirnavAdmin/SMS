using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.VehicleMaintenance
{
    public class CreateVehicleMaintenanceDto
    {
        private string? _vendorCenter;

        [JsonPropertyName("vehicleId")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public long VehicleId { get; set; } = 1;

        [JsonPropertyName("serviceType")]
        public string ServiceType { get; set; } = "General Service";

        [JsonPropertyName("serviceDate")]
        public DateTime ServiceDate { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("cost")]
        public decimal Cost { get; set; } = 0;

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