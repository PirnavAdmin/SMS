namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherBankService : ITeacherBankService
{
    private readonly ITeacherBankRepository _repository;

    public TeacherBankService(ITeacherBankRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<TeacherBankDto?> GetBankDetailsAsync(int staffId)
    {
        return await _repository.GetBankDetailsByStaffIdAsync(staffId);
    }

    public async Task<TeacherBankDto?> CreateBankDetailsAsync(int staffId, CreateTeacherBankDto dto)
    {
        return await _repository.CreateBankDetailsAsync(staffId, dto);
    }

    public async Task<TeacherBankDto?> UpdateBankDetailsAsync(int staffId, UpdateTeacherBankDto dto)
    {
        return await _repository.UpdateBankDetailsAsync(staffId, dto);
    }

    public async Task<bool> DeleteBankDetailsAsync(int staffId)
    {
        return await _repository.DeleteBankDetailsAsync(staffId);
    }
}
