using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class UniformTypeDto
    {
        [JsonPropertyName("uniformTypeId")]
        public int UniformTypeId { get; set; }

        [JsonPropertyName("id")]
        public int Id => UniformTypeId;

        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category => !string.IsNullOrWhiteSpace(CategoryName) ? CategoryName : (ItemName.Contains("Shirt") ? "Shirt" : "Blazer");

        [JsonPropertyName("uniformCategory")]
        public string UniformCategory => ItemName;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("schoolWing")]
        public string SchoolWing { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public string Level => SchoolWing;

        [JsonPropertyName("size")]
        public string Size { get; set; } = "Size M";

        [JsonPropertyName("badgeText")]
        public string BadgeText => $"{Gender} • {(Size.StartsWith("Size ") ? Size : $"Size {Size}")}";

        [JsonPropertyName("color")]
        public string Color { get; set; } = string.Empty;

        [JsonPropertyName("colorSpec")]
        public string ColorSpec => Color;

        [JsonPropertyName("unitPrice")]
        public decimal UnitPrice { get; set; }

        [JsonPropertyName("unitPriceString")]
        public string UnitPriceString => $"₹{UnitPrice:N0}";

        [JsonPropertyName("openingStock")]
        public int OpeningStock { get; set; } = 200;

        [JsonPropertyName("openingStockString")]
        public string OpeningStockString => $"{OpeningStock} Units";

        [JsonPropertyName("availableStock")]
        public int AvailableStock { get; set; }

        [JsonPropertyName("currentStock")]
        public int CurrentStock => AvailableStock;

        [JsonPropertyName("currentStockString")]
        public string CurrentStockString => $"{AvailableStock} Units";

        [JsonPropertyName("stockAvailable")]
        public string StockAvailable => $"{AvailableStock} Units";

        [JsonPropertyName("minThreshold")]
        public int MinThreshold { get; set; } = 30;

        [JsonPropertyName("minThresholdString")]
        public string MinThresholdString => $"{MinThreshold} Units";

        [JsonPropertyName("reorderPoint")]
        public int ReorderPoint { get; set; } = 50;

        [JsonPropertyName("reorderPointString")]
        public string ReorderPointString => $"{ReorderPoint} Units";

        [JsonPropertyName("stockStatus")]
        public string StockStatus => AvailableStock == 0 ? "Out of Stock" : (AvailableStock <= MinThreshold ? "Low Stock" : "In Stock");

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformTypeDto
    {
        [Required(ErrorMessage = "Uniform Category / Item Name is required.")]
        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("categoryName")]
        public string? CategoryName { get; set; }

        [JsonPropertyName("uniformCategory")]
        public string? UniformCategoryAlias
        {
            get => ItemName;
            set { if (!string.IsNullOrWhiteSpace(value)) ItemName = value; }
        }

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("schoolWing")]
        public string SchoolWing { get; set; } = "Class 10";

        [JsonPropertyName("level")]
        public string? LevelAlias
        {
            get => SchoolWing;
            set { if (!string.IsNullOrWhiteSpace(value)) SchoolWing = value; }
        }

        [Required(ErrorMessage = "Size is required.")]
        [JsonPropertyName("size")]
        public string Size { get; set; } = "Size M";

        [JsonPropertyName("color")]
        public string Color { get; set; } = "Navy Blue";

        [JsonPropertyName("colorSpec")]
        public string? ColorSpecAlias
        {
            get => Color;
            set { if (!string.IsNullOrWhiteSpace(value)) Color = value; }
        }

        [JsonPropertyName("unitPrice")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal UnitPrice { get; set; }

        [JsonPropertyName("openingStock")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int OpeningStock { get; set; } = 200;

        [JsonPropertyName("availableStock")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int AvailableStock { get; set; } = 120;

        [JsonPropertyName("minThreshold")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int MinThreshold { get; set; } = 30;

        [JsonPropertyName("reorderPoint")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int ReorderPoint { get; set; } = 50;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }

    public class StockAdjustmentDto
    {
        [JsonPropertyName("action")]
        public string Action { get; set; } = "restock"; // restock, out, adjust

        [JsonPropertyName("quantity")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int Quantity { get; set; }
    }
}
