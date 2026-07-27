using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Examination.ExamMaster
{
	public class ExamMasterFilterDto
	{
		public string? Search { get; set; }

		public long? BranchId { get; set; }

		public long? AcademicYearId { get; set; }

		public string? ExamType { get; set; }

		public string? ExamStatus { get; set; }

		[Range(1, int.MaxValue)]
		public int PageNumber { get; set; } = 1;

		[Range(1, 100)]
		public int PageSize { get; set; } = 10;

		public string SortBy { get; set; } = "startDate";

		public string SortOrder { get; set; } = "desc";
	}
}