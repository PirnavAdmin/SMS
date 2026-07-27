using SMS.Api.Dtos.Examination.ExamMaster;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IExamMasterRepository
    {
        Task<PagedExamMasterDto> GetAllAsync(
            ExamMasterFilterDto filter);

        Task<ExamMasterDto?> GetByIdAsync(long examId);

        Task<long> CreateAsync(
            CreateExamMasterDto dto,
            long? userId);

        Task<bool> UpdateAsync(
            long examId,
            UpdateExamMasterDto dto,
            long? userId);

        Task<bool> DeleteAsync(
            long examId,
            long? userId);

        Task<bool> ExistsByTitleAsync(
            string examTitle,
            long branchId,
            long academicYearId,
            long? excludeExamId = null);

        Task<bool> BranchExistsAsync(long branchId);

        Task<bool> ClassesExistAsync(
            IEnumerable<int> classIds);

        Task<IEnumerable<ExamMasterDropdownDto>>
            GetDropdownAsync(
                long? branchId,
                long? academicYearId);
    }
}