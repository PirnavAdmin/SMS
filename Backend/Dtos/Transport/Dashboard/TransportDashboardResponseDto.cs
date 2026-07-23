namespace SMS.Api.Dtos.Transport.Dashboard
{
    public class TransportDashboardResponseDto
    {
        public TransportDashboardDto Summary { get; set; } = new();

        public IEnumerable<RouteStudentSummaryDto> RouteStudents { get; set; }
            = new List<RouteStudentSummaryDto>();

        public IEnumerable<VehicleOccupancyDto> VehicleOccupancy { get; set; }
            = new List<VehicleOccupancyDto>();

        public IEnumerable<MaintenanceDueDto> MaintenanceDue { get; set; }
            = new List<MaintenanceDueDto>();
    }
}