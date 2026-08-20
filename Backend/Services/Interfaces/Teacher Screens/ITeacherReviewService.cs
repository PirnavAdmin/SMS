namespace SMS.Api.Services.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherReviewService
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherReviewSummaryDto?> GetReviewSummaryAsync(int staffId);
    Task<TeacherSubmissionResultDto> SubmitProfileAsync(int staffId, SubmitTeacherProfileDto dto);
}
