namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IFeeService
{
    Task<FeeDropdownOptionsDto> GetFeeDropdownOptionsAsync();
    Task<StudentFeeDetailsResponseDto> GetStudentFeeDetailsAsync(int? studentId, string? academicYear = "2027-28");
    Task<List<PaymentReceiptDto>> GetStudentReceiptRegisterAsync(int? studentId, string? academicYear = "All Academic Years");
    Task<bool> ProcessFeePaymentAsync(ProcessFeePaymentDto dto);
}
