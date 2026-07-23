using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Subject;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class SubjectRepository : ISubjectRepository
    {
        private readonly AppDbContext _context;

        public SubjectRepository(AppDbContext context)
        {
            _context = context;
        }

        //---------------------------------------------------
        // Get All Subjects
        //---------------------------------------------------

        public async Task<IEnumerable<SubjectDto>> GetAllAsync(SubjectFilterDto filter)
        {
            var query = _context.Subjects
                .Where(x => !x.IsDeleted)
                .AsQueryable();

            // Search
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                query = query.Where(x =>
                    x.SubjectCode.Contains(filter.Search) ||
                    x.SubjectName.Contains(filter.Search) ||
                    x.CourseCode.Contains(filter.Search));
            }

            // Sorting
            query = filter.SortBy?.ToLower() switch
            {
                "subjectcode" => filter.SortOrder == "desc"
                    ? query.OrderByDescending(x => x.SubjectCode)
                    : query.OrderBy(x => x.SubjectCode),

                "subjectname" => filter.SortOrder == "desc"
                    ? query.OrderByDescending(x => x.SubjectName)
                    : query.OrderBy(x => x.SubjectName),

                "coursecode" => filter.SortOrder == "desc"
                    ? query.OrderByDescending(x => x.CourseCode)
                    : query.OrderBy(x => x.CourseCode),

                _ => query.OrderByDescending(x => x.SubjectId)
            };

            // Pagination
            query = query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize);

            return await query
                .Select(x => new SubjectDto
                {
                    SubjectId = x.SubjectId,
                    SubjectCode = x.SubjectCode,
                    SubjectName = x.SubjectName,
                    CourseCode = x.CourseCode
                })
                .ToListAsync();
        }

        //---------------------------------------------------
        // Get Subject By Id
        //---------------------------------------------------

        public async Task<SubjectDto?> GetByIdAsync(long id)
        {
            return await _context.Subjects
                .Where(x => x.SubjectId == id && !x.IsDeleted)
                .Select(x => new SubjectDto
                {
                    SubjectId = x.SubjectId,
                    SubjectCode = x.SubjectCode,
                    SubjectName = x.SubjectName,
                    CourseCode = x.CourseCode
                })
                .FirstOrDefaultAsync();
        }

        //---------------------------------------------------
        // Create Subject
        //---------------------------------------------------

        public async Task<long> CreateAsync(CreateSubjectDto dto, long createdBy)
        {
            var subject = new Subject
            {
                SubjectCode = dto.SubjectCode,
                SubjectName = dto.SubjectName,
                CourseCode = dto.CourseCode,
                CreatedBy = createdBy,
                CreatedDate = DateTime.UtcNow,
                IsDeleted = false
            };

            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();

            return subject.SubjectId;
        }

        //---------------------------------------------------
        // Update Subject
        //---------------------------------------------------

        public async Task<bool> UpdateAsync(long id, UpdateSubjectDto dto, long modifiedBy)
        {
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(x => x.SubjectId == id && !x.IsDeleted);

            if (subject == null)
                return false;

            subject.SubjectCode = dto.SubjectCode;
            subject.SubjectName = dto.SubjectName;
            subject.CourseCode = dto.CourseCode;
            subject.ModifiedBy = modifiedBy;
            subject.ModifiedDate = DateTime.UtcNow;

            _context.Subjects.Update(subject);

            return await _context.SaveChangesAsync() > 0;
        }

        //---------------------------------------------------
        // Delete Subject (Soft Delete)
        //---------------------------------------------------

        public async Task<bool> DeleteAsync(long id, long modifiedBy)
        {
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(x => x.SubjectId == id && !x.IsDeleted);

            if (subject == null)
                return false;

            subject.IsDeleted = true;
            subject.ModifiedBy = modifiedBy;
            subject.ModifiedDate = DateTime.UtcNow;

            _context.Subjects.Update(subject);

            return await _context.SaveChangesAsync() > 0;
        }

        //---------------------------------------------------
        // Duplicate Subject Code
        //---------------------------------------------------

        public async Task<bool> SubjectCodeExistsAsync(string subjectCode, long? excludeId = null)
        {
            return await _context.Subjects.AnyAsync(x =>
                x.SubjectCode == subjectCode &&
                !x.IsDeleted &&
                (!excludeId.HasValue || x.SubjectId != excludeId.Value));
        }

        //---------------------------------------------------
        // Duplicate Course Code
        //---------------------------------------------------

        public async Task<bool> CourseCodeExistsAsync(string courseCode, long? excludeId = null)
        {
            return await _context.Subjects.AnyAsync(x =>
                x.CourseCode == courseCode &&
                !x.IsDeleted &&
                (!excludeId.HasValue || x.SubjectId != excludeId.Value));
        }
        //---------------------------------------------------
        // Next Subject Code
        //---------------------------------------------------

        public async Task<string> GetNextSubjectCodeAsync()
        {
            var lastSubject = await _context.Subjects
                .Where(x => !x.IsDeleted)
                .OrderByDescending(x => x.SubjectId)
                .FirstOrDefaultAsync();

            if (lastSubject == null)
                return "SUB-001";

            if (string.IsNullOrWhiteSpace(lastSubject.SubjectCode))
                return "SUB-001";

            var number = lastSubject.SubjectCode.Replace("SUB-", "");

            if (!int.TryParse(number, out int next))
                return "SUB-001";

            next++;

            return $"SUB-{next:D3}";
        }
    }
}