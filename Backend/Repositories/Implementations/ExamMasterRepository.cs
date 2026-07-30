using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Examination.ExamMaster;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class ExamMasterRepository : IExamMasterRepository
    {
        private readonly AppDbContext _context;

        public ExamMasterRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedExamMasterDto> GetAllAsync(
            ExamMasterFilterDto filter)
        {
            var query = _context.ExamMasters
                .AsNoTracking()
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var search = filter.Search.Trim();

                query = query.Where(x =>
                    x.ExamTitle.Contains(search) ||
                    x.ExamType.Contains(search) ||
                    x.ExamStatus.Contains(search));
            }

            if (filter.BranchId.HasValue)
            {
                query = query.Where(x =>
                    x.BranchId == filter.BranchId.Value);
            }

            if (filter.AcademicYearId.HasValue)
            {
                query = query.Where(x =>
                    x.AcademicYearId ==
                    filter.AcademicYearId.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.ExamType))
            {
                query = query.Where(x =>
                    x.ExamType == filter.ExamType);
            }

            if (!string.IsNullOrWhiteSpace(filter.ExamStatus))
            {
                query = query.Where(x =>
                    x.ExamStatus == filter.ExamStatus);
            }

            var totalRecords = await query.CountAsync();

            query = ApplySorting(
                query,
                filter.SortBy,
                filter.SortOrder);

            var exams = await query
                .Skip(
                    (filter.PageNumber - 1) *
                    filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new
                {
                    x.ExamId,
                    x.ExamTitle,
                    x.ExamType,
                    x.ExamStatus,
                    x.BranchId,
                    x.AcademicYearId,
                    x.StartDate,
                    x.EndDate,
                    x.CreatedAt,
                    x.UpdatedAt
                })
                .ToListAsync();

            var examIds = exams
                .Select(x => x.ExamId)
                .ToList();

            var classMappings = await _context.ExamClasses
                .AsNoTracking()
                .Where(x => examIds.Contains(x.ExamId))
                .Select(x => new
                {
                    x.ExamId,
                    x.ClassId,
                    ClassName = x.Class.ClassName
                })
                .ToListAsync();

            var items = exams.Select(x =>
            {
                var classes = classMappings
                    .Where(c => c.ExamId == x.ExamId)
                    .Select(c => new ExamClassDto
                    {
                        ClassId = c.ClassId,
                        ClassName = c.ClassName ?? ""
                    })
                    .ToList();

                return new ExamMasterDto
                {
                    ExamId = x.ExamId,
                    ExamTitle = x.ExamTitle,
                    ExamType = x.ExamType,
                    ExamStatus = x.ExamStatus,
                    BranchId = x.BranchId,
                    AcademicYearId = x.AcademicYearId,
                    StartDate = x.StartDate,
                    EndDate = x.EndDate,
                    ApplicableClasses = classes,
                    ApplicableClassCount = classes.Count,
                    ScheduledSubjectCount = 0,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                };
            }).ToList();

            return new PagedExamMasterDto
            {
                Items = items,
                TotalRecords = totalRecords,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(
                    totalRecords / (double)filter.PageSize)
            };
        }

        public async Task<ExamMasterDto?> GetByIdAsync(
            long examId)
        {
            var exam = await _context.ExamMasters
                .AsNoTracking()
                .Where(x =>
                    x.ExamId == examId &&
                    !x.IsDeleted)
                .Select(x => new
                {
                    x.ExamId,
                    x.ExamTitle,
                    x.ExamType,
                    x.ExamStatus,
                    x.BranchId,
                    x.AcademicYearId,
                    x.StartDate,
                    x.EndDate,
                    x.CreatedAt,
                    x.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (exam == null)
            {
                return null;
            }

            var classes = await _context.ExamClasses
                .AsNoTracking()
                .Where(x => x.ExamId == examId)
                .OrderBy(x => x.Class.ClassName)
                .Select(x => new ExamClassDto
                {
                    ClassId = x.ClassId,
                    ClassName = x.Class != null ? (x.Class.ClassName ?? "") : ""
                })
                .ToListAsync();

            return new ExamMasterDto
            {
                ExamId = exam.ExamId,
                ExamTitle = exam.ExamTitle,
                ExamType = exam.ExamType,
                ExamStatus = exam.ExamStatus,
                BranchId = exam.BranchId,
                AcademicYearId = exam.AcademicYearId,
                StartDate = exam.StartDate,
                EndDate = exam.EndDate,
                ApplicableClasses = classes,
                ApplicableClassCount = classes.Count,
                ScheduledSubjectCount = 0,
                CreatedAt = exam.CreatedAt,
                UpdatedAt = exam.UpdatedAt
            };
        }

        public async Task<long> CreateAsync(
            CreateExamMasterDto dto,
            long? userId)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var exam = new ExamMaster
                {
                    ExamTitle = dto.ExamTitle.Trim(),
                    ExamType = dto.ExamType.Trim(),
                    ExamStatus = dto.ExamStatus.Trim(),
                    BranchId = dto.BranchId,
                    AcademicYearId = dto.AcademicYearId,
                    StartDate = dto.StartDate,
                    EndDate = dto.EndDate,
                    IsDeleted = false,
                    CreatedBy = userId,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.ExamMasters.AddAsync(exam);
                await _context.SaveChangesAsync();

                var mappings = dto.ClassIds
                    .Distinct()
                    .Select(classId => new ExamClass
                    {
                        ExamId = exam.ExamId,
                        ClassId = classId
                    });

                await _context.ExamClasses.AddRangeAsync(mappings);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return exam.ExamId;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateAsync(
            long examId,
            UpdateExamMasterDto dto,
            long? userId)
        {
            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var exam = await _context.ExamMasters
                    .FirstOrDefaultAsync(x =>
                        x.ExamId == examId &&
                        !x.IsDeleted);

                if (exam == null)
                {
                    return false;
                }

                exam.ExamTitle = dto.ExamTitle.Trim();
                exam.ExamType = dto.ExamType.Trim();
                exam.ExamStatus = dto.ExamStatus.Trim();
                exam.BranchId = dto.BranchId;
                exam.AcademicYearId = dto.AcademicYearId;
                exam.StartDate = dto.StartDate;
                exam.EndDate = dto.EndDate;
                exam.UpdatedBy = userId;
                exam.UpdatedAt = DateTime.UtcNow;

                var existingMappings =
                    await _context.ExamClasses
                        .Where(x => x.ExamId == examId)
                        .ToListAsync();

                _context.ExamClasses.RemoveRange(
                    existingMappings);

                var newMappings = dto.ClassIds
                    .Distinct()
                    .Select(classId => new ExamClass
                    {
                        ExamId = examId,
                        ClassId = classId
                    });

                await _context.ExamClasses
                    .AddRangeAsync(newMappings);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteAsync(
            long examId,
            long? userId)
        {
            var exam = await _context.ExamMasters
                .FirstOrDefaultAsync(x =>
                    x.ExamId == examId &&
                    !x.IsDeleted);

            if (exam == null)
            {
                return false;
            }

            exam.IsDeleted = true;
            exam.ExamStatus = "Cancelled";
            exam.UpdatedBy = userId;
            exam.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ExistsByTitleAsync(
            string examTitle,
            long branchId,
            long academicYearId,
            long? excludeExamId = null)
        {
            var normalizedTitle = examTitle.Trim();

            return await _context.ExamMasters.AnyAsync(x =>
                !x.IsDeleted &&
                x.ExamTitle == normalizedTitle &&
                x.BranchId == branchId &&
                x.AcademicYearId == academicYearId &&
                (!excludeExamId.HasValue ||
                 x.ExamId != excludeExamId.Value));
        }

        public async Task<bool> BranchExistsAsync(long branchId)
        {
            return await _context.Branches.AnyAsync(x =>
                x.BranchId == branchId);
        }

        public async Task<bool> ClassesExistAsync(
            IEnumerable<int> classIds)
        {
            var distinctIds = classIds
                .Distinct()
                .ToList();

            var existingCount = await _context.Classes
                .CountAsync(x =>
                    distinctIds.Contains(x.ClassId));

            return existingCount == distinctIds.Count;
        }

        public async Task<IEnumerable<ExamMasterDropdownDto>>
            GetDropdownAsync(
                long? branchId,
                long? academicYearId)
        {
            var query = _context.ExamMasters
                .AsNoTracking()
                .Where(x => !x.IsDeleted);

            if (branchId.HasValue)
            {
                query = query.Where(x =>
                    x.BranchId == branchId.Value);
            }

            if (academicYearId.HasValue)
            {
                query = query.Where(x =>
                    x.AcademicYearId ==
                    academicYearId.Value);
            }

            return await query
                .OrderByDescending(x => x.StartDate)
                .ThenBy(x => x.ExamTitle)
                .Select(x => new ExamMasterDropdownDto
                {
                    Id = x.ExamId,
                    Name = x.ExamTitle,
                    ExamType = x.ExamType,
                    ExamStatus = x.ExamStatus
                })
                .ToListAsync();
        }

        private static IQueryable<ExamMaster> ApplySorting(
            IQueryable<ExamMaster> query,
            string? sortBy,
            string? sortOrder)
        {
            var descending = string.Equals(
                sortOrder,
                "desc",
                StringComparison.OrdinalIgnoreCase);

            return sortBy?.Trim().ToLower() switch
            {
                "examtitle" => descending
                    ? query.OrderByDescending(x => x.ExamTitle)
                    : query.OrderBy(x => x.ExamTitle),

                "examtype" => descending
                    ? query.OrderByDescending(x => x.ExamType)
                    : query.OrderBy(x => x.ExamType),

                "examstatus" => descending
                    ? query.OrderByDescending(x => x.ExamStatus)
                    : query.OrderBy(x => x.ExamStatus),

                "enddate" => descending
                    ? query.OrderByDescending(x => x.EndDate)
                    : query.OrderBy(x => x.EndDate),

                "createdat" => descending
                    ? query.OrderByDescending(x => x.CreatedAt)
                    : query.OrderBy(x => x.CreatedAt),

                _ => descending
                    ? query.OrderByDescending(x => x.StartDate)
                    : query.OrderBy(x => x.StartDate)
            };
        }
    }
}