using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Admission;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class AdmissionRepository : IAdmissionRepository
    {
        private readonly AppDbContext _context;

        public AdmissionRepository(AppDbContext context)
        {
            _context = context;
        }

        //---------------------------------------------------
        // Get All Admissions
        //---------------------------------------------------

        public async Task<IEnumerable<AdmissionDto>> GetAllAsync(
            AdmissionFilterDto filter)
        {
            return await _context.Database
                .SqlQuery<AdmissionDto>($@"
                    CALL sp_get_admissions(
                        {filter.Search},
                        {filter.BranchId},
                        {filter.ClassId},
                        {filter.Status},
                        {filter.PageNumber},
                        {filter.PageSize}
                    )")
                .ToListAsync();
        }

        //---------------------------------------------------
        // Get By Id
        //---------------------------------------------------

        public async Task<AdmissionDto?> GetByIdAsync(long id)
        {
            return await _context.Database
                .SqlQuery<AdmissionDto>($@"
                    CALL sp_get_admission_by_id({id})
                ")
                .FirstOrDefaultAsync();
        }

        //---------------------------------------------------
        // Create
        //---------------------------------------------------

        public async Task<long> CreateAsync(
            CreateAdmissionDto dto,
            long createdBy)
        {
            return await _context.Database
                .SqlQuery<long>($@"
                    CALL sp_create_admission(
                        {dto.StudentName},
                        {dto.Dob},
                        {dto.Gender},
                        {dto.FatherName},
                        {dto.FatherMobile},
                        {dto.BloodGroup},
                        {dto.Caste},
                        {dto.BranchId},
                        {dto.ClassId},
                        {dto.AdmissionType},
                        {createdBy}
                    )")
                .FirstAsync();
        }

        //---------------------------------------------------
        // Update
        //---------------------------------------------------
        //---------------------------------------------------
        // Update Admission
        //---------------------------------------------------

        public async Task<bool> UpdateAsync(
            long id,
            UpdateAdmissionDto dto,
            long modifiedBy)
        {
            var parameters = new object[]
            {
        id,
        dto.StudentName,
        dto.Dob == null ? (object)DBNull.Value : dto.Dob,
        dto.Gender == null ? (object)DBNull.Value : dto.Gender,
        dto.FatherName == null ? (object)DBNull.Value : dto.FatherName,
        dto.FatherMobile == null ? (object)DBNull.Value : dto.FatherMobile,
        dto.BloodGroup == null ? (object)DBNull.Value : dto.BloodGroup,
        dto.Caste == null ? (object)DBNull.Value : dto.Caste,
        dto.BranchId,
        dto.ClassId,
        dto.AdmissionType == null ? (object)DBNull.Value : dto.AdmissionType,
        modifiedBy
            };

            var result = await _context.Database.ExecuteSqlRawAsync(
                @"CALL sp_update_admission( {0}, {1},{2},{3},  {4},  {5},  {6},  {7},  {8},  {9},  {10},  {11})",parameters);

            return result > 0;
        }

        //---------------------------------------------------
        // Update Status
        //---------------------------------------------------

        public async Task<bool> UpdateStatusAsync(
            UpdateAdmissionStatusDto dto,
            long modifiedBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                @"CALL sp_manage_admission(
                    'STATUS',
                    {0},
                    {1},
                    {2})",
                dto.AdmissionId,
                dto.Status,
                modifiedBy);

            return result > 0;
        }

        //---------------------------------------------------
        // Delete
        //---------------------------------------------------

        //---------------------------------------------------
        // Delete Admission (Soft Delete)
        //---------------------------------------------------

        public async Task<bool> DeleteAsync(
            long id,
            long modifiedBy)
        {
            var result = await _context.Database.ExecuteSqlRawAsync(
                @"CALL sp_manage_admission(
            'DELETE',
            {0},
            {1},
            {2})",
                id,
                string.Empty,
                modifiedBy);

            return result > 0;
        }
    }
}