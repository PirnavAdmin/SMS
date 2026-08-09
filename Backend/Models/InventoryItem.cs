using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("inventory_items")]
    public class InventoryItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InventoryItemId { get; set; }

        [Required]
        [MaxLength(150)]
        public string ItemName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Category { get; set; } = "Lab Equipment";

        public int Quantity { get; set; } = 10;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } = 50m;

        [MaxLength(150)]
        public string Location { get; set; } = "Computer Lab 1";

        [MaxLength(50)]
        public string Status { get; set; } = "In Stock";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
