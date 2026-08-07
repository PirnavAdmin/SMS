namespace SMS.Api.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class ClassGrade
{
	[Key]
	public int ClassId { get; set; }

	public string? ClassName { get; set; }

	public string CampusLocation { get; set; } = "Main Campus";

	public string AcademicYear { get; set; } = "2026-2027";

	public int? DisplayOrder { get; set; }

	public string Status { get; set; } = "Active";

	public string? Remarks { get; set; }

	public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;

	public System.DateTime? UpdatedAt { get; set; }

	// Navigation properties
	public ICollection<ClassSection> Sections { get; set; } = new List<ClassSection>();
	public ICollection<ClassSubjectMapping> SubjectMappings { get; set; } = new List<ClassSubjectMapping>();
	public ICollection<TeacherAssignment> TeacherAssignments { get; set; } = new List<TeacherAssignment>();
	public ICollection<AdmissionApplication> AdmissionApplications { get; set; } = new List<AdmissionApplication>();
}