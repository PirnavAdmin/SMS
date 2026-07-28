namespace SMS.Api.Dtos;

using System;
using System.ComponentModel.DataAnnotations;

public class RoomMasterDto
{
    public int RoomId { get; set; }
    public int HostelId { get; set; }
    public string HostelName { get; set; } = string.Empty;
    public string HostelCode { get; set; } = string.Empty;
    public int RoomTypeId { get; set; }
    public string RoomTypeSpecification { get; set; } = string.Empty;
    public int BedCapacity { get; set; }
    public string FloorLevel { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public int OccupiedBeds { get; set; }
    public int VacantBeds { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRoomMasterDto
{
    [Required(ErrorMessage = "Hostel Block is required.")]
    public int HostelId { get; set; }

    [Required(ErrorMessage = "Floor Level is required.")]
    public string FloorLevel { get; set; } = "1st Floor";

    [Required(ErrorMessage = "Room Number is required.")]
    public string RoomNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Room Type is required.")]
    public int RoomTypeId { get; set; }

    [Required(ErrorMessage = "Status is required.")]
    public string Status { get; set; } = "Active";
}
