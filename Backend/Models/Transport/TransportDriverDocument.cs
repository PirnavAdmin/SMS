using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("transport_driver_documents")]
    public class TransportDriverDocument
    {
        [Key]
        [Column("Id")]
        public long Id { get; set; }

        [Column("DriverId")]
        public string DriverId { get; set; } = string.Empty;

        [Column("DocumentCategory")]
        public string? DocumentCategory { get; set; }

        [Column("DocumentNumber")]
        public string? DocumentNumber { get; set; }

        [Column("IssueDate")]
        public string? IssueDate { get; set; }

        [Column("ExpiryDate")]
        public string? ExpiryDate { get; set; }

        [Column("BadgeNumber")]
        public string? BadgeNumber { get; set; }

        [Column("Status")]
        public string Status { get; set; } = "Verified";

        [Column("FileName")]
        public string? FileName { get; set; }

        [Column("FileUrl")]
        public string? FileUrl { get; set; }

        [Column("IsDeleted")]
        public bool IsDeleted { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
