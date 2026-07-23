using SMS.Api.Dtos.Admission;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class AdmissionService : IAdmissionService
    {
        private readonly IAdmissionRepository _repository;

        public AdmissionService(IAdmissionRepository repository)
        {
            _repository = repository;
        }

        //---------------------------------------------------
        // Get All Admissions
        //---------------------------------------------------

        public async Task<IEnumerable<AdmissionDto>> GetAllAsync(
            AdmissionFilterDto filter)
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
        // Get Admission By Id
        //---------------------------------------------------

        public async Task<AdmissionDto?> GetByIdAsync(long id)
        {
            if (id <= 0)
                throw new Exception("Invalid Admission Id");

            return await _repository.GetByIdAsync(id);
        }

        //---------------------------------------------------
        // Create Admission
        //---------------------------------------------------

        public async Task<long> CreateAsync(
            CreateAdmissionDto dto,
            long userId)
        {
            if (string.IsNullOrWhiteSpace(dto.StudentName))
                throw new Exception("Student Name is required.");

            if (dto.BranchId <= 0)
                throw new Exception("Branch is required.");

            if (dto.ClassId <= 0)
                throw new Exception("Class is required.");

            return await _repository.CreateAsync(dto, userId);
        }

        //---------------------------------------------------
        // Update Admission
        //---------------------------------------------------

        public async Task<bool> UpdateAsync(
            long id,
            UpdateAdmissionDto dto,
            long userId)
        {
            if (id <= 0)
                throw new Exception("Invalid Admission Id.");

            if (string.IsNullOrWhiteSpace(dto.StudentName))
                throw new Exception("Student Name is required.");

            return await _repository.UpdateAsync(id, dto, userId);
        }

        //---------------------------------------------------
        // Update Admission Status
        //---------------------------------------------------

        public async Task<bool> UpdateStatusAsync(
            UpdateAdmissionStatusDto dto,
            long userId)
        {
            if (dto.AdmissionId <= 0)
                throw new Exception("Invalid Admission Id");

            if (string.IsNullOrWhiteSpace(dto.Status))
                throw new Exception("Status is required");

            string[] allowedStatus =
            {
                "Pending",
                "Approved",
                "Rejected"
            };

            if (!allowedStatus.Contains(dto.Status))
                throw new Exception("Invalid Admission Status");

            return await _repository.UpdateStatusAsync(dto, userId);
        }

        //---------------------------------------------------
        // Delete Admission
        //---------------------------------------------------

        public async Task<bool> DeleteAsync(
            long id,
            long userId)
        {
            if (id <= 0)
                throw new Exception("Invalid Admission Id");

            return await _repository.DeleteAsync(id, userId);
        }
    }
}