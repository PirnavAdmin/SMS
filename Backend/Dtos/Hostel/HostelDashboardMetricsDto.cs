using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

        [JsonPropertyName("totalCapacity")]
        public int TotalCapacity => TotalBedCapacity;

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

        [JsonPropertyName("hostellers")]
        public int Hostellers => HostellerStudents;

        [JsonPropertyName("estMonthlyRevenue")]
        public decimal EstMonthlyRevenue { get; set; }

        [JsonPropertyName("monthlyRevenue")]
        public decimal MonthlyRevenue => EstMonthlyRevenue;

        [JsonPropertyName("activeWardens")]
        public int ActiveWardens { get; set; } = 3;

        [JsonPropertyName("occupancyPercentage")]
        public double OccupancyPercentage { get; set; }

        [JsonPropertyName("occupancyRate")]
        public string OccupancyRate => $"{OccupancyPercentage}%";
    }

    public class HostelRecentAllocationDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("bedNumber")]
        public string BedNumber { get; set; } = string.Empty;

        [JsonPropertyName("joinedDate")]
        public DateTime JoinedDate { get; set; }
    }

    public class HostelOutpassDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("outpassId")]
        public int OutpassId => Id;

        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student")]
        public string Student => StudentName;

        [JsonPropertyName("admissionNo")]
        public string? AdmissionNo { get; set; }

        [JsonPropertyName("admNo")]
        public string? AdmNo => AdmissionNo;

        [JsonPropertyName("hostelName")]
        public string? HostelName { get; set; }

        [JsonPropertyName("roomNumber")]
        public string? RoomNumber { get; set; }

        [JsonPropertyName("hostelAndRoom")]
        public string HostelAndRoom => (!string.IsNullOrWhiteSpace(HostelName) || !string.IsNullOrWhiteSpace(RoomNumber))
            ? $"{HostelName ?? "Hostel"} - Room #{RoomNumber ?? "N/A"}"
            : "N/A";

        [JsonPropertyName("requestType")]
        public string RequestType { get; set; } = "Local Outpass";

        [JsonPropertyName("outpassType")]
        public string OutpassType => RequestType;

        [JsonPropertyName("outpassCategory")]
        public string OutpassCategory => RequestType;

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("outDate")]
        public DateTime OutDate { get; set; }

        [JsonPropertyName("departure")]
        public DateTime Departure => OutDate;

        [JsonPropertyName("expectedReturnDate")]
        public DateTime ExpectedReturnDate { get; set; }

        [JsonPropertyName("expectedReturn")]
        public DateTime ExpectedReturn => ExpectedReturnDate;

        [JsonPropertyName("actualReturnDate")]
        public DateTime? ActualReturnDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pending Approval";

        [JsonPropertyName("approvedBy")]
        public string? ApprovedBy { get; set; }

        [JsonPropertyName("remarks")]
        public string? Remarks { get; set; }

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateHostelOutpassDto
    {
        [JsonPropertyName("studentId")]
        public int StudentId { get; set; }

        [JsonPropertyName("selectStudent")]
        public string? SelectStudentAlias
        {
            get => StudentId.ToString();
            set
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (int.TryParse(value, out int val)) StudentId = val;
                    else StudentName = value;
                }
            }
        }

        [JsonPropertyName("studentName")]
        public string? StudentName { get; set; }

        [JsonPropertyName("requestType")]
        public string RequestType { get; set; } = "Local Outpass (Same Day)";

        [JsonPropertyName("outpassCategory")]
        public string? OutpassCategoryAlias
        {
            get => RequestType;
            set { if (!string.IsNullOrWhiteSpace(value)) RequestType = value; }
        }

        [JsonPropertyName("outpassType")]
        public string? OutpassTypeAlias
        {
            get => RequestType;
            set { if (!string.IsNullOrWhiteSpace(value)) RequestType = value; }
        }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }

        [JsonPropertyName("outDate")]
        public DateTime OutDate { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("departureDateAndTime")]
        public DateTime? DepartureDateAndTimeAlias
        {
            get => OutDate;
            set { if (value.HasValue) OutDate = value.Value; }
        }

        [JsonPropertyName("departureDate")]
        public DateTime? DepartureDateAlias
        {
            get => OutDate;
            set { if (value.HasValue) OutDate = value.Value; }
        }

        [JsonPropertyName("expectedReturnDate")]
        public DateTime ExpectedReturnDate { get; set; } = DateTime.UtcNow.AddDays(1);

        [JsonPropertyName("expectedReturn")]
        public DateTime? ExpectedReturnAlias
        {
            get => ExpectedReturnDate;
            set { if (value.HasValue) ExpectedReturnDate = value.Value; }
        }
    }

    public class HostelDashboardResponseDto
    {
        [JsonPropertyName("metrics")]
        public HostelDashboardMetricsDto Metrics { get; set; } = new();

        [JsonPropertyName("blocks")]
        public List<HostelBlockDto> Blocks { get; set; } = new();

        [JsonPropertyName("overview")]
        public List<HostelBlockDto> Overview => Blocks;

        [JsonPropertyName("recentBedAllocations")]
        public List<HostelRecentAllocationDto> RecentBedAllocations { get; set; } = new();

        [JsonPropertyName("recentAllocations")]
        public List<HostelRecentAllocationDto> RecentAllocations => RecentBedAllocations;

        [JsonPropertyName("activeOutpassLeaveRequests")]
        public List<HostelOutpassDto> ActiveOutpassLeaveRequests { get; set; } = new();

        [JsonPropertyName("activeOutpasses")]
        public List<HostelOutpassDto> ActiveOutpasses => ActiveOutpassLeaveRequests;
    }
}
