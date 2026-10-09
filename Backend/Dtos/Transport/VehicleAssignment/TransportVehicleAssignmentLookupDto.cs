namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class TransportVehicleAssignmentLookupDto
    {
        public long AssignmentId { get; set; }

        public long RouteId { get; set; }
        public string RouteName { get; set; } = string.Empty;

        public long VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;

        public long DriverId { get; set; }
        public string DriverName { get; set; } = string.Empty;
        public string DriverEmployeeId { get; set; } = string.Empty;

        public long? AttendantId { get; set; }
        public string? AttendantName { get; set; }

        public string? MorningTripTime { get; set; }
        public string? EveningTripTime { get; set; }

        public string? BranchName { get; set; }
        public string? AcademicYear { get; set; }
        public bool Status { get; set; } = true;
    }
}