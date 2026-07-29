namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class ExamInvigilatorAssignment
{
    [Key]
    public int AssignmentId { get; set; }

    [Required]
    public int ScheduleId { get; set; }

    [ForeignKey("ScheduleId")]
    public ExamSchedule? Schedule { get; set; }

    public string SectionName { get; set; } = "Section A";

    public int StaffId { get; set; }

    public string StaffName { get; set; } = "Rajesh Pirnav";

    public string EmployeeId { get; set; } = "EMP003";
}
