namespace SMS.Api.Dtos.Transport.Reports
{
    public class ReportFilterDto
    {
        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public long? RouteId { get; set; }

        public long? VehicleId { get; set; }

        public long? DriverId { get; set; }

        public string? Search { get; set; }
    }
}