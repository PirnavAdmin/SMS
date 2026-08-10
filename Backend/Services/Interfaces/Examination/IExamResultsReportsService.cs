namespace SMS.Api.Services.Interfaces.Examination;

using SMS.Api.Dtos.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamResultsReportsService
{
    Task<ResultsReportsOptionsDto> GetOptionsAsync();
    Task<CalculateResultsResponseDto> CalculateResultsAsync(CalculateResultsRequestDto request);
    Task<List<StudentReportCardRowDto>> GetReportCardsAsync(string className, string sectionName, string? resultStatus, string? rankOrder, string? search);
    Task<ReportCardPrintDetailDto?> GetReportCardPrintDetailAsync(int studentId, string className, string sectionName);
}

