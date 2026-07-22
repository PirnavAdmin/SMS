using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
	public class ClassGrade
	{
		[Key]
		public long ClassId { get; set; }

		public long? BranchId { get; set; }
		public string ClassName { get; set; } = string.Empty;
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		[ForeignKey("BranchId")]
		public Branch? Branch { get; set; }

		public ICollection<ClassSection> Sections { get; set; } = new List<ClassSection>();
		public ICollection<ClassCurriculumSubject> CurriculumSubjects { get; set; } = new List<ClassCurriculumSubject>();
	}
}