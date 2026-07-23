using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Transport.VehicleMaintenance
{
    public class CreateVehicleMaintenanceDto
    {
        [Required]
        public long VehicleId { get; set; }

        [Required]
        [StringLength(150)]
        public string ServiceType { get; set; } = string.Empty;

        [Required]
        public DateTime ServiceDate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal Cost { get; set; }

        [StringLength(150)]
        public string? VendorCenter { get; set; }

        public DateTime? NextServiceDue { get; set; }

        [StringLength(500)]
        public string? Remarks { get; set; }
    }
}