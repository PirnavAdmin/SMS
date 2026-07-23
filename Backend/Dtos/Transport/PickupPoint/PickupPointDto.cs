namespace SMS.Api.Dtos.Transport.PickupPoint
{
    public class PickupPointDto
    {
        public long PickupPointId { get; set; }

        public long RouteId { get; set; }

        public string RouteName { get; set; } = string.Empty;

        public string PickupPointName { get; set; } = string.Empty;

        public string? Landmark { get; set; }

        public int SequenceNo { get; set; }

        public TimeSpan PickupTime { get; set; }

        public decimal DistanceFromStart { get; set; }

        public bool Status { get; set; }

        public string StatusText { get; set; } = string.Empty;
    }
}