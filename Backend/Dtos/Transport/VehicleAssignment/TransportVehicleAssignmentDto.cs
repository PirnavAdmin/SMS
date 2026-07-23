namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class TransportVehicleAssignmentDto
    {
        public long AssignmentId { get; set; }

        public long RouteId { get; set; }

        public string RouteName { get; set; } = string.Empty;

        public long VehicleId { get; set; }

        public string VehicleNumber { get; set; } = string.Empty;

        public string VehicleName { get; set; } = string.Empty;

        public long DriverId { get; set; }

        public string DriverName { get; set; } = string.Empty;

        public string DriverMobile { get; set; } = string.Empty;

        public DateTime AssignmentDate { get; set; }

        public DateTime EffectiveFrom { get; set; }

        public DateTime? EffectiveTo { get; set; }

        public string? Shift { get; set; }

        public string? Remarks { get; set; }

        public bool Status { get; set; }

        public string StatusText { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}