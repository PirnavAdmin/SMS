using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("hostel_outpasses")]
    public class HostelOutpass
    {
        [Key]
        [Column("id")]
        public int OutpassId { get; set; }

        [Column("student_id")]
        public int StudentId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("admission_no")]
        public string? AdmissionNo { get; set; }

        [MaxLength(100)]
        [Column("hostel_name")]
        public string? HostelName { get; set; }

        [MaxLength(50)]
        [Column("room_number")]
        public string? RoomNumber { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("request_type")]
        public string RequestType { get; set; } = "Local Outpass"; // Local Outpass, Home Leave, Emergency Outpass

        [Column("reason")]
        public string? Reason { get; set; }

        [Column("out_date")]
        public DateTime OutDate { get; set; } = DateTime.UtcNow;

        [Column("expected_return_date")]
        public DateTime ExpectedReturnDate { get; set; } = DateTime.UtcNow.AddDays(1);

        [Column("actual_return_date")]
        public DateTime? ActualReturnDate { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("status")]
        public string Status { get; set; } = "Pending Approval"; // Pending Approval, Approved, Rejected, Completed

        [MaxLength(150)]
        [Column("approved_by")]
        public string? ApprovedBy { get; set; }

        [Column("remarks")]
        public string? Remarks { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
