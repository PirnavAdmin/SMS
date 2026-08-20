namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherReviewRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherReviewSummaryDto?> GetReviewSummaryByStaffIdAsync(int staffId);
    Task<TeacherSubmissionResultDto> SubmitProfileAsync(int staffId, SubmitTeacherProfileDto dto);
}
