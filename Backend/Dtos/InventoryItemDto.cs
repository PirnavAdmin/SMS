using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class InventoryItemDto
    {
        [JsonPropertyName("inventoryItemId")]
        public int InventoryItemId { get; set; }

        [JsonPropertyName("id")]
        public int Id => InventoryItemId;

        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Lab Equipment";

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; } = 35;

        [JsonPropertyName("stockQty")]
        public int StockQty => Quantity;

        [JsonPropertyName("stockQtyString")]
        public string StockQtyString => $"{Quantity} units";

        [JsonPropertyName("unitPrice")]
        public decimal UnitPrice { get; set; } = 850m;

        [JsonPropertyName("unitPriceString")]
        public string UnitPriceString => $"₹{UnitPrice:N0}";

        [JsonPropertyName("location")]
        public string Location { get; set; } = "Computer Lab 1";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "In Stock";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateInventoryItemDto
    {
        [Required(ErrorMessage = "Item Name is required.")]
        [StringLength(120, ErrorMessage = "Item Name cannot exceed 120 characters.")]
        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Lab Equipment";

        [Range(0, 1000000, ErrorMessage = "Quantity must be between 0 and 1,000,000.")]
        [JsonPropertyName("quantity")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int Quantity { get; set; } = 10;

        [JsonPropertyName("stockQty")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int StockQtyAlias
        {
            get => Quantity;
            set { if (value > 0) Quantity = value; }
        }

        [Range(typeof(decimal), "0.01", "100000000", ErrorMessage = "Unit Price must be between 0.01 and 100,000,000.")]
        [JsonPropertyName("unitPrice")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal UnitPrice { get; set; } = 50m;

        [JsonPropertyName("location")]
        public string Location { get; set; } = "Computer Lab 1";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "In Stock";
    }
}
