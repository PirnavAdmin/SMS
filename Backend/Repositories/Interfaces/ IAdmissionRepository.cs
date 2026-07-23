using SMS.Api.Dtos.Admission;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IAdmissionRepository
    {
        Task<IEnumerable<AdmissionDto>> GetAllAsync(AdmissionFilterDto filter);

        Task<AdmissionDto?> GetByIdAsync(long id);

        Task<long> CreateAsync(CreateAdmissionDto dto, long createdBy);

        Task<bool> UpdateAsync(long id, UpdateAdmissionDto dto, long modifiedBy);

        Task<bool> UpdateStatusAsync(UpdateAdmissionStatusDto dto, long modifiedBy);

        Task<bool> DeleteAsync(long id, long modifiedBy);
    }
}