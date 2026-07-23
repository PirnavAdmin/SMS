namespace SMS.Api.Dtos.Academic;

public class AcademicFilterDto
{
    public string? Search { get; set; }

    public string SortBy { get; set; } = "displayOrder";

    public string SortOrder { get; set; } = "asc";

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}