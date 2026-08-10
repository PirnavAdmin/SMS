namespace SMS.Api.Services.Interfaces.Examination;

using SMS.Api.Dtos.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamResultsReportsService
{
    Task<ResultsReportsOptionsDto> GetOptionsAsync();
    Task<CalculateResultsResponseDto> CalculateResultsAsync(CalculateResultsRequestDto request);
    Task<List<StudentReportCardRowDto>> GetReportCardsAsync(string className, string sectionName, string? resultStatus, string? rankOrder, string? search);
    Task<List<StudentReportCardRowDto>> GetReportCardsListAsync(string className, string sectionName, string? search, string? statusFilter);
    Task<ReportCardPrintDetailDto?> GetReportCardPrintDetailAsync(int studentId, string className, string sectionName);
    Task<ReportCardPrintDetailDto?> GetPrintableReportCardAsync(int studentId, string? className, string? sectionName);
    Task<bool> ClearExamResultsAsync(string className, string sectionName);
    Task<bool> UpdateExamResultAsync(StudentReportCardRowDto request, string className, string sectionName);
}

