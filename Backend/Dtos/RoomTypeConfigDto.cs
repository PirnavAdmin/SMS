namespace SMS.Api.Dtos;

using System;
using System.ComponentModel.DataAnnotations;

public class RoomTypeConfigDto
{
    public int RoomTypeId { get; set; }
    public string RoomTypeSpecification { get; set; } = string.Empty;
    public int BedCapacity { get; set; }
    public string AcType { get; set; } = "AC";
    public string Status { get; set; } = "Active";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateRoomTypeConfigDto
{
    [Required(ErrorMessage = "Room Type Specification is required.")]
    public string RoomTypeSpecification { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bed Capacity is required.")]
    [Range(1, 20, ErrorMessage = "Bed Capacity must be between 1 and 20.")]
    public int BedCapacity { get; set; } = 1;

    [Required(ErrorMessage = "AC Type is required.")]
    public string AcType { get; set; } = "AC";

    [Required(ErrorMessage = "Status is required.")]
    public string Status { get; set; } = "Active";

    public string? Description { get; set; }
}
