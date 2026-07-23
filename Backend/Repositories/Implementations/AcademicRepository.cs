using SMS.Api.Data;
using SMS.Api.Dtos.Academic;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace SMS.Api.Repositories.Implementations;

public class AcademicRepository : IAcademicRepository
{
    private readonly AppDbContext _context;

    public AcademicRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedAcademicResultDto> GetAllAsync(
        AcademicFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        int pageNumber = filter.PageNumber < 1
            ? 1
            : filter.PageNumber;

        int pageSize = filter.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => filter.PageSize
        };

        IQueryable<AcademicClassGrade> query =
            _context.AcademicClassGrades.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            string search = filter.Search.Trim();

            query = query.Where(x =>
                x.ClassGradeName.Contains(search));
        }

        string sortBy = filter.SortBy.Trim().ToLowerInvariant();
        bool descending =
            filter.SortOrder.Equals(
                "desc",
                StringComparison.OrdinalIgnoreCase);

        query = sortBy switch
        {
            "classname" or "classgradename" =>
                descending
                    ? query.OrderByDescending(x => x.ClassGradeName)
                    : query.OrderBy(x => x.ClassGradeName),

            "createdat" =>
                descending
                    ? query.OrderByDescending(x => x.CreatedAt)
                    : query.OrderBy(x => x.CreatedAt),

            _ =>
                descending
                    ? query.OrderByDescending(x => x.DisplayOrder)
                    : query.OrderBy(x => x.DisplayOrder)
        };

        int totalRecords =
            await query.CountAsync(cancellationToken);

        List<AcademicClassGrade> classes =
            await query
                .Include(x => x.Sections)
                .Include(x => x.ClassSubjects)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsSplitQuery()
                .ToListAsync(cancellationToken);

        List<long> teacherIds = classes
            .SelectMany(x => x.Sections)
            .Select(x => x.ClassTeacherId)
            .Distinct()
            .ToList();

        List<long> subjectIds = classes
            .SelectMany(x => x.ClassSubjects)
            .Select(x => x.SubjectId)
            .Distinct()
            .ToList();

        Dictionary<long, TeacherLookupDto> teachers =
            await GetTeachersByIdsAsync(
                teacherIds,
                cancellationToken);

        Dictionary<long, SubjectLookupDto> subjects =
            await GetSubjectsByIdsAsync(
                subjectIds,
                cancellationToken);

        List<AcademicClassGradeDto> items = classes
            .Select(x => MapToDto(x, teachers, subjects))
            .ToList();

        return new PagedAcademicResultDto
        {
            Items = items,
            TotalRecords = totalRecords,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = totalRecords == 0
                ? 0
                : (int)Math.Ceiling(
                    totalRecords / (double)pageSize)
        };
    }

    public async Task<AcademicClassGradeDto?> GetByIdAsync(
        long classGradeId,
        CancellationToken cancellationToken = default)
    {
        AcademicClassGrade? classGrade =
            await _context.AcademicClassGrades
                .AsNoTracking()
                .Include(x => x.Sections)
                .Include(x => x.ClassSubjects)
                .AsSplitQuery()
                .FirstOrDefaultAsync(
                    x => x.ClassGradeId == classGradeId,
                    cancellationToken);

        if (classGrade is null)
        {
            return null;
        }

        List<long> teacherIds = classGrade.Sections
            .Select(x => x.ClassTeacherId)
            .Distinct()
            .ToList();

        List<long> subjectIds = classGrade.ClassSubjects
            .Select(x => x.SubjectId)
            .Distinct()
            .ToList();

        Dictionary<long, TeacherLookupDto> teachers =
            await GetTeachersByIdsAsync(
                teacherIds,
                cancellationToken);

        Dictionary<long, SubjectLookupDto> subjects =
            await GetSubjectsByIdsAsync(
                subjectIds,
                cancellationToken);

        return MapToDto(classGrade, teachers, subjects);
    }

    public async Task<long> CreateAsync(
        CreateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        string className = dto.ClassGradeName.Trim();

        ValidateSectionNames(dto.Sections);

        bool duplicateClass =
            await _context.AcademicClassGrades.AnyAsync(
                x => x.ClassGradeName == className,
                cancellationToken);

        if (duplicateClass)
        {
            throw new InvalidOperationException(
                "The class grade already exists.");
        }

        await ValidateTeacherIdsAsync(
            dto.Sections.Select(x => x.ClassTeacherId),
            cancellationToken);

        await ValidateSubjectIdsAsync(
            dto.SubjectIds,
            cancellationToken);

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            var classGrade = new AcademicClassGrade
            {
                ClassGradeName = className,
                DisplayOrder = dto.DisplayOrder,
                Status = true,
                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            foreach (CreateAcademicSectionDto sectionDto
                     in dto.Sections)
            {
                classGrade.Sections.Add(new AcademicSection
                {
                    SectionName =
                        sectionDto.SectionName.Trim(),

                    ClassTeacherId =
                        sectionDto.ClassTeacherId,

                    DisplayOrder =
                        sectionDto.DisplayOrder,

                    Status = true,
                    IsDeleted = false,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow
                });
            }

            foreach (long subjectId in
                     dto.SubjectIds.Distinct())
            {
                classGrade.ClassSubjects.Add(
                    new AcademicClassSubject
                    {
                        SubjectId = subjectId,
                        IsDeleted = false,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow
                    });
            }

            _context.AcademicClassGrades.Add(classGrade);

            await _context.SaveChangesAsync(
                cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);

            return classGrade.ClassGradeId;
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }

    public async Task<bool> UpdateAsync(
        long classGradeId,
        UpdateAcademicClassGradeDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        AcademicClassGrade? classGrade =
            await _context.AcademicClassGrades
                .Include(x => x.Sections)
                .Include(x => x.ClassSubjects)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(
                    x => x.ClassGradeId == classGradeId &&
                         !x.IsDeleted,
                    cancellationToken);

        if (classGrade is null)
        {
            return false;
        }

        string className = dto.ClassGradeName.Trim();

        ValidateSectionNames(dto.Sections);

        bool duplicateClass =
            await _context.AcademicClassGrades.AnyAsync(
                x => x.ClassGradeName == className &&
                     x.ClassGradeId != classGradeId,
                cancellationToken);

        if (duplicateClass)
        {
            throw new InvalidOperationException(
                "Another class grade already uses this name.");
        }

        await ValidateTeacherIdsAsync(
            dto.Sections.Select(x => x.ClassTeacherId),
            cancellationToken);

        await ValidateSubjectIdsAsync(
            dto.SubjectIds,
            cancellationToken);

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        try
        {
            classGrade.ClassGradeName = className;
            classGrade.DisplayOrder = dto.DisplayOrder;
            classGrade.Status = dto.Status;
            classGrade.UpdatedBy = userId;
            classGrade.UpdatedAt = DateTime.UtcNow;

            HashSet<long> receivedSectionIds = dto.Sections
                .Where(x => x.SectionId.HasValue)
                .Select(x => x.SectionId!.Value)
                .ToHashSet();

            foreach (AcademicSection existingSection
                     in classGrade.Sections)
            {
                if (!receivedSectionIds.Contains(
                        existingSection.SectionId))
                {
                    existingSection.IsDeleted = true;
                    existingSection.Status = false;
                    existingSection.UpdatedBy = userId;
                    existingSection.UpdatedAt = DateTime.UtcNow;
                }
            }

            foreach (UpdateAcademicSectionItemDto sectionDto
                     in dto.Sections)
            {
                if (sectionDto.SectionId.HasValue)
                {
                    AcademicSection? existingSection =
                        classGrade.Sections.FirstOrDefault(x =>
                            x.SectionId ==
                            sectionDto.SectionId.Value);

                    if (existingSection is null)
                    {
                        throw new InvalidOperationException(
                            $"Section ID {sectionDto.SectionId.Value} " +
                            "does not belong to this class.");
                    }

                    existingSection.SectionName =
                        sectionDto.SectionName.Trim();

                    existingSection.ClassTeacherId =
                        sectionDto.ClassTeacherId;

                    existingSection.DisplayOrder =
                        sectionDto.DisplayOrder;

                    existingSection.Status =
                        sectionDto.Status;

                    existingSection.IsDeleted = false;
                    existingSection.UpdatedBy = userId;
                    existingSection.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    classGrade.Sections.Add(
                        new AcademicSection
                        {
                            SectionName =
                                sectionDto.SectionName.Trim(),

                            ClassTeacherId =
                                sectionDto.ClassTeacherId,

                            DisplayOrder =
                                sectionDto.DisplayOrder,

                            Status =
                                sectionDto.Status,

                            IsDeleted = false,
                            CreatedBy = userId,
                            CreatedAt = DateTime.UtcNow
                        });
                }
            }

            HashSet<long> receivedSubjectIds =
                dto.SubjectIds.Distinct().ToHashSet();

            foreach (AcademicClassSubject existingSubject
                     in classGrade.ClassSubjects)
            {
                existingSubject.IsDeleted =
                    !receivedSubjectIds.Contains(
                        existingSubject.SubjectId);
            }

            HashSet<long> existingSubjectIds =
                classGrade.ClassSubjects
                    .Select(x => x.SubjectId)
                    .ToHashSet();

            foreach (long subjectId in
                     receivedSubjectIds.Except(
                         existingSubjectIds))
            {
                classGrade.ClassSubjects.Add(
                    new AcademicClassSubject
                    {
                        SubjectId = subjectId,
                        IsDeleted = false,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow
                    });
            }

            await _context.SaveChangesAsync(
                cancellationToken);

            await transaction.CommitAsync(
                cancellationToken);

            return true;
        }
        catch
        {
            await transaction.RollbackAsync(
                cancellationToken);

            throw;
        }
    }

    public async Task<bool> DeleteAsync(
        long classGradeId,
        long userId,
        CancellationToken cancellationToken = default)
    {
        AcademicClassGrade? classGrade =
            await _context.AcademicClassGrades
                .Include(x => x.Sections)
                .Include(x => x.ClassSubjects)
                .FirstOrDefaultAsync(
                    x => x.ClassGradeId == classGradeId,
                    cancellationToken);

        if (classGrade is null)
        {
            return false;
        }

        classGrade.IsDeleted = true;
        classGrade.Status = false;
        classGrade.UpdatedBy = userId;
        classGrade.UpdatedAt = DateTime.UtcNow;

        foreach (AcademicSection section in classGrade.Sections)
        {
            section.IsDeleted = true;
            section.Status = false;
            section.UpdatedBy = userId;
            section.UpdatedAt = DateTime.UtcNow;
        }

        foreach (AcademicClassSubject subject
                 in classGrade.ClassSubjects)
        {
            subject.IsDeleted = true;
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<long> AddSectionAsync(
        long classGradeId,
        CreateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        bool classExists =
            await _context.AcademicClassGrades.AnyAsync(
                x => x.ClassGradeId == classGradeId,
                cancellationToken);

        if (!classExists)
        {
            throw new KeyNotFoundException(
                "Academic class grade was not found.");
        }

        await ValidateTeacherIdsAsync(
            [dto.ClassTeacherId],
            cancellationToken);

        string sectionName = dto.SectionName.Trim();

        bool duplicateSection =
            await _context.AcademicSections.AnyAsync(
                x => x.ClassGradeId == classGradeId &&
                     x.SectionName == sectionName,
                cancellationToken);

        if (duplicateSection)
        {
            throw new InvalidOperationException(
                "The section already exists in this class.");
        }

        var section = new AcademicSection
        {
            ClassGradeId = classGradeId,
            SectionName = sectionName,
            ClassTeacherId = dto.ClassTeacherId,
            DisplayOrder = dto.DisplayOrder,
            Status = true,
            IsDeleted = false,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.AcademicSections.Add(section);

        await _context.SaveChangesAsync(
            cancellationToken);

        return section.SectionId;
    }

    public async Task<bool> UpdateSectionAsync(
        long sectionId,
        UpdateAcademicSectionDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        AcademicSection? section =
            await _context.AcademicSections
                .FirstOrDefaultAsync(
                    x => x.SectionId == sectionId,
                    cancellationToken);

        if (section is null)
        {
            return false;
        }

        await ValidateTeacherIdsAsync(
            [dto.ClassTeacherId],
            cancellationToken);

        string sectionName = dto.SectionName.Trim();

        bool duplicateSection =
            await _context.AcademicSections.AnyAsync(
                x => x.ClassGradeId == section.ClassGradeId &&
                     x.SectionName == sectionName &&
                     x.SectionId != sectionId,
                cancellationToken);

        if (duplicateSection)
        {
            throw new InvalidOperationException(
                "Another section already uses this name.");
        }

        section.SectionName = sectionName;
        section.ClassTeacherId = dto.ClassTeacherId;
        section.DisplayOrder = dto.DisplayOrder;
        section.Status = dto.Status;
        section.UpdatedBy = userId;
        section.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<bool> DeleteSectionAsync(
        long sectionId,
        long userId,
        CancellationToken cancellationToken = default)
    {
        AcademicSection? section =
            await _context.AcademicSections
                .FirstOrDefaultAsync(
                    x => x.SectionId == sectionId,
                    cancellationToken);

        if (section is null)
        {
            return false;
        }

        section.IsDeleted = true;
        section.Status = false;
        section.UpdatedBy = userId;
        section.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task AddSubjectsAsync(
        long classGradeId,
        AddClassSubjectsDto dto,
        long userId,
        CancellationToken cancellationToken = default)
    {
        bool classExists =
            await _context.AcademicClassGrades.AnyAsync(
                x => x.ClassGradeId == classGradeId,
                cancellationToken);

        if (!classExists)
        {
            throw new KeyNotFoundException(
                "Academic class grade was not found.");
        }

        List<long> subjectIds =
            dto.SubjectIds.Distinct().ToList();

        await ValidateSubjectIdsAsync(
            subjectIds,
            cancellationToken);

        List<AcademicClassSubject> existingSubjects =
            await _context.AcademicClassSubjects
                .IgnoreQueryFilters()
                .Where(x =>
                    x.ClassGradeId == classGradeId &&
                    subjectIds.Contains(x.SubjectId))
                .ToListAsync(cancellationToken);

        foreach (long subjectId in subjectIds)
        {
            AcademicClassSubject? existing =
                existingSubjects.FirstOrDefault(
                    x => x.SubjectId == subjectId);

            if (existing is not null)
            {
                existing.IsDeleted = false;
            }
            else
            {
                _context.AcademicClassSubjects.Add(
                    new AcademicClassSubject
                    {
                        ClassGradeId = classGradeId,
                        SubjectId = subjectId,
                        IsDeleted = false,
                        CreatedBy = userId,
                        CreatedAt = DateTime.UtcNow
                    });
            }
        }

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task<bool> RemoveSubjectAsync(
        long classGradeId,
        long subjectId,
        CancellationToken cancellationToken = default)
    {
        AcademicClassSubject? classSubject =
            await _context.AcademicClassSubjects
                .FirstOrDefaultAsync(
                    x => x.ClassGradeId == classGradeId &&
                         x.SubjectId == subjectId,
                    cancellationToken);

        if (classSubject is null)
        {
            return false;
        }

        classSubject.IsDeleted = true;

        await _context.SaveChangesAsync(
            cancellationToken);

        return true;
    }

    public async Task<List<TeacherLookupDto>>
        SearchTeachersAsync(
            string? search,
            int limit,
            CancellationToken cancellationToken = default)
    {
        int safeLimit = Math.Clamp(limit, 1, 100);

        string searchValue =
            $"%{search?.Trim() ?? string.Empty}%";

        var searchParameter =
            new MySqlParameter(
                "@search",
                searchValue);

        var limitParameter =
            new MySqlParameter(
                "@limit",
                safeLimit);

        const string sql = """
            SELECT
                staff_id AS StaffId,
                employee_code AS EmployeeCode,
                staff_name AS TeacherName,
                designation AS Designation,
                specialization AS Specialization
            FROM staff
            WHERE is_deleted = 0
              AND status = 1
              AND (
                    staff_name LIKE @search
                    OR employee_code LIKE @search
                  )
            ORDER BY staff_name
            LIMIT @limit
            """;

        return await _context.Database
            .SqlQueryRaw<TeacherLookupDto>(
                sql,
                searchParameter,
                limitParameter)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SubjectLookupDto>>
        SearchSubjectsAsync(
            string? search,
            int limit,
            CancellationToken cancellationToken = default)
    {
        int safeLimit = Math.Clamp(limit, 1, 100);

        string searchValue =
            $"%{search?.Trim() ?? string.Empty}%";

        var searchParameter =
            new MySqlParameter(
                "@search",
                searchValue);

        var limitParameter =
            new MySqlParameter(
                "@limit",
                safeLimit);

        const string sql = """
            SELECT
                subject_id AS SubjectId,
                subject_code AS SubjectCode,
                subject_name AS SubjectName
            FROM subjects
            WHERE is_deleted = 0
              AND status = 1
              AND (
                    subject_name LIKE @search
                    OR subject_code LIKE @search
                  )
            ORDER BY subject_name
            LIMIT @limit
            """;

        return await _context.Database
            .SqlQueryRaw<SubjectLookupDto>(
                sql,
                searchParameter,
                limitParameter)
            .ToListAsync(cancellationToken);
    }

    private async Task ValidateTeacherIdsAsync(
        IEnumerable<long> teacherIds,
        CancellationToken cancellationToken)
    {
        List<long> ids = teacherIds
            .Distinct()
            .ToList();

        if (ids.Count == 0)
        {
            throw new InvalidOperationException(
                "At least one class teacher is required.");
        }

        string joinedIds = string.Join(",", ids);

        string sql = $"""
            SELECT
                staff_id AS StaffId,
                employee_code AS EmployeeCode,
                staff_name AS TeacherName,
                designation AS Designation,
                specialization AS Specialization
            FROM staff
            WHERE is_deleted = 0
              AND status = 1
              AND staff_id IN ({joinedIds})
            """;

        List<TeacherLookupDto> teachers =
            await _context.Database
                .SqlQueryRaw<TeacherLookupDto>(sql)
                .ToListAsync(cancellationToken);

        if (teachers.Count != ids.Count)
        {
            throw new InvalidOperationException(
                "One or more selected teachers are invalid or inactive.");
        }
    }

    private async Task ValidateSubjectIdsAsync(
        IEnumerable<long> subjectIds,
        CancellationToken cancellationToken)
    {
        List<long> ids = subjectIds
            .Distinct()
            .ToList();

        if (ids.Count == 0)
        {
            throw new InvalidOperationException(
                "At least one subject is required.");
        }

        string joinedIds = string.Join(",", ids);

        string sql = $"""
            SELECT
                subject_id AS SubjectId,
                subject_code AS SubjectCode,
                subject_name AS SubjectName
            FROM subjects
            WHERE is_deleted = 0
              AND status = 1
              AND subject_id IN ({joinedIds})
            """;

        List<SubjectLookupDto> subjects =
            await _context.Database
                .SqlQueryRaw<SubjectLookupDto>(sql)
                .ToListAsync(cancellationToken);

        if (subjects.Count != ids.Count)
        {
            throw new InvalidOperationException(
                "One or more selected subjects are invalid or inactive.");
        }
    }

    private async Task<Dictionary<long, TeacherLookupDto>>
        GetTeachersByIdsAsync(
            List<long> teacherIds,
            CancellationToken cancellationToken)
    {
        if (teacherIds.Count == 0)
        {
            return new Dictionary<long, TeacherLookupDto>();
        }

        string joinedIds = string.Join(",", teacherIds);

        string sql = $"""
            SELECT
                staff_id AS StaffId,
                employee_code AS EmployeeCode,
                staff_name AS TeacherName,
                designation AS Designation,
                specialization AS Specialization
            FROM staff
            WHERE staff_id IN ({joinedIds})
            """;

        List<TeacherLookupDto> teachers =
            await _context.Database
                .SqlQueryRaw<TeacherLookupDto>(sql)
                .ToListAsync(cancellationToken);

        return teachers.ToDictionary(x => x.StaffId);
    }

    private async Task<Dictionary<long, SubjectLookupDto>>
        GetSubjectsByIdsAsync(
            List<long> subjectIds,
            CancellationToken cancellationToken)
    {
        if (subjectIds.Count == 0)
        {
            return new Dictionary<long, SubjectLookupDto>();
        }

        string joinedIds = string.Join(",", subjectIds);

        string sql = $"""
            SELECT
                subject_id AS SubjectId,
                subject_code AS SubjectCode,
                subject_name AS SubjectName
            FROM subjects
            WHERE subject_id IN ({joinedIds})
            """;

        List<SubjectLookupDto> subjects =
            await _context.Database
                .SqlQueryRaw<SubjectLookupDto>(sql)
                .ToListAsync(cancellationToken);

        return subjects.ToDictionary(x => x.SubjectId);
    }

    private static AcademicClassGradeDto MapToDto(
        AcademicClassGrade classGrade,
        IReadOnlyDictionary<long, TeacherLookupDto> teachers,
        IReadOnlyDictionary<long, SubjectLookupDto> subjects)
    {
        return new AcademicClassGradeDto
        {
            ClassGradeId = classGrade.ClassGradeId,
            ClassGradeName = classGrade.ClassGradeName,
            DisplayOrder = classGrade.DisplayOrder,
            Status = classGrade.Status,

            TotalSections = classGrade.Sections.Count(
                x => !x.IsDeleted),

            Sections = classGrade.Sections
                .Where(x => !x.IsDeleted)
                .OrderBy(x => x.DisplayOrder)
                .ThenBy(x => x.SectionName)
                .Select(section =>
                {
                    teachers.TryGetValue(
                        section.ClassTeacherId,
                        out TeacherLookupDto? teacher);

                    return new AcademicSectionDto
                    {
                        SectionId = section.SectionId,
                        SectionName = section.SectionName,
                        ClassTeacherId =
                            section.ClassTeacherId,

                        TeacherName =
                            teacher?.TeacherName ??
                            "Unknown teacher",

                        EmployeeCode =
                            teacher?.EmployeeCode ??
                            string.Empty,

                        DisplayOrder =
                            section.DisplayOrder,

                        Status = section.Status
                    };
                })
                .ToList(),

            Subjects = classGrade.ClassSubjects
                .Where(x => !x.IsDeleted)
                .Select(x =>
                {
                    subjects.TryGetValue(
                        x.SubjectId,
                        out SubjectLookupDto? subject);

                    return new AcademicSubjectDto
                    {
                        SubjectId = x.SubjectId,
                        SubjectCode =
                            subject?.SubjectCode ??
                            string.Empty,

                        SubjectName =
                            subject?.SubjectName ??
                            "Unknown subject"
                    };
                })
                .OrderBy(x => x.SubjectName)
                .ToList()
        };
    }

    private static void ValidateSectionNames(
        IEnumerable<CreateAcademicSectionDto> sections)
    {
        List<string> names = sections
            .Select(x => x.SectionName.Trim())
            .ToList();

        if (names.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidOperationException(
                "Section name cannot be empty.");
        }

        bool duplicate = names
            .GroupBy(
                x => x,
                StringComparer.OrdinalIgnoreCase)
            .Any(x => x.Count() > 1);

        if (duplicate)
        {
            throw new InvalidOperationException(
                "Duplicate section names are not allowed.");
        }
    }

    private static void ValidateSectionNames(
        IEnumerable<UpdateAcademicSectionItemDto> sections)
    {
        List<string> names = sections
            .Select(x => x.SectionName.Trim())
            .ToList();

        if (names.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidOperationException(
                "Section name cannot be empty.");
        }

        bool duplicate = names
            .GroupBy(
                x => x,
                StringComparer.OrdinalIgnoreCase)
            .Any(x => x.Count() > 1);

        if (duplicate)
        {
            throw new InvalidOperationException(
                "Duplicate section names are not allowed.");
        }
    }
}