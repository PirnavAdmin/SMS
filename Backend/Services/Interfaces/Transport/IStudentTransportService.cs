namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Threading.Tasks;

public interface IStudentTransportService
{
    Task<TransportDropdownOptionsDto> GetTransportDropdownOptionsAsync();
    Task<StudentTransportResponseDto> GetStudentTransportDetailsAsync(int? studentId, string? academicYear = "2027-28");
}
