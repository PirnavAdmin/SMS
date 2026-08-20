namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherBankRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<TeacherBankDto?> GetBankDetailsByStaffIdAsync(int staffId);
    Task<TeacherBankDto?> CreateBankDetailsAsync(int staffId, CreateTeacherBankDto dto);
    Task<TeacherBankDto?> UpdateBankDetailsAsync(int staffId, UpdateTeacherBankDto dto);
    Task<bool> DeleteBankDetailsAsync(int staffId);
}
