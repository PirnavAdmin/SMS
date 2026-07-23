using SMS.Api.Dtos.Branch;

namespace SMS.Api.Services.Interfaces
{
    public interface IBranchService
    {
        /// <summary>
        /// Get all branches.
        /// </summary>
        Task<IEnumerable<BranchDto>> GetAllAsync();

        /// <summary>
        /// Get branch by Id.
        /// </summary>
        Task<BranchDto?> GetByIdAsync(long branchId);

        /// <summary>
        /// Create a new branch.
        /// </summary>
        Task<long> CreateAsync(CreateBranchDto dto, long createdBy);

        /// <summary>
        /// Update an existing branch.
        /// </summary>
        Task<bool> UpdateAsync(UpdateBranchDto dto, long modifiedBy);

        /// <summary>
        /// Soft delete a branch.
        /// </summary>
        Task<bool> DeleteAsync(long branchId, long modifiedBy);

        /// <summary>
        /// Activate or deactivate a branch.
        /// </summary>
        Task<bool> UpdateStatusAsync(long branchId, bool status, long modifiedBy);
    }
}