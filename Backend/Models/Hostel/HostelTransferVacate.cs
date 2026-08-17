using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("hostel_transfer_vacate_requests")]
    public class HostelTransferVacate
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("student_id")]
        public int StudentId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("admission_no")]
        public string? AdmissionNo { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("action_type")]
        public string ActionType { get; set; } = "Room Transfer"; // Room Transfer or Bed Vacate

        [MaxLength(150)]
        [Column("current_room")]
        public string? CurrentRoom { get; set; }

        [Column("destination_hostel_id")]
        public int? DestinationHostelId { get; set; }

        [MaxLength(150)]
        [Column("destination_hostel_name")]
        public string? DestinationHostelName { get; set; }

        [Column("destination_room_id")]
        public int? DestinationRoomId { get; set; }

        [MaxLength(50)]
        [Column("destination_room_number")]
        public string? DestinationRoomNumber { get; set; }

        [MaxLength(50)]
        [Column("destination_bed_number")]
        public string? DestinationBedNumber { get; set; }

        [Column("reason")]
        public string? Reason { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("status")]
        public string Status { get; set; } = "Approved";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
