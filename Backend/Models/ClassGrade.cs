namespace SMS.Api.Models;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class ClassGrade
{
	[Key]
	public int ClassId { get; set; }

	[Required]
	public string ClassName { get; set; } = string.Empty;

	// Navigation properties
	public ICollection<ClassSection> Sections { get; set; } = new List<ClassSection>();
	public ICollection<ClassCurriculumSubject> CurriculumSubjects { get; set; } = new List<ClassCurriculumSubject>();
	public ICollection<AdmissionApplication> AdmissionApplications { get; set; } = new List<AdmissionApplication>();
}