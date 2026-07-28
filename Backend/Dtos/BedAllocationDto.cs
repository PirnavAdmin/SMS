namespace SMS.Api.Dtos;

using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class BedAllocationDto
{
    public int AllocationId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int HostelId { get; set; }
    public string HostelName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string FloorLevel { get; set; } = string.Empty;
    public string BedNumber { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public string Status { get; set; } = "Active";
    public string CurfewStatus { get; set; } = "Present";
    public DateTime CreatedAt { get; set; }
}

public class CreateBedAllocationDto
{
    public int StudentId { get; set; }
    public string? StudentName { get; set; }
    public string? AdmissionNo { get; set; }

    public int HostelId { get; set; }
    public string? HostelName { get; set; }

    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }

    public string? BedNumber { get; set; }

    [JsonPropertyName("allocatedBedId")]
    public string? AllocatedBedId
    {
        get => BedNumber;
        set => BedNumber = value;
    }

    public DateTime JoiningDate { get; set; } = DateTime.UtcNow;
}
