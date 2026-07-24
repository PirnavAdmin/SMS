namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class TransportRoute
{
    [Key]
    public long RouteId { get; set; }

    [Required]
    public string RouteCode { get; set; } = string.Empty;

    [Required]
    public string RouteName { get; set; } = string.Empty;

    public string StartLocation { get; set; } = string.Empty;
    public string EndLocation { get; set; } = string.Empty;
    public string PickupPoint { get; set; } = string.Empty;
    public string DropPoint { get; set; } = string.Empty;
    public decimal DistanceKm { get; set; } = 0;
    public int EstimatedDurationMinutes { get; set; } = 30;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyFee { get; set; } = 0;

    public bool Status { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public long? CreatedBy { get; set; }
    public long? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public long? VehicleId { get; set; }
    public TransportVehicle? Vehicle { get; set; }
}