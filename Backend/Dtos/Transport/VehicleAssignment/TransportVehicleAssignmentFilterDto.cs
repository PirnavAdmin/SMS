using Microsoft.AspNetCore.Mvc;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.VehicleAssignment
{
    public class TransportVehicleAssignmentFilterDto
    {
        public string? Search { get; set; }

        public long? RouteId { get; set; }

        public long? VehicleId { get; set; }

        public long? DriverId { get; set; }

        [ModelBinder(BinderType = typeof(FlexibleBoolModelBinder))]
        public bool? Status { get; set; }

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public string? SortBy { get; set; } = "assignmentDate";

        public string? SortOrder { get; set; } = "desc";

        public int PageNumber { get; set; } = 1;

        public int? PageSize { get; set; }
    }
}