using SMS.Api.Dtos.Academic;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations;

public class AcademicService : IAcademicService
{
    private readonly IAcademicRepository _repository;

    public AcademicService(
        IAcademicRepository repository)
    {
        _repository = repository;
    }

    public Task<PagedAcademicResultDto> GetAllAsync(
        AcademicFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        return _repository.GetAllAsync(
            filter,
            cancellationToken);
    }

    public Task<AcademicClassGradeDto?> GetByIdAsync(
        long classGradeId,
        CancellationToken cancellationToken = default)
    {
        return _repository.GetByIdAsync(
            classGradeId,
            cancellationToken);
    }

    public Task<long> CreateAsync(
        CreateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.CreateAsync(
            dto,
            userId,
            cancellationToken);
    }

    public Task<bool> UpdateAsync(
        long classGradeId,
        UpdateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.UpdateAsync(
            classGradeId,
            dto,
            userId,
            cancellationToken);
    }

    public Task<bool> DeleteAsync(
        long classGradeId,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.DeleteAsync(
            classGradeId,
            userId,
            cancellationToken);
    }

    public Task<long> AddSectionAsync(
        long classGradeId,
        CreateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.AddSectionAsync(
            classGradeId,
            dto,
            userId,
            cancellationToken);
    }

    public Task<bool> UpdateSectionAsync(
        long sectionId,
        UpdateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.UpdateSectionAsync(
            sectionId,
            dto,
            userId,
            cancellationToken);
    }

    public Task<bool> DeleteSectionAsync(
        long sectionId,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.DeleteSectionAsync(
            sectionId,
            userId,
            cancellationToken);
    }

    public Task AddSubjectsAsync(
        long classGradeId,
        AddClassSubjectsDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        return _repository.AddSubjectsAsync(
            classGradeId,
            dto,
            userId,
            cancellationToken);
    }

    public Task<bool> RemoveSubjectAsync(
        long classGradeId,
        long subjectId,
        CancellationToken cancellationToken = default)
    {
        return _repository.RemoveSubjectAsync(
            classGradeId,
            subjectId,
            cancellationToken);
    }

    public Task<List<TeacherLookupDto>> SearchTeachersAsync(
        string? search,
        int limit,
        CancellationToken cancellationToken = default)
    {
        return _repository.SearchTeachersAsync(
            search,
            limit,
            cancellationToken);
    }

    public Task<List<SubjectLookupDto>> SearchSubjectsAsync(
        string? search,
        int limit,
        CancellationToken cancellationToken = default)
    {
        return _repository.SearchSubjectsAsync(
            search,
            limit,
            cancellationToken);
    }
}