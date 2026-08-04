namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Threading.Tasks;

public interface IReportCardService
{
    Task<ReportCardDropdownOptionsDto> GetReportCardDropdownOptionsAsync(string? academicYear = "2026-27");
    Task<StudentReportCardResponseDto> GetStudentReportCardAsync(int? studentId, string? examName, string? academicYear = "2026-27");
}
