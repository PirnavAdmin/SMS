
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Branch;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class BranchRepository : IBranchRepository
    {
        private readonly AppDbContext _context;

        public BranchRepository(AppDbContext context)
        {
            _context = context;
        }

        //------------------------------------------------------
        // Get All Branches
        //------------------------------------------------------

        public async Task<IEnumerable<BranchDto>> GetAllAsync()
        {
            return await _context.Branches
                .Where(x => !x.IsDeleted)
                .OrderBy(x => x.BranchName)
                .Select(x => new BranchDto
                {
                    BranchId = x.BranchId,
                    BranchName = x.BranchName,
                    Address = x.Address,
                    City = x.City,
                    State = x.State,
                    Pincode = x.Pincode,
                    ContactNumber = x.ContactNumber,
                    Email = x.Email,
                    Status = x.Status,
                    CreatedDate = x.CreatedDate
                })
                .ToListAsync();
        }

        //------------------------------------------------------
        // Get Branch By Id
        //------------------------------------------------------

        public async Task<BranchDto?> GetByIdAsync(long branchId)
        {
            return await _context.Branches
                .Where(x => x.BranchId == branchId && !x.IsDeleted)
                .Select(x => new BranchDto
                {
                    BranchId = x.BranchId,
                    BranchName = x.BranchName,
                    Address = x.Address,
                    City = x.City,
                    State = x.State,
                    Pincode = x.Pincode,
                    ContactNumber = x.ContactNumber,
                    Email = x.Email,
                    Status = x.Status,
                    CreatedDate = x.CreatedDate
                })
                .FirstOrDefaultAsync();
        }

        //------------------------------------------------------
        // Create Branch
        //------------------------------------------------------

        public async Task<long> CreateAsync(
     CreateBranchDto dto,
     long createdBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_manage_branch('CREATE', {0}, {1})",
                dto.BranchName,
                createdBy
            );


            return result;
        }

        //------------------------------------------------------
        // Update Branch
        //------------------------------------------------------

        public async Task<bool> UpdateAsync(
    UpdateBranchDto dto,
    long modifiedBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_manage_branch('UPDATE',{0},{1},{2})",
                dto.BranchId,
                dto.BranchName,
                modifiedBy
            );

            return result > 0;
        }

        //------------------------------------------------------
        // Delete Branch
        //------------------------------------------------------

        public async Task<bool> DeleteAsync(
     long branchId,
     long modifiedBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_manage_branch('DELETE',{0},{1})",
                branchId,
                modifiedBy
            );

            return result > 0;
        }
        //------------------------------------------------------
        // Update Status
        //------------------------------------------------------

        public async Task<bool> UpdateStatusAsync(
     long branchId,
     bool status,
     long modifiedBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_manage_branch('STATUS',{0},{1},{2})",
                branchId,
                status,
                modifiedBy
            );

            return result > 0;
        }
    }
}