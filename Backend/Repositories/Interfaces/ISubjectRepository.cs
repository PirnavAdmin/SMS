using SMS.Api.Dtos.Subject;

namespace SMS.Api.Repositories.Interfaces
{
    public interface ISubjectRepository
    {
        Task<IEnumerable<SubjectDto>> GetAllAsync(SubjectFilterDto filter);
        Task<SubjectDto?> GetByIdAsync(long id);
        Task<long> CreateAsync(CreateSubjectDto dto, long createdBy);
        Task<bool> UpdateAsync(long id, UpdateSubjectDto dto, long modifiedBy);
        Task<bool> DeleteAsync(long id, long modifiedBy);
        Task<bool> SubjectCodeExistsAsync(string subjectCode, long? excludeId = null);
        Task<bool> CourseCodeExistsAsync(string courseCode, long? excludeId = null);
        Task<string> GetNextSubjectCodeAsync();
    }
}