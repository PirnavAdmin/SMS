using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HostelDashboardMetricsDto
    {
        [JsonPropertyName("totalHostels")]
        public int TotalHostels { get; set; }

        [JsonPropertyName("totalRooms")]
        public int TotalRooms { get; set; }

        [JsonPropertyName("totalBedCapacity")]
        public int TotalBedCapacity { get; set; }

        [JsonPropertyName("occupiedBeds")]
        public int OccupiedBeds { get; set; }

        [JsonPropertyName("availableVacantBeds")]
        public int AvailableVacantBeds { get; set; }

        [JsonPropertyName("vacantBeds")]
        public int VacantBeds => AvailableVacantBeds;

        [JsonPropertyName("hostellerStudents")]
        public int HostellerStudents { get; set; }

        [JsonPropertyName("enrolledHostellers")]
        public int EnrolledHostellers => HostellerStudents;

        [JsonPropertyName("estMonthlyRevenue")]
        public decimal EstMonthlyRevenue { get; set; }

        [JsonPropertyName("monthlyRevenue")]
        public decimal MonthlyRevenue => EstMonthlyRevenue;

        [JsonPropertyName("occupancyPercentage")]
        public double OccupancyPercentage { get; set; }

        [JsonPropertyName("occupancyRate")]
        public string OccupancyRate => $"{OccupancyPercentage}%";
    }

    public class HostelDashboardResponseDto
    {
        [JsonPropertyName("metrics")]
        public HostelDashboardMetricsDto Metrics { get; set; } = new();

        [JsonPropertyName("blocks")]
        public List<HostelBlockDto> Blocks { get; set; } = new();

        [JsonPropertyName("overview")]
        public List<HostelBlockDto> Overview => Blocks;
    }
}
