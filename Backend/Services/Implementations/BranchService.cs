using SMS.Api.Dtos.Branch;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class BranchService : IBranchService
    {
        private readonly IBranchRepository _branchRepository;

        public BranchService(IBranchRepository branchRepository)
        {
            _branchRepository = branchRepository;
        }

        public async Task<IEnumerable<BranchDto>> GetAllAsync()
        {
            return await _branchRepository.GetAllAsync();
        }

        public async Task<BranchDto?> GetByIdAsync(long branchId)
        {
            return await _branchRepository.GetByIdAsync(branchId);
        }

        public async Task<long> CreateAsync(CreateBranchDto dto, long createdBy)
        {
            // Business validation can be added here
            // Example:
            // Check if branch name already exists.

            return await _branchRepository.CreateAsync(dto, createdBy);
        }

        public async Task<bool> UpdateAsync(UpdateBranchDto dto, long modifiedBy)
        {
            // Business validation can be added here

            return await _branchRepository.UpdateAsync(dto, modifiedBy);
        }

        public async Task<bool> DeleteAsync(long branchId, long modifiedBy)
        {
            return await _branchRepository.DeleteAsync(branchId, modifiedBy);
        }

        public async Task<bool> UpdateStatusAsync(long branchId, bool status, long modifiedBy)
        {
            return await _branchRepository.UpdateStatusAsync(branchId, status, modifiedBy);
        }
    }
}