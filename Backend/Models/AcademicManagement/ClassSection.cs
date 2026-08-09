using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SMS.Api.Models;

namespace SMS.Api.Models.AcademicManagement
{
	public class ClassSection
	{
		[Key]
		public int SectionId { get; set; }

		[Required]
		public string SectionName { get; set; } = string.Empty;

		public int ClassId { get; set; }

		[ForeignKey(nameof(ClassId))]
		public ClassGrade ClassGrade { get; set; } = null!;

		public int Capacity { get; set; } = 40;

		public string Status { get; set; } = "Active";

		public string? Remarks { get; set; }

		public ICollection<Student> Students { get; set; } = new List<Student>();
	}
}