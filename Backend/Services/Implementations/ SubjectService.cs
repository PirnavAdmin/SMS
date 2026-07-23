using SMS.Api.Dtos.Subject;
using SMS.Api.Exceptions;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class SubjectService : ISubjectService
    {
        private readonly ISubjectRepository _repository;

        public SubjectService(ISubjectRepository repository)
        {
            _repository = repository;
        }

        //---------------------------------------------------
        // Get All
        //---------------------------------------------------

        public async Task<IEnumerable<SubjectDto>> GetAllAsync(
            SubjectFilterDto filter)
        {
            if (filter.PageNumber <= 0)
                filter.PageNumber = 1;

            if (filter.PageSize <= 0)
                filter.PageSize = 10;

            if (filter.PageSize > 100)
                filter.PageSize = 100;

            return await _repository.GetAllAsync(filter);
        }

        //---------------------------------------------------
        // Get By Id
        //---------------------------------------------------

        public async Task<SubjectDto?> GetByIdAsync(long id)
        {
            if (id <= 0)
                throw new AppException("Invalid Subject Id");

            return await _repository.GetByIdAsync(id);
        }

        //---------------------------------------------------
        // Create
        //---------------------------------------------------

        public async Task<long> CreateAsync(
            CreateSubjectDto dto,
            long createdBy)
        {
            if (string.IsNullOrWhiteSpace(dto.SubjectCode))
                throw new AppException("Subject Code is required.");

            if (string.IsNullOrWhiteSpace(dto.SubjectName))
                throw new AppException("Subject Name is required.");

            if (string.IsNullOrWhiteSpace(dto.CourseCode))
                throw new AppException("Course Code is required.");

            if (dto.BranchId <= 0)
                throw new AppException("Branch is required.");

            return await _repository.CreateAsync(dto, createdBy);
        }

        //---------------------------------------------------
        // Update
        //---------------------------------------------------

        public async Task<bool> UpdateAsync(
            long id,
            UpdateSubjectDto dto,
            long modifiedBy)
        {
            if (id <= 0)
                throw new AppException("Invalid Subject Id.");

            if (string.IsNullOrWhiteSpace(dto.SubjectCode))
                throw new AppException("Subject Code is required.");

            if (string.IsNullOrWhiteSpace(dto.SubjectName))
                throw new AppException("Subject Name is required.");

            if (string.IsNullOrWhiteSpace(dto.CourseCode))
                throw new AppException("Course Code is required.");

            if (dto.BranchId <= 0)
                throw new AppException("Branch is required.");

            return await _repository.UpdateAsync(id, dto, modifiedBy);
        }

        //---------------------------------------------------
        // Delete
        //---------------------------------------------------

        public async Task<bool> DeleteAsync(
            long id,
            long modifiedBy)
        {
            if (id <= 0)
                throw new AppException("Invalid Subject Id.");

            return await _repository.DeleteAsync(id, modifiedBy);
        }
        //---------------------------------------------------
        // Next Subject Code
        //---------------------------------------------------

        public async Task<string> GetNextSubjectCodeAsync()
        {
            return await _repository.GetNextSubjectCodeAsync();
        }
    }
}