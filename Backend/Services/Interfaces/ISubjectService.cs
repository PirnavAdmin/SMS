using SMS.Api.Dtos.Subject;

namespace SMS.Api.Services.Interfaces
{
    public interface ISubjectService
    {
        Task<IEnumerable<SubjectDto>> GetAllAsync(SubjectFilterDto filter);

        Task<SubjectDto?> GetByIdAsync(long id);

        Task<long> CreateAsync(CreateSubjectDto dto, long createdBy);

        Task<bool> UpdateAsync(long id, UpdateSubjectDto dto, long modifiedBy);

        Task<bool> DeleteAsync(long id, long modifiedBy);
        Task<string> GetNextSubjectCodeAsync();
    }
}