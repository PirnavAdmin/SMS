namespace SMS.Api.Dtos.Transport.VehicleMaintenance
{
    public class VehicleMaintenanceDto
    {
        public long MaintenanceId { get; set; }

        public long VehicleId { get; set; }

        public string VehicleNumber { get; set; } = string.Empty;

        public string ServiceType { get; set; } = string.Empty;

        public DateTime ServiceDate { get; set; }

        public decimal Cost { get; set; }

        public string? VendorCenter { get; set; }

        public DateTime? NextServiceDue { get; set; }

        public string? Remarks { get; set; }

        public bool Status { get; set; }
    }
}