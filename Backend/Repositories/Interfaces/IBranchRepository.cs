using SMS.Api.Dtos.Branch;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IBranchRepository
    {
        Task<IEnumerable<BranchDto>> GetAllAsync();

        Task<BranchDto?> GetByIdAsync(long branchId);

        Task<long> CreateAsync(
            CreateBranchDto dto,
            long createdBy);

        Task<bool> UpdateAsync(
            UpdateBranchDto dto,
            long modifiedBy);

        Task<bool> DeleteAsync(
            long branchId,
            long modifiedBy);

        Task<bool> UpdateStatusAsync(
            long branchId,
            bool status,
            long modifiedBy);
    }
}