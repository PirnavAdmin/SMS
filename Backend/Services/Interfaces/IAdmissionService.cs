using SMS.Api.Dtos.Admission;

namespace SMS.Api.Services.Interfaces
{
    public interface IAdmissionService
    {
        Task<IEnumerable<AdmissionDto>> GetAllAsync(AdmissionFilterDto filter);

        Task<AdmissionDto?> GetByIdAsync(long id);

        Task<long> CreateAsync(CreateAdmissionDto dto, long userId);

        Task<bool> UpdateAsync(long id, UpdateAdmissionDto dto, long userId);

        Task<bool> UpdateStatusAsync(UpdateAdmissionStatusDto dto, long userId);

        Task<bool> DeleteAsync(long id, long userId);
    }
}