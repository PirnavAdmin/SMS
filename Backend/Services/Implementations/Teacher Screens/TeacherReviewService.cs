namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherReviewService : ITeacherReviewService
{
    private readonly ITeacherReviewRepository _repository;

    public TeacherReviewService(ITeacherReviewRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<TeacherReviewSummaryDto?> GetReviewSummaryAsync(int staffId)
    {
        return await _repository.GetReviewSummaryByStaffIdAsync(staffId);
    }

    public async Task<TeacherSubmissionResultDto> SubmitProfileAsync(int staffId, SubmitTeacherProfileDto dto)
    {
        return await _repository.SubmitProfileAsync(staffId, dto);
    }
}
