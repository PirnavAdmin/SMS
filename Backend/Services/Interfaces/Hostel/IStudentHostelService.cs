namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Threading.Tasks;

public interface IStudentHostelService
{
    Task<HostelDropdownOptionsDto> GetHostelDropdownOptionsAsync();
    Task<StudentHostelResponseDto> GetStudentHostelDetailsAsync(int? studentId, string? academicYear = "2027-28");
}
