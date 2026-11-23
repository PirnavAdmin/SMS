using Microsoft.AspNetCore.Mvc;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.Driver
{
    public class TransportDriverFilterDto
    {
        public string? Search { get; set; }

        [ModelBinder(BinderType = typeof(FlexibleBoolModelBinder))]
        public bool? Status { get; set; }

        public bool? LicenceExpired { get; set; }

        public string? SortBy { get; set; } = "driverName";

        public string? SortOrder { get; set; } = "asc";

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;
    }
}