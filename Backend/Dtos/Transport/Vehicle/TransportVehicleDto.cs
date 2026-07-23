namespace SMS.Api.Dtos.Transport.Vehicle
{
    public class TransportVehicleDto
    {
        public long VehicleId { get; set; }

        public string VehicleNumber { get; set; } = string.Empty;

        public string RegistrationNumber { get; set; } = string.Empty;

        public string VehicleName { get; set; } = string.Empty;

        public string VehicleType { get; set; } = string.Empty;

        public int Capacity { get; set; }

        public string? Manufacturer { get; set; }

        public string? Model { get; set; }

        public string? InsuranceNumber { get; set; }

        public DateTime? InsuranceExpiry { get; set; }

        public DateTime? PollutionExpiry { get; set; }

        public DateTime? FitnessExpiry { get; set; }

        public bool Status { get; set; }

        public string StatusText { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}