namespace SMS.Api.Services.Implementations.FinanceManagement;

using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public class FeeCollectionService : IFeeCollectionService
{
    private readonly IFeeCollectionRepository _repository;

    public FeeCollectionService(IFeeCollectionRepository repository)
    {
        _repository = repository;
    }

    public Task<FeeCollectionStudentRosterResponseDto> GetStudentRosterAsync(
        string? search, string? className, string? sectionName, string? studentType, int page, int pageSize)
    {
        return _repository.GetStudentRosterAsync(search, className, sectionName, studentType, page, pageSize);
    }

    public Task<StudentFeeProfileResponseDto?> GetStudentFeeProfileAsync(int studentId, string? academicYear)
    {
        return _repository.GetStudentFeeProfileAsync(studentId, academicYear);
    }

    public Task<CollectFeePaymentResponseDto> CollectPaymentAsync(CollectFeePaymentRequestDto request)
    {
        return _repository.CollectPaymentAsync(request);
    }

    public Task<DueFeesSummaryResponseDto> GetDueFeesSummaryAsync(
        string? className, string? sectionName, int minDaysOverdue)
    {
        return _repository.GetDueFeesSummaryAsync(className, sectionName, minDaysOverdue);
    }

    public Task<List<PromotedDueStudentDto>> GetPromotedStudentsDuesAsync()
    {
        return _repository.GetPromotedStudentsDuesAsync();
    }

    public Task<FeeReceiptsRegisterResponseDto> GetReceiptsRegisterAsync(
        string? search, string? paymentMode, string? fromDate, string? toDate, int page, int pageSize)
    {
        return _repository.GetReceiptsRegisterAsync(search, paymentMode, fromDate, toDate, page, pageSize);
    }

    public Task<FeeReceiptDetailDto?> GetReceiptByNoAsync(string receiptNo)
    {
        return _repository.GetReceiptByNoAsync(receiptNo);
    }

    public Task<bool> CancelReceiptAsync(string receiptNo, string reason)
    {
        return _repository.CancelReceiptAsync(receiptNo, reason);
    }

    public Task<FinanceDashboardStatsDto> GetDashboardStatsAsync()
    {
        return _repository.GetDashboardStatsAsync();
    }
}