namespace SMS.Api.Dtos.Transport.Reports
{
    public class MaintenanceReportDto
    {
        public long MaintenanceId { get; set; }

        public string VehicleNumber { get; set; } = string.Empty;

        public string ServiceType { get; set; } = string.Empty;

        public DateTime ServiceDate { get; set; }

        public decimal Cost { get; set; }

        public string? VendorCenter { get; set; }
    }
}