namespace SMS.Api.Models.AcademicManagement
{
    using System;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("designation_masters")]
    public class DesignationMaster
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("designation_name")]
        public string DesignationName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [Column("employee_category")]
        public string EmployeeCategory { get; set; } = "Teaching"; // "Teaching", "Non-Teaching", "Both"

        [Required]
        [MaxLength(20)]
        [Column("status")]
        public string Status { get; set; } = "Active"; // "Active", "Inactive"

        [Column("created_date")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
