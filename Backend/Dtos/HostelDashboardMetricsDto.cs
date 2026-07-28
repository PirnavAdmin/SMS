namespace SMS.Api.Dtos;

public class HostelDashboardMetricsDto
{
    public int TotalHostels { get; set; }
    public int TotalRooms { get; set; }
    public int TotalBedCapacity { get; set; }
    public int OccupiedBeds { get; set; }
    public int AvailableVacantBeds { get; set; }
    public int HostellerStudents { get; set; }
    public decimal EstMonthlyRevenue { get; set; }
    public double OccupancyPercentage { get; set; }
}
