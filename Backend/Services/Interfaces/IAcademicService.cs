using SMS.Api.Dtos.Academic;

namespace SMS.Api.Services.Interfaces;

public interface IAcademicService
{
    Task<PagedAcademicResultDto> GetAllAsync(
        AcademicFilterDto filter,
        CancellationToken cancellationToken = default);

    Task<AcademicClassGradeDto?> GetByIdAsync(
        long classGradeId,
        CancellationToken cancellationToken = default);

    Task<long> CreateAsync(
        CreateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(
        long classGradeId,
        UpdateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        long classGradeId,
        long userId,
        CancellationToken cancellationToken = default);

    Task<long> AddSectionAsync(
        long classGradeId,
        CreateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> UpdateSectionAsync(
        long sectionId,
        UpdateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteSectionAsync(
        long sectionId,
        long userId,
        CancellationToken cancellationToken = default);

    Task AddSubjectsAsync(
        long classGradeId,
        AddClassSubjectsDto dto,
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> RemoveSubjectAsync(
        long classGradeId,
        long subjectId,
        CancellationToken cancellationToken = default);

    Task<List<TeacherLookupDto>> SearchTeachersAsync(
        string? search,
        int limit,
        CancellationToken cancellationToken = default);

    Task<List<SubjectLookupDto>> SearchSubjectsAsync(
        string? search,
        int limit,
        CancellationToken cancellationToken = default);
}