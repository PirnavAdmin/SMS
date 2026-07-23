namespace SMS.Api.Dtos.Transport.Dashboard
{
    public class TransportDashboardDto
    {
        public int TotalVehicles { get; set; }

        public int ActiveVehicles { get; set; }

        public int InactiveVehicles { get; set; }

        public int TotalRoutes { get; set; }

        public int ActiveRoutes { get; set; }

        public int TotalDrivers { get; set; }

        public int ActiveDrivers { get; set; }

        public int TotalPickupPoints { get; set; }

        public int StudentsUsingTransport { get; set; }

        public int TotalVehicleCapacity { get; set; }

        public decimal SeatOccupancyPercentage { get; set; }

        public int MaintenanceDueSoon { get; set; }

        public decimal CurrentMonthMaintenanceCost { get; set; }
    }
}