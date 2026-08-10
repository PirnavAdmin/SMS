namespace SMS.Api.Services.Interfaces.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using System.Threading.Tasks;

public interface IExamResultsReportsService
{
    Task<ResultsReportsOptionsDto> GetOptionsAsync();
    Task<CalculateResultsResponseDto> CalculateResultsAsync(CalculateResultsRequestDto request);
    Task<CalculateResultsResponseDto> GetReportCardsListAsync(string className, string sectionName, string? search, string? statusFilter);
    Task<ReportCardPrintDetailDto?> GetPrintableReportCardAsync(int studentId, string? className, string? sectionName);
    Task<bool> ClearExamResultsAsync(string className, string sectionName);
}
