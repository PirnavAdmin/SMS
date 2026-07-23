namespace SMS.Api.Dtos.Subject
{
	public class SubjectFilterDto
	{
		public string? Search { get; set; }

		public int PageNumber { get; set; } = 1;

		public int PageSize { get; set; } = 10;

		// Sorting
		public string? SortBy { get; set; } = "SubjectId";

		public string? SortOrder { get; set; } = "desc";
	}
}