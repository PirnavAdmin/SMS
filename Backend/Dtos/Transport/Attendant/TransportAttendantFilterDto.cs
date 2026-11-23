using Microsoft.AspNetCore.Mvc;
using SMS.Api.Common;

namespace SMS.Api.Dtos.Transport.Attendant
{
    public class TransportAttendantFilterDto
    {
        public string? Search { get; set; }

        [ModelBinder(BinderType = typeof(FlexibleBoolModelBinder))]
        public bool? Status { get; set; }

        public string? SortBy { get; set; } = "attendantName";

        public string? SortOrder { get; set; } = "asc";

        public int PageNumber { get; set; } = 1;

        public int PageSize { get; set; } = 10;
    }
}

