using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class UniformDashboardMetricsDto
    {
        [JsonPropertyName("totalItems")]
        public int TotalItems { get; set; } = 2;

        [JsonPropertyName("availableStock")]
        public int AvailableStock { get; set; } = 165;

        [JsonPropertyName("availableStockString")]
        public string AvailableStockString => $"{AvailableStock} Units";

        [JsonPropertyName("lowStock")]
        public int LowStock { get; set; } = 0;

        [JsonPropertyName("lowStockString")]
        public string LowStockString => $"{LowStock} Items";

        [JsonPropertyName("issuedUnits")]
        public int IssuedUnits { get; set; } = 0;

        [JsonPropertyName("issuedUnitsString")]
        public string IssuedUnitsString => $"{IssuedUnits} Items";

        [JsonPropertyName("additionalSales")]
        public decimal AdditionalSales { get; set; } = 0;

        [JsonPropertyName("additionalSalesString")]
        public string AdditionalSalesString => $"₹{AdditionalSales:N0}";

        [JsonPropertyName("outOfStock")]
        public int OutOfStock { get; set; } = 0;

        [JsonPropertyName("outOfStockString")]
        public string OutOfStockString => $"{OutOfStock} Items";

        [JsonPropertyName("lowStockAlerts")]
        public List<UniformLowStockAlertDto> LowStockAlerts { get; set; } = new();

        [JsonPropertyName("categoryStockLevels")]
        public List<UniformCategoryStockLevelDto> CategoryStockLevels { get; set; } = new();
    }

    public class UniformLowStockAlertDto
    {
        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("currentStock")]
        public int CurrentStock { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Low Stock";
    }

    public class UniformCategoryStockLevelDto
    {
        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("itemName")]
        public string ItemName => CategoryName;

        [JsonPropertyName("totalUnits")]
        public int TotalUnits { get; set; }

        [JsonPropertyName("unitsString")]
        public string UnitsString => $"{TotalUnits} Units";
    }
}
