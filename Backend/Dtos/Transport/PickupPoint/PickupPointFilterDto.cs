using Microsoft.AspNetCore.Mvc;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.PickupPoint
{
    public class PickupPointFilterDto
    {
        public string? Search { get; set; }

        public long? RouteId { get; set; }

        [ModelBinder(BinderType = typeof(FlexibleBoolModelBinder))]
        public bool? Status { get; set; }

        public string SortBy { get; set; } = "pickupPointName";

        public string SortOrder { get; set; } = "asc";

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;
    }
}