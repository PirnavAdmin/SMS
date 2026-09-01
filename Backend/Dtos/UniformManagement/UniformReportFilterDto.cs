using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class UniformReportFilterDto
    {
        [JsonPropertyName("reportType")]
        public string? ReportType { get; set; } // Stock Level Report, Category Sales, Issue Log, Low Stock Report

        [JsonPropertyName("categoryId")]
        public int? CategoryId { get; set; }

        [JsonPropertyName("gender")]
        public string? Gender { get; set; }

        [JsonPropertyName("academicYear")]
        public string? AcademicYear { get; set; }

        [JsonPropertyName("search")]
        public string? Search { get; set; }
    }

    public class UniformReportItemDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category => CategoryName;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("size")]
        public string Size { get; set; } = "M";

        [JsonPropertyName("color")]
        public string Color { get; set; } = "Navy Blue";

        [JsonPropertyName("unitPrice")]
        public decimal UnitPrice { get; set; }

        [JsonPropertyName("openingStock")]
        public int OpeningStock { get; set; }

        [JsonPropertyName("openingStockString")]
        public string OpeningStockString => $"{OpeningStock} Units";

        [JsonPropertyName("availableStock")]
        public int AvailableStock { get; set; }

        [JsonPropertyName("currentStock")]
        public int CurrentStock => AvailableStock;

        [JsonPropertyName("currentStockString")]
        public string CurrentStockString => $"{AvailableStock} Units";

        [JsonPropertyName("reorderLevel")]
        public int ReorderLevel { get; set; } = 15;

        [JsonPropertyName("reorderLevelString")]
        public string ReorderLevelString => $"{ReorderLevel} Units";

        [JsonPropertyName("issuedUnits")]
        public int IssuedUnits { get; set; }

        [JsonPropertyName("totalValue")]
        public decimal TotalValue => UnitPrice * AvailableStock;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
