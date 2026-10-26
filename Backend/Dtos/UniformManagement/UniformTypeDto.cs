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
        public string Category => !string.IsNullOrWhiteSpace(CategoryName) ? CategoryName : (!string.IsNullOrWhiteSpace(ItemName) ? ItemName : "General");

        [JsonPropertyName("uniformCategory")]
        public string UniformCategory => ItemName;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("schoolWing")]
        public string SchoolWing { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public string Level => SchoolWing;

        [JsonPropertyName("size")]
        public string Size { get; set; } = string.Empty;

        [JsonPropertyName("badgeText")]
        public string BadgeText => !string.IsNullOrWhiteSpace(Size) ? $"{Gender} • {(Size.StartsWith("Size ") ? Size : $"Size {Size}")}" : Gender;

        [JsonPropertyName("packageType")]
        public string PackageType => ItemName.ToLower().Contains("package") || ItemName.ToLower().Contains("kit") ? "Uniform Package" : "Uniform Item";

        [JsonPropertyName("includedItems")]
        public List<string> IncludedItems { get; set; } = new();

        [JsonPropertyName("color")]
        public string Color { get; set; } = string.Empty;

        [JsonPropertyName("colorSpec")]
        public string ColorSpec => Color;

        [JsonPropertyName("unitPrice")]
        public decimal UnitPrice { get; set; }

        [JsonPropertyName("unitPriceString")]
        public string UnitPriceString => $"₹{UnitPrice:N0}";

        [JsonPropertyName("openingStock")]
        public int OpeningStock { get; set; } = 0;

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
        public int MinThreshold { get; set; } = 0;

        [JsonPropertyName("minThresholdString")]
        public string MinThresholdString => $"{MinThreshold} Units";

        [JsonPropertyName("reorderPoint")]
        public int ReorderPoint { get; set; } = 0;

        [JsonPropertyName("reorderPointString")]
        public string ReorderPointString => $"{ReorderPoint} Units";

        [JsonPropertyName("stockStatus")]
        public string StockStatus => AvailableStock == 0 ? "Out of Stock" : (MinThreshold > 0 && AvailableStock <= MinThreshold ? "Low Stock" : "In Stock");

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformTypeDto
    {
        private string _itemName = string.Empty;
        private string _categoryName = string.Empty;
        private string _schoolWing = string.Empty;
        private decimal _unitPrice;

        [JsonPropertyName("itemName")]
        public string ItemName
        {
            get => _itemName;
            set => _itemName = value;
        }

        [JsonPropertyName("categoryName")]
        public string CategoryName
        {
            get => _categoryName;
            set => _categoryName = value;
        }

        [JsonPropertyName("category")]
        public string? CategoryAlias
        {
            get => _categoryName;
            set { if (!string.IsNullOrWhiteSpace(value)) _categoryName = value; }
        }

        [JsonPropertyName("uniformCategory")]
        public string? UniformCategoryAlias
        {
            get => _categoryName;
            set { if (!string.IsNullOrWhiteSpace(value)) _categoryName = value; }
        }

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("schoolWing")]
        public string SchoolWing
        {
            get => _schoolWing;
            set => _schoolWing = value;
        }

        [JsonPropertyName("className")]
        public string? ClassNameAlias
        {
            get => _schoolWing;
            set { if (!string.IsNullOrWhiteSpace(value)) _schoolWing = value; }
        }

        [JsonPropertyName("level")]
        public string? LevelAlias
        {
            get => _schoolWing;
            set { if (!string.IsNullOrWhiteSpace(value)) _schoolWing = value; }
        }

        [JsonPropertyName("size")]
        public string Size { get; set; } = string.Empty;

        [JsonPropertyName("color")]
        public string Color { get; set; } = string.Empty;

        [JsonPropertyName("colorSpec")]
        public string? ColorSpecAlias
        {
            get => Color;
            set { if (!string.IsNullOrWhiteSpace(value)) Color = value; }
        }

        [JsonPropertyName("unitPrice")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal UnitPrice
        {
            get => _unitPrice;
            set => _unitPrice = value;
        }

        [JsonPropertyName("price")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal PriceAlias
        {
            get => _unitPrice;
            set => _unitPrice = value;
        }

        [JsonPropertyName("openingStock")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int OpeningStock { get; set; } = 0;

        [JsonPropertyName("availableStock")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int AvailableStock { get; set; } = 0;

        [JsonPropertyName("minThreshold")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int MinThreshold { get; set; } = 0;

        [JsonPropertyName("reorderPoint")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int ReorderPoint { get; set; } = 0;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("includedItems")]
        public List<string>? IncludedItems { get; set; }
    }

    public class StockAdjustmentDto
    {
        [JsonPropertyName("action")]
        public string Action { get; set; } = "restock"; // restock, out, adjust

        [JsonPropertyName("quantity")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int Quantity { get; set; }

        [JsonPropertyName("quantityChange")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int QuantityChangeAlias
        {
            get => Quantity;
            set { if (value != 0) Quantity = value; }
        }

        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}
