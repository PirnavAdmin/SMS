using SMS.Api.Dtos.Examination.ExamMaster;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class ExamMasterService : IExamMasterService
    {
        private readonly IExamMasterRepository _repository;

        private static readonly string[] AllowedExamTypes =
        [
            "Unit Test",
            "Weekly Test",
            "Monthly Test",
            "Mid-Term",
            "Quarterly",
            "Half-Yearly",
            "Annual",
            "Practical"
        ];

        private static readonly string[] AllowedStatuses =
        [
            "Draft",
            "Scheduled",
            "Ongoing",
            "Completed",
            "Cancelled"
        ];

        public ExamMasterService(
            IExamMasterRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedExamMasterDto> GetAllAsync(
            ExamMasterFilterDto filter)
        {
            filter.PageNumber =
                filter.PageNumber <= 0
                    ? 1
                    : filter.PageNumber;

            filter.PageSize =
                filter.PageSize <= 0
                    ? 10
                    : Math.Min(filter.PageSize, 100);

            return await _repository.GetAllAsync(filter);
        }

        public async Task<ExamMasterDto?> GetByIdAsync(
            long examId)
        {
            if (examId <= 0)
            {
                throw new ArgumentException(
                    "Invalid exam ID.");
            }

            return await _repository.GetByIdAsync(examId);
        }

        public async Task<long> CreateAsync(
            CreateExamMasterDto dto,
            long? userId)
        {
            await ValidateAsync(
                dto.ExamTitle,
                dto.ExamType,
                dto.ExamStatus,
                dto.BranchId,
                dto.AcademicYearId,
                dto.StartDate,
                dto.EndDate,
                dto.ClassIds);

            if (await _repository.ExistsByTitleAsync(
                dto.ExamTitle,
                dto.BranchId,
                dto.AcademicYearId))
            {
                throw new InvalidOperationException(
                    "An examination with the same title already " +
                    "exists for this branch and academic year.");
            }

            return await _repository.CreateAsync(dto, userId);
        }

        public async Task<bool> UpdateAsync(
            long examId,
            UpdateExamMasterDto dto,
            long? userId)
        {
            if (examId <= 0)
            {
                throw new ArgumentException(
                    "Invalid exam ID.");
            }

            await ValidateAsync(
                dto.ExamTitle,
                dto.ExamType,
                dto.ExamStatus,
                dto.BranchId,
                dto.AcademicYearId,
                dto.StartDate,
                dto.EndDate,
                dto.ClassIds);

            if (await _repository.ExistsByTitleAsync(
                dto.ExamTitle,
                dto.BranchId,
                dto.AcademicYearId,
                examId))
            {
                throw new InvalidOperationException(
                    "An examination with the same title already " +
                    "exists for this branch and academic year.");
            }

            return await _repository.UpdateAsync(
                examId,
                dto,
                userId);
        }

        public async Task<bool> DeleteAsync(
            long examId,
            long? userId)
        {
            if (examId <= 0)
            {
                throw new ArgumentException(
                    "Invalid exam ID.");
            }

            return await _repository.DeleteAsync(
                examId,
                userId);
        }

        public async Task<IEnumerable<ExamMasterDropdownDto>>
            GetDropdownAsync(
                long? branchId,
                long? academicYearId)
        {
            return await _repository.GetDropdownAsync(
                branchId,
                academicYearId);
        }

        private async Task ValidateAsync(
            string examTitle,
            string examType,
            string examStatus,
            long branchId,
            long academicYearId,
            DateOnly startDate,
            DateOnly endDate,
            List<long> classIds)
        {
            if (string.IsNullOrWhiteSpace(examTitle))
            {
                throw new ArgumentException(
                    "Examination title is required.");
            }

            if (!AllowedExamTypes.Any(x =>
                string.Equals(
                    x,
                    examType?.Trim(),
                    StringComparison.OrdinalIgnoreCase)))
            {
                throw new ArgumentException(
                    "Invalid exam type.");
            }

            if (!AllowedStatuses.Any(x =>
                string.Equals(
                    x,
                    examStatus?.Trim(),
                    StringComparison.OrdinalIgnoreCase)))
            {
                throw new ArgumentException(
                    "Invalid exam status.");
            }

            if (branchId <= 0)
            {
                throw new ArgumentException(
                    "Branch is required.");
            }

            if (academicYearId <= 0)
            {
                throw new ArgumentException(
                    "Academic year is required.");
            }

            if (endDate < startDate)
            {
                throw new ArgumentException(
                    "End date cannot be earlier than start date.");
            }

            if (classIds == null || classIds.Count == 0)
            {
                throw new ArgumentException(
                    "Select at least one applicable class.");
            }

            if (classIds.Any(x => x <= 0))
            {
                throw new ArgumentException(
                    "One or more class IDs are invalid.");
            }

            if (!await _repository.BranchExistsAsync(branchId))
            {
                throw new InvalidOperationException(
                    "Selected branch does not exist.");
            }

            if (!await _repository.ClassesExistAsync(classIds))
            {
                throw new InvalidOperationException(
                    "One or more selected classes do not exist.");
            }
        }
    }
}