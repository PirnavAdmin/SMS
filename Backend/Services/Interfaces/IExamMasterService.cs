using SMS.Api.Dtos.Examination.ExamMaster;

namespace SMS.Api.Services.Interfaces
{
    public interface IExamMasterService
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

        Task<IEnumerable<ExamMasterDropdownDto>>
            GetDropdownAsync(
                long? branchId,
                long? academicYearId);
    }
}