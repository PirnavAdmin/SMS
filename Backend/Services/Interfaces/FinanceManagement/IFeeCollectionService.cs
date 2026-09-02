namespace SMS.Api.Services.Interfaces.FinanceManagement;

using SMS.Api.Dtos.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IFeeCollectionService
{
    Task<FeeCollectionStudentRosterResponseDto> GetStudentRosterAsync(
        string? search, string? className, string? sectionName, string? studentType, int page, int pageSize);

    Task<StudentFeeProfileResponseDto?> GetStudentFeeProfileAsync(int studentId, string? academicYear);

    Task<CollectFeePaymentResponseDto> CollectPaymentAsync(CollectFeePaymentRequestDto request);

    Task<DueFeesSummaryResponseDto> GetDueFeesSummaryAsync(
        string? className, string? sectionName, int minDaysOverdue);

    Task<List<PromotedDueStudentDto>> GetPromotedStudentsDuesAsync();

    Task<FeeReceiptsRegisterResponseDto> GetReceiptsRegisterAsync(
        string? search, string? paymentMode, string? fromDate, string? toDate, int page, int pageSize);

    Task<FeeReceiptDetailDto?> GetReceiptByNoAsync(string receiptNo);

    Task<bool> CancelReceiptAsync(string receiptNo, string reason);

    Task<FinanceDashboardStatsDto> GetDashboardStatsAsync();
}