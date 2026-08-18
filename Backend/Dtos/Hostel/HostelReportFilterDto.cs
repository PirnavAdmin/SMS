using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class HostelReportFilterDto
    {
        [JsonPropertyName("reportType")]
        public string? ReportType { get; set; }

        [JsonPropertyName("hostelId")]
        public int? HostelId { get; set; }

        [JsonPropertyName("floorLevel")]
        public string? FloorLevel { get; set; }

        [JsonPropertyName("roomId")]
        public int? RoomId { get; set; }

        [JsonPropertyName("academicYear")]
        public string? AcademicYear { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("search")]
        public string? Search { get; set; }
    }

    public class HostelReportItemDto
    {
        [JsonPropertyName("allocationId")]
        public int AllocationId { get; set; }

        [JsonPropertyName("id")]
        public int Id => AllocationId;

        // Hostel / Block level fields
        [JsonPropertyName("hostelCode")]
        public string HostelCode { get; set; } = string.Empty;

        [JsonPropertyName("hostelName")]
        public string HostelName { get; set; } = string.Empty;

        [JsonPropertyName("hostel")]
        public string Hostel => HostelName;

        [JsonPropertyName("hostelFacility")]
        public string HostelFacility => !string.IsNullOrWhiteSpace(HostelName) ? HostelName : "N/A";

        [JsonPropertyName("hostelType")]
        public string HostelType { get; set; } = string.Empty;

        [JsonPropertyName("blockCode")]
        public string BlockCode { get; set; } = string.Empty;

        [JsonPropertyName("blockName")]
        public string BlockName { get; set; } = "Block A";

        [JsonPropertyName("block")]
        public string Block => BlockName;

        [JsonPropertyName("floorsCount")]
        public int FloorsCount { get; set; } = 3;

        // Supervisor / Warden fields
        [JsonPropertyName("assignedSupervisor")]
        public string AssignedSupervisor { get; set; } = "Unassigned";

        [JsonPropertyName("supervisorName")]
        public string SupervisorName => AssignedSupervisor;

        [JsonPropertyName("blockSupervisor")]
        public string BlockSupervisor => AssignedSupervisor;

        [JsonPropertyName("supervisorMobile")]
        public string SupervisorMobile { get; set; } = "N/A";

        [JsonPropertyName("wardenName")]
        public string WardenName { get; set; } = "Unassigned";

        [JsonPropertyName("floorWarden")]
        public string FloorWarden => WardenName;

        [JsonPropertyName("employeeId")]
        public string EmployeeId { get; set; } = "EMP-101";

        [JsonPropertyName("assignedHostel")]
        public string AssignedHostel => HostelName;

        [JsonPropertyName("assignedBlock")]
        public string AssignedBlock => BlockName;

        [JsonPropertyName("mobileNumber")]
        public string MobileNumber { get; set; } = "N/A";

        [JsonPropertyName("email")]
        public string Email { get; set; } = "N/A";

        // Room / Bed / Student fields
        [JsonPropertyName("floorLevel")]
        public string FloorLevel { get; set; } = string.Empty;

        [JsonPropertyName("floor")]
        public string Floor => FloorLevel;

        [JsonPropertyName("blockAndFloor")]
        public string BlockAndFloor => $"{BlockName} • {FloorLevel}";

        [JsonPropertyName("blockFloor")]
        public string BlockFloor => BlockAndFloor;

        [JsonPropertyName("roomNumber")]
        public string RoomNumber { get; set; } = string.Empty;

        [JsonPropertyName("roomType")]
        public string RoomType { get; set; } = string.Empty;

        [JsonPropertyName("bedNumber")]
        public string BedNumber { get; set; } = string.Empty;

        [JsonPropertyName("roomAndBed")]
        public string RoomAndBed => !string.IsNullOrWhiteSpace(BedNumber) ? $"Room #{RoomNumber} ({BedNumber})" : $"Room #{RoomNumber}";

        [JsonPropertyName("roomBed")]
        public string RoomBed => RoomAndBed;

        [JsonPropertyName("totalRooms")]
        public int TotalRooms { get; set; }

        [JsonPropertyName("totalBeds")]
        public int TotalBeds { get; set; }

        [JsonPropertyName("capacity")]
        public int Capacity => TotalBeds;

        [JsonPropertyName("bedCapacity")]
        public int BedCapacity => TotalBeds;

        [JsonPropertyName("occupiedBeds")]
        public int OccupiedBeds { get; set; }

        [JsonPropertyName("occupied")]
        public int Occupied => OccupiedBeds;

        [JsonPropertyName("availableBeds")]
        public int AvailableBeds { get; set; }

        [JsonPropertyName("vacantBeds")]
        public int VacantBeds => AvailableBeds;

        [JsonPropertyName("occupancyStatus")]
        public string OccupancyStatus => AvailableBeds > 0 ? "AVAILABLE" : "FULL";

        [JsonPropertyName("occupancyRate")]
        public string OccupancyRate => TotalBeds > 0 ? $"{(OccupiedBeds * 100 / TotalBeds)}%" : "0%";

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("admNo")]
        public string AdmNo => AdmissionNo;

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("classSection")]
        public string ClassSection { get; set; } = string.Empty;

        [JsonPropertyName("joiningDate")]
        public string JoiningDate { get; set; } = "N/A";

        [JsonPropertyName("effectiveDate")]
        public string EffectiveDate => JoiningDate;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
