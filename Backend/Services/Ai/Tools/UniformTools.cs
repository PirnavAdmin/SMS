using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class UniformStockOverviewTool : IAiTool
    {
        private readonly IUniformService _uniformService;

        public UniformStockOverviewTool(IUniformService uniformService)
        {
            _uniformService = uniformService;
        }

        public string Name => "uniform_get_stock_overview";
        public string Description => "Retrieves school uniform inventory levels, total stock count, distributed units, low-stock alerts, and stock breakdown by category.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""category"": { ""type"": ""string"", ""description"": ""Optional uniform category e.g. 'Regular', 'Sports'"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "InventoryManager", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var metrics = await _uniformService.GetDashboardMetricsAsync();

            int totalTypes = metrics.TotalItems;
            int totalStock = metrics.AvailableStock;
            int lowStockAlerts = metrics.LowStock;
            int issuedUnits = metrics.IssuedUnits;
            int returnedUnits = metrics.ReturnedItems;

            string summary = $"Uniform Inventory: {totalTypes} uniform item types with {totalStock} total available units in stock. " +
                             $"{issuedUnits} units issued, {returnedUnits} returned. {lowStockAlerts} items currently have low-stock warnings.";

            var categoryRows = metrics.CategoryStockLevels.Select(c => new
            {
                Category = c.CategoryName,
                AvailableUnits = c.TotalUnits
            }).ToList();

            var visualData = new
            {
                title = "School Uniform Inventory & Stock Levels",
                columns = new[] { "Category", "AvailableUnits" },
                rows = categoryRows
            };

            return AiToolResult.Ok(summary, metrics, "table", visualData);
        }
    }
}
